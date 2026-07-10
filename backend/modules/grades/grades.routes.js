const express = require('express');
const { crearActividad, evaluarEntrega, registrarExcepcion } = require('./grades.controller');
const { verifyToken, authorizeRoles } = require('../../middlewares/auth');

const router = express.Router();

// Creación de tareas o evaluaciones (Solo Profesores)
router.post('/actividades', verifyToken, authorizeRoles('Profesor'), crearActividad);

// Calificación y evaluación de entregas (Solo Profesores)
router.put('/evaluar', verifyToken, authorizeRoles('Profesor'), evaluarEntrega);

// Registro de excepción manual / caso especial (Solo Profesores)
router.post('/excepcion', verifyToken, authorizeRoles('Profesor'), registrarExcepcion);

module.exports = router;
