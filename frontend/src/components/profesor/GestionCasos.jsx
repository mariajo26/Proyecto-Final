import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

// ============================================================================
// DATOS DEMO: ALUMNOS DEL DOCENTE PARA EL BUSCADOR
// ============================================================================
const ESTUDIANTES_DOCENTE = [
    { id: 101, nombre: 'Carlos Eduardo Méndez', codigo: 'UA-26501', grado: '4to Bachillerato', seccion: 'A' },
    { id: 102, nombre: 'María José Flores', codigo: 'UA-26502', grado: '4to Bachillerato', seccion: 'A' },
    { id: 103, nombre: 'Sofía Isabel Castro', codigo: 'UA-26505', grado: '5to Bachillerato', seccion: 'B' },
    { id: 104, nombre: 'Diego Alejandro Ortiz', codigo: 'UA-26508', grado: '5to Bachillerato', seccion: 'B' }
];

// ============================================================================
// DATOS DEMO: SOLICITUDES DE INASISTENCIA (JUSTIFICACIONES)
// ============================================================================
const JUSTIFICACIONES_DEMO = [
    {
        id: 1,
        alumno: 'Carlos Eduardo Méndez',
        codigo: 'UA-26501',
        grado: '4to Bachillerato A',
        fechaInasistencia: '2026-07-08',
        motivo: 'Cita médica odontológica programada por tratamiento de brackets.',
        comprobante: 'comprobante_dental_carlos.pdf',
        estado: 'Pendiente',
        motivoRechazo: ''
    },
    {
        id: 2,
        alumno: 'María José Flores',
        codigo: 'UA-26502',
        grado: '4to Bachillerato A',
        fechaInasistencia: '2026-07-06',
        motivo: 'Fiebre alta y malestar estomacal severo.',
        comprobante: 'receta_clinica_maria.pdf',
        estado: 'Aprobado',
        motivoRechazo: ''
    },
    {
        id: 3,
        alumno: 'Sofía Isabel Castro',
        codigo: 'UA-26505',
        grado: '5to Bachillerato B',
        fechaInasistencia: '2026-07-05',
        motivo: 'Viaje familiar imprevisto de fin de semana largo.',
        comprobante: 'carta_encargado_sofia.pdf',
        estado: 'Rechazado',
        motivoRechazo: 'Los viajes familiares en días escolares no se consideran causas justificables según el reglamento interno de la institución.'
    }
];

// ============================================================================
// DATOS DEMO: BITÁCORA DE INCIDENTES HISTÓRICOS
// ============================================================================
const INCIDENTES_DEMO = [
    {
        id: 1,
        alumno: 'Diego Alejandro Ortiz',
        codigo: 'UA-26508',
        clasificacion: 'Problema de Conducta',
        descripcion: 'El alumno interrumpe constantemente la explicación del tema de integrales y distrae a los compañeros de la fila trasera.',
        notificarPadre: true,
        escalarSecretaria: false,
        fechaReporte: '2026-07-07 09:30'
    },
    {
        id: 2,
        alumno: 'Carlos Eduardo Méndez',
        codigo: 'UA-26501',
        clasificacion: 'Falta Constante de Tareas',
        descripcion: 'Acumula tres hojas de trabajo de física consecutivas sin entregar, afectando severamente su zona acumulativa.',
        notificarPadre: true,
        escalarSecretaria: true,
        fechaReporte: '2026-07-09 11:15'
    }
];

// ============================================================================
// COMPONENTE: GESTIÓN DE CASOS E INCIDENTES
// ============================================================================
export default function GestionCasos() {
    const navigate = useNavigate();
    const { token } = useAuth();

    // -------------------------------------------------------------------------
    // ESTADOS PRINCIPALES
    // -------------------------------------------------------------------------
    const [pestañaActiva, setPestañaActiva] = useState('justificaciones'); // 'justificaciones' | 'incidentes'
    const [justificaciones, setJustificaciones] = useState(JUSTIFICACIONES_DEMO);
    const [incidentes, setIncidentes] = useState(INCIDENTES_DEMO);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // Estado para el modal de rechazo de justificación
    const [solicitudRechazar, setSolicitudRechazar] = useState(null);
    const [motivoRechazoTexto, setMotivoRechazoTexto] = useState('');

    // -------------------------------------------------------------------------
    // ESTADOS DEL FORMULARIO DE INCIDENTES
    // -------------------------------------------------------------------------
    const [busquedaAlumno, setBusquedaAlumno] = useState('');
    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
    const [clasificacionIncidente, setClasificacionIncidente] = useState('');
    const [descripcionIncidente, setDescripcionIncidente] = useState('');
    const [notificarPadre, setNotificarPadre] = useState(false);
    const [escalarSecretaria, setEscalarSecretaria] = useState(false);

    // -------------------------------------------------------------------------
    // HANDLERS: APROBACIÓN Y RECHAZO DE JUSTIFICACIONES
    // -------------------------------------------------------------------------
    const handleAprobarJustificacion = (id) => {
        // Encontrar la solicitud
        const solicitud = justificaciones.find(j => j.id === id);
        if (!solicitud) return;

        // ---------------------------------------------------------------------
        // LÓGICA DE BACKEND (MUTACIÓN BASE DE DATOS Y PERMISOS DE PRÓRROGA)
        // ---------------------------------------------------------------------
        /* 
           SERVICIOS DE BACKEND RECOMENDADOS:
           
           1. Actualizar estado de Asistencia a Justificada:
              fetch(`/api/attendance/justify`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ studentId: solicitud.codigo, date: solicitud.fechaInasistencia })
              });
              
           2. Desbloquear prórrogas académicas sin penalización (Exención de retrasos en entregas):
              fetch(`/api/grades/unlock-prorrogas`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                  body: JSON.stringify({ studentId: solicitud.codigo, date: solicitud.fechaInasistencia })
              });
        */
        console.log(`[BACKEND] Inasistencia del alumno ${solicitud.alumno} el ${solicitud.fechaInasistencia} justificada. Prórroga de entregas habilitada al 100% sin penalización de retraso.`);

        setJustificaciones(prev => prev.map(j => {
            if (j.id === id) {
                return { ...j, estado: 'Aprobado', motivoRechazo: '' };
            }
            return j;
        }));

        setMensaje({
            texto: `Solicitud de ${solicitud.alumno} aprobada. Se han liberado las prórrogas académicas sin penalización para las actividades de ese día.`,
            tipo: 'exito'
        });
    };

    const handleAbrirRechazo = (solicitud) => {
        setSolicitudRechazar(solicitud);
        setMotivoRechazoTexto('');
    };

    const handleConfirmarRechazo = (e) => {
        e.preventDefault();
        if (!motivoRechazoTexto.trim()) {
            alert('Debe especificar un motivo de rechazo obligatoriamente.');
            return;
        }

        const id = solicitudRechazar.id;
        
        // ---------------------------------------------------------------------
        // LÓGICA DE BACKEND (RECHAZO DE TRÁMITE)
        // ---------------------------------------------------------------------
        /* 
           fetch(`/api/attendance/reject-justification`, {
               method: 'PUT',
               headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
               body: JSON.stringify({ justificationId: id, reason: motivoRechazoTexto })
           });
        */
        console.log(`[BACKEND] Justificación del alumno ${solicitudRechazar.alumno} rechazada. Motivo: ${motivoRechazoTexto}`);

        setJustificaciones(prev => prev.map(j => {
            if (j.id === id) {
                return { ...j, estado: 'Rechazado', motivoRechazo: motivoRechazoTexto };
            }
            return j;
        }));

        setMensaje({
            texto: `Solicitud de ${solicitudRechazar.alumno} rechazada correctamente.`,
            tipo: 'error'
        });

        setSolicitudRechazar(null);
    };

    // -------------------------------------------------------------------------
    // HANDLERS: GESTIÓN DE INCIDENTES CONDUCTUALES Y ACADÉMICOS
    // -------------------------------------------------------------------------
    const handleCrearIncidente = (e) => {
        e.preventDefault();

        if (!alumnoSeleccionado) {
            alert('Debe seleccionar un alumno del buscador.');
            return;
        }
        if (!clasificacionIncidente) {
            alert('Debe clasificar el tipo de incidente.');
            return;
        }
        if (!descripcionIncidente.trim()) {
            alert('Debe detallar la descripción de lo sucedido.');
            return;
        }

        // ---------------------------------------------------------------------
        // LÓGICA DE BACKEND (REGISTRO, ESCALAMIENTO Y NOTIFICACIONES)
        // ---------------------------------------------------------------------
        /* 
           SERVICIOS DE BACKEND RECOMENDADOS:
           
           1. Registrar Incidente en Bitácora Disciplinaria:
              fetch(`/api/incidents/create`, {
                  method: 'POST',
                  body: JSON.stringify({ studentId: alumnoSeleccionado.id, type: clasificacionIncidente, text: descripcionIncidente })
              });
              
           2. Notificar al Encargado/Padre de Familia (Si toggle está activo):
              if (notificarPadre) {
                  fetch(`/api/notifications/notify-parent`, {
                      body: JSON.stringify({ studentId: alumnoSeleccionado.id, message: `Incidente registrado: ${clasificacionIncidente}` })
                  });
              }
              
           3. Escalar al Profesor Guía e Institución (Control Académico/Secretaría):
              if (escalarSecretaria) {
                  fetch(`/api/incidents/escalate`, {
                      body: JSON.stringify({ studentId: alumnoSeleccionado.id, severity: 'Alta', details: descripcionIncidente })
                  });
              }
        */
        console.log(`[BACKEND] Incidente registrado para ${alumnoSeleccionado.nombre}. Clasificación: ${clasificacionIncidente}. Notificar Padre: ${notificarPadre}. Escalar a Secretaría: ${escalarSecretaria}.`);

        const nuevoIncidente = {
            id: Date.now(),
            alumno: alumnoSeleccionado.nombre,
            codigo: alumnoSeleccionado.codigo,
            clasificacion: clasificacionIncidente,
            descripcion: descripcionIncidente,
            notificarPadre,
            escalarSecretaria,
            fechaReporte: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };

        setIncidentes(prev => [nuevoIncidente, ...prev]);

        // Feedback al usuario en base a las reglas de escalamiento
        let feedbackTexto = `Incidente de ${alumnoSeleccionado.nombre} registrado con éxito.`;
        if (escalarSecretaria) {
            feedbackTexto += ' El caso fue escalado inmediatamente a Control Académico y a la Secretaría Administrativa.';
        } else {
            feedbackTexto += ' Enviado reporte al Profesor Guía.';
        }

        setMensaje({
            texto: feedbackTexto,
            tipo: 'exito'
        });

        // Limpiar formulario
        setAlumnoSeleccionado(null);
        setBusquedaAlumno('');
        setClasificacionIncidente('');
        setDescripcionIncidente('');
        setNotificarPadre(false);
        setEscalarSecretaria(false);
    };

    // Alumnos filtrados para el buscador
    const alumnosFiltrados = ESTUDIANTES_DOCENTE.filter(est => 
        est.nombre.toLowerCase().includes(busquedaAlumno.toLowerCase()) || 
        est.codigo.toLowerCase().includes(busquedaAlumno.toLowerCase())
    );

    return (
        <div style={{ fontFamily: 'var(--stitch-font)', padding: '4px' }}>
            
            {/* ── CABECERA ─────────────────────────────────────────────────── */}
            <div style={{
                background: 'linear-gradient(135deg, var(--stitch-primary) 0%, #1e40af 100%)',
                color: '#FFFFFF',
                padding: '24px 32px',
                borderRadius: 'var(--stitch-radius-md)',
                marginBottom: '28px',
                boxShadow: 'var(--stitch-shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '16px',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'absolute', right: '-20px', bottom: '-45px', fontSize: '180px', color: 'rgba(255,255,255,0.04)', fontFamily: 'Material Icons Outlined', userSelect: 'none', pointerEvents: 'none' }}>
                    gavel
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#93C5FD', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '14px' }}>assignment_late</span>
                        Panel de Administración Escolar
                    </span>
                    <h2 style={{ color: '#FFFFFF', fontWeight: '800', margin: '4px 0 0 0', fontSize: '24px', fontFamily: 'Outfit, sans-serif' }}>
                        Centro de Gestión de Casos e Incidentes
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Resuelve solicitudes de inasistencias y registra eventos del comportamiento estudiantil.
                    </p>
                </div>
            </div>

            {/* ── ALERTA DE MENSAJES ────────────────────────────────────────── */}
            {mensaje.texto && (
                <div className={`stitch-alert ${mensaje.tipo === 'exito' ? 'stitch-alert-success' : 'stitch-alert-danger'}`}>
                    <span className="material-icons-outlined">
                        {mensaje.tipo === 'exito' ? 'check_circle' : 'error_outline'}
                    </span>
                    <span style={{ flex: 1 }}>{mensaje.texto}</span>
                    <button onClick={() => setMensaje({ texto: '', tipo: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'inherit', lineHeight: 1 }}>×</button>
                </div>
            )}

            {/* ── SELECTOR DE PESTAÑAS (TABS) ───────────────────────────────── */}
            <div className="stitch-tabs-container">
                <button
                    onClick={() => setPestañaActiva('justificaciones')}
                    className={`stitch-tab-btn ${pestañaActiva === 'justificaciones' ? 'stitch-tab-btn-active' : ''}`}
                >
                    <span className="material-icons-outlined">verified</span>
                    Bandeja de Justificaciones
                </button>
                <button
                    onClick={() => setPestañaActiva('incidentes')}
                    className={`stitch-tab-btn ${pestañaActiva === 'incidentes' ? 'stitch-tab-btn-active' : ''}`}
                >
                    <span className="material-icons-outlined">report_problem</span>
                    Bitácora y Reporte de Incidentes
                </button>
            </div>

            {/* ───────────────────────────────────────────────────────────────
                PESTAÑA 1: BANDEJA DE JUSTIFICACIONES DE INASISTENCIA
            ──────────────────────────────────────────────────────────────── */}
            {pestañaActiva === 'justificaciones' && (
                <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                    <h3 className="stitch-title-font" style={{ margin: '0 0 16px 0', fontSize: '15px', fontWeight: '800', color: 'var(--stitch-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Solicitudes de Justificación Pendientes y Procesadas
                    </h3>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="stitch-table">
                            <thead>
                                <tr>
                                    <th className="stitch-th">Estudiante</th>
                                    <th className="stitch-th">Grado / Sección</th>
                                    <th className="stitch-th" style={{ textAlign: 'center' }}>Fecha Inasistencia</th>
                                    <th className="stitch-th" style={{ width: '30%' }}>Motivo Declarado</th>
                                    <th className="stitch-th" style={{ textAlign: 'center' }}>Comprobante</th>
                                    <th className="stitch-th" style={{ textAlign: 'center' }}>Estado</th>
                                    <th className="stitch-th" style={{ textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {justificaciones.map(sol => (
                                    <tr key={sol.id} className="stitch-tr-hover">
                                        <td className="stitch-td">
                                            <strong>{sol.alumno}</strong>
                                            <div style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)', marginTop: '2px' }}>{sol.codigo}</div>
                                        </td>
                                        <td className="stitch-td" style={{ color: 'var(--stitch-text-primary)' }}>{sol.grado}</td>
                                        <td className="stitch-td" style={{ textAlign: 'center', fontWeight: '700' }}>{sol.fechaInasistencia}</td>
                                        <td className="stitch-td" style={{ lineHeight: '1.4' }}>
                                            {sol.motivo}
                                            {sol.estado === 'Rechazado' && sol.motivoRechazo && (
                                                <div style={{ marginTop: '6px', fontSize: '11px', padding: '6px 8px', borderRadius: '4px', backgroundColor: '#FEF2F2', border: '1px solid #FEE2E2', color: '#991B1B' }}>
                                                    <strong>Rechazo:</strong> {sol.motivoRechazo}
                                                </div>
                                            )}
                                        </td>
                                        <td className="stitch-td" style={{ textAlign: 'center' }}>
                                            <button
                                                onClick={() => alert(`Visualizando comprobante adjunto: ${sol.comprobante}`)}
                                                style={{ border: 'none', background: 'none', color: 'var(--stitch-secondary)', fontWeight: '700', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'underline' }}
                                            >
                                                <span className="material-icons-outlined" style={{ fontSize: '16px' }}>attachment</span>
                                                Ver adjunto
                                            </button>
                                        </td>
                                        <td className="stitch-td" style={{ textAlign: 'center' }}>
                                            <span className={`stitch-badge ${
                                                sol.estado === 'Pendiente' 
                                                    ? 'stitch-badge-warning' 
                                                    : (sol.estado === 'Aprobado' ? 'stitch-badge-success' : 'stitch-badge-danger')
                                            }`}>
                                                {sol.estado}
                                            </span>
                                        </td>
                                        <td className="stitch-td" style={{ textAlign: 'center' }}>
                                            {sol.estado === 'Pendiente' ? (
                                                <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                    <button
                                                        onClick={() => handleAprobarJustificacion(sol.id)}
                                                        className="stitch-button"
                                                        style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--stitch-success)' }}
                                                    >
                                                        <span className="material-icons-outlined" style={{ fontSize: '14px' }}>done</span>
                                                        Aprobar
                                                    </button>
                                                    <button
                                                        onClick={() => handleAbrirRechazo(sol)}
                                                        className="stitch-button"
                                                        style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--stitch-danger)' }}
                                                    >
                                                        <span className="material-icons-outlined" style={{ fontSize: '14px' }}>close</span>
                                                        Rechazar
                                                    </button>
                                                </div>
                                            ) : (
                                                <span style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', fontStyle: 'italic' }}>Procesado</span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ── PESTAÑA 2: GESTIÓN DE INCIDENTES CONDUCTUALES Y ACADÉMICOS ── */}
            {pestañaActiva === 'incidentes' && (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '24px', alignItems: 'start' }}>
                    
                    {/* Formulario de Reportes de Incidentes */}
                    <form onSubmit={handleCrearIncidente} className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                        <h3 className="stitch-title-font" style={{ margin: '0 0 20px 0', fontSize: '15px', fontWeight: '800', color: 'var(--stitch-primary)', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '10px' }}>
                            Reportar Novedad o Incidente Disciplinario
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            
                            {/* Selector de Alumno con buscador dinámico */}
                            <div>
                                <label className="stitch-label">Buscador de Alumno *</label>
                                <div className="stitch-search-wrapper">
                                    <span className="material-icons-outlined stitch-search-icon">search</span>
                                    <input
                                        type="text"
                                        placeholder="Escribe el nombre o código institucional del alumno..."
                                        value={busquedaAlumno}
                                        onChange={e => {
                                            setBusquedaAlumno(e.target.value);
                                            if (alumnoSeleccionado) setAlumnoSeleccionado(null);
                                        }}
                                        className="stitch-input stitch-search-input"
                                    />
                                    {/* Dropdown de autocompletado */}
                                    {busquedaAlumno && !alumnoSeleccionado && (
                                        <div style={{
                                            position: 'absolute', top: '44px', left: 0, right: 0,
                                            backgroundColor: '#FFFFFF', border: '1px solid var(--stitch-border)',
                                            borderRadius: '6px', boxShadow: 'var(--stitch-shadow-lg)', zIndex: 100,
                                            maxHeight: '160px', overflowY: 'auto'
                                        }}>
                                            {alumnosFiltrados.length === 0 ? (
                                                <div style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--stitch-text-secondary)' }}>
                                                    No se encontraron alumnos que coincidan.
                                                </div>
                                            ) : (
                                                alumnosFiltrados.map(est => (
                                                    <div
                                                        key={est.id}
                                                        onClick={() => {
                                                            setAlumnoSeleccionado(est);
                                                            setBusquedaAlumno(est.nombre);
                                                        }}
                                                        style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }}
                                                        onMouseOver={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                                        onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                    >
                                                        <strong>{est.nombre}</strong> ({est.codigo}) · <small>{est.grado} {est.seccion}</small>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    )}
                                </div>
                                {alumnoSeleccionado && (
                                    <div className="stitch-badge stitch-badge-success" style={{ marginTop: '8px', padding: '6px 12px', display: 'flex', width: 'fit-content' }}>
                                        <span className="material-icons-outlined" style={{ fontSize: '15px' }}>check</span>
                                        Alumno Seleccionado: {alumnoSeleccionado.nombre} ({alumnoSeleccionado.codigo})
                                    </div>
                                )}
                            </div>

                            {/* Clasificación del incidente */}
                            <div>
                                <label className="stitch-label">Clasificación del Incidente *</label>
                                <select
                                    required
                                    value={clasificacionIncidente}
                                    onChange={e => setClasificacionIncidente(e.target.value)}
                                    className="stitch-select"
                                >
                                    <option value="">— Seleccione una clasificación —</option>
                                    <option value="Problema de Conducta">Problema de Conducta</option>
                                    <option value="Falta Constante de Tareas">Falta Constante de Tareas</option>
                                    <option value="Indisciplina en Aula">Indisciplina en Aula</option>
                                    <option value="Otro">Otro</option>
                                </select>
                            </div>

                            {/* Descripción detallada */}
                            <div>
                                <label className="stitch-label">Descripción y Detalles del Evento *</label>
                                <textarea
                                    required
                                    rows={4}
                                    value={descripcionIncidente}
                                    onChange={e => setDescripcionIncidente(e.target.value)}
                                    className="stitch-textarea"
                                    placeholder="Describe detalladamente los hechos, participantes y contexto de lo ocurrido en el aula..."
                                />
                            </div>

                            {/* Toggles de Escalamiento y Notificaciones */}
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid var(--stitch-border)' }}>
                                <div>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', display: 'block', marginBottom: '8px' }}>Notificación a Encargado</span>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={notificarPadre}
                                            onChange={e => setNotificarPadre(e.target.checked)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--stitch-text-primary)' }}>Notificar al Padre</span>
                                    </label>
                                </div>
                                <div>
                                    <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', display: 'block', marginBottom: '8px' }}>Escalamiento Grave</span>
                                    <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                        <input
                                            type="checkbox"
                                            checked={escalarSecretaria}
                                            onChange={e => setEscalarSecretaria(e.target.checked)}
                                            style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                        />
                                        <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--stitch-danger)' }}>Escalar a Secretaría</span>
                                    </label>
                                </div>
                            </div>

                            <button type="submit" className="stitch-button" style={{ justifyContent: 'center', height: '42px', marginTop: '10px' }}>
                                <span className="material-icons-outlined">send</span>
                                Registrar y Notificar Incidente
                            </button>
                        </div>
                    </form>

                    {/* Bitácora / Historial lateral de incidentes */}
                    <div className="stitch-card" style={{ padding: '20px', backgroundColor: '#FFFFFF' }}>
                        <h3 className="stitch-title-font" style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800', color: 'var(--stitch-primary)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="material-icons-outlined">history</span>
                            Bitácora Reciente
                        </h3>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                            {incidentes.map(inc => (
                                <div key={inc.id} style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '6px', border: '1px solid var(--stitch-border)', fontSize: '12px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                                        <div>
                                            <strong>{inc.alumno}</strong>
                                            <div style={{ fontSize: '10px', color: 'var(--stitch-text-secondary)' }}>{inc.codigo}</div>
                                        </div>
                                        <span className={`stitch-badge ${
                                            inc.clasificacion.includes('Conducta') || inc.clasificacion.includes('Indisciplina') 
                                                ? 'stitch-badge-danger' 
                                                : 'stitch-badge-warning'
                                        }`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                                            {inc.clasificacion}
                                        </span>
                                    </div>
                                    <p style={{ margin: '6px 0', lineHeight: '1.4', color: 'var(--stitch-text-primary)' }}>
                                        {inc.descripcion}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', borderTop: '1px dashed #E2E8F0', paddingTop: '6px', fontSize: '10px', color: 'var(--stitch-text-secondary)' }}>
                                        <span>{inc.fechaReporte}</span>
                                        <div style={{ display: 'flex', gap: '6px' }}>
                                            {inc.notificarPadre && <span title="Padre Notificado" className="material-icons-outlined" style={{ fontSize: '13px', color: 'var(--stitch-secondary)' }}>textsms</span>}
                                            {inc.escalarSecretaria && <span title="Escalado a Secretaría" className="material-icons-outlined" style={{ fontSize: '13px', color: 'var(--stitch-danger)' }}>gavel</span>}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                </div>
            )}

            {/* ── MODAL: MOTIVO DE RECHAZO DE JUSTIFICACIÓN ──────────────────── */}
            {solicitudRechazar && (
                <div className="stitch-modal-backdrop">
                    <form onSubmit={handleConfirmarRechazo} className="stitch-modal-content" style={{ maxWidth: '500px' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                            <h3 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '16px' }}>
                                Rechazar Justificación de Inasistencia
                            </h3>
                            <button
                                type="button"
                                onClick={() => setSolicitudRechazar(null)}
                                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--stitch-text-secondary)', lineHeight: 1 }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ fontSize: '13px', color: 'var(--stitch-text-primary)', marginBottom: '16px' }}>
                            Por favor especifique la razón reglamentaria del rechazo de la solicitud para el alumno <strong>{solicitudRechazar.alumno}</strong> (Fecha: {solicitudRechazar.fechaInasistencia}). El encargado recibirá este comentario en su portal.
                        </div>

                        <div style={{ marginBottom: '20px' }}>
                            <label className="stitch-label">Motivo del Rechazo *</label>
                            <textarea
                                required
                                rows={3}
                                value={motivoRechazoTexto}
                                onChange={e => setMotivoRechazoTexto(e.target.value)}
                                className="stitch-textarea"
                                placeholder="Ej: No adjunta justificante médico oficial o sobrepasa el límite reglamentario..."
                            />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setSolicitudRechazar(null)}
                                className="stitch-button-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="stitch-button"
                                style={{ backgroundColor: 'var(--stitch-danger)' }}
                            >
                                Rechazar Solicitud
                            </button>
                        </div>

                    </form>
                </div>
            )}

        </div>
    );
}

const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--stitch-text-primary)',
    marginBottom: '6px'
};

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid var(--stitch-border)',
    fontSize: '14px',
    color: 'var(--stitch-text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--stitch-font)'
};

const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
};
