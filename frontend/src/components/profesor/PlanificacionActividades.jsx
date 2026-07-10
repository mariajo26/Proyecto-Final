import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

// ============================================================================
// DATOS DEMO PARA CRONOGRAMA, MÓDULOS E INASISTENCIAS
// ============================================================================
const TEMAS_INICIALES = [
    { id: 201, fecha: '2026-07-13', titulo: 'Concepto de Función Matemática', tipo: 'Tema', moduloId: 1 },
    { id: 202, fecha: '2026-07-14', titulo: 'Dominio y Rango de Funciones', tipo: 'Tema', moduloId: 1 },
    { id: 203, fecha: '2026-07-15', titulo: 'Hoja de Trabajo #1 (Funciones)', tipo: 'Actividad', moduloId: 1 },
    { id: 204, fecha: '2026-07-16', titulo: 'Funciones Inyectivas y Sobreyectivas', tipo: 'Tema', moduloId: 1 },
    { id: 205, fecha: '2026-07-17', titulo: 'Laboratorio de Funciones Reales', tipo: 'Laboratorio', moduloId: 1 },
    { id: 206, fecha: '2026-07-20', titulo: 'Examen Parcial I', tipo: 'Examen', moduloId: 1 },
];

const MODULOS_INICIALES = [
    { id: 1, nombre: 'Unidad 1: Introducción a las Funciones' },
    { id: 2, nombre: 'Unidad 2: Límites y Continuidad' },
    { id: 3, nombre: 'Unidad 3: Derivadas e Introducción al Cálculo' },
];

const ALUMNOS_DEMO = [
    { id: 1, codigo_ua: 'UA-26501', nombre: 'Carlos Eduardo Méndez', correo_padre: 'padre.carlos@gmail.com', inasistencias: ['2026-07-15', '2026-07-17'] },
    { id: 2, codigo_ua: 'UA-26502', nombre: 'María José Flores', correo_padre: 'padre.maria@gmail.com', inasistencias: ['2026-07-13'] },
    { id: 3, codigo_ua: 'UA-26503', nombre: 'Ana Victoria Ramos', correo_padre: 'padre.ana@gmail.com', inasistencias: [] },
];

export default function PlanificacionActividades() {
    const location = useLocation();
    const navigate = useNavigate();
    const { token, usuario } = useAuth();
    const fileInputRef = useRef(null);

    // Obtener curso
    const curso = location.state?.curso || {
        id: 1,
        materia_nombre: 'Matemática Aplicada II',
        grado_nombre: '5to Bachillerato',
        seccion_nombre: 'A',
        salon: '204',
        color_hex: '#0D2C54'
    };

    // -------------------------------------------------------------------------
    // ESTADOS PRINCIPALES
    // -------------------------------------------------------------------------
    const [pestañaActiva, setPestañaActiva] = useState('tareas'); // 'tareas' | 'cronograma' | 'modulos' | 'puesta_dia'
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    
    // Datos de trabajo
    const [temas, setTemas] = useState(TEMAS_INICIALES);
    const [modulos, setModulos] = useState(MODULOS_INICIALES);
    const [alumnos] = useState(ALUMNOS_DEMO);

    // Formulario de Nuevo Tema (Pestaña 2)
    const [nuevoTema, setNuevoTema] = useState({ titulo: '', fecha: '', tipo: 'Tema', moduloId: 1 });
    
    // Módulos (Pestaña 3)
    const [nuevoModuloNombre, setNuevoModuloNombre] = useState('');
    const [modoVistaEstudiante, setModoVistaEstudiante] = useState(false);

    // Material de Puesta al Día (Pestaña 4)
    const [selectedAlumnoId, setSelectedAlumnoId] = useState('');
    const [selectedFecha, setSelectedFecha] = useState('');
    const [contingenciaRecursos, setContingenciaRecursos] = useState({ paginas: '', descripcion: '', enlaces: '', archivos: [] });
    const [enviandoContingencia, setEnviandoContingencia] = useState(false);

    // -------------------------------------------------------------------------
    // Tareas Reutilizado de GestionTareas.jsx (Pestaña 1)
    // -------------------------------------------------------------------------
    const [tareasList, setTareasList] = useState([
        { id: 1, titulo: 'Examen Parcial I', tipo: 'Examen Parcial - Escrita', ponderacion: 20, fechaEntrega: '2026-07-20', modalidad: 'Virtual', visible: true },
        { id: 2, titulo: 'Hoja de Trabajo #1', tipo: 'Hoja de Trabajo', ponderacion: 15, fechaEntrega: '2026-07-15', modalidad: 'Virtual', visible: true },
        { id: 3, titulo: 'Laboratorio de Campo', tipo: 'Laboratorio', ponderacion: 25, fechaEntrega: '2026-07-17', modalidad: 'Físico', visible: true },
    ]);
    const [formTarea, setFormTarea] = useState({ titulo: '', descripcion: '', tipo: 'Tarea Común', ponderacion: '', fechaEntrega: '', modalidad: 'Virtual', visible: true });
    const [editarTareaId, setEditarTareaId] = useState(null);

    // =========================================================================
    // HANDLERS: TAREAS (PESTAÑA 1)
    // =========================================================================
    const handleCrearTarea = (e) => {
        e.preventDefault();
        if (editarTareaId) {
            setTareasList(prev => prev.map(t => t.id === editarTareaId ? { ...formTarea, id: editarTareaId } : t));
            setMensaje({ texto: 'Actividad académica actualizada.', tipo: 'exito' });
            setEditarTareaId(null);
        } else {
            const nueva = { ...formTarea, id: Date.now() };
            setTareasList(prev => [...prev, nueva]);
            // También agregar de forma automática al cronograma del profesor
            const nuevoTemaCronograma = {
                id: Date.now() + 1,
                fecha: formTarea.fechaEntrega,
                titulo: formTarea.titulo,
                tipo: 'Actividad',
                moduloId: 1
            };
            setTemas(prev => [...prev, nuevoTemaCronograma]);
            setMensaje({ texto: 'Actividad creada y calendarizada.', tipo: 'exito' });
        }
        setFormTarea({ titulo: '', descripcion: '', tipo: 'Tarea Común', ponderacion: '', fechaEntrega: '', modalidad: 'Virtual', visible: true });
    };

    // =========================================================================
    // HANDLERS: CRONOGRAMA (PESTAÑA 2)
    // =========================================================================
    const handleCrearTema = (e) => {
        e.preventDefault();
        if (!nuevoTema.titulo || !nuevoTema.fecha) return;
        const nuevo = { ...nuevoTema, id: Date.now() };
        setTemas(prev => [...prev, nuevo]);
        setNuevoTema({ titulo: '', fecha: '', tipo: 'Tema', moduloId: modulos[0]?.id || 1 });
        setMensaje({ texto: 'Contenido conceptual agregado al cronograma.', tipo: 'exito' });
    };

    const handleEliminarTema = (id) => {
        setTemas(prev => prev.filter(t => t.id !== id));
    };

    const handleImprimirCronograma = () => {
        window.print();
    };

    // =========================================================================
    // HANDLERS: MÓDULOS (PESTAÑA 3)
    // =========================================================================
    const handleCrearModulo = (e) => {
        e.preventDefault();
        if (!nuevoModuloNombre.trim()) return;
        const nuevo = { id: Date.now(), nombre: nuevoModuloNombre };
        setModulos(prev => [...prev, nuevo]);
        setNuevoModuloNombre('');
        setMensaje({ texto: 'Nuevo módulo temático registrado.', tipo: 'exito' });
    };

    const handleAsignarModulo = (temaId, moduloId) => {
        setTemas(prev => prev.map(t => t.id === temaId ? { ...t, moduloId: parseInt(moduloId) } : t));
    };

    // =========================================================================
    // HANDLERS: PUESTA AL DÍA (PESTAÑA 4)
    // =========================================================================
    const handleAlumnoSeleccionado = (id) => {
        setSelectedAlumnoId(id);
        const alumno = alumnos.find(al => al.id === parseInt(id));
        if (alumno && alumno.inasistencias.length > 0) {
            setSelectedFecha(alumno.inasistencias[0]);
        } else {
            setSelectedFecha('');
        }
    };

    // Obtener contenidos y tareas planificados para la fecha de inasistencia
    const getContenidosDeFecha = () => {
        if (!selectedFecha) return [];
        return temas.filter(t => t.fecha === selectedFecha);
    };

    const handleCargarArchivosPuestaDia = (e) => {
        const files = Array.from(e.target.files).map(f => f.name);
        setContingenciaRecursos(prev => ({ ...prev, archivos: [...prev.archivos, ...files] }));
    };

    const handleEnviarContingencia = (e) => {
        e.preventDefault();
        setEnviandoContingencia(true);

        // TODO: API - Cruzar inasistencias y cronograma, empaquetar adjuntos y despachar e-mail/notificación
        // POST /api/calificaciones/contingencia
        // body: { estudiante_id: selectedAlumnoId, fecha: selectedFecha, recursos: contingenciaRecursos }

        setTimeout(() => {
            setEnviandoContingencia(false);
            setMensaje({
                texto: `Itinerario de contingencia pedagógica "Puesta al Día" despachado con éxito. Se notificó al estudiante en la plataforma y se envió el correo de itinerario al padre de familia.`,
                tipo: 'exito'
            });
            setContingenciaRecursos({ paginas: '', descripcion: '', enlaces: '', archivos: [] });
        }, 1500);
    };

    return (
        <div style={{ fontFamily: 'var(--stitch-font)', padding: '4px' }}>
            
            {/* Hoja de impresión embebida para imprimir solo el cronograma y su contenido */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body {
                        background-color: #FFFFFF !important;
                        color: #000000 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-cronograma-container {
                        display: block !important;
                        width: 100% !important;
                        margin: 0 !important;
                        padding: 10px !important;
                    }
                    .print-timeline {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        margin-top: 20px !important;
                    }
                    .print-timeline th, .print-timeline td {
                        border: 1px solid #475569 !important;
                        padding: 10px !important;
                    }
                    .print-header {
                        border-bottom: 2px solid #0F172A !important;
                        padding-bottom: 12px !important;
                        margin-bottom: 24px !important;
                    }
                }
            `}} />

            {/* ── CABECERA ─────────────────────────────────────────────────── */}
            <div className="no-print" style={{
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
                <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', fontSize: '180px', color: 'rgba(255,255,255,0.04)', fontFamily: 'Material Icons Outlined', userSelect: 'none', pointerEvents: 'none' }}>
                    event_note
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#93C5FD', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '14px' }}>class</span>
                        Planificación de Actividades
                    </span>
                    <h2 style={{ color: '#FFFFFF', fontWeight: '800', margin: '4px 0 0 0', fontSize: '24px', fontFamily: 'Outfit, sans-serif' }}>
                        Planificación & Contingencia
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px', margin: '4px 0 0 0' }}>
                        <strong>Curso:</strong> {curso.materia_nombre} · {curso.grado_nombre}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/cursos')}
                    className="stitch-button-secondary"
                    style={{
                        position: 'relative', zIndex: 1,
                        border: '1.5px solid rgba(255,255,255,0.3)',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        color: '#FFFFFF',
                    }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                    Cursos asignados
                </button>
            </div>

            {/* ── MENSAJES DE ALERTA ────────────────────────────────────────── */}
            {mensaje.texto && (
                <div className={`no-print stitch-alert ${mensaje.tipo === 'exito' ? 'stitch-alert-success' : 'stitch-alert-danger'}`} style={{ marginBottom: '20px' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '19px' }}>
                        {mensaje.tipo === 'exito' ? 'check_circle' : 'error_outline'}
                    </span>
                    <span style={{ flex: 1 }}>{mensaje.texto}</span>
                    <button onClick={() => setMensaje({ texto: '', tipo: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'inherit', lineHeight: 1 }}>×</button>
                </div>
            )}

            {/* ── MENÚ DE PESTAÑAS STITCH UI ─────────────────────────────────── */}
            <div className="no-print stitch-tabs-container" style={{ overflowX: 'auto' }}>
                {[
                    { id: 'tareas', label: 'Tareas / Actividades', icon: 'add_task' },
                    { id: 'cronograma', label: 'Cronograma Interno (Docente)', icon: 'calendar_month' },
                    { id: 'modulos', label: 'Módulos (Vista Estudiante)', icon: 'view_module' },
                    { id: 'puesta_dia', label: 'Material de Puesta al Día', icon: 'support_agent' }
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setPestañaActiva(tab.id)}
                        className={`stitch-tab-btn ${pestañaActiva === tab.id ? 'stitch-tab-btn-active' : ''}`}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px', fontSize: '14px' }}
                    >
                        <span className="material-icons-outlined" style={{ fontSize: '20px' }}>
                            {tab.icon}
                        </span>
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── CONTENIDO PESTAÑA 1: TAREAS Y ACTIVIDADES ───────────────────── */}
            {pestañaActiva === 'tareas' && (
                <div className="no-print">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                        <h3 style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '800' }}>
                            {editarTareaId ? 'Editar Actividad Académica' : 'Programar Nueva Tarea/Evaluación'}
                        </h3>
                    </div>

                    <form onSubmit={handleCrearTarea} className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', marginBottom: '28px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '16px' }}>
                            <div>
                                <label className="stitch-label">Título de la actividad *</label>
                                <input type="text" required value={formTarea.titulo} onChange={e => setFormTarea(prev => ({ ...prev, titulo: e.target.value }))} className="stitch-input" placeholder="Ej: Hojas de trabajo #2" />
                            </div>
                            <div>
                                <label className="stitch-label">Clasificación *</label>
                                <select value={formTarea.tipo} onChange={e => setFormTarea(prev => ({ ...prev, tipo: e.target.value }))} className="stitch-select">
                                    <option value="Tarea Común">Tarea Común</option>
                                    <option value="Hoja de Trabajo">Hoja de Trabajo</option>
                                    <option value="Laboratorio">Laboratorio</option>
                                    <option value="Corto">Corto</option>
                                    <option value="Examen Parcial - Escrita">Examen Parcial - Escrita</option>
                                    <option value="Examen Final">Examen Final</option>
                                </select>
                            </div>
                            <div>
                                <label className="stitch-label">Ponderación (pts) *</label>
                                <input type="number" required min="1" max="100" value={formTarea.ponderacion} onChange={e => setFormTarea(prev => ({ ...prev, ponderacion: e.target.value }))} className="stitch-input" placeholder="Ej: 15" />
                            </div>
                            <div>
                                <label className="stitch-label">Fecha de entrega *</label>
                                <input type="date" required value={formTarea.fechaEntrega} onChange={e => setFormTarea(prev => ({ ...prev, fechaEntrega: e.target.value }))} className="stitch-input" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            {editarTareaId && (
                                <button type="button" onClick={() => setEditarTareaId(null)} className="stitch-button-secondary" style={{ border: '1px solid var(--stitch-border)' }}>
                                    Cancelar
                                </button>
                            )}
                            <button type="submit" className="stitch-button">
                                <span className="material-icons-outlined" style={{ fontSize: '18px' }}>save</span>
                                {editarTareaId ? 'Guardar Cambios' : 'Calendarizar Actividad'}
                            </button>
                        </div>
                    </form>

                    <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                        <h4 className="stitch-title-font" style={{ margin: '0 0 16px 0', color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '15px' }}>Actividades Programadas</h4>
                        <div style={{ overflowX: 'auto' }}>
                            <table className="stitch-table">
                                <thead>
                                    <tr>
                                        <th className="stitch-th">Actividad</th>
                                        <th className="stitch-th">Tipo</th>
                                        <th className="stitch-th">Puntos</th>
                                        <th className="stitch-th">Fecha</th>
                                        <th className="stitch-th">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {tareasList.map(t => (
                                        <tr key={t.id} className="stitch-tr-hover">
                                            <td className="stitch-td" style={{ fontWeight: '700' }}>{t.titulo}</td>
                                            <td className="stitch-td">{t.tipo}</td>
                                            <td className="stitch-td" style={{ fontWeight: '700', color: 'var(--stitch-primary)' }}>{t.ponderacion} pts</td>
                                            <td className="stitch-td">{t.fechaEntrega}</td>
                                            <td className="stitch-td">
                                                <button onClick={() => { setFormTarea(t); setEditarTareaId(t.id); }} className="stitch-button-secondary" style={{ padding: '4px 10px', fontSize: '12px' }}>
                                                    Editar
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* ── CONTENIDO PESTAÑA 2: CRONOGRAMA INTERNO (DOCENTE) ───────────── */}
            {pestañaActiva === 'cronograma' && (
                <div className="no-print">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h3 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '18px' }}>
                                Cronograma de Avance Temático
                            </h3>
                             <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--stitch-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="material-icons-outlined" style={{ fontSize: '15px', color: 'var(--stitch-primary)' }}>lock</span> Planificación interna del profesor. Los estudiantes no tienen acceso a este calendario de fechas.
                             </p>
                        </div>
                        <button onClick={handleImprimirCronograma} className="stitch-button" style={{ backgroundColor: '#10B981' }}>
                            <span className="material-icons-outlined">print</span>
                            Imprimir Cronograma
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
                        
                        {/* Línea de Tiempo Pintada */}
                        <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                            <h4 className="stitch-title-font" style={{ margin: '0 0 20px 0', color: 'var(--stitch-primary)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                                <span className="material-icons-outlined" style={{ color: 'var(--stitch-secondary)' }}>timeline</span>
                                Avance Diario Planificado
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', position: 'relative', paddingLeft: '20px', borderLeft: '3px solid var(--stitch-border)' }}>
                                {temas
                                    .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                                    .map(t => {
                                        const isActividad = t.tipo !== 'Tema';
                                        return (
                                            <div key={t.id} style={{ position: 'relative', padding: '14px 18px', backgroundColor: isActividad ? 'rgba(59, 130, 246, 0.05)' : '#F8FAFC', borderRadius: '8px', border: '1px solid var(--stitch-border)' }}>
                                                {/* Punto indicador */}
                                                <div style={{
                                                    position: 'absolute', left: '-27px', top: '18px',
                                                    width: '12px', height: '12px', borderRadius: '50%',
                                                    backgroundColor: isActividad ? 'var(--stitch-secondary)' : 'var(--stitch-warning)',
                                                    border: '3px solid #FFFFFF', boxShadow: 'var(--stitch-shadow-sm)'
                                                }}></div>

                                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '6px' }}>
                                                    <div>
                                                         <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--stitch-text-secondary)', textTransform: 'uppercase', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                            <span className="material-icons-outlined" style={{ fontSize: '13px' }}>calendar_month</span> {t.fecha}
                                                         </span>
                                                        <h5 className="stitch-title-font" style={{ margin: '4px 0', fontSize: '14px', color: 'var(--stitch-primary)', fontWeight: '700' }}>
                                                            {t.titulo}
                                                        </h5>
                                                        <span className={`stitch-badge ${isActividad ? 'stitch-badge-info' : 'stitch-badge-warning'}`} style={{ fontSize: '10px' }}>
                                                            {t.tipo}
                                                        </span>
                                                    </div>
                                                    <button onClick={() => handleEliminarTema(t.id)} className="stitch-button-secondary" style={{ padding: '4px 8px', fontSize: '11px', color: '#EF4444', border: '1.5px solid rgba(239, 68, 68, 0.2)', backgroundColor: 'rgba(239, 68, 68, 0.02)' }}>
                                                        Quitar
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Programador de Temas */}
                        <form onSubmit={handleCrearTema} className="stitch-card" style={{ padding: '20px', backgroundColor: '#FFFFFF' }}>
                            <h4 className="stitch-title-font" style={{ margin: '0 0 16px 0', color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '15px' }}>Agregar al Itinerario</h4>
                            
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                <div>
                                    <label className="stitch-label">Título del Tema / Concepto *</label>
                                    <input type="text" required value={nuevoTema.titulo} onChange={e => setNuevoTema(prev => ({ ...prev, titulo: e.target.value }))} className="stitch-input" placeholder="Ej: Función Cuadrática" />
                                </div>
                                <div>
                                    <label className="stitch-label">Fecha de Clase *</label>
                                    <input type="date" required value={nuevoTema.fecha} onChange={e => setNuevoTema(prev => ({ ...prev, fecha: e.target.value }))} className="stitch-input" />
                                </div>
                                <div>
                                    <label className="stitch-label">Clasificación</label>
                                    <select value={nuevoTema.tipo} onChange={e => setNuevoTema(prev => ({ ...prev, tipo: e.target.value }))} className="stitch-select">
                                        <option value="Tema">Tema Conceptual</option>
                                        <option value="Actividad">Actividad de Repaso</option>
                                        <option value="Laboratorio">Laboratorio</option>
                                        <option value="Examen">Examen</option>
                                    </select>
                                </div>
                                <button type="submit" className="stitch-button" style={{ width: '100%', justifyContent: 'center' }}>
                                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>add</span>
                                    Agregar al Cronograma
                                </button>
                            </div>
                        </form>

                    </div>
                </div>
            )}

            {/* ── CONTENIDO PESTAÑA 3: MÓDULOS (VISTA ESPEJO ESTUDIANTE) ───────── */}
            {pestañaActiva === 'modulos' && (
                <div className="no-print">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div>
                            <h3 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '18px' }}>
                                Organización por Unidades / Módulos
                            </h3>
                             <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--stitch-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="material-icons-outlined" style={{ fontSize: '16px' }}>visibility</span> Previsualización del estudiante (las fechas del cronograma están completamente ocultas).
                             </p>
                        </div>
                        <button
                            onClick={() => setModoVistaEstudiante(!modoVistaEstudiante)}
                            className="stitch-button-secondary"
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                border: '1.5px solid var(--stitch-secondary)',
                                backgroundColor: modoVistaEstudiante ? 'var(--stitch-secondary)' : '#FFFFFF',
                                color: modoVistaEstudiante ? '#FFFFFF' : 'var(--stitch-secondary)',
                            }}
                        >
                            <span className="material-icons-outlined">{modoVistaEstudiante ? 'visibility_off' : 'visibility'}</span>
                            {modoVistaEstudiante ? 'Volver a Vista Docente' : 'Simular Vista Estudiante'}
                        </button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: modoVistaEstudiante ? '1fr' : '1fr 300px', gap: '24px', alignItems: 'start' }}>
                        
                        {/* Listado de Unidades Temáticas */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {modulos.map(mod => {
                                const temasDelModulo = temas.filter(t => t.moduloId === mod.id);
                                return (
                                    <div key={mod.id} className="stitch-card" style={{ padding: '20px', backgroundColor: '#FFFFFF' }}>
                                         <h4 className="stitch-title-font" style={{ margin: '0 0 14px 0', color: 'var(--stitch-primary)', fontWeight: '800', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
                                            <span className="material-icons-outlined" style={{ fontSize: '20px', color: 'var(--stitch-secondary)' }}>folder</span> {mod.nombre}
                                         </h4>
                                        
                                        {temasDelModulo.length === 0 ? (
                                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-secondary)', fontStyle: 'italic' }}>
                                                No hay temas asignados a esta unidad.
                                            </p>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                {temasDelModulo.map(t => (
                                                    <div key={t.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid var(--stitch-border)' }}>
                                                        <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--stitch-text-primary)' }}>
                                                            {t.titulo}
                                                        </span>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                                            <span style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)' }}>
                                                                {t.tipo}
                                                            </span>
                                                            {!modoVistaEstudiante && (
                                                                <span style={{ fontSize: '11px', backgroundColor: '#E2E8F0', padding: '2px 6px', borderRadius: '4px', color: 'var(--stitch-text-primary)', fontWeight: '700' }}>
                                                                    {t.fecha}
                                                                </span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        {/* Panel de Asignación y Creación (Oculto en Vista Estudiante) */}
                        {!modoVistaEstudiante && (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                                {/* Crear Módulo */}
                                <form onSubmit={handleCrearModulo} className="stitch-card" style={{ padding: '20px', backgroundColor: '#FFFFFF' }}>
                                    <h4 className="stitch-title-font" style={{ margin: '0 0 14px 0', color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '15px' }}>Crear Unidad</h4>
                                    <input type="text" required value={nuevoModuloNombre} onChange={e => setNuevoModuloNombre(e.target.value)} className="stitch-input" style={{ marginBottom: '12px' }} placeholder="Ej: Unidad 4: Integrales" />
                                    <button type="submit" className="stitch-button" style={{ width: '100%', justifyContent: 'center' }}>
                                        Crear Módulo
                                    </button>
                                </form>

                                {/* Organizar Temas */}
                                <div className="stitch-card" style={{ padding: '20px', backgroundColor: '#FFFFFF' }}>
                                    <h4 className="stitch-title-font" style={{ margin: '0 0 14px 0', color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '15px' }}>Organizar Contenidos</h4>
                                    <p style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', margin: '0 0 12px 0' }}>
                                        Mueve los contenidos a sus respectivas unidades didácticas.
                                    </p>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                        {temas.map(t => (
                                            <div key={t.id} style={{ display: 'flex', flexDirection: 'column', gap: '4px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '8px' }}>
                                                <span style={{ fontSize: '12px', fontWeight: '700' }}>{t.titulo}</span>
                                                <select
                                                    value={t.moduloId}
                                                    onChange={e => handleAsignarModulo(t.id, e.target.value)}
                                                    className="stitch-select"
                                                    style={{ padding: '4px 8px', fontSize: '12px' }}
                                                >
                                                    {modulos.map(m => (
                                                        <option key={m.id} value={m.id}>{m.nombre}</option>
                                                    ))}
                                                </select>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                            </div>
                        )}

                    </div>
                </div>
            )}

            {/* ── CONTENIDO PESTAÑA 4: MATERIAL DE PUESTA AL DÍA (CONTINGENCIA) ── */}
            {pestañaActiva === 'puesta_dia' && (
                <div className="no-print">
                    <div style={{ marginBottom: '20px' }}>
                        <h3 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '18px' }}>
                            Buzón de Contingencia y Puesta al Día
                        </h3>
                        <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--stitch-text-secondary)' }}>
                            El sistema detecta automáticamente qué alumnos faltaron en qué fechas y te permite preparar un itinerario estructurado para que se pongan al día desde casa.
                        </p>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
                        
                        {/* Selector de Alumno e Inasistencia */}
                        <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                            <h4 className="stitch-title-font" style={{ margin: '0 0 16px 0', color: 'var(--stitch-primary)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                                <span className="material-icons-outlined" style={{ color: 'var(--stitch-secondary)' }}>assignment_late</span>
                                Selección de Alumno Ausente
                            </h4>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                <div>
                                    <label className="stitch-label">Alumno Ausente</label>
                                    <select value={selectedAlumnoId} onChange={e => handleAlumnoSeleccionado(e.target.value)} className="stitch-select">
                                        <option value="">— Selecciona un alumno —</option>
                                        {alumnos.map(al => (
                                            <option key={al.id} value={al.id}>{al.nombre} ({al.codigo_ua})</option>
                                        ))}
                                    </select>
                                </div>

                                {selectedAlumnoId && (
                                    <div>
                                        <label className="stitch-label">Fecha de Inasistencia Registrada</label>
                                        <select value={selectedFecha} onChange={e => setSelectedFecha(e.target.value)} className="stitch-select">
                                            <option value="">— Selecciona la fecha —</option>
                                            {alumnos.find(al => al.id === parseInt(selectedAlumnoId))?.inasistencias.map(f => (
                                                <option key={f} value={f}>{f}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                {/* Reporte Automático de Actividades Vistas en Clase */}
                                {selectedFecha && (
                                    <div style={{ marginTop: '12px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid var(--stitch-border)' }}>
                                         <h5 className="stitch-title-font" style={{ margin: '0 0 8px 0', color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span className="material-icons-outlined" style={{ fontSize: '15px' }}>search</span> Planificado en Clase para este día:
                                         </h5>
                                        {getContenidosDeFecha().length === 0 ? (
                                            <p style={{ margin: 0, fontSize: '12px', color: 'var(--stitch-text-secondary)', fontStyle: 'italic' }}>
                                                No se planificaron contenidos o tareas específicos para esta fecha en el cronograma.
                                            </p>
                                        ) : (
                                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--stitch-text-primary)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {getContenidosDeFecha().map(item => (
                                                    <li key={item.id}>
                                                        <strong>[{item.tipo}]</strong> {item.titulo}
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Carga de Material y Envío de Itinerario */}
                        {selectedFecha && (
                            <form onSubmit={handleEnviarContingencia} className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                                <h4 className="stitch-title-font" style={{ margin: '0 0 16px 0', color: 'var(--stitch-primary)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '15px' }}>
                                    <span className="material-icons-outlined" style={{ color: 'var(--stitch-success)' }}>forward_to_inbox</span>
                                    Preparación del Itinerario
                                </h4>

                                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                                    <div>
                                        <label className="stitch-label">Instrucciones de Puesta al Día</label>
                                        <textarea
                                            rows={3}
                                            value={contingenciaRecursos.descripcion}
                                            onChange={e => setContingenciaRecursos(prev => ({ ...prev, descripcion: e.target.value }))}
                                            className="stitch-textarea"
                                            placeholder="Ej: Leer las páginas 45 a la 50 del libro de texto y realizar la actividad de la hoja adjunta..."
                                        />
                                    </div>

                                    <div>
                                        <label className="stitch-label">Enlaces de Apoyo (Videos, Materiales)</label>
                                        <input
                                            type="text"
                                            value={contingenciaRecursos.enlaces}
                                            onChange={e => setContingenciaRecursos(prev => ({ ...prev, enlaces: e.target.value }))}
                                            className="stitch-input"
                                            placeholder="Ej: https://youtube.com/clase-funciones"
                                        />
                                    </div>

                                    {/* Subidor de Recursos */}
                                    <div>
                                        <label className="stitch-label">Adjuntar Materiales Complementarios</label>
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            multiple
                                            onChange={handleCargarArchivosPuestaDia}
                                            style={{ display: 'none' }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="stitch-button-secondary"
                                            style={{
                                                width: '100%', padding: '10px', borderRadius: '6px',
                                                border: '1.5px dashed var(--stitch-secondary)',
                                                backgroundColor: 'rgba(59,130,246,0.02)',
                                                color: 'var(--stitch-secondary)',
                                            }}
                                        >
                                            Seleccionar archivos PDF/Imágenes
                                        </button>

                                        {contingenciaRecursos.archivos.length > 0 && (
                                            <div style={{ marginTop: '8px', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                                {contingenciaRecursos.archivos.map((n, i) => (
                                                    <div key={i} style={{ fontSize: '11px', color: 'var(--stitch-text-primary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                        <span className="material-icons-outlined" style={{ fontSize: '14px', color: 'var(--stitch-secondary)' }}>description</span>
                                                        {n}
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={enviandoContingencia}
                                        className="stitch-button"
                                        style={{ width: '100%', justifyContent: 'center', height: '42px', marginTop: '8px' }}
                                    >
                                        <span className="material-icons-outlined" style={{ fontSize: '18px' }}>send</span>
                                        {enviandoContingencia ? 'Enviando Itinerario...' : 'Enviar Itinerario "Puesta al Día"'}
                                    </button>
                                </div>
                            </form>
                        )}

                    </div>
                </div>
            )}

            {/* ── ÁREA DE IMPRESIÓN EXCLUSIVA (OCULTO EN LA INTERFAZ) ─────────── */}
            <div style={{ display: 'none' }} className="print-cronograma-container">
                <div className="print-header" style={{ textAlign: 'center', paddingBottom: '10px' }}>
                    <h2>Cronograma de Avance de Contenidos Académicos</h2>
                    <h3>Unidad Académica: {curso.materia_nombre} | Profesor: {usuario.nombre || usuario.codigo_ua}</h3>
                    <p style={{ fontSize: '12px', color: '#475569' }}>Fecha de Emisión: {new Date().toLocaleDateString()}</p>
                </div>
                <table className="print-timeline" style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                        <tr style={{ backgroundColor: '#F1F5F9' }}>
                            <th style={{ textAlign: 'left', width: '120px' }}>Fecha</th>
                            <th style={{ textAlign: 'left', width: '100px' }}>Tipo</th>
                            <th style={{ textAlign: 'left' }}>Contenido / Actividad Planificada</th>
                        </tr>
                    </thead>
                    <tbody>
                        {temas
                            .sort((a, b) => new Date(a.fecha) - new Date(b.fecha))
                            .map(t => (
                                <tr key={t.id}>
                                    <td><strong>{t.fecha}</strong></td>
                                    <td>{t.tipo}</td>
                                    <td><strong>{t.titulo}</strong></td>
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}
