import React, { useState } from 'react';
import '../../styles/StTheme.css';

// Componente para Badges de Asistencia Premium al estilo Stitch UI
function AsistenciaBadge({ estado }) {
    let label = '-';
    let bgColor = '#F1F5F9';
    let textColor = '#64748B';
    let borderColor = '#E2E8F0';
    let icon = null;

    if (estado === 'Presente' || estado === 'P') {
        label = 'Presente';
        bgColor = 'rgba(16, 185, 129, 0.08)';
        textColor = '#059669';
        borderColor = 'rgba(16, 185, 129, 0.2)';
        icon = 'check_circle';
    } else if (estado === 'No Asistió' || estado === 'Ausente' || estado === 'F' || estado === 'Falta') {
        label = 'Falta';
        bgColor = 'rgba(239, 68, 68, 0.08)';
        textColor = '#DC2626';
        borderColor = 'rgba(239, 68, 68, 0.2)';
        icon = 'cancel';
    } else if (estado === 'Llegada Tarde' || estado === 'T' || estado === 'Tarde') {
        label = 'Tarde';
        bgColor = 'rgba(245, 158, 11, 0.08)';
        textColor = '#D97706';
        borderColor = 'rgba(245, 158, 11, 0.2)';
        icon = 'schedule';
    } else if (estado === 'Inasistencia Programada' || estado === 'Preprogramada') {
        label = 'Permiso';
        bgColor = 'rgba(99, 102, 241, 0.08)';
        textColor = '#4F46E5';
        borderColor = 'rgba(99, 102, 241, 0.2)';
        icon = 'event_busy';
    }

    if (label === '-') {
        return <span style={{ color: '#94A3B8', fontWeight: '500' }}>-</span>;
    }

    return (
        <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '5px 12px',
            borderRadius: '20px',
            backgroundColor: bgColor,
            color: textColor,
            border: `1.5px solid ${borderColor}`,
            fontSize: '12px',
            fontWeight: '600',
            boxShadow: 'var(--stitch-shadow-sm)',
            justifyContent: 'center',
            width: 'fit-content'
        }}>
            <span className="material-icons-outlined" style={{ fontSize: '15px', color: 'inherit' }}>
                {icon}
            </span>
            <span style={{ fontSize: '11px', fontWeight: '700' }}>{label}</span>
        </div>
    );
}

export default function MisEstudiantes() {
    // -------------------------------------------------------------------------
    // MOCK DATA (Para simular la carga desde el backend)
    // -------------------------------------------------------------------------
    const [alumnos, setAlumnos] = useState([
        { id: 1, nombre: 'Ana López', codigo: 'UA-202301', estadoGeneral: 'Sin Registro' },
        { id: 2, nombre: 'Carlos Ruiz', codigo: 'UA-202302', estadoGeneral: 'Presente' },
        { id: 3, nombre: 'Diana Silva', codigo: 'UA-202303', estadoGeneral: 'Preprogramada' }
    ]);
    
    // Estado de la pestaña activa
    const [activeTab, setActiveTab] = useState('listado');
    const [mensaje, setMensaje] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'list'

    // Estado del Formulario de Programadas
    const [progStudent, setProgStudent] = useState('');
    const [progStartDate, setProgStartDate] = useState('');
    const [progEndDate, setProgEndDate] = useState('');
    const [progReason, setProgReason] = useState('');

    // -------------------------------------------------------------------------
    // MANEJADORES DE ESTADO SIMULADOS
    // -------------------------------------------------------------------------
    
    // Guardar Asistencia General (Matutina)
    const handleGuardarGeneral = () => {
        setMensaje("Asistencia general guardada exitosamente. Los profesores de materia ya pueden ver los estados actualizados.");
        // Aquí iría el fetch a POST /api/asistencias/general
        setTimeout(() => setMensaje(''), 4000);
    };

    // Guardar Inasistencia Programada
    const handleGuardarProgramada = () => {
        if (!progStudent || !progReason || !progStartDate || !progEndDate) {
            setMensaje("Error: Todos los campos son obligatorios.");
            return;
        }
        
        // Simular actualización local del alumno
        setAlumnos(prev => prev.map(a => 
            a.id.toString() === progStudent ? { ...a, estadoGeneral: 'Inasistencia Programada' } : a
        ));

        setMensaje(`Inasistencia programada guardada para el alumno con ID ${progStudent}.`);
        setProgStudent(''); setProgReason(''); setProgStartDate(''); setProgEndDate('');
        // Aquí iría el fetch a POST /api/asistencias/programadas
        setTimeout(() => setMensaje(''), 4000);
    };

    const handleImprimir = () => {
        window.print();
    };

    // -------------------------------------------------------------------------
    // RENDER: Pestañas Internas
    // -------------------------------------------------------------------------
    
    const renderListado = () => (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '700' }}>Listado de Estudiantes Asignados</h3>
                <div style={{ 
                    display: 'flex', 
                    gap: '4px', 
                    backgroundColor: '#F1F5F9', 
                    padding: '4px', 
                    borderRadius: '10px', 
                    border: '1px solid var(--stitch-border)' 
                }}>
                    <button 
                        onClick={() => setViewMode('grid')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: viewMode === 'grid' ? '#FFFFFF' : 'transparent',
                            color: viewMode === 'grid' ? 'var(--stitch-primary)' : 'var(--stitch-text-secondary)',
                            fontWeight: '600',
                            fontSize: '13px',
                            boxShadow: viewMode === 'grid' ? 'var(--stitch-shadow-sm)' : 'none',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span className="material-icons-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>grid_view</span>
                        Tarjetas
                    </button>
                    <button 
                        onClick={() => setViewMode('list')}
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '6px 12px',
                            border: 'none',
                            borderRadius: '8px',
                            cursor: 'pointer',
                            backgroundColor: viewMode === 'list' ? '#FFFFFF' : 'transparent',
                            color: viewMode === 'list' ? 'var(--stitch-primary)' : 'var(--stitch-text-secondary)',
                            fontWeight: '600',
                            fontSize: '13px',
                            boxShadow: viewMode === 'list' ? 'var(--stitch-shadow-sm)' : 'none',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        <span className="material-icons-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>view_list</span>
                        Lista
                    </button>
                </div>
            </div>

            {viewMode === 'grid' ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {alumnos.map(al => (
                        <div 
                            key={al.id} 
                            className="stitch-card stitch-transition" 
                            style={{ 
                                padding: '20px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '16px',
                                background: 'var(--stitch-surface)' 
                            }}
                        >
                            <img 
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(al.nombre)}&background=0D2C54&color=fff&bold=true&rounded=true&size=48`} 
                                alt={al.nombre}
                                style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--stitch-border)' }}
                            />
                            <div style={{ flex: 1 }}>
                                <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--stitch-text-primary)' }}>{al.nombre}</div>
                                <div style={{ color: 'var(--stitch-text-secondary)', fontSize: '12px', marginTop: '2px' }}>Código: {al.codigo}</div>
                                <div style={{ 
                                    marginTop: '8px', 
                                    fontSize: '11px', 
                                    fontWeight: '600', 
                                    display: 'inline-block',
                                    padding: '2px 8px',
                                    borderRadius: '12px',
                                    backgroundColor: al.estadoGeneral === 'Presente' ? 'rgba(16, 185, 129, 0.1)' : al.estadoGeneral === 'Preprogramada' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                    color: al.estadoGeneral === 'Presente' ? '#059669' : al.estadoGeneral === 'Preprogramada' ? '#4F46E5' : '#475569'
                                }}>
                                    {al.estadoGeneral}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {alumnos.map(al => (
                        <div 
                            key={al.id} 
                            className="stitch-card stitch-transition" 
                            style={{ 
                                padding: '12px 20px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                background: 'var(--stitch-surface)' 
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <img 
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(al.nombre)}&background=0D2C54&color=fff&bold=true&rounded=true&size=40`} 
                                    alt={al.nombre}
                                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--stitch-border)' }}
                                />
                                <div>
                                    <div style={{ fontWeight: '700', fontSize: '16px', color: 'var(--stitch-text-primary)' }}>{al.nombre}</div>
                                    <div style={{ color: 'var(--stitch-text-secondary)', fontSize: '12px', marginTop: '2px' }}>Código: {al.codigo}</div>
                                </div>
                            </div>
                            <div style={{ 
                                fontSize: '12px', 
                                fontWeight: '600', 
                                padding: '4px 10px',
                                borderRadius: '12px',
                                backgroundColor: al.estadoGeneral === 'Presente' ? 'rgba(16, 185, 129, 0.1)' : al.estadoGeneral === 'Preprogramada' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                color: al.estadoGeneral === 'Presente' ? '#059669' : al.estadoGeneral === 'Preprogramada' ? '#4F46E5' : '#475569'
                            }}>
                                {al.estadoGeneral}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderAsistenciaGeneral = () => (
        <div>
            <h3 style={{ marginBottom: '8px', color: 'var(--stitch-primary)' }}>Control de Asistencia General (Matutina)</h3>
            <p style={{ color: 'var(--stitch-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                Este registro alimenta la "Asistencia Cruzada" de todos los periodos del día.
            </p>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '12px', borderBottom: '2px solid var(--stitch-border)', textAlign: 'left', backgroundColor: '#F8FAFC', color: 'var(--stitch-primary)', fontWeight: '600' }}>Alumno</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid var(--stitch-border)', textAlign: 'left', backgroundColor: '#F8FAFC', color: 'var(--stitch-primary)', fontWeight: '600' }}>Estado Actual</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid var(--stitch-border)', textAlign: 'left', backgroundColor: '#F8FAFC', color: 'var(--stitch-primary)', fontWeight: '600' }}>Nueva Asistencia General</th>
                    </tr>
                </thead>
                <tbody>
                    {alumnos.map(al => (
                        <tr key={al.id}>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img 
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(al.nombre)}&background=0D2C54&color=fff&bold=true&rounded=true&size=36`} 
                                    alt={al.nombre}
                                    style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--stitch-border)' }}
                                />
                                <div>
                                    <strong style={{ color: 'var(--stitch-text-primary)' }}>{al.nombre}</strong><br/>
                                    <span style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)' }}>{al.codigo}</span>
                                </div>
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)', fontSize: '13px' }}>
                                <span style={{ 
                                    fontSize: '11px', 
                                    fontWeight: '600', 
                                    padding: '4px 10px',
                                    borderRadius: '12px',
                                    backgroundColor: al.estadoGeneral === 'Presente' ? 'rgba(16, 185, 129, 0.1)' : al.estadoGeneral === 'Preprogramada' ? 'rgba(99, 102, 241, 0.1)' : 'rgba(100, 116, 139, 0.1)',
                                    color: al.estadoGeneral === 'Presente' ? '#059669' : al.estadoGeneral === 'Preprogramada' ? '#4F46E5' : '#475569'
                                }}>
                                    {al.estadoGeneral}
                                </span>
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)' }}>
                                <select 
                                    style={{ 
                                        padding: '8px 12px', 
                                        borderRadius: '8px', 
                                        border: '1px solid var(--stitch-border)',
                                        color: 'var(--stitch-text-primary)',
                                        fontWeight: '500',
                                        fontSize: '13px',
                                        backgroundColor: '#FFFFFF',
                                        cursor: 'pointer',
                                        outline: 'none'
                                    }}
                                    value={al.estadoGeneral}
                                    onChange={(e) => {
                                        const newVal = e.target.value;
                                        setAlumnos(prev => prev.map(p => p.id === al.id ? { ...p, estadoGeneral: newVal } : p));
                                    }}
                                >
                                    <option value="Sin Registro">Sin Registro</option>
                                    <option value="Presente">Presente</option>
                                    <option value="No Asistió">Ausente (Injustificado)</option>
                                </select>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            <div style={{ marginTop: '20px', textAlign: 'right' }}>
                <button className="stitch-button" onClick={handleGuardarGeneral}>Guardar Asistencia Matutina</button>
            </div>
        </div>
    );

    const renderProgramadas = () => (
        <div style={{ maxWidth: '600px' }}>
            <h3 style={{ marginBottom: '8px', color: 'var(--stitch-primary)' }}>Registrar Inasistencia Prolongada o Permiso</h3>
            <p style={{ color: 'var(--stitch-text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                Si apruebas esta inasistencia, se bloqueará automáticamente a este alumno en las listas de sus profesores de materia para evitar errores cruzados.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Estudiante:</label>
                    <select value={progStudent} onChange={e => setProgStudent(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
                        <option value="">-- Seleccionar --</option>
                        {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                    </select>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Desde:</label>
                        <input type="date" value={progStartDate} onChange={e => setProgStartDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
                    </div>
                    <div style={{ flex: 1 }}>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Hasta:</label>
                        <input type="date" value={progEndDate} onChange={e => setProgEndDate(e.target.value)} style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }} />
                    </div>
                </div>

                <div>
                    <label style={{ display: 'block', fontSize: '13px', fontWeight: 'bold', marginBottom: '6px' }}>Justificación Médica o Administrativa:</label>
                    <textarea 
                        rows="3" 
                        value={progReason} 
                        onChange={e => setProgReason(e.target.value)} 
                        placeholder="Ej: Reposo médico, retiro anticipado, etc." 
                        style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                    />
                </div>

                <div style={{ marginTop: '8px' }}>
                    <button className="stitch-button" onClick={handleGuardarProgramada} style={{ width: '100%' }}>
                        Programar Bloqueo Preventivo
                    </button>
                </div>
            </div>
        </div>
    );

    const renderReporte = () => (
        <div className="print-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h3 style={{ color: 'var(--stitch-primary)', margin: 0, fontWeight: '700' }}>Reporte Semanal de Asistencias</h3>
                    <p style={{ color: 'var(--stitch-text-secondary)', fontSize: '14px', marginTop: '4px' }}>Semana del 11 al 15 de Octubre</p>
                </div>
                <button className="stitch-button hide-on-print" onClick={handleImprimir} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>print</span>
                    Imprimir Reporte
                </button>
            </div>
 
            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--stitch-border)', borderRadius: '8px', overflow: 'hidden' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '12px 16px', borderBottom: '2px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'left', backgroundColor: '#F8FAFC', color: 'var(--stitch-primary)', fontWeight: '600' }}>Alumno</th>
                        <th style={{ padding: '12px 16px', borderBottom: '2px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center', backgroundColor: '#F8FAFC', color: 'var(--stitch-primary)', fontWeight: '600' }}>Lunes</th>
                        <th style={{ padding: '12px 16px', borderBottom: '2px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center', backgroundColor: '#F8FAFC', color: 'var(--stitch-primary)', fontWeight: '600' }}>Martes</th>
                        <th style={{ padding: '12px 16px', borderBottom: '2px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center', backgroundColor: '#F8FAFC', color: 'var(--stitch-primary)', fontWeight: '600' }}>Miércoles</th>
                        <th style={{ padding: '12px 16px', borderBottom: '2px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center', backgroundColor: '#F8FAFC', color: 'var(--stitch-primary)', fontWeight: '600' }}>Jueves</th>
                        <th style={{ padding: '12px 16px', borderBottom: '2px solid var(--stitch-border)', textAlign: 'center', backgroundColor: '#F8FAFC', color: 'var(--stitch-primary)', fontWeight: '600' }}>Viernes</th>
                    </tr>
                </thead>
                <tbody>
                    {alumnos.map(al => (
                        <tr key={al.id}>
                            <td style={{ padding: '12px 16px', borderBottom: '1px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <img 
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(al.nombre)}&background=0D2C54&color=fff&bold=true&rounded=true&size=32`} 
                                    alt={al.nombre}
                                    style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--stitch-border)' }}
                                />
                                <strong style={{ color: 'var(--stitch-text-primary)' }}>{al.nombre}</strong>
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center' }}>
                                <AsistenciaBadge estado="Presente" />
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center' }}>
                                <AsistenciaBadge estado="Presente" />
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center' }}>
                                <AsistenciaBadge estado={al.estadoGeneral === 'Preprogramada' ? 'Inasistencia Programada' : al.estadoGeneral === 'Presente' ? 'Presente' : 'Falta'} />
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center' }}>
                                <AsistenciaBadge estado="Sin Registro" />
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)', textAlign: 'center' }}>
                                <AsistenciaBadge estado="Sin Registro" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* Leyenda Explicativa de Badges */}
            <div className="hide-on-print" style={{ 
                marginTop: '24px', 
                padding: '16px', 
                backgroundColor: 'var(--stitch-background)', 
                borderRadius: '8px', 
                border: '1px solid var(--stitch-border)' 
            }}>
                <h4 style={{ margin: '0 0 12px 0', color: 'var(--stitch-primary)', fontSize: '13px', fontWeight: '700' }}>Leyenda del Reporte Semanal</h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AsistenciaBadge estado="Presente" />
                        <span style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)' }}>Asistió a clases</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AsistenciaBadge estado="Falta" />
                        <span style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)' }}>Inasistencia (Injustificada)</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AsistenciaBadge estado="Tarde" />
                        <span style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)' }}>Llegada tarde a período</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <AsistenciaBadge estado="Preprogramada" />
                        <span style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)' }}>Permiso programado o médico</span>
                    </div>
                </div>
            </div>
 
            <div className="show-on-print-only" style={{ display: 'none', marginTop: '40px', textAlign: 'center' }}>
                <p>____________________________________</p>
                <p style={{ fontSize: '14px', color: '#64748B' }}>Firma del Profesor Guía</p>
            </div>
        </div>
    );

    return (
        <div style={{ backgroundColor: '#FFF', borderRadius: '12px', border: '1px solid var(--stitch-border)', padding: '24px' }}>
            <h2 style={{ color: 'var(--stitch-primary)', fontWeight: '700', marginBottom: '8px' }} className="hide-on-print">
                Módulo Profesor Guía: Mis Estudiantes
            </h2>
            <p style={{ color: 'var(--stitch-text-secondary)', fontSize: '14px', marginBottom: '24px' }} className="hide-on-print">
                Gestiona la asistencia cruzada matutina, autoriza permisos y genera reportes de tu grado asignado.
            </p>

            {/* Inyección de estilos de impresión */}
            <style>
                {`
                @media print {
                    body * {
                        visibility: hidden;
                    }
                    .print-section, .print-section * {
                        visibility: visible;
                    }
                    .print-section {
                        position: absolute;
                        left: 0;
                        top: 0;
                        width: 100%;
                    }
                    .hide-on-print {
                        display: none !important;
                    }
                    .show-on-print-only {
                        display: block !important;
                    }
                }
                `}
            </style>

            {mensaje && (
                <div style={{ padding: '12px 16px', borderRadius: '8px', marginBottom: '20px', backgroundColor: mensaje.startsWith('Error') ? '#FEE2E2' : '#D1FAE5', color: mensaje.startsWith('Error') ? '#991B1B' : '#065F46', fontWeight: '500', fontSize: '14px' }}>
                    {mensaje}
                </div>
            )}

            {/* TABS NAVEGACIÓN */}
            <div className="hide-on-print" style={{ display: 'flex', gap: '8px', borderBottom: '2px solid #E2E8F0', marginBottom: '24px' }}>
                {[
                    { id: 'listado', label: 'Listado de Alumnos' },
                    { id: 'asistencia', label: 'Asistencia Matutina' },
                    { id: 'programadas', label: 'Inasistencias Programadas' },
                    { id: 'reporte', label: 'Reporte Semanal' },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        style={{
                            padding: '10px 16px',
                            border: 'none',
                            backgroundColor: 'transparent',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '14px',
                            color: activeTab === tab.id ? 'var(--stitch-primary)' : '#64748B',
                            borderBottom: activeTab === tab.id ? '3px solid var(--stitch-primary)' : '3px solid transparent',
                            marginBottom: '-2px',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* CONTENIDO TABS */}
            <div>
                {activeTab === 'listado' && renderListado()}
                {activeTab === 'asistencia' && renderAsistenciaGeneral()}
                {activeTab === 'programadas' && renderProgramadas()}
                {activeTab === 'reporte' && renderReporte()}
            </div>
        </div>
    );
}
