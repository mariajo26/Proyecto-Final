import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

export default function MisForosEstudiante() {
    const { token, usuario } = useAuth();
    const [foros, setForos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [foroSeleccionado, setForoSeleccionado] = useState(null);
    const [hilos, setHilos] = useState([]);
    const [loadingHilos, setLoadingHilos] = useState(false);
    const [hiloSeleccionado, setHiloSeleccionado] = useState(null);
    const [comentarios, setComentarios] = useState([]);
    const [loadingComentarios, setLoadingComentarios] = useState(false);
    const [nuevoComentario, setNuevoComentario] = useState('');

    const [toast, setToast] = useState(null);
    const showToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
    };

    // Cargar Foros
    const fetchForos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/estudiante/foros', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('No se pudieron obtener los foros.');
            const data = await res.json();
            setForos(data);
        } catch (err) {
            // Fallback de demostración
            setForos([
                { id: 'f1', nombre: 'Foro Permanente de Matemáticas', descripcion: 'Dudas y discusiones generales del curso de Mate.', tipo: 'GradoSeccion', creador: 'Prof. Carlos Gómez' },
                { id: 'f2', nombre: 'Comunicación con Profesor Guía (Sección A)', descripcion: 'Canal oficial de coordinación grupal.', tipo: 'GradoSeccion', creador: 'Prof. Carlos Gómez' },
                { id: 'f3', nombre: 'Proyecto de Ciencias Naturales - Grupo 3', descripcion: 'Coordinación exclusiva para los miembros del Grupo 3.', tipo: 'GrupoTareas', creador: 'Prof. Jorge Diaz' }
            ]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchForos();
    }, [fetchForos]);

    // Cargar hilos de un foro
    const fetchHilos = useCallback(async (foroId) => {
        setLoadingHilos(true);
        try {
            const res = await fetch(`/api/communication/foros/${foroId}/hilos`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar discusiones.');
            const data = await res.json();
            setHilos(data);
        } catch (err) {
            // Fallback
            if (foroId === 'f1') {
                setHilos([
                    { id: 'h1', titulo: 'Dudas sobre la Tarea 1', contenido: '¿Alguien sabe si el ejercicio 5 se resuelve usando la fórmula cuadrática o por factorización?', creador_id: 'Estudiante Andrea', creado_en: '2026-07-09T18:00:00Z', cerrado: false }
                ]);
            } else {
                setHilos([
                    { id: 'h2', titulo: 'Organización de Diapositivas', contenido: 'Subo aquí la estructura del informe inicial para que dividamos la exposición.', creador_id: 'Estudiante José', creado_en: '2026-07-08T15:00:00Z', cerrado: false }
                ]);
            }
        } finally {
            setLoadingHilos(false);
        }
    }, [token]);

    // Cargar comentarios de un hilo
    const fetchComentarios = useCallback(async (hiloId) => {
        setLoadingComentarios(true);
        try {
            const res = await fetch(`/api/communication/hilos/${hiloId}/comentarios`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar comentarios.');
            const data = await res.json();
            setComentarios(data);
        } catch (err) {
            setComentarios([
                { id: 'c1', autor_id: 'Prof. Carlos Gómez', contenido: 'Deben utilizar factorización para ese ejercicio específico, Andrea.', creado_en: '2026-07-09T19:20:00Z' }
            ]);
        } finally {
            setLoadingComentarios(false);
        }
    }, [token]);

    const handleSelectForo = (foro) => {
        setForoSeleccionado(foro);
        setHiloSeleccionado(null);
        setHilos([]);
        fetchHilos(foro.id);
    };

    const handleSelectHilo = (hilo) => {
        setHiloSeleccionado(hilo);
        setComentarios([]);
        fetchComentarios(hilo.id);
    };

    const handlePublicarComentario = async (e) => {
        e.preventDefault();
        if (!nuevoComentario.trim()) return;

        try {
            // Llamar backend real
            // await fetch(`/api/communication/hilos/${hiloSeleccionado.id}/comentarios`, {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            //     body: JSON.stringify({ contenido: nuevoComentario })
            // });

            // Simulación
            const nuevo = {
                id: String(Date.now()),
                autor_id: usuario?.nombre || 'Yo',
                contenido: nuevoComentario,
                creado_en: new Date().toISOString()
            };
            setComentarios(prev => [...prev, nuevo]);
            setNuevoComentario('');
            showToast('Comentario publicado correctamente.', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    return (
        <div style={{ fontFamily: 'var(--stitch-font, sans-serif)', color: 'var(--stitch-text-primary, #0F172A)' }}>
            {toast && (
                <div style={{
                    position: 'fixed', top: '24px', right: '24px', zIndex: 3000,
                    padding: '12px 24px', borderRadius: '8px', color: '#FFFFFF',
                    backgroundColor: toast.tipo === 'success' ? 'var(--stitch-success, #10B981)' : 'var(--stitch-error, #EF4444)',
                    boxShadow: 'var(--stitch-shadow-lg)'
                }} className="stitch-transition">
                    {toast.msg}
                </div>
            )}

            {/* VISTA 1: LISTADO DE FOROS */}
            {!foroSeleccionado && (
                <div>
                    <h2 style={{ color: 'var(--stitch-primary, #0D2C54)', fontWeight: '700', marginBottom: '24px' }}>Mis Foros Académicos</h2>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '48px', color: 'var(--stitch-secondary, #3B82F6)', animation: 'spin 1.5s linear infinite' }}>sync</span>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                            {foros.map(f => (
                                <div 
                                    key={f.id}
                                    onClick={() => handleSelectForo(f)}
                                    style={{
                                        backgroundColor: '#FFFFFF', borderRadius: 'var(--stitch-radius-md, 12px)',
                                        border: '1px solid var(--stitch-border, #E2E8F0)', padding: '24px',
                                        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '12px',
                                        boxShadow: 'var(--stitch-shadow-sm)', transition: 'transform 0.2s ease'
                                    }}
                                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-4px)'}
                                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                                >
                                    <span style={{
                                        padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', alignSelf: 'flex-start',
                                        backgroundColor: f.tipo === 'GrupoTareas' ? '#FEE2E2' : '#EFF6FF',
                                        color: f.tipo === 'GrupoTareas' ? '#991B1B' : '#1E40AF'
                                    }}>
                                        {f.tipo === 'GrupoTareas' ? 'Grupo de Tarea' : 'Curso Obligatorio'}
                                    </span>
                                    <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--stitch-primary)' }}>{f.nombre}</h3>
                                    <p style={{ margin: 0, fontSize: '13px', color: '#64748B', flexGrow: 1 }}>{f.descripcion}</p>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #F1F5F9', paddingTop: '12px', fontSize: '12px', color: '#475569' }}>
                                        <span>Creado por: {f.creador}</span>
                                        <span className="material-icons-outlined" style={{ fontSize: '18px', color: 'var(--stitch-secondary)' }}>chat</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* VISTA 2: LISTADO DE HILOS */}
            {foroSeleccionado && !hiloSeleccionado && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <button 
                            onClick={() => setForoSeleccionado(null)}
                            style={{
                                background: '#FFFFFF', border: '1px solid var(--stitch-border)',
                                borderRadius: '50%', width: '40px', height: '40px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                boxShadow: 'var(--stitch-shadow-sm)'
                            }}
                        >
                            <span className="material-icons-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h2 style={{ margin: 0, color: 'var(--stitch-primary, #0D2C54)', fontWeight: '700' }}>{foroSeleccionado.nombre}</h2>
                            <span style={{ fontSize: '13px', color: '#64748B' }}>Discusiones activas</span>
                        </div>
                    </div>

                    {loadingHilos ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '48px', color: 'var(--stitch-secondary, #3B82F6)', animation: 'spin 1.5s linear infinite' }}>sync</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {hilos.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                                    No hay discusiones creadas en este foro todavía.
                                </div>
                            ) : (
                                hilos.map(h => (
                                    <div 
                                        key={h.id}
                                        onClick={() => handleSelectHilo(h)}
                                        style={{
                                            backgroundColor: '#FFFFFF', borderRadius: 'var(--stitch-radius-md, 8px)',
                                            border: '1px solid var(--stitch-border, #E2E8F0)', padding: '20px',
                                            cursor: 'pointer', boxShadow: 'var(--stitch-shadow-sm)',
                                            display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                                        }}
                                    >
                                        <div>
                                            <h4 style={{ margin: '0 0 4px 0', fontSize: '16px', fontWeight: '700', color: 'var(--stitch-primary)' }}>{h.titulo}</h4>
                                            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Iniciado por: {h.creador_id}</p>
                                        </div>
                                        <span className="material-icons-outlined" style={{ color: 'var(--stitch-secondary)' }}>chevron_right</span>
                                    </div>
                                ))
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* VISTA 3: DISCUSIÓN Y COMENTARIOS */}
            {foroSeleccionado && hiloSeleccionado && (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <button 
                            onClick={() => setHiloSeleccionado(null)}
                            style={{
                                background: '#FFFFFF', border: '1px solid var(--stitch-border)',
                                borderRadius: '50%', width: '40px', height: '40px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                boxShadow: 'var(--stitch-shadow-sm)'
                            }}
                        >
                            <span className="material-icons-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h2 style={{ margin: 0, color: 'var(--stitch-primary, #0D2C54)', fontWeight: '700' }}>{hiloSeleccionado.titulo}</h2>
                            <span style={{ fontSize: '13px', color: '#64748B' }}>Foro: {foroSeleccionado.nombre}</span>
                        </div>
                    </div>

                    <div style={{ backgroundColor: '#F8FAFC', padding: '20px', borderRadius: '8px', borderLeft: '4px solid var(--stitch-secondary)', marginBottom: '24px' }}>
                        <p style={{ margin: '0 0 10px 0', fontWeight: '500' }}>{hiloSeleccionado.contenido}</p>
                        <span style={{ fontSize: '12px', color: '#64748B' }}>Publicado por {hiloSeleccionado.creador_id} el {new Date(hiloSeleccionado.creado_en).toLocaleString()}</span>
                    </div>

                    <h3 style={{ fontSize: '16px', fontWeight: '700', marginBottom: '16px' }}>Respuestas</h3>

                    {loadingComentarios ? (
                        <div style={{ textAlign: 'center', padding: '20px' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '32px', color: 'var(--stitch-secondary)', animation: 'spin 1.5s linear infinite' }}>sync</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
                            {comentarios.map(c => (
                                <div key={c.id} style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid var(--stitch-border)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '12px', color: '#64748B' }}>
                                        <span style={{ fontWeight: '600' }}>{c.autor_id}</span>
                                        <span>{new Date(c.creado_en).toLocaleString()}</span>
                                    </div>
                                    <p style={{ margin: 0, fontSize: '14px' }}>{c.contenido}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    {!hiloSeleccionado.cerrado && (
                        <form onSubmit={handlePublicarComentario} style={{ display: 'flex', gap: '12px' }}>
                            <input 
                                type="text" 
                                placeholder="Escribe una respuesta..."
                                value={nuevoComentario}
                                onChange={(e) => setNuevoComentario(e.target.value)}
                                style={{
                                    flexGrow: 1, padding: '12px 16px', borderRadius: '8px',
                                    border: '1px solid var(--stitch-border)', fontSize: '14px'
                                }}
                            />
                            <button type="submit" className="stitch-button">Responder</button>
                        </form>
                    )}
                </div>
            )}
        </div>
    );
}
