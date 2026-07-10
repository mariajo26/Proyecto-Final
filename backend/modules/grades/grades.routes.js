const express = require('express');
const { 
    crearActividad, 
    evaluarEntrega, 
    registrarExcepcion,
    obtenerEstudiantesTutor,
    obtenerRendimientoEstudiante,
    eliminarActividad
} = require('./grades.controller');
const { verifyToken, authorizeRoles } = require('../../middlewares/auth');

const router = express.Router();

// Creación de tareas o evaluaciones (Solo Profesores)
router.post('/actividades', verifyToken, authorizeRoles('Profesor'), crearActividad);
router.delete('/actividades/:id', verifyToken, authorizeRoles('Profesor'), eliminarActividad);

// Calificación y evaluación de entregas (Solo Profesores)
router.put('/evaluar', verifyToken, authorizeRoles('Profesor'), evaluarEntrega);

// Registro de excepción manual / caso especial (Solo Profesores)
router.post('/excepcion', verifyToken, authorizeRoles('Profesor'), registrarExcepcion);

// Rutas para Tutor (Encargado)
router.get('/tutor/estudiantes', verifyToken, authorizeRoles('Encargado'), obtenerEstudiantesTutor);
router.get('/tutor/rendimiento/:estudiante_id', verifyToken, authorizeRoles('Encargado'), obtenerRendimientoEstudiante);

module.exports = router;
