import React, { useState } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import esLocale from '@fullcalendar/core/locales/es';
import '../../styles/StTheme.css';

// ----------------------------------------------------------------------------
// COMPONENTE: CALENDARIO ESCOLAR UNIFICADO (VISTA ESTUDIANTE / ENCARGADO)
// ----------------------------------------------------------------------------
export default function UnifiedCalendar({ initialEvents = [], onAddPersonalEvent }) {
    const [events, setEvents] = useState(initialEvents);
    const [showModal, setShowModal] = useState(false);
    const [newEvent, setNewEvent] = useState({ title: '', date: '', color: '#3B82F6' });

    const handleDateClick = (info) => {
        setNewEvent(prev => ({
            ...prev,
            date: info.dateStr
        }));
        setShowModal(true);
    };

    const handleAddEvent = (e) => {
        e.preventDefault();
        if (!newEvent.title || !newEvent.date) return;

        const createdEvent = {
            id: String(Date.now()),
            title: `[Propio] ${newEvent.title}`,
            start: newEvent.date,
            backgroundColor: newEvent.color,
            borderColor: newEvent.color,
            extendedProps: { type: 'Personal' }
        };

        setEvents(prev => [...prev, createdEvent]);
        if (onAddPersonalEvent) {
            onAddPersonalEvent(createdEvent);
        }
        
        setShowModal(false);
        setNewEvent({ title: '', date: '', color: '#3B82F6' });
    };

    // Estilos inline de los componentes interactivos del modal
    const modalOverlayStyle = {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(13, 44, 84, 0.4)', // Fondo de cristal tintado con color primario
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        backdropFilter: 'blur(4px)'
    };

    const modalContentStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--stitch-radius-md)',
        boxShadow: 'var(--stitch-shadow-lg)',
        width: '400px',
        padding: '24px',
        border: '1px solid var(--stitch-border)'
    };

    const formGroupStyle = {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginBottom: '16px'
    };

    const inputStyle = {
        padding: '10px',
        borderRadius: '6px',
        border: '1px solid var(--stitch-border)',
        fontSize: '14px',
        fontFamily: 'var(--stitch-font)'
    };

    return (
        <div style={{ backgroundColor: '#FFFFFF', padding: '20px', borderRadius: 'var(--stitch-radius-md)', border: '1px solid var(--stitch-border)', boxShadow: 'var(--stitch-shadow-md)' }}>
            {/* Cabecera Informativa con Códigos de Color */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '20px', fontSize: '12px', fontWeight: '500' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#0D2C54' }}></div>
                    <span>Horarios de Cursos</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#F59E0B' }}></div>
                    <span>Tareas y Evaluaciones</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#10B981' }}></div>
                    <span>Eventos Escolares Autorizados</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#3B82F6' }}></div>
                    <span>Eventos Propios (Alumno)</span>
                </div>
            </div>

            {/* Calendario de FullCalendar */}
            <FullCalendar
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                locale={esLocale}
                headerToolbar={{
                    left: 'prev,next today',
                    center: 'title',
                    right: 'dayGridMonth,timeGridWeek,timeGridDay'
                }}
                events={events}
                dateClick={handleDateClick}
                height="auto"
                eventTimeFormat={{
                    hour: '2-digit',
                    minute: '2-digit',
                    meridiem: 'short'
                }}
            />

            {/* Modal para Crear Recordatorios/Eventos Propios */}
            {showModal && (
                <div style={modalOverlayStyle}>
                    <div style={modalContentStyle} className="stitch-transition">
                        <h3 style={{ margin: '0 0 16px 0', color: 'var(--stitch-primary)' }}>Crear Recordatorio Personal</h3>
                        <form onSubmit={handleAddEvent}>
                            <div style={formGroupStyle}>
                                <label style={{ fontSize: '13px', fontWeight: '600' }}>Título del Recordatorio</label>
                                <input 
                                    type="text" 
                                    required
                                    placeholder="Ej: Estudiar para Matemática"
                                    value={newEvent.title}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, title: e.target.value }))}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={formGroupStyle}>
                                <label style={{ fontSize: '13px', fontWeight: '600' }}>Fecha</label>
                                <input 
                                    type="date" 
                                    required
                                    value={newEvent.date}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                                    style={inputStyle}
                                />
                            </div>

                            <div style={formGroupStyle}>
                                <label style={{ fontSize: '13px', fontWeight: '600' }}>Color Etiqueta</label>
                                <select 
                                    value={newEvent.color}
                                    onChange={(e) => setNewEvent(prev => ({ ...prev, color: e.target.value }))}
                                    style={inputStyle}
                                >
                                    <option value="#3B82F6">Azul (Estudio)</option>
                                    <option value="#10B981">Verde (Deporte)</option>
                                    <option value="#EF4444">Rojo (Urgente)</option>
                                    <option value="#8B5CF6">Morado (Proyecto)</option>
                                </select>
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '24px' }}>
                                <button 
                                    type="button" 
                                    className="stitch-transition"
                                    style={{
                                        border: 'none',
                                        background: 'transparent',
                                        color: 'var(--stitch-text-secondary)',
                                        cursor: 'pointer',
                                        padding: '10px'
                                    }}
                                    onClick={() => setShowModal(false)}
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="stitch-button">
                                    Guardar Recordatorio
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
