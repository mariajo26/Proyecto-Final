import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import '../styles/StTheme.css';

// ----------------------------------------------------------------------------
// COMPONENTE: CALENDARIO DINÁMICO SEGÚN ROL DE USUARIO (ROLECALENDAR)
// ----------------------------------------------------------------------------
export default function RoleCalendar({ userRole }) {
    // Definición de la data original de eventos con sus metadatos de negocio
    const [rawEvents] = useState([
        { id: '1', title: 'Clase: Matemática I', start: '2026-07-09T07:00:00', end: '2026-07-09T08:30:00', extendedProps: { type: 'Clase' } },
        { id: '2', title: 'Clase: Física Fundamental', start: '2026-07-10T08:45:00', end: '2026-07-10T10:15:00', extendedProps: { type: 'Clase' } },
        { id: '3', title: 'Feria Científica Anual', start: '2026-07-15', allDay: true, extendedProps: { type: 'EventoEscolar' } },
        { id: '4', title: 'Tarea: Laboratorio Vectores', start: '2026-07-05T23:59:00', extendedProps: { type: 'Tarea', state: 'Vencida' } },
        { id: '5', title: 'Tarea: Hoja de Álgebra', start: '2026-07-08T23:59:00', extendedProps: { type: 'Tarea', state: 'Prorroga' } },
        { id: '6', title: 'Circular: Consentimiento Vacunas', start: '2026-07-06', allDay: true, extendedProps: { type: 'Circular', state: 'Firmada' } }
    ]);

    const [events, setEvents] = useState([]);
    const [showReminderModal, setShowReminderModal] = useState(false);
    const [reminderTitle, setReminderTitle] = useState('');
    const [reminderDate, setReminderDate] = useState('');

    // Efecto para mapear dinámicamente los colores y estados según el Rol del usuario
    useEffect(() => {
        const mapped = rawEvents.map(evt => {
            const type = evt.extendedProps.type;
            const state = evt.extendedProps.state;
            let bgColor = '#3B82F6'; // Default color
            let className = '';

            if (userRole === 'Estudiante') {
                switch (type) {
                    case 'Clase':
                        bgColor = '#3B82F6'; // Azul del curso
                        break;
                    case 'EventoEscolar':
                        bgColor = '#10B981'; // Verde escolar
                        break;
                    case 'Personal':
                        bgColor = '#64748B'; // Gris neutro recordatorio
                        break;
                    case 'Tarea':
                        if (state === 'Vencida') {
                            bgColor = '#94A3B8'; // Gris suave no alarmante
                        } else {
                            bgColor = '#3B82F6'; // Azul regular prorroga
                        }
                        break;
                    default:
                        bgColor = '#6366F1';
                }
            } else if (userRole === 'Encargado') {
                switch (type) {
                    case 'Clase':
                        bgColor = '#0D2C54'; // Azul marino institucional
                        break;
                    case 'EventoEscolar':
                        bgColor = '#10B981'; // Verde escolar
                        break;
                    case 'Tarea':
                        if (state === 'Vencida') {
                            bgColor = '#EF4444'; // Rojo Coral llamativo
                            className = 'stitch-pulse-alert'; // Animación de pulso
                        } else if (state === 'Prorroga') {
                            bgColor = '#F59E0B'; // Oro Ámbar advertencia de multa
                        }
                        break;
                    case 'Circular':
                        if (state === 'Firmada') {
                            bgColor = '#10B981'; // Verde de aprobación
                        }
                        break;
                    default:
                        bgColor = '#6366F1';
                }
            }

            return {
                ...evt,
                backgroundColor: bgColor,
                borderColor: bgColor,
                className
            };
        });

        setEvents(mapped);
    }, [userRole, rawEvents]);

    // Permite al Estudiante agregar un recordatorio personal interactivo haciendo clic en un día
    const handleDateClick = (info) => {
        if (userRole !== 'Estudiante') return;
        setReminderDate(info.dateStr);
        setShowReminderModal(true);
    };

    const handleAddReminder = (e) => {
        e.preventDefault();
        if (!reminderTitle || !reminderDate) return;

        const newReminder = {
            id: String(Date.now()),
            title: `[Recordatorio] ${reminderTitle}`,
            start: reminderDate,
            allDay: true,
            extendedProps: { type: 'Personal' }
        };

        // Agregar al estado local
        setEvents(prev => {
            const type = 'Personal';
            const bgColor = '#64748B'; // Slate neutro para estudiante
            return [...prev, {
                ...newReminder,
                backgroundColor: bgColor,
                borderColor: bgColor
            }];
        });

        setShowReminderModal(false);
        setReminderTitle('');
        setReminderDate('');
    };

    return (
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: 'var(--stitch-radius-md)', border: '1px solid var(--stitch-border)', boxShadow: 'var(--stitch-shadow-lg)' }}>
            
            {/* Hoja de estilo en línea para animaciones CSS autocontenidas */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes pulse-alert {
                    0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
                    70% { box-shadow: 0 0 0 6px rgba(239, 68, 68, 0); }
                    100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
                }
                .stitch-pulse-alert {
                    animation: pulse-alert 2s infinite;
                    border: 2px solid #EF4444 !important;
                }
            `}} />

            {/* Encabezado e Indicador de Rol */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '12px' }}>
                <div>
                    <h3 style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '700' }}>Agenda Académica UA</h3>
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--stitch-text-secondary)' }}>
                        {userRole === 'Estudiante' 
                            ? 'Vista de Estudiante: Haz clic en un día del calendario para agregar recordatorios privados.' 
                            : 'Vista de Encargado: Priorización de salud académica con alertas visuales de tareas pendientes.'}
                    </p>
                </div>

            </div>

            {/* Leyenda de Colores */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '20px', fontSize: '13px', backgroundColor: 'var(--stitch-background)', padding: '12px', borderRadius: '8px' }}>
                <span style={{ fontWeight: '600' }}>Leyenda de colores:</span>
                {userRole === 'Estudiante' ? (
                    <>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3B82F6' }}></span>Clases / Tareas Activas</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>Eventos Escolares</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#94A3B8' }}></span>Tareas Pasadas (No Alarma)</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#64748B' }}></span>Recordatorios Propios</span>
                    </>
                ) : (
                    <>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0D2C54' }}></span>Horarios de Clase</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#EF4444' }}></span>Tareas Vencidas (Alerta Roja)</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></span>Prórrogas Habilitadas (Ámbar)</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}><span style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981' }}></span>Circulares Aprobadas</span>
                    </>
                )}
            </div>

            {/* Contenedor FullCalendar */}
            <div className="stitch-transition" style={{ zIndex: 1 }}>
                <FullCalendar
                    plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                    initialView="dayGridMonth"
                    headerToolbar={{
                        left: 'prev,next today',
                        center: 'title',
                        right: 'dayGridMonth,timeGridWeek,timeGridDay'
                    }}
                    locale={esLocale}
                    events={events}
                    dateClick={handleDateClick}
                    height="650px"
                />
            </div>

            {/* Modal para agregar recordatorio (Solo Estudiante) */}
            {showReminderModal && (
                <div style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: 'rgba(13, 44, 84, 0.4)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    zIndex: 2500,
                    backdropFilter: 'blur(3px)'
                }}>
                    <form onSubmit={handleAddReminder} style={{
                        backgroundColor: '#FFFFFF',
                        padding: '24px',
                        borderRadius: '12px',
                        border: '1px solid var(--stitch-border)',
                        width: '380px',
                        boxShadow: 'var(--stitch-shadow-lg)'
                    }}>
                        <h4 style={{ margin: '0 0 16px 0', color: 'var(--stitch-primary)' }}>Crear Recordatorio Personal</h4>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Descripción:</label>
                                <input 
                                    type="text" 
                                    value={reminderTitle}
                                    onChange={(e) => setReminderTitle(e.target.value)}
                                    placeholder="Ej. Estudiar examen física"
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--stitch-border)', boxSizing: 'border-box' }}
                                    required
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '600', marginBottom: '4px' }}>Fecha:</label>
                                <input 
                                    type="date" 
                                    value={reminderDate}
                                    onChange={(e) => setReminderDate(e.target.value)}
                                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--stitch-border)', boxSizing: 'border-box' }}
                                    required
                                />
                            </div>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                            <button 
                                type="button" 
                                onClick={() => setShowReminderModal(false)}
                                style={{ padding: '8px 16px', borderRadius: '6px', border: '1px solid var(--stitch-border)', backgroundColor: '#FFFFFF', cursor: 'pointer' }}
                            >
                                Cancelar
                            </button>
                            <button type="submit" className="stitch-button">
                                Guardar Recordatorio
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </div>
    );
}
