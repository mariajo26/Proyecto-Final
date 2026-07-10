const { QueryTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const { MensajeDirecto, Foro, HiloDiscusion, Comentario, Circular, Notificacion } = require('../../database/mongoose_schemas');
const eventBroker = require('../../utils/eventBroker');

// ----------------------------------------------------------------------------
// 1. OBTENER FOROS DE COMUNIDAD (DINÁMICOS POR ROL)
// ----------------------------------------------------------------------------
async function obtenerForos(req, res) {
    const { codigo_ua, rol } = req.user;

    try {
        let queryMongo = {};

        if (rol === 'Estudiante' || rol === 'Encargado') {
            // Para alumnos o encargados, cargamos su grado/sección desde MySQL
            let studentUa = codigo_ua;
            if (rol === 'Encargado') {
                // Si es encargado, buscamos el código de su primer hijo vinculado
                const childQuery = `
                    SELECT u.codigo_ua FROM usuarios u
                    INNER JOIN estudiantes_encargados ee ON u.id = ee.estudiante_id
                    WHERE ee.encargado_id = :userId LIMIT 1
                `;
                const childRows = await sequelize.query(childQuery, {
                    replacements: { userId: req.user.id },
                    type: QueryTypes.SELECT
                });
                if (childRows.length > 0) {
                    studentUa = childRows[0].codigo_ua;
                }
            }

            // Obtener el grado y sección del alumno
            const acadQuery = `
                SELECT g.nombre as grado, s.nombre as seccion 
                FROM estudiantes_secciones es
                INNER JOIN secciones s ON es.seccion_id = s.id
                INNER JOIN grados g ON s.grado_id = g.id
                INNER JOIN usuarios u ON es.estudiante_id = u.id
                WHERE u.codigo_ua = :studentUa LIMIT 1
            `;
            const acadRows = await sequelize.query(acadQuery, {
                replacements: { studentUa },
                type: QueryTypes.SELECT
            });

            if (acadRows.length > 0) {
                const { grado, seccion } = acadRows[0];
                queryMongo = {
                    $or: [
                        { tipo: 'GradoSeccion', 'grado_seccion.grado': grado, 'grado_seccion.seccion': seccion },
                        { miembros: codigo_ua }
                    ]
                };
            } else {
                queryMongo = { miembros: codigo_ua };
            }
        } else {
            // Administradores, Profesores o Secretaría ven los foros donde son miembros o creadores
            queryMongo = {
                $or: [
                    { creador_id: codigo_ua },
                    { miembros: codigo_ua },
                    { tipo: 'GradoSeccion' } // Los docentes ven los de grado/sección
                ]
            };
        }

        const foros = await Foro.find(queryMongo).sort({ creado_en: -1 });
        return res.status(200).json(foros);

    } catch (error) {
        console.error('Error al obtener foros:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 2. ENVIAR MENSAJE DIRECTO CON VALIDACIÓN DE HORARIO DE ATENCIÓN
// ----------------------------------------------------------------------------
async function enviarMensaje(req, res) {
    const emisorCodigo = req.user.codigo_ua;
    const { receptor_id, contenido, adjuntos } = req.body; // receptor_id es el codigo_ua destino

    if (!receptor_id || !contenido) {
        return res.status(400).json({ error: 'El destinatario y el contenido son obligatorios.' });
    }

    try {
        let advertenciaHorario = null;

        // 1. Validar si el receptor es Profesor o Control Académico (tiene horarios de atención)
        const userQuery = 'SELECT id, rol FROM usuarios WHERE codigo_ua = :receptor_id LIMIT 1';
        const userRows = await sequelize.query(userQuery, {
            replacements: { receptor_id },
            type: QueryTypes.SELECT
        });

        if (userRows.length > 0) {
            const receptor = userRows[0];

            if (receptor.rol === 'Profesor' || receptor.rol === 'Control Academico') {
                const fechaActual = new Date();
                // Obtener día de la semana en español
                const diasEs = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
                const diaNombre = diasEs[fechaActual.getDay()];
                const horaActualStr = fechaActual.toTimeString().split(' ')[0]; // Formato "HH:MM:SS"

                // Consultar si la hora actual cae en el horario de atención del receptor
                const scheduleQuery = `
                    SELECT id FROM horarios_atencion_profesores 
                    WHERE profesor_id = :receptorId 
                      AND dia_semana = :diaNombre 
                      AND :horaActual BETWEEN hora_inicio AND hora_fin
                    LIMIT 1
                `;

                const scheduleRows = await sequelize.query(scheduleQuery, {
                    replacements: { 
                        receptorId: receptor.id, 
                        diaNombre, 
                        horaActual: horaActualStr 
                    },
                    type: QueryTypes.SELECT
                });

                if (scheduleRows.length === 0) {
                    // Fuera del horario de atención
                    advertenciaHorario = 'Mensaje enviado fuera del horario de atencion. Es probable que la respuesta sea demorada.';
                }
            }
        }

        // 2. Guardar el mensaje en MongoDB
        const nuevoMensaje = new MensajeDirecto({
            emisor_id: emisorCodigo,
            receptor_id,
            contenido,
            adjuntos: adjuntos || []
        });

        await nuevoMensaje.save();

        return res.status(201).json({
            message: 'Mensaje enviado con exito.',
            mensaje: nuevoMensaje,
            advertencia: advertenciaHorario
        });

    } catch (error) {
        console.error('Error al enviar mensaje:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 3. CREAR Y PUBLICAR CIRCULARES
// ----------------------------------------------------------------------------
async function crearCircular(req, res) {
    const { titulo, contenido, tipo, fecha_limite, filtros_destino } = req.body;
    const creador = req.user.codigo_ua;

    if (!titulo || !contenido || !tipo) {
        return res.status(400).json({ error: 'Faltan campos requeridos para la circular.' });
    }

    try {
        const nuevaCircular = new Circular({
            titulo,
            contenido,
            tipo,
            creador_id: creador,
            fecha_limite: tipo === 'Autorizacion' ? new Date(fecha_limite) : null,
            filtros_destino: filtros_destino || {},
            estado: 'Pendiente',
            firmas: []
        });

        await nuevaCircular.save();
        return res.status(201).json({ message: 'Circular guardada en borrador (Pendiente).', circular: nuevaCircular });

    } catch (error) {
        console.error('Error al crear circular:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

async function publicarCircular(req, res) {
    const { circular_id } = req.params;

    try {
        const circular = await Circular.findById(circular_id);
        if (!circular) {
            return res.status(404).json({ error: 'La circular no existe.' });
        }

        // Cambiar el estado a Enviada
        circular.estado = 'Enviada';
        circular.fecha_publicacion = new Date();

        // Si requiere firmas, generamos la matriz de firmas para los alumnos/padres destino
        if (circular.tipo === 'Autorizacion') {
            // Buscamos alumnos que cumplan con los filtros de destino en MySQL
            let sqlFilter = 'SELECT u.id as estudiante_id, u.codigo_ua as estudiante_ua, enc.codigo_ua as encargado_ua ';
            sqlFilter += 'FROM usuarios u ';
            sqlFilter += 'INNER JOIN estudiantes_secciones es ON u.id = es.estudiante_id ';
            sqlFilter += 'INNER JOIN estudiantes_encargados ee ON u.id = ee.estudiante_id ';
            sqlFilter += 'INNER JOIN usuarios enc ON ee.encargado_id = enc.id ';
            
            const replacements = {};
            let conditions = [];

            if (circular.filtros_destino.secciones_ids && circular.filtros_destino.secciones_ids.length > 0) {
                conditions.push('es.seccion_id IN (:secciones)');
                replacements.secciones = circular.filtros_destino.secciones_ids;
            }

            if (conditions.length > 0) {
                sqlFilter += ' WHERE ' + conditions.join(' AND ');
            }

            const estudiantesMatriz = await sequelize.query(sqlFilter, {
                replacements,
                type: QueryTypes.SELECT
            });

            // Poblar las firmas
            circular.firmas = estudiantesMatriz.map(e => ({
                estudiante_id: e.estudiante_ua,
                encargado_id: e.encargado_ua,
                estado: 'Enviada',
                metodo: 'Virtual' // Por defecto digital, cambia a Presencial si se firma físico
            }));
        }

        await circular.save();

        // Disparar notificaciones a los padres vinculados
        if (circular.tipo === 'Autorizacion') {
            circular.firmas.forEach(f => {
                eventBroker.emit('notification.create', {
                    usuario_id: f.encargado_id,
                    tipo: 'Alerta', // Notificación prioritaria (campaña de correo)
                    titulo: 'Nueva Autorizacion Requerida',
                    mensaje: `Se requiere firma de autorizacion para: ${circular.titulo}`,
                    modulo_origen: 'Circulares'
                });
            });
        }

        return res.status(200).json({ message: 'Circular publicada con exito y visible para los padres.', circular });

    } catch (error) {
        console.error('Error al publicar circular:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 4. AUTORIZACIÓN DIGITAL DE LA CIRCULAR (PADRE)
// ----------------------------------------------------------------------------
async function autorizarCircularVirtual(req, res) {
    const { circular_id, estudiante_id, autorizado } = req.body;
    const encargadoUa = req.user.codigo_ua;

    if (!circular_id || !estudiante_id || autorizado === undefined) {
        return res.status(400).json({ error: 'Faltan campos obligatorios para firmar la circular.' });
    }

    try {
        const circular = await Circular.findById(circular_id);
        if (!circular) {
            return res.status(404).json({ error: 'La circular no existe.' });
        }

        if (circular.estado !== 'Enviada') {
            return res.status(400).json({ error: 'La circular no esta abierta para autorizacion.' });
        }

        // Buscar la firma en la matriz
        const firmaIndex = circular.firmas.findIndex(f => 
            f.estudiante_id === estudiante_id && f.encargado_id === encargadoUa
        );

        if (firmaIndex === -1) {
            return res.status(403).json({ error: 'No esta autorizado para firmar esta circular para este alumno.' });
        }

        const nuevoEstadoFirma = autorizado ? 'Autorizado' : 'No Autorizado';
        circular.firmas[firmaIndex].estado = nuevoEstadoFirma;
        circular.firmas[firmaIndex].fecha_firma = new Date();
        circular.firmas[firmaIndex].metodo = 'Virtual';

        await circular.save();

        // Lógica de desbloqueo: si es Autorizado, enviar evento local para habilitar en el calendario
        if (autorizado) {
            eventBroker.emit('circular.autorizada', { circular_id, estudiante_id });
        }

        return res.status(200).json({ message: `Firma registrada como: ${nuevoEstadoFirma}.` });

    } catch (error) {
        console.error('Error al autorizar circular virtualmente:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 5. SCRIPTS AUXILIARES DE SIMULACIÓN DE CRON JOBS
// ----------------------------------------------------------------------------

// Cron Job: Consolidación de inasistencias definitivas (ejecutado por simulación)
async function cronConsolidarInasistencias() {
    try {
        console.log('[CRON] Iniciando consolidacion de inasistencias generales...');
        const fechaAyer = new Date();
        fechaAyer.setDate(fechaAyer.getDate() - 1);
        const fechaAyerStr = fechaAyer.toISOString().split('T')[0];

        // Buscar inasistencias generales de ayer que sigan sin justificación aprobada
        const inasistencias = await sequelize.query(`
            SELECT a.id, a.estudiante_id FROM asistencias_generales a
            LEFT JOIN justificaciones_inasistencias j 
              ON a.estudiante_id = j.estudiante_id AND a.fecha = j.fecha_falta
            WHERE a.fecha = :fechaAyerStr 
              AND a.estado = 'Inasistencia' 
              AND (j.id IS NULL OR j.estado = 'Rechazada')
        `, {
            replacements: { fechaAyerStr },
            type: QueryTypes.SELECT
        });

        for (const falta of inasistencias) {
            await sequelize.query(`
                UPDATE asistencias_generales 
                SET observaciones = CONCAT(COALESCE(observaciones, ''), ' | Sin justificacion por falta (Consolidado)')
                WHERE id = :id
            `, {
                replacements: { id: falta.id },
                type: QueryTypes.UPDATE
            });

            // Hacemos que cualquier tarea entregada sobre esa fecha sea Intolerable (10% de nota)
            await sequelize.query(`
                UPDATE entregas_tareas e
                INNER JOIN actividades a ON e.actividad_id = a.id
                SET e.estado = 'Intolerable', e.nota_obtenida = a.ponderacion * 0.10, e.penalizacion_aplicada = 90
                WHERE e.estudiante_id = :estudiante_id AND DATE(a.fecha_hora_limite) = :fechaAyerStr
            `, {
                replacements: { estudiante_id: falta.estudiante_id, fechaAyerStr },
                type: QueryTypes.UPDATE
            });
        }
        console.log(`[CRON] Se consolidaron ${inasistencias.length} faltas injustificadas.`);
    } catch (error) {
        console.error('[CRON ERROR] Error en consolidacion de asistencia:', error);
    }
}

// Cron Job: Vencimiento automático de circulares a "No Autorizado"
async function cronVencerCirculares() {
    try {
        console.log('[CRON] Iniciando proceso de vencimiento de circulares...');
        const ahora = new Date();

        // Buscar circulares de tipo Autorizacion activas que ya pasaron su fecha límite
        const circulares = await Circular.find({
            estado: 'Enviada',
            fecha_limite: { $lte: ahora }
        });

        for (const circular of circulares) {
            // Actualizar firmas individuales pendientes a "No Autorizado"
            circular.firmas.forEach(f => {
                if (f.estado === 'Enviada' || f.estado === 'Pendiente') {
                    f.estado = 'No Autorizado';
                    f.fecha_firma = ahora;
                }
            });

            circular.estado = 'No Autorizado';
            await circular.save();

            // Notificar a los padres rezagados
            circular.firmas.forEach(f => {
                if (f.estado === 'No Autorizado') {
                    eventBroker.emit('notification.create', {
                        usuario_id: f.encargado_id,
                        tipo: 'General',
                        titulo: 'Plazo vencido de autorizacion',
                        mensaje: `Expiro el plazo de autorizacion para el evento: ${circular.titulo}`,
                        modulo_origen: 'Circulares'
                    });
                }
            });
        }
        console.log(`[CRON] Proceso de vencimiento finalizado para ${circulares.length} circulares.`);
    } catch (error) {
        console.error('[CRON ERROR] Error al vencer circulares:', error);
    }
}

// Escuchador local para crear notificaciones
eventBroker.on('notification.create', async (data) => {
    try {
        const nuevaNotif = new Notificacion({
            usuario_id: data.usuario_id,
            tipo: data.tipo,
            titulo: data.titulo,
            mensaje: data.mensaje,
            modulo_origen: data.modulo_origen || data.modulo_orig, // Compatible con ambos
            leido: false
        });
        await nuevaNotif.save();
        console.log(`[EVENT] Notificacion creada in-app para ${data.usuario_id}: ${data.titulo}`);
    } catch (error) {
        console.error('[EVENT ERROR] Al crear notificacion:', error);
    }
});

async function obtenerNotificaciones(req, res) {
    const { codigo_ua } = req.user;
    try {
        const list = await Notificacion.find({ usuario_id: codigo_ua }).sort({ fecha_creacion: -1 }).limit(10);
        return res.status(200).json(list);
    } catch (err) {
        console.error('Error al obtener notificaciones:', err);
        return res.status(500).json({ error: 'Error al obtener notificaciones.' });
    }
}

async function obtenerMensajesRecientes(req, res) {
    const { codigo_ua } = req.user;
    try {
        const list = await MensajeDirecto.find({
            $or: [{ receptor_id: codigo_ua }, { emisor_id: codigo_ua }]
        }).sort({ fecha_envio: -1 }).limit(10);

        const codigosUa = [...new Set(list.flatMap(m => [m.emisor_id, m.receptor_id]))].filter(c => c !== codigo_ua);
        
        let nombresMap = {};
        if (codigosUa.length > 0) {
            const rows = await sequelize.query(
                'SELECT codigo_ua, nombre_completo FROM usuarios WHERE codigo_ua IN (:codigosUa)',
                {
                    replacements: { codigosUa },
                    type: QueryTypes.SELECT
                }
            );
            rows.forEach(r => {
                nombresMap[r.codigo_ua] = r.nombre_completo;
            });
        }

        const result = list.map(m => {
            const esEmisor = m.emisor_id === codigo_ua;
            const interlocutor = esEmisor ? m.receptor_id : m.emisor_id;
            
            const fechaMsg = new Date(m.fecha_envio || m.createdAt);
            const hora = fechaMsg.getHours();
            const dia = fechaMsg.getDay();
            const fueraHorario = (hora >= 18 || hora < 7 || dia === 0 || dia === 6);

            return {
                id: m._id,
                emisor_id: m.emisor_id,
                receptor_id: m.receptor_id,
                emisor_nombre: nombresMap[interlocutor] || interlocutor,
                contenido: m.contenido,
                fecha_envio: m.fecha_envio || m.createdAt,
                fueraHorario
            };
        });

        return res.status(200).json(result);
    } catch (err) {
        console.error('Error al obtener mensajes:', err);
        return res.status(500).json({ error: 'Error al obtener mensajes.' });
    }
}

module.exports = {
    obtenerForos,
    enviarMensaje,
    crearCircular,
    publicarCircular,
    autorizarCircularVirtual,
    obtenerNotificaciones,
    obtenerMensajesRecientes,
    cronConsolidarInasistencias,
    cronVencerCirculares
};
