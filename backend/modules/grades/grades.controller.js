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

module.exports = {
    crearActividad,
    evaluarEntrega,
    registrarExcepcion
};
