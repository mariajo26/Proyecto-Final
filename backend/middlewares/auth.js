const jwt = require('jsonwebtoken');
require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET || 'clave_secreta_super_segura_para_el_sistema_ua';

// ----------------------------------------------------------------------------
// MIDDLEWARE: VERIFICACIÓN GENERAL DE JWT
// ----------------------------------------------------------------------------
function verifyToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    
    if (!authHeader) {
        return res.status(401).json({ error: 'Acceso denegado. Token no proporcionado.' });
    }

    const parts = authHeader.split(' ');
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
        return res.status(401).json({ error: 'Formato de token inválido. Debe ser Bearer [Token].' });
    }

    const token = parts[1];

    try {
        const decoded = jwt.verify(token, jwtSecret);
        
        // Adjuntar los datos decodificados del usuario a la solicitud
        req.user = decoded; // Contiene: id, codigo_ua, rol, es_temporal
        
        // Impedir que un usuario con contraseña temporal acceda a otras rutas que no sean cambiar contraseña
        if (req.user.es_temporal && req.path !== '/cambio-inicial') {
            return res.status(403).json({ 
                error: 'Contraseña temporal activa. Debe cambiar su contraseña antes de continuar.',
                requiereCambioContrasena: true
            });
        }

        next();
    } catch (error) {
        return res.status(401).json({ error: 'Token expirado o inválido de autenticación.' });
    }
}

// ----------------------------------------------------------------------------
// MIDDLEWARE: FILTRO POR ROLES (ROLE GUARD)
// ----------------------------------------------------------------------------
function authorizeRoles(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado para esta operación.' });
        }

        const userRole = req.user.rol;
        
        if (!allowedRoles.includes(userRole)) {
            return res.status(403).json({ 
                error: `Acceso prohibido. Su rol '${userRole}' no cuenta con los permisos necesarios.` 
            });
        }

        next();
    };
}

module.exports = {
    verifyToken,
    authorizeRoles
};
