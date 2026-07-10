const express = require('express');
const { 
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
    obtenerCircularesTutor,
    marcarCircularLeida,
    rechazarCircularTutor,
    eliminarCircular,
    registrarFirmaFisica,
    moderarForo
} = require('./comm.controller');
const { verifyToken, authorizeRoles } = require('../../middlewares/auth');

const router = express.Router();

// Consulta de Foros (Cualquier rol autenticado)
router.get('/foros', verifyToken, obtenerForos);
router.get('/foros/:foro_id/hilos', verifyToken, obtenerHilos);
router.post('/foros/:foro_id/hilos', verifyToken, crearHilo);
router.get('/hilos/:hilo_id/comentarios', verifyToken, obtenerComentarios);
router.post('/hilos/:hilo_id/comentarios', verifyToken, crearComentario);

// Rutas directas para el listado de todos los hilos
router.get('/hilos', verifyToken, obtenerTodosLosHilos);
router.post('/hilos', verifyToken, crearHiloDocente);

// Enviar Mensaje Directo (Cualquier rol autenticado)
router.post('/mensajes', verifyToken, enviarMensaje);

// Obtener Historial de Conversación
router.get('/messages/:interlocutor_ua', verifyToken, obtenerConversacion);

// Obtener Notificaciones Recientes (Cualquier rol autenticado)
router.get('/notifications', verifyToken, obtenerNotificaciones);
router.put('/notifications/read-all', verifyToken, marcarTodasNotificacionesLeidas);
router.put('/notifications/:id/read', verifyToken, marcarNotificacionLeida);

// Obtener Mensajes Recientes (Cualquier rol autenticado)
router.get('/messages', verifyToken, obtenerMensajesRecientes);

// Módulo de Circulares - Crear y publicar (Solo Secretaría y Admin)
router.post('/circulares', verifyToken, authorizeRoles('Control Academico', 'Administrador'), crearCircular);
router.put('/circulares/:circular_id/publicar', verifyToken, authorizeRoles('Control Academico', 'Administrador'), publicarCircular);

// Módulo de Circulares - Firmar digitalmente (Solo Encargados/Padres)
router.put('/circulares/autorizar', verifyToken, authorizeRoles('Encargado'), autorizarCircularVirtual);

// ── Módulo Tutor: Circulares y Firmas ────────────────────────────────────────
// GET  lista de circulares del padre (informativas + autorizaciones propias)
router.get('/circulares/tutor', verifyToken, authorizeRoles('Encargado'), obtenerCircularesTutor);

// PUT  marcar circular informativa como leida (auto-trigger al abrir el PDF)
router.put('/circulares/:circular_id/leer', verifyToken, authorizeRoles('Encargado'), marcarCircularLeida);

// PUT  rechazar autorización de circular (padre no autoriza)
router.put('/circulares/:circular_id/rechazar', verifyToken, authorizeRoles('Encargado'), rechazarCircularTutor);

// ── Módulo Secretaría/Administración ─────────────────────────────────────────
// DELETE circular
router.delete('/circulares/:circular_id', verifyToken, authorizeRoles('Control Academico', 'Administrador'), eliminarCircular);

// PUT registrar boleta física firmada en papel
router.put('/circulares/:circular_id/firma-fisica', verifyToken, authorizeRoles('Control Academico'), registrarFirmaFisica);

// POST moderación de foros
router.post('/foros/moderar', verifyToken, authorizeRoles('Control Academico'), moderarForo);

module.exports = router;
