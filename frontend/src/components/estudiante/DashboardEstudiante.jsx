import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import WeeklyScheduleCalendar from '../WeeklyScheduleCalendar';
import '../../styles/StTheme.css';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
const BLOQUES = [
    { num: 1, hora: '07:00 - 07:50' },
    { num: 2, hora: '07:50 - 08:40' },
    { num: 3, hora: '08:40 - 09:30' },
    { num: 'R', hora: '09:30 - 09:50', label: 'RECREO' },
    { num: 4, hora: '09:50 - 10:40' },
    { num: 5, hora: '10:40 - 11:30' },
    { num: 6, hora: '11:30 - 12:20' }
];

export default function DashboardEstudiante() {
    const { token, usuario } = useAuth();
    const [mostrarHorarios, setMostrarHorarios] = useState(false);
    const [horarioClases, setHorarioClases] = useState([]);
    const [loadingHorario, setLoadingHorario] = useState(false);

    // Cargar horario de clases
    const fetchHorario = useCallback(async () => {
        setLoadingHorario(true);
        try {
            const res = await fetch('/api/estudiante/horarios', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar horarios.');
            const data = await res.json();
            setHorarioClases(data);
        } catch (err) {
            // Fallback de demostración
            setHorarioClases([
                { dia_semana: 'Lunes', hora_inicio: '07:00', materia: 'Matemáticas', salon: 'Aula 101' },
                { dia_semana: 'Lunes', hora_inicio: '08:40', materia: 'Idioma Español', salon: 'Aula 102' },
                { dia_semana: 'Martes', hora_inicio: '07:50', materia: 'Ciencias Naturales', salon: 'Laboratorio A' },
                { dia_semana: 'Miercoles', hora_inicio: '07:00', materia: 'Matemáticas', salon: 'Aula 101' },
                { dia_semana: 'Jueves', hora_inicio: '10:40', materia: 'Idioma Español', salon: 'Aula 102' },
                { dia_semana: 'Viernes', hora_inicio: '11:30', materia: 'Ciencias Naturales', salon: 'Laboratorio A' }
            ]);
        } finally {
            setLoadingHorario(false);
        }
    }, [token]);

    useEffect(() => {
        if (mostrarHorarios) {
            fetchHorario();
        }
    }, [mostrarHorarios, fetchHorario]);

    // Buscar si hay clase asignada a un bloque y día específico
    const getClaseEnPeriodo = (dia, horaInicio) => {
        return horarioClases.find(c => {
            const matchDia = c.dia_semana.toLowerCase() === dia.toLowerCase();
            const matchHora = c.hora_inicio.substring(0, 5) === horaInicio.substring(0, 5);
            return matchDia && matchHora;
        });
    };

    return (
        <div style={{ fontFamily: 'var(--stitch-font, sans-serif)', color: 'var(--stitch-text-primary, #0F172A)' }}>
            <div style={{ backgroundColor: '#FFFFFF', padding: '32px', borderRadius: '12px', border: '1px solid var(--stitch-border)', boxShadow: 'var(--stitch-shadow-sm)', marginBottom: '24px' }}>
                <h2 style={{ color: 'var(--stitch-primary, #0D2C54)', fontWeight: '700', margin: '0 0 8px 0' }}>¡Bienvenido, {usuario?.nombre || 'Estudiante'}!</h2>
                <p style={{ color: 'var(--stitch-text-secondary, #64748B)', margin: '0 0 24px 0', fontSize: '15px' }}>
                    Consulta tus tareas pendientes, calificaciones e interactúa con tus foros desde el menú lateral.
                </p>

                <button 
                    onClick={() => setMostrarHorarios(!mostrarHorarios)}
                    className="stitch-button"
                    style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                >
                    <span className="material-icons-outlined">{mostrarHorarios ? 'grid_off' : 'calendar_today'}</span>
                    <span>{mostrarHorarios ? 'Ocultar Horario Semanal' : 'Ver Horario Semanal'}</span>
                </button>
            </div>

            {mostrarHorarios && (
                <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '12px', border: '1px solid var(--stitch-border)', boxShadow: 'var(--stitch-shadow-md)' }} className="stitch-transition">
                    {loadingHorario ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '32px', color: 'var(--stitch-secondary)', animation: 'spin 1.5s linear infinite' }}>sync</span>
                        </div>
                    ) : (() => {
                        const mappedClases = horarioClases.map(c => {
                            const h = c.hora_inicio.substring(0, 5);
                            let periodo = 1;
                            if (h === '07:05' || h === '07:00') periodo = 1;
                            else if (h === '07:55' || h === '07:50') periodo = 2;
                            else if (h === '08:45' || h === '08:40') periodo = 3;
                            else if (h === '10:15' || h === '09:50') periodo = 4;
                            else if (h === '11:05' || h === '10:40') periodo = 5;
                            else if (h === '11:55' || h === '11:30') periodo = 6;
                            return {
                                dia: c.dia_semana === 'Miercoles' ? 'Miércoles' : c.dia_semana,
                                periodo,
                                materia: c.materia,
                                grado: usuario?.grado || 'Grado Escolar',
                                aula: c.salon
                            };
                        });
                        return (
                            <WeeklyScheduleCalendar
                                scheduleData={mappedClases}
                                title="Mi Horario de Clases"
                            />
                        );
                    })()}
                </div>
            )}
        </div>
    );
}
