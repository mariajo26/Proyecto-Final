import React, { useState, useEffect } from 'react';
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
    const [alumnos, setAlumnos] = useState(() => {
        const saved = localStorage.getItem('stitch_mis_estudiantes');
        return saved ? JSON.parse(saved) : [
            { id: 1, nombre: 'Ana López', codigo: 'UA-202301', estadoGeneral: 'Sin Registro' },
            { id: 2, nombre: 'Carlos Ruiz', codigo: 'UA-202302', estadoGeneral: 'Presente' },
            { id: 3, nombre: 'Diana Silva', codigo: 'UA-202303', estadoGeneral: 'Preprogramada' }
        ];
    });

    useEffect(() => {
        localStorage.setItem('stitch_mis_estudiantes', JSON.stringify(alumnos));
    }, [alumnos]);
    
    // Estado de la pestaña activa
    const [activeTab, setActiveTab] = useState('listado');
    const [mensaje, setMensaje] = useState('');
    const [viewMode, setViewMode] = useState('grid'); // 'grid' o 'list'

    // Estado del Formulario de Programadas
    const [progStudent, setProgStudent] = useState('');
    const [progStartDate, setProgStartDate] = useState('');
    const [progEndDate, setProgEndDate] = useState('');
    const [progReason, setProgReason] = useState('');

    // Estado del listado de inasistencias prolongadas o permisos registrados
    const [permisos, setPermisos] = useState(() => {
        const saved = localStorage.getItem('stitch_permisos_estudiantes');
        return saved ? JSON.parse(saved) : [
            { id: 1, alumnoId: 3, alumnoNombre: 'Diana Silva', desde: '2026-07-10', hasta: '2026-07-12', motivo: 'Reposo médico por cuadro viral' }
        ];
    });

    useEffect(() => {
        localStorage.setItem('stitch_permisos_estudiantes', JSON.stringify(permisos));
    }, [permisos]);

    // Verificar si es un día nuevo para resetear asistencias generales
    useEffect(() => {
        const todayStr = new Date().toISOString().split('T')[0];
        const lastCheckedDate = localStorage.getItem('stitch_last_attendance_date');
        
        if (lastCheckedDate !== todayStr) {
            setAlumnos(prev => prev.map(a => {
                const tienePermisoActivo = permisos.some(p => 
                    p.alumnoId === a.id && 
                    todayStr >= p.desde && 
                    todayStr <= p.hasta
                );
                return {
                    ...a,
                    estadoGeneral: tienePermisoActivo ? 'Inasistencia Programada' : 'Sin Registro',
                    observacion: ''
                };
            }));
            localStorage.setItem('stitch_last_attendance_date', todayStr);
        }
    }, [permisos]);

    // Lógica para verificar si es hora hábil para asistencia matutina (07:00 a 07:15)
    const esHoraAsistenciaMatutina = () => {
        const ahora = new Date();
        const horaMinuto = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
        return horaMinuto >= '07:00' && horaMinuto <= '07:15';
    };

    const hoyNombreDia = () => {
        const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
        return dias[new Date().getDay()];
    };

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
        
        const alumnoSel = alumnos.find(a => a.id.toString() === progStudent);
        const nuevoPermiso = {
            id: Date.now(),
            alumnoId: parseInt(progStudent, 10),
            alumnoNombre: alumnoSel?.nombre || '',
            desde: progStartDate,
            hasta: progEndDate,
            motivo: progReason
        };

        // Simular actualización local del alumno
        setAlumnos(prev => prev.map(a => 
            a.id.toString() === progStudent ? { ...a, estadoGeneral: 'Inasistencia Programada' } : a
        ));

        setPermisos(prev => [...prev, nuevoPermiso]);

        setMensaje(`Inasistencia programada guardada para el alumno con ID ${progStudent}.`);
        setProgStudent(''); setProgReason(''); setProgStartDate(''); setProgEndDate('');
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
                <h3 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '700', fontSize: '15px' }}>Listado de Estudiantes Asignados</h3>
                <div className="stitch-tabs-container" style={{ marginBottom: 0, border: 'none', padding: '2px' }}>
                    <button 
                        type="button"
                        onClick={() => setViewMode('grid')}
                        className={`stitch-tab-btn ${viewMode === 'grid' ? 'stitch-tab-btn-active' : ''}`}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
                    >
                        <span className="material-icons-outlined" style={{ fontSize: '18px', marginRight: '6px' }}>grid_view</span>
                        Tarjetas
                    </button>
                    <button 
                        type="button"
                        onClick={() => setViewMode('list')}
                        className={`stitch-tab-btn ${viewMode === 'list' ? 'stitch-tab-btn-active' : ''}`}
                        style={{ padding: '6px 12px', fontSize: '12px' }}
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
                            className="stitch-card stitch-tr-hover" 
                            style={{ 
                                padding: '20px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: '16px',
                                background: '#FFFFFF' 
                            }}
                        >
                            <img 
                                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(al.nombre)}&background=0D2C54&color=fff&bold=true&rounded=true&size=48`} 
                                alt={al.nombre}
                                style={{ width: '48px', height: '48px', borderRadius: '50%', border: '2px solid var(--stitch-border)' }}
                            />
                            <div style={{ flex: 1 }}>
                                <div className="stitch-title-font" style={{ fontWeight: '700', fontSize: '15px', color: 'var(--stitch-text-primary)' }}>{al.nombre}</div>
                                <div style={{ color: 'var(--stitch-text-secondary)', fontSize: '12px', marginTop: '2px' }}>Código: {al.codigo}</div>
                                <div className={`stitch-badge ${
                                    al.estadoGeneral === 'Presente' 
                                        ? 'stitch-badge-success' 
                                        : (al.estadoGeneral === 'Preprogramada' ? 'stitch-badge-info' : 'stitch-badge-neutral')
                                }`} style={{ marginTop: '8px', fontSize: '10px' }}>
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
                            className="stitch-card stitch-tr-hover" 
                            style={{ 
                                padding: '12px 20px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'space-between',
                                background: '#FFFFFF' 
                            }}
                        >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                <img 
                                    src={`https://ui-avatars.com/api/?name=${encodeURIComponent(al.nombre)}&background=0D2C54&color=fff&bold=true&rounded=true&size=40`} 
                                    alt={al.nombre}
                                    style={{ width: '40px', height: '40px', borderRadius: '50%', border: '2px solid var(--stitch-border)' }}
                                />
                                <div>
                                    <div className="stitch-title-font" style={{ fontWeight: '700', fontSize: '15px', color: 'var(--stitch-text-primary)' }}>{al.nombre}</div>
                                    <div style={{ color: 'var(--stitch-text-secondary)', fontSize: '12px', marginTop: '2px' }}>Código: {al.codigo}</div>
                                </div>
                            </div>
                            <div className={`stitch-badge ${
                                al.estadoGeneral === 'Presente' 
                                    ? 'stitch-badge-success' 
                                    : (al.estadoGeneral === 'Preprogramada' ? 'stitch-badge-info' : 'stitch-badge-neutral')
                            }`} style={{ fontSize: '11px' }}>
                                {al.estadoGeneral}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderAsistenciaGeneral = () => {
        const esHoraValida = esHoraAsistenciaMatutina() && hoyNombreDia() !== 'Sábado' && hoyNombreDia() !== 'Domingo';

        return (
            <div>
                <h3 className="stitch-title-font" style={{ marginBottom: '8px', color: 'var(--stitch-primary)', fontSize: '16px', fontWeight: '800' }}>Control de Asistencia General (Matutina)</h3>
                <p style={{ color: 'var(--stitch-text-secondary)', fontSize: '14px', marginBottom: '16px' }}>
                    Este registro alimenta la "Asistencia Cruzada" de todos los periodos del día.
                </p>

                {!esHoraValida ? (
                    <div className="stitch-alert stitch-alert-warning" style={{ padding: '16px', display: 'flex', gap: '12px', alignItems: 'center', marginBottom: '20px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '28px', color: '#D97706' }}>lock</span>
                        <div>
                            <strong style={{ display: 'block', fontSize: '14px', marginBottom: '2px', color: '#92400E' }}>Registro Matutino Inactivo</strong>
                            La toma de asistencia general solo se puede habilitar en el bloque inicial de Profesores Guía (de 07:00 a 07:15 AM de Lunes a Viernes). La edición de esta sección está bloqueada en este momento.
                        </div>
                    </div>
                ) : null}

                <div style={{ overflowX: 'auto' }}>
                    <table className="stitch-table">
                        <thead>
                            <tr>
                                <th className="stitch-th">Alumno</th>
                                <th className="stitch-th">Estado Actual</th>
                                <th className="stitch-th">Nueva Asistencia General</th>
                                <th className="stitch-th">Observaciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alumnos.map(al => (
                                <tr key={al.id} className="stitch-tr-hover">
                                    <td className="stitch-td" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
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
                                    <td className="stitch-td" style={{ fontSize: '13px' }}>
                                        <span className={`stitch-badge ${
                                            al.estadoGeneral === 'Presente' 
                                                ? 'stitch-badge-success' 
                                                : (al.estadoGeneral === 'Preprogramada' ? 'stitch-badge-info' : 'stitch-badge-neutral')
                                        }`} style={{ fontSize: '11px' }}>
                                            {al.estadoGeneral}
                                        </span>
                                    </td>
                                    <td className="stitch-td">
                                        <select 
                                            className="stitch-select"
                                            style={{ width: 'auto', display: 'inline-block' }}
                                            value={al.estadoGeneral}
                                            disabled={!esHoraValida}
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
                                    <td className="stitch-td">
                                        <input 
                                            type="text"
                                            className="stitch-input"
                                            value={al.observacion || ''}
                                            disabled={!esHoraValida}
                                            placeholder="Justificación, retraso..."
                                            onChange={(e) => {
                                                const newVal = e.target.value;
                                                setAlumnos(prev => prev.map(p => p.id === al.id ? { ...p, observacion: newVal } : p));
                                            }}
                                            style={{ padding: '6px 10px', fontSize: '12px', width: '90%' }}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div style={{ marginTop: '20px', textAlign: 'right' }}>
                    <button type="button" className="stitch-button" onClick={handleGuardarGeneral} disabled={!esHoraValida}>Guardar Asistencia Matutina</button>
                </div>
            </div>
        );
    };

    const renderProgramadas = () => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            <div style={{ maxWidth: '600px' }}>
                <h3 className="stitch-title-font" style={{ marginBottom: '8px', color: 'var(--stitch-primary)', fontSize: '16px', fontWeight: '800' }}>Registrar Inasistencia Prolongada o Permiso</h3>
                <p style={{ color: 'var(--stitch-text-secondary)', fontSize: '14px', marginBottom: '24px' }}>
                    Si apruebas esta inasistencia, se bloqueará automáticamente a este alumno en las listas de sus profesores de materia para evitar errores cruzados.
                </p>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label className="stitch-label">Estudiante:</label>
                        <select value={progStudent} onChange={e => setProgStudent(e.target.value)} className="stitch-select">
                            <option value="">-- Seleccionar --</option>
                            {alumnos.map(a => <option key={a.id} value={a.id}>{a.nombre}</option>)}
                        </select>
                    </div>

                    <div style={{ display: 'flex', gap: '16px' }}>
                        <div style={{ flex: 1 }}>
                            <label className="stitch-label">Desde:</label>
                            <input type="date" value={progStartDate} onChange={e => setProgStartDate(e.target.value)} className="stitch-input" />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label className="stitch-label">Hasta:</label>
                            <input type="date" value={progEndDate} onChange={e => setProgEndDate(e.target.value)} className="stitch-input" />
                        </div>
                    </div>

                    <div>
                        <label className="stitch-label">Justificación Médica o Administrativa:</label>
                        <textarea 
                            rows="3" 
                            value={progReason} 
                            onChange={e => setProgReason(e.target.value)} 
                            placeholder="Ej: Reposo médico, retiro anticipado, etc." 
                            className="stitch-textarea"
                        />
                    </div>

                    <div style={{ marginTop: '8px' }}>
                        <button type="button" className="stitch-button" onClick={handleGuardarProgramada} style={{ width: '100%', justifyContent: 'center' }}>
                            Programar Bloqueo Preventivo
                        </button>
                    </div>
                </div>
            </div>

            {/* Listado / Registro de Permisos e Inasistencias Activas */}
            <div>
                <h3 className="stitch-title-font" style={{ marginBottom: '12px', color: 'var(--stitch-primary)', fontSize: '15px', fontWeight: '800' }}>Registro de Permisos e Inasistencias Prolongadas Activas</h3>
                {permisos.length === 0 ? (
                    <p style={{ color: 'var(--stitch-text-secondary)', fontSize: '13px', fontStyle: 'italic' }}>No hay permisos o bloqueos prolongados registrados actualmente.</p>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="stitch-table">
                            <thead>
                                <tr>
                                    <th className="stitch-th">Estudiante</th>
                                    <th className="stitch-th">Desde</th>
                                    <th className="stitch-th">Hasta</th>
                                    <th className="stitch-th">Justificación / Motivo</th>
                                    <th className="stitch-th" style={{ textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {permisos.map((p) => (
                                    <tr key={p.id} className="stitch-tr-hover">
                                        <td className="stitch-td" style={{ fontWeight: 'bold', color: 'var(--stitch-text-primary)' }}>{p.alumnoNombre}</td>
                                        <td className="stitch-td" style={{ fontSize: '13px' }}>{p.desde}</td>
                                        <td className="stitch-td" style={{ fontSize: '13px' }}>{p.hasta}</td>
                                        <td className="stitch-td" style={{ fontSize: '13px', color: 'var(--stitch-text-secondary)' }}>{p.motivo}</td>
                                        <td className="stitch-td" style={{ textAlign: 'center' }}>
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    setPermisos(prev => prev.filter(item => item.id !== p.id));
                                                    // Opcional: restaurar el estado general del alumno a Sin Registro
                                                    setAlumnos(prev => prev.map(a => a.id === p.alumnoId ? { ...a, estadoGeneral: 'Sin Registro' } : a));
                                                    setMensaje(`Inasistencia programada removida con éxito.`);
                                                    setTimeout(() => setMensaje(''), 3000);
                                                }} 
                                                className="stitch-button-secondary" 
                                                style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--stitch-danger)' }}
                                            >
                                                Remover
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );

    const renderReporte = () => (
        <div className="print-section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div>
                    <h3 className="stitch-title-font" style={{ color: 'var(--stitch-primary)', margin: 0, fontWeight: '800', fontSize: '18px' }}>Reporte Semanal de Asistencias</h3>
                    <p style={{ color: 'var(--stitch-text-secondary)', fontSize: '14px', marginTop: '4px' }}>Semana del 11 al 15 de Octubre</p>
                </div>
                <button type="button" className="stitch-button hide-on-print" onClick={handleImprimir} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>print</span>
                    Imprimir Reporte
                </button>
            </div>
 
            <div style={{ overflowX: 'auto' }}>
                <table className="stitch-table">
                    <thead>
                        <tr>
                            <th className="stitch-th">Alumno</th>
                            <th className="stitch-th" style={{ textAlign: 'center' }}>Lunes</th>
                            <th className="stitch-th" style={{ textAlign: 'center' }}>Martes</th>
                            <th className="stitch-th" style={{ textAlign: 'center' }}>Miércoles</th>
                            <th className="stitch-th" style={{ textAlign: 'center' }}>Jueves</th>
                            <th className="stitch-th" style={{ textAlign: 'center' }}>Viernes</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alumnos.map(al => (
                            <tr key={al.id} className="stitch-tr-hover">
                                <td className="stitch-td" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                    <img 
                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(al.nombre)}&background=0D2C54&color=fff&bold=true&rounded=true&size=32`} 
                                        alt={al.nombre}
                                        style={{ width: '32px', height: '32px', borderRadius: '50%', border: '1px solid var(--stitch-border)' }}
                                    />
                                    <strong style={{ color: 'var(--stitch-text-primary)' }}>{al.nombre}</strong>
                                </td>
                                <td className="stitch-td" style={{ textAlign: 'center' }}>
                                    <AsistenciaBadge estado="Presente" />
                                </td>
                                <td className="stitch-td" style={{ textAlign: 'center' }}>
                                    <AsistenciaBadge estado="Presente" />
                                </td>
                                <td className="stitch-td" style={{ textAlign: 'center' }}>
                                    <AsistenciaBadge estado={al.estadoGeneral === 'Preprogramada' ? 'Inasistencia Programada' : al.estadoGeneral === 'Presente' ? 'Presente' : 'Falta'} />
                                </td>
                                <td className="stitch-td" style={{ textAlign: 'center' }}>
                                    <AsistenciaBadge estado="Sin Registro" />
                                </td>
                                <td className="stitch-td" style={{ textAlign: 'center' }}>
                                    <AsistenciaBadge estado="Sin Registro" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Leyenda Explicativa de Badges */}
            <div className="hide-on-print stitch-card" style={{ 
                marginTop: '24px', 
                padding: '16px', 
                backgroundColor: '#F8FAFC'
            }}>
                <h4 className="stitch-title-font" style={{ margin: '0 0 12px 0', color: 'var(--stitch-primary)', fontSize: '13px', fontWeight: '800' }}>Leyenda del Reporte Semanal</h4>
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
        <div className="stitch-card" style={{ backgroundColor: '#FFF', padding: '24px' }}>
            <h2 className="stitch-title-font hide-on-print" style={{ color: 'var(--stitch-primary)', fontWeight: '800', marginBottom: '8px', fontSize: '20px' }}>
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
                <div className={`stitch-alert ${mensaje.startsWith('Error') ? 'stitch-alert-danger' : 'stitch-alert-success'}`} style={{ marginBottom: '20px' }}>
                    {mensaje}
                </div>
            )}

            {/* TABS NAVEGACIÓN */}
            <div className="hide-on-print stitch-tabs-container">
                {[
                    { id: 'listado', label: 'Listado de Alumnos' },
                    { id: 'asistencia', label: 'Asistencia Matutina' },
                    { id: 'programadas', label: 'Inasistencias Programadas' },
                    { id: 'reporte', label: 'Reporte Semanal' },
                ].map(tab => (
                    <button 
                        key={tab.id}
                        type="button"
                        onClick={() => setActiveTab(tab.id)}
                        className={`stitch-tab-btn ${activeTab === tab.id ? 'stitch-tab-btn-active' : ''}`}
                        style={{ padding: '10px 16px', fontSize: '14px' }}
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
