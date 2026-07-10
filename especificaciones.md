# Contenido de la pagina

## 1. Inicio de sesión
En esta página se debe mostrar un formulario para iniciar sesión. El formulario debe tener los siguientes campos:

- Logotipo de la Escuela
- Nombre de la escuela

- Email
- Contraseña

- Botón de iniciar sesión

Quiero que el formulario de inicio de sesión este en el centro de la pantalla y que a los lados no tenga nada.

## 2. Dashboard

### Estructura del Layout Global (Para todos los usuarios)

El diseño de la aplicación se divide en una estructura limpia de tres bloques principales: un Menú Lateral (Sidebar) a la izquierda de altura completa, una Barra Superior (Topbar) a la derecha, y el Área de Contenido Central justo debajo.

#### 1. Menú Lateral Izquierdo (Sidebar)
Abarca verticalmente desde el borde superior hasta el borde inferior de la pantalla. Su contenido se organiza de arriba hacia abajo:

*   **Comportamiento Colapsable (Toggle):**
    *   Debe incluir la funcionalidad de ocultarse y aparecer dinámicamente mediante un botón interactivo de activación (Toggle Button).
    *   Este botón estará posicionado en el extremo superior izquierdo, anclado al borde superior de la interfaz.
    *   El botón cuenta con un diseño flexible que permite ajustar su posición interna, pero con la restricción estricta de no poder moverse del fondo del lado izquierdo de la pantalla.
*   **Cabecera:** Logotipo de la escuela y, justo debajo, el nombre de la institución.
*   **Cuerpo:** Menú de navegación dinámico cuyas opciones cambian automáticamente según el rol del usuario autenticado.
*   **Pie del Menú:** Posicionado en la parte inferior fija, ubica el botón de "Configuraciones" y, abajo de este, el botón de "Cerrar sesión".

#### 2. Barra Superior Derecha (Topbar)
Se extiende horizontalmente desde el borde derecho de la pantalla hasta topar con el menú lateral izquierdo. Los elementos se alinean a la derecha y se organizan de derecha a izquierda:

*   **Avatar (Foto de Perfil Circular):**
    *   Al hacer clic, despliega una mini ventana emergente con información resumida del usuario (Nombre completo, foto y rol).
    *   Al final de esta mini ventana, incluye un botón con la acción "Ver Perfil" que redirige al usuario a su pantalla de perfil completa con todos sus datos personales.
*   **Información de Usuario:** Texto estático ubicado a la izquierda de la foto que muestra el nombre del usuario y, justo debajo, su rol actual en el sistema.
*   **Separador:** Una línea de división vertical sutil para distanciar visualmente la información de usuario de las acciones.
*   **Icono de Mensajes Directos:**
    *   Al hacer clic, despliega una mini ventana emergente que muestra una vista previa de los mensajes más recientes recibidos.
    *   Al final de este listado, incluye un botón con la acción "Ver todos los mensajes" que redirige al usuario al centro de mensajería completo.
*   **Icono de Notificaciones:**
    *   Al hacer clic, despliega una mini ventana emergente con el listado de las notificaciones y alertas más recientes.
    *   Al final de este listado, incluye un botón con la acción "Ver todas las notificaciones" que redirige al usuario a la bandeja principal de notificaciones del sistema.

#### 3. Módulo de Perfiles y Restricciones de Visibilidad (Reglas de Privacidad)
*   **Perfil del Padre de Familia:**
    *   Al ingresar a su propio perfil desde el avatar, el padre visualiza sus datos personales y los de sus hijos registrados en la institución.
    *   Debido a que el colegio autoriza un máximo de dos usuarios por estudiante, el perfil mostrará un apartado que indica que hay otra cuenta vinculada (Ej: "Segundo Tutor").
    *   En esta sección solo se mostrará el parentesco o tipo de registro del segundo usuario (Ej: "Madre", "Padre", "Encargado"), pero nunca se expondrán sus datos personales por motivos de privacidad.
*   **Matriz de Permisos para Visualización de Perfiles:**
    *   **Padres y Alumnos:** Tienen estrictamente prohibido ver los perfiles de otros padres, alumnos, maestros o cualquier usuario ajeno mediante la interacción con sus avatares.
    *   **Profesores, Administradores y Secretaría:** Son los únicos roles autorizados en el sistema para presionar el avatar de cualquier usuario y visualizar su información de perfil correspondiente.

#### 4. Mensajería Directa y Horarios de Atención
*   **Acceso a Contactos para Padres:** Los padres de familia solo pueden ver y enviar mensajes directos a la Secretaría y a los Profesores específicos que imparten clases a sus hijos.
*   **Lógica de Horarios de Atención:**
    *   Los perfiles de los profesores y de secretaría cuentan con un horario de atención configurado en el sistema.
    *   Si un padre envía un mensaje fuera de este horario establecido, el sistema procesará y entregará el mensaje, pero mostrará una notificación en pantalla al padre indicando: "Mensaje enviado fuera del horario de atención. Es probable que la respuesta sea demorada". El personal del colegio recibirá el mensaje y decidirá bajo su propio criterio si responde de inmediato o al siguiente día hábil.

#### 5. Sistema de Notificaciones y Alertas por Rol
*   **Filtros y Tipos de Notificaciones para Padres:**
    *   Los padres cuentan con una bandeja de notificaciones dividida en categorías (Todas, Alertas) para facilitar su organización.
    *   **Notificaciones Generales:** Avisos automáticos del sistema, tales como "El alumno [Nombre] no entregó la tarea" o "El tiempo de entrega ha vencido".
    *   **Alertas Prioritarias:** Notificaciones críticas sobre Circulares o Incidentes que, además de aparecer en la plataforma, disparan automáticamente un correo electrónico al buzón personal del padre.
*   **Notificaciones para Profesores:** Los docentes reciben todas sus alertas de manera regular dentro de la plataforma, pero los casos marcados como "Urgentes" o "Alertas" se replican de forma obligatoria a su correo electrónico.
*   **Notificaciones para Estudiantes:**
    *   Los alumnos visualizan confirmaciones de entrega de tareas o exámenes.
    *   El sistema les genera recordatorios automáticos sobre actividades pendientes por entregar, indicando el plazo límite disponible.
    *   Reciben notificaciones informativas sobre eventos programados del colegio.

#### 6. Área de Contenido Central (Debajo del Topbar)
Ocupa todo el espacio restante de la pantalla y se organiza de arriba hacia abajo:
*   **Ruta de Navegación (Breadcrumbs):** En la esquina superior izquierda de esta área, justo debajo del Topbar, muestra la dirección de la página actual en la que se encuentra el usuario.
*   **Título de la Página:** Inmediatamente abajo de la ruta de navegación, se muestra el título principal de la página actual en un tamaño destacado.
*   **Contenido Principal:** Abajo del título, comienza formalmente el contenido y las funciones de la sección seleccionada.

## Rol de Padre

### Menú de Navegación

- **Inicio**
  - *Resumen general del día, avisos urgentes del colegio y accesos rápidos.*
- **Rendimiento Académico**
  - **Vista General de Materias**
    - Listado de los cursos actuales del estudiante con su progreso individual.
    - Visualización directa del promedio actual por materia y el promedio general acumulado.

  - **Control de Notas y Actividades (Detalle por Curso)**
    - Al hacer clic en una materia, el padre accede a las siguientes tres secciones:
    
    - **1. Próximas Tareas y Evaluaciones (Por Entregar)**
      - Listado cronológico de actividades pendientes con su fecha límite de entrega.
      - **Detalle de la Actividad:** Al ingresar a cada elemento, el padre puede visualizar:
        - Tipo de actividad (Parciales, cortos, hojas de trabajo, tareas comunes).
        - Descripción detallada de la actividad y recursos adjuntos.
        - Fecha y hora exacta de entrega.
      - *Nota de automatización: El sistema solo muestra las tareas que el profesor configuró como "Visibles" o que ya cumplieron su fecha de publicación programada.*

    - **2. Historial de Entregas y Calificaciones**
      - Registro completo de las tareas que el estudiante ya envió.
      - Cada registro muestra explícitamente:
        - **Fecha y hora** en la que fue entregada por el alumno.
            - **2. Historial de Entregas y Calificaciones**
      - Registro completo de las actividades entregadas con sus respectivos estados:
        - **Calificada:** Muestra la nota obtenida y la fecha en que el maestro la calificó.
        - **Pendiente de calificar:** Confirma que el alumno entregó la tarea a tiempo y muestra la fecha límite original para tranquilidad del padre.
        - **Entregada con Retraso (Penalizada):** 
          - Muestra la fecha real de entrega versus la fecha límite original.
          - Si ya fue revisada, despliega la nota obtenida aplicando automáticamente la penalización correspondiente según la escala de tiempo configurada por el profesor.
          - *Lógica del Sistema (Configurable por el Maestro):*
            - **Retraso Nivel 1:** Tarea entregada dentro del primer rango de días establecido (Ej: nota máxima sobre el 75%).
            - **Retraso Nivel 2:** Tarea entregada dentro del segundo rango de días establecido (Ej: nota máxima sobre el 50%).
            - **Retraso Nivel 3:** Tarea entregada en el último límite de tolerancia permitido (Ej: nota máxima sobre el 25%).
            - **Intolerable (10%):** Si la fecha límite de la tarea ha vencido y el padre no ha justificado la ausencia o ya se termino el tiempo de la prorroga, la tarea se marcará como "Intolerable" y la nota será el 10% de la nota máxima.
          - *Nota técnica:* El profesor define desde su panel cuántos días dura cada nivel(o cuantos niveles quiere agregar y su porcentaje de penalizacion para cada nivel o rango) de prórroga y el porcentaje de penalización para cada escala antes de que la tarea expire por completo.

        - **Justificada por Ausencia:** *(Para alumnos que faltaron el día de la entrega)* Reemplaza la nota temporalmente con un icono de **"Pendiente por Inasistencia"** o una etiqueta de **"Justificada"**. Al hacer clic, redirige al padre al *Itinerario de puesta al día* para saber cuándo vence su nueva prórroga.
        
        - **Caso Especial / Excepción:**
          - Estado asignado manualmente por el profesor para situaciones particulares (médicas, familiares o de fuerza mayor) que no entran en el flujo automático de ausencias.
          - **Campos visibles para el padre:**
            - **Justificación del Maestro:** Nota escrita por el profesor explicando el motivo por el cual otorga la consideración.
            - **Porcentaje de Entrega:** El valor máximo personalizado sobre el cual se calificará la tarea (Ej: "Autorizado para entregar sobre el 90%").
            - **Nueva Fecha Límite:** El día y hora máxima acordada para la entrega extemporánea.


    - **3. Alertas de Incumplimiento (Tareas Vencidas)**
      - Listado exclusivo de actividades cuya fecha límite original ya expiró y el estudiante **no realizó la entrega**.
      - Una tarea entra a este listado únicamente si el padre no ha justificado la ausencia o si el tiempo de la prórroga ya expiró por completo.
      - **Visualización Dinámica de Prórrogas Activas:**
        - Si la tarea sigue en periodo de gracia, el padre verá un cronograma claro con las penalizaciones vigentes configuradas por el profesor:
          - *Prórroga Actual:* "Vence el [Fecha] - Calificación máxima: [75%]"
          - *Siguiente Tramo:* "Vence el [Fecha] - Calificación máxima: [50%]"
          - *Última Oportunidad:* "Vence el [Fecha] - Calificación máxima: [25%]"
        - Incluye una cuenta regresiva o indicador visual (Ej: "Te quedan 12 horas para entregar sobre el 50% de la nota").

  - **Reportes de Calificaciones**
    - Descarga de reportes periódicos (mensuales o trimestrales) por materia individual o notas generales.

- **Calendario Escolar (Vista Unificada)**
  - *Centro de control cronológico que integra los horarios de clases, evaluaciones académicas y actividades institucionales mediante un sistema visual de código de colores:*
  - **1. Horario de Clases Diario:**
    - Cada curso/materia tiene asignado un **color específico** y único para facilitar su identificación rápida en la cuadrícula.
    - Cada bloque de clase muestra de forma explícita: el **nombre de la materia**, el **nombre del profesor** que la imparte y el **salón o aula** correspondiente.
  - **2. Cronograma de Evaluaciones y Actividades:**
    - Despliegue visual de fechas de entrega y aplicación de: tareas comunes, exámenes parciales, cortos, hojas de trabajo y cualquier actividad programada por el docente.
  - **3. Eventos Institucionales del Colegio:**
    - Actividades extracurriculares, efemérides o reuniones generales del colegio.
    - Cada evento cuenta con un **color específico personalizado**, el cual es asignado manualmente por el personal administrativo o directivo al momento de crear la publicación.

- **Circulares y Autorizaciones**
  - *Módulo oficial de comunicación institucional emitido por la dirección o administración del colegio. Se divide en dos categorías:*
  - **1. Circulares Informativas:**
    - Comunicados oficiales, avisos de asuetos, cambios en el uniforme o boletines mensuales que el padre solo necesita leer.
    - Marcador visual de "Leído" automático cuando el padre abre el documento.
  - **2. Autorizaciones Especiales (Con Firma Presencial o Virtual):**
    - Documentos para eventos específicos que requieren consentimiento del padre (Ej: excursiones, visitas guiadas, participación en bandas, etc.).
    - Tiene dos formas de autorización: Presencial o Virtual.
    - Tienen cinco estados: *Autorizado*, *No autorizado*, *Enviada*, *No Enviada*(Solo aplica para firma presencial), "Pendiente" (Es cuando la secretaria tiene la circular lista pero aun no se envia o publica).

- **Módulo de Circulares y Autorizaciones (Reglas de Negocio Generales)**
  
  - **Métodos de Autorización:**
    - **Presencial:** El padre firma físicamente una boleta de papel enviada con el alumno. El colegio debe registrar la recepción en el sistema.
    - **Virtual:** El padre aprueba la circular de forma digital y directa desde su panel en la plataforma.

  - **Estados de la Circular (Ciclo de Vida de 5 Estados):**
    - **Pendiente:** Estado inicial. La secretaria tiene la circular redactada y lista en el sistema, pero permanece oculta para padres y alumnos hasta su revisión final.
    - **No Enviada:** *(Exclusivo para Autorización Presencial)* Indica que la circular fue aprobada internamente, pero las boletas físicas aún están en proceso de impresión o distribución y no se han entregado a los alumnos.
    - **Enviada:** La circular se publica formalmente en la plataforma y se notifica al padre de familia para iniciar su proceso de revisión y firma (ya sea física o digital).
    - **Autorizado:** El padre aprobó la circular digitalmente o el colegio procesó la boleta física firmada. Este estado desbloquea automáticamente el evento en el calendario del estudiante.
    - **No Autorizado:** El padre rechazó explícitamente la actividad en la app o se alcanzó la fecha límite sin recibir respuesta.

  - **Lógica de Vencimiento Automático:**
    - Toda circular en estado **"Enviada"** requiere obligatoriamente una **Fecha y Hora Límite de Autorización**.
    - Si se cumple este plazo y el sistema no registra la aprobación (firma virtual o recepción presencial), la circular cambiará automáticamente al estado **"No Autorizado"**, bloqueando cualquier acción posterior.

- **Circulares y Autorizaciones (Rol: Padre de Familia)**
  - *Módulo oficial de comunicación institucional para eventos especiales (Ej: excursiones, visitas guiadas, etc.).*
  - **Control de Estados y Acciones para el Padre (Solo aplica para circulares en estado "Enviada"):**
    - **Pendiente de Firma (Física):** 
      - Alerta prioritaria en el panel del padre. Al ingresar, visualiza el documento con los detalles del evento (costo, lugar, fecha del evento y la fecha límite de respuesta) junto con:
        - **Botón "No Autorizar":** Permite al padre rechazar explícitamente y de forma anticipada la participación de su hijo.
        - **Nota Informativa de Entrega:** Mensaje en pantalla que explica que debe firmar la autorización en el formato de papel físico que le fue enviado a través del estudiante.
    - **Autorizado:** 
      - Historial que muestra los documentos cuyas autorizaciones físicas ya fueron recibidas, procesadas y marcadas en el sistema por el colegio, registrando la fecha y hora de la aprobación.
    - **No Autorizada (Vencida / Rechazada):**
      - Sección que archiva las circulares donde el padre presionó "No Autorizar" o aquellas que el sistema bloqueó automáticamente por superar la fecha límite.

- **Circulares y Autorizaciones (Vista Espejo - Rol: Estudiante)**
  - *Sección informativa para que el alumno monitoree el estado de sus permisos.*
  - **Restricción de Visibilidad del Evento:**
    - El estudiante **no puede ver** el evento en su Calendario Escolar ni los detalles de la circular mientras esté en estado "Pendiente de Enviar", "Enviada" o "No Autorizada".
    - **AUTORIZADO:** El evento y los detalles de la circular se volverán visibles para el alumno **únicamente** cuando el colegio procese la firma física y el estado cambie a "Autorizado", desbloqueando simultáneamente la actividad en su calendario escolar.

- **Foro de Padres (Módulo de Comunidad)**
  - *Espacio de comunicación interactiva y comunitaria diseñado para que los padres de familia conversen entre sí o se comuniquen con los docentes de sus hijos.*
  - **Estructura y Reglas de Negocio (Backend):**
    - **Foros Automáticos por Grado y Sección:** 
      - El sistema crea estos foros de forma automática al configurar un grado y sección (Ej: *Foro de Padres - 3ro Primaria Sección A*).
      - El acceso es dinámico: los padres se vinculan automáticamente a este foro en el momento en que su hijo es inscrito en dicha sección.
    - **Foros Temáticos Modificados:** 
      - Los maestros pueden crear subforos o hilos sobre temas educativos o proyectos específicos de su curso dentro de su sección.
      - El Administrador global tiene el control total para crear foros abiertos y agregar manualmente a cualquier usuario o grupo que considere necesario.
      - *Restricción de Rol:* Los padres de familia tienen un rol exclusivamente de **participantes** (pueden leer, comentar y responder); no tienen permisos para crear nuevos foros independientes.
  - **Experiencia de Usuario para el Padre (UX):**
    - Todos los foros en los que el padre tenga acceso (ya sean automáticos por el grado de su hijo o creados manualmente por el admin/maestro) se centralizarán en una única pestaña limpia dentro de su menú llamada **"Foro de Padres"**.
  
- **Módulo de Gestión de Incidentes, Quejas y Citas**
  - *Espacio centralizado para reportar inconformidades, dar seguimiento al comportamiento del alumno y coordinar reuniones presenciales entre padres, maestros y administración.*

  - **1. Reportes y Flujos de Escalabilidad (Reglas de Negocio):**
    - **Origen del Reporte:** 
      - Los padres pueden crear quejas o inconformidades dirigidas al Profesor o a la Secretaria según la naturaleza del caso.
      - Los maestros pueden crear reportes sobre alumnos (falta de tareas, problemas de conducta o incidentes específicos).
      - La secretaria puede registrar incidentes directamente en el sistema si el padre se presenta físicamente al establecimiento para reportar algo.
    - **Ruta de Escalabilidad:** 
      - Si un padre envía un reporte al profesor, pero este determina que la resolución compete al área administrativa, el maestro tiene la facultad de escalar el caso a la Secretaria. Al hacerlo, el caso se transfiere automáticamente a la bandeja de la secretaría para su visualización y solución.

  - **2. Control de Estados del Reporte:**
    - **Enviado:** Estado inicial tras ser registrado por el padre, maestro o secretaria.
    - **En Revisión:** El destinatario abre el caso para analizarlo. En este momento se bloquea automáticamente la opción de edición para el creador del reporte.
    - **Resuelto:** El personal del colegio proporciona una respuesta y marca el caso como solucionado. 
    - **Cerrado por el Padre:** El padre de familia confirma que la solución ofrecida es satisfactoria, archivando el caso definitivamente de las bandejas activas.
    - **Reabierto (En Desacuerdo):** Si el padre no está conforme con la respuesta, puede rechazarla. El caso se reabre, permitiendo continuar el diálogo y la edición.

  - **3. Gestión de Citas Presenciales Vinculadas:**
    - **Solicitud del Padre:** El padre puede solicitar una reunión presencial con el profesor. El sistema desplegará una agenda con los bloques de horarios y dias libres que el docente haya configurado previamente como disponibles.
    - **Solicitud del Profesor:** El maestro también puede convocar al padre a una cita presencial para tratar temas académicos o conductuales.
    - **Indicador de Prioridad:** Al crear una cita (solo el profesor), se puede activar la etiqueta de estado "Prioritaria" si el tema a tratar es delicado o requiere atención inmediata.

# Rol: Secretaría / Administración

## Menú de Navegación Principal

- **Inicio**
  - *Panel de control con métricas rápidas: total de ausencias del día, circulares activas y solicitudes de citas pendientes por procesar.*

- **Gestión de Alumnos y Familias**
  - **Fichas de Estudiantes**
    - Listado general de alumnos inscritos por grado y sección.
    - Control de vinculación familiar: Permite registrar y asociar los dos usuarios (padres/encargados) autorizados por estudiante, definiendo su parentesco.
    - *Nota de privacidad:* Desde aquí se gestiona qué datos personales ve cada tutor en su perfil privado.

- **Control de Personal y Horarios**
  - **Horarios de Profesores**
    - Vista general y búsqueda de los horarios de todos los docentes de la institución.
    - **Monitoreo de Bloques:** Permite visualizar qué materias imparte cada profesor, en qué salones y a qué horas exactas.
    - **Horarios de Atención:** Consulta de los bloques de tiempo libre que el profesor configuró en el sistema para atender mensajes directos o citas presenciales con los padres de familia.
    - *Utilidad técnica:* Permite a la secretaría dar soporte telefónico o presencial a un padre si este pregunta cuándo está disponible un maestro para una reunión urgente.

- **Control de Asistencia General**
  - **Registro Diario de Faltas**
    - Vista general para validar las inasistencias reportadas por los maestros en el día.
    - **Automatización de Alertas:** Botón de confirmación que dispara el correo electrónico automático al padre cuando el alumno es marcado como ausente, adjuntando el *Itinerario de puesta al día* generado por el docente.

- **Circulares y Autorizaciones**
  - **Bandeja de Documentos**
    - Historial y creación de comunicados.
    - **Gestión de Estados de Envío:** Permite redactar circulares y mantenerlas como "Pendiente" hasta recibir aprobación directiva, para luego cambiar su estado a "Enviada" (haciéndola visible para los padres).
    - **Recepción de Firmas Físicas:** Panel rápido por grado para buscar al alumno y marcar como "Autorizado" en el sistema una vez que el estudiante entrega la boleta de papel firmada por el padre.
    - Configuración de la fecha y hora límite para el vencimiento automático del permiso.

- **Atención a Padres e Incidentes**
  - **Buzón de Quejas e Inconformidades**
    - Recepción de reportes creados por los padres dirigidos a la administración.
    - Bandeja de "Casos Escalados": Espacio para resolver los incidentes que los profesores desviaron a secretaría por no ser de índole pedagógica.
  - **Registro de Incidentes Presenciales**
    - Formulario rápido para que la secretaria registre un reporte conductual o administrativo en el sistema si el padre de familia llega a quejarse o reportar algo físicamente a las oficinas.
  - **Centro de Citas Presenciales**
    - Monitoreo y aprobación de solicitudes de reuniones urgentes entre padres y dirección/maestros.

- **Calendario Institucional**
  - *Creación y asignación de colores específicos para los Eventos Escolares generales (asambleas, asuetos, aniversarios) para que se reflejen en la vista unificada del Calendario del Padre.*


- **Módulo de Foros y Comunidad**
  - **Foro Institucional y de Coordinación**
    - Espacio de comunicación interna para la creación de canales de debate o avisos.
    - **Canales Docentes-Secretaría:** Permite a la secretaria crear y gestionar foros privados dirigidos exclusivamente al cuerpo de profesores para coordinar temas internos, eventos o circulares antes de su publicación.
    - **Foros Temáticos y de Padres:** Permite a la secretaria abrir foros sobre temas específicos dirigidos a la comunidad de padres de familia (Ej: Foro de Organización del Aniversario, Foro de Consultas de Transporte).
    - Control de moderación: Capacidad para archivar, cerrar comentarios o eliminar publicaciones que incumplan las normas del colegio.


# Rol: Estudiante

## Menú de Navegación Principal

- **Inicio**
  - Panel de control principal con accesos rápidos.
  - Resumen de las clases del bloque horario actual.
  - Recordatorios automáticos de tareas con fechas de entrega más próximas.

- **Mis Calificaciones y Rendimiento**
  - **Progreso Académico:** Lista de las materias vigentes con la nota y calificación obtenida cada vez que el profesor la suba al sistema.
  - **Historial de Entregas:** Registro detallado de cada actividad enviada que muestra de forma explícita la fecha y hora exacta en la que el estudiante entregó la tarea.

- **Agenda Académica (Tareas y Evaluaciones)**
  - **Actividades por Entregar:** Listado cronológico de todas las tareas ordinarias, exámenes parciales, cortos y hojas de trabajo asignadas por el docente.
  - **Fechas de Entrega:** Cronograma con los plazos, días y horas límites de entrega establecidos para cada asignación académica.

- **Calendario Escolar**
  - Vista unificada (mensual, semanal y diaria) organizada mediante un sistema visual de código de colores.
  - **Tareas y Evaluaciones:** Fechas límite de entrega y aplicación de exámenes cortos o parciales fijadas por los maestros.
  - **Eventos Escolares:** Actividades institucionales generales y excursiones autorizadas por el colegio.
  - **Eventos Propios:** Espacio personalizado donde el estudiante puede crear, editar y organizar sus propios recordatorios o actividades personales dentro del calendario.

- **Circulares Informativas**
  - Listado de comunicados oficiales, boletines, avisos de asuetos o cambios de uniforme emitidos por la dirección del colegio.
  - *Filtro de visualización:* Solo muestra las circulares informativas generales. Las circulares que requieren firmas o autorizaciones físicas/virtuales no aparecen en este apartado.

- **Control de Asistencia**
  - Pantalla de visualización exclusiva para el estudiante (no puede editar ni alterar los datos).
  - Registro acumulado de sus asistencias e inasistencias diarias en el ciclo escolar.
  - Indicador del estado de cada falta:
    - *Injustificada / Pendiente.*
    - *Justificada:* Muestra si el padre de familia envió la justificación a tiempo (con antelación o hasta un día después de la inasistencia) a la secretaría o al profesor guía, detallando si ya se habilitó la prórroga para que el alumno pueda entregar su tarea pendiente.

- **Mis Foros Académicos**
  - **Foros Fijos de Clase:** Un foro permanente por cada materia o clase que imparte el profesor. Son obligatorios y no se pueden ocultar, archivar ni eliminar del panel del alumno.
  - **Foro con Profesor Guía:** Canal fijo de comunicación directa entre el grupo de alumnos del salón y su profesor guía asignado. Tampoco se puede ocultar ni eliminar.
  - **Foros de Actividades Especiales:** Canales dinámicos vinculados a proyectos específicos de la clase. El alumno solo participa; la eliminación de estos foros es exclusiva del profesor.
  - **Foros de Tareas en Grupo:** Espacios colaborativos creados únicamente por el profesor para coordinar trabajos grupales entre los estudiantes asignados a un equipo.

*(Nota: Los chats y la mensajería directa con compañeros no se incluyen en este menú lateral, ya que se gestionan de forma centralizada en el icono de mensajes de la barra superior derecho/Topbar).*


# Rol: Profesor

## Menú de Navegación Principal

- **Inicio**
  - Panel de control principal con resumen del día, avisos institucionales y accesos rápidos a sus cursos.
  - Recordatorios de tareas pendientes de calificar y solicitudes de citas o justificaciones pendientes por revisar.

- **Gestión de Cursos y Materias**
  - Listado de los grados, secciones y materias asignadas al docente por la institución.
  - Al ingresar a un curso específico, el profesor tiene acceso al control de alumnos, asistencia y planificación académica.

- **Configuración General de Tolerancia y Retrasos**
  - Panel de configuración por defecto para establecer las políticas de entrega tardía aplicables a todas sus actividades (con opción de modificarlas individualmente al crear una tarea).
  - **Definición de Niveles de Prórroga:** Herramienta para decidir cuántos niveles de retraso quiere permitir (Ej: 1, 2, 3 o más niveles) y parametrizar los rangos de días de duración para cada uno.
  - **Asignación de Porcentajes de Penalización:** Permite asignar la nota máxima para cada rango configurado (Ej: Nivel 1 al 75%, Nivel 2 al 50%, Nivel 3 al 25%).
  - **Configuración de Estado Intolerable:** Permite activar y ajustar la regla para entregas fuera de todo el tiempo de prórroga permitido, donde la actividad se bloquea automáticamente bajo la nota mínima obligatoria del 10% del total.

- **Banco y Plantillas de Rúbricas**
  - Panel de diseño para crear categorías de evaluación estables o utilizarlas como plantillas predeterminadas en sus tareas.
  - **Creador de Criterios:** Permite agregar los campos, descripciones y ponderaciones que el docente requiera de forma libre.
  - **Escalas de Desempeño:** Herramienta para configurar los niveles de logro (Ej: Excelente, Bien, Deficiente) y asignar el porcentaje exacto que aporta cada categoría a la suma total automática de la rúbrica.

- **Planificación de Actividades y Tareas**
  - **Creador de Actividades Multitipo:** Formulario para registrar nuevas evaluaciones académicas. Cuenta con campos para Título, Descripción, Recursos Adjuntos, Ponderación, Fecha y Hora exacta de entrega.
  - **Selector de Tipo de Actividad:** Permite clasificar la asignación entre Examen Final, Examen Parcial (con subdivisiones opcionales para evaluaciones Orales, Escritas o Prácticas), Cortos, Hojas de Trabajo, Laboratorios o Tareas Comunes.
  - **Tipos Personalizados:** Opción para que el profesor cree y guarde nuevos tipos de actividades específicos y exclusivos para sus propios cursos (sin alterar los tipos de los demás docentes).
  - **Modalidad de Entrega:** Interruptor para definir si la asignación es de carácter **Virtual** (habilita automáticamente un cargador de archivos en la plataforma para el alumno) o de carácter **Físico** (solo se muestra la información en la agenda del alumno y la entrega es presencial).
  - **Asignación de Rúbricas:** Permite vincular una rúbrica guardada o estructurar una nueva desde cero para esa actividad específica.
  - **Control de Visibilidad y Permisos:** 
    - Interruptor para cambiar el estado de la tarea entre Visible u Oculta para los alumnos (permite programar fechas automáticas de publicación y visualizacion).
    - Permite modificar o eliminar la actividad en forma libre en el sistema.

- **Centro de Calificaciones (Control de Notas)**
  - Cuadrícula interactiva por curso para ingresar y editar las notas de los alumnos.
  - **Calificación por Rúbrica:** Interfaz que despliega los criterios y escalas configurados para evaluar haciendo clic sobre el desempeño del alumno (Excelente, Bien, Deficiente), realizando la suma total de forma automática.
  - **Cálculo de Penalizaciones Automáticas:** El sistema detecta y muestra la fecha real de envío versus la fecha límite original. Si la tarea fue entregada con retraso, el backend calcula y aplica la penalización sobre la nota final de acuerdo al Nivel de Prórroga en el que cayó el alumno (Nivel 1, 2, 3 o Intolerable del 10%).

- **Estudiantes**
  - **Panel de Alumnos y Profesor Guía:** 
    - Listado y visualización completa de los estudiantes inscritos en los grados y secciones donde el docente imparte clases, destacando el grupo específico del cual es Profesor Guía.
  - **Matriz de Asistencia Semanal e Histórica:** 
    - Interfaz gráfica que permite visualizar el registro de asistencia de la semana completa en curso y consultar las semanas anteriores para auditoría académica.
  - **Reglas de Modificación del Registro de Asistencia:**
    - **Control del Día Actual:** El profesor puede marcar de forma rápida la asistencia de todos los alumnos o modificarla libremente durante la jornada del día en curso.
    - **Control de Días Anteriores (Regla de Inasistencias):** El sistema bloquea de forma estricta la edición de días pasados, con una única excepción: permite modificar el registro de un día anterior (por ejemplo, hoy jueves modificar el día miércoles) **única y exclusivamente si el alumno fue marcado como inasistencia** para cambiar su estado. Si el alumno estuvo presente, no se permite ninguna modificación.
  - **Gestión Dinámica de Inasistencias y Justificaciones:**
    - **Cierre del Plazo Digital:** El padre de familia tiene un plazo límite estricto hasta el mediodía (12:00 PM) del día siguiente de la falta para reportar y enviar la justificación digital a través de la plataforma.
    - **Inasistencia Definitiva (Cierre de Ventana):** Si el padre no reporta la falta dentro del plazo digital, ni lo notifica de forma presencial o telefónica a la institución, el sistema consolida la falta como inasistencia definitiva y añade automáticamente en el campo de observaciones el texto: *"Sin justificación por falta"*.
    - **Registro Manual de Justificación:** El profesor puede cambiar el estado a "Justificada" de forma manual e ingresar una observación escrita a la par que resuma el motivo presencial, telefónico o digital provisto por el padre de familia.
    - **Programación de Inasistencias Masivas (Prórrogas Extendidas):** Herramienta para programar múltiples días de inasistencia justificada en un solo bloque de tiempo (ejemplo: si el alumno se ausentará por motivos de salud durante una semana completa). El docente ingresa la observación del motivo una sola vez y el sistema marca automáticamente los días futuros del rango seleccionado, evitando tener que registrar la falta día por día.

- **Mis Cursos**
  - **Mapeo de Materias Impartidas:** Lista completa de todos los cursos y materias en los que el usuario está registrado formalmente como profesor titular. Esta vista se organiza en tarjetas independientes para cada curso, sección y grado (independientemente de si el docente ejerce el rol de Profesor Guía o no de ese grupo).
  - **Panel de Acceso Rápido por Curso:** Cada tarjeta de materia cuenta con una barra de navegación integrada con tres botones de acción directa: "Tareas", "Notas" y "Asistencias por Curso".

### Módulo de Asistencia Cruzada (Lógica de Periodos por Curso)

Herramienta que permite llevar un control estricto de la presencia del alumno bloque por bloque, cruzando los datos con la asistencia general de la mañana:

#### 1. Flujo de Confirmación Estándar (Sin Novedades)
* **Precarga automática:** Al abrir el formulario de asistencia de su periodo, el profesor de la materia verá el estado de cada alumno según el reporte de la mañana del Profesor Guía.
* **Confirmación rápida:** Si todos los alumnos marcados como "Presente" en el colegio están físicamente en el salón, el profesor no altera ningún registro; simplemente guarda y confirma el formulario para cerrar el periodo.

#### 2. Gestión Automatizada por Estados y Botones de Acción
Para agilizar el pase de asistencia y resolver discrepancias, el sistema habilita acciones dinámicas para el profesor del curso según el estado general del alumno:

* **Caso A: Alumno "Sin Registro" en Asistencia General**
  * **Acción:** Muestra el botón **"Tomar asistencia"**.
  * **Resultado:** Cambia automáticamente el registro a **"Presente"** tanto en la asistencia general como en el curso actual.
* **Caso B: Alumno con reporte "No Asistió"**
  * **Acción:** Muestra el botón **"Tomar asistencia del curso"**.
  * **Resultado:** Cambia el estado local del alumno de forma automática a **"Llegada Tarde"**.
* **Caso C: Alumno con reporte "Presente"**
  * **Acción:** Muestra el botón **"Tomar asistencia del curso"**.
  * **Resultado:** Funciona como validación obligatoria. **Solo después de presionarlo** se desbloquea el campo para agregar **observaciones o notas del docente**.

#### 3. Registro de Inasistencia Local (Falta a una Clase Específica)
* **Desviación de asistencia:** Si un alumno fue marcado como "Presente" por la mañana pero no está en el salón (retiro, coordinación, enfermería, etc.), el profesor de la clase puede cambiar su estado local a **"Inasistencia"** o **"No Asistió"**.
* **Justificación interna:** El profesor del curso puede marcar la falta como "Justificada" e ingresar una observación detallada (Ej: *El alumno se encuentra en Coordinación resolviendo un asunto administrativo*).
* **Alerta al Profesor Guía:** El sistema notifica automáticamente al Profesor Guía en su panel principal: *"Inasistencia registrada en el curso de [Nombre de la Materia]"*.

#### 4. Inasistencia Programada desde la Guía (Bloqueo desde la Mañana)
* **Preprogramación:** Si el Profesor Guía sabe con antelación que un alumno se retirará temprano o tiene una actividad especial, puede registrar la **"Inasistencia"** directamente en los cursos específicos desde la mañana.
* **Bloqueo preventivo:** Cuando los profesores de esas materias abran su periodo, el alumno ya aparecerá como **"No Asistió" junto con la justificación escrita**, evitando errores de marcado.


- **Buzón de Justificaciones e Incidentes**
  - **Revisión de Justificaciones:** Bandeja de entrada para revisar, aprobar o rechazar las solicitudes de inasistencia enviadas a tiempo por los padres. Al aprobar una justificación, el sistema desbloquea la prórroga académica para el alumno.
  - **Gestión de Incidentes Conductuales:** Formulario para reportar problemas de conducta, falta de tareas constantes o incidentes en el aula, con opción de enviarlos directamente al panel del padre o escalarlos al buzón de la Secretaría si es un tema administrativo.

- **Módulo de Comunicación (Citas y Foros)**
  - **Agenda de Citas Presenciales:** Panel para configurar sus bloques de horarios libres semanales. Permite recibir solicitudes de reuniones por parte de los padres, o convocar al tutor de un alumno de forma directa activando la etiqueta de "Urgente" si el caso lo amerita.
  - **Control de Foros Dinámicos:**
    - Panel para interactuar en los Foros Fijos de Clase y con el grupo de alumnos de su sección (Profesor Guía).
    - Herramienta para crear, moderar y eliminar Foros de Actividades Especiales o hilos temáticos específicos de su curso.
    - Creador de Foros de Tareas en Grupo para segmentar al salón en equipos colaborativos cerrados. El profesor cuenta con el derecho exclusivo de eliminar estos foros grupales una vez concluido el trabajo.

- **Mis Cursos**
  - **Mapeo de Materias Impartidas:** Lista completa de todos los cursos y materias en los que el usuario está registrado formalmente como profesor titular. Esta vista se organiza en tarjetas independientes para cada curso, sección y grado (independientemente de si el docente ejerce el rol de Profesor Guía o no de ese grupo).
  - **Panel de Acceso Rápido por Curso:** Cada tarjeta de materia cuenta con una barra de navegación integrada con tres botones de acción directa: "Tareas", "Notas" y "Asistencias por Curso".

- **Módulo de Asistencia Cruzada (Lógica de Periodos por Curso)**
  - *Herramienta que permite llevar un control estricto de la presencia del alumno bloque por bloque, cruzando los datos con la asistencia general de la mañana:*
  - **1. Flujo de Confirmación Estándar (Sin Novedades):**
    - Al abrir el formulario de asistencia de su periodo, el profesor de la materia verá que el sistema precarga automáticamente el estado de cada alumno según el reporte de la mañana del Profesor Guía.
    - Si todos los alumnos que están marcados como "Presente" en el colegio se encuentran físicamente dentro del salón de clases, el profesor de la materia no debe alterar ningún registro; simplemente guarda y confirma el formulario de asistencia de su curso para cerrar el periodo.
  - **2. Registro de Inasistencia Local (Falta a una Clase Específica):**
    - Si un alumno fue marcado como "Presente" por el Profesor Guía en la mañana, pero no se encuentra en el salón al momento de recibir una materia específica (debido a que se retiró del colegio, fue citado a coordinación, se encuentra en enfermería, etc.), el profesor de esa clase tiene la facultad de cambiar su estado local a **"Inasistencia" o "No Asistió"**.
    - **Justificación Interna:** A la par de esta inasistencia local, el profesor del curso puede marcar la falta como "Justificada" e ingresar una observación detallada que explique el motivo de la ausencia en su periodo (Ej: *El alumno se encuentra en Coordinación resolviendo un asunto administrativo*).
    - **Alerta al Profesor Guía:** El sistema notificará automáticamente al Profesor Guía en su panel principal, indicándole de forma explícita: *"Inasistencia registrada en el curso de [Nombre de la Materia]"* para que esté enterado de que el alumno se movió de salón o abandonó el aula.
  - **3. Inasistencia Programada desde la Guía (Bloqueo desde la Mañana):**
    - Si un estudiante asiste al colegio pero el Profesor Guía ya sabe con antelación que el alumno tendrá que retirarse temprano, asistir a una actividad especial o tiene una justificación aprobada por los padres para faltar a ciertos periodos específicos, el Profesor Guía puede preprogramar la **"Inasistencia"** directamente en los cursos correspondientes desde la mañana.
    - Cuando los profesores de esas materias abran el formulario de asistencia de sus respectivos periodos, el alumno ya les aparecerá automáticamente como **"No Asistió" junto con la justificación y la razón escrita** por el Profesor Guía, evitando que el docente de la materia lo marque por error o asuma una falta injustificada.

- **Planificación de Contenidos y Material de Puesta al Día**
  - *Módulo que gestiona el avance programático de las clases y proporciona herramientas pedagógicas automáticas para evitar el retraso escolar en caso de inasistencias:*
  - **1. Vista del Cronograma de Actividades (Exclusivo del Profesor):**
    - Interfaz de planificación estructurada en forma de calendario o línea de tiempo interna.
    - Permite al profesor mapear y calendarizar por fechas específicas los temas conceptuales, las tareas, las hojas de trabajo o los exámenes que planea impartir a lo largo del ciclo.
    - *Control de Privacidad:* Este cronograma y su planificación por fechas es de visualización interna exclusiva para el docente, evitando presiones externas si el ritmo del grupo cambia.
  - **2. Vista de Módulos (Interfaz del Estudiante):**
    - Los alumnos no tienen acceso al cronograma por fechas del profesor; en su lugar, visualizan el curso organizado de forma limpia en módulos o unidades temáticas (Ej: Unidad 1, Unidad 2), los cuales el profesor puede ordenar, renombrar y estructurar a su total antojo.
  - **3. Sistema Automatizado de Material de Apoyo (Puesta al Día):**
    - Este control se activa cuando se registra una inasistencia (ya sea en la general o en el periodo de clase) y sirve para mitigar el impacto si el alumno se perdió un examen parcial, una actividad calificada o la explicación del día.
    - **Buzón de Envío de Contingencia:** El sistema detecta qué temas y actividades estaban planificados en el cronograma del docente para esa fecha específica y abre un apartado especial de "Material de Puesta al Día".
    - **Carga de Recursos Complementarios:** El profesor puede adjuntar recursos adicionales dirigidos específicamente al alumno ausente si lo desea (Ej: las páginas del libro de texto que se leyeron, un resumen del tema visto, presentaciones en PDF, videos o notas de la clase).
    - **Envío Dirigido:** Al guardar el reporte, el sistema empaqueta el material complementario y las tareas programadas de ese día y las envía de forma directa a la plataforma del estudiante y al correo del padre bajo el título de *Itinerario de puesta al día*, asegurando que el alumno tenga las herramientas exactas para nivelarse desde casa sin quedarse atrás en sus calificaciones.

- **Módulo de Administración Global (Rol: Administrador)**
  - *Panel con control total, absoluto e irrestricto sobre todos los módulos, datos, configuraciones y usuarios de la plataforma.*
  
  - **1. Gestión Integral de Usuarios (CRUD Global):**
    - Capacidad única para crear, visualizar, modificar y eliminar cualquier registro en el sistema (Estudiantes, Padres, Profesores, Secretarias y otros Administradores).
    - El Administrador es el único rol autorizado para modificar nombres de perfil, apellidos, documentos de identidad y datos académicos o laborales.

  - **2. Lógica de Identificadores Únicos (Credenciales de Acceso):**
    - **Estructura del Nombre de Usuario:** El correo electrónico no se utilizará como nombre de usuario. Cada cuenta tendrá un identificador único con la estructura `UA-XXXXX` (donde XXXXX son 5 dígitos unificados y obligatorios).
    - **Significado del Formato UA-XXXXX:**
      - `UA-`: Siglas de identificación base de la plataforma ("User Account").
      - `1er y 2do Dígito`: Indican el año de ingreso o creación del usuario al sistema (Ej: `26` para el año 2026).
      - `3er Dígito`: Identifica el tipo de rol asignado (`1` = Administrador, `2` = Secretaría, `3` = Profesor, `4` = Padre, `5` = Estudiante).
      - `4to y 5to Dígito`: Número correlativo único y autoincremental del usuario en el sistema (Ej: desde `01` hasta `99`).
      - *Ejemplo:* El código `UA-26305` representa a un Profesor (`3`) ingresado en el año 2026 (`26`), siendo el correlativo número `05`.

  - **3. Fichas de Registro Avanzadas por Rol:**
    - **Ficha Médica (Estudiantes, Profesores, Secretaría):** Registro obligatorio de lectura exclusiva que incluye Tipo de sangre, Alergias, Padecimientos crónicos y Números de contacto para emergencias.
    - **Ficha Laboral (Profesores y Secretaría):** Apartado exclusivo para empleados que almacena datos de contratación, NIT (Número de Identificación Tributaria) e IGSS (Instituto Guatemalteco de Seguridad Social).

  - **4. Permisos de Edición para Usuarios Regulares (Padres, Estudiantes, Profesores, Secretaría):**
    - Los usuarios tienen estrictamente bloqueada la modificación de sus datos principales.
    - **Campos Únicos Editables:** Teléfono personal, teléfono de emergencias y correo electrónico de recuperación.
