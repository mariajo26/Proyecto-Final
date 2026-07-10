import React, { useState } from 'react';
import '../../styles/StTheme.css';

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
            <h3 style={{ marginBottom: '16px', color: 'var(--stitch-primary)' }}>Listado de Estudiantes Asignados</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                {alumnos.map(al => (
                    <div key={al.id} style={{ border: '1px solid var(--stitch-border)', padding: '16px', borderRadius: '8px', backgroundColor: '#FFF' }}>
                        <div style={{ fontWeight: 'bold', fontSize: '16px' }}>{al.nombre}</div>
                        <div style={{ color: 'var(--stitch-text-secondary)', fontSize: '12px' }}>{al.codigo}</div>
                        <div style={{ marginTop: '12px', fontSize: '12px', fontWeight: '500', color: al.estadoGeneral === 'Presente' ? '#10B981' : '#64748B' }}>
                            Estado actual: {al.estadoGeneral}
                        </div>
                    </div>
                ))}
            </div>
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
                        <th style={{ padding: '12px', borderBottom: '2px solid var(--stitch-border)', textAlign: 'left', backgroundColor: '#F8FAFC' }}>Alumno</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid var(--stitch-border)', textAlign: 'left', backgroundColor: '#F8FAFC' }}>Estado Actual</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid var(--stitch-border)', textAlign: 'left', backgroundColor: '#F8FAFC' }}>Nueva Asistencia General</th>
                    </tr>
                </thead>
                <tbody>
                    {alumnos.map(al => (
                        <tr key={al.id}>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)' }}>
                                <strong>{al.nombre}</strong><br/>
                                <span style={{ fontSize: '11px', color: '#64748B' }}>{al.codigo}</span>
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)', fontSize: '13px' }}>{al.estadoGeneral}</td>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)' }}>
                                <select 
                                    style={{ padding: '6px 12px', borderRadius: '4px', border: '1px solid #CBD5E1' }}
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
                    <h3 style={{ color: 'var(--stitch-primary)' }}>Reporte Semanal de Asistencias</h3>
                    <p style={{ color: 'var(--stitch-text-secondary)', fontSize: '14px' }}>Semana del 11 al 15 de Octubre</p>
                </div>
                <button className="stitch-button hide-on-print" onClick={handleImprimir} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>print</span>
                    Imprimir Reporte
                </button>
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid var(--stitch-border)' }}>
                <thead>
                    <tr>
                        <th style={{ padding: '12px', borderBottom: '2px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'left', backgroundColor: '#F8FAFC' }}>Alumno</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center', backgroundColor: '#F8FAFC' }}>Lunes</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center', backgroundColor: '#F8FAFC' }}>Martes</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center', backgroundColor: '#F8FAFC' }}>Miércoles</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center', backgroundColor: '#F8FAFC' }}>Jueves</th>
                        <th style={{ padding: '12px', borderBottom: '2px solid var(--stitch-border)', textAlign: 'center', backgroundColor: '#F8FAFC' }}>Viernes</th>
                    </tr>
                </thead>
                <tbody>
                    {alumnos.map(al => (
                        <tr key={al.id}>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)' }}>
                                <strong>{al.nombre}</strong>
                            </td>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center', color: '#10B981' }}>P</td>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center', color: '#10B981' }}>P</td>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center', color: al.estadoGeneral === 'Presente' ? '#10B981' : '#EF4444' }}>{al.estadoGeneral === 'Presente' ? 'P' : 'F'}</td>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)', borderRight: '1px solid var(--stitch-border)', textAlign: 'center', color: '#94A3B8' }}>-</td>
                            <td style={{ padding: '12px', borderBottom: '1px solid var(--stitch-border)', textAlign: 'center', color: '#94A3B8' }}>-</td>
                        </tr>
                    ))}
                </tbody>
            </table>

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
