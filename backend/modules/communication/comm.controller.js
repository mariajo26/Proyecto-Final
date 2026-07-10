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
            // BACKEND JOIN EXPLICACIÓN:
            // Para Alumnos y Encargados (Tutor), consultamos MySQL usando INNER JOINs para obtener el grado y sección
            // asociados a sus estudiantes vinculados y así validar a qué foros de GradoSeccion tienen acceso.
            let childrenUas = [];
            if (rol === 'Encargado') {
                const childQuery = `
                    SELECT u.codigo_ua FROM usuarios u
                    INNER JOIN estudiantes_encargados ee ON u.id = ee.estudiante_id
                    WHERE ee.encargado_id = :userId
                `;
                const childRows = await sequelize.query(childQuery, {
                    replacements: { userId: req.user.id },
                    type: QueryTypes.SELECT
                });
                childrenUas = childRows.map(c => c.codigo_ua);
            } else {
                childrenUas = [codigo_ua];
            }

            const acadQuery = `
                SELECT g.nombre as grado, s.nombre as seccion 
                FROM estudiantes_secciones es
                INNER JOIN secciones s ON es.seccion_id = s.id
                INNER JOIN grados g ON s.grado_id = g.id
                INNER JOIN usuarios u ON es.estudiante_id = u.id
                WHERE u.codigo_ua IN (:childrenUas)
            `;
            const acadRows = await sequelize.query(acadQuery, {
                replacements: { childrenUas: childrenUas.length > 0 ? childrenUas : ['NONE'] },
                type: QueryTypes.SELECT
            });

            // Agregación de condiciones: Ver foros institucionales, foros de su grado/sección
            // o foros temáticos/de grupo donde aparezcan explícitamente en el array de "miembros"
            const orConditions = [
                { creador_id: codigo_ua },
                { miembros: codigo_ua },
                { tipo: 'Institucional' }
            ];

            acadRows.forEach(row => {
                orConditions.push({ tipo: 'GradoSeccion', 'grado_seccion.grado': row.grado, 'grado_seccion.seccion': row.seccion });
            });

            queryMongo = { $or: orConditions };
        } else if (rol === 'Control Academico') {
            // Control Académico tiene privilegios de moderación y visualización de todos los foros
            queryMongo = {};
        } else {
            // Profesores: Única y exclusivamente ven los foros de los cuales son Creadores
            // o donde han sido agregados explícitamente en la lista de integrantes (miembros) o institucionales.
            queryMongo = {
                $or: [
                    { creador_id: codigo_ua },
                    { miembros: codigo_ua },
                    { tipo: 'Institucional' }
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

        const io = req.app.get('io');
        if (io) {
            const room = [emisorCodigo, receptor_id].sort().join('_');
            io.to(room).emit('recibir_mensaje', {
                _id: nuevoMensaje._id,
                emisor_id: nuevoMensaje.emisor_id,
                receptor_id: nuevoMensaje.receptor_id,
                contenido: nuevoMensaje.contenido,
                fecha_envio: nuevoMensaje.fecha_envio || nuevoMensaje.createdAt,
                adjuntos: nuevoMensaje.adjuntos
            });
        }

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

async function marcarNotificacionLeida(req, res) {
    const { id } = req.params;
    const { codigo_ua } = req.user;
    try {
        const notif = await Notificacion.findOneAndUpdate(
            { _id: id, usuario_id: codigo_ua },
            { leido: true },
            { new: true }
        );
        if (!notif) return res.status(404).json({ error: 'Notificación no encontrada.' });
        return res.status(200).json(notif);
    } catch (err) {
        console.error('Error al marcar notificación como leída:', err);
        return res.status(500).json({ error: 'Error al marcar notificación como leída.' });
    }
}

async function marcarTodasNotificacionesLeidas(req, res) {
    const { codigo_ua } = req.user;
    try {
        await Notificacion.updateMany(
            { usuario_id: codigo_ua, leido: false },
            { leido: true }
        );
        return res.status(200).json({ message: 'Todas las notificaciones marcadas como leídas.' });
    } catch (err) {
        console.error('Error al marcar todas las notificaciones como leídas:', err);
        return res.status(500).json({ error: 'Error al marcar todas las notificaciones como leídas.' });
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

async function obtenerConversacion(req, res) {
    const { codigo_ua } = req.user;
    const { interlocutor_ua } = req.params;
    try {
        const list = await MensajeDirecto.find({
            $or: [
                { emisor_id: codigo_ua, receptor_id: interlocutor_ua },
                { emisor_id: interlocutor_ua, receptor_id: codigo_ua }
            ]
        }).sort({ fecha_envio: 1 });
        return res.status(200).json(list);
    } catch (err) {
        console.error('Error al obtener conversacion:', err);
        return res.status(500).json({ error: 'Error al obtener historial.' });
    }
}

// ----------------------------------------------------------------------------
// 6. OBTENER CIRCULARES PARA EL TUTOR / PADRE DE FAMILIA
// JSON esperado de respuesta:
// [
//   { _id, titulo, contenido, tipo, estado, fecha_publicacion, fecha_limite,
//     mi_firma: { estado, metodo, fecha_firma } | null,
//     leida_por_mi: Boolean }
// ]
// ----------------------------------------------------------------------------
async function obtenerCircularesTutor(req, res) {
    const encargadoUa = req.user.codigo_ua;

    try {
        // Circulares Informativas: visibles para encargados cuyos hijos pertenecen
        // a los grados/secciones del filtro, o enviadas a todos.
        // Circulares de Autorizacion: solo las que tengan una firma con el encargado_id del padre.
        const circulares = await Circular.find({
            $or: [
                // Informativas publicadas globalmente o que le apliquen
                { tipo: 'Informativa', estado: { $in: ['Enviada', 'Autorizado', 'No Autorizado'] } },
                // Autorizaciones que tienen al padre en la matriz de firmas
                { tipo: 'Autorizacion', 'firmas.encargado_id': encargadoUa }
            ]
        }).sort({ fecha_publicacion: -1 });

        const resultado = circulares.map(c => {
            // Buscar la firma especifica de este padre en la circular
            const miFirma = c.firmas.find(f => f.encargado_id === encargadoUa) || null;

            // Para informativas, rastrear si ya fue leida usando campo en la firma
            // (reutilizamos el array firmas con un registro especial de tipo lectura)
            const leidaPorMi = c.tipo === 'Informativa'
                ? (c.firmas || []).some(f => f.encargado_id === encargadoUa && f.estado === 'Autorizado')
                : false;

            return {
                _id: c._id,
                titulo: c.titulo,
                contenido: c.contenido,
                tipo: c.tipo,
                estado_global: c.estado,
                fecha_publicacion: c.fecha_publicacion,
                fecha_limite: c.fecha_limite,
                mi_firma: miFirma ? {
                    estudiante_id: miFirma.estudiante_id,
                    estado: miFirma.estado,
                    metodo: miFirma.metodo,
                    fecha_firma: miFirma.fecha_firma
                } : null,
                leida_por_mi: leidaPorMi
            };
        });

        return res.status(200).json(resultado);

    } catch (error) {
        console.error('Error al obtener circulares del tutor:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 7. MARCAR CIRCULAR INFORMATIVA COMO LEIDA (Auto-trigger al abrir el PDF)
// Mutacion esperada en BD:
// circular.firmas[] -> agregar/actualizar entrada con encargado_id + estado='Autorizado'
// ----------------------------------------------------------------------------
async function marcarCircularLeida(req, res) {
    const { circular_id } = req.params;
    const encargadoUa = req.user.codigo_ua;

    try {
        const circular = await Circular.findById(circular_id);
        if (!circular) {
            return res.status(404).json({ error: 'La circular no existe.' });
        }

        if (circular.tipo !== 'Informativa') {
            return res.status(400).json({ error: 'Solo las circulares informativas pueden marcarse como leidas aqui.' });
        }

        // Verificar si ya fue leida
        const yaLeida = circular.firmas.some(f => f.encargado_id === encargadoUa && f.estado === 'Autorizado');
        if (yaLeida) {
            return res.status(200).json({ message: 'La circular ya habia sido marcada como leida.', ya_leida: true });
        }

        // Insertar registro de lectura en la matriz firmas
        // metodo='Virtual' actua como indicador de lectura digital para informativas
        circular.firmas.push({
            estudiante_id: encargadoUa, // Para informativas, no hay un estudiante especifico, usamos el UA del padre
            encargado_id: encargadoUa,
            estado: 'Autorizado',
            metodo: 'Virtual',
            fecha_firma: new Date()
        });

        await circular.save();
        return res.status(200).json({ message: 'Circular marcada como leida exitosamente.' });

    } catch (error) {
        console.error('Error al marcar circular como leida:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 8. RECHAZAR CIRCULAR DE AUTORIZACION (Padre no autoriza)
// Transicion FSM: 'Enviada' -> 'No Autorizado'
// ----------------------------------------------------------------------------
async function rechazarCircularTutor(req, res) {
    const { circular_id } = req.params;
    const { estudiante_id } = req.body; // codigo_ua del alumno
    const encargadoUa = req.user.codigo_ua;

    try {
        const circular = await Circular.findById(circular_id);
        if (!circular) {
            return res.status(404).json({ error: 'La circular no existe.' });
        }

        // Solo se puede rechazar si el estado de la firma es 'Enviada'
        const firmaIdx = circular.firmas.findIndex(
            f => f.encargado_id === encargadoUa && f.estudiante_id === estudiante_id
        );

        if (firmaIdx === -1) {
            return res.status(403).json({ error: 'No tiene una firma pendiente para esta circular.' });
        }

        if (circular.firmas[firmaIdx].estado !== 'Enviada') {
            return res.status(400).json({ error: 'Solo puede rechazar circulares en estado Enviada.' });
        }

        circular.firmas[firmaIdx].estado = 'No Autorizado';
        circular.firmas[firmaIdx].fecha_firma = new Date();
        circular.firmas[firmaIdx].metodo = 'Virtual';

        await circular.save();

        return res.status(200).json({ message: 'Autorizacion rechazada. La circular ha sido marcada como No Autorizada para este alumno.' });

    } catch (error) {
        console.error('Error al rechazar circular:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 9. ELIMINAR CIRCULAR (Control Académico / Administrador)
// ----------------------------------------------------------------------------
async function eliminarCircular(req, res) {
    const { circular_id } = req.params;

    try {
        const result = await Circular.findByIdAndDelete(circular_id);
        if (!result) {
            return res.status(404).json({ error: 'La circular no existe.' });
        }
        return res.status(200).json({ message: 'Circular eliminada con exito.' });
    } catch (error) {
        console.error('Error al eliminar circular:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 10. RECEPCIÓN Y REGISTRO DE FIRMA FÍSICA (Secretaría / Control Académico)
// Transicion: 'Enviada' / 'Pendiente' ➔ 'Autorizado'
// ----------------------------------------------------------------------------
async function registrarFirmaFisica(req, res) {
    const { circular_id } = req.params;
    const { estudiante_id } = req.body; // Código UA del alumno
    const secretariaUa = req.user.codigo_ua;

    if (!estudiante_id) {
        return res.status(400).json({ error: 'El estudiante_id es obligatorio.' });
    }

    try {
        const circular = await Circular.findById(circular_id);
        if (!circular) {
            return res.status(404).json({ error: 'La circular no existe.' });
        }

        // Buscar firma del alumno en la matriz
        const idx = circular.firmas.findIndex(f => f.estudiante_id === estudiante_id);
        if (idx === -1) {
            return res.status(404).json({ error: 'Firma no encontrada para este estudiante en esta circular.' });
        }

        // Actualizar firma física
        circular.firmas[idx].estado = 'Autorizado';
        circular.firmas[idx].metodo = 'Presencial';
        circular.firmas[idx].fecha_firma = new Date();
        circular.firmas[idx].usuario_recepcion_fisica = secretariaUa;

        await circular.save();

        // Notificar y desbloquear evento de calendario (simulado mediante eventBroker)
        eventBroker.emit('circular.autorizada', { circular_id, estudiante_id });

        return res.status(200).json({ message: 'Boleta de firma fisica registrada exitosamente.', circular });
    } catch (error) {
        console.error('Error al registrar firma fisica:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 10. CONTROLADORES ADICIONALES DE FOROS
// ----------------------------------------------------------------------------
async function obtenerHilos(req, res) {
    const { foro_id } = req.params;
    try {
        const hilos = await HiloDiscusion.find({ foro_id }).sort({ creado_en: -1 });
        return res.status(200).json(hilos);
    } catch (error) {
        console.error('Error al obtener hilos:', error);
        return res.status(500).json({ error: 'Error al obtener hilos.' });
    }
}

async function crearHilo(req, res) {
    const { foro_id } = req.params;
    const { titulo, contenido } = req.body;
    const creador_id = req.user.codigo_ua;
    try {
        const nuevoHilo = new HiloDiscusion({
            foro_id,
            titulo,
            contenido,
            creador_id
        });
        await nuevoHilo.save();
        return res.status(201).json(nuevoHilo);
    } catch (error) {
        console.error('Error al crear hilo:', error);
        return res.status(500).json({ error: 'Error al crear hilo.' });
    }
}

async function obtenerComentarios(req, res) {
    const { hilo_id } = req.params;
    try {
        const comentarios = await Comentario.find({ hilo_id }).sort({ creado_en: 1 });
        return res.status(200).json(comentarios);
    } catch (error) {
        console.error('Error al obtener comentarios:', error);
        return res.status(500).json({ error: 'Error al obtener comentarios.' });
    }
}

async function crearComentario(req, res) {
    const { hilo_id } = req.params;
    const { contenido } = req.body;
    const autor_id = req.user.codigo_ua;
    try {
        const nuevoComentario = new Comentario({
            hilo_id,
            autor_id,
            contenido
        });
        await nuevoComentario.save();
        return res.status(201).json(nuevoComentario);
    } catch (error) {
        console.error('Error al crear comentario:', error);
        return res.status(500).json({ error: 'Error al crear comentario.' });
    }
}

async function obtenerTodosLosHilos(req, res) {
    const { codigo_ua, rol } = req.user;
    try {
        let queryMongo = {};
        if (rol === 'Estudiante' || rol === 'Encargado') {
            let childrenUas = [];
            if (rol === 'Encargado') {
                const childQuery = `
                    SELECT u.codigo_ua FROM usuarios u
                    INNER JOIN estudiantes_encargados ee ON u.id = ee.estudiante_id
                    WHERE ee.encargado_id = :userId
                `;
                const childRows = await sequelize.query(childQuery, {
                    replacements: { userId: req.user.id },
                    type: QueryTypes.SELECT
                });
                childrenUas = childRows.map(c => c.codigo_ua);
            } else {
                childrenUas = [codigo_ua];
            }

            const acadQuery = `
                SELECT g.nombre as grado, s.nombre as seccion 
                FROM estudiantes_secciones es
                INNER JOIN secciones s ON es.seccion_id = s.id
                INNER JOIN grados g ON s.grado_id = g.id
                INNER JOIN usuarios u ON es.estudiante_id = u.id
                WHERE u.codigo_ua IN (:childrenUas)
            `;
            const acadRows = await sequelize.query(acadQuery, {
                replacements: { childrenUas: childrenUas.length > 0 ? childrenUas : ['NONE'] },
                type: QueryTypes.SELECT
            });

            const orConditions = [
                { creador_id: codigo_ua },
                { miembros: codigo_ua },
                { tipo: 'Institucional' }
            ];

            acadRows.forEach(row => {
                orConditions.push({ tipo: 'GradoSeccion', 'grado_seccion.grado': row.grado, 'grado_seccion.seccion': row.seccion });
            });
            queryMongo = { $or: orConditions };
        } else if (rol === 'Control Academico') {
            // Control Académico visualiza todos los hilos
            queryMongo = {};
        } else {
            queryMongo = {
                $or: [
                    { creador_id: codigo_ua },
                    { miembros: codigo_ua },
                    { tipo: 'Institucional' }
                ]
            };
        }

        const forosPermitidos = await Foro.find(queryMongo);
        const forosIds = forosPermitidos.map(f => f._id);

        const hilos = await HiloDiscusion.find({ foro_id: { $in: forosIds } }).sort({ creado_en: -1 }).lean();

        const hilosEstructurados = await Promise.all(hilos.map(async (h) => {
            const foroPadre = forosPermitidos.find(f => f._id.toString() === h.foro_id.toString());
            const comentarios = await Comentario.find({ hilo_id: h._id }).sort({ creado_en: 1 }).lean();

            let categoria = 'Hilos de Curso';
            if (foroPadre) {
                if (foroPadre.tipo === 'Institucional') categoria = 'Institucional';
                else if (foroPadre.tipo === 'GradoSeccion') categoria = 'Grado y Sección';
                else if (foroPadre.tipo === 'GrupoTareas') categoria = 'Foros de Tareas en Grupo';
            }

            const codigosUa = [h.creador_id, ...comentarios.map(c => c.autor_id)];
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

            return {
                id: h._id.toString(),
                titulo: h.titulo,
                categoria,
                materia: h.materia || (foroPadre ? foroPadre.nombre : ''),
                autor: nombresMap[h.creador_id] || h.creador_id,
                creador_id: h.creador_id,
                foro_id: h.foro_id.toString(),
                archivado: foroPadre ? (foroPadre.estado === 'Archivado') : false,
                comentariosBloqueados: h.cerrado,
                adjuntos: h.adjuntos || [],
                mensajes: [
                    {
                        id: h._id.toString(),
                        autor: nombresMap[h.creador_id] || h.creador_id,
                        autor_id: h.creador_id,
                        texto: h.contenido,
                        fecha: new Date(h.creado_en).toISOString().replace('T', ' ').substring(0, 16)
                    },
                    ...comentarios.map(c => ({
                        id: c._id.toString(),
                        autor: nombresMap[c.autor_id] || c.autor_id,
                        autor_id: c.autor_id,
                        texto: c.contenido,
                        fecha: new Date(c.creado_en).toISOString().replace('T', ' ').substring(0, 16)
                    }))
                ]
            };
        }));

        return res.status(200).json(hilosEstructurados);
    } catch (error) {
        console.error('Error al obtener todos los hilos:', error);
        return res.status(500).json({ error: 'Error al obtener hilos.' });
    }
}

async function crearHiloDocente(req, res) {
    const { titulo, contenido, categoria, materia } = req.body;
    const creador_id = req.user.codigo_ua;
    try {
        let tipo = 'Tematico';
        if (categoria === 'Institucional') tipo = 'Institucional';
        else if (categoria === 'Grado y Sección') tipo = 'GradoSeccion';
        else if (categoria === 'Foros de Tareas en Grupo') tipo = 'GrupoTareas';

        let foro = await Foro.findOne({ tipo, creador_id });
        if (!foro) {
            foro = new Foro({
                nombre: materia || `Foro de ${categoria}`,
                tipo,
                creador_id,
                estado: 'Activo'
            });
            await foro.save();
        }

        const nuevoHilo = new HiloDiscusion({
            foro_id: foro._id,
            titulo,
            contenido,
            creador_id
        });
        await nuevoHilo.save();
        return res.status(201).json(nuevoHilo);
    } catch (error) {
        console.error('Error al crear hilo docente:', error);
        return res.status(500).json({ error: 'Error al crear hilo.' });
    }
}

// ----------------------------------------------------------------------------
// 11. MODERACIÓN DE FOROS (Control Académico)
// Acciones: 'cerrar' (bloquear comentarios), 'archivar' (archivar foro), 'eliminar_hilo' (eliminar hilo entero), 'eliminar_comentario' (eliminar comentario específico)
// ----------------------------------------------------------------------------
async function moderarForo(req, res) {
    const { accion } = req.body;

    try {
        if (accion === 'archivar') {
            const { foro_id } = req.body;
            const foro = await Foro.findByIdAndUpdate(foro_id, { estado: 'Archivado' }, { new: true });
            if (!foro) return res.status(404).json({ error: 'Foro no encontrado.' });
            return res.status(200).json({ message: 'Foro archivado con exito.', foro });
        }

        if (accion === 'cerrar') {
            const { hilo_id } = req.body;
            const hilo = await HiloDiscusion.findByIdAndUpdate(hilo_id, { cerrado: true }, { new: true });
            if (!hilo) return res.status(404).json({ error: 'Hilo no encontrado.' });
            return res.status(200).json({ message: 'Hilo cerrado. Comentarios bloqueados.', hilo });
        }

        if (accion === 'eliminar_hilo') {
            const { hilo_id } = req.body;
            const result = await HiloDiscusion.findByIdAndDelete(hilo_id);
            if (!result) return res.status(404).json({ error: 'Hilo no encontrado.' });
            // Eliminar comentarios asociados
            await Comentario.deleteMany({ hilo_id });
            return res.status(200).json({ message: 'Hilo y comentarios asociados eliminados con exito.' });
        }

        if (accion === 'eliminar_comentario') {
            const { comentario_id } = req.body;
            const result = await Comentario.findByIdAndDelete(comentario_id);
            if (!result) return res.status(404).json({ error: 'Comentario no encontrado.' });
            return res.status(200).json({ message: 'Comentario eliminado con exito.' });
        }

        return res.status(400).json({ error: 'Accion de moderacion no soportada.' });

    } catch (error) {
        console.error('Error al moderar foro:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

module.exports = {
    obtenerForos,
    enviarMensaje,
    crearCircular,
    publicarCircular,
    autorizarCircularVirtual,
    obtenerNotificaciones,
    marcarNotificacionLeida,
    marcarTodasNotificacionesLeidas,
    obtenerMensajesRecientes,
    obtenerConversacion,
    obtenerTodosLosHilos,
    crearHiloDocente,
    obtenerHilos,
    crearHilo,
    obtenerComentarios,
    crearComentario,
    cronConsolidarInasistencias,
    cronVencerCirculares,
    obtenerCircularesTutor,
    marcarCircularLeida,
    rechazarCircularTutor,
    // Nuevas acciones de administracion / secretaria
    eliminarCircular,
    registrarFirmaFisica,
    moderarForo
};
