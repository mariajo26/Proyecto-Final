const express = require('express');
const { login, googleLogin, cambioInicial, registrarUsuario } = require('./auth.controller');
const { verifyToken, authorizeRoles } = require('../../middlewares/auth');

const router = express.Router();

// Rutas públicas
router.post('/login', login);
router.post('/google', googleLogin);

// Rutas protegidas generales (Requiere estar logueado, permite cambio inicial incluso si tiene clave temporal)
router.put('/cambio-inicial', verifyToken, cambioInicial);

// Ruta protegida exclusiva para Administradores (Crea usuarios)
router.post('/registro', verifyToken, authorizeRoles('Administrador'), registrarUsuario);

module.exports = router;
