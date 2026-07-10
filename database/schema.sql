-- ============================================================================
-- SCRIPT DE CREACIÓN DE BASE DE DATOS RELACIONAL: plataforma_estudiantil
-- Motor de Base de Datos: MySQL 8.0+
-- Arquitectura: Monolito Modular - Datos Estructurales y Transaccionales
-- ============================================================================

CREATE DATABASE IF NOT EXISTS plataforma_estudiantil
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE plataforma_estudiantil;

-- ----------------------------------------------------------------------------
-- 1. TABLA DE CONFIGURACIONES GLOBALES DEL SISTEMA
-- Permite al administrador parametrizar el comportamiento general.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS configuraciones_sistema (
    id INT AUTO_INCREMENT PRIMARY KEY,
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor VARCHAR(255) NOT NULL,
    descripcion TEXT,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 2. TABLA DE USUARIOS (ENTIDAD CENTRAL DE ACCESO)
-- Almacena credenciales, códigos UA-XXXXX y correos de recuperación.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS usuarios (
    id INT AUTO_INCREMENT PRIMARY KEY,
    codigo_ua VARCHAR(10) NOT NULL UNIQUE, -- Formato: UA-YYRXX (5 dígitos tras prefijo) o UA-YYRXXX (en desborde)
    nombre_completo VARCHAR(150) NULL, -- Nombre completo del usuario
    contrasena_hash VARCHAR(255) NOT NULL,
    es_contrasena_temporal BOOLEAN DEFAULT TRUE,
    rol ENUM('Administrador', 'Control Academico', 'Profesor', 'Encargado', 'Estudiante') NOT NULL,
    correo_recuperacion VARCHAR(255) NOT NULL UNIQUE,
    telefono_personal VARCHAR(20) NULL,
    telefono_emergencia VARCHAR(20) NULL,
    estado ENUM('Activo', 'Inactivo') DEFAULT 'Activo',
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_usuarios_codigo_ua (codigo_ua),
    INDEX idx_usuarios_rol (rol),
    INDEX idx_usuarios_correo_recuperacion (correo_recuperacion)
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 3. TABLA DE FICHAS MÉDICAS (Lectura para personal autorizado, escrita por Admin)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fichas_medicas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    tipo_sangre VARCHAR(5) NOT NULL,
    alergias TEXT NULL,
    padecimientos_cronicos TEXT NULL,
    contactos_emergencia TEXT NOT NULL, -- Formato JSON o Texto libre
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fichas_medicas_usuario FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 4. TABLA DE FICHAS LABORALES (Exclusivo para Profesores y Control Académico)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS fichas_laborales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NOT NULL UNIQUE,
    fecha_contratacion DATE NOT NULL,
    nit VARCHAR(20) NOT NULL UNIQUE,
    igss VARCHAR(20) NOT NULL UNIQUE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_fichas_laborales_usuario FOREIGN KEY (usuario_id) 
        REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 5. TABLA DE VINCULACIÓN ESTUDIANTE - ENCARGADO
-- Restricción a nivel de lógica de aplicación: máx 2 encargados por estudiante.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS estudiantes_encargados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    encargado_id INT NOT NULL,
    parentesco ENUM('Madre', 'Padre', 'Encargado') NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_estudiante_encargado (estudiante_id, encargado_id),
    CONSTRAINT fk_est_enc_estudiante FOREIGN KEY (estudiante_id) 
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_est_enc_encargado FOREIGN KEY (encargado_id) 
        REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 6. ESTRUCTURA ACADÉMICA: GRADOS Y SECCIONES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS grados (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL UNIQUE, -- Ej: '3ro Primaria', '4to Primaria'
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS secciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    grado_id INT NOT NULL,
    nombre VARCHAR(10) NOT NULL, -- Ej: 'A', 'B', 'C'
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_grado_seccion (grado_id, nombre),
    CONSTRAINT fk_secciones_grado FOREIGN KEY (grado_id) 
        REFERENCES grados(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 7. TABLA DE ASIGNACIÓN ESTUDIANTE - SECCIÓN
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS estudiantes_secciones (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    seccion_id INT NOT NULL,
    ciclo_escolar INT NOT NULL, -- Ej: 2026
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_estudiante_ciclo (estudiante_id, ciclo_escolar),
    CONSTRAINT fk_est_sec_estudiante FOREIGN KEY (estudiante_id) 
        REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_est_sec_seccion FOREIGN KEY (seccion_id) 
        REFERENCES secciones(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 8. MATERIAS Y CURSOS (MATERIAS IMPARTIDAS POR SECCIÓN/PROFESOR)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS materias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(150) NOT NULL UNIQUE, -- Ej: 'Matemáticas', 'Idioma Español'
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS cursos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    materia_id INT NOT NULL,
    seccion_id INT NOT NULL,
    profesor_id INT NOT NULL, -- Profesor titular
    color_hex VARCHAR(7) NOT NULL DEFAULT '#4F46E5', -- Color para calendario
    salon VARCHAR(50) NOT NULL, -- Aula física, Ej: 'Aula 101'
    ciclo_escolar INT NOT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_cursos_materia FOREIGN KEY (materia_id) REFERENCES materias(id) ON DELETE CASCADE,
    CONSTRAINT fk_cursos_seccion FOREIGN KEY (seccion_id) REFERENCES secciones(id) ON DELETE CASCADE,
    CONSTRAINT fk_cursos_profesor FOREIGN KEY (profesor_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 9. HORARIOS DE CLASE
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS horarios_clases (
    id INT AUTO_INCREMENT PRIMARY KEY,
    curso_id INT NOT NULL,
    dia_semana ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    CONSTRAINT fk_horarios_curso FOREIGN KEY (curso_id) 
        REFERENCES cursos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 10. HORARIOS DE ATENCIÓN DE PROFESORES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS horarios_atencion_profesores (
    id INT AUTO_INCREMENT PRIMARY KEY,
    profesor_id INT NOT NULL,
    dia_semana ENUM('Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo') NOT NULL,
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    CONSTRAINT fk_horarios_atencion_profesor FOREIGN KEY (profesor_id) 
        REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 11. SISTEMA DE ASISTENCIA GENERAL (Asistencia matutina por el Profesor Guía)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS asistencias_generales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    fecha DATE NOT NULL,
    estado ENUM('Presente', 'Inasistencia', 'Llegada Tarde') NOT NULL,
    justificada BOOLEAN DEFAULT FALSE,
    observaciones TEXT NULL,
    registrado_por INT NOT NULL, -- Profesor Guía que registró la asistencia
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_asistencia_estudiante_fecha (estudiante_id, fecha),
    CONSTRAINT fk_asistencias_estudiante FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_asistencias_registrador FOREIGN KEY (registrado_por) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 12. SISTEMA DE ASISTENCIA CRUZADA (Inasistencias por período / curso)
-- Almacena el historial y los cambios por curso sin duplicar tablas generales.
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS inasistencias_periodos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    curso_id INT NOT NULL,
    fecha DATE NOT NULL,
    periodo_numero INT NOT NULL, -- Bloque horario (Ej: 1, 2, 3, etc.)
    estado ENUM('No Asistio', 'Llegada Tarde') NOT NULL,
    justificada BOOLEAN DEFAULT FALSE,
    observacion_docente TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_inasistencia_periodo (estudiante_id, curso_id, fecha, periodo_numero),
    CONSTRAINT fk_inasistencias_p_estudiante FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_inasistencias_p_curso FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 13. SOLICITUDES DE JUSTIFICACIÓN DE INASISTENCIAS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS justificaciones_inasistencias (
    id INT AUTO_INCREMENT PRIMARY KEY,
    estudiante_id INT NOT NULL,
    fecha_falta DATE NOT NULL,
    motivo TEXT NOT NULL,
    documento_adjunto_url VARCHAR(255) NULL, -- Enlace a Vercel Blob o storage
    estado ENUM('Pendiente', 'Aprobada', 'Rechazada') DEFAULT 'Pendiente',
    observacion_resolucion TEXT NULL,
    resuelto_por INT NULL, -- Profesor o Secretaria
    fecha_resolucion TIMESTAMP NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY uq_justificacion_estudiante_fecha (estudiante_id, fecha_falta),
    CONSTRAINT fk_just_estudiante FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_just_resuelto FOREIGN KEY (resuelto_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 14. BANCO Y PLANTILLAS DE RÚBRICAS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rubricas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    profesor_id INT NOT NULL,
    es_plantilla BOOLEAN DEFAULT FALSE,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rubricas_profesor FOREIGN KEY (profesor_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS criterios_rubricas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    rubrica_id INT NOT NULL,
    nombre_criterio VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    ponderacion_maxima DECIMAL(5,2) NOT NULL, -- Puntos que aporta este criterio
    CONSTRAINT fk_criterios_rubrica FOREIGN KEY (rubrica_id) REFERENCES rubricas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS escalas_desempeno (
    id INT AUTO_INCREMENT PRIMARY KEY,
    criterio_id INT NOT NULL,
    nombre_escala VARCHAR(50) NOT NULL, -- Ej: 'Excelente', 'Bien', 'Deficiente'
    porcentaje_aporte DECIMAL(5,2) NOT NULL, -- Porcentaje de la nota del criterio (Ej: 100.00, 50.00, 10.00)
    descripcion TEXT NULL,
    CONSTRAINT fk_escalas_criterio FOREIGN KEY (criterio_id) REFERENCES criterios_rubricas(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 15. ACTIVIDADES Y EVALUACIONES (Creador de actividades multi-tipo)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actividades (
    id INT AUTO_INCREMENT PRIMARY KEY,
    curso_id INT NOT NULL,
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NULL,
    recursos_adjuntos_url VARCHAR(255) NULL,
    ponderacion DECIMAL(5,2) NOT NULL, -- Puntaje total de la tarea
    fecha_hora_limite DATETIME NOT NULL,
    tipo_actividad VARCHAR(50) NOT NULL, -- Examen Final, Examen Parcial, Cortos, Hojas de Trabajo, etc.
    modalidad_entrega ENUM('Virtual', 'Fisico') NOT NULL,
    rubrica_id INT NULL, -- Rúbrica asociada opcionalmente
    visible BOOLEAN DEFAULT TRUE,
    fecha_publicacion DATETIME NULL,
    niveles_prorroga_habilitados JSON NULL, -- Array de enteros seleccionados por el profesor: Ej. [1, 3]
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_actividades_curso FOREIGN KEY (curso_id) REFERENCES cursos(id) ON DELETE CASCADE,
    CONSTRAINT fk_actividades_rubrica FOREIGN KEY (rubrica_id) REFERENCES rubricas(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 16. REGISTRO DE ENTREGAS Y CALIFICACIONES (HISTORIAL)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS entregas_tareas (
    id INT AUTO_INCREMENT PRIMARY KEY,
    actividad_id INT NOT NULL,
    estudiante_id INT NOT NULL,
    archivo_adjunto_url VARCHAR(255) NULL, -- Enlace de entrega virtual
    fecha_hora_entrega DATETIME NULL, -- NULL si no ha entregado
    estado ENUM(
        'Calificada', 
        'Pendiente de Calificar', 
        'Entregada con Retraso', 
        'Justificada por Ausencia', 
        'Caso Especial', 
        'Intolerable'
    ) NOT NULL DEFAULT 'Pendiente de Calificar',
    nota_obtenida DECIMAL(5,2) NULL, -- Calificación final
    penalizacion_aplicada DECIMAL(5,2) DEFAULT 0.00, -- Descuento aplicado
    justificacion_maestro TEXT NULL, -- Para excepciones manuales
    porcentaje_entrega_personalizado DECIMAL(5,2) NULL, -- Excepción: Ej: sobre 90%
    nueva_fecha_limite DATETIME NULL, -- Nueva fecha límite del caso especial / justificación
    fecha_calificacion DATETIME NULL,
    calificado_por INT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_entrega_actividad_estudiante (actividad_id, estudiante_id),
    CONSTRAINT fk_entregas_actividad FOREIGN KEY (actividad_id) REFERENCES actividades(id) ON DELETE CASCADE,
    CONSTRAINT fk_entregas_estudiante FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_entregas_calificador FOREIGN KEY (calificado_por) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 17. CITAS PRESENCIALES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS citas_presenciales (
    id INT AUTO_INCREMENT PRIMARY KEY,
    solicitante_id INT NOT NULL,
    destinatario_id INT NOT NULL,
    estudiante_id INT NOT NULL, -- Alumno sobre quien se habla
    fecha_hora DATETIME NOT NULL,
    motivo TEXT NOT NULL,
    estado ENUM('Solicitada', 'Aprobada', 'Rechazada', 'Completada', 'Cancelada') DEFAULT 'Solicitada',
    es_prioritaria BOOLEAN DEFAULT FALSE, -- Activado por docentes para casos delicados
    observaciones TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_citas_solicitante FOREIGN KEY (solicitante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_citas_destinatario FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_citas_estudiante FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 18. QUEJAS E INCIDENTES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS quejas_incidentes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    creador_id INT NOT NULL,
    estudiante_id INT NULL, -- NULL si no está vinculada a un alumno directo (queja administrativa)
    destinatario_id INT NOT NULL, -- Profesor o Secretaría
    titulo VARCHAR(150) NOT NULL,
    descripcion TEXT NOT NULL,
    estado ENUM('Enviado', 'En Revision', 'Resuelto', 'Cerrado por el Padre', 'Reabierto') DEFAULT 'Enviado',
    tipo ENUM('Conducta', 'Academico', 'Administrativo', 'Inconformidad') NOT NULL,
    ruta_escalabilidad JSON NULL, -- Registro de cambios de destinatario (Ej: Profesor -> Secretaria)
    resolucion_texto TEXT NULL,
    creado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    actualizado_en TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT fk_quejas_creador FOREIGN KEY (creador_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_quejas_estudiante FOREIGN KEY (estudiante_id) REFERENCES usuarios(id) ON DELETE CASCADE,
    CONSTRAINT fk_quejas_destinatario FOREIGN KEY (destinatario_id) REFERENCES usuarios(id) ON DELETE RESTRICT
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- 19. BITÁCORAS DE AUDITORÍA Y ACCESOS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS bitacora_accesos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    usuario_id INT NULL, -- NULL si fue un intento de login fallido con usuario inexistente
    evento VARCHAR(100) NOT NULL, -- LOGIN_EXITOSO, LOGIN_FALLIDO, CAMBIO_CONTRASENA, EDICION_PERFIL
    direccion_ip VARCHAR(45) NOT NULL,
    detalles TEXT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_bitacora_usuario FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- ----------------------------------------------------------------------------
-- INSERCIÓN DE PARÁMETROS DE CONFIGURACIÓN POR DEFECTO
-- ----------------------------------------------------------------------------
INSERT INTO configuraciones_sistema (clave, valor, descripcion) VALUES
('hora_limite_justificacion_digital', '12:00', 'Hora límite diaria para reportar justificaciones de inasistencia del día anterior.'),
('prorroga_nivel_1_dias', '1', 'Días de tolerancia permitidos para el Nivel de Prórroga 1.'),
('prorroga_nivel_1_penalizacion', '75', 'Nota máxima en porcentaje (ej: calificar sobre 75%) aplicable para el Nivel 1.'),
('prorroga_nivel_2_dias', '3', 'Días de tolerancia permitidos para el Nivel de Prórroga 2 (acumulado desde la fecha límite).'),
('prorroga_nivel_2_penalizacion', '50', 'Nota máxima en porcentaje (ej: calificar sobre 50%) aplicable para el Nivel 2.'),
('prorroga_nivel_3_dias', '5', 'Días de tolerancia permitidos para el Nivel de Prórroga 3 (acumulado desde la fecha límite).'),
('prorroga_nivel_3_penalizacion', '25', 'Nota máxima en porcentaje (ej: calificar sobre 25%) aplicable para el Nivel 3.')
ON DUPLICATE KEY UPDATE valor=valor;
