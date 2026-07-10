<role>
Actúa como un Desarrollador Frontend Senior, Arquitecto de Software y Experto en UI/UX con amplios conocimientos en React, Tailwind CSS, sistemas de rutas (React Router) y refactorización de código limpio (Clean Code). Tu objetivo es auditar, limpiar y expandir un sistema escolar existente.
</role>

<context>
Tengo una aplicación web escolar que cuenta con múltiples roles (como tutores, profesores, administradores). Actualmente, estoy utilizando Google Stitch para la inspección, consistencia visual e integración de la interfaz gráfica. El proyecto ya cuenta con componentes base (como CourseCard, menús de inicio, etc.), pero el código necesita ser limpiado, ordenado y estructurado de forma modular. 

Existen dos problemas principales actualmente:
1. Hay ventanas o rutas que no están completamente conectadas o funcionales (links rotos o componentes vacíos).
2. El sistema carece de interfaces administrativas clave para gestionar los datos esenciales de la plataforma.
</context>

<instructions>
Por favor, analiza la estructura de mi proyecto y genera una solución que cumpla estrictamente con los siguientes cuatro requisitos:

1. INSPECCIÓN Y CONEXIÓN DE LA INTERFAZ (GOOGLE STITCH):
- Asegura que la jerarquía de componentes y estilos visuales coincida con las especificaciones de diseño inspeccionadas en Google Stitch.
- Revisa el sistema de enrutamiento para asegurar que "todas las ventanas sirvan". Ningún botón o enlace del menú debe quedar inactivo o apuntar a rutas inexistentes (404).

2. LIMPIEZA Y ORDEN DEL CÓDIGO:
- Refactoriza el código eliminando redundancias, código muerto o estilos duplicados.
- Organiza los componentes de forma lógica y modular (separa la lógica de negocio de la vista si es necesario).
- Asegura que los componentes compartidos (como layouts o sidebars) reciban las propiedades adecuadas de manera limpia.

3. ACCESO ADMINISTRATIVO (CRUD DE USUARIOS Y CURSOS):
- Añade un nuevo botón o apartado estratégico en el menú de navegación principal (por ejemplo, "Panel de Administración" o "Gestión").
- Dentro de este apartado, implementa interfaces completas para un CRUD (Crear, Leer, Actualizar, Eliminar) de los dos pilares más importantes:
  a) Usuarios (Creación de nuevos usuarios con asignación de roles como tutor, alumno, etc.).
  b) Cursos (Creación, edición y asignación de materias, grados, secciones y salones).

4. ENTREGABLES ESPERADOS:
- El código modificado del Menú/Sidebar con el nuevo acceso de administración.
- La configuración actualizada de las Rutas de la aplicación para soportar las nuevas vistas del CRUD.
- Un ejemplo de los componentes de formulario para Crear/Editar Usuarios y Cursos con validaciones básicas.
</instructions>

<input_code_and_files>
[Pega aquí los archivos clave de tu proyecto, por ejemplo: App.jsx (rutas), Sidebar.jsx (menú), o la estructura de carpetas actual]
</input_code_and_files>
