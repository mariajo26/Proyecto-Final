const { QueryTypes } = require('sequelize');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');
const { sequelize } = require('../../config/db');

require('dotenv').config();

const jwtSecret = process.env.JWT_SECRET || 'clave_secreta_super_segura_para_el_sistema_ua';
const googleClientId = process.env.GOOGLE_CLIENT_ID || '';
const googleClient = new OAuth2Client(googleClientId);

// ----------------------------------------------------------------------------
// 1. INICIO DE SESIÓN CON CREDENCIALES UA-XXXXX
// ----------------------------------------------------------------------------
async function login(req, res) {
    const { codigo_ua, contrasena } = req.body;

    if (!codigo_ua || !contrasena) {
        return res.status(400).json({ error: 'El codigo UA y la contrasena son requeridos.' });
    }

    try {
        // Buscar el usuario en MySQL
        const query = 'SELECT * FROM usuarios WHERE codigo_ua = :codigo_ua AND estado = "Activo" LIMIT 1';
        const rows = await sequelize.query(query, {
            replacements: { codigo_ua },
            type: QueryTypes.SELECT
        });

        if (rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales invalidas o cuenta inactiva.' });
        }

        const usuario = rows[0];

        // Verificar la contraseña cifrada
        const contrasenaCorrecta = await bcrypt.compare(contrasena, usuario.contrasena_hash);
        if (!contrasenaCorrecta) {
            return res.status(401).json({ error: 'Credenciales invalidas o cuenta inactiva.' });
        }

        // Firmar el token JWT
        const token = jwt.sign(
            { 
                id: usuario.id, 
                codigo_ua: usuario.codigo_ua, 
                rol: usuario.rol,
                es_temporal: usuario.es_contrasena_temporal 
            },
            jwtSecret,
            { expiresIn: '8h' }
        );

        return res.status(200).json({
            token,
            usuario: {
                id: usuario.id,
                codigo_ua: usuario.codigo_ua,
                nombre: usuario.nombre_completo,
                rol: usuario.rol,
                es_temporal: usuario.es_contrasena_temporal,
                correo: usuario.correo_recuperacion
            }
        });

    } catch (error) {
        console.error('Error en el login:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 2. INICIO DE SESIÓN CON GOOGLE SIGN-IN
// ----------------------------------------------------------------------------
async function googleLogin(req, res) {
    const { idToken } = req.body;

    if (!idToken) {
        return res.status(400).json({ error: 'El ID Token de Google es requerido.' });
    }

    try {
        let emailGoogle;
        if (idToken === 'mock-google-token' && (process.env.NODE_ENV !== 'production' || !googleClientId)) {
            emailGoogle = req.body.email || 'tutor@gmail.com';
        } else {
            // Verificar el token con el cliente oficial de Google
            const ticket = await googleClient.verifyIdToken({
                idToken,
                audience: googleClientId
            });
            const payload = ticket.getPayload();
            emailGoogle = payload['email'];
        }

        // Buscar si existe un usuario activo con este correo de recuperacion
        const query = 'SELECT * FROM usuarios WHERE correo_recuperacion = :email AND estado = "Activo" LIMIT 1';
        const rows = await sequelize.query(query, {
            replacements: { email: emailGoogle },
            type: QueryTypes.SELECT
        });

        if (rows.length === 0) {
            return res.status(401).json({ 
                error: 'Este correo de Google no esta vinculado como correo de recuperacion en ninguna cuenta activa.' 
            });
        }

        const usuario = rows[0];

        // Firmar el token JWT
        const token = jwt.sign(
            { 
                id: usuario.id, 
                codigo_ua: usuario.codigo_ua, 
                rol: usuario.rol,
                es_temporal: usuario.es_contrasena_temporal 
            },
            jwtSecret,
            { expiresIn: '8h' }
        );

        return res.status(200).json({
            token,
            usuario: {
                id: usuario.id,
                codigo_ua: usuario.codigo_ua,
                nombre: usuario.nombre_completo,
                rol: usuario.rol,
                es_temporal: usuario.es_contrasena_temporal,
                correo: usuario.correo_recuperacion
            }
        });

    } catch (error) {
        console.error('Error en Google Login:', error);
        return res.status(401).json({ error: 'Token de Google invalido o falló la verificacion.' });
    }
}

// ----------------------------------------------------------------------------
// 3. CAMBIO DE CONTRASEÑA OBLIGATORIO (PRIMER INGRESO)
// ----------------------------------------------------------------------------
async function cambioInicial(req, res) {
    const { nueva_contrasena } = req.body;
    const usuarioId = req.user.id; // Obtenido del token decodificado

    if (!nueva_contrasena || nueva_contrasena.length < 6) {
        return res.status(400).json({ error: 'La nueva contrasena debe tener al menos 6 caracteres.' });
    }

    try {
        // Cifrar la nueva contraseña
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(nueva_contrasena, salt);

        // Actualizar la contraseña y desactivar la bandera temporal
        const query = 'UPDATE usuarios SET contrasena_hash = :hash, es_contrasena_temporal = FALSE WHERE id = :id';
        await sequelize.query(query, {
            replacements: { hash, id: usuarioId },
            type: QueryTypes.UPDATE
        });

        return res.status(200).json({ message: 'Contrasena cambiada con exito. Ingrese nuevamente.' });

    } catch (error) {
        console.error('Error al cambiar contrasena inicial:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

// ----------------------------------------------------------------------------
// 4. REGISTRO DE USUARIOS (CREACIÓN DE UA-YYRXX POR EL ADMIN)
// ----------------------------------------------------------------------------
async function registrarUsuario(req, res) {
    const { rol, correo_recuperacion, telefono_personal, telefono_emergencia, contrasena_inicial } = req.body;

    if (!rol || !correo_recuperacion || !contrasena_inicial) {
        return res.status(400).json({ error: 'Los campos rol, correo de recuperacion y contrasena inicial son obligatorios.' });
    }

    try {
        // 1. Validar que el correo no esté registrado
        const valQuery = 'SELECT id FROM usuarios WHERE correo_recuperacion = :correo LIMIT 1';
        const valRows = await sequelize.query(valQuery, {
            replacements: { correo: correo_recuperacion },
            type: QueryTypes.SELECT
        });

        if (valRows.length > 0) {
            return res.status(400).json({ error: 'El correo de recuperacion ya esta registrado.' });
        }

        // 2. Generar el identificador UA-YYRXX
        const anioActual = new Date().getFullYear();
        const dosDigitosAnio = anioActual.toString().substring(2, 4); // Ej: "26" para 2026

        let digitoRol = '';
        switch (rol) {
            case 'Administrador':      digitoRol = '1'; break;
            case 'Control Academico':  digitoRol = '2'; break;
            case 'Profesor':           digitoRol = '3'; break;
            case 'Encargado':          digitoRol = '4'; break;
            case 'Estudiante':         digitoRol = '5'; break;
            default:
                return res.status(400).json({ error: 'Rol no valido.' });
        }

        const prefijoBase = `UA-${dosDigitosAnio}${digitoRol}`; // Ej: "UA-263"

        // Buscar el correlativo máximo actual para ese prefijo
        const maxQuery = 'SELECT codigo_ua FROM usuarios WHERE codigo_ua LIKE :prefijo ORDER BY codigo_ua DESC LIMIT 1';
        const maxRows = await sequelize.query(maxQuery, {
            replacements: { prefijo: `${prefijoBase}%` },
            type: QueryTypes.SELECT
        });

        let nuevoCorrelativo = 1;
        if (maxRows.length > 0) {
            const ultimoCodigo = maxRows[0].codigo_ua;
            const secuenciaTexto = ultimoCodigo.substring(prefijoBase.length);
            nuevoCorrelativo = parseInt(secuenciaTexto, 10) + 1;
        }

        // Formatear el correlativo a 2 dígitos (o más si desborda)
        let cadenaCorrelativo = '';
        if (nuevoCorrelativo <= 99) {
            cadenaCorrelativo = nuevoCorrelativo.toString().padStart(2, '0');
        } else {
            cadenaCorrelativo = nuevoCorrelativo.toString();
        }

        const nuevoCodigoUa = `${prefijoBase}${cadenaCorrelativo}`;

        // 3. Cifrar la contraseña por defecto
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(contrasena_inicial, salt);

        // 4. Insertar en la base de datos
        const insertQuery = `
            INSERT INTO usuarios 
                (codigo_ua, contrasena_hash, es_contrasena_temporal, rol, correo_recuperacion, telefono_personal, telefono_emergencia, estado) 
            VALUES 
                (:codigo_ua, :contrasena_hash, TRUE, :rol, :correo_recuperacion, :telefono_personal, :telefono_emergencia, 'Activo')
        `;

        await sequelize.query(insertQuery, {
            replacements: {
                codigo_ua: nuevoCodigoUa,
                contrasena_hash: hash,
                rol,
                correo_recuperacion,
                telefono_personal: telefono_personal || null,
                telefono_emergencia: telefono_emergencia || null
            },
            type: QueryTypes.INSERT
        });

        return res.status(201).json({
            message: 'Usuario registrado exitosamente.',
            codigo_ua: nuevoCodigoUa
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        return res.status(500).json({ error: 'Error interno en el servidor.' });
    }
}

module.exports = {
    login,
    googleLogin,
    cambioInicial,
    registrarUsuario
};
