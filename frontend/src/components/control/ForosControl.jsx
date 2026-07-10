import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

export default function ForosControl() {
    const { token } = useAuth();
    const [foros, setForos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Formulario de Creación
    const [mostrarCreador, setMostrarCreador] = useState(false);
    const [nombre, setNombre] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [tipo, setTipo] = useState('Tematico'); // GradoSeccion, Tematico, GrupoTareas
    const [actionLoading, setActionLoading] = useState(false);

    // Detalle de Hilos y Moderación
    const [foroSeleccionado, setForoSeleccionado] = useState(null);
    const [hilos, setHilos] = useState([]);
    const [loadingHilos, setLoadingHilos] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
    };

    // Obtener foros
    const fetchForos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/comunicacion/foros', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('No se pudieron obtener los foros.');
            const data = await res.json();
            setForos(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchForos();
    }, [fetchForos]);

    // Crear Foro
    const handleCrearForo = async (e) => {
        e.preventDefault();
        if (!nombre) return;

        // Nota: para la demo crearemos un foro simulado en MongoDB o a través de la API si está expuesta.
        // Pero dado que moderación es lo principal para Secretaría, podemos consumirla o emitirla.
        showToast('Foro institucional creado correctamente (Demo).', 'success');
        setNombre('');
        setDescripcion('');
        setMostrarCreador(false);
    };

    // Archivar Foro
    const handleArchivarForo = async (foroId) => {
        if (!window.confirm('¿Seguro que desea archivar este foro? Esto lo ocultará de las búsquedas principales.')) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/comunicacion/foros/moderar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ accion: 'archivar', foro_id: foroId })
            });

            if (!res.ok) throw new Error('Error al archivar foro.');
            showToast('Foro archivado.', 'info');
            await fetchForos();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Moderar Hilo (Cerrar caja de comentarios o eliminar)
    const handleModerarHilo = async (hiloId, accion) => {
        if (!window.confirm(`¿Seguro que desea ejecutar la acción "${accion}" en este hilo?`)) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/comunicacion/foros/moderar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ accion, hilo_id: hiloId })
            });

            if (!res.ok) throw new Error('Error al moderar el hilo.');
            showToast(`Hilo moderado: ${accion === 'cerrar' ? 'Comentarios Bloqueados' : 'Eliminado'}.`, 'success');
            
            // Recargar hilos del foro actual si aplica
            if (foroSeleccionado) {
                // Simulación de actualización de listado de hilos
                setHilos(prev => prev.filter(h => h._id !== hiloId));
            }
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div style={{ padding: '0px', background: 'var(--stitch-background)', fontFamily: 'var(--stitch-font-family, Google Sans, sans-serif)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ margin: 0, color: 'var(--stitch-on-surface)', fontSize: '16px', fontWeight: 700 }}>Moderación de Foros de Padres y Docentes</h3>
                <button
                    className="st-button st-button-filled"
                    onClick={() => setMostrarCreador(true)}
                    style={{
                        padding: '10px 18px', border: 'none', background: 'var(--stitch-primary)',
                        color: '#fff', borderRadius: '10px', fontWeight: 600,
                        fontSize: '13px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px'
                    }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                    Crear Canal de Debate
                </button>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '40px', color: 'var(--stitch-primary)', animation: 'spin 1s linear infinite' }}>sync</span>
                    <p style={{ color: 'var(--stitch-on-surface-variant)', marginTop: '10px' }}>Cargando foros y canales...</p>
                </div>
            ) : error ? (
                <div style={{ padding: '16px', background: 'var(--stitch-error-container)', color: 'var(--stitch-error)', borderRadius: '10px' }}>
                    {error}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '16px' }}>
                    {foros.map(f => (
                        <div key={f._id} className="st-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid var(--stitch-outline-variant)', display: 'flex', flexDirection: 'column', justifyBetween: 'space-between', gap: '12px' }}>
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                    <span className="material-icons-outlined" style={{ color: 'var(--stitch-primary)' }}>speaker_notes</span>
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>{f.nombre}</h4>
                                    <span style={{ fontSize: '11px', background: f.estado === 'Activo' ? 'var(--stitch-success)22' : 'var(--stitch-neutral-60)22', color: f.estado === 'Activo' ? 'var(--stitch-success)' : 'var(--stitch-neutral-60)', border: `1px solid ${f.estado === 'Activo' ? 'var(--stitch-success)55' : 'var(--stitch-neutral-60)55'}`, borderRadius: '12px', padding: '2px 8px', fontWeight: 700 }}>{f.estado}</span>
                                </div>
                                <p style={{ margin: '0 0 10px 28px', fontSize: '13px', color: 'var(--stitch-on-surface-variant)', lineHeight: 1.5 }}>{f.descripcion || 'Sin descripción.'}</p>
                                <span style={{ fontSize: '12px', color: 'var(--stitch-on-surface-variant)', marginLeft: '28px' }}><strong>Tipo:</strong> {f.tipo}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: 'auto', marginLeft: '28px' }}>
                                <button
                                    className="st-button st-button-outlined"
                                    onClick={() => setForoSeleccionado(f)}
                                    style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--stitch-primary)', borderRadius: '8px', background: 'transparent', color: 'var(--stitch-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                >
                                    <span className="material-icons-outlined" style={{ fontSize: '15px' }}>manage_accounts</span>
                                    Moderar Hilos
                                </button>
                                {f.estado === 'Activo' && (
                                    <button
                                        className="st-button st-button-outlined"
                                        onClick={() => handleArchivarForo(f._id)}
                                        style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--stitch-outline)', borderRadius: '8px', background: 'transparent', color: 'var(--stitch-on-surface-variant)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                    >
                                        <span className="material-icons-outlined" style={{ fontSize: '15px' }}>archive</span>
                                        Archivar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* FORMULARIO CREACIÓN CANAL DE DEBATE */}
            {mostrarCreador && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }} onClick={() => setMostrarCreador(false)}>
                    <form onSubmit={handleCrearForo} style={{ background: 'var(--stitch-surface)', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--stitch-outline-variant)', paddingBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--stitch-on-surface)' }}>Crear Canal de Debate</h3>
                            <button type="button" onClick={() => setMostrarCreador(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stitch-on-surface-variant)' }}>
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--stitch-on-surface)' }}>Nombre del Foro:</label>
                            <input 
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)', boxSizing: 'border-box' }}
                                placeholder="Ej: Comité Organización Aniversario..."
                                value={nombre}
                                onChange={e => setNombre(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--stitch-on-surface)' }}>Descripción:</label>
                            <textarea 
                                rows={3}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)', boxSizing: 'border-box', lineHeight: 1.5 }}
                                placeholder="Escriba los lineamientos de debate aquí..."
                                value={descripcion}
                                onChange={e => setDescripcion(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--stitch-on-surface)' }}>Tipo de Canal:</label>
                            <select 
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)' }}
                                value={tipo}
                                onChange={e => setTipo(e.target.value)}
                            >
                                <option value="Tematico">Foro Temático (Abierto a Padres)</option>
                                <option value="GradoSeccion">Foro Privado de Profesores</option>
                            </select>
                        </div>

                        <button 
                            type="submit" 
                            style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--stitch-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>save</span>
                            Crear Foro
                        </button>
                    </form>
                </div>
            )}

            {/* MODAL MODERACIÓN DE HILOS */}
            {foroSeleccionado && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }} onClick={() => setForoSeleccionado(null)}>
                    <div style={{ background: 'var(--stitch-surface)', borderRadius: '16px', width: '100%', maxWidth: '540px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', maxHeight: '80vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--stitch-outline-variant)', paddingBottom: '12px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--stitch-on-surface)' }}>Moderación: {foroSeleccionado.nombre}</h3>
                                <span style={{ fontSize: '12px', color: 'var(--stitch-on-surface-variant)' }}>Bloquear o eliminar contenido inapropiado</span>
                            </div>
                            <button onClick={() => setForoSeleccionado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stitch-on-surface-variant)' }}>
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        {/* Contenedor de Hilos de Debate (Simulados para la Moderación) */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            <div style={{ border: '1px solid var(--stitch-outline-variant)', borderRadius: '10px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                <div>
                                    <strong>Hilo: ¿Qué opinan de las nuevas rutas de transporte?</strong>
                                    <div style={{ color: 'var(--stitch-on-surface-variant)', fontSize: '11px', marginTop: '2px' }}>Publicado por: UA-26402 (Padre)</div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button 
                                        className="st-button"
                                        onClick={() => handleModerarHilo('mock-hilo-1', 'cerrar')}
                                        style={{ padding: '6px 8px', border: '1px solid var(--stitch-outline)', background: 'transparent', color: 'var(--stitch-on-surface-variant)', cursor: 'pointer', borderRadius: '6px', fontSize: '11px' }}
                                        title="Bloquear comentarios"
                                    >
                                        Bloquear
                                    </button>
                                    <button 
                                        className="st-button"
                                        onClick={() => handleModerarHilo('mock-hilo-1', 'eliminar_hilo')}
                                        style={{ padding: '6px 8px', border: '1px solid var(--stitch-error)', background: 'transparent', color: 'var(--stitch-error)', cursor: 'pointer', borderRadius: '6px', fontSize: '11px' }}
                                        title="Eliminar de raíz"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>

                            <div style={{ border: '1px solid var(--stitch-outline-variant)', borderRadius: '10px', padding: '14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px' }}>
                                <div>
                                    <strong>Hilo: Organización para la Kermesse 2026</strong>
                                    <div style={{ color: 'var(--stitch-on-surface-variant)', fontSize: '11px', marginTop: '2px' }}>Publicado por: UA-26301 (Docente)</div>
                                </div>
                                <div style={{ display: 'flex', gap: '6px' }}>
                                    <button 
                                        className="st-button"
                                        onClick={() => handleModerarHilo('mock-hilo-2', 'cerrar')}
                                        style={{ padding: '6px 8px', border: '1px solid var(--stitch-outline)', background: 'transparent', color: 'var(--stitch-on-surface-variant)', cursor: 'pointer', borderRadius: '6px', fontSize: '11px' }}
                                        title="Bloquear comentarios"
                                    >
                                        Bloquear
                                    </button>
                                    <button 
                                        className="st-button"
                                        onClick={() => handleModerarHilo('mock-hilo-2', 'eliminar_hilo')}
                                        style={{ padding: '6px 8px', border: '1px solid var(--stitch-error)', background: 'transparent', color: 'var(--stitch-error)', cursor: 'pointer', borderRadius: '6px', fontSize: '11px' }}
                                        title="Eliminar de raíz"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: toast.tipo === 'success' ? 'var(--stitch-success)' : 'var(--stitch-error)', color: '#fff', padding: '12px 24px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>{toast.tipo === 'success' ? 'check_circle' : 'error'}</span>
                    {toast.msg}
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
