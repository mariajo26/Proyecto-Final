import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

export default function ForosComunidad() {
    const { usuario, token } = useAuth();
    const [foros, setForos] = useState([]);
    const [foroSeleccionado, setForoSeleccionado] = useState(null);
    const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');
    const [criterioOrden, setCriterioOrden] = useState('recientes');
    
    // Estados para crear un nuevo hilo/foro
    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [nuevaCategoria, setNuevaCategoria] = useState('Hilos de Curso');
    const [nuevaMateria, setNuevaMateria] = useState('Física General');
    const [nuevoContenido, setNuevoContenido] = useState('');
    const [nuevoHiloAdjuntos, setNuevoHiloAdjuntos] = useState([]);
    const [mostrarCreador, setMostrarCreador] = useState(false);

    // Estados para nuevo comentario en el hilo activo
    const [nuevoComentarioText, setNuevoComentarioText] = useState('');
    const [comentarioAdjuntos, setComentarioAdjuntos] = useState([]);

    const fileInputRef = useRef(null);
    const fileInputCommentRef = useRef(null);

    // Cargar hilos de discusión en tiempo real desde MongoDB
    useEffect(() => {
        if (!token) return;
        
        fetch('/api/comunicacion/hilos', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setForos(data);
                if (data.length > 0 && !foroSeleccionado) {
                    setForoSeleccionado(data[0]);
                }
            }
        })
        .catch(err => console.error('Error al cargar hilos de discusión:', err));
    }, [token]);

    // -------------------------------------------------------------------------
    // LÓGICA DE DETECCIÓN DE PERMISOS
    // -------------------------------------------------------------------------
    const esCreadorOModerador = (foro) => {
        if (!foro) return false;
        return usuario?.rol === 'Profesor' && foro.categoria !== 'Institucional';
    };

    // -------------------------------------------------------------------------
    // HANDLERS: CREACIÓN DE HILOS Y SUBFOROS
    // -------------------------------------------------------------------------
    const handleCargarArchivosHilo = (e) => {
        const files = Array.from(e.target.files).map(f => f.name);
        setNuevoHiloAdjuntos(prev => [...prev, ...files]);
    };

    const handleCrearHilo = (e) => {
        e.preventDefault();
        if (!nuevoTitulo.trim() || !nuevoContenido.trim()) {
            alert('Por favor complete el título y contenido del hilo.');
            return;
        }

        fetch('/api/comunicacion/hilos', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                titulo: nuevoTitulo,
                contenido: nuevoContenido,
                categoria: nuevaCategoria,
                materia: nuevaMateria
            })
        })
        .then(res => res.json())
        .then(savedHilo => {
            const nuevoForo = {
                id: savedHilo._id,
                titulo: nuevoTitulo,
                categoria: nuevaCategoria,
                materia: nuevaCategoria !== 'Grado y Sección' ? nuevaMateria : undefined,
                seccion: nuevaCategoria === 'Grado y Sección' ? '4to Bachillerato A' : undefined,
                autor: usuario?.nombre || 'Profesor Autenticado',
                creador_id: usuario?.codigo_ua,
                archivado: false,
                comentariosBloqueados: false,
                adjuntos: nuevoHiloAdjuntos,
                mensajes: [
                    { id: savedHilo._id, autor: usuario?.nombre || 'Profesor Autenticado', texto: nuevoContenido, fecha: new Date().toISOString().replace('T', ' ').substring(0, 16) }
                ]
            };

            setForos(prev => [nuevoForo, ...prev]);
            setForoSeleccionado(nuevoForo);
            setNuevoTitulo('');
            setNuevoContenido('');
            setNuevoHiloAdjuntos([]);
            setMostrarCreador(false);
        })
        .catch(err => console.error('Error al crear hilo:', err));
    };

    // -------------------------------------------------------------------------
    // HANDLERS: RESPUESTAS Y COMENTARIOS
    // -------------------------------------------------------------------------
    const handleCargarArchivosComentario = (e) => {
        const files = Array.from(e.target.files).map(f => f.name);
        setComentarioAdjuntos(prev => [...prev, ...files]);
    };

    const handleEnviarComentario = (e) => {
        e.preventDefault();
        if (!nuevoComentarioText.trim() || !foroSeleccionado) return;

        const contenido = nuevoComentarioText.trim();
        setNuevoComentarioText('');
        setComentarioAdjuntos([]);

        fetch(`/api/comunicacion/hilos/${foroSeleccionado.id}/comentarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ contenido })
        })
        .then(res => res.json())
        .then(savedComment => {
            const nuevoCom = {
                id: savedComment._id,
                autor: usuario?.nombre || 'Usuario Autenticado',
                autor_id: usuario?.codigo_ua,
                texto: contenido,
                fecha: new Date().toISOString().replace('T', ' ').substring(0, 16)
            };

            const forosActualizados = foros.map(f => {
                if (f.id === foroSeleccionado.id) {
                    const foroUpd = { ...f, mensajes: [...f.mensajes, nuevoCom] };
                    setForoSeleccionado(foroUpd);
                    return foroUpd;
                }
                return f;
            });

            setForos(forosActualizados);
        })
        .catch(err => console.error('Error al enviar comentario:', err));
    };

    // -------------------------------------------------------------------------
    // HERRAMIENTAS DE MODERACIÓN (Solo permitidas si es Creador/Moderador)
    // -------------------------------------------------------------------------
    const handleToggleBloqueoComentarios = () => {
        if (!esCreadorOModerador(foroSeleccionado)) return;

        // ---------------------------------------------------------------------
        // BACKEND QUERY (UPDATE ESTADO HILO)
        // ---------------------------------------------------------------------
        /* 
           UPDATE foros_hilos SET comentarios_bloqueados = $1 WHERE id = $2;
        */
        const bloqueado = !foroSeleccionado.comentariosBloqueados;
        console.log(`[BACKEND] Cambiando estado de bloqueo de comentarios a ${bloqueado} en hilo ${foroSeleccionado.id}`);

        const forosActualizados = foros.map(f => {
            if (f.id === foroSeleccionado.id) {
                const foroUpd = { ...f, comentariosBloqueados: bloqueado };
                setForoSeleccionado(foroUpd);
                return foroUpd;
            }
            return f;
        });
        setForos(forosActualizados);
    };

    const handleToggleArchivarHilo = () => {
        if (!esCreadorOModerador(foroSeleccionado)) return;

        // ---------------------------------------------------------------------
        // BACKEND QUERY (UPDATE ESTADO ARCHIVADO)
        // ---------------------------------------------------------------------
        /* 
           UPDATE foros_hilos SET archivado = $1 WHERE id = $2;
        */
        const archivado = !foroSeleccionado.archivado;
        console.log(`[BACKEND] Cambiando estado de archivado a ${archivado} en hilo ${foroSeleccionado.id}`);

        const forosActualizados = foros.map(f => {
            if (f.id === foroSeleccionado.id) {
                const foroUpd = { ...f, archivado: archivado };
                setForoSeleccionado(foroUpd);
                return foroUpd;
            }
            return f;
        });
        setForos(forosActualizados);
    };

    const handleEliminarComentario = (msgId) => {
        if (!esCreadorOModerador(foroSeleccionado)) return;
        if (!window.confirm('¿Está seguro de eliminar de forma definitiva esta respuesta del hilo?')) return;

        // ---------------------------------------------------------------------
        // BACKEND QUERY (DELETE COMENTARIO)
        // ---------------------------------------------------------------------
        /* 
           DELETE FROM foros_mensajes WHERE id = $1;
        */
        console.log(`[BACKEND] Eliminando comentario ID ${msgId} en hilo ${foroSeleccionado.id}`);

        const forosActualizados = foros.map(f => {
            if (f.id === foroSeleccionado.id) {
                const foroUpd = { ...f, mensajes: f.mensajes.filter(m => m.id !== msgId) };
                setForoSeleccionado(foroUpd);
                return foroUpd;
            }
            return f;
        });
        setForos(forosActualizados);
    };

    const handleEliminarForoCompleto = (foroId) => {
        if (!window.confirm('¿Desea eliminar definitivamente todo este hilo de conversación y sus mensajes asociados?')) return;

        // ---------------------------------------------------------------------
        // BACKEND QUERY (DELETE HILO)
        // ---------------------------------------------------------------------
        /* 
           DELETE FROM foros_hilos WHERE id = $1;
        */
        console.log(`[BACKEND] Eliminando foro ID ${foroId}`);

        const forosActualizados = foros.filter(f => f.id !== foroId);
        setForos(forosActualizados);
        setForoSeleccionado(forosActualizados[0] || null);
    };

    // -------------------------------------------------------------------------
    // FILTROS Y ORDENAMIENTO DINÁMICOS POR ROL
    // -------------------------------------------------------------------------
    const getTabsPorRol = useCallback(() => {
        if (usuario?.rol === 'Profesor') return ['Todos', 'Institucional', 'Grado y Sección', 'Hilos de Curso', 'Foros de Tareas en Grupo'];
        if (usuario?.rol === 'Estudiante') return ['Institucional', 'Hilos de Curso', 'Foros de Tareas en Grupo'];
        if (usuario?.rol === 'Control Academico') return ['Institucional', 'Alumnos', 'Profesores'];
        if (usuario?.rol === 'Encargado') return ['Institucional', 'Grados'];
        return ['Todos'];
    }, [usuario]);

    const tabsDisponibles = getTabsPorRol();

    // Sincronizar filtro por defecto si el rol no tiene la opción 'Todos'
    useEffect(() => {
        if (tabsDisponibles.length > 0 && !tabsDisponibles.includes(categoriaFiltro)) {
            setFiltroCategoria(tabsDisponibles[0]);
        }
    }, [tabsDisponibles, categoriaFiltro]);

    const setFiltroCategoria = (cat) => {
        setCategoriaFiltro(cat);
    };

    const getIntegrantesForo = (foro) => {
        if (!foro) return [];
        if (foro.categoria === 'Institucional') {
            return [
                { nombre: 'Secretaría Académica', rol: 'Administrativo', iniciales: 'SA' },
                { nombre: 'Carlos Gómez Estrada', rol: 'Profesor', iniciales: 'CG' },
                { nombre: 'Sofía López Alvarado', rol: 'Profesor', iniciales: 'SL' },
                { nombre: 'Jorge Diaz Herrera', rol: 'Profesor', iniciales: 'JD' },
                { nombre: 'Andrea Mendez Silva', rol: 'Estudiante', iniciales: 'AM' },
                { nombre: 'Jose Ortega Cruz', rol: 'Estudiante', iniciales: 'JO' }
            ];
        }
        if (foro.categoria === 'Grado y Sección' || foro.categoria === 'Grados') {
            return [
                { nombre: 'Carlos Gómez Estrada', rol: 'Profesor Guía', iniciales: 'CG' },
                { nombre: 'Luisa Ortega Cruz', rol: 'Tutor / Encargado', iniciales: 'LO' },
                { nombre: 'Roberto Mendez Silva', rol: 'Tutor / Encargado', iniciales: 'RM' },
                { nombre: 'Andrea Mendez Silva', rol: 'Estudiante', iniciales: 'AM' },
                { nombre: 'Jose Ortega Cruz', rol: 'Estudiante', iniciales: 'JO' }
            ];
        }
        return [
            { nombre: 'Carlos Gómez Estrada', rol: 'Profesor', iniciales: 'CG' },
            { nombre: 'Andrea Mendez Silva', rol: 'Estudiante', iniciales: 'AM' },
            { nombre: 'Jose Ortega Cruz', rol: 'Estudiante', iniciales: 'JO' }
        ];
    };

    const forosFiltrados = foros.filter(f => {
        if (categoriaFiltro === 'Todos') return true;
        if (f.categoria === categoriaFiltro) return true;
        if (categoriaFiltro === 'Grados' && f.categoria === 'Grado y Sección') return true;
        if (categoriaFiltro === 'Alumnos' && (f.categoria === 'Hilos de Curso' || f.categoria === 'Foros de Tareas en Grupo')) return true;
        if (categoriaFiltro === 'Profesores' && f.categoria === 'Grado y Sección') return true;
        return false;
    });

    const forosOrdenados = [...forosFiltrados].sort((a, b) => {
        if (criterioOrden === 'recientes') {
            return b.id.localeCompare(a.id);
        } else if (criterioOrden === 'alfa-asc') {
            return a.titulo.localeCompare(b.titulo);
        } else if (criterioOrden === 'alfa-desc') {
            return b.titulo.localeCompare(a.titulo);
        }
        return 0;
    });

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
                    forum
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#93C5FD', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '14px' }}>groups</span>
                        Entorno Social e Interacción
                    </span>
                    <h2 style={{ color: '#FFFFFF', fontWeight: '800', margin: '4px 0 0 0', fontSize: '24px', fontFamily: 'Outfit, sans-serif' }}>
                        Foros y Comunidad Docente
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Participa en canales institucionales, conversa con padres de familia y modera foros colaborativos.
                    </p>
                </div>
            </div>

            {/* ── FILTROS Y BOTÓN NUEVO HILO ────────────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                <div className="stitch-tabs-container" style={{ marginBottom: 0 }}>
                    {tabsDisponibles.map(cat => (
                        <button
                            key={cat}
                            onClick={() => setCategoriaFiltro(cat)}
                            className={`stitch-tab-btn ${categoriaFiltro === cat ? 'stitch-tab-btn-active' : ''}`}
                            style={{ padding: '8px 14px', fontSize: '12px' }}
                        >
                            {cat}
                        </button>
                    ))}
                </div>

                {usuario?.rol === 'Profesor' && (
                    <button
                        onClick={() => setMostrarCreador(!mostrarCreador)}
                        className="stitch-button"
                    >
                        <span className="material-icons-outlined">add_circle</span>
                        Crear Nuevo Hilo / Canal
                    </button>
                )}
            </div>

            {/* ── FORMULARIO: CREACIÓN DE NUEVO HILO ────────────────────────── */}
            {mostrarCreador && (
                <form onSubmit={handleCrearHilo} className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', marginBottom: '28px' }}>
                    <h3 className="stitch-title-font" style={{ margin: '0 0 16px 0', color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '15px' }}>
                        Diseño de Nuevo Hilo Temático
                    </h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '16px', marginBottom: '16px' }}>
                        <div>
                            <label className="stitch-label">Título del Hilo *</label>
                            <input type="text" required value={nuevoTitulo} onChange={e => setNuevoTitulo(e.target.value)} className="stitch-input" placeholder="Ej: Dudas sobre Examen Final" />
                        </div>
                        <div>
                            <label className="stitch-label">Categoría / Ámbito *</label>
                            <select value={nuevaCategoria} onChange={e => setNuevaCategoria(e.target.value)} className="stitch-select">
                                <option value="Hilos de Curso">Hilos de Curso (Mis Alumnos)</option>
                                <option value="Foros de Tareas en Grupo">Tareas en Grupo (Equipos Colaborativos)</option>
                                <option value="Grado y Sección">Grado y Sección (Padres de Familia)</option>
                            </select>
                        </div>
                        <div>
                            <label className="stitch-label">Materia Relacionada</label>
                            <input type="text" value={nuevaMateria} onChange={e => setNuevaMateria(e.target.value)} className="stitch-input" placeholder="Ej: Física II" disabled={nuevaCategoria === 'Grado y Sección'} />
                        </div>
                    </div>

                    <div style={{ marginBottom: '16px' }}>
                        <label className="stitch-label">Contenido Inicial / Planteamiento *</label>
                        <textarea required rows={4} value={nuevoContenido} onChange={e => setNuevoContenido(e.target.value)} className="stitch-textarea" placeholder="Escribe las instrucciones iniciales, pregunta disparadora o aviso..." />
                    </div>

                    {/* Subida de Archivos en el Creador */}
                    <div style={{ marginBottom: '20px' }}>
                        <label className="stitch-label">Adjuntar Material de Apoyo (Imágenes o PDF)</label>
                        <input type="file" ref={fileInputRef} multiple onChange={handleCargarArchivosHilo} style={{ display: 'none' }} />
                        <button type="button" onClick={() => fileInputRef.current.click()} className="stitch-button-secondary" style={{ borderStyle: 'dashed', fontSize: '12px', padding: '8px 14px' }}>
                            Seleccionar Archivos
                        </button>
                        {nuevoHiloAdjuntos.length > 0 && (
                            <div style={{ marginTop: '8px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                {nuevoHiloAdjuntos.map((n, i) => (
                                    <span key={i} className="stitch-badge stitch-badge-neutral" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        <span className="material-icons-outlined" style={{ fontSize: '14px' }}>description</span>
                                        {n}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                        <button type="button" onClick={() => setMostrarCreador(false)} className="stitch-button-secondary">Cancelar</button>
                        <button type="submit" className="stitch-button" style={{ padding: '8px 20px' }}>Publicar Hilo</button>
                    </div>
                </form>
            )}

            {/* ── CUERPO PRINCIPAL DEL MÓDULO (GRID) ────────────────────────── */}
            <div style={{ display: 'grid', gridTemplateColumns: '300px 1fr', gap: '24px', alignItems: 'start' }}>
                
                {/* LISTA LATERAL DE HILOS */}
                <div className="stitch-card" style={{ padding: '16px', backgroundColor: '#FFFFFF', maxHeight: '70vh', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                        <h3 className="stitch-title-font" style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: 'var(--stitch-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            Hilos Abiertos
                        </h3>
                        <select 
                            value={criterioOrden} 
                            onChange={e => setCriterioOrden(e.target.value)}
                            style={{
                                padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--stitch-border)',
                                fontSize: '11px', cursor: 'pointer', outline: 'none'
                            }}
                        >
                            <option value="recientes">Recientes</option>
                            <option value="alfa-asc">A-Z</option>
                            <option value="alfa-desc">Z-A</option>
                        </select>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        {forosOrdenados.map(f => {
                            const esSel = f.id === foroSeleccionado?.id;
                            return (
                                <div
                                    key={f.id}
                                    onClick={() => setForoSeleccionado(f)}
                                    className="stitch-card"
                                    style={{
                                        padding: '12px',
                                        cursor: 'pointer',
                                        border: esSel ? '1.5px solid var(--stitch-secondary)' : '1.5px solid var(--stitch-border)',
                                        backgroundColor: esSel ? 'rgba(59,130,246,0.03)' : '#FFFFFF',
                                    }}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                        <span className={`stitch-badge ${f.categoria === 'Institucional' ? 'stitch-badge-neutral' : 'stitch-badge-info'}`} style={{ fontSize: '9px', padding: '2px 6px' }}>
                                            {f.categoria}
                                        </span>
                                        {f.archivado && (
                                            <span className="stitch-badge stitch-badge-neutral" style={{ fontSize: '9px', padding: '2px 4px' }}>
                                                Archivado
                                            </span>
                                        )}
                                    </div>
                                    <h4 className="stitch-title-font" style={{ margin: 0, fontSize: '13px', fontWeight: '700', color: 'var(--stitch-text-primary)', lineHeight: '1.4' }}>
                                        {f.titulo}
                                    </h4>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '10px', fontSize: '10px', color: 'var(--stitch-text-secondary)' }}>
                                        <span>{f.materia || f.seccion || 'Colegio'}</span>
                                        <span>{f.mensajes.length} respuestas</span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* HILO DE CONVERSACIÓN SELECCIONADO (DETALLE) */}
                {foroSeleccionado ? (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 220px', gap: '24px', alignItems: 'start' }}>
                        <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            
                            {/* Cabecera del Hilo Detallado */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '16px' }}>
                                <div>
                                    <h3 className="stitch-title-font" style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--stitch-primary)' }}>
                                        {foroSeleccionado.titulo}
                                    </h3>
                                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--stitch-text-secondary)' }}>
                                        Iniciado por <strong>{foroSeleccionado.autor}</strong> · Ámbito: {foroSeleccionado.categoria}
                                    </p>
                                </div>

                                {/* Controles de Moderación Docente */}
                                {esCreadorOModerador(foroSeleccionado) && (
                                    <div style={{ display: 'flex', gap: '8px' }}>
                                        <button
                                            onClick={handleToggleBloqueoComentarios}
                                            className="stitch-button-secondary"
                                            style={{ fontSize: '12px', padding: '6px 12px' }}
                                        >
                                            <span className="material-icons-outlined" style={{ fontSize: '15px' }}>
                                                {foroSeleccionado.comentariosBloqueados ? 'lock_open' : 'lock'}
                                            </span>
                                            {foroSeleccionado.comentariosBloqueados ? 'Habilitar Respuestas' : 'Cerrar Comentarios'}
                                        </button>
                                        <button
                                            onClick={handleToggleArchivarHilo}
                                            className="stitch-button-secondary"
                                            style={{ fontSize: '12px', padding: '6px 12px' }}
                                        >
                                            <span className="material-icons-outlined" style={{ fontSize: '15px' }}>archive</span>
                                            {foroSeleccionado.archivado ? 'Desarchivar' : 'Archivar'}
                                        </button>
                                        <button
                                            onClick={() => handleEliminarForoCompleto(foroSeleccionado.id)}
                                            className="stitch-button-secondary"
                                            style={{ fontSize: '12px', padding: '6px 12px', backgroundColor: '#FFF5F5', border: '1px solid #FECACA', color: 'var(--stitch-danger)' }}
                                        >
                                            <span className="material-icons-outlined" style={{ fontSize: '15px' }}>delete</span>
                                            Eliminar Foro
                                        </button>
                                    </div>
                                )}
                            </div>

                            {/* Mensajes del Hilo */}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '400px', overflowY: 'auto', paddingRight: '6px' }}>
                                {foroSeleccionado.mensajes.map((msg, i) => {
                                    const esMensajeDocente = msg.autor === 'Profesor Autenticado' || msg.autor === usuario?.nombre;
                                    return (
                                        <div
                                            key={msg.id}
                                            style={{
                                                padding: '16px',
                                                borderRadius: '8px',
                                                backgroundColor: esMensajeDocente ? 'rgba(59,130,246,0.03)' : '#F8FAFC',
                                                border: `1.5px solid ${esMensajeDocente ? 'rgba(59,130,246,0.1)' : 'var(--stitch-border)'}`,
                                                alignSelf: 'stretch'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                                <span style={{ fontWeight: '700', fontSize: '13px', color: esMensajeDocente ? 'var(--stitch-secondary)' : 'var(--stitch-text-primary)' }}>
                                                    {msg.autor}
                                                    {msg.autor === usuario?.nombre && <small style={{ fontWeight: '600', color: '#64748B', marginLeft: '6px' }}>(Tú)</small>}
                                                </span>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                    <span style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)' }}>{msg.fecha}</span>
                                                    {/* Eliminar Comentario Individual si es Moderador */}
                                                    {esCreadorOModerador(foroSeleccionado) && i > 0 && (
                                                        <button
                                                            onClick={() => handleEliminarComentario(msg.id)}
                                                            style={{ border: 'none', background: 'none', color: 'var(--stitch-danger)', cursor: 'pointer', padding: '2px', display: 'inline-flex' }}
                                                            title="Eliminar comentario"
                                                        >
                                                            <span className="material-icons-outlined" style={{ fontSize: '15px' }}>close</span>
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '13px', lineHeight: '1.5', color: 'var(--stitch-text-primary)' }}>
                                                {msg.texto}
                                            </p>

                                            {/* Adjuntos en el Comentario */}
                                            {msg.adjuntos && msg.adjuntos.length > 0 && (
                                                <div style={{ marginTop: '12px', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                                    {msg.adjuntos.map((file, fIdx) => (
                                                        <a
                                                            key={fIdx}
                                                            href="#"
                                                            onClick={e => { e.preventDefault(); alert(`Descargando archivo adjunto del foro: ${file}`); }}
                                                            style={{ fontSize: '11px', backgroundColor: '#FFFFFF', padding: '4px 8px', borderRadius: '4px', border: '1px solid var(--stitch-border)', color: 'var(--stitch-secondary)', display: 'inline-flex', alignItems: 'center', gap: '4px', textDecoration: 'none', fontWeight: '700' }}
                                                        >
                                                            <span className="material-icons-outlined" style={{ fontSize: '14px' }}>download</span>
                                                            {file}
                                                        </a>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Caja de Comentarios (Habilitada o deshabilitada según moderación) */}
                            {foroSeleccionado.comentariosBloqueados ? (
                                <div className="stitch-alert stitch-alert-danger" style={{ margin: 0, justifyContent: 'center', fontWeight: '700' }}>
                                    <span className="material-icons-outlined">lock</span>
                                    La caja de comentarios ha sido cerrada y bloqueada por el moderador del foro.
                                </div>
                            ) : (
                                <form onSubmit={handleEnviarComentario} style={{ borderTop: '1px solid var(--stitch-border)', paddingTop: '16px' }}>
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                            <textarea
                                                required
                                                rows={2}
                                                value={nuevoComentarioText}
                                                onChange={e => setNuevoComentarioText(e.target.value)}
                                                className="stitch-textarea"
                                                placeholder="Escribe una respuesta técnica o comentario..."
                                            />
                                            
                                            {/* Carga de Archivo Adjunto en Comentario */}
                                            <div>
                                                <input type="file" ref={fileInputCommentRef} multiple onChange={handleCargarArchivosComentario} style={{ display: 'none' }} />
                                                <button
                                                    type="button"
                                                    onClick={() => fileInputCommentRef.current.click()}
                                                    style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', background: 'none', color: 'var(--stitch-secondary)', fontWeight: '700', fontSize: '11px', cursor: 'pointer', padding: '2px' }}
                                                >
                                                    <span className="material-icons-outlined" style={{ fontSize: '14px' }}>attach_file</span>
                                                    Adjuntar imagen/PDF a la respuesta
                                                </button>
                                                {comentarioAdjuntos.length > 0 && (
                                                    <div style={{ display: 'inline-flex', gap: '4px', marginLeft: '10px' }}>
                                                        {comentarioAdjuntos.map((n, i) => (
                                                            <span key={i} className="stitch-badge stitch-badge-neutral" style={{ fontSize: '10px' }}>
                                                                {n}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <button type="submit" className="stitch-button" style={{ height: '42px', padding: '0 24px' }}>
                                            Responder
                                        </button>
                                    </div>
                                </form>
                            )}

                        </div>

                        {/* LISTA DE INTEGRANTES */}
                        <div className="stitch-card" style={{ padding: '20px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '70vh', overflowY: 'auto' }}>
                            <h3 className="stitch-title-font" style={{ margin: 0, fontSize: '13px', fontWeight: '800', color: 'var(--stitch-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Integrantes ({getIntegrantesForo(foroSeleccionado).length})
                            </h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                {getIntegrantesForo(foroSeleccionado).map((member, mIdx) => (
                                    <div key={mIdx} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                        <div style={{
                                            width: '32px', height: '32px', borderRadius: '50%',
                                            backgroundColor: member.rol === 'Profesor' || member.rol === 'Profesor Guía' ? 'var(--stitch-primary, #0D2C54)' : '#3B82F6',
                                            color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            fontWeight: '700', fontSize: '12px'
                                        }}>
                                            {member.iniciales}
                                        </div>
                                        <div style={{ display: 'flex', flexDirection: 'column', textAlign: 'left' }}>
                                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--stitch-text-primary)' }}>{member.nombre}</span>
                                            <span style={{ fontSize: '10px', color: 'var(--stitch-text-secondary, #64748B)' }}>{member.rol}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--stitch-text-secondary)' }}>
                        Seleccione un foro del catálogo lateral para participar.
                    </div>
                )}

            </div>

            {/* ───────────────────────────────────────────────────────────────
                ESTRUCTURA DE MODELO DE DATOS RECOMENDADA (DOCUMENTACIÓN DE BD)
            ────────────────────────────────────────────────────────────────
                * SQL Relacional:
                  - Tabla: foros_canales (id, titulo, categoria, curso_id, seccion_id, profesor_guia_id, creado_por, archivado, comentarios_bloqueados, created_at)
                    Restricción: SELECT * FROM foros_canales WHERE profesor_guia_id = :profesorId OR curso_id IN (SELECT id FROM cursos WHERE profesor_id = :profesorId) OR categoria = 'Institucional';
                  - Tabla: foros_mensajes (id, canal_id, autor_id, texto, adjuntos_json, created_at)
            ──────────────────────────────────────────────────────────────── */}
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
