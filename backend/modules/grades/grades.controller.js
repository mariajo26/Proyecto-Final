const { QueryTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const eventBroker = require('../../utils/eventBroker');

// ----------------------------------------------------------------------------
// 1. REGISTRAR ACTIVIDAD O TAREA (PROFESOR)
// ----------------------------------------------------------------------------
async function crearActividad(req, res) {
    const { 
        curso_id, 
        titulo, 
        descripcion, 
        ponderacion, 
        fecha_hora_limite, 
        tipo_actividad, 
        modalidad_entrega, 
        rubrica_id, 
        niveles_prorroga_habilitados // Array de enteros: Ej. [1, 2]
    } = req.body;

    if (!curso_id || !titulo || !ponderacion || !fecha_hora_limite || !tipo_actividad || !modalidad_entrega) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para crear la actividad.' });
    }

    try {
        const query = `
            INSERT INTO actividades 
                (curso_id, titulo, descripcion, ponderacion, fecha_hora_limite, tipo_actividad, modalidad_entrega, rubrica_id, niveles_prorroga_habilitados, visible)
            VALUES 
                (:curso_id, :titulo, :descripcion, :ponderacion, :fecha_hora_limite, :tipo_actividad, :modalidad_entrega, :rubrica_id, :niveles_prorroga_habilitados, TRUE)
        `;

        await sequelize.query(query, {
            replacements: {
                curso_id,
                titulo,
                descripcion: descripcion || null,
                ponderacion,
                fecha_hora_limite,
                tipo_actividad,
                modalidad_entrega,
                rubrica_id: rubrica_id || null,
                niveles_prorroga_habilitados: niveles_prorroga_habilitados ? JSON.stringify(niveles_prorroga_habilitados) : '[]'
            },
            type: QueryTypes.INSERT
        });

        return res.status(201).json({ message: 'Actividad academica creada con exito.' });

    } catch (error) {
        console.error('Error al crear actividad:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 2. REGISTRAR CALIFICACIÓN CON CÁLCULO DE PENALIZACIÓN AUTOMÁTICA
// ----------------------------------------------------------------------------
async function evaluarEntrega(req, res) {
    const { entrega_id, puntos_obtenidos } = req.body;
    const calificadoPor = req.user.id;

    if (!entrega_id || puntos_obtenidos === undefined) {
        return res.status(400).json({ error: 'El ID de entrega y los puntos obtenidos son obligatorios.' });
    }

    try {
        // 1. Obtener la entrega y la actividad asociada
        const queryEntrega = `
            SELECT e.*, a.ponderacion, a.fecha_hora_limite, a.niveles_prorroga_habilitados 
            FROM entregas_tareas e
            INNER JOIN actividades a ON e.actividad_id = a.id
            WHERE e.id = :entrega_id LIMIT 1
        `;
        const entRows = await sequelize.query(queryEntrega, {
            replacements: { entrega_id },
            type: QueryTypes.SELECT
        });

        if (entRows.length === 0) {
            return res.status(404).json({ error: 'La entrega no existe.' });
        }

        const entrega = entRows[0];
        let notaFinal = puntos_obtenidos;
        let penalizacionPorcentaje = 0;
        let nuevoEstado = 'Calificada';

        // 2. Evaluar reglas de prórroga y estados
        if (entrega.estado === 'Caso Especial') {
            // Caso especial manual: calificar sobre el porcentaje límite guardado
            const porcMax = entrega.porcentaje_entrega_personalizado || 100;
            notaFinal = puntos_obtenidos * (porcMax / 100);
            penalizacionPorcentaje = 100 - porcMax;
            nuevoEstado = 'Calificada';
        } else if (entrega.estado === 'Justificada por Ausencia') {
            // Evaluamos contra la fecha límite extendida
            const fechaEntrega = new Date(entrega.fecha_hora_entrega);
            const fechaLimiteExtendida = new Date(entrega.nueva_fecha_limite);

            if (fechaEntrega <= fechaLimiteExtendida) {
                notaFinal = puntos_obtenidos;
                penalizacionPorcentaje = 0;
            } else {
                // Si aún con justificación entrega tarde del plazo extendido -> Intolerable (10%)
                notaFinal = entrega.ponderacion * 0.10;
                penalizacionPorcentaje = 90;
                nuevoEstado = 'Intolerable';
            }
        } else {
            // Caso estándar: validar contra fecha límite original
            const fechaEntrega = entrega.fecha_hora_entrega ? new Date(entrega.fecha_hora_entrega) : new Date();
            const fechaLimiteOriginal = new Date(entrega.fecha_hora_limite);

            if (fechaEntrega > fechaLimiteOriginal) {
                // Cálculo de días de retraso
                const diffMs = fechaEntrega - fechaLimiteOriginal;
                const diasRetraso = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

                // Obtener configuraciones del sistema desde MySQL
                const configs = await sequelize.query(
                    'SELECT clave, valor FROM configuraciones_sistema WHERE clave LIKE "prorroga_nivel_%"',
                    { type: QueryTypes.SELECT }
                );

                const configMap = {};
                configs.forEach(c => { configMap[c.clave] = c.valor; });

                const nivelesHabilitados = JSON.parse(entrega.niveles_prorroga_habilitados || '[]');
                let aplicarIntolerable = true;

                // Validar niveles habilitados por el profesor en orden (Nivel 1, Nivel 2, Nivel 3)
                for (let n = 1; n <= 3; n++) {
                    if (nivelesHabilitados.includes(n)) {
                        const maxDias = parseInt(configMap[`prorroga_nivel_${n}_dias`], 10);
                        const porcentajeNota = parseFloat(configMap[`prorroga_nivel_${n}_penalizacion`]);

                        if (diasRetraso <= maxDias) {
                            penalizacionPorcentaje = 100 - porcentajeNota;
                            notaFinal = puntos_obtenidos * (porcentajeNota / 100);
                            nuevoEstado = 'Entregada con Retraso';
                            aplicarIntolerable = false;
                            break;
                        }
                    }
                }

                if (aplicarIntolerable) {
                    // Estado intolerable: 10% de la ponderación máxima de la tarea
                    notaFinal = entrega.ponderacion * 0.10;
                    penalizacionPorcentaje = 90;
                    nuevoEstado = 'Intolerable';
                }
            }
        }

        // 3. Guardar la calificación calculada
        const updateQuery = `
            UPDATE entregas_tareas 
            SET nota_obtenida = :notaFinal, 
                penalizacion_aplicada = :penalizacionPorcentaje, 
                estado = :nuevoEstado,
                calificado_por = :calificadoPor,
                fecha_calificacion = NOW()
            WHERE id = :entrega_id
        `;

        await sequelize.query(updateQuery, {
            replacements: { notaFinal, penalizacionPorcentaje, nuevoEstado, calificadoPor, entrega_id },
            type: QueryTypes.UPDATE
        });

        return res.status(200).json({ 
            message: 'Calificacion guardada.', 
            nota_obtenida: notaFinal, 
            penalizacion_aplicada: penalizacionPorcentaje,
            estado: nuevoEstado
        });

    } catch (error) {
        console.error('Error al evaluar entrega:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 3. REGISTRAR EXCEPCIÓN MANUAL (CASO ESPECIAL POR EL PROFESOR)
// ----------------------------------------------------------------------------
async function registrarExcepcion(req, res) {
    const { entrega_id, justificacion_maestro, porcentaje_entrega_personalizado, nueva_fecha_limite } = req.body;

    if (!entrega_id || !justificacion_maestro || !porcentaje_entrega_personalizado || !nueva_fecha_limite) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para registrar la excepcion manual.' });
    }

    try {
        const query = `
            UPDATE entregas_tareas 
            SET estado = 'Caso Especial',
                justificacion_maestro = :justificacion_maestro,
                porcentaje_entrega_personalizado = :porcentaje_entrega_personalizado,
                nueva_fecha_limite = :nueva_fecha_limite
            WHERE id = :entrega_id
        `;

        await sequelize.query(query, {
            replacements: { justificacion_maestro, porcentaje_entrega_personalizado, nueva_fecha_limite, entrega_id },
            type: QueryTypes.UPDATE
        });

        return res.status(200).json({ message: 'Excepcion manual registrada con exito en la entrega.' });

    } catch (error) {
        console.error('Error al registrar excepcion:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 4. SUSCRIPTOR DE EVENTO: JUSTIFICACIÓN DE INASISTENCIA APROBADA
// Sincroniza las tareas del alumno que coincidieron con su falta.
// ----------------------------------------------------------------------------
eventBroker.on('attendance.justificacionAprobada', async ({ estudiante_id, fecha_falta }) => {
    try {
        console.log(`Procesando justificacion aprobada para estudiante ${estudiante_id} en fecha ${fecha_falta}...`);

        // 1. Obtener todas las actividades del estudiante que vencían ese día
        const queryActividades = `
            SELECT a.id, a.fecha_hora_limite 
            FROM actividades a
            INNER JOIN cursos c ON a.curso_id = c.id
            INNER JOIN estudiantes_secciones es ON c.seccion_id = es.seccion_id
            WHERE es.estudiante_id = :estudiante_id 
              AND DATE(a.fecha_hora_limite) = :fecha_falta
        `;

        const actividades = await sequelize.query(queryActividades, {
            replacements: { estudiante_id, fecha_falta },
            type: QueryTypes.SELECT
        });

        // 2. Para cada actividad, registrar o actualizar la entrega en estado 'Justificada por Ausencia'
        // con una nueva fecha límite de 2 días a partir de hoy (prórroga por defecto)
        const nuevaFechaProrroga = new Date();
        nuevaFechaProrroga.setDate(nuevaFechaProrroga.getDate() + 2); // 48 horas para nivelar

        for (const act of actividades) {
            const queryUpsertEntrega = `
                INSERT INTO entregas_tareas 
                    (actividad_id, estudiante_id, estado, nueva_fecha_limite, penalizacion_aplicada)
                VALUES 
                    (:actividad_id, :estudiante_id, 'Justificada por Ausencia', :nuevaFechaProrroga, 0)
                ON DUPLICATE KEY UPDATE 
                    estado = 'Justificada por Ausencia',
                    nueva_fecha_limite = :nuevaFechaProrroga,
                    penalizacion_aplicada = 0
            `;

            await sequelize.query(queryUpsertEntrega, {
                replacements: { actividad_id: act.id, estudiante_id, nuevaFechaProrroga },
                type: QueryTypes.INSERT
            });
        }

        console.log(`Sincronizacion de tareas completada para el alumno ${estudiante_id}.`);

    } catch (error) {
        console.error('Error al sincronizar tareas tras justificacion aprobada:', error);
    }
});

async function obtenerEstudiantesTutor(req, res) {
    const encargado_id = req.user.id;

    try {
        const query = `
            SELECT u.id, u.nombre_completo, u.codigo_ua, ee.parentesco
            FROM usuarios u
            INNER JOIN estudiantes_encargados ee ON u.id = ee.estudiante_id
            WHERE ee.encargado_id = :encargado_id AND u.estado = 'Activo'
        `;

        const estudiantes = await sequelize.query(query, {
            replacements: { encargado_id },
            type: QueryTypes.SELECT
        });

        return res.status(200).json(estudiantes);
    } catch (error) {
        console.error('Error al obtener estudiantes del tutor:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

async function obtenerRendimientoEstudiante(req, res) {
    const encargado_id = req.user.id;
    const { estudiante_id } = req.params;

    try {
        // 1. Validar vinculación entre el encargado y el estudiante
        const queryVinculacion = `
            SELECT 1 
            FROM estudiantes_encargados 
            WHERE encargado_id = :encargado_id AND estudiante_id = :estudiante_id
            LIMIT 1
        `;

        const vincRows = await sequelize.query(queryVinculacion, {
            replacements: { encargado_id, estudiante_id },
            type: QueryTypes.SELECT
        });

        if (vincRows.length === 0) {
            return res.status(403).json({ error: 'No autorizado. El estudiante no está vinculado a este tutor.' });
        }

        // 2. Obtener datos básicos del estudiante y su sección/grado
        const queryEstudiante = `
            SELECT u.id, u.nombre_completo, u.codigo_ua, s.id AS seccion_id, s.nombre AS seccion_nombre, g.nombre AS grado_nombre, es.ciclo_escolar
            FROM usuarios u
            LEFT JOIN estudiantes_secciones es ON u.id = es.estudiante_id
            LEFT JOIN secciones s ON es.seccion_id = s.id
            LEFT JOIN grados g ON s.grado_id = g.id
            WHERE u.id = :estudiante_id LIMIT 1
        `;

        const estRows = await sequelize.query(queryEstudiante, {
            replacements: { estudiante_id },
            type: QueryTypes.SELECT
        });

        if (estRows.length === 0) {
            return res.status(404).json({ error: 'Estudiante no encontrado.' });
        }

        const estudiante = estRows[0];

        // Si no tiene sección asignada, retornamos datos vacíos
        if (!estudiante.seccion_id) {
            return res.status(200).json({
                estudiante: {
                    id: estudiante.id,
                    nombre_completo: estudiante.nombre_completo,
                    codigo_ua: estudiante.codigo_ua,
                    grado: 'No asignado',
                    seccion: 'No asignada',
                    ciclo_escolar: null
                },
                promedioGeneral: 0,
                configuracionesProrrogas: {},
                cursos: []
            });
        }

        // 3. Obtener configuraciones de prórrogas del sistema
        const queryConfigs = `
            SELECT clave, valor FROM configuraciones_sistema 
            WHERE clave LIKE 'prorroga_nivel_%' OR clave = 'hora_limite_justificacion_digital'
        `;
        const configs = await sequelize.query(queryConfigs, { type: QueryTypes.SELECT });
        const configMap = {};
        configs.forEach(c => { configMap[c.clave] = c.valor; });

        const configuracionesProrrogas = {
            nivel1: { dias: parseInt(configMap['prorroga_nivel_1_dias'] || 1, 10), notaMax: parseInt(configMap['prorroga_nivel_1_penalizacion'] || 75, 10) },
            nivel2: { dias: parseInt(configMap['prorroga_nivel_2_dias'] || 3, 10), notaMax: parseInt(configMap['prorroga_nivel_2_penalizacion'] || 50, 10) },
            nivel3: { dias: parseInt(configMap['prorroga_nivel_3_dias'] || 5, 10), notaMax: parseInt(configMap['prorroga_nivel_3_penalizacion'] || 25, 10) },
            intolerable: { notaFija: 10 }
        };

        // 4. Obtener todos los cursos de la sección del estudiante
        const queryCursos = `
            SELECT c.id AS curso_id, m.nombre AS materia_nombre, c.salon, u.nombre_completo AS profesor_nombre, c.color_hex
            FROM cursos c
            INNER JOIN materias m ON c.materia_id = m.id
            INNER JOIN usuarios u ON c.profesor_id = u.id
            WHERE c.seccion_id = :seccion_id AND c.ciclo_escolar = :ciclo_escolar
        `;

        const cursos = await sequelize.query(queryCursos, {
            replacements: { seccion_id: estudiante.seccion_id, ciclo_escolar: estudiante.ciclo_escolar },
            type: QueryTypes.SELECT
        });

        if (cursos.length === 0) {
            return res.status(200).json({
                estudiante: {
                    id: estudiante.id,
                    nombre_completo: estudiante.nombre_completo,
                    codigo_ua: estudiante.codigo_ua,
                    grado: estudiante.grado_nombre,
                    seccion: estudiante.seccion_nombre,
                    ciclo_escolar: estudiante.ciclo_escolar
                },
                promedioGeneral: 0,
                configuracionesProrrogas,
                cursos: []
            });
        }

        const cursoIds = cursos.map(c => c.curso_id);

        // 5. Obtener todas las actividades y entregas del estudiante en esos cursos
        const queryActividades = `
            SELECT 
                a.id AS actividad_id, 
                a.curso_id,
                a.titulo, 
                a.descripcion, 
                a.ponderacion, 
                a.fecha_hora_limite, 
                a.tipo_actividad, 
                a.modalidad_entrega, 
                a.recursos_adjuntos_url,
                a.visible,
                a.fecha_publicacion,
                a.niveles_prorroga_habilitados,
                e.id AS entrega_id,
                e.archivo_adjunto_url,
                e.fecha_hora_entrega,
                e.estado AS entrega_estado,
                e.nota_obtenida,
                e.penalizacion_aplicada,
                e.justificacion_maestro,
                e.porcentaje_entrega_personalizado,
                e.nueva_fecha_limite,
                e.fecha_calificacion
            FROM actividades a
            LEFT JOIN entregas_tareas e ON a.id = e.actividad_id AND e.estudiante_id = :estudiante_id
            WHERE a.curso_id IN (:cursoIds)
        `;

        const actividadesRaw = await sequelize.query(queryActividades, {
            replacements: { estudiante_id, cursoIds },
            type: QueryTypes.SELECT
        });

        // 6. Agrupar las actividades por curso y calcular los promedios
        const cursosConDatos = cursos.map(curso => {
            const actividadesDelCurso = actividadesRaw
                .filter(act => act.curso_id === curso.curso_id)
                .map(act => {
                    let nivelesHabilitados = [];
                    try {
                        nivelesHabilitados = typeof act.niveles_prorroga_habilitados === 'string' 
                            ? JSON.parse(act.niveles_prorroga_habilitados) 
                            : (act.niveles_prorroga_habilitados || []);
                    } catch (e) {
                        nivelesHabilitados = [];
                    }

                    return {
                        id: act.actividad_id,
                        titulo: act.titulo,
                        descripcion: act.descripcion,
                        ponderacion: parseFloat(act.ponderacion),
                        fecha_hora_limite: act.fecha_hora_limite,
                        tipo_actividad: act.tipo_actividad,
                        modalidad_entrega: act.modalidad_entrega,
                        recursos_adjuntos_url: act.recursos_adjuntos_url,
                        visible: act.visible === 1 || act.visible === true || act.visible === '1',
                        fecha_publicacion: act.fecha_publicacion,
                        niveles_prorroga_habilitados: nivelesHabilitados,
                        entrega: act.entrega_id ? {
                            id: act.entrega_id,
                            archivo_adjunto_url: act.archivo_adjunto_url,
                            fecha_hora_entrega: act.fecha_hora_entrega,
                            estado: act.entrega_estado,
                            nota_obtenida: act.nota_obtenida !== null ? parseFloat(act.nota_obtenida) : null,
                            penalizacion_aplicada: parseFloat(act.penalizacion_aplicada || 0),
                            justificacion_maestro: act.justificacion_maestro,
                            porcentaje_entrega_personalizado: act.porcentaje_entrega_personalizado !== null ? parseFloat(act.porcentaje_entrega_personalizado) : null,
                            nueva_fecha_limite: act.nueva_fecha_limite,
                            fecha_calificacion: act.fecha_calificacion
                        } : null
                    };
                });

            // Lógica de promedio por curso:
            // Obtenemos las actividades calificadas (estado 'Calificada', 'Caso Especial', 'Entregada con Retraso' o 'Intolerable')
            // Sumamos las notas obtenidas y dividimos por la ponderación de las actividades evaluadas
            let sumObtenida = 0;
            let sumPonderacionCalificadas = 0;
            
            actividadesDelCurso.forEach(act => {
                if (act.entrega && act.entrega.nota_obtenida !== null) {
                    sumObtenida += act.entrega.nota_obtenida;
                    sumPonderacionCalificadas += act.ponderacion;
                }
            });

            const promedioActual = sumPonderacionCalificadas > 0 
                ? Math.round((sumObtenida / sumPonderacionCalificadas) * 100 * 10) / 10 
                : 0;

            return {
                id: curso.curso_id,
                materia: curso.materia_nombre,
                profesor: curso.profesor_nombre,
                salon: curso.salon,
                color: curso.color_hex || '#3B82F6',
                promedioActual,
                actividades: actividadesDelCurso
            };
        });

        // Promedio general del estudiante: promedio simple de los promedios de los cursos
        const cursosConPromedio = cursosConDatos.filter(c => c.actividades.some(act => act.entrega && act.entrega.nota_obtenida !== null));
        const promedioGeneral = cursosConPromedio.length > 0
            ? Math.round((cursosConPromedio.reduce((acc, c) => acc + c.promedioActual, 0) / cursosConPromedio.length) * 10) / 10
            : 0;

        return res.status(200).json({
            estudiante: {
                id: estudiante.id,
                nombre_completo: estudiante.nombre_completo,
                codigo_ua: estudiante.codigo_ua,
                grado: estudiante.grado_nombre,
                seccion: estudiante.seccion_nombre,
                ciclo_escolar: estudiante.ciclo_escolar
            },
            promedioGeneral,
            configuracionesProrrogas,
            cursos: cursosConDatos
        });

    } catch (error) {
        console.error('Error al obtener rendimiento del estudiante:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

async function eliminarActividad(req, res) {
    const { id } = req.params;
    try {
        await sequelize.query('DELETE FROM entregas_tareas WHERE actividad_id = :id', {
            replacements: { id },
            type: QueryTypes.DELETE
        });
        await sequelize.query('DELETE FROM actividades WHERE id = :id', {
            replacements: { id },
            type: QueryTypes.DELETE
        });
        return res.status(200).json({ message: 'Actividad eliminada con éxito.' });
    } catch (error) {
        console.error('Error al eliminar actividad:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

module.exports = {
    crearActividad,
    evaluarEntrega,
    registrarExcepcion,
    obtenerEstudiantesTutor,
    obtenerRendimientoEstudiante,
    eliminarActividad
};
