import React from 'react';
import '../../styles/StTheme.css';

// ----------------------------------------------------------------------------
// COMPONENTE: TARJETA DE CURSO (VISTA DOCENTE - UA)
// ----------------------------------------------------------------------------
export default function CourseCard({ course, onSelectAction }) {
    const { id, materia_nombre, grado_nombre, seccion_nombre, salon, color_hex, tareas_pendientes = 0 } = course;

    const cardStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--stitch-radius-md)',
        border: '1px solid var(--stitch-border)',
        boxShadow: 'var(--stitch-shadow-lg)',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        height: '255px',
        transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    const headerColorStyle = {
        height: '10px',
        background: `linear-gradient(90deg, ${color_hex || '#3B82F6'} 0%, var(--stitch-secondary) 100%)`
    };

    const contentStyle = {
        padding: '24px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    };

    const subjectStyle = {
        fontSize: '20px',
        fontWeight: '800',
        color: 'var(--stitch-primary)',
        margin: '0 0 6px 0',
        fontFamily: 'Outfit, sans-serif'
    };

    const detailsStyle = {
        fontSize: '13px',
        color: 'var(--stitch-text-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        marginTop: '8px'
    };

    const actionContainerStyle = {
        display: 'flex',
        borderTop: '1px solid var(--stitch-border)',
        height: '52px',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden'
    };

    const actionButtonStyle = {
        flex: 1,
        border: 'none',
        background: 'transparent',
        cursor: 'pointer',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '3px',
        color: 'var(--stitch-text-primary)',
        fontSize: '11px',
        fontWeight: '600',
        transition: 'all 0.2s ease'
    };

    const highlightButtonStyle = {
        ...actionButtonStyle,
        backgroundColor: 'rgba(59, 130, 246, 0.05)',
        color: 'var(--stitch-secondary)',
    };

    const badgeStyle = {
        position: 'absolute',
        top: '16px',
        right: '16px',
        backgroundColor: 'var(--stitch-warning)',
        color: 'var(--stitch-primary)',
        fontSize: '10px',
        fontWeight: 'bold',
        padding: '2px 8px',
        borderRadius: '12px',
        boxShadow: 'var(--stitch-shadow-sm)'
    };

    return (
        <div 
            style={cardStyle} 
            className="stitch-transition"
            onMouseOver={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 12px 24px -5px rgba(13, 44, 84, 0.12)';
            }}
            onMouseOut={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'var(--stitch-shadow-lg)';
            }}
        >
            {/* Cabecera de Color Temático */}
            <div style={headerColorStyle}></div>

            {/* Insignia de Pendientes (si aplica) */}
            {tareas_pendientes > 0 && (
                <div style={badgeStyle}>
                    {tareas_pendientes} por calificar
                </div>
            )}

            {/* Cuerpo de la Tarjeta */}
            <div style={contentStyle}>
                <div>
                    <h3 style={subjectStyle}>{materia_nombre}</h3>
                    <div style={{ fontSize: '14px', fontWeight: '600', color: 'var(--stitch-secondary)', fontFamily: 'Outfit, sans-serif' }}>
                        {grado_nombre} — Sección "{seccion_nombre}"
                    </div>
                </div>

                <div style={detailsStyle}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '18px', color: 'var(--stitch-secondary)' }}>room</span>
                        <span>Salón: <strong>{salon}</strong></span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '18px', color: 'var(--stitch-secondary)' }}>fingerprint</span>
                        <span style={{ fontSize: '11px', letterSpacing: '0.3px' }}>ID CURSO: <strong>CUR-{id}</strong></span>
                    </div>
                </div>
            </div>

            {/* Botonera de Acciones Integrada (3 Botones Obligatorios) */}
            <div style={actionContainerStyle}>
                <button 
                    style={actionButtonStyle} 
                    onClick={() => onSelectAction(id, 'tareas')}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(13, 44, 84, 0.05)'; e.currentTarget.style.color = 'var(--stitch-primary)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--stitch-text-primary)'; }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>assignment</span>
                    <span>Tareas</span>
                </button>

                <div style={{ width: '1px', backgroundColor: 'var(--stitch-border)' }}></div>

                <button 
                    style={actionButtonStyle} 
                    onClick={() => onSelectAction(id, 'notas')}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'rgba(13, 44, 84, 0.05)'; e.currentTarget.style.color = 'var(--stitch-primary)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--stitch-text-primary)'; }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>grade</span>
                    <span>Notas</span>
                </button>

                <div style={{ width: '1px', backgroundColor: 'var(--stitch-border)' }}></div>

                <button 
                    style={highlightButtonStyle} 
                    onClick={() => onSelectAction(id, 'asistencia')}
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = 'var(--stitch-secondary)'; e.currentTarget.style.color = '#FFFFFF'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'rgba(59, 130, 246, 0.05)'; e.currentTarget.style.color = 'var(--stitch-secondary)'; }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>done_all</span>
                    <span style={{ fontWeight: '700' }}>Asistencias</span>
                </button>
            </div>
        </div>
    );
}
