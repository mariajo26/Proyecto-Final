// ============================================================================
// ESQUEMAS DE MONGOOSE (MONGODB) PARA LA PLATAFORMA ESTUDIANTIL
// Librería: Mongoose (Node.js ODM)
// Arquitectura: Monolito Modular - Datos de Foros, Mensajes y Circulares
// ============================================================================

const mongoose = require('mongoose');
const { Schema } = mongoose;

// ----------------------------------------------------------------------------
// 1. ESQUEMA DE MENSAJERÍA DIRECTA
// Almacena chats en tiempo real entre Encargados, Profesores y Secretaría.
// ----------------------------------------------------------------------------
const MensajeDirectoSchema = new Schema({
    emisor_id: { 
        type: String, 
        required: true, 
        index: true,
        match: /^UA-\d{5,6}$/ // Validación del código único de usuario (UA-YYRXX)
    },
    receptor_id: { 
        type: String, 
        required: true, 
        index: true,
        match: /^UA-\d{5,6}$/
    },
    contenido: { 
        type: String, 
        required: true,
        trim: true
    },
    adjuntos: [{
        url: { type: String, required: true },
        tipo: { type: String, enum: ['imagen', 'pdf', 'documento'], required: true }
    }],
    leido: { 
        type: Boolean, 
        default: false 
    },
    fecha_envio: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

// Índice compuesto para acelerar la carga de conversaciones bilaterales ordenadas por fecha
MensajeDirectoSchema.index({ emisor_id: 1, receptor_id: 1, fecha_envio: -1 });

// ----------------------------------------------------------------------------
// 2. ESQUEMA DE FOROS DE COMUNIDAD Y ACADÉMICOS
// Canales de discusión por grado, temáticos o para tareas grupales.
// ----------------------------------------------------------------------------
const ForoSchema = new Schema({
    nombre: { 
        type: String, 
        required: true, 
        trim: true 
    },
    descripcion: { 
        type: String, 
        trim: true 
    },
    tipo: { 
        type: String, 
        enum: ['GradoSeccion', 'Tematico', 'GrupoTareas'], 
        required: true 
    },
    // Solo aplica para foros de tipo 'GradoSeccion' (se auto-asocian a los alumnos matriculados)
    grado_seccion: {
        grado: { type: String },
        seccion: { type: String }
    },
    creador_id: { 
        type: String, 
        required: true, 
        match: /^UA-\d{5,6}$/ 
    },
    // IDs de usuarios con acceso explícito (para foros temáticos o tareas grupales)
    miembros: [{ 
        type: String, 
        match: /^UA-\d{5,6}$/ 
    }],
    estado: { 
        type: String, 
        enum: ['Activo', 'Archivado'], 
        default: 'Activo' 
    },
    creado_en: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

// Índices para búsquedas de foros asignados a estudiantes/grados
ForoSchema.index({ 'grado_seccion.grado': 1, 'grado_seccion.seccion': 1 });
ForoSchema.index({ miembros: 1 });

// ----------------------------------------------------------------------------
// 3. ESQUEMA DE HILOS DE DISCUSIÓN (Dentro de un Foro)
// ----------------------------------------------------------------------------
const HiloDiscusionSchema = new Schema({
    foro_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'Foro', 
        required: true,
        index: true 
    },
    titulo: { 
        type: String, 
        required: true, 
        trim: true 
    },
    contenido: { 
        type: String, 
        required: true 
    },
    creador_id: { 
        type: String, 
        required: true,
        match: /^UA-\d{5,6}$/ 
    },
    adjuntos: [{ type: String }], // URLs de archivos complementarios
    cerrado: { 
        type: Boolean, 
        default: false // Si es true, bloquea nuevos comentarios
    },
    creado_en: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

// ----------------------------------------------------------------------------
// 4. ESQUEMA DE COMENTARIOS (Respuestas en un Hilo)
// ----------------------------------------------------------------------------
const ComentarioSchema = new Schema({
    hilo_id: { 
        type: Schema.Types.ObjectId, 
        ref: 'HiloDiscusion', 
        required: true,
        index: true
    },
    autor_id: { 
        type: String, 
        required: true,
        match: /^UA-\d{5,6}$/ 
    },
    contenido: { 
        type: String, 
        required: true 
    },
    creado_en: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

// ----------------------------------------------------------------------------
// 5. ESQUEMA DE CIRCULARES Y AUTORIZACIONES (Ciclo de Vida del Consentimiento)
// ----------------------------------------------------------------------------
const CircularSchema = new Schema({
    titulo: { 
        type: String, 
        required: true, 
        trim: true 
    },
    contenido: { 
        type: String, 
        required: true 
    },
    tipo: { 
        type: String, 
        enum: ['Informativa', 'Autorizacion'], 
        required: true 
    },
    creador_id: { 
        type: String, 
        required: true,
        match: /^UA-\d{5,6}$/ 
    },
    fecha_publicacion: { 
        type: Date, 
        default: Date.now 
    },
    // Fecha y hora de vencimiento obligatoria si tipo === 'Autorizacion'
    fecha_limite: { 
        type: Date,
        required: function() { return this.tipo === 'Autorizacion'; }
    },
    // Estado global de la Circular
    estado: { 
        type: String, 
        enum: ['Pendiente', 'No Enviada', 'Enviada', 'Autorizado', 'No Autorizado'], 
        default: 'Pendiente',
        index: true
    },
    // Segmentación de envío
    filtros_destino: {
        grados_ids: [{ type: Number }], // IDs relacionales de MySQL
        secciones_ids: [{ type: Number }], // IDs relacionales de MySQL
        estudiantes_ids: [{ type: String }] // Códigos UA de envío personalizado
    },
    // Matriz de firmas y estados por alumno/encargado para circulares de autorización
    firmas: [{
        estudiante_id: { type: String, required: true }, // Código UA
        encargado_id: { type: String, required: true }, // Código UA que debe firmar
        estado: { 
            type: String, 
            enum: ['Pendiente', 'No Enviada', 'Enviada', 'Autorizado', 'No Autorizado'], 
            default: 'Enviada' 
        },
        metodo: { 
            type: String, 
            enum: ['Virtual', 'Presencial'], 
            required: true 
        },
        fecha_firma: { type: Date },
        usuario_recepcion_fisica: { type: String } // Si es presencial, qué secretaria procesó el papel en MySQL (UA-XXXXX)
    }]
}, { timestamps: true });

// Índice para el Cron Job que busca vencimientos de autorizaciones enviadas
CircularSchema.index({ estado: 1, fecha_limite: 1 });

// ----------------------------------------------------------------------------
// 6. ESQUEMA DE NOTIFICACIONES IN-APP
// ----------------------------------------------------------------------------
const NotificacionSchema = new Schema({
    usuario_id: { 
        type: String, 
        required: true, 
        index: true,
        match: /^UA-\d{5,6}$/ 
    },
    tipo: { 
        type: String, 
        enum: ['General', 'Alerta'], // Alertas disparan correo además de la notificación in-app
        required: true 
    },
    titulo: { 
        type: String, 
        required: true 
    },
    mensaje: { 
        type: String, 
        required: true 
    },
    modulo_origen: { 
        type: String, 
        enum: ['Asistencia', 'Calificaciones', 'Circulares', 'Foros', 'Citas', 'Quejas'], 
        required: true 
    },
    leido: { 
        type: Boolean, 
        default: false 
    },
    fecha_creacion: { 
        type: Date, 
        default: Date.now 
    }
}, { timestamps: true });

// Modelos exportables
module.exports = {
    MensajeDirecto: mongoose.model('MensajeDirecto', MensajeDirectoSchema),
    Foro: mongoose.model('Foro', ForoSchema),
    HiloDiscusion: mongoose.model('HiloDiscusion', HiloDiscusionSchema),
    Comentario: mongoose.model('Comentario', ComentarioSchema),
    Circular: mongoose.model('Circular', CircularSchema),
    Notificacion: mongoose.model('Notificacion', NotificacionSchema)
};
