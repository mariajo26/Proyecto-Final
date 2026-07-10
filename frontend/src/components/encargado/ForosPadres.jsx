import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

// Hilos iniciales del foro de padres para que el espacio no se vea vacío
const HILOS_INICIALES_PADRES = [
    {
        id: 'hilo-1',
        titulo: 'Coordinación de Uniformes para Evento del Aniversario',
        categoria: 'Organización de Grado',
        autor: 'Sra. Elizabeth Flores (Madre de María José)',
        autor_rol: 'Madre / Encargada',
        fecha: '2026-07-09 08:30',
        contenido: 'Buenos días a todos los padres de familia. Abro este espacio para coordinar la compra y tallas de los uniformes especiales para la presentación de gimnasia en el aniversario del colegio de la próxima semana. Favor confirmar sus pedidos aquí.',
        mensajes: [
            {
                id: 'msg-1-1',
                autor: 'Sra. Claudia Castro (Madre de Sofía)',
                autor_rol: 'Madre / Encargada',
                texto: '¡Excelente iniciativa! Yo ya solicité la talla M para Sofía. ¿Alguien sabe la fecha límite para el pago?',
                fecha: '2026-07-09 09:15'
            },
            {
                id: 'msg-1-2',
                autor: 'Sr. Roberto Ortiz (Padre de Diego)',
                autor_rol: 'Padre / Encargado',
                texto: 'Según la circular enviada por secretaría, la fecha límite es el viernes 17 de julio.',
                fecha: '2026-07-09 10:45'
            }
        ]
    },
    {
        id: 'hilo-2',
        titulo: 'Dudas sobre el Temario del Examen Trimestral de Física',
        categoria: 'Tareas y Evaluaciones',
        autor: 'Sr. Roberto Ortiz (Padre de Diego)',
        autor_rol: 'Padre / Encargado',
        fecha: '2026-07-08 14:20',
        contenido: 'Estimados padres, quería saber si a sus hijos les compartieron la guía de estudio para el examen de física general del profesor Carlos Gómez. Diego comenta que le falta copiar la última sección de electromagnetismo.',
        mensajes: [
            {
                id: 'msg-2-1',
                autor: 'Sra. Elizabeth Flores (Madre de María José)',
                autor_rol: 'Madre / Encargada',
                texto: 'Hola Roberto, sí. María José tiene la hoja del temario completo. Voy a escanearla y la compartiré en este foro en unos minutos.',
                fecha: '2026-07-08 15:05'
            }
        ]
    },
    {
        id: 'hilo-3',
        titulo: 'Propuesta de Reunión Virtual de Padres de 4to Bachillerato',
        categoria: 'General',
        autor: 'Sra. Claudia Castro (Madre de Sofía)',
        autor_rol: 'Madre / Encargada',
        fecha: '2026-07-07 10:00',
        contenido: 'Hola a todos, considero que sería de mucha ayuda tener una breve sesión por videollamada para organizarnos con respecto al convivio de fin de trimestre. Propongo este sábado por la tarde. ¿Qué opinan?',
        mensajes: []
    }
];

export default function ForosPadres() {
    const { usuario } = useAuth();
    const [hilos, setHilos] = useState(() => {
        const saved = localStorage.getItem('stitch_foros_padres_hilos');
        return saved ? JSON.parse(saved) : HILOS_INICIALES_PADRES;
    });

    const [hiloSeleccionado, setHiloSeleccionado] = useState(null);
    const [categoriaFiltro, setCategoriaFiltro] = useState('Todos');
    const [mostrarCreador, setMostrarCreador] = useState(false);

    // Inputs nuevo Hilo
    const [nuevoTitulo, setNuevoTitulo] = useState('');
    const [nuevaCategoria, setNuevaCategoria] = useState('General');
    const [nuevoContenido, setNuevoContenido] = useState('');

    // Input nuevo Comentario
    const [nuevoComentarioText, setNuevoComentarioText] = useState('');

    useEffect(() => {
        localStorage.setItem('stitch_foros_padres_hilos', JSON.stringify(hilos));
    }, [hilos]);

    // Inicializar hilo seleccionado
    useEffect(() => {
        if (hilos.length > 0 && !hiloSeleccionado) {
            setHiloSeleccionado(hilos[0]);
        }
    }, [hilos, hiloSeleccionado]);

    // Filtrar hilos
    const hilosFiltrados = hilos.filter(h => {
        if (categoriaFiltro === 'Todos') return true;
        return h.categoria === categoriaFiltro;
    });

    const handleCrearHilo = (e) => {
        e.preventDefault();
        if (!nuevoTitulo.trim() || !nuevoContenido.trim()) {
            alert('Por favor complete todos los campos obligatorios.');
            return;
        }

        const nuevoHilo = {
            id: `hilo-${Date.now()}`,
            titulo: nuevoTitulo.trim(),
            categoria: nuevaCategoria,
            autor: usuario?.nombre || 'Tutor Autenticado',
            autor_rol: 'Tutor / Encargado',
            fecha: new Date().toISOString().replace('T', ' ').substring(0, 16),
            contenido: nuevoContenido.trim(),
            mensajes: []
        };

        setHilos(prev => [nuevoHilo, ...prev]);
        setHiloSeleccionado(nuevoHilo);
        setNuevoTitulo('');
        setNuevoContenido('');
        setNuevaCategoria('General');
        setMostrarCreador(false);
    };

    const handleEnviarComentario = (e) => {
        e.preventDefault();
        if (!nuevoComentarioText.trim() || !hiloSeleccionado) return;

        const nuevoMsg = {
            id: `msg-${Date.now()}`,
            autor: usuario?.nombre || 'Tutor Autenticado',
            autor_rol: 'Tutor / Encargado',
            texto: nuevoComentarioText.trim(),
            fecha: new Date().toISOString().replace('T', ' ').substring(0, 16)
        };

        const hilosActualizados = hilos.map(h => {
            if (h.id === hiloSeleccionado.id) {
                const hActualizado = { ...h, mensajes: [...h.mensajes, nuevoMsg] };
                setHiloSeleccionado(hActualizado);
                return hActualizado;
            }
            return h;
        });

        setHilos(hilosActualizados);
        setNuevoComentarioText('');
    };

    return (
        <div style={{ fontFamily: 'var(--stitch-font)', padding: '4px' }}>
            
            {/* ── CABECERA PREMIUM STITCH UI ── */}
            <div style={{
                background: 'linear-gradient(135deg, #1e3a8a 0%, #3b82f6 100%)',
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
                        Comunidad y Foros de Padres
                    </span>
                    <h2 style={{ color: '#FFFFFF', fontWeight: '800', margin: '4px 0 0 0', fontSize: '24px', fontFamily: 'Outfit, sans-serif' }}>
                        Foro Exclusivo de Padres y Tutores
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Interactúa, coordina actividades, resuelve dudas sobre tareas y mantente en comunicación con la comunidad del grado.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={() => setMostrarCreador(true)}
                    className="stitch-button"
                    style={{
                        backgroundColor: '#FFFFFF',
                        color: '#1e3a8a',
                        fontWeight: '700',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '10px 20px',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        zIndex: 1
                    }}
                >
                    <span className="material-icons-outlined">add_comment</span>
                    Nuevo Tema de Discusión
                </button>
            </div>

            {/* ── MENÚ DE CATEGORÍAS (TABS) ── */}
            <div className="stitch-tabs-container" style={{ marginBottom: '24px' }}>
                {['Todos', 'General', 'Tareas y Evaluaciones', 'Organización de Grado'].map(cat => (
                    <button
                        key={cat}
                        type="button"
                        onClick={() => setCategoriaFiltro(cat)}
                        className={`stitch-tab-btn ${categoriaFiltro === cat ? 'stitch-tab-btn-active' : ''}`}
                    >
                        {cat}
                    </button>
                ))}
            </div>

            {/* ── CUERPO PRINCIPAL (DOS COLUMNAS) ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '24px', alignItems: 'start' }}>
                
                {/* COLUMNA 1: LISTADO DE HILOS */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--stitch-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Temas Disponibles ({hilosFiltrados.length})
                    </div>
                    {hilosFiltrados.length === 0 ? (
                        <div className="stitch-card" style={{ padding: '24px', textAlign: 'center', color: 'var(--stitch-text-secondary)' }}>
                            No hay temas creados en esta categoría.
                        </div>
                    ) : (
                        hilosFiltrados.map(h => {
                            const esActivo = hiloSeleccionado?.id === h.id;
                            return (
                                <div
                                    key={h.id}
                                    onClick={() => setHiloSeleccionado(h)}
                                    className="stitch-card stitch-tr-hover"
                                    style={{
                                        padding: '18px',
                                        cursor: 'pointer',
                                        backgroundColor: esActivo ? 'rgba(59,130,246,0.06)' : '#FFFFFF',
                                        borderColor: esActivo ? 'var(--stitch-primary)' : 'var(--stitch-border)',
                                        borderWidth: '1.5px',
                                        borderStyle: 'solid',
                                        borderRadius: '8px',
                                        transition: 'all 0.2s ease'
                                    }}
                                >
                                    <span style={{
                                        fontSize: '10px',
                                        fontWeight: '700',
                                        color: h.categoria === 'General' ? '#3B82F6' : (h.categoria === 'Tareas y Evaluaciones' ? '#EF4444' : '#10B981'),
                                        backgroundColor: h.categoria === 'General' ? 'rgba(59,130,246,0.08)' : (h.categoria === 'Tareas y Evaluaciones' ? 'rgba(239,68,68,0.08)' : 'rgba(16,185,129,0.08)'),
                                        padding: '4px 8px',
                                        borderRadius: '4px',
                                        display: 'inline-block',
                                        marginBottom: '10px'
                                    }}>
                                        {h.categoria}
                                    </span>
                                    <h4 className="stitch-title-font" style={{ margin: '0 0 8px 0', fontSize: '14px', fontWeight: '800', color: 'var(--stitch-primary)' }}>
                                        {h.titulo}
                                    </h4>
                                    <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--stitch-text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', lineHeight: '1.4' }}>
                                        {h.contenido}
                                    </p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: 'var(--stitch-text-secondary)' }}>
                                        <span style={{ fontWeight: '600' }}>{h.autor.split(' (')[0]}</span>
                                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <span className="material-icons-outlined" style={{ fontSize: '14px' }}>chat_bubble_outline</span>
                                            {h.mensajes.length}
                                        </span>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* COLUMNA 2: DETALLE DEL HILO Y COMENTARIOS */}
                <div>
                    {hiloSeleccionado ? (
                        <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                            {/* Cabecera del Hilo */}
                            <div style={{ borderBottom: '1px solid var(--stitch-border)', paddingBottom: '20px', marginBottom: '20px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)', fontWeight: '600' }}>
                                        Publicado el {hiloSeleccionado.fecha}
                                    </span>
                                    <span style={{
                                        fontSize: '11px',
                                        fontWeight: '700',
                                        color: '#3B82F6',
                                        backgroundColor: 'rgba(59,130,246,0.08)',
                                        padding: '4px 8px',
                                        borderRadius: '4px'
                                    }}>
                                        {hiloSeleccionado.categoria}
                                    </span>
                                </div>
                                <h3 className="stitch-title-font" style={{ margin: '0 0 12px 0', fontSize: '18px', fontWeight: '800', color: 'var(--stitch-primary)', lineHeight: '1.3' }}>
                                    {hiloSeleccionado.titulo}
                                </h3>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
                                    <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: 'var(--stitch-primary)', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContext: 'center', fontWeight: '700', fontSize: '12px', justifyContent: 'center' }}>
                                        {hiloSeleccionado.autor.substring(5, 7).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style={{ fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)' }}>{hiloSeleccionado.autor}</div>
                                        <span style={{ fontSize: '10px', color: 'var(--stitch-text-secondary)' }}>{hiloSeleccionado.autor_rol}</span>
                                    </div>
                                </div>
                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-primary)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                                    {hiloSeleccionado.contenido}
                                </p>
                            </div>

                            {/* Listado de Comentarios */}
                            <div style={{ marginBottom: '24px' }}>
                                <div style={{ fontSize: '12px', fontWeight: '800', color: 'var(--stitch-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '16px' }}>
                                    Respuestas ({hiloSeleccionado.mensajes.length})
                                </div>
                                
                                {hiloSeleccionado.mensajes.length === 0 ? (
                                    <div style={{ padding: '16px', textAlign: 'center', color: 'var(--stitch-text-secondary)', fontSize: '12px', fontStyle: 'italic' }}>
                                        No hay respuestas todavía. ¡Sé el primero en comentar!
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                                        {hiloSeleccionado.mensajes.map(msg => (
                                            <div key={msg.id} style={{ display: 'flex', gap: '12px', backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid var(--stitch-border)' }}>
                                                <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#475569', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '700', fontSize: '11px', flexShrink: 0 }}>
                                                    {msg.autor.substring(5, 7).toUpperCase()}
                                                </div>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                                                        <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)' }}>{msg.autor}</span>
                                                        <span style={{ fontSize: '10px', color: 'var(--stitch-text-secondary)' }}>{msg.fecha}</span>
                                                    </div>
                                                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--stitch-text-primary)', lineHeight: '1.5' }}>
                                                        {msg.texto}
                                                    </p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Formulario de Comentario */}
                            <form onSubmit={handleEnviarComentario} style={{ borderTop: '1px solid var(--stitch-border)', paddingTop: '20px' }}>
                                <textarea
                                    rows="3"
                                    value={nuevoComentarioText}
                                    onChange={e => setNuevoComentarioText(e.target.value)}
                                    placeholder="Escribe tu comentario o respuesta aquí..."
                                    required
                                    className="stitch-textarea"
                                    style={{ width: '96%', padding: '10px', fontSize: '13px', marginBottom: '12px' }}
                                />
                                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                                    <button type="submit" className="stitch-button" style={{ padding: '8px 20px', fontSize: '13px' }}>
                                        <span className="material-icons-outlined">reply</span>
                                        Enviar Comentario
                                    </button>
                                </div>
                            </form>
                        </div>
                    ) : (
                        <div className="stitch-card" style={{ padding: '40px', textAlign: 'center', color: 'var(--stitch-text-secondary)', backgroundColor: '#FFFFFF' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '48px', color: 'var(--stitch-border)', marginBottom: '16px' }}>forum</span>
                            <p style={{ margin: 0, fontSize: '14px' }}>Seleccione un tema de discusión a la izquierda para ver los detalles y comentarios.</p>
                        </div>
                    )}
                </div>

            </div>

            {/* ── MODAL: CREAR NUEVO TEMA ── */}
            {mostrarCreador && (
                <div className="stitch-modal-backdrop">
                    <div className="stitch-modal-content" style={{ width: '100%', maxWidth: '550px', padding: '28px' }}>
                        <h3 className="stitch-title-font" style={{ margin: '0 0 6px 0', color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '18px' }}>
                            Iniciar Nuevo Tema de Discusión
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', marginBottom: '20px' }}>
                            Crea un hilo abierto para que los demás padres y tutores participen.
                        </p>

                        <form onSubmit={handleCrearHilo} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', marginBottom: '6px' }}>
                                    Título del Tema *
                                </label>
                                <input
                                    type="text"
                                    value={nuevoTitulo}
                                    onChange={e => setNuevoTitulo(e.target.value)}
                                    placeholder="Ej: Dudas sobre la excursión escolar"
                                    required
                                    className="stitch-input"
                                    style={{ width: '95%', padding: '10px' }}
                                />
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', marginBottom: '6px' }}>
                                    Categoría de Discusión *
                                </label>
                                <select
                                    value={nuevaCategoria}
                                    onChange={e => setNuevaCategoria(e.target.value)}
                                    className="stitch-select"
                                    style={{ width: '100%', padding: '10px' }}
                                >
                                    <option value="General">General</option>
                                    <option value="Tareas y Evaluaciones">Tareas y Evaluaciones</option>
                                    <option value="Organización de Grado">Organización de Grado</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', marginBottom: '6px' }}>
                                    Mensaje Inicial *
                                </label>
                                <textarea
                                    rows="5"
                                    value={nuevoContenido}
                                    onChange={e => setNuevoContenido(e.target.value)}
                                    placeholder="Describe detalladamente el tema..."
                                    required
                                    className="stitch-textarea"
                                    style={{ width: '95%', padding: '10px' }}
                                />
                            </div>

                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setMostrarCreador(false)} className="stitch-button-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="stitch-button">
                                    Publicar Tema
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
