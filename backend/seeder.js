const { Sequelize, QueryTypes } = require('sequelize');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const { MensajeDirecto, Foro, HiloDiscusion, Comentario, Circular, Notificacion } = require('./database/mongoose_schemas');

const dbName = process.env.MYSQL_DB || 'plataforma_estudiantil';
const dbUser = process.env.MYSQL_USER || 'root';
const dbPassword = process.env.MYSQL_PASSWORD || '';
const dbHost = process.env.MYSQL_HOST || 'localhost';
const dbPort = process.env.MYSQL_PORT || 3306;
const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/plataforma_estudiantil';

// Inicializar la conexion Sequelize
const sequelize = new Sequelize(dbName, dbUser, dbPassword, {
    host: dbHost,
    port: dbPort,
    dialect: 'mysql',
    logging: false
});

async function seed() {
    try {
        console.log('[SEEDER] Conectando a bases de datos para el sembrado masivo...');
        await sequelize.authenticate();
        await mongoose.connect(mongoUri);
        console.log('[SEEDER] Conectado exitosamente a MySQL y MongoDB.');

        // --------------------------------------------------------------------
        // LIMPIEZA DE TABLAS Y COLECCIONES (RESET GENERAL)
        // --------------------------------------------------------------------
        console.log('[SEEDER] Limpiando datos antiguos...');
        
        // MongoDB
        await MensajeDirecto.deleteMany({});
        await Foro.deleteMany({});
        await HiloDiscusion.deleteMany({});
        await Comentario.deleteMany({});
        await Circular.deleteMany({});
        await Notificacion.deleteMany({});
        console.log('[SEEDER] Colecciones NoSQL vaciadas.');

        // MySQL (Desactivar temporalmente llaves foraneas para limpiar)
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 0', { type: QueryTypes.RAW });
        
        const tables = [
            'bitacora_accesos', 'quejas_incidentes', 'citas_presenciales', 
            'entregas_tareas', 'actividades', 'escalas_desempeno', 
            'criterios_rubricas', 'rubricas', 'justificaciones_inasistencias', 
            'inasistencias_periodos', 'asistencias_generales', 'horarios_atencion_profesores', 
            'horarios_clases', 'cursos', 'materias', 'estudiantes_secciones', 
            'secciones', 'grados', 'estudiantes_encargados', 'fichas_laborales', 
            'fichas_medicas', 'usuarios'
        ];

        for (const table of tables) {
            await sequelize.query(`TRUNCATE TABLE ${table}`, { type: QueryTypes.RAW });
        }
        await sequelize.query('SET FOREIGN_KEY_CHECKS = 1', { type: QueryTypes.RAW });
        console.log('[SEEDER] Tablas MySQL vaciadas.');

        // --------------------------------------------------------------------
        // 1. USUARIOS Y PERFILES (FICHAS MÉDICAS Y LABORALES)
        // --------------------------------------------------------------------
        console.log('[SEEDER] Creando usuarios y fichas...');
        const passHash = (pwd) => bcrypt.hashSync(pwd, 10);

        const usuarios = [
            // Administrador (Rol 1)
            { codigo_ua: 'UA-26101', nombre: 'Juan Perez Ortega', correo: 'juan.perez@ua.edu.gt', clave: 'admin123', rol: 'Administrador', temp: false },
            // Control Academico (Rol 2)
            { codigo_ua: 'UA-26201', nombre: 'Maria Juarez Diaz', correo: 'maria.juarez@ua.edu.gt', clave: 'control123', rol: 'Control Academico', temp: false },
            { codigo_ua: 'UA-26202', nombre: 'Pedro Morales Cobar', correo: 'pedro.morales@ua.edu.gt', clave: 'control456', rol: 'Control Academico', temp: false },
            // Profesores (Rol 3)
            { codigo_ua: 'UA-26301', nombre: 'Carlos Gomez Estrada', correo: 'carlos.gomez@ua.edu.gt', clave: 'profe123', rol: 'Profesor', temp: false }, // Profesor Guia
            { codigo_ua: 'UA-26302', nombre: 'Sofia Lopez Alvarado', correo: 'sofia.lopez@ua.edu.gt', clave: 'profe456', rol: 'Profesor', temp: false },
            { codigo_ua: 'UA-26303', nombre: 'Jorge Diaz Herrera', correo: 'jorge.diaz@ua.edu.gt', clave: 'profe789', rol: 'Profesor', temp: false },
            // Encargados (Rol 4)
            { codigo_ua: 'UA-26401', nombre: 'Luisa Ortega Cruz', correo: 'luisa.ortega@gmail.com', clave: 'tutor123', rol: 'Encargado', temp: false },
            { codigo_ua: 'UA-26402', nombre: 'Roberto Mendez Silva', correo: 'roberto.mendez@gmail.com', clave: 'tutor456', rol: 'Encargado', temp: false },
            // Estudiantes (Rol 5)
            { codigo_ua: 'UA-26501', nombre: 'Jose Ortega Cruz', correo: 'jose.ortega@ua.edu.gt', clave: 'jose123', rol: 'Estudiante', temp: true }, // Contrasena temporal
            { codigo_ua: 'UA-26502', nombre: 'Andrea Mendez Silva', correo: 'andrea.mendez@ua.edu.gt', clave: 'andrea123', rol: 'Estudiante', temp: false }
        ];

        // Guardamos los IDs insertados para relacionar
        const userMap = {};

        for (const u of usuarios) {
            const queryUser = `
                INSERT INTO usuarios 
                    (codigo_ua, nombre_completo, contrasena_hash, es_contrasena_temporal, rol, correo_recuperacion, estado)
                VALUES 
                    (:codigo_ua, :nombre, :clave, :temp, :rol, :correo, 'Activo')
            `;
            const [insertId] = await sequelize.query(queryUser, {
                replacements: {
                    codigo_ua: u.codigo_ua,
                    nombre: u.nombre,
                    clave: passHash(u.clave),
                    temp: u.temp,
                    rol: u.rol,
                    correo: u.correo
                },
                type: QueryTypes.INSERT
            });
            userMap[u.codigo_ua] = insertId;

            // Fichas Medicas para Estudiantes
            if (u.rol === 'Estudiante') {
                const queryMed = `
                    INSERT INTO fichas_medicas (usuario_id, tipo_sangre, alergias, padecimientos_cronicos, contactos_emergencia)
                    VALUES (:usuario_id, 'O+', 'Ninguna conocida', 'Ninguno', '{"nombre": "Encargado de Emergencias", "telefono": "5555-5555"}')
                `;
                await sequelize.query(queryMed, {
                    replacements: { usuario_id: insertId },
                    type: QueryTypes.INSERT
                });
            }

            // Fichas Laborales para Personal (Admin, Control, Profesor)
            if (u.rol === 'Administrador' || u.rol === 'Control Academico' || u.rol === 'Profesor') {
                const queryLab = `
                    INSERT INTO fichas_laborales (usuario_id, fecha_contratacion, nit, igss)
                    VALUES (:usuario_id, '2024-01-15', :nit, :igss)
                `;
                await sequelize.query(queryLab, {
                    replacements: {
                        usuario_id: insertId,
                        nit: `NIT-${u.codigo_ua.replace('UA-', '')}-1`,
                        igss: `IGSS-${u.codigo_ua.replace('UA-', '')}-A`
                    },
                    type: QueryTypes.INSERT
                });
            }
        }

        // Relacionar Estudiantes con sus Encargados
        await sequelize.query(
            `INSERT INTO estudiantes_encargados (estudiante_id, encargado_id, parentesco) VALUES 
             (:e1, :enc1, 'Madre'), 
             (:e2, :enc2, 'Padre')`,
            {
                replacements: {
                    e1: userMap['UA-26501'], enc1: userMap['UA-26401'],
                    e2: userMap['UA-26502'], enc2: userMap['UA-26402']
                },
                type: QueryTypes.INSERT
            }
        );

        // --------------------------------------------------------------------
        // 2. CONFIGURACIÓN ACADÉMICA (GRADOS, SECCIONES Y ENROLAMIENTO)
        // --------------------------------------------------------------------
        console.log('[SEEDER] Configurando estructura academica...');
        
        // Grados
        const [gradoId] = await sequelize.query("INSERT INTO grados (nombre) VALUES ('Decimo Grado')", { type: QueryTypes.INSERT });
        const [grado11Id] = await sequelize.query("INSERT INTO grados (nombre) VALUES ('Undecimo Grado')", { type: QueryTypes.INSERT });

        // Secciones
        const [seccionAId] = await sequelize.query("INSERT INTO secciones (grado_id, nombre) VALUES (?, 'A')", { replacements: [gradoId], type: QueryTypes.INSERT });
        const [seccionBId] = await sequelize.query("INSERT INTO secciones (grado_id, nombre) VALUES (?, 'B')", { replacements: [grado11Id], type: QueryTypes.INSERT });

        // Asignar estudiantes a Secciones (Jose en Decimo A, Andrea en Undecimo B)
        await sequelize.query(
            `INSERT INTO estudiantes_secciones (estudiante_id, seccion_id, ciclo_escolar) VALUES 
             (?, ?, 2026), 
             (?, ?, 2026)`,
            {
                replacements: [userMap['UA-26501'], seccionAId, userMap['UA-26502'], seccionBId],
                type: QueryTypes.INSERT
            }
        );

        // Materias
        const [matMathId] = await sequelize.query("INSERT INTO materias (nombre) VALUES ('Matematica I')", { type: QueryTypes.INSERT });
        const [matPhysId] = await sequelize.query("INSERT INTO materias (nombre) VALUES ('Fisica Fundamental')", { type: QueryTypes.INSERT });

        // Cursos (Asociacion Materia, Seccion, Profesor)
        // Matematica I en Decimo A impartido por Carlos Gomez (Profesor Guia)
        const [cursoMathId] = await sequelize.query(
            `INSERT INTO cursos (materia_id, seccion_id, profesor_id, color_hex, salon, ciclo_escolar) 
             VALUES (:materia_id, :seccion_id, :profesor_id, '#3B82F6', :salon, 2026)`,
            {
                replacements: { materia_id: matMathId, seccion_id: seccionAId, profesor_id: userMap['UA-26301'], salon: 'Salon 101' },
                type: QueryTypes.INSERT
            }
        );

        // Fisica Fundamental en Undecimo B impartido por Sofia Lopez
        const [cursoPhysId] = await sequelize.query(
            `INSERT INTO cursos (materia_id, seccion_id, profesor_id, color_hex, salon, ciclo_escolar) 
             VALUES (:materia_id, :seccion_id, :profesor_id, '#EF4444', :salon, 2026)`,
            {
                replacements: { materia_id: matPhysId, seccion_id: seccionBId, profesor_id: userMap['UA-26302'], salon: 'Salon 102' },
                type: QueryTypes.INSERT
            }
        );

        // --------------------------------------------------------------------
        // 3. ESCENARIO DE ASISTENCIA CRUZADA Y LLEGADA TARDÍA
        // --------------------------------------------------------------------
        console.log('[SEEDER] Registrando escenarios de asistencia...');
        const fechaHoy = new Date().toISOString().split('T')[0];

        // Jose Ortega UA-26501: Presente en la mañana (Profesor Guia), Ausente local en Fisica periodo 3
        await sequelize.query(
            `INSERT INTO asistencias_generales (estudiante_id, fecha, estado, registrado_por, observaciones) 
             VALUES (:estudiante, :fecha, 'Presente', :guia, 'Ingreso general normal matutino')`,
            {
                replacements: { estudiante: userMap['UA-26501'], fecha: fechaHoy, guia: userMap['UA-26301'] },
                type: QueryTypes.INSERT
            }
        );

        await sequelize.query(
            `INSERT INTO inasistencias_periodos (estudiante_id, curso_id, fecha, periodo_numero, estado, observacion_docente) 
             VALUES (:estudiante, :curso, :fecha, 3, 'No Asistio', 'El alumno falto a la sesion del periodo de fisica.')`,
            {
                replacements: { estudiante: userMap['UA-26501'], curso: cursoPhysId, fecha: fechaHoy },
                type: QueryTypes.INSERT
            }
        );

        // Generar Notificacion in-app / Requerimiento de contingencia NoSQL por falta injustificada
        const notifJoseContingencia = new Notificacion({
            usuario_id: 'UA-26501',
            tipo: 'Alerta',
            titulo: 'Requerimiento de Material: Puesta al Dia',
            mensaje: `Tienes una inasistencia en Fisica Fundamental (Periodo 3). Debes descargar el material de contingencia.`,
            modulo_origen: 'Asistencia',
            leido: false
        });
        await notifJoseContingencia.save();

        // Andrea Mendez UA-26502: Premarcada Ausente en la mañana, reincorporada como Llegada Tarde en periodo 4
        // Estado final: Llegada Tarde en ambas tablas
        await sequelize.query(
            `INSERT INTO asistencias_generales (estudiante_id, fecha, estado, registrado_por, observaciones) 
             VALUES (:estudiante, :fecha, 'Llegada Tarde', :guia, 'Premarcado ausente | Incorporacion en periodo 4')`,
            {
                replacements: { estudiante: userMap['UA-26502'], fecha: fechaHoy, guia: userMap['UA-26301'] },
                type: QueryTypes.INSERT
            }
        );

        await sequelize.query(
            `INSERT INTO inasistencias_periodos (estudiante_id, curso_id, fecha, periodo_numero, estado, observacion_docente) 
             VALUES (:estudiante, :curso, :fecha, 4, 'Llegada Tarde', 'Llego tarde al salon pero se incorporo')`,
            {
                replacements: { estudiante: userMap['UA-26502'], curso: cursoPhysId, fecha: fechaHoy },
                type: QueryTypes.INSERT
            }
        );

        // --------------------------------------------------------------------
        // 4. ESCENARIO DE CALIFICACIONES Y PRÓRROGAS
        // --------------------------------------------------------------------
        console.log('[SEEDER] Registrando actividades y entregas con tramos de prorroga...');

        // Insertar los parametros del sistema por si no estaban cargados
        await sequelize.query(
            `INSERT INTO configuraciones_sistema (clave, valor, descripcion) VALUES
             ('hora_limite_justificacion_digital', '12:00', 'Hora limite de justificacion'),
             ('prorroga_nivel_1_dias', '1', 'Dias Nivel 1'),
             ('prorroga_nivel_1_penalizacion', '75', 'Nota max Nivel 1'),
             ('prorroga_nivel_2_dias', '3', 'Dias Nivel 2'),
             ('prorroga_nivel_2_penalizacion', '50', 'Nota max Nivel 2'),
             ('prorroga_nivel_3_dias', '5', 'Dias Nivel 3'),
             ('prorroga_nivel_3_penalizacion', '25', 'Nota max Nivel 3')
             ON DUPLICATE KEY UPDATE valor = VALUES(valor)`,
            { type: QueryTypes.INSERT }
        );

        // Actividad 1: Matematica (Creada hace 6 dias, limite hace 5 dias)
        // Jose Ortega entregó a tiempo
        // Andrea Mendez entregó 1 dia tarde (Cae en Nivel 1 - 75% max)
        const fechaLimiteMath = new Date();
        fechaLimiteMath.setDate(fechaLimiteMath.getDate() - 5);
        const fechaLimiteMathStr = fechaLimiteMath.toISOString().slice(0, 19).replace('T', ' ');

        const [actMathId] = await sequelize.query(
            `INSERT INTO actividades (curso_id, titulo, descripcion, ponderacion, fecha_hora_limite, tipo_actividad, modalidad_entrega, niveles_prorroga_habilitados, visible) 
             VALUES (:curso, 'Hoja de Trabajo 1', 'Ejercicios de Algebra', 10.00, :limite, 'Hoja de Trabajo', 'Virtual', '[1, 2, 3]', TRUE)`,
            {
                replacements: { curso: cursoMathId, limite: fechaLimiteMathStr },
                type: QueryTypes.INSERT
            }
        );

        // Jose: a tiempo
        const fechaJoseMath = new Date(fechaLimiteMath);
        fechaJoseMath.setHours(fechaJoseMath.getHours() - 2); // 2 horas antes
        await sequelize.query(
            `INSERT INTO entregas_tareas (actividad_id, estudiante_id, archivo_adjunto_url, fecha_hora_entrega, estado, nota_obtenida, penalizacion_aplicada) 
             VALUES (:act, :est, 'http://url.archivo/jose_algebra.pdf', :fecha, 'Calificada', 9.00, 0.00)`,
            {
                replacements: { act: actMathId, est: userMap['UA-26501'], fecha: fechaJoseMath.toISOString().slice(0, 19).replace('T', ' ') },
                type: QueryTypes.INSERT
            }
        );

        // Andrea: 1 dia tarde
        const fechaAndreaMath = new Date(fechaLimiteMath);
        fechaAndreaMath.setDate(fechaAndreaMath.getDate() + 1); // 1 dia despues (dentro del Nivel 1 de 1 dia)
        await sequelize.query(
            `INSERT INTO entregas_tareas (actividad_id, estudiante_id, archivo_adjunto_url, fecha_hora_entrega, estado, nota_obtenida, penalizacion_aplicada) 
             VALUES (:act, :est, 'http://url.archivo/andrea_algebra.pdf', :fecha, 'Calificada', 7.00, 75.00)`, // Calificada sobre 7.50 max
            {
                replacements: { act: actMathId, est: userMap['UA-26502'], fecha: fechaAndreaMath.toISOString().slice(0, 19).replace('T', ' ') },
                type: QueryTypes.INSERT
            }
        );

        // Actividad 2: Fisica (Creada hace 9 dias, limite hace 8 dias)
        // Jose entregó 3 dias tarde (Nivel 2 - 50% max)
        // Andrea no entregó (Pasaron 8 dias, excede limite de 5 dias -> Estado Intolerable, nota 10% auto)
        const fechaLimitePhys = new Date();
        fechaLimitePhys.setDate(fechaLimitePhys.getDate() - 8);
        const fechaLimitePhysStr = fechaLimitePhys.toISOString().slice(0, 19).replace('T', ' ');

        const [actPhysId] = await sequelize.query(
            `INSERT INTO actividades (curso_id, titulo, descripcion, ponderacion, fecha_hora_limite, tipo_actividad, modalidad_entrega, niveles_prorroga_habilitados, visible) 
             VALUES (:curso, 'Proyecto Cinemática', 'Calculo de aceleracion constante', 20.00, :limite, 'Proyecto', 'Virtual', '[1, 2, 3]', TRUE)`,
            {
                replacements: { curso: cursoPhysId, limite: fechaLimitePhysStr },
                type: QueryTypes.INSERT
            }
        );

        // Jose: 3 dias tarde (Cae en Nivel 2 - 50% max, o sea sobre 10.00 max)
        const fechaJosePhys = new Date(fechaLimitePhys);
        fechaJosePhys.setDate(fechaJosePhys.getDate() + 3);
        await sequelize.query(
            `INSERT INTO entregas_tareas (actividad_id, estudiante_id, archivo_adjunto_url, fecha_hora_entrega, estado, nota_obtenida, penalizacion_aplicada) 
             VALUES (:act, :est, 'http://url.archivo/jose_cinematica.pdf', :fecha, 'Calificada', 9.50, 50.00)`, // Nota obtenida sobre el maximo penalizado de 10
            {
                replacements: { act: actPhysId, est: userMap['UA-26501'], fecha: fechaJosePhys.toISOString().slice(0, 19).replace('T', ' ') },
                type: QueryTypes.INSERT
            }
        );

        // Andrea: No entrego (Intolerable)
        await sequelize.query(
            `INSERT INTO entregas_tareas (actividad_id, estudiante_id, archivo_adjunto_url, fecha_hora_entrega, estado, nota_obtenida, penalizacion_aplicada) 
             VALUES (:act, :est, NULL, NULL, 'Intolerable', 2.00, 0.00)`, // 10% de 20.00 = 2.00 puntos automaticos
            {
                replacements: { act: actPhysId, est: userMap['UA-26502'] },
                type: QueryTypes.INSERT
            }
        );

        // --------------------------------------------------------------------
        // 5. ESCENARIO DE COMUNICACIÓN, FOROS Y CIRCULARES (NOSQL)
        // --------------------------------------------------------------------
        console.log('[SEEDER] Registrando circulares, foros y mensajes NoSQL...');

        // Circulares
        const circularInformativa = new Circular({
            titulo: 'Calendario de Evaluaciones Parciales III Bloque',
            contenido: 'Estimados padres de familia, se adjunta el calendario para el mes de julio.',
            tipo: 'Informativa',
            creador_id: 'UA-26101',
            estado: 'Enviada',
            filtros_destino: { grados_ids: [gradoId], secciones_ids: [seccionAId] }
        });
        await circularInformativa.save();

        const circularAutorizacionPendiente = new Circular({
            titulo: 'Autorizacion Excursion Museo de Ciencia',
            contenido: 'Solicitamos autorizar la excursion escolar programada para el 25 de julio.',
            tipo: 'Autorizacion',
            creador_id: 'UA-26101',
            fecha_limite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 dias en el futuro
            estado: 'Enviada',
            filtros_destino: { estudiantes_ids: ['UA-26501', 'UA-26502'] },
            firmas: [
                { estudiante_id: 'UA-26501', encargado_id: 'UA-26401', estado: 'Enviada', metodo: 'Virtual' },
                { estudiante_id: 'UA-26502', encargado_id: 'UA-26402', estado: 'Enviada', metodo: 'Virtual' }
            ]
        });
        await circularAutorizacionPendiente.save();

        const circularAutorizacionFirmada = new Circular({
            titulo: 'Consentimiento para Campana de Vacunacion Nacional',
            contenido: 'Autorizacion medica para la jornada escolar del 5 de julio.',
            tipo: 'Autorizacion',
            creador_id: 'UA-26101',
            fecha_limite: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 dias en el pasado
            estado: 'Autorizado',
            filtros_destino: { estudiantes_ids: ['UA-26501'] },
            firmas: [
                { estudiante_id: 'UA-26501', encargado_id: 'UA-26401', estado: 'Autorizado', metodo: 'Virtual', fecha_firma: new Date() }
            ]
        });
        await circularAutorizacionFirmada.save();

        // Foros fijos
        const foroGrado = new Foro({
            nombre: 'Foro Oficial Decimo A',
            descripcion: 'Canal de comunicacion general para avisos de Decimo Seccion A.',
            tipo: 'GradoSeccion',
            grado_seccion: { grado: 'Decimo Grado', seccion: 'A' },
            creador_id: 'UA-26301',
            estado: 'Activo'
        });
        await foroGrado.save();

        const foroTematico = new Foro({
            nombre: 'Club de Astronomia y Fisica',
            descripcion: 'Canal tematico abierto para compartir avances de astronomia.',
            tipo: 'Tematico',
            creador_id: 'UA-26302',
            miembros: ['UA-26501', 'UA-26502', 'UA-26302'],
            estado: 'Activo'
        });
        await foroTematico.save();

        // Foro Dinamico de Grupo de Tareas
        const foroGrupoTareas = new Foro({
            nombre: 'Grupo de Trabajo A: Laboratorio Fisica',
            descripcion: 'Foro privado para coordinar la entrega del Proyecto de Cinematica.',
            tipo: 'GrupoTareas',
            creador_id: 'UA-26302',
            miembros: ['UA-26501', 'UA-26502'],
            estado: 'Activo'
        });
        await foroGrupoTareas.save();

        // Hilo de discusion y comentarios en el foro dinamico
        const hilo = new HiloDiscusion({
            foro_id: foroGrupoTareas._id,
            titulo: 'Coordinacion del archivo PDF de entrega',
            contenido: 'Subo las formulas iniciales para consolidar el reporte.',
            creador_id: 'UA-26501'
        });
        await hilo.save();

        const comentario = new Comentario({
            hilo_id: hilo._id,
            autor_id: 'UA-26502',
            contenido: 'Gracias Jose, yo agregare las conclusiones y graficos de aceleracion.'
        });
        await comentario.save();

        // Mensaje Directo entre Encargada y Profesor (Dentro de horario)
        const mensaje = new MensajeDirecto({
            emisor_id: 'UA-26401',
            receptor_id: 'UA-26301',
            contenido: 'Buenas tardes profesor, queria consultar sobre la tarea de algebra de Jose.',
            leido: true
        });
        await mensaje.save();

        console.log('[SEEDER] Masive seed finalizado con exito.');
        
    } catch (error) {
        console.error('[SEEDER ERROR] Error al sembrar datos:', error);
    } finally {
        await sequelize.close();
        await mongoose.disconnect();
        console.log('[SEEDER] Conexiones de bases de datos cerradas.');
    }
}

seed();
