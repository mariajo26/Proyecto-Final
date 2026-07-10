const express = require('express');
const { 
    registrarAsistenciaPeriodo, 
    justificarFalta, 
    resolverJustificacion, 
    obtenerAsistenciaEstudiante,
    obtenerMisCursos,
    obtenerAlumnosDeCurso
} = require('./attendance.controller');
const { verifyToken, authorizeRoles } = require('../../middlewares/auth');

const router = express.Router();

// Registro de asistencia por periodo (Solo Profesores)
router.post('/periodo', verifyToken, authorizeRoles('Profesor'), registrarAsistenciaPeriodo);

// Envío de justificaciones (Solo Encargados/Padres)
router.post('/justificar', verifyToken, authorizeRoles('Encargado'), justificarFalta);

// Resolución de justificaciones (Profesores y Control Académico)
router.put('/justificar/resolver', verifyToken, authorizeRoles('Profesor', 'Control Academico'), resolverJustificacion);

// Consulta de asistencia del estudiante (Todos los roles autorizados)
router.get('/estudiante/:studentId', verifyToken, obtenerAsistenciaEstudiante);

// Cursos asignados al profesor autenticado
router.get('/mis-cursos', verifyToken, authorizeRoles('Profesor'), obtenerMisCursos);

// Alumnos de un curso con asistencia general del día
router.get('/curso/:cursoId/alumnos', verifyToken, authorizeRoles('Profesor'), obtenerAlumnosDeCurso);

module.exports = router;
