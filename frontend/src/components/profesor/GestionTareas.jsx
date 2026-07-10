import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

// ============================================================================
// TIPOS DE ACTIVIDAD PREDEFINIDOS DEL SISTEMA
// ============================================================================
const TIPOS_PREDEFINIDOS = [
    'Examen Final',
    'Examen Parcial - Oral',
    'Examen Parcial - Escrita',
    'Examen Parcial - Práctica',
    'Corto',
    'Hoja de Trabajo',
    'Laboratorio',
    'Tarea Común',
];

// ============================================================================
// TAREA VACÍA — ESTADO INICIAL DEL FORMULARIO
// ============================================================================
const TAREA_VACIA = {
    titulo: '',
    descripcion: '',
    tipo: '',
    ponderacion: '',
    fechaEntrega: '',
    horaEntrega: '',
    modalidad: 'Virtual',
    visible: true,
    fechaPublicacion: '',
    horaPublicacion: '',
    rubroId: '',
    archivos: [],
};

// ============================================================================
// DATOS DEMO — Se reemplazarán con datos reales del API
// ============================================================================
const TAREAS_DEMO = [
    { id: 1, titulo: 'Examen Parcial I', tipo: 'Examen Parcial - Escrita', ponderacion: 25, fechaEntrega: '2026-07-20', horaEntrega: '10:00', modalidad: 'Virtual', visible: true },
    { id: 2, titulo: 'Hoja de Trabajo #1', tipo: 'Hoja de Trabajo', ponderacion: 10, fechaEntrega: '2026-07-15', horaEntrega: '23:59', modalidad: 'Virtual', visible: false },
];

// ============================================================================
// COMPONENTE PRINCIPAL: GESTIÓN DE TAREAS
// ============================================================================
export default function GestionTareas() {
    const location = useLocation();
    const navigate = useNavigate();
    const { token, usuario } = useAuth();
    const fileInputRef = useRef(null);
    const formSectionRef = useRef(null);

    // Curso recibido por navigate state desde MisCursos
    const curso = location.state?.curso || null;

    // -------------------------------------------------------------------------
    // Estado del Formulario
    // -------------------------------------------------------------------------
    const [form, setForm] = useState(TAREA_VACIA);
    const [modoEdicion, setModoEdicion] = useState(false);
    const [editandoId, setEditandoId] = useState(null);
    const [archivosDrag, setArchivosDrag] = useState(false);

    // -------------------------------------------------------------------------
    // Estado de Tipos de Actividad (predefinidos + personalizados del profesor)
    // -------------------------------------------------------------------------
    const [tiposCustom, setTiposCustom] = useState([]);
    const [mostrarInputNuevoTipo, setMostrarInputNuevoTipo] = useState(false);
    const [nuevoTipo, setNuevoTipo] = useState('');
    const [guardandoTipo, setGuardandoTipo] = useState(false);

    // -------------------------------------------------------------------------
    // ESTADO DE RÚBRICAS ASOCIADAS
    // -------------------------------------------------------------------------
    const [rubricas, setRubricas] = useState([]);

    useEffect(() => {
        const fetchRubricas = async () => {
            try {
                const response = await fetch('/api/rubricas', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setRubricas(data);
                }
            } catch (e) {
                console.error("Error loading rubrics:", e);
            }
        };
        if (token) {
            fetchRubricas();
        }
    }, [token]);

    const rubricasFiltradas = useMemo(() => {
        let list = rubricas.length > 0 ? rubricas : [
            { id: 1, titulo: 'Rúbrica para Ensayos y Análisis Críticos', materia: 'Matemática Aplicada II' },
            { id: 2, titulo: 'Rúbrica de Reportes de Laboratorio Práctico', materia: 'Física General' },
            { id: 3, titulo: 'Rúbrica de Exposición Oral y Defensa de Proyecto', materia: 'Seminario de Investigación' }
        ];
        if (curso && curso.materia_nombre) {
            return list.filter(r => r.materia === curso.materia_nombre);
        }
        return list;
    }, [rubricas, curso]);

    // -------------------------------------------------------------------------
    // Estado de la Lista de Tareas y mensajes con persistencia
    // -------------------------------------------------------------------------
    const [tareas, setTareas] = useState(() => {
        const saved = localStorage.getItem('stitch_gestion_tareas');
        return saved ? JSON.parse(saved) : TAREAS_DEMO;
    });

    useEffect(() => {
        localStorage.setItem('stitch_gestion_tareas', JSON.stringify(tareas));
    }, [tareas]);

    const [guardando, setGuardando] = useState(false);
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });
    const [formVisible, setFormVisible] = useState(false);
    const [tareaEntregasSel, setTareaEntregasSel] = useState(null); 
    const [tareaAEliminar, setTareaAEliminar] = useState(null);

    // Datos simulados de entregas de estudiantes para las tareas virtuales del curso
    const ENTREGAS_SIMULADAS = {
        1: [
            { id: 901, alumno: 'Carlos Eduardo Méndez', codigo: 'UA-26501', fecha: '2026-07-19 14:32', archivo: 'parcial1_carlos_mendez.pdf', estado: 'Entregado' },
            { id: 902, alumno: 'María José Flores', codigo: 'UA-26502', fecha: '2026-07-20 09:15', archivo: 'parcial1_maria_flores.pdf', estado: 'Entregado' },
            { id: 903, alumno: 'Sofía Isabel Castro', codigo: 'UA-26505', fecha: '2026-07-20 10:00', archivo: 'parcial1_sofia_castro.pdf', estado: 'Entregado' }
        ],
        2: [
            { id: 911, alumno: 'Carlos Eduardo Méndez', codigo: 'UA-26501', fecha: '2026-07-15 12:00', archivo: 'hoja1_carlos.docx', estado: 'Entregado' },
            { id: 912, alumno: 'María José Flores', codigo: 'UA-26502', fecha: '2026-07-15 23:58', archivo: 'hoja1_maria_final.docx', estado: 'Entregado' }
        ]
    };

    // -------------------------------------------------------------------------
    // Redirigir si no hay curso seleccionado
    // -------------------------------------------------------------------------
    useEffect(() => {
        if (!curso) navigate('/cursos');
    }, [curso, navigate]);

    // -------------------------------------------------------------------------
    // TODO: API — Cargar tareas existentes del curso al montar
    // GET /api/tareas/curso/:cursoId  { headers: { Authorization: `Bearer ${token}` } }
    // -------------------------------------------------------------------------

    // -------------------------------------------------------------------------
    // TODO: API — Cargar tipos personalizados del profesor
    // GET /api/tareas/tipos-custom/:profesorId  { headers: { Authorization: `Bearer ${token}` } }
    // -------------------------------------------------------------------------

    // ============================================================================
    // HANDLERS DEL FORMULARIO
    // ============================================================================
    const handleChange = (campo, valor) =>
        setForm(prev => ({ ...prev, [campo]: valor }));

    const handleArchivos = (files) => {
        const nuevos = Array.from(files).map(f => ({ nombre: f.name, size: f.size, file: f }));
        setForm(prev => ({ ...prev, archivos: [...prev.archivos, ...nuevos] }));
    };

    const eliminarArchivo = (idx) =>
        setForm(prev => ({ ...prev, archivos: prev.archivos.filter((_, i) => i !== idx) }));

    const handleDrop = (e) => {
        e.preventDefault();
        setArchivosDrag(false);
        handleArchivos(e.dataTransfer.files);
    };

    // Guardar nuevo tipo personalizado
    const handleGuardarNuevoTipo = async () => {
        const nombre = nuevoTipo.trim();
        if (!nombre) return;
        if (tiposCustom.includes(nombre) || TIPOS_PREDEFINIDOS.includes(nombre)) {
            setMensaje({ texto: 'Ese tipo de actividad ya existe.', tipo: 'error' });
            return;
        }
        setGuardandoTipo(true);
        try {
            // TODO: API — Crear tipo personalizado del profesor
            // POST /api/tareas/tipos-custom
            // body: JSON.stringify({ nombre, profesor_id: usuario.id })
            setTiposCustom(prev => [...prev, nombre]);
            setForm(prev => ({ ...prev, tipo: nombre }));
            setNuevoTipo('');
            setMostrarInputNuevoTipo(false);
            setMensaje({ texto: `Tipo "${nombre}" creado y seleccionado.`, tipo: 'exito' });
        } catch (err) {
            setMensaje({ texto: `Error al guardar el tipo: ${err.message}`, tipo: 'error' });
        } finally {
            setGuardandoTipo(false);
        }
    };

    // Guardar o actualizar tarea
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.titulo || !form.tipo || !form.ponderacion || !form.fechaEntrega) {
            setMensaje({ texto: 'Completa los campos obligatorios: Título, Tipo, Ponderación y Fecha de entrega.', tipo: 'error' });
            return;
        }
        setGuardando(true);
        setMensaje({ texto: '', tipo: '' });
        try {
            if (modoEdicion) {
                // TODO: API — PUT /api/tareas/:id
                setTareas(prev => prev.map(t => t.id.toString() === editandoId.toString() ? { ...form, id: editandoId } : t));
                setMensaje({ texto: 'Tarea actualizada exitosamente.', tipo: 'exito' });
            } else {
                // TODO: API — POST /api/tareas
                // body: JSON.stringify({ ...form, curso_id: curso.id, profesor_id: usuario.id })
                setTareas(prev => [...prev, { ...form, id: Date.now() }]);
                setMensaje({ texto: 'Actividad creada exitosamente.', tipo: 'exito' });
            }
            setForm(TAREA_VACIA);
            setModoEdicion(false);
            setEditandoId(null);
        } catch (err) {
            setMensaje({ texto: `Error al guardar: ${err.message}`, tipo: 'error' });
        } finally {
            setGuardando(false);
        }
    };

    const handleEditar = (tarea) => {
        setForm({ ...TAREA_VACIA, ...tarea });
        setModoEdicion(true);
        setEditandoId(tarea.id);
        setFormVisible(true);
        setTimeout(() => {
            formSectionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 150);
    };

    const handleEliminar = (id) => {
        setTareaAEliminar(id);
    };

    const ejecutarEliminar = async () => {
        if (!tareaAEliminar) return;
        const id = tareaAEliminar;
        try {
            const response = await fetch(`/api/calificaciones/actividades/${id}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'No se pudo eliminar la actividad.');
            }
            const actualizadas = tareas.filter(t => t.id.toString() !== id.toString());
            setTareas(actualizadas);
            localStorage.setItem('stitch_gestion_tareas', JSON.stringify(actualizadas));
            setMensaje({ texto: 'Actividad eliminada con éxito de la base de datos.', tipo: 'exito' });
        } catch (err) {
            setMensaje({ texto: `Error al eliminar: ${err.message}`, tipo: 'error' });
        } finally {
            setTareaAEliminar(null);
        }
    };

    const cancelarEdicion = () => {
        setForm(TAREA_VACIA);
        setModoEdicion(false);
        setEditandoId(null);
        setMensaje({ texto: '', tipo: '' });
    };

    if (!curso) return null;

    const todosLosTipos = [...TIPOS_PREDEFINIDOS, ...tiposCustom];

    // ============================================================================
    // ESTILOS
    // ============================================================================
    const sectionStyle = {
        backgroundColor: '#FFFFFF',
        border: '1px solid var(--stitch-border)',
        borderRadius: 'var(--stitch-radius-md)',
        padding: '24px',
        marginBottom: '20px',
        boxShadow: 'var(--stitch-shadow-sm)',
    };

    const sectionTitleStyle = {
        fontSize: '13px',
        fontWeight: '700',
        color: 'var(--stitch-primary)',
        textTransform: 'uppercase',
        letterSpacing: '0.6px',
        marginBottom: '16px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        borderBottom: '1px solid var(--stitch-border)',
        paddingBottom: '10px',
    };

    const labelStyle = {
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: '#334155',
        marginBottom: '6px',
    };

    const inputStyle = {
        width: '100%',
        padding: '10px 14px',
        borderRadius: 'var(--stitch-radius-sm)',
        border: '1px solid var(--stitch-border)',
        fontSize: '14px',
        color: 'var(--stitch-text-primary)',
        boxSizing: 'border-box',
        fontFamily: 'var(--stitch-font)',
        transition: 'border-color 0.15s ease',
        outline: 'none',
    };

    const gridStyle = {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
        gap: '16px',
    };

    // ============================================================================
    // RENDER
    // ============================================================================
    return (
        <div style={{ fontFamily: 'var(--stitch-font)', maxWidth: '960px', margin: '0 auto' }}>

            {/* HEADER */}
            <div style={{
                background: 'linear-gradient(135deg, var(--stitch-primary) 0%, #1e40af 100%)',
                borderRadius: 'var(--stitch-radius-md)',
                padding: '24px 32px',
                marginBottom: '28px',
                boxShadow: 'var(--stitch-shadow-lg)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '12px',
                position: 'relative',
                overflow: 'hidden',
            }}>
                <div style={{ position: 'absolute', right: '-30px', bottom: '-30px', fontSize: '160px', color: 'rgba(255,255,255,0.05)', fontFamily: 'Material Icons Outlined', userSelect: 'none', pointerEvents: 'none' }}>
                    assignment
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginBottom: '4px', fontWeight: '500' }}>
                        Planificación de Actividades
                    </div>
                    <h2 style={{ color: '#FFFFFF', fontWeight: '800', margin: 0, fontSize: '22px', fontFamily: 'Outfit, sans-serif' }}>
                        {curso.materia_nombre}
                    </h2>
                    <div style={{ color: 'rgba(255,255,255,0.8)', fontSize: '13px', marginTop: '4px' }}>
                        {curso.grado_nombre} — Sección {curso.seccion_nombre} · Salón {curso.salon}
                    </div>
                </div>
                <button
                    onClick={() => navigate('/cursos')}
                    className="stitch-button-secondary"
                    style={{
                        position: 'relative', zIndex: 1,
                        border: '1.5px solid rgba(255,255,255,0.4)',
                        backgroundColor: 'rgba(255,255,255,0.12)',
                        color: '#FFFFFF',
                    }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '17px' }}>arrow_back</span>
                    Mis Cursos
                </button>
            </div>

            {/* MENSAJE DE ALERTA */}
            {mensaje.texto && (
                <div className={`stitch-alert ${mensaje.tipo === 'exito' ? 'stitch-alert-success' : 'stitch-alert-danger'}`}>
                    <span className="material-icons-outlined">
                        {mensaje.tipo === 'exito' ? 'check_circle' : 'error_outline'}
                    </span>
                    <span style={{ flex: 1 }}>{mensaje.texto}</span>
                    <button onClick={() => setMensaje({ texto: '', tipo: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'inherit', lineHeight: 1 }}>×</button>
                </div>
            )}


            {/* TABLA DE ACTIVIDADES EXISTENTES */}
            <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', marginBottom: '20px' }}>
                <div className="stitch-title-font" style={{ fontSize: '14px', fontWeight: '800', color: 'var(--stitch-primary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '10px' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '17px' }}>list_alt</span>
                    Actividades del Curso
                    <span className="stitch-badge stitch-badge-info" style={{ marginLeft: 'auto', fontSize: '11px', padding: '2px 8px' }}>
                        {tareas.length}
                    </span>
                </div>
                {tareas.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--stitch-text-secondary)' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '12px', color: '#CBD5E1' }}>assignment</span>
                        Aún no hay actividades creadas para este curso.
                    </div>
                ) : (
                    <div style={{ overflowX: 'auto' }}>
                        <table className="stitch-table">
                            <thead>
                                <tr>
                                    {['Título', 'Tipo', 'Puntos', 'Entrega', 'Modalidad', 'Estado', 'Acciones'].map(h => (
                                        <th key={h} className="stitch-th">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {tareas.map((tarea) => (
                                    <tr key={tarea.id} className="stitch-tr-hover">
                                        <td className="stitch-td" style={{ fontWeight: '700', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tarea.titulo}</td>
                                        <td className="stitch-td">
                                            <span className="stitch-badge stitch-badge-info">{tarea.tipo}</span>
                                        </td>
                                        <td className="stitch-td" style={{ fontWeight: '800', color: 'var(--stitch-primary)' }}>{tarea.ponderacion} pts</td>
                                        <td className="stitch-td" style={{ color: 'var(--stitch-text-secondary)', whiteSpace: 'nowrap' }}>
                                            {tarea.fechaEntrega}{tarea.horaEntrega ? ` · ${tarea.horaEntrega}` : ''}
                                        </td>
                                        <td className="stitch-td">
                                            <span className={`stitch-badge ${tarea.modalidad === 'Virtual' ? 'stitch-badge-success' : 'stitch-badge-warning'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <span className="material-icons-outlined" style={{ fontSize: '13px' }}>{tarea.modalidad === 'Virtual' ? 'laptop' : 'school'}</span>
                                                {tarea.modalidad}
                                            </span>
                                        </td>
                                        <td className="stitch-td">
                                            <span className={`stitch-badge ${tarea.visible ? 'stitch-badge-success' : 'stitch-badge-neutral'}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <span className="material-icons-outlined" style={{ fontSize: '13px' }}>{tarea.visible ? 'visibility' : 'visibility_off'}</span>
                                                {tarea.visible ? 'Visible' : 'Oculta'}
                                            </span>
                                        </td>
                                        <td className="stitch-td">
                                            <div style={{ display: 'flex', gap: '6px' }}>
                                                {tarea.modalidad === 'Virtual' && (
                                                    <button type="button" onClick={(e) => { e.stopPropagation(); setTareaEntregasSel(tarea); }} title="Ver Entregas"
                                                        style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--stitch-border)', backgroundColor: 'rgba(16,185,129,0.05)', cursor: 'pointer', color: 'var(--stitch-success)', display: 'flex', transition: 'all 0.15s ease' }}
                                                        onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--stitch-success)'; e.currentTarget.style.color = '#FFFFFF'; }}
                                                        onMouseOut={e => { e.currentTarget.style.backgroundColor = 'rgba(16,185,129,0.05)'; e.currentTarget.style.color = 'var(--stitch-success)'; }}>
                                                        <span className="material-icons-outlined" style={{ fontSize: '17px' }}>folder_open</span>
                                                    </button>
                                                )}
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleEditar(tarea); }} title="Editar"
                                                    style={{ padding: '6px', borderRadius: '6px', border: '1px solid var(--stitch-border)', backgroundColor: '#F8FAFC', cursor: 'pointer', color: 'var(--stitch-secondary)', display: 'flex', transition: 'all 0.15s ease' }}
                                                    onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--stitch-secondary)'; e.currentTarget.style.color = '#FFFFFF'; }}
                                                    onMouseOut={e => { e.currentTarget.style.backgroundColor = '#F8FAFC'; e.currentTarget.style.color = 'var(--stitch-secondary)'; }}>
                                                        <span className="material-icons-outlined" style={{ fontSize: '17px' }}>edit</span>
                                                </button>
                                                <button type="button" onClick={(e) => { e.stopPropagation(); handleEliminar(tarea.id); }} title="Eliminar"
                                                    style={{ padding: '6px', borderRadius: '6px', border: '1px solid #FECACA', backgroundColor: '#FFF5F5', cursor: 'pointer', color: 'var(--stitch-danger)', display: 'flex', transition: 'all 0.15s ease' }}
                                                    onMouseOver={e => { e.currentTarget.style.backgroundColor = 'var(--stitch-danger)'; e.currentTarget.style.color = '#FFFFFF'; }}
                                                    onMouseOut={e => { e.currentTarget.style.backgroundColor = '#FFF5F5'; e.currentTarget.style.color = 'var(--stitch-danger)'; }}>
                                                    <span className="material-icons-outlined" style={{ fontSize: '17px' }}>delete</span>
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* TITULO FORMULARIO — Clicable para colapsar/expandir */}
            <div
                ref={formSectionRef}
                onClick={() => setFormVisible(v => !v)}
                className="stitch-card"
                style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: formVisible ? '16px' : '24px',
                    flexWrap: 'wrap', gap: '8px',
                    backgroundColor: '#FFFFFF',
                    borderRadius: formVisible ? 'var(--stitch-radius-md) var(--stitch-radius-md) 0 0' : 'var(--stitch-radius-md)',
                    padding: '16px 20px',
                    cursor: 'pointer',
                    userSelect: 'none',
                }}
                onMouseOver={e => e.currentTarget.style.backgroundColor = '#F8FAFC'}
                onMouseOut={e => e.currentTarget.style.backgroundColor = '#FFFFFF'}
            >
                <h3 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '18px', display: 'flex', alignItems: 'center', gap: '8px', pointerEvents: 'none' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '22px', color: 'var(--stitch-secondary)' }}>
                        {modoEdicion ? 'edit' : 'add_circle'}
                    </span>
                    {modoEdicion ? 'Editar Actividad' : 'Nueva Actividad'}
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', pointerEvents: 'none' }}>
                    {modoEdicion && (
                        <span className="stitch-badge stitch-badge-info">
                            Editando
                        </span>
                    )}
                    <span className="material-icons-outlined" style={{ fontSize: '22px', color: 'var(--stitch-text-secondary)', transition: 'transform 0.2s ease', transform: formVisible ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                        expand_more
                    </span>
                </div>
            </div>

            {formVisible && <form onSubmit={handleSubmit} noValidate>

                {/* SECCIÓN 1: DATOS BÁSICOS */}
                <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', marginBottom: '20px' }}>
                    <div className="stitch-title-font" style={{ fontSize: '14px', fontWeight: '800', color: 'var(--stitch-primary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '10px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '17px' }}>info</span>
                        Datos Básicos
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label className="stitch-label">Título de la actividad *</label>
                        <input type="text" placeholder="Ej: Examen Parcial I — Matemática"
                            value={form.titulo} onChange={e => handleChange('titulo', e.target.value)}
                            required className="stitch-input" />
                    </div>
                    <div style={{ marginBottom: '16px' }}>
                        <label className="stitch-label">Descripción / Instrucciones</label>
                        <textarea placeholder="Describe el contenido, instrucciones o criterios de esta actividad..."
                            value={form.descripcion} onChange={e => handleChange('descripcion', e.target.value)}
                            rows={4} className="stitch-textarea" />
                    </div>
                    <div style={gridStyle}>
                        <div>
                            <label className="stitch-label">Ponderación (puntos) *</label>
                            <input type="number" min="1" max="100" placeholder="Ej: 25"
                                value={form.ponderacion} onChange={e => handleChange('ponderacion', e.target.value)}
                                required className="stitch-input" />
                        </div>
                        <div>
                            <label className="stitch-label">Fecha de entrega *</label>
                            <input type="date" value={form.fechaEntrega}
                                onChange={e => handleChange('fechaEntrega', e.target.value)}
                                required className="stitch-input" />
                        </div>
                        <div>
                            <label className="stitch-label">Hora límite de entrega</label>
                            <input type="time" value={form.horaEntrega}
                                onChange={e => handleChange('horaEntrega', e.target.value)}
                                className="stitch-input" />
                        </div>
                    </div>
                </div>

                {/* SECCIÓN 2: TIPO DE ACTIVIDAD */}
                <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', marginBottom: '20px' }}>
                    <div className="stitch-title-font" style={{ fontSize: '14px', fontWeight: '800', color: 'var(--stitch-primary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '10px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '17px' }}>category</span>
                        Tipo de Actividad
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '12px', alignItems: 'end' }}>
                        <div>
                            <label className="stitch-label">Clasificación *</label>
                            <select value={form.tipo} onChange={e => handleChange('tipo', e.target.value)}
                                required className="stitch-select">
                                <option value="">— Selecciona un tipo —</option>
                                <optgroup label="Tipos del Sistema">
                                    {TIPOS_PREDEFINIDOS.map(t => <option key={t} value={t}>{t}</option>)}
                                </optgroup>
                                {tiposCustom.length > 0 && (
                                    <optgroup label="Mis Tipos Personalizados">
                                        {tiposCustom.map(t => <option key={t} value={t}>{t}</option>)}
                                    </optgroup>
                                )}
                            </select>
                        </div>
                        <button type="button" onClick={() => setMostrarInputNuevoTipo(v => !v)}
                            className="stitch-button-secondary" style={{ borderStyle: 'dashed', whiteSpace: 'nowrap' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '17px' }}>add</span>
                            Nuevo tipo
                        </button>
                    </div>
                    {mostrarInputNuevoTipo && (
                        <div className="stitch-card" style={{ marginTop: '16px', padding: '16px', backgroundColor: '#F8FAFC' }}>
                            <label className="stitch-label" style={{ marginBottom: '10px' }}>
                                Nombre del tipo personalizado
                                <span style={{ fontWeight: '400', color: '#64748B', marginLeft: '6px', fontSize: '12px' }}>(Solo visible en tus cursos)</span>
                            </label>
                            <div style={{ display: 'flex', gap: '10px' }}>
                                <input type="text" placeholder="Ej: Proyecto Grupal, Exposición Oral..."
                                    value={nuevoTipo} onChange={e => setNuevoTipo(e.target.value)}
                                    onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleGuardarNuevoTipo())}
                                    className="stitch-input" style={{ flex: 1 }} autoFocus />
                                <button type="button" onClick={handleGuardarNuevoTipo}
                                    disabled={guardandoTipo || !nuevoTipo.trim()}
                                    className="stitch-button" style={{ whiteSpace: 'nowrap' }}>
                                    {guardandoTipo ? 'Guardando...' : 'Guardar tipo'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* SECCIÓN 3: RECURSOS ADJUNTOS */}
                <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', marginBottom: '20px' }}>
                    <div className="stitch-title-font" style={{ fontSize: '14px', fontWeight: '800', color: 'var(--stitch-primary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '10px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '17px' }}>attach_file</span>
                        Recursos Adjuntos
                        <span style={{ fontWeight: '400', fontSize: '12px', color: 'var(--stitch-text-secondary)', marginLeft: '4px' }}>(archivos de apoyo para los alumnos)</span>
                    </div>
                    <div
                        onDragOver={e => { e.preventDefault(); setArchivosDrag(true); }}
                        onDragLeave={() => setArchivosDrag(false)}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        style={{ border: `2px dashed ${archivosDrag ? 'var(--stitch-secondary)' : 'var(--stitch-border)'}`, borderRadius: '10px', padding: '28px', textAlign: 'center', cursor: 'pointer', backgroundColor: archivosDrag ? 'rgba(59,130,246,0.04)' : '#FAFBFC', transition: 'all 0.2s ease' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '36px', color: archivosDrag ? 'var(--stitch-secondary)' : '#CBD5E1', display: 'block', marginBottom: '8px' }}>cloud_upload</span>
                        <p style={{ margin: 0, color: archivosDrag ? 'var(--stitch-secondary)' : 'var(--stitch-text-secondary)', fontSize: '14px', fontWeight: '500' }}>
                            Arrastra archivos aquí o <span style={{ color: 'var(--stitch-secondary)', fontWeight: '700' }}>haz clic para seleccionar</span>
                        </p>
                        <p style={{ margin: '6px 0 0', fontSize: '12px', color: '#94A3B8' }}>PDF, DOCX, XLSX, imágenes — hasta 20MB por archivo</p>
                        <input ref={fileInputRef} type="file" multiple style={{ display: 'none' }} onChange={e => handleArchivos(e.target.files)} />
                    </div>
                    {form.archivos.length > 0 && (
                        <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {form.archivos.map((f, idx) => (
                                <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 14px', backgroundColor: '#F0F9FF', borderRadius: '8px', border: '1px solid #BAE6FD' }}>
                                    <span className="material-icons-outlined" style={{ fontSize: '18px', color: 'var(--stitch-secondary)' }}>description</span>
                                    <span style={{ flex: 1, fontSize: '13px', fontWeight: '500', color: '#0F172A', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.nombre}</span>
                                    <span style={{ fontSize: '12px', color: '#64748B' }}>{(f.size / 1024).toFixed(1)} KB</span>
                                    <button type="button" onClick={() => eliminarArchivo(idx)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#DC2626', display: 'flex', padding: '2px' }}>
                                        <span className="material-icons-outlined" style={{ fontSize: '17px' }}>close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* SECCIÓN 4: MODALIDAD + VISIBILIDAD (en grid) */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px', marginBottom: '20px' }}>
                    {/* Modalidad */}
                    <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                        <div className="stitch-title-font" style={{ fontSize: '14px', fontWeight: '800', color: 'var(--stitch-primary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '10px' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '17px' }}>devices</span>
                            Modalidad de Entrega
                        </div>
                        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid var(--stitch-border)' }}>
                            {['Virtual', 'Fisico'].map(modo => (
                                <button key={modo} type="button" onClick={() => handleChange('modalidad', modo)}
                                    style={{ flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s ease', backgroundColor: form.modalidad === modo ? 'var(--stitch-secondary)' : '#F8FAFC', color: form.modalidad === modo ? '#FFFFFF' : 'var(--stitch-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <span className="material-icons-outlined" style={{ fontSize: '22px' }}>{modo === 'Virtual' ? 'laptop' : 'school'}</span>
                                    {modo === 'Virtual' ? 'Virtual' : 'Físico'}
                                </button>
                            ))}
                        </div>
                        <p style={{ margin: '12px 0 0', fontSize: '12px', color: '#64748B', lineHeight: '1.5' }}>
                            {form.modalidad === 'Virtual'
                                ? '📎 Se habilitará un cargador de archivos para el alumno en la plataforma.'
                                : '📋 Solo se mostrará la información en la agenda del alumno. Entrega presencial.'}
                        </p>
                    </div>

                    {/* Visibilidad */}
                    <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                        <div className="stitch-title-font" style={{ fontSize: '14px', fontWeight: '800', color: 'var(--stitch-primary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '10px' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '17px' }}>visibility</span>
                            Visibilidad para Alumnos
                        </div>
                        <div style={{ display: 'flex', borderRadius: '8px', overflow: 'hidden', border: '1.5px solid var(--stitch-border)' }}>
                            {[{ valor: true, label: 'Visible', icon: 'visibility' }, { valor: false, label: 'Oculta', icon: 'visibility_off' }].map(op => (
                                <button key={String(op.valor)} type="button" onClick={() => handleChange('visible', op.valor)}
                                    style={{ flex: 1, padding: '12px 8px', border: 'none', cursor: 'pointer', fontWeight: '700', fontSize: '13px', transition: 'all 0.2s ease', backgroundColor: form.visible === op.valor ? (op.valor ? 'var(--stitch-success)' : '#94A3B8') : '#F8FAFC', color: form.visible === op.valor ? '#FFFFFF' : 'var(--stitch-text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                    <span className="material-icons-outlined" style={{ fontSize: '22px' }}>{op.icon}</span>
                                    {op.label}
                                </button>
                            ))}
                        </div>
                        {!form.visible && (
                            <div style={{ marginTop: '14px', padding: '14px', backgroundColor: '#F8FAFC', borderRadius: '8px', border: '1px dashed var(--stitch-border)' }}>
                                <label className="stitch-label" style={{ marginBottom: '10px', fontSize: '12px', color: '#64748B' }}>
                                    Publicar automáticamente el:
                                </label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                                    <input type="date" value={form.fechaPublicacion}
                                        onChange={e => handleChange('fechaPublicacion', e.target.value)}
                                        className="stitch-input" style={{ fontSize: '13px' }} />
                                    <input type="time" value={form.horaPublicacion}
                                        onChange={e => handleChange('horaPublicacion', e.target.value)}
                                        className="stitch-input" style={{ fontSize: '13px' }} />
                                </div>
                                <p style={{ margin: '8px 0 0', fontSize: '11px', color: '#94A3B8' }}>
                                    Opcional. Si no se especifica, activa la visibilidad manualmente cuando corresponda.
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* SECCIÓN 5: RÚBRICAS */}
                <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', marginBottom: '20px' }}>
                    <div className="stitch-title-font" style={{ fontSize: '14px', fontWeight: '800', color: 'var(--stitch-primary)', textTransform: 'uppercase', letterSpacing: '0.6px', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '10px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '17px' }}>fact_check</span>
                        Rúbrica de Evaluación
                        <span style={{ fontWeight: '400', fontSize: '12px', color: 'var(--stitch-text-secondary)', marginLeft: '4px' }}>(opcional)</span>
                    </div>
                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '200px' }}>
                            <label className="stitch-label">Vincular rúbrica guardada</label>
                            <select value={form.rubroId} onChange={e => handleChange('rubroId', e.target.value)}
                                className="stitch-select">
                                <option value="">— Sin rúbrica —</option>
                                {rubricasFiltradas.map(rub => (
                                    <option key={rub.id} value={rub.id}>{rub.titulo}</option>
                                ))}
                            </select>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'flex-end' }}>
                            <button type="button" onClick={() => navigate('/rubricas', { state: { curso } })}
                                className="stitch-button-secondary" style={{ borderStyle: 'dashed' }}>
                                <span className="material-icons-outlined" style={{ fontSize: '17px' }}>add_chart</span>
                                Crear nueva rúbrica
                            </button>
                        </div>
                    </div>
                </div>

                {/* BOTÓN SUBMIT */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '40px' }}>
                    {modoEdicion && (
                        <button type="button" onClick={cancelarEdicion} className="stitch-button-secondary">
                            Cancelar
                        </button>
                    )}
                    <button type="submit" disabled={guardando} className="stitch-button"
                        style={{ padding: '13px 32px', fontSize: '15px', fontWeight: '700' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '19px' }}>
                            {guardando ? 'hourglass_top' : (modoEdicion ? 'save' : 'add_task')}
                        </span>
                        {guardando ? 'Guardando...' : (modoEdicion ? 'Guardar cambios' : 'Publicar actividad')}
                    </button>
                </div>
            </form>}

            {/* Visor de Entregas Virtuales (Modal de Auditoría de Archivos de Alumnos) */}
            {tareaEntregasSel && (
                <div className="stitch-modal-backdrop">
                    <div className="stitch-modal-content" style={{ width: '100%', maxWidth: '700px', padding: '24px', position: 'relative' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                            <div>
                                <h3 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '17px' }}>
                                    Entregas Recibidas — {tareaEntregasSel.titulo}
                                </h3>
                                <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--stitch-text-secondary)' }}>
                                    Modalidad Virtual · Valor de la Actividad: {tareaEntregasSel.ponderacion} pts
                                </p>
                            </div>
                            <button
                                onClick={() => setTareaEntregasSel(null)}
                                style={{ background: 'none', border: 'none', fontSize: '24px', cursor: 'pointer', color: 'var(--stitch-text-secondary)', lineHeight: 1 }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Listado de Entregas */}
                        <div style={{ maxHeight: '350px', overflowY: 'auto' }}>
                            {(ENTREGAS_SIMULADAS[tareaEntregasSel.id] || []).length === 0 ? (
                                <p style={{ margin: '20px 0', fontSize: '13px', color: 'var(--stitch-text-secondary)', fontStyle: 'italic', textAlign: 'center' }}>
                                    Ningún alumno ha entregado archivos para esta tarea aún.
                                </p>
                            ) : (
                                <table className="stitch-table">
                                    <thead>
                                        <tr>
                                            <th className="stitch-th">Estudiante</th>
                                            <th className="stitch-th">Fecha/Hora de Envío</th>
                                            <th className="stitch-th">Archivo Entregado</th>
                                            <th className="stitch-th" style={{ textAlign: 'center' }}>Estado</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(ENTREGAS_SIMULADAS[tareaEntregasSel.id] || []).map(envio => (
                                            <tr key={envio.id} className="stitch-tr-hover">
                                                <td className="stitch-td">
                                                    <strong>{envio.alumno}</strong>
                                                    <div style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)' }}>{envio.codigo}</div>
                                                </td>
                                                <td className="stitch-td" style={{ color: 'var(--stitch-text-secondary)' }}>
                                                    {envio.fecha}
                                                </td>
                                                <td className="stitch-td">
                                                    <a
                                                        href="#"
                                                        onClick={(e) => { e.preventDefault(); alert(`Descargando archivo simulado: ${envio.archivo}`); }}
                                                        style={{ color: 'var(--stitch-secondary)', fontWeight: '700', textDecoration: 'underline', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <span className="material-icons-outlined" style={{ fontSize: '15px' }}>download</span>
                                                        {envio.archivo}
                                                    </a>
                                                </td>
                                                <td className="stitch-td" style={{ textAlign: 'center' }}>
                                                    <span className="stitch-badge stitch-badge-success">
                                                        {envio.estado}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            )}
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px', borderTop: '1px solid var(--stitch-border)', paddingTop: '16px' }}>
                            <button
                                onClick={() => setTareaEntregasSel(null)}
                                className="stitch-button"
                                style={{ padding: '8px 18px' }}
                            >
                                Entendido
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* Modal de Confirmación de Eliminación Premium Stitch UI */}
            {tareaAEliminar && (
                <div className="stitch-modal-backdrop">
                    <div className="stitch-modal-content" style={{ width: '100%', maxWidth: '400px', padding: '24px', textAlign: 'center' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '48px', color: 'var(--stitch-danger)', marginBottom: '16px' }}>
                            warning
                        </span>
                        <h3 className="stitch-title-font" style={{ margin: '0 0 10px', color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '18px' }}>
                            ¿Confirmas eliminar esta actividad?
                        </h3>
                        <p style={{ fontSize: '14px', color: 'var(--stitch-text-secondary)', margin: '0 0 24px', lineHeight: '1.5' }}>
                            Esta acción no se puede deshacer y desvinculará todas las entregas asociadas.
                        </p>
                        <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
                            <button type="button" onClick={() => setTareaAEliminar(null)} className="stitch-button-secondary">
                                Cancelar
                            </button>
                            <button type="button" onClick={ejecutarEliminar} className="stitch-button" style={{ backgroundColor: 'var(--stitch-danger)' }}>
                                Eliminar Actividad
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
