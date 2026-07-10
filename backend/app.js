const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { sequelize, initializeDatabases } = require('./config/db');

const app = express();
const port = process.env.PORT || 5000;

// Configurar middlewares globales de la aplicacion
app.use(express.json());
app.use(cors());

// ----------------------------------------------------------------------------
// CONEXIÓN CONCURRENTE A LAS BASES DE DATOS (MYSQL Y MONGODB)
// ----------------------------------------------------------------------------
async function connectDatabases() {
    try {
        // Inicializar las conexiones unificadas definidas en backend/config/db.js
        await initializeDatabases();
        
        console.log('Servidor en linea: Conexion establecida exitosamente con MySQL (Sequelize) y MongoDB (Mongoose).');
        
        // Levantar el servidor Express una vez que las conexiones estan listas
        app.listen(port, () => {
            console.log(`[SERVER] Monolito Modular escuchando en el puerto ${port}`);
        });

    } catch (error) {
        console.error('Error critico al conectar con las bases de datos en el arranque:', error);
        process.exit(1);
    }
}

// ----------------------------------------------------------------------------
// RUTAS Y ENDPOINTS DE PRUEBA
// ----------------------------------------------------------------------------

// Endpoint de prueba inicial para diagnostico del estado de ejecucion
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'online' });
});

// Enlace de las rutas de modulos del monolito modular
try {
    const authRoutes = require('./modules/auth/auth.routes');
    const attendanceRoutes = require('./modules/attendance/attendance.routes');
    const gradesRoutes = require('./modules/grades/grades.routes');
    const commRoutes = require('./modules/communication/comm.routes');

    app.use('/api/auth', authRoutes);
    app.use('/api/asistencias', attendanceRoutes);
    app.use('/api/calificaciones', gradesRoutes);
    app.use('/api/comunicacion', commRoutes);
} catch (err) {
    console.error('Error al cargar las rutas modulares:', err);
}

// Arrancar el proceso de conexion y escucha
connectDatabases();

module.exports = app;
