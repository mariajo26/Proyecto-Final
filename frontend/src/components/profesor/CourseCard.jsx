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

    const actionContainerStyle = {
        display: 'flex',
        borderTop: '1px solid var(--stitch-border)',
        height: '56px',
        backgroundColor: '#F8FAFC',
        overflow: 'hidden'
    };

    return (
        <div
            style={cardStyle}
            className="stitch-card"
        >
            {/* Cabecera de Color Temático */}
            <div style={headerColorStyle}></div>

            {/* Insignia de Pendientes (si aplica) */}
            {tareas_pendientes > 0 && (
                <div 
                    className="stitch-badge stitch-badge-warning" 
                    style={{
                        position: 'absolute',
                        top: '16px',
                        right: '16px',
                        boxShadow: 'var(--stitch-shadow-sm)'
                    }}
                >
                    {tareas_pendientes} por calificar
                </div>
            )}

            {/* Cuerpo de la Tarjeta */}
            <div style={contentStyle}>
                <div>
                    <h3 className="stitch-title-font" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--stitch-primary)', margin: '0 0 6px 0' }}>
                        {materia_nombre}
                    </h3>
                    <div className="stitch-title-font" style={{ fontSize: '14px', fontWeight: '600', color: 'var(--stitch-secondary)' }}>
                        {grado_nombre} — Sección "{seccion_nombre}"
                    </div>
                </div>

                <div style={{ fontSize: '13px', color: 'var(--stitch-text-secondary)', display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '8px' }}>
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
                    className="stitch-card-action-btn"
                    onClick={() => onSelectAction(id, 'tareas')}
                >
                    <span className="material-icons-outlined">assignment</span>
                    <span>Tareas</span>
                </button>

                <div style={{ width: '1px', backgroundColor: 'var(--stitch-border)' }}></div>

                <button
                    className="stitch-card-action-btn"
                    onClick={() => onSelectAction(id, 'notas')}
                >
                    <span className="material-icons-outlined">grade</span>
                    <span>Notas</span>
                </button>

                <div style={{ width: '1px', backgroundColor: 'var(--stitch-border)' }}></div>

                <button
                    className="stitch-card-action-btn"
                    onClick={() => onSelectAction(id, 'asistencia')}
                >
                    <span className="material-icons-outlined">done_all</span>
                    <span>Asistencias</span>
                </button>
            </div>
        </div>
    );
}
