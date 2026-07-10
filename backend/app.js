const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initializeDatabases } = require('./config/db');

const app = express();

// ----------------------------------------------------------------------------
// CORS — Permite el dominio de producción en Vercel y localhost en desarrollo
// ----------------------------------------------------------------------------
const allowedOrigins = [
    'http://localhost:3000',
    'http://localhost:5173',
    process.env.FRONTEND_URL || ''
].filter(Boolean);

app.use(cors({
    origin: function (origin, callback) {
        // Permite peticiones sin origin (ej: Postman, curl) o dominios *.vercel.app
        if (!origin || allowedOrigins.includes(origin) || /\.vercel\.app$/.test(origin)) {
            callback(null, true);
        } else {
            callback(new Error('CORS: Origen no permitido: ' + origin));
        }
    },
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
}));

app.use(express.json());

// ----------------------------------------------------------------------------
// WEBSOCKETS — Solo se inicializan en entorno local (no compatible con Serverless)
// ----------------------------------------------------------------------------
let io = null;
if (!process.env.VERCEL) {
    const http = require('http');
    const { Server } = require('socket.io');
    const server = http.createServer(app);
    io = new Server(server, {
        cors: { origin: '*', methods: ['GET', 'POST'] }
    });

    io.on('connection', (socket) => {
        console.log(`[WS] Usuario conectado: ${socket.id}`);
        socket.on('join_room', (room) => {
            socket.join(room);
            console.log(`[WS] Socket ${socket.id} se unió a la sala: ${room}`);
        });
        socket.on('disconnect', () => {
            console.log(`[WS] Usuario desconectado: ${socket.id}`);
        });
    });

    const port = process.env.PORT || 5000;
    initializeDatabases()
        .then(() => {
            server.listen(port, () => {
                console.log(`[SERVER] Escuchando en el puerto ${port}`);
            });
        })
        .catch(err => {
            console.error('[SERVER] Error crítico al conectar bases de datos:', err);
            process.exit(1);
        });
} else {
    // En Vercel: inicializar conexión de base de datos de forma lazy (sin listen)
    initializeDatabases()
        .then(() => console.log('[VERCEL] Conexiones de base de datos listas.'))
        .catch(err => console.error('[VERCEL] Error al inicializar bases de datos:', err));
}

app.set('io', io);

// ----------------------------------------------------------------------------
// HEALTH CHECK
// ----------------------------------------------------------------------------
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'online', env: process.env.VERCEL ? 'vercel' : 'local' });
});

// ----------------------------------------------------------------------------
// RUTAS MODULARES
// ----------------------------------------------------------------------------
try {
    app.use('/api/auth', require('./modules/auth/auth.routes'));
    app.use('/api/asistencias', require('./modules/attendance/attendance.routes'));
    app.use('/api/calificaciones', require('./modules/grades/grades.routes'));
    app.use('/api/comunicacion', require('./modules/communication/comm.routes'));
    app.use('/api/incidentes', require('./modules/incidentes/incidentes.routes'));
    app.use('/api/control', require('./modules/control/control.routes'));
} catch (err) {
    console.error('[ROUTES] Error al cargar las rutas modulares:', err.message);
}

// ----------------------------------------------------------------------------
// MANEJADOR DE ERRORES GLOBAL
// ----------------------------------------------------------------------------
app.use((err, req, res, next) => {
    console.error('[ERROR]', err.message);
    res.status(err.status || 500).json({ error: err.message || 'Error interno del servidor' });
});

module.exports = app;
