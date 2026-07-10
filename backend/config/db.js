const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
require('dotenv').config();

// ----------------------------------------------------------------------------
// 1. CONFIGURACIÓN DE SEQUELIZE (MYSQL)
// Railway inyecta: MYSQLHOST, MYSQLUSER, MYSQLPASSWORD, MYSQLDATABASE, MYSQLPORT
// Variables locales (fallback): MYSQL_HOST, MYSQL_USER, MYSQL_PASSWORD, MYSQL_DB, MYSQL_PORT
// ----------------------------------------------------------------------------
const dbName     = process.env.MYSQLDATABASE || process.env.MYSQL_DB       || 'plataforma_estudiantil';
const dbUser     = process.env.MYSQLUSER     || process.env.MYSQL_USER      || 'root';
const dbPassword = process.env.MYSQLPASSWORD || process.env.MYSQL_PASSWORD  || '';
const dbHost     = process.env.MYSQLHOST     || process.env.MYSQL_HOST      || 'localhost';
const dbPort     = parseInt(process.env.MYSQLPORT || process.env.MYSQL_PORT || '3306', 10);

const sequelizeConfig = {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false,
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: false,
        freezeTableName: true
    }
};

// Railway puede proveer una DATABASE_URL directa (MySQL)
let sequelize;
if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('mysql')) {
    sequelize = new Sequelize(process.env.DATABASE_URL, {
        dialect: 'mysql',
        logging: false,
        pool: sequelizeConfig.pool,
        define: sequelizeConfig.define
    });
} else {
    sequelize = new Sequelize(dbName, dbUser, dbPassword, sequelizeConfig);
}

// ----------------------------------------------------------------------------
// 2. CONFIGURACIÓN DE MONGOOSE (MONGODB ATLAS)
// ----------------------------------------------------------------------------
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plataforma_estudiantil';

// ----------------------------------------------------------------------------
// 3. FUNCIÓN DE CONEXIÓN CONCURRENTE
// ----------------------------------------------------------------------------
async function initializeDatabases() {
    try {
        console.log('[DB] Iniciando conexiones concurrentes...');

        const connections = await Promise.all([
            sequelize.authenticate().then(() => {
                console.log('[DB] MySQL conectado correctamente.');
                return 'mysql';
            }),
            mongoose.connect(mongoUri).then(() => {
                console.log('[DB] MongoDB conectado correctamente.');
                return 'mongodb';
            })
        ]);

        console.log('[DB] Bases de datos inicializadas:', connections);
        return { sequelize, mongoose };
    } catch (error) {
        console.error('[DB] Error crítico al conectar:', error.message);
        throw error;
    }
}

module.exports = { sequelize, mongoose, initializeDatabases };
