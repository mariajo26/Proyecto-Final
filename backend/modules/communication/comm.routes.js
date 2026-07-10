const express = require('express');
const { 
    obtenerForos, 
    enviarMensaje, 
    crearCircular, 
    publicarCircular, 
    autorizarCircularVirtual,
    obtenerNotificaciones,
    obtenerMensajesRecientes
} = require('./comm.controller');
const { verifyToken, authorizeRoles } = require('../../middlewares/auth');

const router = express.Router();

// Consulta de Foros (Cualquier rol autenticado)
router.get('/foros', verifyToken, obtenerForos);

// Enviar Mensaje Directo (Cualquier rol autenticado)
router.post('/mensajes', verifyToken, enviarMensaje);

// Obtener Notificaciones Recientes (Cualquier rol autenticado)
router.get('/notifications', verifyToken, obtenerNotificaciones);

// Obtener Mensajes Recientes (Cualquier rol autenticado)
router.get('/messages', verifyToken, obtenerMensajesRecientes);

// Módulo de Circulares - Crear y publicar (Solo Secretaría y Admin)
router.post('/circulares', verifyToken, authorizeRoles('Control Academico', 'Administrador'), crearCircular);
router.put('/circulares/:circular_id/publicar', verifyToken, authorizeRoles('Control Academico', 'Administrador'), publicarCircular);

// Módulo de Circulares - Firmar digitalmente (Solo Encargados/Padres)
router.put('/circulares/autorizar', verifyToken, authorizeRoles('Encargado'), autorizarCircularVirtual);

module.exports = router;
