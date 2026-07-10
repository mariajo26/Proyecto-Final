# Plan de Implementación - Código Fuente de la Plataforma Estudiantil

Este plan detalla el proceso para estructurar y escribir el código fuente modular y de producción para la **Plataforma Estudiantil (UA)**. El código se dividirá en un servidor backend con arquitectura de monolito modular en Node.js y componentes visuales interactivos en React con diseño responsivo basado en la identidad visual de Google Stitch.

---

## Estructura de Directorios del Proyecto

Proponemos la siguiente estructura de carpetas limpia y aislada por dominios en la raíz del espacio de trabajo:

```
plataforma-estudiantil/
├── database/                    # (Creados anteriormente: schema.sql y mongoose_schemas.js)
│
├── backend/                     # Código del Servidor Node.js + Express
│   ├── package.json             # Dependencias del servidor (Express, Mongoose, Sequelize, JWT, etc.)
│   ├── app.js                   # Configuración del servidor y conexiones concurrentes a bases de datos
│   ├── utils/
│   │   └── eventBroker.js       # EventEmitter local para sincronización y comunicación modular
│   └── modules/
│       ├── auth/
│       │   ├── auth.controller.js # Lógica de login, Google Auth, generación de UA-YYRXX e iniciales
│       │   └── auth.routes.js     # Rutas de autenticación
│       ├── attendance/
│       │   ├── attendance.controller.js # Asistencia general, asistencia local y reincorporación
│       │   └── attendance.routes.js     # Rutas de asistencia
│       ├── grades/
│       │   ├── grades.controller.js     # Evaluación de tareas, penalizaciones flexibles y excepciones
│       │   └── grades.routes.js         # Rutas de calificaciones
│       └── communication/
│           ├── comm.controller.js       # Foros, mensajes (horario de atención) y cron de circulares
│           └── comm.routes.js           # Rutas de comunicación y circulares
│
└── frontend/                    # Código del Cliente React
    ├── package.json             # Dependencias de React y FullCalendar
    └── src/
        ├── styles/
        │   └── StitchTheme.css  # Definición de variables CSS para la identidad visual "UA" de Google Stitch
        └── components/
            ├── Layout.jsx       # Componente contenedor global
            ├── Sidebar.jsx      # Menú colapsable con el botón toggle anclado a la izquierda
            ├── Topbar.jsx       # Barra superior con avatar, mensajes y alertas dinámicas
            ├── CourseCard.jsx   # Tarjetas de cursos para la vista del Profesor
            ├── PeriodAttendance.jsx # Formulario de asistencia cruzada por periodo para Profesores
            └── UnifiedCalendar.jsx  # Calendario unificado de FullCalendar (Cursos, tareas y eventos propios)
```

---

## 1. Código del Servidor Backend (Node.js + Express)

*   **Configuración e Integración Híbrida (`backend/app.js`):**
    *   Carga de variables de entorno y middlewares globales (CORS, Express JSON).
    *   Inicialización simultánea de **Sequelize** (MySQL: `plataforma_estudiantil`) y **Mongoose** (MongoDB).
    *   Montaje de las rutas agrupadas de los módulos.
*   **Módulo de Autenticación (`backend/modules/auth/`):**
    *   **Generación de UA-YYRXX:** Algoritmo dinámico en el registro de usuarios que valida el año del sistema, mapea el rol (1 al 5) y genera el correlativo incremental, soportando desborde a 3 dígitos si supera los 99 usuarios.
    *   **Google Sign-In:** Ruta que extrae el correo electrónico desde el ID Token verificado por Google Auth, cruza con la columna `correo_recuperacion` en MySQL y emite el JWT del sistema si el usuario está activo.
    *   **Seguridad:** Middleware para proteger rutas por JWT y roles, y sanitizador del perfil que bloquea la modificación de campos del sistema para usuarios comunes.
*   **Módulo de Asistencia Cruzada (`backend/modules/attendance/`):**
    *   Endpoint de asistencia por periodo que inserta el estado en la tabla transaccional secundaria `inasistencias_periodos`.
    *   Lógica de reincorporación (cascada): Si el alumno estaba ausente general y se le marca presente local, la asistencia general matutina se actualiza a "Llegada Tarde", y se dispara el evento a través del broker local para reajustar los itinerarios de contingencia.
*   **Módulo de Calificaciones y Penalizaciones (`backend/modules/grades/`):**
    *   Fórmula del cálculo de la nota aplicando penalizaciones por tramos de retraso, consultando las tolerancias en `configuraciones_sistema` y los niveles que el profesor seleccionó en el JSON de la actividad.
    *   Mecanismo de excepción manual ("Caso Especial") o por justificación aprobada.
*   **Módulo de Comunicación (`backend/modules/communication/`):**
    *   Envío de mensajes directos en MongoDB con validación contra el horario de atención configurado del receptor en MySQL (retorna advertencia si es fuera de horario).
    *   Script simulado de cron job para la consolidación de inasistencias sin justificar (a las 12:00 PM del día siguiente) y para el vencimiento automático de circulares de consentimiento no firmadas.

---

## 2. Componentes Visuales Frontend (React + Google Stitch UI)

El diseño visual reflejará el concepto institucional de Google Stitch para el proyecto "UA" mediante la paleta de colores oficial:

> [!TIP]
> **Paleta de Colores de Google Stitch (Proyecto UA):**
> *   **Primary (Corporativo/Institucional):** Deep Blue (`#0D2C54`) para cabeceras y elementos estructurales.
> *   **Secondary (Enfoque Escolar):** Indigo/Medium Blue (`#3B82F6`) para botones, selecciones y navegación activa.
> *   **Background:** Warm Light Grey (`#F8FAFC`) con paneles blancos y bordes redondeados limpios.
> *   **Accent (Estados/Estados de Alerta):** Amber/Gold (`#F59E0B`) para alertas y tareas entregadas con retraso; Coral Red (`#EF4444`) para inasistencias y tareas vencidas; Green (`#10B981`) para asistencias y autorizaciones completadas.
> *   **Tipografía:** Inter o Roboto con pesos visuales marcados para jerarquía jerárquica limpia.

*   **Layout Global (`frontend/src/components/Layout.jsx`, `Sidebar.jsx`, `Topbar.jsx`):**
    *   **Sidebar Colapsable:** Ancho completo de la pantalla vertical con el botón interactivo de Toggle anclado al extremo superior izquierdo (el cual permanece en el fondo del lado izquierdo). Menú cargado dinámicamente según el rol.
    *   **Topbar:** Avatar del usuario con Popover (Nombre, rol y botón "Ver Perfil"), indicador numérico y popup de mensajes directos, y bandeja de notificaciones con pestañas para filtrar alertas prioritarias.
*   **Tarjetas "Mis Cursos" (`frontend/src/components/CourseCard.jsx`):**
    *   Panel de tarjetas con cabecera de color representativa del curso, nombre de la materia, aula y profesor.
    *   Barra inferior integrada con tres botones nativos Stitch: "Tareas", "Notas" y "Asistencias por Curso".
*   **Vista de Asistencia por Periodo (`frontend/src/components/PeriodAttendance.jsx`):**
    *   Formulario interactivo que lista los alumnos. Muestra en gris el estado matutino cargado como sugerencia.
    *   Selector local ("No Asistió" / "Llegada Tarde" / "Presente") con campo de justificación del docente.
    *   Control estricto: Bloqueo de celdas de días anteriores si el alumno estuvo presente.
*   **Calendario Unificado (`frontend/src/components/UnifiedCalendar.jsx`):**
    *   Integración de **FullCalendar** con vistas de mes/semana/día.
    *   Mapeo de eventos por color de clase (MySQL), eventos escolares generales (MongoDB) y recordatorios personales (estudiante).

---

## Plan de Verificación de Código

*   **Verificación de Dependencias:** El código backend y frontend compilará sin errores en Node.js, llamando a librerías estándar y oficiales.
*   **Simulación de Conexión:** Las funciones de conexión a bases de datos e inicializaciones de esquemas se escribirán para que levanten correctamente con las variables de entorno estándar.
*   **Sin Marcadores de Posición:** Todo el código se proporcionará en su totalidad para garantizar que sea de nivel de producción y legible paso a paso mediante comentarios estructurados en español.
