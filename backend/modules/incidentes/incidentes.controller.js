// ============================================================================
// MÓDULO: GESTIÓN DE INCIDENTES, QUEJAS Y CITAS
// Arquitectura: FSM (Finite State Machine) sobre tablas MySQL dinámicas.
//
// ESTRUCTURA DE TABLA 'quejas_incidentes' (crear en schema.sql si no existe):
// ---
// CREATE TABLE IF NOT EXISTS quejas_incidentes (
//   id              INT AUTO_INCREMENT PRIMARY KEY,
//   encargado_id    INT NOT NULL,                          -- FK usuarios.id
//   destino_tipo    ENUM('Profesor','Secretaria') NOT NULL,
//   destino_id      INT NOT NULL,                          -- FK usuarios.id
//   titulo          VARCHAR(255) NOT NULL,
//   descripcion     TEXT NOT NULL,
//   estado          ENUM('Enviado','En Revision','Resuelto','Cerrado','Reabierto') DEFAULT 'Enviado',
//   respuesta       TEXT,                                  -- Respuesta del personal
//   escalado_por    INT,                                   -- usuarios.id del docente que escaló
//   fecha_creacion  DATETIME DEFAULT CURRENT_TIMESTAMP,
//   fecha_actualizacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
// );
//
// ESTRUCTURA DE TABLA 'citas_presenciales':
// ---
// CREATE TABLE IF NOT EXISTS citas_presenciales (
//   id              INT AUTO_INCREMENT PRIMARY KEY,
//   solicitante_id  INT NOT NULL,                          -- FK usuarios.id (padre o profesor)
//   destinatario_id INT NOT NULL,                          -- FK usuarios.id
//   fecha_hora      DATETIME NOT NULL,
//   motivo          VARCHAR(255),
//   es_prioritaria  TINYINT(1) DEFAULT 0,                  -- Si 1, resaltar en UI con alerta
//   estado          ENUM('Pendiente','Confirmada','Cancelada') DEFAULT 'Pendiente',
//   creada_en       DATETIME DEFAULT CURRENT_TIMESTAMP
// );
//
// ESTRUCTURA DE TABLA 'horarios_disponibles_profesores':
// ---
// CREATE TABLE IF NOT EXISTS horarios_disponibles_profesores (
//   id              INT AUTO_INCREMENT PRIMARY KEY,
//   profesor_id     INT NOT NULL,                          -- FK usuarios.id
//   dia_semana      ENUM('Lunes','Martes','Miercoles','Jueves','Viernes') NOT NULL,
//   hora_inicio     TIME NOT NULL,
//   hora_fin        TIME NOT NULL
// );
// ============================================================================

const { QueryTypes } = require('sequelize');
const { sequelize } = require('../../config/db');
const eventBroker = require('../../utils/eventBroker');

// ----------------------------------------------------------------------------
// FSM DE TRANSICIONES VÁLIDAS
// Define qué estados pueden transicionar a cuál y quién lo puede hacer.
// ----------------------------------------------------------------------------
const FSM_TRANSICIONES = {
    // { desde: [destinos válidos] }
    'Enviado':      { destinos: ['En Revision', 'Enviado'], actores: ['Encargado', 'Profesor', 'Control Academico'] },
    'En Revision':  { destinos: ['Resuelto'],               actores: ['Profesor', 'Control Academico'] },
    'Resuelto':     { destinos: ['Cerrado', 'Reabierto'],   actores: ['Encargado'] },
    'Cerrado':      { destinos: [],                         actores: [] },
    'Reabierto':    { destinos: ['En Revision'],            actores: ['Profesor', 'Control Academico'] }
};

// Validador de transiciones FSM
function transicionValida(estadoActual, estadoNuevo) {
    const regla = FSM_TRANSICIONES[estadoActual];
    return regla && regla.destinos.includes(estadoNuevo);
}

// ----------------------------------------------------------------------------
// 1. OBTENER TODOS LOS CASOS DEL TUTOR
// Retorna: [{ id, titulo, descripcion, estado, destino_nombre, respuesta,
//             fecha_creacion, fecha_actualizacion, puede_editar, puede_cerrar }]
// ----------------------------------------------------------------------------
async function obtenerCasosTutor(req, res) {
    const encargadoId = req.user.id;

    try {
        const casos = await sequelize.query(`
            SELECT
                qi.id,
                qi.titulo,
                qi.descripcion,
                qi.estado,
                qi.destino_tipo,
                qi.respuesta,
                qi.escalado_por,
                qi.fecha_creacion,
                qi.fecha_actualizacion,
                u_dest.nombre_completo AS destino_nombre
            FROM quejas_incidentes qi
            INNER JOIN usuarios u_dest ON qi.destino_id = u_dest.id
            WHERE qi.encargado_id = :encargadoId
            ORDER BY qi.fecha_actualizacion DESC
        `, {
            replacements: { encargadoId },
            type: QueryTypes.SELECT
        });

        // Enriquecer con flags de UI derivados del estado FSM
        const resultado = casos.map(c => ({
            ...c,
            puede_editar: c.estado === 'Enviado',           // Solo editar antes de revisión
            puede_cerrar: c.estado === 'Resuelto',          // Cerrar cuando el personal lo resuelve
            puede_reabrir: c.estado === 'Resuelto',         // Reabrir si no está de acuerdo
            bloqueado: ['Cerrado', 'En Revision', 'Reabierto'].includes(c.estado)
        }));

        return res.status(200).json(resultado);

    } catch (error) {
        console.error('Error al obtener casos del tutor:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 2. CREAR NUEVA QUEJA / INCIDENTE
// Estado inicial: 'Enviado' — el padre puede editar en este estado.
// ----------------------------------------------------------------------------
async function crearCaso(req, res) {
    const encargadoId = req.user.id;
    const { titulo, descripcion, destino_tipo, destino_id } = req.body;

    if (!titulo || !descripcion || !destino_tipo || !destino_id) {
        return res.status(400).json({ error: 'Todos los campos son requeridos: titulo, descripcion, destino_tipo, destino_id.' });
    }

    if (!['Profesor', 'Secretaria'].includes(destino_tipo)) {
        return res.status(400).json({ error: 'destino_tipo debe ser "Profesor" o "Secretaria".' });
    }

    try {
        const [result] = await sequelize.query(`
            INSERT INTO quejas_incidentes
                (encargado_id, titulo, descripcion, destino_tipo, destino_id, estado)
            VALUES
                (:encargadoId, :titulo, :descripcion, :destino_tipo, :destino_id, 'Enviado')
        `, {
            replacements: { encargadoId, titulo, descripcion, destino_tipo, destino_id },
            type: QueryTypes.INSERT
        });

        return res.status(201).json({
            message: 'Caso creado exitosamente.',
            id: result,
            estado: 'Enviado'
        });

    } catch (error) {
        console.error('Error al crear caso:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 3. CERRAR CASO (Padre valida la solución y archiva definitivamente)
// Transicion FSM: 'Resuelto' → 'Cerrado'
// ----------------------------------------------------------------------------
async function cerrarCaso(req, res) {
    const { id } = req.params;
    const encargadoId = req.user.id;

    try {
        const [rows] = await sequelize.query(
            'SELECT id, estado FROM quejas_incidentes WHERE id = :id AND encargado_id = :encargadoId',
            { replacements: { id, encargadoId }, type: QueryTypes.SELECT }
        );

        if (!rows) return res.status(404).json({ error: 'Caso no encontrado.' });
        if (!transicionValida(rows.estado, 'Cerrado')) {
            return res.status(400).json({ error: `No se puede cerrar un caso en estado "${rows.estado}".` });
        }

        await sequelize.query(
            `UPDATE quejas_incidentes SET estado = 'Cerrado' WHERE id = :id`,
            { replacements: { id }, type: QueryTypes.UPDATE }
        );

        return res.status(200).json({ message: 'Caso cerrado y archivado exitosamente.' });

    } catch (error) {
        console.error('Error al cerrar caso:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 4. REABRIR CASO (Padre rechaza la solución → Reabierto)
// Transicion FSM: 'Resuelto' → 'Reabierto'
// El reapertura notifica al destinatario original (o a secretaria si fue escalado).
// ----------------------------------------------------------------------------
async function reabrirCaso(req, res) {
    const { id } = req.params;
    const { motivo_reopen } = req.body;
    const encargadoId = req.user.id;

    try {
        const [caso] = await sequelize.query(
            `SELECT qi.id, qi.estado, qi.titulo, qi.destino_id, u.nombre_completo AS encargado_nombre
             FROM quejas_incidentes qi
             INNER JOIN usuarios u ON qi.encargado_id = u.id
             WHERE qi.id = :id AND qi.encargado_id = :encargadoId`,
            { replacements: { id, encargadoId }, type: QueryTypes.SELECT }
        );

        if (!caso) return res.status(404).json({ error: 'Caso no encontrado.' });
        if (!transicionValida(caso.estado, 'Reabierto')) {
            return res.status(400).json({ error: `No se puede reabrir un caso en estado "${caso.estado}".` });
        }

        await sequelize.query(
            `UPDATE quejas_incidentes
             SET estado = 'Reabierto',
                 descripcion = CONCAT(descripcion, '\n\n[REABIERTO POR PADRE]: ', :motivo)
             WHERE id = :id`,
            { replacements: { id, motivo: motivo_reopen || 'Sin motivo adicional.' }, type: QueryTypes.UPDATE }
        );

        // Notificación al personal que resolvió: el caso fue reabierto
        eventBroker.emit('notification.create', {
            usuario_id: `${caso.destino_id}`, // Se convierte a string para compatibilidad con UA
            tipo: 'Alerta',
            titulo: 'Caso Reabierto por el Padre',
            mensaje: `El encargado no estuvo de acuerdo con la resolución del caso: "${caso.titulo}".`,
            modulo_origen: 'Quejas'
        });

        return res.status(200).json({ message: 'Caso reabierto. El personal ha sido notificado.' });

    } catch (error) {
        console.error('Error al reabrir caso:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 5. OBTENER CITAS DEL TUTOR (Entrantes del profesor + solicitadas por el padre)
// Retorna: [{ id, tipo:'recibida'|'solicitada', contraparte_nombre,
//             fecha_hora, motivo, es_prioritaria, estado }]
// ----------------------------------------------------------------------------
async function obtenerCitasTutor(req, res) {
    const userId = req.user.id;

    try {
        const citas = await sequelize.query(`
            SELECT
                cp.id,
                cp.fecha_hora,
                cp.motivo,
                cp.es_prioritaria,
                cp.estado,
                cp.solicitante_id,
                cp.destinatario_id,
                u_sol.nombre_completo AS solicitante_nombre,
                u_dest.nombre_completo AS destinatario_nombre,
                u_sol.rol AS solicitante_rol
            FROM citas_presenciales cp
            INNER JOIN usuarios u_sol   ON cp.solicitante_id = u_sol.id
            INNER JOIN usuarios u_dest  ON cp.destinatario_id = u_dest.id
            WHERE cp.solicitante_id = :userId OR cp.destinatario_id = :userId
            ORDER BY cp.fecha_hora ASC
        `, {
            replacements: { userId },
            type: QueryTypes.SELECT
        });

        // Determinar perspectiva (recibida vs solicitada)
        const resultado = citas.map(c => ({
            ...c,
            tipo: c.solicitante_id === userId ? 'solicitada' : 'recibida',
            contraparte_nombre: c.solicitante_id === userId
                ? c.destinatario_nombre
                : c.solicitante_nombre
        }));

        return res.status(200).json(resultado);

    } catch (error) {
        console.error('Error al obtener citas del tutor:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 6. SOLICITAR NUEVA CITA (Padre pide reunión con docente)
// El horario disponible del docente se consulta previamente.
// ----------------------------------------------------------------------------
async function solicitarCita(req, res) {
    const solicitanteId = req.user.id;
    const { destinatario_id, fecha_hora, motivo } = req.body;

    if (!destinatario_id || !fecha_hora) {
        return res.status(400).json({ error: 'destinatario_id y fecha_hora son requeridos.' });
    }

    try {
        // Verificar que el horario solicitado esté dentro de los bloques disponibles del docente
        const fechaObj = new Date(fecha_hora);
        const diasEs = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
        const diaNombre = diasEs[fechaObj.getDay()];
        const horaStr = fechaObj.toTimeString().split(' ')[0];

        const disponible = await sequelize.query(`
            SELECT id FROM horarios_disponibles_profesores
            WHERE profesor_id = :destinatario_id
              AND dia_semana = :diaNombre
              AND :horaStr BETWEEN hora_inicio AND hora_fin
            LIMIT 1
        `, {
            replacements: { destinatario_id, diaNombre, horaStr },
            type: QueryTypes.SELECT
        });

        if (disponible.length === 0) {
            return res.status(400).json({
                error: 'El horario seleccionado no está disponible para este docente.',
                suggestion: 'Consulte los horarios disponibles del profesor antes de solicitar la cita.'
            });
        }

        const [result] = await sequelize.query(`
            INSERT INTO citas_presenciales
                (solicitante_id, destinatario_id, fecha_hora, motivo, estado)
            VALUES
                (:solicitanteId, :destinatario_id, :fecha_hora, :motivo, 'Pendiente')
        `, {
            replacements: {
                solicitanteId,
                destinatario_id,
                fecha_hora: fechaObj.toISOString().slice(0, 19).replace('T', ' '),
                motivo: motivo || 'Sin motivo especificado.'
            },
            type: QueryTypes.INSERT
        });

        // Notificar al docente sobre la nueva solicitud de cita
        const [encargado] = await sequelize.query(
            'SELECT codigo_ua, nombre_completo FROM usuarios WHERE id = :solicitanteId',
            { replacements: { solicitanteId }, type: QueryTypes.SELECT }
        );

        eventBroker.emit('notification.create', {
            usuario_id: `UA-${String(destinatario_id).padStart(5, '0')}`, // Aproximación del código UA
            tipo: 'General',
            titulo: 'Nueva Solicitud de Cita',
            mensaje: `El encargado ${encargado?.nombre_completo || 'desconocido'} solicitó una reunión para ${fechaObj.toLocaleString('es-GT')}.`,
            modulo_origen: 'Citas'
        });

        return res.status(201).json({ message: 'Cita solicitada exitosamente.', id: result });

    } catch (error) {
        console.error('Error al solicitar cita:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 7. OBTENER HORARIOS DISPONIBLES DEL DOCENTE (para el selector de calendario)
// Retorna: [{ dia_semana, hora_inicio, hora_fin }]
// ----------------------------------------------------------------------------
async function obtenerHorariosProfesor(req, res) {
    const { profesor_id } = req.params;

    try {
        const horarios = await sequelize.query(`
            SELECT dia_semana, hora_inicio, hora_fin
            FROM horarios_disponibles_profesores
            WHERE profesor_id = :profesor_id
            ORDER BY FIELD(dia_semana, 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'), hora_inicio
        `, {
            replacements: { profesor_id },
            type: QueryTypes.SELECT
        });

        return res.status(200).json(horarios);

    } catch (error) {
        console.error('Error al obtener horarios del profesor:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

module.exports = {
    obtenerCasosTutor,
    crearCaso,
    cerrarCaso,
    reabrirCaso,
    obtenerCitasTutor,
    solicitarCita,
    obtenerHorariosProfesor
};
