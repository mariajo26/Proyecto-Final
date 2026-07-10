const express = require('express');
const {
    obtenerCasosTutor,
    crearCaso,
    cerrarCaso,
    reabrirCaso,
    obtenerCitasTutor,
    solicitarCita,
    obtenerHorariosProfesor
} = require('./incidentes.controller');
const { verifyToken, authorizeRoles } = require('../../middlewares/auth');

const router = express.Router();

// ── Incidentes y Quejas ──────────────────────────────────────────────────────

// GET  todos los casos del padre autenticado
router.get('/tutor', verifyToken, authorizeRoles('Encargado'), obtenerCasosTutor);

// POST crear nueva queja/incidente (destino: Profesor o Secretaria)
router.post('/tutor', verifyToken, authorizeRoles('Encargado'), crearCaso);

// PUT  padre cierra el caso (FSM: Resuelto → Cerrado)
router.put('/:id/cerrar', verifyToken, authorizeRoles('Encargado'), cerrarCaso);

// PUT  padre reabre el caso si no está de acuerdo (FSM: Resuelto → Reabierto)
router.put('/:id/reabrir', verifyToken, authorizeRoles('Encargado'), reabrirCaso);

// ── Citas Presenciales ───────────────────────────────────────────────────────

// GET  lista de citas del padre (recibidas del profesor + solicitadas por él)
router.get('/citas/tutor', verifyToken, authorizeRoles('Encargado'), obtenerCitasTutor);

// POST solicitar nueva cita con un docente (validando horarios disponibles)
router.post('/citas', verifyToken, authorizeRoles('Encargado'), solicitarCita);

// GET  horarios disponibles de un profesor para mostrar el selector en el frontend
router.get('/citas/horarios/:profesor_id', verifyToken, authorizeRoles('Encargado'), obtenerHorariosProfesor);

module.exports = router;
