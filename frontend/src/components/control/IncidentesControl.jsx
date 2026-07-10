import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

const TABS = [
    { id: 'buzon', label: 'Buzón de Quejas', icon: 'forum' },
    { id: 'escalados', label: 'Casos Escalados', icon: 'transfer_within_a_station' },
    { id: 'presencial', label: 'Registro Presencial', icon: 'edit_note' },
    { id: 'citas', label: 'Centro de Citas', icon: 'calendar_month' }
];

export default function IncidentesControl() {
    const { token } = useAuth();
    const [tabActiva, setTabActiva] = useState('buzon');
    const [incidentes, setIncidentes] = useState([]);
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Formulario de Registro Presencial
    const [titulo, setTitulo] = useState('');
    const [descripcion, setDescripcion] = useState('');
    const [tipo, setTipo] = useState('Administrativo');
    const [estudianteId, setEstudianteId] = useState('');
    const [destinatarioId, setDestinatarioId] = useState('');
    const [actionLoading, setActionLoading] = useState(false);

    // Modales de Acción
    const [casoResolviendo, setCasoResolviendo] = useState(null);
    const [resolucionTexto, setResolucionTexto] = useState('');

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchDatos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const [resInc, resCitas] = await Promise.all([
                fetch('/api/control/quejas', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/control/citas', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (!resInc.ok || !resCitas.ok) throw new Error('Error al cargar datos de incidentes o citas.');
            const [dataInc, dataCitas] = await Promise.all([resInc.json(), resCitas.json()]);
            setIncidentes(dataInc);
            setCitas(dataCitas);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchDatos();
    }, [fetchDatos]);

    // Crear Caso Presencial
    const handleCrearPresencial = async (e) => {
        e.preventDefault();
        if (!titulo || !descripcion || !destinatarioId) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/control/quejas/presencial', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    estudiante_id: estudianteId || null,
                    destinatario_id: destinatarioId,
                    titulo,
                    descripcion,
                    tipo
                })
            });

            if (!res.ok) throw new Error('Error al registrar caso presencial.');
            showToast('Incidente presencial registrado correctamente.', 'success');
            setTitulo('');
            setDescripcion('');
            setEstudianteId('');
            setDestinatarioId('');
            setTipo('Administrativo');
            await fetchDatos();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Resolver caso
    const handleResolverCaso = async (e) => {
        e.preventDefault();
        if (!resolucionTexto || !casoResolviendo) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/control/quejas/${casoResolviendo}/resolver`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ resolucion_texto: resolucionTexto })
            });

            if (!res.ok) throw new Error('Error al resolver caso.');
            showToast('Caso marcado como resuelto exitosamente.', 'success');
            setCasoResolviendo(null);
            setResolucionTexto('');
            await fetchDatos();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Actualizar Cita
    const handleActualizarCita = async (citaId, nuevoEstado) => {
        const obs = window.prompt(`Observaciones para marcar cita como ${nuevoEstado}:`);
        if (obs === null) return;

        setActionLoading(true);
        try {
            const res = await fetch(`/api/control/citas/${citaId}/estado`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ estado: nuevoEstado, observaciones: obs })
            });

            if (!res.ok) throw new Error('Error al actualizar cita.');
            showToast(`Cita marcada como ${nuevoEstado}.`, 'success');
            await fetchDatos();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // Clasificación de incidentes
    const quejasAdministrativas = incidentes.filter(i => i.destino_id === 2 && i.estado !== 'Cerrado'); // Secretaría / Control Académico
    const casosEscalados = incidentes.filter(i => i.escalado_por !== null && i.estado !== 'Cerrado');

    return (
        <div style={{ padding: '0px', background: 'var(--stitch-background)', fontFamily: 'var(--stitch-font-family, Google Sans, sans-serif)' }}>
            
            {/* Cabecera y Tabs */}
            <div className="st-card" style={{ padding: '16px 20px 0px 20px', marginBottom: '20px', borderRadius: '12px', border: '1px solid var(--stitch-outline-variant)' }}>
                <div style={{ display: 'flex', gap: '8px', overflowX: 'auto' }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setTabActiva(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '12px 18px', border: 'none',
                                borderBottom: `3px solid ${tabActiva === tab.id ? 'var(--stitch-primary)' : 'transparent'}`,
                                background: 'transparent',
                                color: tabActiva === tab.id ? 'var(--stitch-primary)' : 'var(--stitch-on-surface-variant)',
                                fontWeight: tabActiva === tab.id ? 700 : 400,
                                fontSize: '14px', cursor: 'pointer',
                                whiteSpace: 'nowrap', transition: 'all 0.15s',
                                fontFamily: 'var(--stitch-font-family)'
                            }}
                        >
                            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '40px', color: 'var(--stitch-primary)', animation: 'spin 1s linear infinite' }}>sync</span>
                    <p style={{ color: 'var(--stitch-on-surface-variant)', marginTop: '10px' }}>Cargando datos...</p>
                </div>
            ) : error ? (
                <div style={{ padding: '16px', background: 'var(--stitch-error-container)', color: 'var(--stitch-error)', borderRadius: '10px' }}>
                    {error}
                </div>
            ) : (
                <div>
                    {/* TAB A: BUZÓN DE QUEJAS */}
                    {tabActiva === 'buzon' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {quejasAdministrativas.length === 0 ? (
                                <p style={{ color: 'var(--stitch-on-surface-variant)', textAlign: 'center', padding: '40px' }}>No hay quejas ni inconformidades administrativas pendientes.</p>
                            ) : (
                                quejasAdministrativas.map(c => (
                                    <div key={c.id} className="st-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid var(--stitch-outline-variant)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>{c.titulo}</h4>
                                                <span style={{ fontSize: '12px', color: 'var(--stitch-on-surface-variant)' }}>Remitente: {c.tutor_nombre} ({c.tutor_ua}) &nbsp;·&nbsp; Estudiante: {c.estudiante_nombre || 'N/A'}</span>
                                            </div>
                                            <span style={{ background: 'var(--stitch-primary)22', color: 'var(--stitch-primary)', border: '1px solid var(--stitch-primary)55', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>{c.estado}</span>
                                        </div>
                                        <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--stitch-on-surface)', lineHeight: 1.6 }}>{c.descripcion}</p>
                                        
                                        {c.estado !== 'Resuelto' && (
                                            <button 
                                                className="st-button st-button-filled"
                                                onClick={() => setCasoResolviendo(c.id)}
                                                style={{ padding: '6px 12px', fontSize: '12px', border: 'none', background: 'var(--stitch-success, #198754)', color: '#fff', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <span className="material-icons-outlined" style={{ fontSize: '15px' }}>check_circle</span>
                                                Resolver Caso
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* TAB B: CASOS ESCALADOS */}
                    {tabActiva === 'escalados' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {casosEscalados.length === 0 ? (
                                <p style={{ color: 'var(--stitch-on-surface-variant)', textAlign: 'center', padding: '40px' }}>No hay incidentes conductuales escalados por profesores.</p>
                            ) : (
                                casosEscalados.map(c => (
                                    <div key={c.id} className="st-card" style={{ borderRadius: '12px', padding: '20px', border: '1px solid var(--stitch-outline-variant)' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                                            <div>
                                                <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>{c.titulo}</h4>
                                                <span style={{ fontSize: '12px', color: 'var(--stitch-on-surface-variant)' }}>Escalado por Docente &nbsp;·&nbsp; Estudiante: {c.estudiante_nombre}</span>
                                            </div>
                                            <span style={{ background: 'var(--stitch-error)22', color: 'var(--stitch-error)', border: '1px solid var(--stitch-error)55', borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 700 }}>Escalado</span>
                                        </div>
                                        <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--stitch-on-surface)', lineHeight: 1.6 }}>{c.descripcion}</p>

                                        {c.estado !== 'Resuelto' && (
                                            <button 
                                                className="st-button st-button-filled"
                                                onClick={() => setCasoResolviendo(c.id)}
                                                style={{ padding: '6px 12px', fontSize: '12px', border: 'none', background: 'var(--stitch-success, #198754)', color: '#fff', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                            >
                                                <span className="material-icons-outlined" style={{ fontSize: '15px' }}>check_circle</span>
                                                Resolver Caso
                                            </button>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                    )}

                    {/* TAB C: REGISTRO PRESENCIAL */}
                    {tabActiva === 'presencial' && (
                        <form onSubmit={handleCrearPresencial} className="st-card" style={{ borderRadius: '12px', padding: '24px', border: '1px solid var(--stitch-outline-variant)', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '540px', margin: '0 auto' }}>
                            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 700, color: 'var(--stitch-on-surface)' }}>Registrar Caso en Ventanilla</h4>

                            <div>
                                <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--stitch-on-surface)' }}>Título de Incidente:</label>
                                <input 
                                    required
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)', boxSizing: 'border-box' }}
                                    placeholder="Ej: Inconformidad con Transporte..."
                                    value={titulo}
                                    onChange={e => setTitulo(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--stitch-on-surface)' }}>Descripción de la Reunión/Visita:</label>
                                <textarea 
                                    required
                                    rows={4}
                                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)', boxSizing: 'border-box', lineHeight: 1.5 }}
                                    placeholder="Escriba los descargos del padre y compromisos..."
                                    value={descripcion}
                                    onChange={e => setDescripcion(e.target.value)}
                                />
                            </div>

                            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '140px' }}>
                                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--stitch-on-surface)' }}>Tipo de Caso:</label>
                                    <select 
                                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)' }}
                                        value={tipo}
                                        onChange={e => setTipo(e.target.value)}
                                    >
                                        <option value="Administrativo">Administrativo</option>
                                        <option value="Conducta">Conducta</option>
                                        <option value="Academico">Academico</option>
                                        <option value="Inconformidad">Inconformidad</option>
                                    </select>
                                </div>
                                <div style={{ flex: 1, minWidth: '140px' }}>
                                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--stitch-on-surface)' }}>ID Estudiante (Opcional):</label>
                                    <input 
                                        type="number"
                                        style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)', boxSizing: 'border-box' }}
                                        placeholder="ID en DB"
                                        value={estudianteId}
                                        onChange={e => setEstudianteId(e.target.value)}
                                    />
                                </div>
                                <div style={{ flex: 1, minWidth: '140px' }}>
                                    <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--stitch-on-surface)' }}>ID Destinatario (Asignado):</label>
                                    <input 
                                        type="number"
                                        required
                                        style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)', boxSizing: 'border-box' }}
                                        placeholder="ID Profesor o Admin"
                                        value={destinatarioId}
                                        onChange={e => setDestinatarioId(e.target.value)}
                                    />
                                </div>
                            </div>

                            <button 
                                type="submit" 
                                disabled={actionLoading}
                                style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--stitch-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                            >
                                <span className="material-icons-outlined" style={{ fontSize: '18px' }}>save</span>
                                Registrar Incidente Presencial
                            </button>
                        </form>
                    )}

                    {/* TAB D: CENTRO DE CITAS */}
                    {tabActiva === 'citas' && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {citas.length === 0 ? (
                                <p style={{ color: 'var(--stitch-on-surface-variant)', textAlign: 'center', padding: '40px' }}>No hay solicitudes de citas en agenda.</p>
                            ) : (
                                citas.map(c => {
                                    const esPrioritaria = c.es_prioritaria === 1 || c.es_prioritaria === true;
                                    return (
                                        <div key={c.id} className="st-card" style={{
                                            borderRadius: '12px', padding: '20px', border: `1px solid ${esPrioritaria ? 'var(--stitch-error)' : 'var(--stitch-outline-variant)'}`,
                                            background: esPrioritaria ? 'rgba(220,53,69,0.04)' : 'var(--stitch-surface)'
                                        }}>
                                            {esPrioritaria && (
                                                <div style={{ background: 'var(--stitch-error)', color: '#fff', fontSize: '11px', fontWeight: 700, borderRadius: '4px', padding: '2px 8px', width: 'fit-content', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                    <span className="material-icons-outlined" style={{ fontSize: '14px' }}>warning</span> CITA PRIORITARIA
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '8px' }}>
                                                <div>
                                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>Cita: {c.solicitante_nombre} ({c.solicitante_rol})</h4>
                                                    <span style={{ fontSize: '12px', color: 'var(--stitch-on-surface-variant)' }}>Con: {c.destinatario_nombre} &nbsp;·&nbsp; Estudiante: {c.estudiante_nombre}</span>
                                                </div>
                                                <span style={{
                                                    background: c.estado === 'Aprobada' ? 'var(--stitch-success)22' : c.estado === 'Solicitada' ? 'var(--stitch-warning)22' : 'var(--stitch-error)22',
                                                    color: c.estado === 'Aprobada' ? 'var(--stitch-success)' : c.estado === 'Solicitada' ? 'var(--stitch-warning)' : 'var(--stitch-error)',
                                                    borderRadius: '12px', padding: '2px 8px', fontSize: '11px', fontWeight: 700
                                                }}>{c.estado}</span>
                                            </div>

                                            <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--stitch-on-surface)', marginBottom: '10px' }}>
                                                <span><strong>Fecha/Hora:</strong> {new Date(c.fecha_hora).toLocaleString()}</span>
                                            </div>
                                            <p style={{ margin: '0 0 14px', fontSize: '13px', color: 'var(--stitch-on-surface-variant)' }}><strong>Motivo:</strong> {c.motivo}</p>

                                            {c.estado === 'Solicitada' && (
                                                <div style={{ display: 'flex', gap: '8px' }}>
                                                    <button 
                                                        className="st-button st-button-filled"
                                                        onClick={() => handleActualizarCita(c.id, 'Aprobada')}
                                                        style={{ padding: '6px 12px', fontSize: '12px', border: 'none', background: 'var(--stitch-success, #198754)', color: '#fff', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <span className="material-icons-outlined" style={{ fontSize: '14px' }}>done</span>
                                                        Aprobar Cita
                                                    </button>
                                                    <button 
                                                        className="st-button st-button-outlined"
                                                        onClick={() => handleActualizarCita(c.id, 'Rechazada')}
                                                        style={{ padding: '6px 12px', fontSize: '12px', border: '1px solid var(--stitch-error)', background: 'transparent', color: 'var(--stitch-error)', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
                                                    >
                                                        <span className="material-icons-outlined" style={{ fontSize: '14px' }}>close</span>
                                                        Rechazar
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            )}

            {/* MODAL RESOLUCIÓN DE CASO */}
            {casoResolviendo && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }} onClick={() => setCasoResolviendo(null)}>
                    <form onSubmit={handleResolverCaso} style={{ background: 'var(--stitch-surface)', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--stitch-on-surface)' }}>Redactar Resolución de Caso</h3>
                            <button type="button" onClick={() => setCasoResolviendo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stitch-on-surface-variant)' }}>
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>
                        <div>
                            <label style={{ fontSize: '12px', display: 'block', marginBottom: '6px', color: 'var(--stitch-on-surface)' }}>Resolución/Respuesta Oficial:</label>
                            <textarea 
                                required
                                rows={4}
                                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)', boxSizing: 'border-box', lineHeight: 1.5 }}
                                placeholder="Escriba la solución brindada..."
                                value={resolucionTexto}
                                onChange={e => setResolucionTexto(e.target.value)}
                            />
                        </div>
                        <button 
                            type="submit" 
                            disabled={actionLoading}
                            style={{ padding: '10px', borderRadius: '8px', border: 'none', background: 'var(--stitch-primary)', color: '#fff', fontWeight: 600, cursor: 'pointer' }}
                        >
                            {actionLoading ? 'Guardando...' : 'Confirmar Resolución'}
                        </button>
                    </form>
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
