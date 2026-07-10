// ============================================================================
// MÓDULO: CONTROL ACADÉMICO / SECRETARÍA
// Rutas de administración y soporte institucional
// ============================================================================

const { QueryTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const { Circular, Foro, HiloDiscusion, Comentario } = require('../../database/mongoose_schemas');
const eventBroker = require('../../utils/eventBroker');

// ----------------------------------------------------------------------------
// 1. GESTIÓN DE ALUMNOS Y FAMILIAS
// ----------------------------------------------------------------------------

// Listado General de Alumnos con Grado y Sección
async function obtenerAlumnos(req, res) {
    try {
        const query = `
            SELECT 
                u.id, 
                u.codigo_ua, 
                u.nombre_completo, 
                u.correo_recuperacion, 
                u.telefono_personal, 
                g.nombre AS grado, 
                s.nombre AS seccion,
                es.ciclo_escolar
            FROM usuarios u
            INNER JOIN estudiantes_secciones es ON u.id = es.estudiante_id
            INNER JOIN secciones s ON es.seccion_id = s.id
            INNER JOIN grados g ON s.grado_id = g.id
            WHERE u.rol = 'Estudiante' AND u.estado = 'Activo'
            ORDER BY g.nombre, s.nombre, u.nombre_completo
        `;
        const alumnos = await sequelize.query(query, { type: QueryTypes.SELECT });
        return res.status(200).json(alumnos);
    } catch (error) {
        console.error('Error al obtener alumnos:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// Obtener Perfil del Estudiante con Ficha Médica y Familia Vinculada
async function obtenerPerfilEstudiante(req, res) {
    const { id } = req.params;

    try {
        // 1. Datos básicos
        const userQuery = `
            SELECT u.id, u.codigo_ua, u.nombre_completo, u.correo_recuperacion, u.telefono_personal, u.telefono_emergencia
            FROM usuarios u WHERE u.id = :id AND u.rol = 'Estudiante' LIMIT 1
        `;
        const [estudiante] = await sequelize.query(userQuery, { replacements: { id }, type: QueryTypes.SELECT });
        if (!estudiante) return res.status(404).json({ error: 'Estudiante no encontrado.' });

        // 2. Ficha Médica
        const medQuery = 'SELECT * FROM fichas_medicas WHERE usuario_id = :id LIMIT 1';
        const [fichaMedica] = await sequelize.query(medQuery, { replacements: { id }, type: QueryTypes.SELECT });

        // 3. Familiares / Encargados vinculados
        const encQuery = `
            SELECT 
                u.id, 
                u.codigo_ua, 
                u.nombre_completo, 
                u.correo_recuperacion, 
                u.telefono_personal,
                ee.parentesco,
                -- Simulación de toggles de privacidad guardados en una configuración ficticia
                -- Si no existe, por defecto permitimos ver todo (1)
                COALESCE((SELECT valor FROM configuraciones_sistema WHERE clave = CONCAT('privacidad_', :id, '_', u.id)), '{"ver_direccion":true,"ver_telefono":true,"ver_notas":true}') AS privacidad
            FROM usuarios u
            INNER JOIN estudiantes_encargados ee ON u.id = ee.encargado_id
            WHERE ee.estudiante_id = :id
        `;
        const encargados = await sequelize.query(encQuery, { replacements: { id }, type: QueryTypes.SELECT });

        // Formatear privacidad de JSON string a objeto
        const encargadosFormateados = encargados.map(e => ({
            ...e,
            privacidad: JSON.parse(e.privacidad)
        }));

        return res.status(200).json({
            estudiante,
            ficha_medica: fichaMedica || null,
            encargados: encargadosFormateados
        });
    } catch (error) {
        console.error('Error al obtener perfil del estudiante:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// Configurar Toggles de Privacidad de un Encargado sobre un Estudiante
async function actualizarPrivacidadEncargado(req, res) {
    const { estudiante_id, tutor_id } = req.params;
    const { ver_direccion, ver_telefono, ver_notas } = req.body;

    const claveConfig = `privacidad_${estudiante_id}_${tutor_id}`;
    const valorConfig = JSON.stringify({ ver_direccion, ver_telefono, ver_notas });

    try {
        // Guardar la regla de privacidad en configuraciones_sistema
        await sequelize.query(`
            INSERT INTO configuraciones_sistema (clave, valor, descripcion)
            VALUES (:claveConfig, :valorConfig, 'Regla de privacidad del encargado')
            ON DUPLICATE KEY UPDATE valor = :valorConfig
        `, {
            replacements: { claveConfig, valorConfig },
            type: QueryTypes.INSERT
        });

        return res.status(200).json({ message: 'Privacidad actualizada exitosamente.', privacidad: { ver_direccion, ver_telefono, ver_notas } });
    } catch (error) {
        console.error('Error al actualizar privacidad:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// Obtener Perfil Específico del Tutor / Encargado
async function obtenerPerfilTutor(req, res) {
    const { id } = req.params;

    try {
        const query = `
            SELECT id, codigo_ua, nombre_completo, correo_recuperacion, telefono_personal, telefono_emergencia, creado_en
            FROM usuarios WHERE id = :id AND rol = 'Encargado' LIMIT 1
        `;
        const [tutor] = await sequelize.query(query, { replacements: { id }, type: QueryTypes.SELECT });
        if (!tutor) return res.status(404).json({ error: 'Tutor no encontrado.' });

        // Obtener hijos asociados
        const hijosQuery = `
            SELECT u.id, u.codigo_ua, u.nombre_completo, ee.parentesco
            FROM usuarios u
            INNER JOIN estudiantes_encargados ee ON u.id = ee.estudiante_id
            WHERE ee.encargado_id = :id
        `;
        const hijos = await sequelize.query(hijosQuery, { replacements: { id }, type: QueryTypes.SELECT });

        return res.status(200).json({ tutor, hijos });
    } catch (error) {
        console.error('Error al obtener perfil de tutor:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 2. PERSONAL Y HORARIOS (Profesores)
// ----------------------------------------------------------------------------

// Listado General de Profesores
async function obtenerProfesores(req, res) {
    try {
        const query = `
            SELECT u.id, u.codigo_ua, u.nombre_completo, u.correo_recuperacion, u.telefono_personal
            FROM usuarios u
            WHERE u.rol = 'Profesor' AND u.estado = 'Activo'
            ORDER BY u.nombre_completo
        `;
        const profesores = await sequelize.query(query, { type: QueryTypes.SELECT });
        return res.status(200).json(profesores);
    } catch (error) {
        console.error('Error al obtener profesores:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// Obtener Hoja de Vida y Horario Semanal Matriz de un Profesor
async function obtenerHorarioProfesor(req, res) {
    const { id } = req.params;

    try {
        const profQuery = `
            SELECT id, codigo_ua, nombre_completo, correo_recuperacion, telefono_personal
            FROM usuarios WHERE id = :id AND rol = 'Profesor' LIMIT 1
        `;
        const [profesor] = await sequelize.query(profQuery, { replacements: { id }, type: QueryTypes.SELECT });
        if (!profesor) return res.status(404).json({ error: 'Docente no encontrado.' });

        // Carga de ficha laboral
        const labQuery = 'SELECT * FROM fichas_laborales WHERE usuario_id = :id LIMIT 1';
        const [fichaLaboral] = await sequelize.query(labQuery, { replacements: { id }, type: QueryTypes.SELECT });

        // Clases asignadas con horario
        const clasesQuery = `
            SELECT 
                hc.dia_semana, 
                hc.hora_inicio, 
                hc.hora_fin, 
                m.nombre AS materia, 
                c.salon, 
                g.nombre AS grado, 
                s.nombre AS seccion
            FROM horarios_clases hc
            INNER JOIN cursos c ON hc.curso_id = c.id
            INNER JOIN materias m ON c.materia_id = m.id
            INNER JOIN secciones s ON c.seccion_id = s.id
            INNER JOIN grados g ON s.grado_id = g.id
            WHERE c.profesor_id = :id
        `;
        const clases = await sequelize.query(clasesQuery, { replacements: { id }, type: QueryTypes.SELECT });

        // Horarios de atención asignados
        const atencionQuery = `
            SELECT dia_semana, hora_inicio, hora_fin
            FROM horarios_atencion_profesores
            WHERE profesor_id = :id
        `;
        const atencion = await sequelize.query(atencionQuery, { replacements: { id }, type: QueryTypes.SELECT });

        return res.status(200).json({
            profesor,
            ficha_laboral: fichaLaboral || null,
            clases,
            horarios_atencion: atencion
        });
    } catch (error) {
        console.error('Error al obtener horarios del profesor:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 3. CONTROL DE ASISTENCIA DIARIA
// ----------------------------------------------------------------------------

// Obtener reporte diario auditable de asistencia por Grado/Sección
async function obtenerAsistenciaDiaria(req, res) {
    const { seccion_id, fecha } = req.query; // Seccion ID y fecha YYYY-MM-DD

    if (!seccion_id || !fecha) {
        return res.status(400).json({ error: 'seccion_id y fecha son obligatorios.' });
    }

    try {
        const query = `
            SELECT 
                u.id AS estudiante_id,
                u.codigo_ua,
                u.nombre_completo,
                ag.estado,
                ag.justificada,
                ag.observaciones,
                ag.id AS asistencia_id
            FROM usuarios u
            INNER JOIN estudiantes_secciones es ON u.id = es.estudiante_id
            LEFT JOIN asistencias_generales ag ON u.id = ag.estudiante_id AND ag.fecha = :fecha
            WHERE es.seccion_id = :seccion_id AND u.rol = 'Estudiante'
            ORDER BY u.nombre_completo
        `;
        const asistencia = await sequelize.query(query, { replacements: { seccion_id, fecha }, type: QueryTypes.SELECT });
        return res.status(200).json(asistencia);
    } catch (error) {
        console.error('Error al obtener asistencia diaria:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// Confirmar asistencia y enviar correo electrónico simulado de falta
async function notificarFaltas(req, res) {
    const { inasistencias } = req.body; // Array de { estudiante_id, fecha }
    const secretariaId = req.user.id;

    if (!Array.isArray(inasistencias) || inasistencias.length === 0) {
        return res.status(400).json({ error: 'Debe proveer una lista de inasistencias.' });
    }

    try {
        let correosEnviados = [];

        for (const falta of inasistencias) {
            // 1. Obtener correo del tutor y datos del alumno
            const queryData = `
                SELECT 
                    est.nombre_completo AS estudiante_nombre,
                    est.codigo_ua AS estudiante_ua,
                    tut.correo_recuperacion AS tutor_correo,
                    tut.nombre_completo AS tutor_nombre
                FROM usuarios est
                INNER JOIN estudiantes_encargados ee ON est.id = ee.estudiante_id
                INNER JOIN usuarios tut ON ee.encargado_id = tut.id
                WHERE est.id = :estudiante_id LIMIT 1
            `;
            const [info] = await sequelize.query(queryData, {
                replacements: { estudiante_id: falta.estudiante_id },
                type: QueryTypes.SELECT
            });

            if (info) {
                // Simulación de envío de correo en logs
                console.log(`[EMAIL AUTOMÁTICO] Enviado a: ${info.tutor_correo}`);
                console.log(`Asunto: ALERTA DE INASISTENCIA — ${info.estudiante_nombre}`);
                console.log(`Cuerpo: Estimado/a ${info.tutor_nombre}, le notificamos que su hijo/a ${info.estudiante_nombre} (${info.estudiante_ua}) no se presentó a clases el día ${falta.fecha}. Se adjunta en PDF el itinerario de puesta al día generado por el profesor guía.`);
                
                correosEnviados.push({
                    estudiante: info.estudiante_nombre,
                    tutor: info.tutor_correo,
                    estado: 'Simulado/Enviado'
                });
            }
        }

        return res.status(200).json({
            message: `Notificaciones de faltas procesadas. Se notificaron ${correosEnviados.length} padres.`,
            detalles: correosEnviados
        });

    } catch (error) {
        console.error('Error al notificar faltas:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 4. ATENCIÓN DE INCIDENTES (Buzón, Escalados y Citas)
// ----------------------------------------------------------------------------

// Listar todas las quejas, reclamos y casos escalados del colegio
async function obtenerIncidentesControl(req, res) {
    try {
        const query = `
            SELECT 
                qi.id,
                qi.titulo,
                qi.descripcion,
                qi.estado,
                qi.tipo,
                qi.creado_en,
                qi.actualizado_en,
                qi.resolucion_texto,
                u_creador.nombre_completo AS tutor_nombre,
                u_creador.codigo_ua AS tutor_ua,
                u_est.nombre_completo AS estudiante_nombre,
                u_dest.nombre_completo AS destinatario_nombre,
                qi.destinatario_id
            FROM quejas_incidentes qi
            INNER JOIN usuarios u_creador ON qi.creador_id = u_creador.id
            LEFT JOIN usuarios u_est ON qi.estudiante_id = u_est.id
            INNER JOIN usuarios u_dest ON qi.destinatario_id = u_dest.id
            ORDER BY qi.actualizado_en DESC
        `;
        const casos = await sequelize.query(query, { type: QueryTypes.SELECT });
        return res.status(200).json(casos);
    } catch (error) {
        console.error('Error al obtener incidentes para control:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// Registrar queja o incidente de forma presencial (Ventanilla física)
async function registrarIncidentePresencial(req, res) {
    const creadorId = req.user.id; // Secretaria autenticada
    const { estudiante_id, destinatario_id, titulo, descripcion, tipo } = req.body;

    if (!titulo || !descripcion || !tipo || !destinatario_id) {
        return res.status(400).json({ error: 'Faltan campos requeridos.' });
    }

    try {
        const [result] = await sequelize.query(`
            INSERT INTO quejas_incidentes
                (creador_id, estudiante_id, destinatario_id, titulo, descripcion, tipo, estado)
            VALUES
                (:creadorId, :estudiante_id, :destinatario_id, :titulo, :descripcion, :tipo, 'En Revision')
        `, {
            replacements: { creadorId, estudiante_id: estudiante_id || null, destinatario_id, titulo, descripcion, tipo },
            type: QueryTypes.INSERT
        });

        return res.status(201).json({ message: 'Incidente presencial registrado exitosamente.', id: result });
    } catch (error) {
        console.error('Error al registrar incidente presencial:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// Resolver un caso (FSM: En Revision / Enviado ➔ Resuelto)
async function resolverCasoControl(req, res) {
    const { id } = req.params;
    const { resolucion_texto } = req.body;

    if (!resolucion_texto) {
        return res.status(400).json({ error: 'Debe ingresar el texto de resolucion.' });
    }

    try {
        await sequelize.query(`
            UPDATE quejas_incidentes
            SET estado = 'Resuelto', resolucion_texto = :resolucion_texto
            WHERE id = :id
        `, {
            replacements: { id, resolucion_texto },
            type: QueryTypes.UPDATE
        });

        // Notificar al padre mediante el eventBroker
        const [caso] = await sequelize.query(
            'SELECT creador_id, titulo FROM quejas_incidentes WHERE id = :id',
            { replacements: { id }, type: QueryTypes.SELECT }
        );

        if (caso) {
            const [padre] = await sequelize.query('SELECT codigo_ua FROM usuarios WHERE id = :id', {
                replacements: { id: caso.creador_id },
                type: QueryTypes.SELECT
            });

            if (padre) {
                eventBroker.emit('notification.create', {
                    usuario_id: padre.codigo_ua,
                    tipo: 'General',
                    titulo: 'Caso Resuelto',
                    mensaje: `Su reporte titulado "${caso.titulo}" ha sido resuelto por la administracion.`,
                    modulo_origen: 'Quejas'
                });
            }
        }

        return res.status(200).json({ message: 'Caso marcado como resuelto exitosamente.' });
    } catch (error) {
        console.error('Error al resolver caso:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// Listar todas las solicitudes de citas
async function obtenerCitasControl(req, res) {
    try {
        const query = `
            SELECT 
                cp.id,
                cp.fecha_hora,
                cp.motivo,
                cp.estado,
                cp.es_prioritaria,
                cp.observaciones,
                u_sol.nombre_completo AS solicitante_nombre,
                u_sol.rol AS solicitante_rol,
                u_dest.nombre_completo AS destinatario_nombre,
                u_est.nombre_completo AS estudiante_nombre
            FROM citas_presenciales cp
            INNER JOIN usuarios u_sol ON cp.solicitante_id = u_sol.id
            INNER JOIN usuarios u_dest ON cp.destinatario_id = u_dest.id
            INNER JOIN usuarios u_est ON cp.estudiante_id = u_est.id
            ORDER BY cp.fecha_hora ASC
        `;
        const citas = await sequelize.query(query, { type: QueryTypes.SELECT });
        return res.status(200).json(citas);
    } catch (error) {
        console.error('Error al obtener citas para control:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// Aprobar, rechazar o cancelar cita
async function actualizarCitaControl(req, res) {
    const { id } = req.params;
    const { estado, observaciones } = req.body;

    if (!['Aprobada', 'Rechazada', 'Cancelada', 'Completada'].includes(estado)) {
        return res.status(400).json({ error: 'Estado de cita no valido.' });
    }

    try {
        await sequelize.query(`
            UPDATE citas_presenciales
            SET estado = :estado, observaciones = :observaciones
            WHERE id = :id
        `, {
            replacements: { id, estado, observaciones: observaciones || null },
            type: QueryTypes.UPDATE
        });

        // Notificar a los involucrados
        const [cita] = await sequelize.query('SELECT solicitante_id, destinatario_id, fecha_hora FROM citas_presenciales WHERE id = :id', {
            replacements: { id },
            type: QueryTypes.SELECT
        });

        if (cita) {
            const [sol] = await sequelize.query('SELECT codigo_ua FROM usuarios WHERE id = :id', { replacements: { id: cita.solicitante_id }, type: QueryTypes.SELECT });
            const [dest] = await sequelize.query('SELECT codigo_ua FROM usuarios WHERE id = :id', { replacements: { id: cita.destinatario_id }, type: QueryTypes.SELECT });

            const msg = `La cita agendada para el ${new Date(cita.fecha_hora).toLocaleString()} cambio su estado a: ${estado}.`;

            if (sol) {
                eventBroker.emit('notification.create', { usuario_id: sol.codigo_ua, tipo: 'General', titulo: 'Cita Actualizada', mensaje: msg, modulo_origen: 'Citas' });
            }
            if (dest) {
                eventBroker.emit('notification.create', { usuario_id: dest.codigo_ua, tipo: 'General', titulo: 'Cita Actualizada', mensaje: msg, modulo_origen: 'Citas' });
            }
        }

        return res.status(200).json({ message: `Cita actualizada a ${estado} exitosamente.` });
    } catch (error) {
        console.error('Error al actualizar cita:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

// Obtener todas las circulares para ver firmas y estados en tiempo real
async function obtenerCircularesControl(req, res) {
    try {
        const circulares = await Circular.find({}).sort({ createdAt: -1 });
        return res.status(200).json(circulares);
    } catch (error) {
        console.error('Error al obtener circulares de control:', error);
        return res.status(500).json({ error: 'Error al obtener circulares.' });
    }
}

async function obtenerGrados(req, res) {
    try {
        const query = 'SELECT id, nombre FROM grados ORDER BY nombre';
        const grados = await sequelize.query(query, { type: QueryTypes.SELECT });
        return res.status(200).json(grados);
    } catch (error) {
        console.error('Error al obtener grados:', error);
        return res.status(500).json({ error: 'Error interno del servidor.' });
    }
}

module.exports = {
    obtenerAlumnos,
    obtenerPerfilEstudiante,
    actualizarPrivacidadEncargado,
    obtenerPerfilTutor,
    obtenerProfesores,
    obtenerHorarioProfesor,
    obtenerAsistenciaDiaria,
    notificarFaltas,
    obtenerIncidentesControl,
    registrarIncidentePresencial,
    resolverCasoControl,
    obtenerCitasControl,
    actualizarCitaControl,
    obtenerCircularesControl,
    obtenerGrados
};
