# Guía de Credenciales de Acceso de Prueba - Plataforma Estudiantil (UA)

Este documento contiene las credenciales de las 10 cuentas de prueba generadas por el script de sembrado masivo (`seeder.js`) para validar los roles, vistas y reglas de negocio del sistema híbrido (MySQL y MongoDB).

---

## 1. Bitácora de Credenciales de Prueba

Los códigos de usuario siguen la regla institucional `UA-YYRXX` donde **YY** representa el año 26, **R** el rol del usuario (1 Administrador, 2 Control Académico, 3 Profesor, 4 Encargado, 5 Estudiante), y **XX** el correlativo de dos dígitos.

| Identificador Único (Username) | Contraseña por Defecto | Rol Oficial | Nombre Completo Ficticio | Correo de Recuperación | Detalles / Vinculaciones para Pruebas |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UA-26101** | admin123 | Administrador | Juan Perez Ortega | juan.perez@ua.edu.gt | Perfil administrativo global con ficha laboral. |
| **UA-26201** | control123 | Control Academico | Maria Juarez Diaz | maria.juarez@ua.edu.gt | Personal de control de asistencia general. Ficha laboral. |
| **UA-26202** | control456 | Control Academico | Pedro Morales Cobar | pedro.morales@ua.edu.gt | Personal de control de asistencia general. Ficha laboral. |
| **UA-26301** | profe123 | Profesor | Carlos Gomez Estrada | carlos.gomez@ua.edu.gt | **Profesor Guía**. Imparte Matemática I en Décimo A. Ficha laboral. |
| **UA-26302** | profe456 | Profesor | Sofia Lopez Alvarado | sofia.lopez@ua.edu.gt | Imparte Física Fundamental en Undécimo B. Ficha laboral. |
| **UA-26303** | profe789 | Profesor | Jorge Diaz Herrera | jorge.diaz@ua.edu.gt | Profesor general asignado. Ficha laboral. |
| **UA-26401** | tutor123 | Encargado | Luisa Ortega Cruz | luisa.ortega@gmail.com | **Madre y encargada** del estudiante Jose Ortega Cruz (`UA-26501`). |
| **UA-26402** | tutor456 | Encargado | Roberto Mendez Silva | roberto.mendez@gmail.com | **Padre y encargado** de la estudiante Andrea Mendez Silva (`UA-26502`). |
| **UA-26501** | estudiante123 | Estudiante | Jose Ortega Cruz | jose.ortega@ua.edu.gt | Alumno de Décimo A. Ficha médica. **Marcará cambio obligatorio de clave en primer ingreso.** |
| **UA-26502** | andrea123 | Estudiante | Andrea Mendez Silva | andrea.mendez@ua.edu.gt | Alumna de Undécimo B. Ficha médica. Acceso inmediato. |

---

## 2. Instrucciones para Re-Sembrar los Datos de Prueba

Si deseas limpiar las bases de datos y volver a cargar los escenarios iniciales por defecto, sigue estos pasos:

1. Asegúrate de que MySQL y MongoDB estén encendidos localmente.
2. Abre tu terminal en la carpeta `/backend` y ejecuta el script seeder:
   ```bash
   cd "c:\Users\luzfl\OneDrive\Documentos\Plataforma Estudiantil\backend"
   node seeder.js
   ```
3. El script imprimirá en consola un mensaje de éxito: `[SEEDER] Masive seed finalizado con exito.`

---

## 3. Instrucciones de Arranque del Sistema

### Paso 1: Levantar el Servidor Backend
```bash
cd "c:\Users\luzfl\OneDrive\Documentos\Plataforma Estudiantil\backend"
npm run dev
```
*El servidor escuchará en http://localhost:5000*

### Paso 2: Levantar el Cliente Frontend (Vite)
```bash
cd "c:\Users\luzfl\OneDrive\Documentos\Plataforma Estudiantil\frontend"
npm run dev
```
*El cliente de desarrollo abrirá en http://localhost:3000*

---

## 4. Escenarios de Pruebas Pre-Cargados

*   **Asistencia Cruzada (MySQL + MongoDB):** El estudiante Jose Ortega (`UA-26501`) tiene registro de asistencia general "Presente" el día de hoy, pero tiene una falta injustificada registrada localmente en el periodo 3 en la clase de Física. Esto activa la alerta en el Centro de Puesta al Día (MongoDB).
*   **Llegada Tardía (Cascada):** La estudiante Andrea Mendez (`UA-26502`) fue reincorporada en el periodo 4, actualizando su estado de asistencia general a "Llegada Tarde" con la observación respectiva.
*   **Penalizaciones y Prórrogas (Notas):** 
    *   Entrega a tiempo calificada de Jose en Matemática.
    *   Entrega con 1 día de retraso de Andrea en Matemática (Nivel 1 de prórroga con penalización del 75% sobre la nota).
    *   Entrega con 3 días de retraso de Jose en Física (Nivel 2 de prórroga con penalización del 50%).
    *   Falta de entrega de Andrea en Física excede el límite (Cae en estado "Intolerable" asignando automáticamente el 10% de la ponderación).
*   **Mensajería y Circulares (NoSQL):** Hay 3 circulares en MongoDB (una informativa, una de autorización pendiente y una ya autorizada y firmada virtualmente por la encargada Luisa Ortega).
