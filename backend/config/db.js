const { Sequelize } = require('sequelize');
const mongoose = require('mongoose');
require('dotenv').config();

// ----------------------------------------------------------------------------
// 1. CONFIGURACIÓN DE SEQUELIZE (MYSQL)
// ----------------------------------------------------------------------------
const dbName = process.env.MYSQL_DB || 'plataforma_estudiantil';
const dbUser = process.env.MYSQL_USER || 'root';
const dbPassword = process.env.MYSQL_PASSWORD || '';
const dbHost = process.env.MYSQL_HOST || 'localhost';
const dbPort = process.env.MYSQL_PORT || 3306;

const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false, // Cambiar a console.log para depuración local
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    },
    define: {
        timestamps: false, // Desactivar marcas de tiempo automáticas globales
        freezeTableName: true // Evitar la pluralización automática de las tablas
    }
});

// ----------------------------------------------------------------------------
// 2. CONFIGURACIÓN DE MONGOOSE (MONGODB)
// ----------------------------------------------------------------------------
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plataforma_estudiantil';

// ----------------------------------------------------------------------------
// 3. FUNCIÓN DE CONEXIÓN CONCURRENTE
// ----------------------------------------------------------------------------
async function initializeDatabases() {
    try {
        console.log('Iniciando conexiones concurrentes de bases de datos...');

        // Ejecutar las promesas de conexión de forma concurrente
        const connections = await Promise.all([
            sequelize.authenticate().then(() => {
                console.log('Conexión a MySQL establecida correctamente (Sequelize).');
                return 'mysql';
            }),
            mongoose.connect(mongoUri).then(() => {
                console.log('Conexión a MongoDB establecida correctamente (Mongoose).');
                return 'mongodb';
            })
        ]);

        console.log('Ambas bases de datos se han inicializado correctamente:', connections);
        return { sequelize, mongoose };
    } catch (error) {
        console.error('Error crítico al conectar con las bases de datos:', error);
        throw error;
    }
}

module.exports = {
    sequelize,
    mongoose,
    initializeDatabases
};
