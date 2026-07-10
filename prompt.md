<role>
Actúa como una Arquitecta de Software Senior y Experta en Frontend en React y CSS Tradicional. Eres reconocida por tu habilidad para hacer debugging profundo, corregir sistemas de enrutamiento dinámico rotos, estructurar estados globales basados en roles y diseñar interfaces consistentes en Modo Claro y Modo Oscuro.

<context>
Estoy desarrollando una aplicación web modular en React (Single Page Application) que maneja un Layout global (con un Sidebar izquierdo colapsable y un Topbar superior). El sistema se conecta a un inicio de sesión de Google (Stitch) en el cliente. 
Actualmente, el proyecto presenta tres errores críticos de lógica, navegación y renderizado que necesito corregir de inmediato.

Detalles técnicos de los errores actuales:
1. BLOQUEO DE PERFIL Y ROL: No importa con qué cuenta o perfil intente ingresar, el sistema siempre me redirige al perfil de administrador de forma harcodeada. Siempre me carga el nombre "Pedro Morales Cobar", el rol "Administrador" y una letra "P" estática dentro del círculo del Avatar, ignorando los datos reales del usuario logueado.
2. RENDERIZADO INCORRECTO Y LOGO FALTANTE: Al hacer clic en cualquier opción del menú lateral (como Cursos, Estudiantes, Horarios, etc.), la pantalla central siempre renderiza el "Panel de Administrador" en lugar de su sección correspondiente. Además, el logotipo de la escuela (que está guardado localmente en mis archivos) no se muestra en la cabecera del menú.
3. COMPORTAMIENTO DE BREADCRUMBS (Ruta de navegación): Tengo una sección debajo del Topbar que muestra la dirección actual en la que se encuentra el usuario (ej: Inicio / Profesores / Horarios). Visualmente funciona bien, pero los elementos son texto plano; quiero que actúen como enlaces interactivos que me redirijan a la sección correspondiente al hacerles clic (ej: si pulso en "Inicio", debe redirigirme a la raíz `/`).

Restricciones: NO uso Tailwind CSS. Todos los comentarios internos en el código deben estar estrictamente en español.

<task>
Tu tarea es analizar minuciosamente el flujo de mi aplicación y proporcionarme las correcciones de código necesarias estructuradas en los siguientes pasos:

1. CORRECCIÓN DEL ESTADO GLOBAL DE USUARIO (Punto 1):
- Muéstrame cómo corregir el Contexto de Autenticación (`AuthContext` o similar) para que extraiga dinámicamente el nombre, el rol y la inicial del nombre para el Avatar a partir del token o respuesta real de Google Stitch, eliminando por completo los datos fijos de "Pedro Morales Cobar".

2. SISTEMA DE VISTAS EN CONSTRUCCIÓN Y SOLUCIÓN DEL LOGO (Punto 2):
- Modifica el enrutador central (`App.jsx`) para que cada path del menú cargue su componente real.
- Requisito especial: Si una sección del menú aún no tiene una página programada, haz que renderice dinámicamente una vista temporal y elegante que contenga el texto central "CREANDO ESPACIO". Añade obligatoriamente un comentario interno en el código que diga exactamente "// FALTA DE CREAR" para identificar rápidamente los pendientes.
- Explícame cómo corregir la ruta de importación de la imagen del logotipo en el componente del menú lateral para que el navegador pueda encontrar el archivo local correctamente.

3. INTERACTIVIDAD EN LA RUTA DE NAVEGACIÓN (Punto 3):
- Transforma el componente de la dirección actual (Breadcrumbs) utilizando el componente `<Link>` de `react-router-dom` para que el usuario pueda hacer clic en cualquier nivel de la ruta y ser redirigido de forma automática a esa URL.

Proporcióname los bloques de código limpios, optimizados con CSS tradicional y listos para sustituir en mis archivos actuales, indicando con precisión el nombre y ruta de cada archivo modificado.


<!-- IGNORA LO SIGUIENTE -->

<!-- 
<role>
Actúa como un Database Administrator (DBA) Senior, Ingeniero de QA y Especialista en Pruebas de Software. Tu objetivo es generar un script de automatización de datos ficticios (Seeder) masivo, realista y funcional para poblar un entorno híbrido de bases de datos (MySQL y MongoDB).
</role>

<context>
La arquitectura, componentes y servidores de la Plataforma Estudiantil (UA) ya están listos. Sin embargo, para probar el correcto funcionamiento del frontend, el backend y todas las reglas de negocio (como la asistencia cruzada, tramos de prórrogas de tareas, bloqueos de visualización y justificaciones con límite de tiempo), necesito poblar el sistema con abundantes datos de prueba.

La base de datos relacional (MySQL) maneja usuarios, asistencias generales, notas y bitácoras de periodos. La base de datos documental (MongoDB) maneja foros, mensajes, circulares e itinerarios de contingencia (material de puesta al día). Toda la información debe estar vinculada correctamente mediante los identificadores únicos UA-XXXXX.
</context>

<task>
Tu tarea es generar dos entregables técnicos exhaustivos sin usar emojis, con comentarios de código en español y nombres de variables en inglés:

1. GUÍA DE CREDENCIALES DE ACCESO DE PRUEBA:
Genera una tabla limpia en Markdown que sirva como bitácora de pruebas para mí. Debe contener al menos 10 usuarios ficticios creados bajo la regla exacta UA-YYRXX (UA - Año 26 - Número de Rol del 1 al 5 - Correlativo de dos dígitos). La tabla debe especificar:
   - Identificador Único (Username): Ej. UA-26101, UA-26201, UA-26301, etc.
   - Contraseña por defecto asignada.
   - Rol oficial dentro del sistema.
   - Nombre completo ficticio.
   - Correo electrónico de recuperación enlazado (necesario para simular la verificación de Google Sign-In).
   - Asegúrate de incluir al menos: 1 Administrador, 2 de Control Académico, 3 Profesores (uno debe ser Profesor Guía), 2 Encargados y 2 Estudiantes (vinculados correctamente a sus respectivos encargados).

2. SCRIPT DE INSERCIÓN MASIVA DE DATOS (SEEDER SCRIPT):
Escribe un script completo en Node.js (seeder.js) que inserte de forma automatizada y simultánea la data ficticia en MySQL (utilizando sentencias SQL puras o Sequelize) y en MongoDB (utilizando Mongoose). El script debe poblar los siguientes escenarios obligatorios para pruebas de estrés:
   - Usuarios y Perfiles: Los 10 usuarios de la tabla anterior con sus respectivas fichas médicas (alergias, tipo de sangre) y fichas laborales (NIT, IGSS para empleados).
   - Escenario de Asistencia Cruzada: Data que simule un día donde el Profesor Guía marcó "Presente" en la mañana, pero el Profesor de Materia registró una "Inasistencia" local en el 3er periodo con justificación en la tabla secundaria de MySQL, activando el "Centro de Puesta al Día" en MongoDB.
   - Escenario de Llegada Tardía: Un alumno premarcado como ausente que luego fue reincorporado como "Llegada Tarde" en un periodo posterior.
   - Escenario de Calificaciones y Prórrogas: Tareas creadas por profesores que tengan registros de entregas a tiempo (Calificadas y Pendientes), entregas con retraso en Nivel 1 (75%), Nivel 2 (50%) y entregas que cayeron en estado "Intolerable" (10% automático).
   - Escenario de Comunicación y Permisos: Al menos 3 Circulares en MongoDB en diferentes estados (Pendiente, Enviada, Autorizada con firma física registrada) y 2 foros fijos junto con 1 foro dinámico de grupo de tareas.

Entrega el código de inserción de manera limpia, robusta y completamente ejecutable para poder correr "node seeder.js" y tener el sistema listo para pruebas de usuario de inmediato.
</task> -->


<!-- 
<role>
Actúa como un Principal Software QA Architect, Auditor de Código Senior y Especialista en Seguridad y Conectividad Fullstack. Tu objetivo es realizar una inspección minuciosa, línea por línea, de todo el ecosistema de componentes y rutas de mi aplicación para detectar fallos de integración, lógica o código faltante y que puedas ejecutar la app sin errores.
</role>

<context>
El plan de implementación y la estructura de carpetas de mi plataforma "UA" (Monolito Modular con Node.js, Express, React, Vite, MySQL y MongoDB) ya está definida. Sin embargo, antes de avanzar, necesito asegurar que no existan inconsistencias lógicas entre lo que pide el backend y lo que renderiza el frontend, y garantizar que todas las conexiones, eventos de sincronización de bases de datos e integraciones de componentes de Google Stitch UI funcionen a la perfección sin dejar pantallas rotas o endpoints sin conectar.
</context>

<task>
A continuación, te proporcionaré el código fuente completo que se ha generado hasta el momento (tanto del backend como del frontend). Realiza un análisis estricto, exhaustivo y de nivel de producción para entregarme un único informe técnico en formato Markdown, redactado completamente en español y sin usar emojis, estructurado en los siguientes tres bloques:

1. REPORTE DE INCONSISTENCIAS Y "CABLES SUELTOS" (ANÁLISIS DE FALLOS):
Detecta y lista detalladamente cada error de lógica o desconexión que encuentres en el código actual, validando específicamente:
   - Desconexiones de Rutas/Endpoints: Qué funciones o datos espera el frontend (React) que el backend (Express) no esté enviando o cuyos nombres de variables (payloads/JSON) no coincidan.
   - Fallos de Asistencia Cruzada y Sincronización: Verifica si el controlador de asistencia del curso realmente interactúa con la tabla secundaria de MySQL y si activa correctamente el disparador en MongoDB para el "Centro de Puesta al Día" del profesor sin generar inconsistencias.
   - Bloqueos de Seguridad Faltantes: Revisa si el middleware de autenticación protege correctamente las rutas críticas o si hay fugas de información donde un Estudiante o Encargado pueda acceder a datos restringidos.

2. LISTADO DETALLADO DE "QUÉ HACE FALTA" (CÓDIGO INCOMPLETO):
Especifica de manera exacta qué archivos, funciones, librerías, configuraciones de estilos de Google Stitch UI en CSS, o validaciones temporales (como el límite del mediodía para las justificaciones) se planificaron pero quedaron omitidas, vacías o en formato de comentarios descriptivos en lugar de código ejecutable.

3. PLAN DE IMPLEMENTACIÓN REPARADORA (CÓDIGO DE CORRECCIÓN):
Proporciona de forma exhaustiva, completa y sin usar placeholders (sin "// TODO") el código fuente exacto necesario para solucionar las inconsistencias más graves detectadas. Esto debe incluir:
   - Los archivos de conexión e integración corregidos.
   - Los controladores del backend que unen la lógica híbrida de bases de datos de forma segura.
   - Los componentes de React con Vite ajustados para mapear correctamente las variables del backend.

Por favor, confirma que estás listo para recibir el código fuente completo de mi plataforma para iniciar esta inspección de calidad técnica.
</task> -->


<!-- 
<role>
Actúa como un DevOps Engineer y Desarrollador Fullstack Senior experto en optimización de entornos de desarrollo con Vite, Node.js y React. Tu objetivo es migrar la configuración del frontend a Vite y darme los comandos exactos para ejecutar y levantar toda la aplicación de inmediato.
</role>

<context>
Hicimos un plan para levantar el backend y el frontend, pero decidí cambiar la configuración del frontend: no usaré "react-scripts" (Create React App), sino que obligatoriamente utilizaré Vite para el entorno de desarrollo y construcción de React. 

El proyecto sigue siendo un Monolito Modular con Node.js en el backend (puerto 5000) y React en el frontend. Necesito que el frontend corra bajo Vite y que me expliques exactamente qué comandos debo escribir en mi terminal para instalar las dependencias y encender tanto el servidor como la página web para poder verla en mi navegador. Toda la documentación de los pasos debe estar en español.
</context>

<task>
Escribe por completo los archivos de configuración solicitados y la guía de comandos de arranque, asegurando que no haya placeholders ni comentarios de omisión:

1. ARCHIVO DE CONTROL DE DEPENDENCIAS FRONTEND CON VITE (frontend/package.json)
Escribe el archivo JSON completo para el cliente React utilizando Vite. Debe incluir:
- Los scripts nativos de Vite: "dev": "vite", "build": "vite build", "preview": "vite preview".
- Las dependencias de producción: react, react-dom, y la suite de FullCalendar (@fullcalendar/react, @fullcalendar/daygrid, @fullcalendar/timegrid, @fullcalendar/interaction).
- Las devDependencies necesarias para Vite: vite, @types/react, @types/react-dom, y @vitejs/plugin-react.

2. ARCHIVO DE CONFIGURACIÓN DE VITE (frontend/vite.config.js)
Genera el archivo de configuración base de Vite completo en JavaScript:
- Importar el plugin oficial de React (`@vitejs/plugin-react`).
- Configurar el puerto por defecto del frontend (por ejemplo, el puerto 3000 o 5173).
- Configurar un proxy básico para que las peticiones del frontend a `/api` se redirijan automáticamente al backend en el puerto 5000 de Node.js, evitando problemas de CORS en desarrollo local.

3. GUÍA PASO A PASO DE EJECUCIÓN Y ARRANQUE (Documentada en Español)
Redacta una guía clara y secuencial de comandos para ejecutar en la terminal de mi computadora, dividida en:
- Paso 1: Comandos para inicializar y encender el Servidor Backend (ingresar a la carpeta backend, instalar dependencias con npm y comando para arrancar en modo desarrollo).
- Paso 2: Comandos para inicializar y encender el Frontend con Vite (ingresar a la carpeta frontend, instalar dependencias con npm y comando para lanzar el servidor de Vite).
- Paso 3: Indicación de las URLs exactas que debo abrir en mi navegador para comprobar que el servidor de Node.js responde y que la página web de React con la interfaz de Google Stitch ya es visible.
</task> -->



<!-- <role>
Actúa como un DevOps Engineer Senior y Desarrollador Fullstack experto en Node.js, Express y React. Tu único objetivo es escribir el código de arranque y los archivos de configuración faltantes para que la Plataforma Estudiantil (UA) encienda, levante los servidores y sea visible en el navegador de inmediato.
</role>

<context>
Me diste un excelente plan de implementación modular, pero el servidor no enciende y no puedo ver la página porque hacen falta los archivos de configuración inicial, las dependencias correctas, los scripts de arranque (npm start / npm run dev), las variables de entorno (.env) y el archivo de entrada principal del backend (app.js) que inicializa Express, las conexiones híbridas (MySQL con Sequelize y MongoDB con Mongoose) y el Event Broker. 

Quiero que trabajemos bajo el supuesto de que las bases de datos están corriendo localmente en los puertos estándar (MySQL en el 3306 y MongoDB en el 27017). El proyecto es un Monolito Modular. Los nombres de variables y archivos deben estar en inglés, pero toda la documentación interna y comentarios deben estar en español. No uses placeholders ni "// TODO".
</context>

<task>
Escribe en su totalidad el código funcional para los siguientes 4 archivos críticos de inicialización del sistema:

1. ARCHIVO DE CONFIGURACIÓN DE ENTORNO COMPLETO (backend/.env)
Genera el archivo con las variables de configuración estándar listas para producción y desarrollo local:
- Puerto del servidor backend (PORT=5000).
- Credenciales completas para MySQL (Host, Usuario, Contraseña, Nombre de la BD: plataforma_estudiantil).
- Cadena de conexión completa para MongoDB (MONGO_URI).
- Secreto para JWT (JWT_SECRET) y credenciales de prueba simuladas para Google Auth Client ID.

2. ARCHIVO DE CONTROL DE DEPENDENCIAS BACKEND (backend/package.json)
Escribe el archivo JSON completo. Debe incluir obligatoriamente:
- Los metadatos del proyecto.
- El script "start": "node app.js" y el script "dev": "nodemon app.js".
- Las dependencias exactas y compatibles en sus últimas versiones estables: express, mysql2, sequelize, mongoose, dotenv, jsonwebtoken, cors y nodemon (como devDependency).

3. ARCHIVO DE ENTRADA PRINCIPAL Y ARRANQUE DEL SERVIDOR (backend/app.js)
Escribe el código fuente completo en JavaScript de Node.js que realice exactamente lo siguiente:
- Importar express, cors, dotenv, Sequelize y Mongoose.
- Configurar y levantar las conexiones concurrentes a MySQL y MongoDB de forma asíncrona dentro de un bloque try/catch.
- Si las conexiones son exitosas, imprimir en la consola un mensaje claro indicando que MySQL y MongoDB están en línea.
- Configurar los middlewares globales (express.json() y cors()).
- Crear una ruta de prueba inicial (GET /api/health) que devuelva un estado { status: "online" } para verificar que el servidor Express responde en el puerto asignado.
- Inicializar el servidor escuchando en el puerto definido por el archivo .env.

4. ARCHIVO DE CONTROL DE DEPENDENCIAS FRONTEND (frontend/package.json)
Escribe el archivo JSON completo para el cliente React. Debe incluir:
- Los metadatos del proyecto frontend.
- Los scripts estándar de React: "start": "react-scripts start", "build": "react-scripts build".
- Las dependencias requeridas para la interfaz: react, react-dom, react-scripts, y la suite completa de FullCalendar (@fullcalendar/react, @fullcalendar/daygrid, @fullcalendar/timegrid, @fullcalendar/interaction).

Por favor, entrégame el código de estos 4 archivos de forma exhaustiva y limpia en formato Markdown para que pueda copiarlos, ejecutar "npm install" y encender la plataforma inmediatamente.
</task> -->


<!-- <role>
Actúa como un Ingeniero de Software Fullstack Senior, Desarrollador Principal de Node.js/React y experto en Arquitectura de Monolitos Modulares. Tu objetivo es escribir el código fuente de producción, limpio, modular y completamente funcional para los componentes visuales y el servidor backend, basándote en las especificaciones que te proporcionaré.
</role>

<context>
El modelado de las bases de datos ya está resuelto (MySQL para relacional y MongoDB para documental). El stack tecnológico obligatorio para el desarrollo es:
1. Backend: Node.js con JavaScript (Express).
2. Frontend: React con JavaScript.
3. Calendarios: FullCalendar.
4. UI/Diseño: El proyecto está creado en Google Stitch bajo el nombre oficial "UA". Debes basarte en la paleta de colores corporativa e institucional, tipografías legibles y el diseño de componentes interactivos nativos de la plataforma Stitch de Google para toda la interfaz visual.
5. Arquitectura: Monolito Modular. La comunicación entre módulos se realiza mediante un Event Broker interno (EventEmitter de Node) para sincronizar MySQL y MongoDB a nivel de código.

Roles del sistema: Administrador, Control Académico, Profesor, Encargado y Estudiante.
</context>

<task>
A continuación, te adjunto las especificaciones del sistema. Tu tarea es generar el código fuente real del proyecto. No utilices marcadores de posición (como "// TODO" o "añadir código aquí"). Todo el código debe estar escrito de forma exhaustiva. Los nombres de los archivos y variables deben estar en inglés, pero **toda la documentación interna y los comentarios del código deben estar obligatoriamente en español**.

REGLA OBLIGATORIA DE GENERACIÓN (IMPORTANTE):

No coloques ningun emoji en el codigo, ni en el nombre de los archivos, ni en los comentarios. Solo utiliza texto plano y código válido.

Desarrolla los entregables en el siguiente orden estricto:

1. ARQUITECTURA DE CARPETAS DEL MONOLITO MODULAR:
   Muestra la estructura de directorios del proyecto aislando los dominios. Por ejemplo:
   - src/modules/auth/ (Servicios, controladores y modelos de login UA-XXXXX, Google Auth, recuperación).
   - src/modules/attendance/ (Lógica de asistencia cruzada, tabla secundaria de bitácora de periodos en MySQL, alertas al Profesor Guía y activación del Centro de Puesta al Día).
   - src/modules/grades/ (Control de notas, rúbricas dinámicas, niveles de prórroga configurables y estado intolerable al 10%).
   - src/modules/communication/ (Foros fijos/dinámicos, mensajes con validación de horario de atención, circulares con sus 5 estados en MongoDB).
   - src/modules/courses/ (CRUD global de cursos y asignaciones para el Administrador).

2. SERVIDOR BACKEND (Node.js + Express):
   Escribe el código del servidor configurando:
   - Las conexiones simultáneas a MySQL (vía Sequelize/Mismísimo Driver) y MongoDB (vía Mongoose).
   - El sistema de autenticación: Generación del ID único UA-XXXXX en el registro (UA-Año-Rol-Correlativo), middleware de verificación de JWT y la ruta para Google Sign-In que valida el correo de recuperación en la base de datos.
   - Los controladores y endpoints críticos: Endpoint de asistencia por periodo (que inserta en la tabla secundaria y dispara el evento local para el Centro de Puesta al Día), endpoint de calificaciones (con la fórmula de penalización por tramos de retraso), y el endpoint de circulares (vencimiento automático).

3. COMPONENTES VISUALES (React + Google Stitch UI):
   Escribe el código de los componentes del frontend aplicando los estilos, paleta de colores y tipografía del proyecto "UA" de Google Stitch:
   - Layout Global: El Sidebar colapsable izquierdo (con el botón toggle anclado que no puede moverse del fondo izquierdo), el Topbar derecho (con los dropdowns interactivos para Avatar/Ver Perfil, Mensajes recientes con indicador de horario de atención, y Notificaciones con filtro de Alertas/Todas).
   - Tarjetas de "Mis Cursos" (Vista Profesor): Componente de tarjeta interactiva con los tres botones dedicados (Tareas, Notas, Asistencias por Curso).
   - Vista de Asistencia por Periodo (Vista Profesor): Formulario que precarga el estado del Profesor Guía, permite registrar inasistencias locales, añadir justificaciones en observaciones y bloquear días anteriores si el alumno estuvo presente.
   - Calendario Unificado (Vista Estudiante/Encargado): Implementación de FullCalendar mapeando por código de colores las tareas, eventos institucionales y eventos propios creados por el estudiante.

Genera el código de manera limpia, documentada paso a paso en español, y completamente lista para conectarse a las bases de datos.
</task> -->
