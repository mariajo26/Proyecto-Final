import React from 'react';
import WeeklyScheduleCalendar from '../WeeklyScheduleCalendar';

// Asignaciones del Docente Titular (excluyendo grupo de Profesor Guía)
const ASIGNACIONES_DOCENTE = [
    { dia: 'Lunes', periodo: 1, materia: 'Física General', grado: '4to Bachillerato A', aula: 'Laboratorio de Ciencias' },
    { dia: 'Lunes', periodo: 2, materia: 'Física General', grado: '4to Bachillerato A', aula: 'Laboratorio de Ciencias' },
    { dia: 'Martes', periodo: 2, materia: 'Matemática Aplicada II', grado: '5to Bachillerato B', aula: 'Salón 204' },
    { dia: 'Martes', periodo: 3, materia: 'Matemática Aplicada II', grado: '5to Bachillerato B', aula: 'Salón 204' },
    { dia: 'Miércoles', periodo: 3, materia: 'Seminario de Investigación', grado: '5to Bachillerato A', aula: 'Aula Magna' },
    { dia: 'Miércoles', periodo: 4, materia: 'Física General', grado: '4to Bachillerato A', aula: 'Laboratorio de Ciencias' },
    { dia: 'Jueves', periodo: 1, materia: 'Matemática Aplicada II', grado: '5to Bachillerato B', aula: 'Salón 204' },
    { dia: 'Jueves', periodo: 5, materia: 'Seminario de Investigación', grado: '5to Bachillerato A', aula: 'Aula Magna' },
    { dia: 'Viernes', periodo: 6, materia: 'Seminario de Investigación', grado: '5to Bachillerato A', aula: 'Aula Magna' }
];

// Actividades momentáneas institucionales inyectadas temporalmente (Solo Lectura)
const ACTIVIDADES_MOMENTANEAS = [
    { dia: 'Martes', periodo: 4, titulo: 'Reunión de Comisión de Evaluación', aula: 'Sala de Juntas' }
];

export default function HorariosCurso() {
    return (
        <div>
            <WeeklyScheduleCalendar 
                scheduleData={ASIGNACIONES_DOCENTE} 
                temporaryActivities={ACTIVIDADES_MOMENTANEAS}
            />
        </div>
    );
}
