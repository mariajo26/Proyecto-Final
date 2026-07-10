import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

export default function CircularesControl() {
    const { token } = useAuth();
    const [circulares, setCirculares] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Formulario de Creación
    const [mostrarCreador, setMostrarCreador] = useState(false);
    const [titulo, setTitulo] = useState('');
    const [contenido, setContenido] = useState('');
    const [tipo, setTipo] = useState('Informativa');
    const [fechaLimite, setFechaLimite] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Búsqueda de Firmas Físicas
    const [busquedaAlumno, setBusquedaAlumno] = useState('');
    const [circularSeleccionada, setCircularSeleccionada] = useState(null);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchCirculares = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/control/circulares', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('No se pudieron obtener las circulares.');
            const data = await res.json();
            setCirculares(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchCirculares();
    }, [fetchCirculares]);

    // Crear circular
    const handleCrearCircular = async (e) => {
        e.preventDefault();
        if (!titulo || !contenido) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/comunicacion/circulares', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    titulo,
                    contenido,
                    tipo,
                    fecha_limite: tipo === 'Autorizacion' ? fechaLimite : null,
                    filtros_destino: {} // Vacío para enviarla a todos por defecto
                })
            });

            if (!res.ok) throw new Error('Error al crear la circular.');
            showToast('Circular guardada en borrador (Pendiente).', 'success');
            setTitulo('');
            setContenido('');
            setTipo('Informativa');
            setFechaLimite('');
            setMostrarCreador(false);
            await fetchCirculares();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Publicar circular
    const handlePublicar = async (circularId) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/comunicacion/circulares/${circularId}/publicar`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al publicar la circular.');
            showToast('Circular publicada e inyectada a los padres.', 'success');
            await fetchCirculares();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Eliminar circular
    const handleEliminar = async (circularId) => {
        if (!window.confirm('¿Seguro que desea eliminar esta circular definitivamente?')) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/comunicacion/circulares/${circularId}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al eliminar la circular.');
            showToast('Circular eliminada.', 'info');
            await fetchCirculares();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Registrar firma física (Presencial) de boleta en papel
    const handleRegistrarFirmaFisica = async (circularId, estudianteId) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/comunicacion/circulares/${circularId}/firma-fisica`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ estudiante_id: estudianteId })
            });

            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Error al registrar firma.');
            }
            showToast('Firma física registrada y evento de calendario desbloqueado.', 'success');
            await fetchCirculares();
            // Actualizar la circular actualmente seleccionada para el buscador
            if (circularSeleccionada && circularSeleccionada._id === circularId) {
                const updated = circulares.find(c => c._id === circularId);
                setCircularSeleccionada(updated);
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
                <h3 style={{ margin: 0, color: 'var(--stitch-on-surface)', fontSize: '16px', fontWeight: 700 }}>Gestión de Comunicados y Firmas</h3>
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
                    Crear Circular
                </button>
            </div>

            {/* Listado de circulares */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '40px', color: 'var(--stitch-primary)', animation: 'spin 1s linear infinite' }}>sync</span>
                    <p style={{ color: 'var(--stitch-on-surface-variant)', marginTop: '10px' }}>Cargando circulares...</p>
                </div>
            ) : error ? (
                <div style={{ padding: '16px', background: 'var(--stitch-error-container)', color: 'var(--stitch-error)', borderRadius: '10px' }}>
                    {error}
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {circulares.map(c => {
                        const firmasAutorizadas = c.firmas.filter(f => f.estado === 'Autorizado').length;
                        const totalFirmas = c.firmas.length;

                        return (
                            <div key={c._id} className="st-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid var(--stitch-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                                <div style={{ flex: 1, minWidth: '260px' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                                        <span className="material-icons-outlined" style={{ color: c.tipo === 'Autorizacion' ? 'var(--stitch-warning)' : 'var(--stitch-primary)' }}>
                                            {c.tipo === 'Autorizacion' ? 'assignment' : 'campaign'}
                                        </span>
                                        <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>{c.titulo}</h4>
                                        <span style={{
                                            background: c.estado === 'Enviada' ? 'var(--stitch-success)22' : 'var(--stitch-warning)22',
                                            color: c.estado === 'Enviada' ? 'var(--stitch-success)' : 'var(--stitch-warning)',
                                            border: `1px solid ${c.estado === 'Enviada' ? 'var(--stitch-success)55' : 'var(--stitch-warning)55'}`,
                                            borderRadius: '12px', fontSize: '11px', padding: '2px 8px', fontWeight: 700
                                        }}>{c.estado}</span>
                                    </div>
                                    <p style={{ margin: '0 0 6px 28px', fontSize: '13px', color: 'var(--stitch-on-surface-variant)' }}>{c.contenido.substring(0, 100)}...</p>
                                    
                                    {c.tipo === 'Autorizacion' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '14px', fontSize: '12px', color: 'var(--stitch-on-surface-variant)', marginLeft: '28px' }}>
                                            <span><strong>Respuestas:</strong> {firmasAutorizadas} / {totalFirmas} firmas</span>
                                            {c.fecha_limite && (
                                                <span><strong>Límite:</strong> {new Date(c.fecha_limite).toLocaleString('es-GT', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                                    {c.tipo === 'Autorizacion' && c.estado === 'Enviada' && (
                                        <button
                                            className="st-button st-button-outlined"
                                            onClick={() => setCircularSeleccionada(c)}
                                            style={{ padding: '8px 12px', fontSize: '12px', border: '1px solid var(--stitch-primary)', borderRadius: '8px', background: 'transparent', color: 'var(--stitch-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                        >
                                            <span className="material-icons-outlined" style={{ fontSize: '15px' }}>edit_note</span>
                                            Recibir Físico
                                        </button>
                                    )}
                                    {c.estado === 'Pendiente' && (
                                        <button
                                            className="st-button st-button-filled"
                                            onClick={() => handlePublicar(c._id)}
                                            disabled={actionLoading}
                                            style={{ padding: '8px 14px', fontSize: '12px', border: 'none', borderRadius: '8px', background: 'var(--stitch-success, #198754)', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
                                        >
                                            <span className="material-icons-outlined" style={{ fontSize: '15px' }}>send</span>
                                            Publicar
                                        </button>
                                    )}
                                    <button
                                        onClick={() => handleEliminar(c._id)}
                                        disabled={actionLoading}
                                        style={{ padding: '8px', borderRadius: '8px', border: '1px solid var(--stitch-error)', background: 'transparent', color: 'var(--stitch-error)', cursor: 'pointer' }}
                                    >
                                        <span className="material-icons-outlined" style={{ fontSize: '15px' }}>delete</span>
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* FORMULARIO CREADOR (Modal) */}
            {mostrarCreador && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }} onClick={() => setMostrarCreador(false)}>
                    <form onSubmit={handleCrearCircular} style={{ background: 'var(--stitch-surface)', borderRadius: '16px', width: '100%', maxWidth: '500px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--stitch-outline-variant)', paddingBottom: '12px' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--stitch-on-surface)' }}>Redactar Comunicado Oficial</h3>
                            <button type="button" onClick={() => setMostrarCreador(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stitch-on-surface-variant)' }}>
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--stitch-on-surface)' }}>Título de la Circular:</label>
                            <input 
                                required
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)', boxSizing: 'border-box' }}
                                placeholder="Ej: Feriado del Día del Maestro..."
                                value={titulo}
                                onChange={e => setTitulo(e.target.value)}
                            />
                        </div>

                        <div>
                            <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--stitch-on-surface)' }}>Contenido del Comunicado:</label>
                            <textarea 
                                required
                                rows={4}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)', boxSizing: 'border-box', lineHeight: 1.5 }}
                                placeholder="Escriba las instrucciones institucionales aquí..."
                                value={contenido}
                                onChange={e => setContenido(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                            <div style={{ flex: 1, minWidth: '140px' }}>
                                <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--stitch-on-surface)' }}>Tipo de Circular:</label>
                                <select 
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)' }}
                                    value={tipo}
                                    onChange={e => setTipo(e.target.value)}
                                >
                                    <option value="Informativa">Informativa (Solo Lectura)</option>
                                    <option value="Autorizacion">Autorización Especial (Firma Requerida)</option>
                                </select>
                            </div>

                            {tipo === 'Autorizacion' && (
                                <div style={{ flex: 1, minWidth: '140px' }}>
                                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--stitch-on-surface)' }}>Fecha/Hora Límite:</label>
                                    <input 
                                        type="datetime-local"
                                        required
                                        style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)', boxSizing: 'border-box' }}
                                        value={fechaLimite}
                                        onChange={e => setFechaLimite(e.target.value)}
                                    />
                                </div>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={actionLoading}
                            style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--stitch-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                        >
                            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>save</span>
                            {actionLoading ? 'Guardando...' : 'Guardar Comunicado'}
                        </button>
                    </form>
                </div>
            )}

            {/* RECEPCIÓN DE FIRMAS FÍSICAS (Modal popup buscador) */}
            {circularSeleccionada && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }} onClick={() => setCircularSeleccionada(null)}>
                    <div style={{ background: 'var(--stitch-surface)', borderRadius: '16px', width: '100%', maxWidth: '540px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)', maxHeight: '85vh', overflowY: 'auto' }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--stitch-outline-variant)', paddingBottom: '12px' }}>
                            <div>
                                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--stitch-on-surface)' }}>Firmas Físicas: {circularSeleccionada.titulo}</h3>
                                <span style={{ fontSize: '12px', color: 'var(--stitch-on-surface-variant)' }}>Marcar boleta recibida para alumnos</span>
                            </div>
                            <button onClick={() => setCircularSeleccionada(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stitch-on-surface-variant)' }}>
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        {/* Caja de Búsqueda */}
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <input 
                                style={{ flex: 1, padding: '10px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)' }}
                                placeholder="Buscar alumno por UA o nombre..."
                                value={busquedaAlumno}
                                onChange={e => setBusquedaAlumno(e.target.value)}
                            />
                        </div>

                        {/* Listado de Firmas */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
                            {circularSeleccionada.firmas
                                .filter(f => 
                                    f.estudiante_id.toLowerCase().includes(busquedaAlumno.toLowerCase()) || 
                                    f.encargado_id.toLowerCase().includes(busquedaAlumno.toLowerCase())
                                )
                                .map(f => (
                                    <div key={f.estudiante_id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', border: '1px solid var(--stitch-outline-variant)', borderRadius: '8px', fontSize: '13px' }}>
                                        <div>
                                            <strong>Estudiante:</strong> {f.estudiante_id} <br />
                                            <span style={{ fontSize: '11px', color: 'var(--stitch-on-surface-variant)' }}>Encargado: {f.encargado_id}</span>
                                        </div>
                                        <div>
                                            {f.estado === 'Autorizado' ? (
                                                <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--stitch-success)', fontWeight: 600 }}>
                                                    <span className="material-icons-outlined" style={{ fontSize: '16px' }}>verified</span>
                                                    {f.metodo === 'Presencial' ? 'Firma Física' : 'Firma Virtual'}
                                                </span>
                                            ) : (
                                                <button
                                                    className="st-button st-button-filled"
                                                    onClick={() => handleRegistrarFirmaFisica(circularSeleccionada._id, f.estudiante_id)}
                                                    disabled={actionLoading}
                                                    style={{ padding: '6px 12px', border: 'none', background: 'var(--stitch-primary)', color: '#fff', borderRadius: '6px', fontSize: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                >
                                                    <span className="material-icons-outlined" style={{ fontSize: '14px' }}>edit</span>
                                                    Recibir Papel
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
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
