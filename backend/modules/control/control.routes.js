const express = require('express');
const {
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
} = require('./control.controller');
const { verifyToken, authorizeRoles } = require('../../middlewares/auth');

const router = express.Router();

// Todos los endpoints de este router son exclusivos para Secretaría / Control Académico y Administradores.
const allowedRoles = ['Control Academico', 'Administrador'];

// ── Gestión de Alumnos y Familias ────────────────────────────────────────────
router.get('/alumnos', verifyToken, authorizeRoles(...allowedRoles), obtenerAlumnos);
router.get('/alumnos/:id/perfil', verifyToken, authorizeRoles(...allowedRoles), obtenerPerfilEstudiante);
router.get('/tutores/:id/perfil', verifyToken, authorizeRoles(...allowedRoles), obtenerPerfilTutor);
router.put('/alumnos/:estudiante_id/tutores/:tutor_id/privacidad', verifyToken, authorizeRoles(...allowedRoles), actualizarPrivacidadEncargado);

// ── Personal y Horarios (Profesores) ─────────────────────────────────────────
router.get('/profesores', verifyToken, authorizeRoles(...allowedRoles), obtenerProfesores);
router.get('/profesores/:id/horarios', verifyToken, authorizeRoles(...allowedRoles), obtenerHorarioProfesor);
router.get('/grados', verifyToken, authorizeRoles(...allowedRoles), obtenerGrados);

// ── Control de Asistencia Diaria ─────────────────────────────────────────────
router.get('/asistencia', verifyToken, authorizeRoles(...allowedRoles), obtenerAsistenciaDiaria);
router.post('/asistencia/notificar', verifyToken, authorizeRoles(...allowedRoles), notificarFaltas);

// ── Gestión de Incidentes y Casos ────────────────────────────────────────────
router.get('/quejas', verifyToken, authorizeRoles(...allowedRoles), obtenerIncidentesControl);
router.post('/quejas/presencial', verifyToken, authorizeRoles(...allowedRoles), registrarIncidentePresencial);
router.put('/quejas/:id/resolver', verifyToken, authorizeRoles(...allowedRoles), resolverCasoControl);

// ── Centro de Citas ──────────────────────────────────────────────────────────
router.get('/citas', verifyToken, authorizeRoles(...allowedRoles), obtenerCitasControl);
router.put('/citas/:id/estado', verifyToken, authorizeRoles(...allowedRoles), actualizarCitaControl);

// ── Circulares de Control ────────────────────────────────────────────────────
router.get('/circulares', verifyToken, authorizeRoles(...allowedRoles), obtenerCircularesControl);

module.exports = router;
