# Especificaciones Técnicas y Diseño de Arquitectura de Producción - Plataforma Estudiantil

Este documento constituye la especificación de ingeniería de software definitiva y lista para producción para la **Plataforma Estudiantil**, un sistema escolar integrado y enfocado en el monitoreo parental. Detalla la arquitectura del sistema, el modelo de datos híbrido, las especificaciones de API, la lógica algorítmica central, la arquitectura del frontend y la matriz de seguridad y privacidad.

---

## 1. Diseño de Base de Datos Híbrida

La aplicación está diseñada sobre una arquitectura de datos híbrida, donde la transaccionalidad robusta y las relaciones complejas se manejan en **MySQL 8.0+** bajo la base de datos `plataforma_estudiantil`, mientras que la flexibilidad documental y la velocidad de acceso para comunicación interactiva se gestionan en **MongoDB**.

### A. Base de Datos Relacional: MySQL (`plataforma_estudiantil`)
El esquema relacional completo se encuentra definido en el archivo [schema.sql](file:///c:/Users/luzfl/OneDrive/Documentos/Plataforma%20Estudiantil/database/schema.sql). A continuación, se presenta la descripción detallada del diccionario de datos de las tablas transaccionales clave:

#### Tabla: `configuraciones_sistema`
Almacena parámetros del sistema configurables por el Administrador.
*   `id` (INT, PK, Auto-increment)
*   `clave` (VARCHAR(100), UNIQUE, NOT NULL): Identificador único de la configuración.
*   `valor` (VARCHAR(255), NOT NULL): Valor configurado.
*   `descripcion` (TEXT, NULL): Detalle de la función de la configuración.

#### Tabla: `usuarios`
Entidad central para inicio de sesión y gestión de credenciales.
*   `id` (INT, PK, Auto-increment)
*   `codigo_ua` (VARCHAR(10), UNIQUE, NOT NULL): Formato `UA-YYRXX` (o `UA-YYRXXX` adaptativo).
*   `contrasena_hash` (VARCHAR(255), NOT NULL): Hash cifrado con Bcrypt.
*   `es_contrasena_temporal` (BOOLEAN, DEFAULT TRUE): Fuerza cambio de contraseña inicial.
*   `rol` (ENUM('Administrador', 'Control Academico', 'Profesor', 'Encargado', 'Estudiante'), NOT NULL)
*   `correo_recuperacion` (VARCHAR(255), UNIQUE, NOT NULL): Utilizado para recuperación de cuenta y vinculación con Google Sign-In.
*   `telefono_personal` (VARCHAR(20), NULL)
*   `telefono_emergencia` (VARCHAR(20), NULL)
*   `estado` (ENUM('Activo', 'Inactivo'), DEFAULT 'Activo')

#### Tabla: `estudiantes_encargados`
Relaciona alumnos con sus padres/tutores autorizados (máximo 2 por estudiante).
*   `id` (INT, PK, Auto-increment)
*   `estudiante_id` (INT, FK -> `usuarios.id`, NOT NULL)
*   `encargado_id` (INT, FK -> `usuarios.id`, NOT NULL)
*   `parentesco` (ENUM('Madre', 'Padre', 'Encargado'), NOT NULL)
*   *Restricción:* Índice único compuesto (`estudiante_id`, `encargado_id`).

#### Tabla: `asistencias_generales`
Registro diario matutino de la asistencia general del estudiante.
*   `id` (INT, PK, Auto-increment)
*   `estudiante_id` (INT, FK -> `usuarios.id`, NOT NULL)
*   `fecha` (DATE, NOT NULL)
*   `estado` (ENUM('Presente', 'Inasistencia', 'Llegada Tarde'), NOT NULL)
*   `justificada` (BOOLEAN, DEFAULT FALSE)
*   `observaciones` (TEXT, NULL)
*   `registrado_por` (INT, FK -> `usuarios.id`, NOT NULL): Profesor Guía.
*   *Restricción:* Índice único compuesto (`estudiante_id`, `fecha`).

#### Tabla: `inasistencias_periodos` (Asistencia Cruzada)
Control granular de la presencia del alumno bloque por bloque de clase.
*   `id` (INT, PK, Auto-increment)
*   `estudiante_id` (INT, FK -> `usuarios.id`, NOT NULL)
*   `curso_id` (INT, FK -> `cursos.id`, NOT NULL)
*   `fecha` (DATE, NOT NULL)
*   `periodo_numero` (INT, NOT NULL): Número de bloque horario.
*   `estado` (ENUM('No Asistio', 'Llegada Tarde'), NOT NULL)
*   `justificada` (BOOLEAN, DEFAULT FALSE)
*   `observacion_docente` (TEXT, NULL)
*   *Restricción:* Índice único compuesto (`estudiante_id`, `curso_id`, `fecha`, `periodo_numero`).

#### Tabla: `actividades`
Definición de evaluaciones académicas.
*   `id` (INT, PK, Auto-increment)
*   `curso_id` (INT, FK -> `cursos.id`, NOT NULL)
*   `titulo` (VARCHAR(150), NOT NULL)
*   `descripcion` (TEXT, NULL)
*   `recursos_adjuntos_url` (VARCHAR(255), NULL)
*   `ponderacion` (DECIMAL(5,2), NOT NULL)
*   `fecha_hora_limite` (DATETIME, NOT NULL)
*   `tipo_actividad` (VARCHAR(50), NOT NULL): Ej: 'Examen Final', 'Corto', 'Tarea Comun'.
*   `modalidad_entrega` (ENUM('Virtual', 'Fisico'), NOT NULL)
*   `rubrica_id` (INT, FK -> `rubricas.id`, NULL)
*   `visible` (BOOLEAN, DEFAULT TRUE)
*   `fecha_publicacion` (DATETIME, NULL)
*   `niveles_prorroga_habilitados` (JSON, NULL): Almacena los niveles de prórroga que el profesor activó para la tarea (Ej: `[1, 2]`).

#### Tabla: `entregas_tareas`
Historial de entregas, notas obtenidas y penalizaciones aplicadas.
*   `id` (INT, PK, Auto-increment)
*   `actividad_id` (INT, FK -> `actividades.id`, NOT NULL)
*   `estudiante_id` (INT, FK -> `usuarios.id`, NOT NULL)
*   `archivo_adjunto_url` (VARCHAR(255), NULL): Para entregas virtuales.
*   `fecha_hora_entrega` (DATETIME, NULL): NULL si no ha entregado.
*   `estado` (ENUM('Calificada', 'Pendiente de Calificar', 'Entregada con Retraso', 'Justificada por Ausencia', 'Caso Especial', 'Intolerable'), NOT NULL)
*   `nota_obtenida` (DECIMAL(5,2), NULL)
*   `penalizacion_aplicada` (DECIMAL(5,2), DEFAULT 0.00): Porcentaje restado a la calificación máxima.
*   `justificacion_maestro` (TEXT, NULL): Para casos especiales de fuerza mayor.
*   `porcentaje_entrega_personalizado` (DECIMAL(5,2), NULL): Calificación máxima autorizada para el caso especial.
*   `nueva_fecha_limite` (DATETIME, NULL): Nueva prórroga acordada.

---

### B. Base de Datos Documental: MongoDB
Las colecciones se encuentran definidas formalmente mediante esquemas de Mongoose en [mongoose_schemas.js](file:///c:/Users/luzfl/OneDrive/Documentos/Plataforma%20Estudiantil/database/mongoose_schemas.js). Sus campos principales y propósitos son:

#### Colección: `mensajes_directos`
Almacena conversaciones bilaterales entre encargados, docentes y personal administrativo.
*   `emisor_id` (String): Código `UA-XXXXX`.
*   `receptor_id` (String): Código `UA-XXXXX`.
*   `contenido` (String)
*   `adjuntos` (Array): Subdocumentos `{ url: String, tipo: String }`.
*   `leido` (Boolean, default: false)
*   `fecha_envio` (Date, default: Date.now)

#### Colección: `foros` y subcolecciones (`hilos_discusion`, `comentarios`)
Estructura de participación comunitaria académica y de padres.
*   `Foro`: Define los canales fijos de materias, foros grupales de tareas o canales generales de secretaría. Contiene `nombre`, `tipo` ('GradoSeccion', 'Tematico', 'GrupoTareas') y la lista de `miembros` autorizados.
*   `HiloDiscusion`: Hilos específicos de debate. Contiene el texto y estado `cerrado` (para silenciar comentarios).
*   `Comentario`: Comentarios y respuestas individuales dentro de un hilo.

#### Colección: `circulares_autorizaciones`
Módulo de comunicaciones oficiales que incorpora el flujo de consentimiento.
*   `titulo` (String) y `contenido` (String).
*   `tipo` (String): 'Informativa' o 'Autorizacion'.
*   `fecha_limite` (Date): Límite de firma virtual o recepción de boleta física.
*   `estado` (String): 'Pendiente', 'No Enviada', 'Enviada', 'Autorizado', 'No Autorizado'.
*   `filtros_destino` (Object): Restringe a qué grados/secciones o alumnos individuales va dirigida.
*   `firmas` (Array): Matriz de seguimiento por estudiante:
    *   `estudiante_id` (String) y `encargado_id` (String).
    *   `estado` (String): 'Pendiente', 'No Enviada', 'Enviada', 'Autorizado', 'No Autorizado'.
    *   `metodo` (String): 'Virtual' (aprobación in-app) o 'Presencial' (registro manual de boleta en secretaría).
    *   `fecha_firma` (Date) y `usuario_recepcion_fisica` (String - ID de la secretaria).

#### Colección: `notificaciones`
Notificaciones instantáneas en la plataforma.
*   `usuario_id` (String): Destinatario `UA-XXXXX`.
*   `tipo` (String): 'General' o 'Alerta' (las alertas disparan correo de respaldo de forma automática).
*   `titulo` (String) y `mensaje` (String).
*   `modulo_origen` (String): 'Asistencia', 'Calificaciones', 'Circulares', etc.
*   `leido` (Boolean, default: false)

---

## 2. Especificación de API REST Completa

La comunicación entre el Frontend React y el Monolito de Node.js se realiza mediante una API JSON estructurada. A continuación se detallan los endpoints requeridos por dominio:

### A. Módulo de Autenticación y Seguridad
| Método | Endpoint | Request Body | Responses (JSON) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | `{ "codigo_ua": "UA-26305", "contrasena": "12345" }` | `200 OK`: `{ "token": "JWT_TOKEN", "usuario": { "nombre", "rol", "es_temporal": true } }`<br>`401 Unauthorized`: `{ "error": "Credenciales inválidas" }` | Autenticación con identificador UA. Devuelve token JWT. |
| `POST` | `/api/auth/google` | `{ "idToken": "GOOGLE_ID_TOKEN" }` | `200 OK`: `{ "token": "JWT_TOKEN", "usuario": { "nombre", "rol" } }`<br>`401 Unauthorized`: `{ "error": "Cuenta de Google no vinculada o inactiva" }` | Valida token de Google, busca coincidencia con correo de recuperación y firma sesión. |
| `PUT` | `/api/auth/cambio-inicial` | `{ "nueva_contrasena": "Nueva123$" }` | `200 OK`: `{ "message": "Contraseña actualizada con éxito" }`<br>`400 Bad Request`: `{ "error": "No cumple políticas de seguridad" }` | Fuerza al usuario a cambiar su contraseña temporal en su primer login. |
| `POST` | `/api/auth/recuperacion` | `{ "codigo_ua": "UA-26305" }` | `200 OK`: `{ "message": "Correo de recuperación enviado" }` | Envía un enlace de un solo uso (validez 15 min) al correo asociado. |

### B. Módulo de Asistencia e Inasistencias
| Método | Endpoint | Request/Query Params | Responses (JSON) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/asistencias/general` | `{ "estudiante_id": 15, "estado": "Inasistencia", "observaciones": "Falta médica" }` | `201 Created`: `{ "asistencia": { "id", "fecha", "estado" } }` | Registro matutino de asistencia general (Profesor Guía). Dispara alertas internas de contingencia. |
| `POST` | `/api/asistencias/local` | `{ "estudiante_id": 15, "curso_id": 8, "periodo": 3, "estado": "No Asistio", "observacion": "En coordinación" }` | `201 Created` | Registro local de inasistencia por periodo de clase. Si el estado es "Llegada Tarde" y estaba marcado como ausente general, activa la actualización en cascada. |
| `POST` | `/api/asistencias/justificaciones` | Multipart/Form-data: `{ "estudiante_id": 15, "fecha_falta": "2026-07-09", "motivo": "Cita médica", "adjunto": file }` | `201 Created` | Padre envía justificación. Debe ser antes del mediodía del día siguiente (o según la hora configurada por el admin). |
| `PUT` | `/api/asistencias/justificaciones/:id` | `{ "estado": "Aprobada", "observacion": "Prórroga extendida 48h" }` | `200 OK` | Resolución de justificación (Profesor Guía o Secretaría). Al aprobar, desbloquea las prórrogas de tareas pendientes de esa fecha. |

### C. Módulo de Calificaciones, Rúbricas y Tareas
| Método | Endpoint | Request Body / Query | Responses (JSON) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/actividades` | `{ "curso_id", "titulo", "ponderacion", "fecha_hora_limite", "tipo_actividad", "modalidad_entrega", "rubrica_id", "niveles_prorroga_habilitados": [1, 2] }` | `201 Created` | Profesor crea una actividad e indica qué niveles de prórroga de los configurados por el admin desea habilitar. |
| `POST` | `/api/entregas` | Multipart: `{ "actividad_id", "archivo": file }` | `201 Created` | Alumno realiza entrega virtual. El backend calcula automáticamente los días de retraso y el nivel de penalización aplicable. |
| `PUT` | `/api/calificaciones/evaluar` | `{ "entrega_id", "nota_manual", "criterios_rubrica": [{ "criterio_id", "escala_id" }] }` | `200 OK` | Profesor califica tarea. Si se evalúa por rúbrica, suma los valores automáticamente. El backend resta el porcentaje de penalización si corresponde. |
| `POST` | `/api/calificaciones/excepcion` | `{ "entrega_id", "justificacion_maestro", "porcentaje_entrega_personalizado", "nueva_fecha_limite" }` | `200 OK` | Profesor aplica excepción manual a un alumno (caso especial por enfermedad, etc.), anulando el flujo de penalización automática. |

### D. Módulo de Comunicación y Foros (MongoDB)
| Método | Endpoint | Request Body | Responses (JSON) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/mensajes/:destinatario_id` | Query: `{ "limite": 20 }` | `200 OK`: `[{ "emisor_id", "contenido", "fecha_envio", "leido" }]` | Obtiene el historial de chat directo con un usuario. Si es Padre, valida que el destinatario sea profesor de su hijo o secretaría. |
| `POST` | `/api/mensajes` | `{ "receptor_id", "contenido", "adjuntos": [] }` | `201 Created` | Envía mensaje directo. Si está fuera del horario de atención del receptor, añade a la respuesta la advertencia de respuesta demorada. |
| `POST` | `/api/foros` | `{ "nombre", "tipo", "grado_seccion": {}, "miembros": [] }` | `201 Created` | Creación de foro (Admin o Profesores/Secretaría para temáticos). |
| `POST` | `/api/foros/hilos` | `{ "foro_id", "titulo", "contenido" }` | `201 Created` | Publica un nuevo hilo de discusión dentro de un foro. |
| `POST` | `/api/foros/hilos/comentarios` | `{ "hilo_id", "contenido" }` | `201 Created` | Agrega un comentario en un hilo de discusión. |

### E. Módulo de Circulares y Autorizaciones
| Método | Endpoint | Request Body | Responses (JSON) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/circulares` | `{ "titulo", "contenido", "tipo": "Autorizacion", "fecha_limite", "filtros_destino": {} }` | `201 Created` | Secretaría crea circular. El estado inicial es "Pendiente". |
| `PUT` | `/api/circulares/:id/publicar` | `{ "estado": "Enviada" }` | `200 OK` | Cambia el estado a "Enviada", haciéndola visible en el calendario y paneles de los padres. Dispara notificaciones y correos. |
| `PUT` | `/api/circulares/autorizar/virtual` | `{ "circular_id", "estudiante_id", "autorizado": true }` | `200 OK` | Firma digital del padre desde la app. Si es exitosa, cambia estado de firma a "Autorizado" y desbloquea el evento escolar en el calendario del alumno. |
| `PUT` | `/api/circulares/autorizar/presencial` | `{ "circular_id", "estudiante_id", "codigo_ua_recepcion": "UA-26201" }` | `200 OK` | Secretaría registra la entrega de la boleta de papel firmada por el padre. |

### F. Incidentes, Quejas y Citas Presenciales
| Método | Endpoint | Request Body | Responses (JSON) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `POST` | `/api/quejas` | `{ "destinatario_id", "estudiante_id", "titulo", "descripcion", "tipo" }` | `201 Created` | Registro de queja (Padre -> Prof/Sec, Prof -> Estudiante, Sec -> Presencial). |
| `PUT` | `/api/quejas/:id/escalar` | `{ "motivo_escalamiento": "Límite pedagógico" }` | `200 OK` | Profesor escala el incidente a Secretaría. Modifica el destinatario en MySQL y actualiza el JSON de escalabilidad. |
| `POST` | `/api/citas/solicitar` | `{ "destinatario_id", "estudiante_id", "fecha_hora", "motivo", "es_prioritaria" }` | `201 Created` | Solicita una reunión. El frontend valida previamente contra los horarios de atención libres en MySQL. |
| `PUT` | `/api/citas/:id/estado` | `{ "estado": "Aprobada" }` | `200 OK` | Modificación del estado de la cita por parte del receptor. |

### G. Módulo de Configuración de Negocio (Admin)
| Método | Endpoint | Request Body | Responses (JSON) | Descripción |
| :--- | :--- | :--- | :--- | :--- |
| `GET` | `/api/admin/configuraciones` | None | `200 OK`: `[{ "clave", "valor", "descripcion" }]` | Consulta de todas las reglas configurables del negocio. |
| `PUT` | `/api/admin/configuraciones` | `{ "configuraciones": [{ "clave", "valor" }] }` | `200 OK` | Modificación masiva de parámetros (Ej: cambiar hora límite de justificación o los días/porcentajes de prórroga). |

---

## 3. Lógica y Algoritmos Core en Pseudocódigo

Para garantizar una correcta traducción a código JavaScript en el Backend, se especifican a continuación los flujos lógicos clave del sistema:

### Algoritmo 1: Generación del Código Único de Acceso (`UA-YYRXX`)
Este algoritmo se ejecuta durante la creación de un nuevo usuario en la base de datos MySQL.

```pseudocode
FUNCION generar_codigo_ua(rol_usuario, anio_ingreso)
    // 1. Obtener los últimos 2 dígitos del año de ingreso
    dos_digitos_anio = SUBSTRING(convertir_a_cadena(anio_ingreso), 3, 4) // Ej: 2026 -> "26"
    
    // 2. Mapear el rol del usuario a su código de dígito identificador
    digito_rol = ""
    SEGUN rol_usuario HACER
        Caso "Administrador":      digito_rol = "1"
        Caso "Control Academico":  digito_rol = "2"
        Caso "Profesor":           digito_rol = "3"
        Caso "Encargado":          digito_rol = "4"
        Caso "Estudiante":         digito_rol = "5"
    FIN SEGUN
    
    prefijo_base = "UA-" + dos_digitos_anio + digito_rol // Ej: "UA-263"
    
    // 3. Buscar el correlativo máximo actual en la base de datos para ese prefijo
    ultimo_codigo = SELECT codigo_ua FROM usuarios 
                    WHERE codigo_ua LIKE CONCAT(prefijo_base, '%') 
                    ORDER BY codigo_ua DESC LIMIT 1
    
    nuevo_correlativo = 1
    SI ultimo_codigo EXISTE ENTONCES
        // Extraer los caracteres posteriores al prefijo base
        secuencia_texto = SUBSTRING(ultimo_codigo, longitud(prefijo_base) + 1)
        nuevo_correlativo = convertir_a_entero(secuencia_texto) + 1
    FIN SI
    
    // 4. Formatear la secuencia numérica (por defecto 2 dígitos, escalable a 3 si se supera el 99)
    cadena_correlativo = ""
    SI nuevo_correlativo <= 99 ENTONCES
        cadena_correlativo = PAD_LEFT(convertir_a_cadena(nuevo_correlativo), 2, "0") // Ej: 5 -> "05"
    SINO
        cadena_correlativo = convertir_a_cadena(nuevo_correlativo) // Ej: 104 -> "104" (Desborde controlado)
    FIN SI
    
    RETORNAR prefijo_base + cadena_correlativo
FIN FUNCION
```

---

### Algoritmo 2: Cálculo de Notas con Penalizaciones por Retraso
Se ejecuta en el backend cuando se registra la entrega de una tarea o se procede a calificar.

```pseudocode
FUNCION calcular_nota_final(entrega_id, rubrica_puntos_obtenidos)
    // 1. Obtener la información de la entrega y la actividad asociada
    entrega = SELECT * FROM entregas_tareas WHERE id = entrega_id
    actividad = SELECT * FROM actividades WHERE id = entrega.actividad_id
    
    // Si es un caso especial definido manualmente por el docente, se anula el flujo automático
    SI entrega.estado == "Caso Especial" ENTONCES
        porcentaje_max = entrega.porcentaje_entrega_personalizado // Ej: 90.00 (calificar sobre el 90%)
        nota_final = (rubrica_puntos_obtenidos * (porcentaje_max / 100.00))
        RETORNAR nota_final, penalizacion_aplicada = 0
    FIN SI
    
    // Si la entrega está justificada por ausencia, se califica al 100% sobre la nueva fecha límite
    SI entrega.estado == "Justificada por Ausencia" ENTONCES
        SI entrega.fecha_hora_entrega <= entrega.nueva_fecha_limite ENTONCES
            RETORNAR rubrica_puntos_obtenidos, penalizacion_aplicada = 0
        SINO
            // Si incumple la prórroga de la justificación, pasa directamente a Intolerable
            nota_intolerable = actividad.ponderacion * 0.10 // 10% obligatorio
            RETORNAR nota_intolerable, penalizacion_aplicada = 90.00
        FIN SI
    FIN SI
    
    // Si no se ha entregado y se califica directamente, o si la entrega es NULL y ya vencieron los plazos
    SI entrega.fecha_hora_entrega IS NULL ENTONCES
        SI OBTENER_FECHA_ACTUAL() > actividad.fecha_hora_limite ENTONCES
            RETORNAR (actividad.ponderacion * 0.10), penalizacion_aplicada = 90.00 // Intolerable
        SINO
            RETORNAR NULL, penalizacion_aplicada = 0 // Aún no vence y no ha entregado
        FIN SI
    FIN SI
    
    // 2. Calcular diferencia de tiempo en días completos
    diferencia_milisegundos = entrega.fecha_hora_entrega - actividad.fecha_hora_limite
    dias_retraso = CEIL(diferencia_milisegundos / (1000 * 60 * 60 * 24))
    
    SI dias_retraso <= 0 ENTONCES
        // Entregado a tiempo
        RETORNAR rubrica_puntos_obtenidos, penalizacion_aplicada = 0
    FIN SI
    
    // 3. Obtener niveles de prórroga activos en el sistema (Cargados de configuraciones_sistema)
    niveles_sistema = OBTENER_NIVELES_PRORROGA_SISTEMA() // [{nivel: 1, dias: 1, penalizacion: 75}, ...]
    
    // Obtener qué niveles de prórroga autorizó el profesor al crear esta actividad específica
    niveles_autorizados = actividad.niveles_prorroga_habilitados // Ej: [1, 2]
    
    penalizacion_porcentaje = 0
    aplicar_intolerable = TRUE
    
    // Evaluar secuencialmente en qué nivel de prórroga cae el retraso
    PARA CADA lvl EN niveles_sistema ORDENAR_POR nivel ASC
        SI lvl.nivel EN niveles_autorizados ENTONCES
            SI dias_retraso <= lvl.dias ENTONCES
                // Cae en esta prórroga
                penalizacion_porcentaje = 100.00 - lvl.penalizacion // Ej: Califica sobre 75% -> Penalización del 25%
                aplicar_intolerable = FALSE
                ROMPER BUCLE
            FIN SI
        FIN SI
    FIN PARA
    
    // 4. Aplicar descuento de nota o bloquear bajo el estado Intolerable
    SI aplicar_intolerable ENTONCES
        // Fuera de toda prórroga permitida o sin prórrogas habilitadas -> 10% obligatorio
        nota_final = actividad.ponderacion * 0.10
        penalizacion_aplicada_porcentaje = 90.00
    SINO
        // Calificación final aplicando la penalización
        factor_escala = (100.00 - penalizacion_porcentaje) / 100.00
        nota_final = rubrica_puntos_obtenidos * factor_escala
        penalizacion_aplicada_porcentaje = penalizacion_porcentaje
    FIN SI
    
    RETORNAR nota_final, penalizacion_aplicada = penalizacion_aplicada_porcentaje
FIN FUNCION
```

---

### Algoritmo 3: Asistencia Cruzada y Cascada de Llegada Tardía
Se ejecuta en el backend cuando el profesor de una materia reporta que un estudiante, previamente marcado como inasistente en el reporte general matutino, se ha presentado a su periodo de clase.

```pseudocode
FUNCION registrar_llegada_tardia_periodo(estudiante_id, curso_id, periodo_n, observacion_txt)
    fecha_hoy = OBTENER_FECHA_ACTUAL_SIN_HORA()
    
    // 1. Insertar el registro de inasistencia local en la tabla secundaria
    INSERT INTO inasistencias_periodos 
        (estudiante_id, curso_id, fecha, periodo_numero, estado, observacion_docente)
    VALUES 
        (estudiante_id, curso_id, fecha_hoy, periodo_n, "Llegada Tarde", observacion_txt)
    ON DUPLICATE KEY UPDATE 
        estado = "Llegada Tarde", observacion_docente = observacion_txt
        
    // 2. Verificar el estado del estudiante en la asistencia general del día
    asistencia_gral = SELECT * FROM asistencias_generales 
                       WHERE estudiante_id = estudiante_id AND fecha = fecha_hoy
                       
    SI asistencia_gral EXISTE Y asistencia_gral.estado == "Inasistencia" ENTONCES
        // 3. ACTUALIZACIÓN EN CASCADA: Modificar la asistencia general de la mañana
        UPDATE asistencias_generales 
        SET estado = "Llegada Tarde",
            observaciones = CONCAT(COALESCE(observaciones, ""), " | Llegada tarde registrada en período ", periodo_n)
        WHERE id = asistencia_gral.id
        
        // 4. Detener/Reajustar alertas en el Centro de Puesta al Día
        // Se cancela el requerimiento de material de contingencia académica para los cursos de la tarde
        ELIMINAR_ALERTAS_PENDIENTES_PUESTA_AL_DIA(estudiante_id, fecha_hoy, periodo_n)
        
        // 5. Enviar notificación al Profesor Guía de que el alumno ya está presente
        enviar_notificacion_in_app(
            destinatario_id = asistencia_gral.registrado_por,
            titulo = "Llegada Tarde Registrada",
            mensaje = CONCAT("El alumno ", OBTENER_NOMBRE_ALUMNO(estudiante_id), " se incorporó tarde en el período ", periodo_n),
            modulo = "Asistencia"
        )
    FIN SI
FIN FUNCION
```

---

### Algoritmo 4: Cron Job de Consolidación de Faltas Sin Justificar
Este script en segundo plano se ejecuta diariamente a la hora parametrizada por el Administrador.

```pseudocode
FUNCION ejecutar_cron_consolidacion_asistencia()
    // 1. Obtener la hora y parámetros configurados por el administrador
    hora_limite = SELECT valor FROM configuraciones_sistema WHERE clave = "hora_limite_justificacion_digital"
    // Validar si la hora actual coincide con la hora límite
    SI OBTENER_HORA_ACTUAL() != hora_limite ENTONCES
        RETORNAR // No es momento de ejecución
    FIN SI
    
    fecha_ayer = OBTENER_FECHA_AYER()
    
    // 2. Buscar inasistencias generales de ayer que no tengan justificación aprobada
    inasistencias_pendientes = SELECT a.* FROM asistencias_generales a
                                LEFT JOIN justificaciones_inasistencias j 
                                  ON a.estudiante_id = j.estudiante_id AND a.fecha = j.fecha_falta
                                WHERE a.fecha = fecha_ayer 
                                  AND a.estado = "Inasistencia"
                                  AND (j.id IS NULL OR j.estado = "Rechazada")
                                  
    // 3. Consolidar faltas definitivamente e insertar observaciones automáticas
    PARA CADA inasistencia EN inasistencias_pendientes
        UPDATE asistencias_generales 
        SET estado = "Inasistencia",
            observaciones = CONCAT(COALESCE(observaciones, ""), " | Sin justificación por falta (Consolidado Automático)")
        WHERE id = inasistencia.id
        
        // Registrar la penalización académica de 10% en tareas virtuales/físicas de esa fecha
        aplicar_nota_minima_por_inasistencia_injustificada(inasistencia.estudiante_id, fecha_ayer)
    FIN PARA
FIN FUNCION
```

---

### Algoritmo 5: Cron Job de Vencimiento Automático de Circulares
Corre cada hora para procesar circulares de autorización cuya fecha de respuesta ha vencido.

```pseudocode
FUNCION ejecutar_cron_vencimiento_circulares()
    fecha_hora_actual = OBTENER_FECHA_HORA_ACTUAL()
    
    // 1. Buscar circulares en estado "Enviada" cuya fecha_limite de respuesta ya pasó
    circulares_vencidas = BUSCAR_DOCUMENTOS_MONGODB("circulares_autorizaciones", {
        estado: "Enviada",
        fecha_limite: { $lte: fecha_hora_actual }
    })
    
    PARA CADA circular EN circulares_vencidas
        // 2. Actualizar las firmas individuales que quedaron pendientes o enviadas a "No Autorizado"
        PARA CADA firma EN circular.firmas
            SI firma.estado == "Enviada" O firma.estado == "Pendiente" ENTONCES
                firma.estado = "No Autorizado"
                firma.fecha_firma = fecha_hora_actual
            FIN SI
        FIN PARA
        
        // 3. Cambiar el estado global de la circular a "No Autorizado" (Cierre de ciclo)
        circular.estado = "No Autorizado"
        ACTUALIZAR_DOCUMENTO_MONGODB("circulares_autorizaciones", circular._id, circular)
        
        // 4. Disparar notificaciones a los padres rezagados informando de la cancelación de participación
        PARA CADA firma EN circular.firmas
            SI firma.estado == "No Autorizado" ENTONCES
                enviar_notificacion_in_app(
                    destinatario_id = firma.encargado_id,
                    titulo = "Autorización Vencida",
                    mensaje = CONCAT("Se ha cerrado el plazo de autorización para el evento: ", circular.titulo),
                    modulo = "Circulares"
                )
            FIN SI
        FIN PARA
    FIN PARA
FIN FUNCION
```

---

## 4. Arquitectura Frontend React

La interfaz de usuario se implementa como una Single Page Application (SPA) responsive en **React**, construida mediante una separación de diseño e interacciones dinámica.

```
┌────────────────────────────────────────────────────────┐
│                      TOPBAR                            │
│ [Toggle] Logotipo/Nombre          Mensajes  Alertas Avatar│
├──────────────┬─────────────────────────────────────────┤
│              │ Breadcrumbs                             │
│  SIDEBAR     │                                         │
│  DINÁMICO    │ TÍTULO DE PÁGINA                        │
│  (Colapsable)│ ─────────────────────────────────────── │
│              │                                         │
│  - Inicio    │                                         │
│  - Notas     │         ÁREA DE CONTENIDO CENTRAL       │
│  - Asistencia│                                         │
│  - Circulares│                                         │
│  - Foros     │                                         │
│              │                                         │
└──────────────┴─────────────────────────────────────────┘
```

### A. Elementos Globales del Layout
1.  **Sidebar Izquierdo (Menú de Navegación):**
    *   *Comportamiento Colapsable (Toggle):* Se oculta/muestra mediante un botón en el extremo superior izquierdo. El estado de colapso se almacena en el `localStorage` para persistencia.
    *   *Cabecera:* Muestra logotipo escolar y nombre institucional.
    *   *Cuerpo:* Generación dinámica de rutas mapeadas según el rol recuperado de la sesión de `AuthContext`.
    *   *Pie:* Botones fijos de "Configuraciones" y "Cerrar sesión" vinculados a la destrucción del token.
2.  **Topbar (Barra Superior):**
    *   *Avatar Circular:* Despliega un menú flotante (Popover) con foto de perfil, nombre, rol y un botón de redirección hacia `/mi-perfil`.
    *   *Info de Usuario:* Texto estático que muestra el nombre completo del usuario y su rol.
    *   *Mensajes Directos:* Icono con indicador numérico de no leídos. Despliega un desplegable con previsualizaciones y enlace a `/mensajeria`.
    *   *Notificaciones:* Icono de campana con recuento de notificaciones prioritarias. Despliega las últimas alertas y redirige a `/notificaciones`.
3.  **Área de Contenido Central:**
    *   *Breadcrumbs:* Componente dinámico de rastreo de rutas (Ej: `Inicio > Rendimiento > Control de Notas`).
    *   *Título:* Destaca en cabecera el título del módulo activo.
    *   *Contenido:* Contenedor principal que renderiza el componente secundario de la ruta seleccionada.

### B. Rutas y Guardias de Seguridad (React Router)
Todas las rutas están agrupadas bajo un componente de enrutador principal. Las rutas privadas implementan un componente de envoltura (`ProtectedRoute`) que valida la presencia del JWT y restringe el renderizado si el usuario no cuenta con el rol autorizado en el payload del token.

### C. Mapeo de Vistas y Menús por Rol
La siguiente matriz especifica qué componentes y vistas de navegación se cargan en el Sidebar y el Contenido Central para cada rol:

| Rol | Ítems de Menú (Sidebar) | Vista Principal y Funciones Requeridas |
| :--- | :--- | :--- |
| **Administrador** | • Inicio<br>• Gestión de Usuarios<br>• Cursos y Materias<br>• Ajustes del Sistema | • **CRUD de Usuarios:** Tabla interactiva con filtros de búsqueda avanzada por UA o nombre. Formularios modales para crear/editar usuarios y asignar contraseñas temporales.<br>• **Control de Cursos:** Modales para crear materias, asignar profesores titulares y definir el aula física.<br>• **Fichas Avanzadas:** Secciones especiales para edición de Ficha Médica y Ficha Laboral de empleados. |
| **Control Académico** | • Inicio<br>• Alumnos y Familias<br>• Personal y Horarios<br>• Asistencia General<br>• Circulares e Impresión<br>• Buzón de Incidentes | • **Fichas de Estudiantes:** Panel para vincular hasta 2 encargados y administrar sus perfiles de privacidad.<br>• **Buscador de Horarios:** Consulta interactiva de bloques libres de profesores.<br>• **Asistencia General:** Tablero diario de inasistencias generales con botón de disparo de correos de contingencia escolar.<br>• **Gestión de Firmas Físicas:** Panel rápido para buscar alumno y marcar como "Autorizado" al recibir boletas en papel. |
| **Profesor** | • Inicio<br>• Mis Cursos<br>• Banco de Rúbricas<br>• Tolerancia y Retrasos<br>• Centro de Justificaciones<br>• Planificación y Apoyo | • **Mis Cursos:** Tarjetas de materias con acceso rápido a Tareas, Calificaciones y Asistencias del curso.<br>• **Tolerancias:** Formulario para habilitar/deshabilitar prórrogas generales para sus tareas.<br>• **Asistencia por Período:** Rejilla del día actual. Permite el control de inasistencia local o llegada tarde, disparando la cascada. Permite la edición del día anterior solo si el estado original del alumno fue "Inasistencia".<br>• **Apoyo Contingente:** Cargador de PDF/enlaces que se activa automáticamente para los alumnos inasistentes. |
| **Encargado** | • Inicio<br>• Rendimiento Académico<br>• Calendario Escolar<br>• Circulares y Firmas<br>• Foro de Padres<br>• Reportes e Incidentes | • **Rendimiento:** Tarjetas de asignaturas que muestran el promedio del alumno. Detalle de Próximas Actividades, Historial de Entregas (con estados y penalizaciones visuales) e Incumplimientos (con cuenta regresiva de prórrogas).<br>• **Circulares:** Centro de firmas virtuales con botón "No Autorizar" e instrucciones para circulares presenciales.<br>• **Incidentes y Citas:** Formulario de quejas y programador de citas basado en las horas de atención del docente. |
| **Estudiante** | • Inicio<br>• Mis Notas<br>• Mi Agenda<br>• Calendario Escolar<br>• Circulares Informativas<br>• Asistencia Escolar<br>• Mis Foros | • **Mi Agenda:** Cronograma estructurado por fechas de entrega.<br>• **Calendario:** Muestra sus periodos con códigos de colores por materia. Botón para crear "Eventos Propios" (notas de estudio personales).<br>• **Asistencia:** Gráfico e historial de inasistencias y estados de justificación (con enlaces a prórrogas habilitadas por el docente). |

---

## 5. Lógica de Seguridad, Acceso y Privacidad de Datos

El sistema implementa una matriz de seguridad restrictiva tanto en el lado del servidor como del cliente, garantizando la confidencialidad de la información familiar y académica.

### A. Flujo de Autenticación con Código `UA-XXXXX`
1.  **Ingreso Inicial:**
    *   Al crear el usuario, el Administrador asigna una contraseña temporal.
    *   Cuando el usuario inicia sesión por primera vez (`POST /api/auth/login`), el backend valida las credenciales y comprueba que `es_contrasena_temporal === true`.
    *   El token JWT emitido cuenta con un payload restringido. El Frontend, al detectar este estado, redirige de forma obligatoria al usuario a `/cambio-contrasena-obligatorio`, bloqueando el acceso al resto del sistema hasta que se actualice la contraseña.

### B. Integración de Google Sign-In (OAuth 2.0)
```
[Usuario Presiona Google Login] ──► Obtiene ID Token desde Google 
                                             │
                                             ▼
[Backend Node.js] ──► Valida Token con google-auth-library 
                            │
                            ▼ (Extrae correo de Google: "tutor@gmail.com")
[Búsqueda en MySQL] ──► SELECT * FROM usuarios 
                        WHERE correo_recuperacion = "tutor@gmail.com" 
                        AND estado = "Activo"
                            │
      ┌─────────────────────┴─────────────────────┐
      ▼ (Coincide)                                ▼ (No coincide)
Genera JWT de Sesión (Rol y UA)              Devuelve 401 Unauthorized
```

### C. Privacidad y Visibilidad Cruzada de Perfiles
*   **Restricción del Segundo Tutor:**
    *   El colegio permite un máximo de dos tutores (ej: Madre y Padre) enlazados a un estudiante en `estudiantes_encargados`.
    *   Al ingresar a la pantalla de perfil, un Tutor "A" visualiza sus datos personales y los del alumno. En la sección de vinculación familiar, visualizará que existe un "Segundo Tutor" y su parentesco (Ej: "Segundo Tutor registrado como: Madre"), pero **nunca** se expondrán el nombre completo, correo electrónico, teléfono o datos de contacto del Tutor "B" por motivos estrictos de privacidad.
*   **Matriz de Acceso a Avatares / Perfiles:**
    *   *Padres y Estudiantes:* Tienen bloqueada la navegación o clic en los avatares de otros usuarios. Si intentan ingresar de forma forzada a `/perfil/:codigo_ua` ajeno, el `ProtectedRoute` del frontend y los middlewares del backend devolverán un error `403 Forbidden`.
    *   *Profesores, Secretaría y Administradores:* Son los únicos roles autorizados en el sistema para interactuar con los avatares en listas de calificaciones, foros o reportes de asistencia para visualizar la ficha de perfil completa y datos médicos del usuario.

### D. Control de Edición de Datos (Backend Enforcement)
Los usuarios regulares (Padres, Estudiantes, Profesores e incluso Control Académico) tienen bloqueada la modificación de sus nombres, apellidos, documentos de identidad o condiciones académicas.
*   El backend cuenta con un middleware de sanitización aplicado a `PUT /api/usuarios/perfil` que elimina del `req.body` cualquier campo que no sea:
    *   `telefono_personal`
    *   `telefono_emergencia`
    *   `correo_recuperacion`
*   Cualquier intento de inyectar variables de rol, nombres o datos tributarios/médicos es ignorado silenciosamente por el servidor, previniendo escalamiento de privilegios o adulteración de registros de auditoría.
