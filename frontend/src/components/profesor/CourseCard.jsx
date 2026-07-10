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
        height: '240px',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
    };

    const headerColorStyle = {
        height: '10px',
        backgroundColor: color_hex || '#3B82F6'
    };

    const contentStyle = {
        padding: '20px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between'
    };

    const subjectStyle = {
        fontSize: '18px',
        fontWeight: 'bold',
        color: 'var(--stitch-primary)',
        margin: '0 0 4px 0'
    };

    const detailsStyle = {
        fontSize: '13px',
        color: 'var(--stitch-text-secondary)',
        display: 'flex',
        flexDirection: 'column',
        gap: '4px',
        marginTop: '8px'
    };

    const actionContainerStyle = {
        display: 'flex',
        borderTop: '1px solid var(--stitch-border)',
        height: '50px',
        backgroundColor: '#F8FAFC'
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
        gap: '2px',
        color: 'var(--stitch-text-primary)',
        fontSize: '11px',
        fontWeight: '500',
        transition: 'background-color 0.2s ease, color 0.2s ease'
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
        <div style={cardStyle} className="stitch-transition">
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
                    <div style={{ fontSize: '14px', fontWeight: '500', color: 'var(--stitch-secondary)' }}>
                        {grado_nombre} - Seccion "{seccion_nombre}"
                    </div>
                </div>

                <div style={detailsStyle}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '16px' }}>room</span>
                        Salón: {salon}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '16px' }}>fingerprint</span>
                        Código de Curso: CUR-{id}
                    </span>
                </div>
            </div>

            {/* Botonera de Acciones Integrada (3 Botones Obligatorios) */}
            <div style={actionContainerStyle}>
                <button 
                    style={actionButtonStyle} 
                    onClick={() => onSelectAction(id, 'tareas')}
                    className="stitch-transition"
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; e.currentTarget.style.color = 'var(--stitch-secondary)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--stitch-text-primary)'; }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>assignment</span>
                    <span>Tareas</span>
                </button>

                <div style={{ width: '1px', backgroundColor: 'var(--stitch-border)' }}></div>

                <button 
                    style={actionButtonStyle} 
                    onClick={() => onSelectAction(id, 'notas')}
                    className="stitch-transition"
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; e.currentTarget.style.color = 'var(--stitch-secondary)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--stitch-text-primary)'; }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>grade</span>
                    <span>Notas</span>
                </button>

                <div style={{ width: '1px', backgroundColor: 'var(--stitch-border)' }}></div>

                <button 
                    style={actionButtonStyle} 
                    onClick={() => onSelectAction(id, 'asistencia')}
                    className="stitch-transition"
                    onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#E2E8F0'; e.currentTarget.style.color = 'var(--stitch-secondary)'; }}
                    onMouseOut={(e) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = 'var(--stitch-text-primary)'; }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>done_all</span>
                    <span>Asistencias</span>
                </button>
            </div>
        </div>
    );
}
