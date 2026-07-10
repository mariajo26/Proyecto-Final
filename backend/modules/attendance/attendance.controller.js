const { QueryTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const eventBroker = require('../../utils/eventBroker');

// ----------------------------------------------------------------------------
// 1. REGISTRAR ASISTENCIA LOCAL POR PERIODO (ASISTENCIA CRUZADA)
// ----------------------------------------------------------------------------
async function registrarAsistenciaPeriodo(req, res) {
    const body = req.body;
    const items = Array.isArray(body) ? body : [body];

    if (items.length === 0) {
        return res.status(400).json({ error: 'No se enviaron registros de asistencia.' });
    }

    try {
        const fechaHoy = new Date().toISOString().split('T')[0];

        for (const item of items) {
            const { estudiante_id, curso_id, periodo_numero, estado, observacion_docente } = item;

            if (!estudiante_id || !curso_id || !periodo_numero || !estado) {
                continue; // Saltar registros incompletos
            }

            // 1. Insertar o actualizar la inasistencia local en la tabla secundaria
            const queryLocal = `
                INSERT INTO inasistencias_periodos 
                    (estudiante_id, curso_id, fecha, periodo_numero, estado, observacion_docente)
                VALUES 
                    (:estudiante_id, :curso_id, :fechaHoy, :periodo_numero, :estado, :observacion_docente)
                ON DUPLICATE KEY UPDATE 
                    estado = :estado, 
                    observacion_docente = :observacion_docente
            `;

            await sequelize.query(queryLocal, {
                replacements: { estudiante_id, curso_id, fechaHoy, periodo_numero, estado, observacion_docente: observacion_docente || null },
                type: QueryTypes.INSERT
            });

            // 2. Lógica de reincorporación (Cascada de Llegada Tardía)
            if (estado === 'Llegada Tarde') {
                // Buscar si el alumno tiene inasistencia general registrada hoy
                const queryGral = `
                    SELECT id, registrado_por FROM asistencias_generales 
                    WHERE estudiante_id = :estudiante_id AND fecha = :fechaHoy AND estado = 'Inasistencia'
                    LIMIT 1
                `;
                const gralRows = await sequelize.query(queryGral, {
                    replacements: { estudiante_id, fechaHoy },
                    type: QueryTypes.SELECT
                });

                if (gralRows.length > 0) {
                    const asistenciaGralId = gralRows[0].id;
                    const registradoPor = gralRows[0].registrado_por;

                    // Actualizar la asistencia general del día a "Llegada Tarde"
                    const updateGral = `
                        UPDATE asistencias_generales 
                        SET estado = 'Llegada Tarde',
                            observaciones = CONCAT(COALESCE(observaciones, ''), ' | Incorporacion en periodo ', :periodo_numero)
                        WHERE id = :asistenciaGralId
                    `;
                    await sequelize.query(updateGral, {
                        replacements: { periodo_numero, asistenciaGralId },
                        type: QueryTypes.UPDATE
                    });

                    // Disparar evento para detener las alertas de material de contingencia académica
                    eventBroker.emit('attendance.llegadaTarde', {
                        estudiante_id,
                        fecha: fechaHoy,
                        periodo_numero
                    });

                    // Enviar notificación in-app simulada al Profesor Guía
                    eventBroker.emit('notification.create', {
                        usuario_id: registradoPor,
                        tipo: 'General',
                        titulo: 'Llegada tarde de estudiante',
                        mensaje: `El estudiante se incorporo en el periodo ${periodo_numero}.`,
                        modulo_origen: 'Asistencia'
                    });
                }
            } else if (estado === 'No Asistio') {
                // Emitir evento para activar el Centro de Puesta al Día para el docente de esta materia
                eventBroker.emit('attendance.localInasistencia', {
                    estudiante_id,
                    curso_id,
                    fecha: fechaHoy,
                    periodo_numero
                });
            }
        }

        return res.status(201).json({ message: 'Asistencia registrada con exito.' });

    } catch (error) {
        console.error('Error al registrar asistencia por periodo:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 2. ENVIAR JUSTIFICACIÓN DIGITAL DE INASISTENCIA (PADRE)
// ----------------------------------------------------------------------------
async function justificarFalta(req, res) {
    const { estudiante_id, fecha_falta, motivo, documento_adjunto_url } = req.body;

    if (!estudiante_id || !fecha_falta || !motivo) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para enviar la justificacion.' });
    }

    try {
        // 1. Obtener la hora límite de justificación configurada en el sistema
        const configQuery = 'SELECT valor FROM configuraciones_sistema WHERE clave = "hora_limite_justificacion_digital" LIMIT 1';
        const configRows = await sequelize.query(configQuery, { type: QueryTypes.SELECT });
        const horaLimiteStr = configRows.length > 0 ? configRows[0].valor : '12:00'; // Por defecto 12:00 PM

        // 2. Validar si está en el plazo correcto (hasta las 12:00 PM del día siguiente de la falta)
        const [year, month, day] = fecha_falta.split('-');
        const fechaLimite = new Date(parseInt(year, 10), parseInt(month, 10) - 1, parseInt(day, 10));
        fechaLimite.setDate(fechaLimite.getDate() + 1); // Día siguiente

        const [horas, minutos] = horaLimiteStr.split(':');
        fechaLimite.setHours(parseInt(horas, 10), parseInt(minutos, 10), 0, 0);

        const fechaActual = new Date();

        if (fechaActual > fechaLimite) {
            return res.status(400).json({ 
                error: `El plazo limite digital para justificar esta falta expiro el ${fechaLimite.toLocaleString()}.` 
            });
        }

        // 3. Registrar la justificación en MySQL
        const insertQuery = `
            INSERT INTO justificaciones_inasistencias 
                (estudiante_id, fecha_falta, motivo, documento_adjunto_url, estado)
            VALUES 
                (:estudiante_id, :fecha_falta, :motivo, :documento_adjunto_url, 'Pendiente')
            ON DUPLICATE KEY UPDATE 
                motivo = :motivo, 
                documento_adjunto_url = :documento_adjunto_url,
                estado = 'Pendiente'
        `;

        await sequelize.query(insertQuery, {
            replacements: {
                estudiante_id,
                fecha_falta,
                motivo,
                documento_adjunto_url: documento_adjunto_url || null
            },
            type: QueryTypes.INSERT
        });

        return res.status(201).json({ message: 'Justificacion digital enviada para revision.' });

    } catch (error) {
        console.error('Error al justificar falta:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 3. RESOLVER SOLICITUD DE JUSTIFICACIÓN (PROFESOR GUÍA / SECRETARÍA)
// ----------------------------------------------------------------------------
async function resolverJustificacion(req, res) {
    const { justificacion_id, estado, observacion_resolucion } = req.body;
    const resolvedBy = req.user.id;

    if (!justificacion_id || !estado) {
        return res.status(400).json({ error: 'El ID de justificacion y el nuevo estado son requeridos.' });
    }

    try {
        const fechaActual = new Date();

        // 1. Obtener los detalles de la justificación
        const searchQ = 'SELECT * FROM justificaciones_inasistencias WHERE id = :justificacion_id LIMIT 1';
        const justRows = await sequelize.query(searchQ, {
            replacements: { justificacion_id },
            type: QueryTypes.SELECT
        });

        if (justRows.length === 0) {
            return res.status(404).json({ error: 'La justificacion no existe.' });
        }

        const justificacion = justRows[0];

        // 2. Actualizar el estado de la justificación
        const updateQ = `
            UPDATE justificaciones_inasistencias 
            SET estado = :estado,
                observacion_resolucion = :observacion_resolucion,
                resuelto_por = :resolvedBy,
                fecha_resolucion = :fechaActual
            WHERE id = :justificacion_id
        `;

        await sequelize.query(updateQ, {
            replacements: { estado, observacion_resolucion: observacion_resolucion || null, resolvedBy, fechaActual, justificacion_id },
            type: QueryTypes.UPDATE
        });

        // 3. Si la justificación es aprobada, actualizar los registros de asistencia correspondientes
        if (estado === 'Aprobada') {
            // Actualizar asistencia general del alumno en esa fecha
            const updGral = `
                UPDATE asistencias_generales 
                SET justificada = TRUE 
                WHERE estudiante_id = :estudiante_id AND fecha = :fecha_falta
            `;
            await sequelize.query(updGral, {
                replacements: { estudiante_id: justificacion.estudiante_id, fecha_falta: justificacion.fecha_falta },
                type: QueryTypes.UPDATE
            });

            // Actualizar inasistencias por periodos en esa fecha
            const updLocal = `
                UPDATE inasistencias_periodos 
                SET justificada = TRUE 
                WHERE estudiante_id = :estudiante_id AND fecha = :fecha_falta
            `;
            await sequelize.query(updLocal, {
                replacements: { estudiante_id: justificacion.estudiante_id, fecha_falta: justificacion.fecha_falta },
                type: QueryTypes.UPDATE
            });

            // Disparar evento para que el módulo de calificaciones actualice las tareas correspondientes
            eventBroker.emit('attendance.justificacionAprobada', {
                estudiante_id: justificacion.estudiante_id,
                fecha_falta: justificacion.fecha_falta
            });
        }

        return res.status(200).json({ message: `Justificacion marcada como ${estado} con exito.` });

    } catch (error) {
        console.error('Error al resolver justificacion:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 4. OBTENER ASISTENCIA DE UN ESTUDIANTE
// ----------------------------------------------------------------------------
async function obtenerAsistenciaEstudiante(req, res) {
    const { studentId } = req.params;

    try {
        // Cargar asistencias generales
        const qGral = 'SELECT * FROM asistencias_generales WHERE estudiante_id = :studentId ORDER BY fecha DESC';
        const asistenciasGenerales = await sequelize.query(qGral, {
            replacements: { studentId },
            type: QueryTypes.SELECT
        });

        // Cargar inasistencias locales por periodo
        const qLocal = `
            SELECT ip.*, c.color_hex, m.nombre as materia_nombre 
            FROM inasistencias_periodos ip
            INNER JOIN cursos c ON ip.curso_id = c.id
            INNER JOIN materias m ON c.materia_id = m.id
            WHERE ip.estudiante_id = :studentId
            ORDER BY ip.fecha DESC, ip.periodo_numero ASC
        `;
        const inasistenciasLocales = await sequelize.query(qLocal, {
            replacements: { studentId },
            type: QueryTypes.SELECT
        });

        return res.status(200).json({
            asistenciasGenerales,
            inasistenciasLocales
        });

    } catch (error) {
        console.error('Error al obtener asistencia de estudiante:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}


// ----------------------------------------------------------------------------
// 5. OBTENER CURSOS ASIGNADOS AL PROFESOR AUTENTICADO
// ----------------------------------------------------------------------------
async function obtenerMisCursos(req, res) {
    // El ID del profesor proviene del token JWT decodificado por el middleware
    const profesorId = req.user.id;

    try {
        const query = `
            SELECT
                c.id,
                m.nombre        AS materia_nombre,
                g.nombre        AS grado_nombre,
                s.nombre        AS seccion_nombre,
                c.salon,
                c.color_hex,
                (SELECT CONCAT(TIME_FORMAT(hora_inicio, '%H:%i'), ' - ', TIME_FORMAT(hora_fin, '%H:%i')) FROM horarios_clases hc WHERE hc.curso_id = c.id LIMIT 1) AS horario,
                COUNT(es.estudiante_id) AS total_alumnos
            FROM cursos c
            JOIN materias m   ON c.materia_id   = m.id
            JOIN secciones s  ON c.seccion_id   = s.id
            JOIN grados g     ON s.grado_id     = g.id
            LEFT JOIN estudiantes_secciones es ON es.seccion_id = s.id
            WHERE c.profesor_id = :profesorId
            GROUP BY c.id, m.nombre, g.nombre, s.nombre, c.salon, c.color_hex
            ORDER BY g.nombre, s.nombre, m.nombre
        `;

        const cursos = await sequelize.query(query, {
            replacements: { profesorId },
            type: QueryTypes.SELECT
        });

        return res.status(200).json(cursos);

    } catch (error) {
        console.error('Error al obtener mis cursos:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 6. OBTENER ALUMNOS DE UN CURSO CON SU ASISTENCIA GENERAL DEL DÍA
// ----------------------------------------------------------------------------
async function obtenerAlumnosDeCurso(req, res) {
    const { cursoId } = req.params;
    const fechaHoy = new Date().toISOString().split('T')[0];

    try {
        // Verificar que el curso pertenece al profesor autenticado
        const cursoCheck = await sequelize.query(
            'SELECT id FROM cursos WHERE id = :cursoId AND profesor_id = :profesorId LIMIT 1',
            { replacements: { cursoId, profesorId: req.user.id }, type: QueryTypes.SELECT }
        );

        if (cursoCheck.length === 0) {
            return res.status(403).json({ error: 'No tienes permiso para acceder a este curso.' });
        }

        // Consultar alumnos de la sección del curso con su asistencia general del día
        const query = `
            SELECT
                u.id,
                u.nombre_completo  AS nombre,
                u.codigo_ua,
                COALESCE(ag.estado, 'Sin registro') AS asistencia_manana,
                ip.estado          AS asistencia_local,
                ip.observacion_docente AS observacion_local
            FROM cursos c
            JOIN secciones s              ON c.seccion_id      = s.id
            JOIN estudiantes_secciones es ON es.seccion_id     = s.id
            JOIN usuarios u               ON u.id              = es.estudiante_id
            LEFT JOIN asistencias_generales ag
                ON ag.estudiante_id = u.id AND ag.fecha = :fechaHoy
            LEFT JOIN inasistencias_periodos ip
                ON ip.estudiante_id = u.id AND ip.curso_id = c.id AND ip.fecha = :fechaHoy
            WHERE c.id = :cursoId
            ORDER BY u.nombre_completo ASC
        `;

        const alumnos = await sequelize.query(query, {
            replacements: { cursoId, fechaHoy },
            type: QueryTypes.SELECT
        });

        return res.status(200).json(alumnos);

    } catch (error) {
        console.error('Error al obtener alumnos del curso:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

module.exports = {
    registrarAsistenciaPeriodo,
    justificarFalta,
    resolverJustificacion,
    obtenerAsistenciaEstudiante,
    obtenerMisCursos,
    obtenerAlumnosDeCurso
};
