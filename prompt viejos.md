<role>
Actúa como un Diseñador UI/UX Senior y Desarrollador Frontend Experto en Google/Stitch UI. Tu enfoque principal hoy es la consistencia visual y la eliminación de deuda técnica en la interfaz.
</role>

<context>
Ya hemos finalizado las funciones base del sistema, pero hay problemas de uniformidad. El módulo de **Foros** aparece en los roles de Profesor, Tutor y Estudiante, pero cada uno se ve con un diseño diferente. Queremos unificar el diseño visual de todos los foros tomando como plantilla de oro el estilo actual del **Portal de Profesores** utilizando las variables estéticas de Stitch.
</context>

<requirements>
### 1. Unificación Estética Global (Todos los Roles)
*   Aplica el diseño de tarjetas, tipografías y burbujas de discusión del rol de profesor a las vistas de foros del Estudiante y del Tutor para que se vean exactamente iguales.
*   **Función Común de Ordenamiento:** Implementa una herramienta o botón en la cabecera que permita a **todos los roles (Profesor, Estudiante y Tutor) ordenar sus foros** (por ejemplo: por fecha de creación, más recientes o alfabéticamente).

### 2. Panel Exclusivo y Permisos del Rol: Profesor
Mantén y asegura las siguientes herramientas avanzadas únicamente para el docente:
*   **Botón "Crear Foro":** Agrega un apartado destacado en el **lado derecho** de la pantalla exclusivo para el profesor.
*   **Segmentación de Audiencia:** Al crear un foro, despliega un selector dinámico para elegir a quiénes ingresar. El profesor **está restringido** a seleccionar únicamente a:
    *   Estudiantes de las secciones donde imparte clases o de los que sea Profesor Guía.
    *   Tutores/Padres de familia vinculados a esos mismos estudiantes.
*   **Control Total:** El profesor es el único con botones visibles para **Modificar** (Editar título/descripción) o **Eliminar** de forma definitiva los foros creados por él.
</requirements>

<instructions>
1. Refactoriza el código de los foros en los tres roles para que consuman los mismos estilos base de Stitch (`var(--stitch-...)`).
2. Agrega comentarios limpios indicando cómo el frontend debe ocultar condicionalmente el panel derecho de creación y los botones de edición para los roles de estudiante y tutor usando variables de sesión.
</instructions>



<role>
Actúa como un Diseñador UI/UX Senior y Desarrollador Frontend Experto en React y sistemas de diseño educativo. Tu objetivo es limpiar, reestructurar e implementar todo el flujo de interfaz correspondiente al **Rol de Estudiante**, garantizando consistencia absoluta y reutilizando los patrones visuales globales del proyecto (`Stitch` / Google).
</role>

<context>
Estamos construyendo y depurando el panel del **Estudiante**. Es fundamental garantizar la privacidad del alumno (solo puede ver su propia información y la de nadie más). 

Para mantener el diseño unificado, debes basarte en los componentes de tablas, cuadrículas de horarios, hovers y badges de color que ya usamos en el portal de profesores y tutores.
</context>

<requirements>
### 1. Limpieza y Reestructuración Estricta del Menú Lateral (Sidebar)
*   **Acción Obligatoria:** Elimina absolutamente todos los botones o enlaces que no se estén utilizando en el menú del estudiante.
*   **Estructura Final:** El menú debe quedar limpio y contener **únicamente** los siguientes accesos:
    1.  *Inicio (Dashboard)*
    2.  *Mis Cursos* (Nuevo botón)
    3.  *Mis Calificaciones*
    4.  *Calendario Escolar*
    5.  *Mis Foros Académicos*

### 2. Implementación de los Módulos del Menú

#### 📌 Botón: "Mis Cursos" (Con Gestión de Tareas y Entregas Virtuales)
*   **Diseño:** Vista de tarjetas (Cards) estilizadas para listar las materias vigentes del alumno. Debe lucir estéticamente idéntica a la sección de cursos del portal de profesores.
*   **Interacción y Flujo de Tareas:** Al hacer clic en una tarjeta de curso, se debe abrir un desglose con las tareas específicas de esa materia.
*   **Mapeo de Modalidad de Entrega:** El sistema debe evaluar de forma condicional el tipo de entrega configurado por el docente para cada tarea:
    *   *Si la entrega es Física:* Muestra un indicador claro que diga "Entrega Presencial en el Aula" y los detalles/recursos de la asignación.
    *   *Si la entrega es Virtual:* Habilita dinámicamente un **Cargador de Archivos (File Uploader)** interactivo. El estudiante debe poder arrastrar o seleccionar sus documentos (PDF, Word, imágenes) y presionar un botón de **"Entregar Tarea"**.
*   **Estados de la Entrega:** Tras realizar el envío, la interfaz debe actualizarse reactivamente mostrando un Badge de Stitch UI con el estado "Entregada" junto con la fecha y hora exacta del envío. Si la fecha límite ya expiró, el cargador de archivos debe bloquearse automáticamente (disabled) a menos que el alumno posea una prórroga activa por inasistencia justificada.

#### 📌 Botón: "Mis Calificaciones" (Vista espejo del Tutor)
Estructura este apartado reutilizando la misma lógica y diseño limpio que visualiza la madre en su portal de rendimiento:
*   **Progreso Académico:** Lista de materias vigentes que muestra en tiempo real la nota obtenida cada vez que el profesor la suba al sistema.
*   **Historial de Entregas:** Registro ordenado de cada actividad enviada que muestra de forma explícita y transparente la fecha y hora exacta en la que el estudiante subió la tarea.

#### 📌 Botón: "Calendario Escolar" (Con Eventos Propios)
Crea una vista unificada (Mensual, Semanal y Diaria) utilizando un sistema visual de códigos de color de Stitch UI para categorizar:
*   **Tareas y Evaluaciones (Rojo/Naranja):** Fechas límite de entrega y aplicación de exámenes cortos o parciales fijadas por los maestros.
*   **Eventos Escolares (Azul/Verde institucional):** Actividades generales y excursiones autorizadas por el colegio.
*   **Eventos Propios (Color de Acento Personalizado):** Espacio interactivo donde el alumno puede crear, editar y organizar sus propios recordatorios o actividades personales dentro del calendario (estos eventos son privados y solo los ve él).

#### 📌 En la vista de Inicio: Botón "Horarios"
*   **Diseño:** Al presionar este botón, despliega la matriz semanal (Lunes a Viernes) distribuida en bloques de 50 minutos con el tiempo de recreo intermedio fijo.
*   **Lógica:** Debe ser visualmente idéntica a la cuadrícula del portal de profesores, con la diferencia de que cargará dinámicamente **todos los cursos propios del estudiante** en sus respectivas horas, marcando como "Periodo Libre" los bloques donde su grupo no tenga clases asignadas.

#### 📌 Botón: "Mis Foros Académicos" (Orientado al Alumno)
Crea el centro de comunidades adaptando las reglas de negocio del profesor al entorno del estudiante (Rol de Participante):
*   **Foros Fijos de Clase:** Un foro permanente por cada materia vigente. Son obligatorios; el alumno puede leer y comentar, pero no tiene permisos para ocultarlos, archivarlos ni eliminarlos.
*   **Foro con Profesor Guía:** Canal fijo de comunicación directa entre el grupo de alumnos del salón y su docente guía asignado. Es inamovible.
*   **Foros de Actividades Especiales:** Canales dinámicos para proyectos específicos. El alumno participa de forma activa, pero la eliminación de estos foros es exclusiva del profesor.
*   **Foros de Tareas en Grupo:** Espacios colaborativos cerrados creados por el maestro. Solo se le visualiza al estudiante si fue asignado a ese equipo específico para coordinar el trabajo en grupo.
</requirements>

<instructions>
1. Utiliza las variables CSS globales (`var(--stitch-...)`) para mantener la homogeneidad visual en hovers de botones, tablas, bordes redondeados y cargadores de archivos.
2. Asegúrate de que todas las interfaces sean 100% responsivas para dispositivos móviles (especialmente la cuadrícula de horarios, el calendario y el uploader de tareas).
3. Añade comentarios limpios en el código indicando la estructura del JSON y la petición multipart/form-data (FormData) que debe procesar el backend en Node.js para guardar de forma segura los archivos adjuntos de las tareas del estudiante.
</instructions>



<!-- <role>
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
 -->

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


<role>
Actúa como un Desarrollador Full-Stack Senior experto en React, Node.js y arquitectura UI/UX para portales familiares en sistemas educativos (LMS). Tu especialidad es transformar reglas de negocio complejas y condicionales en interfaces de usuario sumamente claras, estéticas y fáciles de comprender.
</role>

<context>
Estamos desarrollando el módulo correspondiente al **Rol de Tutor (Padre de Familia)**. En el menú de navegación lateral ya existe un botón llamado "Rendimiento Académico". Necesito que programes toda la lógica interna de este apartado utilizando de forma estricta las variables visuales, tipografías, componentes y animaciones de nuestro sistema de diseño corporativo (Stitch / Google). El objetivo es que el padre pueda supervisar de forma transparente el avance, las notas, las prórrogas y las penalizaciones de su hijo.
</context>

<requirements>
### 1. Vista General de Materias (Pantalla Inicial)
Al hacer clic en "Rendimiento Académico", renderiza un panel general con:
*   **Listado de Cursos:** Tarjetas (Cards) o filas estilizadas de los cursos actuales en los que el estudiante está inscrito, mostrando su progreso individual.
*   **Métricas Globales:** Un contenedor destacado que muestre visualmente el promedio actual por materia y el **Promedio General Acumulado** del alumno en el ciclo escolar.

### 2. Panel Detalle por Curso (Navegación Interna)
Al hacer clic sobre cualquier tarjeta de materia, el sistema debe abrir una vista detallada dividida estrictamente en tres pestañas (Tabs) interactivas utilizando componentes de Stitch UI:

#### 📌 Pestaña 1: Próximas Tareas y Evaluaciones (Por Entregar)
*   **Cronograma:** Lista ordenada cronológicamente de las actividades pendientes.
*   **Filtro de Seguridad:** Solo muestra las actividades que el profesor configuró como "Visibles" o cuya fecha programada de publicación ya se cumplió.
*   **Modal de Detalle:** Al hacer clic en un elemento, despliega un modal con: Tipo de actividad (Parcial, Corto, Tarea, etc.), Descripción detallada, Recursos adjuntos (links o archivos para descargar) y la Fecha/Hora exacta de entrega.

#### 📌 Pestaña 2: Historial de Entregas y Calificaciones
Una tabla o listado estructurado de las actividades ya procesadas, donde cada fila debe evaluar de forma reactiva el estado del envío mediante indicadores de color (Badges de Stitch):
*   **Estado: Calificada (Verde):** Muestra la nota obtenida (`nota / nota_maxima`) y la fecha en que el maestro la calificó.
*   **Estado: Pendiente de Calificar (Azul/Gris):** Confirma que el alumno entregó a tiempo, mostrando la fecha de envío y la fecha límite original para tranquilidad del padre.
*   **Estado: Entregada con Retraso / Penalizada (Naranja/Amarillo):** Muestra la fecha real versus la límite. Aplica en tiempo real los niveles de prórroga configurados por el docente:
    *   *Retraso Nivel 1:* Nota máxima sobre el 75%.
    *   *Retraso Nivel 2:* Nota máxima sobre the 50%.
    *   *Retraso Nivel 3:* Nota máxima sobre el 25%.
    *   *Intolerable (10%):* Si el tiempo venció, la prórroga expiró y no hay justificación aprobada, la tarea se bloquea con nota automática fija del 10% del valor total.
    *   *Nota:* Muestra de forma transparente la nota original calculada y el descuento aplicado.
*   **Estado: Justificada por Ausencia (Morado/Celeste):** Si el alumno faltó el día de la entrega y el padre lo justificó, reemplaza la nota temporalmente con la etiqueta "Justificada". Incluye un botón que redirija al tutor directamente al módulo *"Itinerario de puesta al día"*.
*   **Estado: Caso Especial / Excepción (Color de Acento Stitch):** Asignado manualmente por el profesor. Debe renderizar en pantalla: La nota justificativa del maestro, el porcentaje máximo personalizado (ej: "Calificable sobre el 90%") y la Nueva Fecha Límite acordada.

#### 📌 Pestaña 3: Alertas de Incumplimiento (Tareas Vencidas)
*   **Filtro de Incumplimiento:** Lista exclusiva de actividades cuya fecha límite ya expiró y el estudiante **no entregó nada**, siempre y cuando no exista una inasistencia justificada vigente.
*   **Línea de Tiempo de Gracia Activa:** Si la tarea aún está dentro de los días de gracia de la prórroga, muestra un cronograma visual con los tramos de penalización que le quedan al alumno:
    *   "Vence [Fecha] - Calificación máxima: 75%" -> "Vence [Fecha] - Calificación máxima: 50%"... etc.
*   **Urgencia UI:** Agrega una barra de progreso de tiempo o un contador regresivo llamativo utilizando tonos de alerta de Stitch (ej: *"Te quedan X horas para entregar sobre el 50% de la nota"*).

### 3. Módulo de Reportes de Calificaciones
*   En la esquina superior del panel de rendimiento, agrega un botón de acción para la descarga de reportes periódicos (mensuales o bimestrales).
*   Permite exportar en un formato PDF limpio, corporativo y apto para impresión las notas de una materia individual o el boletín de calificaciones generales del estudiante.
</requirements>

<instructions>
1. Utiliza las variables CSS nativas de la aplicación (`var(--stitch-...)`) y elementos limpios basados en Google/Stitch UI para garantizar que los hovers, tipografías y bordes encajen con el resto del proyecto.
2. Asegúrate de estructurar de forma modular los componentes del historial de calificaciones para que el código sea limpio y escalable.
3. Agrega comentarios técnicos claros en el código indicando la estructura del JSON que el backend (Node.js) debe enviar (con las fechas formateadas, estados calculados y arrays de niveles de prórroga) para que el frontend renderice las alertas y cronogramas dinámicamente.
</instructions>



<role>
Actúa como un Desarrollador Full-Stack Senior experto en React, Node.js y diseño de arquitecturas basadas en Máquinas de Estados Finitos (Finite State Machines) para plataformas educativas. Tu especialidad es construir interfaces limpias que controlen ciclos de vida de documentos complejos y flujos de escalabilidad de casos.
</role>

<context>
Estamos desarrollando dos nuevos módulos críticos para el **Rol de Tutor / Padre de Familia** dentro de la plataforma escolar. En el menú lateral se deben crear o modificar dos accesos: un botón llamado **"Circulares y Firmas"** y otro llamado **"Gestión de Casos"** (para incidentes, quejas y citas). 

Necesito que programes el Frontend y estructures la lógica del Backend en Node.js utilizando de forma estricta las variables visuales, tipografías y componentes de nuestro sistema de diseño corporativo (Stitch / Google). El sistema debe ser altamente consistente, dinámico y a prueba de errores.
</context>

<requirements>
### MÓDULO 1: CIRCULARES Y AUTORIZACIONES ("Circulares y Firmas")
Diseña una interfaz dividida en dos secciones principales para gestionar la comunicación oficial emitida por la Dirección:

#### 1. Circulares Informativas
*   **Contenido:** Listado de comunicados oficiales, asuetos, circulares de uniformes o boletines que solo requieren lectura.
*   **Automatización UI:** Al momento de hacer clic y abrir la circular para leer el documento, el frontend debe disparar automáticamente una petición al backend para actualizar el marcador visual del padre de "No leído" a **"Leído"**.

#### 2. Autorizaciones Especiales (Ciclo de Vida de 5 Estados y Lógica de Vencimiento)
Crea una interfaz de pestañas (Tabs) o filtros para organizar los documentos según su estado, recordando que **el padre solo puede interactuar con las circulares en estado "Enviada"**:
*   **Flujo de Métodos de Autorización:**
    *   *Virtual:* El padre aprueba de forma digital con un botón directo desde su panel. Al dar clic, cambia a **"Autorizado"** y desbloquea el evento en el calendario del alumno.
    *   *Presencial:* El padre firma la boleta física de papel. En la interfaz del padre, este caso se muestra como **"Pendiente de Firma (Física)"** con una *Nota Informativa* que indica que debe entregar el formato físico. Cuenta con un botón de **"No Autorizar"** si desea rechazar la participación anticipadamente. Cuando el colegio recibe el papel y lo digita, el estado del padre cambia a **"Autorizado"** en su historial con fecha y hora.
*   **Filtros por Estado en la UI del Padre:**
    *   *Pendiente (Estado Oculto):* La secretaría la redacta, pero permanece invisible para el padre.
    *   *No Enviada (Estado Oculto):* Exclusivo presencial. Aprobada internamente pero en proceso de impresión física. Invisible para el padre.
    *   *Enviada (Visible/Acción Obligatoria):* Alerta prioritaria en el panel. Muestra costo, lugar, fecha del evento y la fecha límite de respuesta. Habilita acciones de firma digital o rechazo.
    *   *Autorizado (Historial):* Archivo de circulares aprobadas digitalmente o procesadas físicamente por el colegio.
    *   *No Autorizado (Archivo/Vencidas):* Archivo de circulares rechazadas manualmente o bloqueadas por el sistema.
*   **Lógica de Vencimiento Automático (Backend):** Todas las circulares en estado "Enviada" exigen una fecha y hora límite. Si se cumple el plazo sin recibir firma virtual o registro presencial del papel, un proceso en segundo plano (cron job) debe cambiar el estado automáticamente a **"No Autorizado"** y bloquear cualquier acción posterior del padre.

---

### MÓDULO 2: GESTIÓN DE INCIDENTES, QUEJAS Y CITAS ("Gestión de Casos")
Crea un espacio centralizado para reportar inconformidades, dar seguimiento conductual y coordinar reuniones, dividido en dos pestañas:

#### 1. Pestaña de Reportes, Quejas e Incidentes (Flujo y Estados)
*   **Origen del Reporte (Creación):** El padre puede rellenar un formulario para enviar quejas o inconformidades dirigidas al *Profesor* o a la *Secretaría* según el caso.
*   **Ruta de Escalabilidad (Backend/Docente):** Si el padre envía el caso al profesor, pero este determina que es administrativo, el docente puede presionar un botón de "Escalar". El sistema transferirá automáticamente el caso a la bandeja de la Secretaría, notificando al padre sobre el movimiento del caso.
*   **Control Reactivo de Estados en la UI:**
    *   `Enviado`: Estado inicial del caso. El creador puede editarlo.
    *   `En Revisión`: El destinatario (profesor/secretaría) abre el caso. En este instante, el sistema **bloquea automáticamente la opción de edición** para el padre.
    *   `Resuelto`: El personal del colegio escribe una respuesta y lo marca como solucionado.
    *   `Cerrado por el Padre`: El padre valida la solución y presiona un botón para archivar el caso definitivamente.
    *   `Reabierto (En Desacuerdo)`: Si el padre rechaza la solución, presiona un botón que reabre el caso para continuar el diálogo, habilitando de nuevo la edición.

#### 2. Pestaña de Gestión de Citas Presenciales
*   **Solicitud del Padre:** El padre puede pedir una reunión. La interfaz debe cargar dinámicamente un calendario que consuma los bloques de horarios y días libres que el docente configuró previamente en su rol como "Disponibles".
*   **Solicitud del Profesor / Alertas prioritarias:** Muestra las citas que el maestro convocó hacia el padre. Si el profesor activó el interruptor de **"Prioritaria"**, la tarjeta de la cita debe resaltar en un color de alerta llamativo (tonos rojos/amarillos de Stitch) indicando atención inmediata.
</requirements>

<instructions>
1. Escribe componentes altamente modulares en React utilizando las variables CSS globales de Stitch (`var(--stitch-...)`) para mantener la homogeneidad visual en hovers, botones, tablas y bordes.
2. Utiliza estados visuales limpios (Badges/Etiquetas de colores) para representar de forma intuitiva los 5 estados de las circulares y los 5 estados de los reportes de incidentes.
3. Agrega comentarios técnicos claros en el código detallando la estructura ideal del JSON y las mutaciones que debe manejar el backend en Node.js para las transiciones de estados, validaciones de fechas límites y el flujo de escalabilidad a secretaría.
4. Asegúrate de que las interfaces sean 100% responsivas para dispositivos móviles.
</instructions>



<role>
Actúa como un Arquitecto de Software Full-Stack Senior, Ingeniero de QA y Especialista en UI/UX. Tu objetivo es diseñar e implementar todo el flujo de Frontend y la lógica de endpoints del Backend para el **Rol de Secretaría / Administración**, garantizando que el sistema sea consistente, modular y reutilice las variables estéticas de la plataforma (`Stitch` / Google).
</role>

<context>
Vamos a construir y estructurar los módulos clave que componen el panel de control de la Secretaría. Para el diseño gráfico, te debes guiar y ayudar de las interfaces complejas y limpias del portal de padres y profesores (utilizando los mismos hovers, tipografías, bordes redondeados y Badges dinámicos de `--stitch`). El menú lateral de navegación debe actualizarse con los 6 botones descritos a continuación.
</context>

<requirements>
### 1. Botón: "Gestión de Alumnos y Familias" (Fichas de Estudiantes)
*   **Listado General:** Diseña una tabla interactiva de alumnos inscritos con filtros fluidos por Grado y Sección.
*   **Ventana de Perfil (Drawer o Modal):** Al presionar a un estudiante, despliega un panel con sus datos y un botón explícito de **"Ver perfil"** para su ficha académica.
*   **Vinculación Familiar:** En la misma ventana, muestra tarjetas circulares con los avatares de los padres/encargados registrados y autorizados por alumno, definiendo su parentesco. Al presionarlos, el sistema debe redirigir inmediatamente al **perfil específico del tutor** seleccionado.
*   **Control de Privacidad:** Agrega interruptores (Toggles) para configurar de forma granular qué datos personales específicos puede visualizar cada tutor en su perfil privado.

### 2. Botón: "Personal y Horarios" (Control de Profesores)
*   **Listado de Docentes:** Vista de cuadrícula o filas que liste al cuerpo de profesores de la institución. En la parte inferior de la tarjeta o fila de cada maestro, añade de forma fija dos botones de acción:
    1.  **"Ver Perfil":** Redirige a la hoja de vida y datos administrativos del docente.
    2.  **"Ver Horarios":** Despliega una matriz semanal dinámica (Lunes a Viernes) basada en los periodos escolares de 50 minutos.
*   **Monitoreo y Soporte:** La vista de horarios debe pintar con colores de acento de Stitch qué materias imparte, en qué salones y a qué horas exactas. Además, debe resaltar visualmente los **"Horarios de Atención"** (bloques que el docente configuró para citas), sirviendo como herramienta de soporte para programar reuniones cuando un padre llame por teléfono.

### 3. Botón: "Control de Asistencia" (Asistencia General)
*   **Registro Diario de Faltas:** Panel de control estilo auditoría que lista los grados y secciones. Al ingresar a un grado, despliega la lista de estudiantes con el estado de asistencia matutina reportado por el Profesor Guía.
*   **Disparador y Automatización de Alertas:** Incorpora un botón destacado de **"Confirmar y Notificar Faltas"**. Al presionarlo, el sistema dispara en background (Node.js) un correo electrónico automático al padre del alumno ausente, adjuntando en formato PDF el *Itinerario de puesta al día* generado automáticamente por el docente para esa fecha.

### 4. Botón: "Circulares y Firmas" (CRUD y Autorizaciones)
*   **Creador de Documentos (CRUD):** Formulario avanzado para redactar comunicados institucionales, definir si es "Informativa" o "Autorización Especial" (Física o Virtual), y configurar obligatoriamente la fecha y hora límite de vencimiento.
*   **Gestión del Ciclo de Vida (Estados de Envío):** Los documentos inician con la etiqueta amarilla de **"Pendiente"** (oculta para usuarios). Un botón de publicación cambia el estado a **"Enviada"**, haciéndola visible en el portal de padres.
*   **Recepción de Firmas Físicas:** Panel rápido de búsqueda por grado. Cuando un alumno entrega la boleta de papel firmada en físico, la secretaria busca al estudiante y presiona un botón para marcarlo manualmente como **"Autorizado"**, registrando la fecha/hora en la base de datos y desbloqueando el evento en el calendario del alumno.

### 5. Botón: "Atención de Incidentes" (Buzón y Casos)
Organiza este espacio centralizado de atención al cliente/padre mediante tres bandejas utilizando componentes de pestañas (Tabs):
*   **A. Buzón de Quejas e Inconformidades:** Listado de los reportes creados digitalmente por los padres en sus portales dirigidos directamente a la administración.
*   **B. Bandeja de Casos Escalados:** Espacio prioritario para atender y dar resolución a los incidentes conductuales o administrativos que los profesores desviaron de su curso hacia secretaría por no ser de índole pedagógica.
*   **C. Registro de Incidentes Presenciales:** Formulario de captura rápida para que la secretaria digite un caso si el padre se presenta físicamente a las oficinas (Campos: Selector de Alumno, Tipo de Incidente, Descripción, Acciones tomadas).
*   **D. Centro de Citas Presenciales:** Calendario administrativo para monitorear, rechazar o aprobar las solicitudes de reuniones presenciales/urgentes entre padres, profesores y dirección.

### 6. Botón: "Foro Institucional" (Comunidad Docente)
*   **Canales Docentes-Secretaría:** Interfaz de hilos y salas de chat. Permite a la secretaria crear, nombrar y gestionar foros privados dirigidos exclusivamente al cuerpo de profesores para coordinar circulares antes de publicarse.
*   **Foros Temáticos y de Padres:** Herramienta para abrir canales de debate específicos para la comunidad de padres (Ej: *Foro Organización del Aniversario*, *Consultas de Transporte*).
*   **Control de Moderación Absoluta:** Botones rápidos en las publicaciones para que la secretaria pueda archivar hilos enteros, cerrar cajas de comentarios para bloquear respuestas o eliminar mensajes inapropiados de raíz.
</requirements>

<instructions>
1. Escribe componentes altamente responsivos e interactivos en React, utilizando de forma rigurosa las variables CSS globales de Stitch (`var(--stitch-...)`) para mantener la homogeneidad visual con el portal de padres.
2. Utiliza etiquetas visuales claras (Badges de colores) para los estados del ciclo de vida de las circulares (Pendiente, Enviada, Autorizado, No Autorizado, No Enviada) y de los incidentes (Enviado, En Revisión, Resuelto, Cerrado).
3. Añade comentarios arquitectónicos limpios en el código indicando la estructura ideal del JSON y las peticiones fetch/axios hacia Node.js para las mutaciones de estados, vinculaciones de perfiles familiares y disparadores de correos automatizados.
</instructions>


<role>
Actúa como un Desarrollador Full-Stack Senior, Especialista en Ciberseguridad y Experto en Debugging de Sistemas de Autenticación. Tu objetivo es auditar y diagnosticar un fallo crítico en el sistema de inicio de sesión (Login) de mi aplicación.
</role>

<context>
Actualmente el módulo de Login no está funcionando de manera correcta y los usuarios no pueden iniciar sesión. Necesito que actúes como un detective de código, analices el flujo completo de autenticación y me ayudes a identificar la causa raíz del problema para solucionarlo de inmediato.
</role>

<instructions_for_debugging>
Por favor, guíame paso a paso a través de las siguientes verificaciones para encontrar el error:

### 1. Auditoría del Frontend (React / Fetch)
*   **Formateo de Datos:** Revisa si las credenciales (`codigoUA` o `correo` y `contraseña`) se están capturando bien en el estado (`useState`) y si se están enviando con la estructura exacta que espera el servidor.
*   **Cabeceras de la Petición:** Verifica que la petición HTTP (fetch o axios) incluya correctamente la cabecera `'Content-Type': 'application/json'`.
*   **Manejo de la Respuesta:** Revisa el bloque `try/catch` o las promesas del login. Analiza si la app se cae antes de recibir la respuesta, si falla al hacer el `response.json()` debido a un cuerpo vacío, o si no está almacenando correctamente el Token (JWT/Cookie).

### 2. Auditoría del Backend (Node.js / Express)
*   **Middleware de Lectura:** Verifica si el backend tiene configurado el middleware `express.json()` en el archivo principal (`server.js` o `app.js`) para poder leer el cuerpo (`req.body`) de las peticiones POST.
*   **Conexión a la Base de Datos:** Analiza si la ruta del login se queda colgada (Timeout) o responde un Error 500 debido a una falla de conexión con la base de datos o variables de entorno (`.env`) mal cargadas.
*   **Lógica de Validación:** Revisa el proceso de comparación de contraseñas (por ejemplo, con `bcrypt.compare`). Verifica si el error ocurre porque los datos de prueba no están encriptados en la base de datos o si las consultas (Queries) están buscando por los campos incorrectos.
*   **CORS (Cross-Origin Resource Sharing):** Confirma si el navegador está bloqueando la petición debido a una mala configuración de las políticas de CORS entre el puerto del Frontend y el del Backend.

### 3. Plan de Acción y Solución
*   Dime qué comandos o líneas de código exactas (`console.log`, inspección de red en el navegador, o revisión de logs en la terminal del backend) debo ejecutar para darte la información que necesitas.
*   Proporcióname un ejemplo de código limpio y seguro tanto para el componente de Login en el Frontend como para la ruta en el Backend que maneje correctamente todos los posibles errores (credenciales incorrectas, servidor caído, datos vacíos) sin romper la aplicación.
</instructions_for_debugging>


<role>
Actúa como un Desarrollador Full-Stack Senior experto en WebSockets, Node.js y persistencia de datos en bases de datos.
</role>

<context>
El sistema de chat tiene un fallo crítico: los mensajes se muestran en la pantalla al escribir, pero no se están guardando en la base de datos. Al recargar o refrescar la página, todo el historial desaparece y vuelve al estado inicial. 

Necesito que corrijas este flujo integrando **Socket.io** para la comunicación en tiempo real y asegurando la persistencia de cada mensaje en el backend.
</context>

<requirements>
### 1. Persistencia de Mensajes (Backend Node.js + DB)
*   Modifica el flujo de envío de mensajes para que, cada vez que un usuario envíe un texto, se realice de forma obligatoria e inmediata la inserción o guardado en la base de datos (con campos como: `id_remitente`, `id_receptor`, `id_foro_o_chat`, `mensaje`, `timestamp`).
*   Asegúrate de que al cargar el componente en el Frontend, el hook `useEffect` consuma un endpoint de la API que devuelva de forma limpia todo el historial de mensajes guardados previamente.

### 2. Implementación de Tiempo Real con Socket.io
*   **Backend:** Configura el servidor de Express con Socket.io para escuchar eventos de conexión y canales específicos por chat o foro. Al recibir un mensaje, el servidor debe guardarlo en la base de datos y simultáneamente emitirlo (`io.to(room).emit('recibir_mensaje', ...)`) a los usuarios conectados en esa sala.
*   **Frontend (React):** Conecta el cliente de Socket.io. Configura los listeners para que la caja de chat se actualice reactivamente en la pantalla de ambos usuarios en tiempo real, sin necesidad de refrescar el navegador.

### 3. Experiencia de Usuario (UI/UX con Stitch)
*   Mantén los avatares circulares y el estilo estético unificado de Stitch.
*   Añade un indicador visual de "Enviando..." o "Error al enviar" si la conexión del WebSocket o el guardado en la base de datos llega a fallar.
</requirements>

<instructions>
1. Proporciona el código de configuración del lado del servidor (Node.js/Socket.io) y del lado del cliente (React/Socket.io-client).
2. Asegúrate de estructurar el código para que al desconectarse el usuario se limpien correctamente los listeners y evitar fugas de memoria (`memory leaks`).
</instructions>

