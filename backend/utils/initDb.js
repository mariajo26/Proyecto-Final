const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

// ----------------------------------------------------------------------------
// SCRIPT DE INICIALIZACIÓN AUTOMÁTICA DE BASE DE DATOS Y SEED DATA (UA)
// Crea la base de datos, ejecuta el esquema SQL e inserta usuarios de prueba.
// ----------------------------------------------------------------------------
async function inicializarBaseDatos() {
    let connection;
    try {
        console.log('[INIT DB] Conectando al servidor MySQL local para inicializar...');
        
        // Conexión inicial sin especificar base de datos para poder crearla
        connection = await mysql.createConnection({
            host: process.env.MYSQL_HOST || 'localhost',
            port: process.env.MYSQL_PORT || 3306,
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || ''
        });

        const dbName = process.env.MYSQL_DB || 'plataforma_estudiantil';
        
        // Re-crear base de datos de forma limpia
        await connection.query(`DROP DATABASE IF EXISTS ${dbName};`);
        await connection.query(`CREATE DATABASE ${dbName} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
        console.log(`[INIT DB] Base de datos '${dbName}' recreada de forma limpia.`);
        
        await connection.query(`USE ${dbName};`);

        // Leer el archivo schema.sql
        const sqlPath = path.join(__dirname, '../../database/schema.sql');
        if (!fs.existsSync(sqlPath)) {
            throw new Error(`No se encontro el archivo schema.sql en la ruta: ${sqlPath}`);
        }

        const sqlContent = fs.readFileSync(sqlPath, 'utf8');

        // Limpiar comentarios de linea para evitar errores de sintaxis al dividir
        const sqlLines = sqlContent.split('\n');
        const cleanLines = sqlLines.map(line => {
            const trimmed = line.trim();
            if (trimmed.startsWith('--')) {
                return ''; // Eliminar comentarios
            }
            return line;
        });

        // Reunir y dividir por punto y coma al final de linea
        const cleanSql = cleanLines.join('\n');
        const statements = cleanSql.split(/;\s*$/m);

        console.log(`[INIT DB] Ejecutando ${statements.length} sentencias SQL del esquema...`);

        for (let statement of statements) {
            statement = statement.trim();
            if (statement) {
                try {
                    await connection.query(statement);
                } catch (stmtError) {
                    console.warn(`[WARNING] Error en sentencia: ${statement.substring(0, 50)}... ->`, stmtError.message);
                }
            }
        }

        // Insertar usuarios semilla de prueba para la evaluacion con contraseñas encriptadas
        console.log('[INIT DB] Creando usuarios semilla de prueba...');

        const usersSeed = [
            { codigo: 'UA-26101', rol: 'Administrador', correo: 'admin@ua.edu.gt', clave: 'admin123', temp: false },
            { codigo: 'UA-26301', rol: 'Profesor', correo: 'profesor@ua.edu.gt', clave: 'profe123', temp: false },
            { codigo: 'UA-26501', rol: 'Estudiante', correo: 'estudiante@ua.edu.gt', clave: 'estudiante123', temp: true }, // Contraseña temporal
            { codigo: 'UA-26401', rol: 'Encargado', correo: 'tutor@gmail.com', clave: 'tutor123', temp: false }
        ];

        for (const u of usersSeed) {
            const hash = bcrypt.hashSync(u.clave, 10);
            const insertUserQuery = `
                INSERT INTO usuarios (codigo_ua, contrasena_hash, es_contrasena_temporal, rol, correo_recuperacion, estado)
                VALUES (?, ?, ?, ?, ?, 'Activo')
                ON DUPLICATE KEY UPDATE contrasena_hash = VALUES(contrasena_hash), es_contrasena_temporal = VALUES(es_contrasena_temporal);
            `;
            await connection.query(insertUserQuery, [u.codigo, hash, u.temp, u.rol, u.correo]);
            console.log(`[INIT DB] Usuario creado: Código ${u.codigo} (Rol: ${u.rol}) | Contraseña original: ${u.clave}`);
        }

        console.log('[INIT DB] Base de datos e inserciones semilla cargadas con exito.');

    } catch (error) {
        console.error('[INIT DB ERROR] Error al inicializar base de datos:', error);
    } finally {
        if (connection) {
            await connection.end();
            console.log('[INIT DB] Conexion MySQL cerrada.');
        }
    }
}

inicializarBaseDatos();
