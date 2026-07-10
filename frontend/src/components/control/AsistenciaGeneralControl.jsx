import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

export default function AsistenciaGeneralControl() {
    const { token } = useAuth();
    const [secciones, setSecciones] = useState([]);
    const [seccionSeleccionada, setSeccionSeleccionada] = useState('');
    const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0]);
    const [asistencia, setAsistencia] = useState([]);
    const [loading, setLoading] = useState(false);
    const [loadingSecciones, setLoadingSecciones] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
    };

    // Cargar secciones
    const fetchSecciones = useCallback(async () => {
        setLoadingSecciones(true);
        try {
            // Buscaremos secciones de la base de datos MySQL a través de un endpoint o consulta simulada
            // Como las secciones son estructurales, realizamos una consulta rápida usando sequelize
            // Para simplificar, cargamos todas las secciones de décimo y otros grados
            const res = await fetch('/api/control/alumnos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar secciones.');
            const data = await res.json();
            
            // Mapear combinaciones únicas de sección y grado
            let uniqueSec = [];
            let seen = new Set();
            data.forEach(a => {
                // Suponemos IDs correspondientes para secciones o las agrupamos para la demo
                // Usaremos un mapeo simplificado basándonos en los datos de los estudiantes
                const key = `${a.grado} - ${a.seccion}`;
                if (!seen.has(key)) {
                    seen.add(key);
                    uniqueSec.push({
                        id: uniqueSec.length + 1, // ID temporal para selección
                        label: `${a.grado} (Sección ${a.seccion})`,
                        grado: a.grado,
                        seccion: a.seccion
                    });
                }
            });
            setSecciones(uniqueSec);
            if (uniqueSec.length > 0) {
                setSeccionSeleccionada(uniqueSec[0].id.toString());
            }
        } catch (err) {
            setError(err.message);
        } finally {
            setLoadingSecciones(false);
        }
    }, [token]);

    useEffect(() => {
        fetchSecciones();
    }, [fetchSecciones]);

    // Cargar asistencia diaria
    const fetchAsistencia = useCallback(async () => {
        if (!seccionSeleccionada) return;
        setLoading(true);
        setError(null);
        try {
            const sec = secciones.find(s => s.id.toString() === seccionSeleccionada);
            if (!sec) return;

            // Consultar asistencia diaria
            // Usamos un endpoint para cargar la asistencia de la sección seleccionada y fecha
            const res = await fetch(`/api/control/asistencia?seccion_id=${sec.id}&fecha=${fecha}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('No se pudo obtener la asistencia.');
            const data = await res.json();
            setAsistencia(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [seccionSeleccionada, fecha, secciones, token]);

    useEffect(() => {
        fetchAsistencia();
    }, [fetchAsistencia]);

    // Disparar y notificar faltas
    const handleNotificarFaltas = async () => {
        const inasistencias = asistencia.filter(a => a.estado === 'Inasistencia');
        if (inasistencias.length === 0) {
            showToast('No hay inasistencias registradas para enviar hoy.', 'info');
            return;
        }

        if (!window.confirm(`¿Seguro que desea Confirmar y Notificar las ${inasistencias.length} faltas registradas? Esto enviará un correo automático a los encargados con su itinerario de tareas.`)) return;

        setActionLoading(true);
        try {
            const res = await fetch('/api/control/asistencia/notificar', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    inasistencias: inasistencias.map(i => ({
                        estudiante_id: i.estudiante_id,
                        fecha
                    }))
                })
            });

            if (!res.ok) throw new Error('Error al enviar las notificaciones.');
            const result = await res.json();
            showToast(result.message, 'success');
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    return (
        <div style={{ padding: '0px', background: 'var(--stitch-background)', fontFamily: 'var(--stitch-font-family, Google Sans, sans-serif)' }}>
            
            {/* Panel Superior de Filtro y Selección */}
            <div className="st-card" style={{ padding: '18px 24px', marginBottom: '20px', borderRadius: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-end', border: '1px solid var(--stitch-outline-variant)' }}>
                <div style={{ flex: 1, minWidth: '220px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--stitch-on-surface-variant)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Grado y Sección:</label>
                    {loadingSecciones ? (
                        <span style={{ fontSize: '13px', color: 'var(--stitch-on-surface-variant)' }}>Cargando secciones...</span>
                    ) : (
                        <select 
                            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)', fontSize: '14px' }}
                            value={seccionSeleccionada}
                            onChange={e => setSeccionSeleccionada(e.target.value)}
                        >
                            {secciones.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                        </select>
                    )}
                </div>

                <div style={{ width: '160px' }}>
                    <label style={{ fontSize: '12px', color: 'var(--stitch-on-surface-variant)', display: 'block', marginBottom: '6px', fontWeight: 600 }}>Fecha de Auditoría:</label>
                    <input 
                        type="date"
                        style={{ width: '100%', padding: '9px 12px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)', fontSize: '14px', boxSizing: 'border-box' }}
                        value={fecha}
                        onChange={e => setFecha(e.target.value)}
                    />
                </div>

                <button
                    className="st-button st-button-filled"
                    onClick={handleNotificarFaltas}
                    disabled={actionLoading || loading}
                    style={{
                        padding: '10px 20px', borderRadius: '10px', border: 'none',
                        background: 'var(--stitch-error, #dc3545)', color: '#fff',
                        cursor: (actionLoading || loading) ? 'not-allowed' : 'pointer',
                        fontSize: '14px', fontWeight: 600,
                        display: 'flex', alignItems: 'center', gap: '6px',
                        transition: 'opacity 0.15s',
                        height: '42px', boxSizing: 'border-box',
                        opacity: (actionLoading || loading) ? 0.7 : 1
                    }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>forward_to_inbox</span>
                    Confirmar y Notificar Faltas
                </button>
            </div>

            {/* Listado de Asistencia del Grado */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '40px', color: 'var(--stitch-primary)', animation: 'spin 1s linear infinite' }}>sync</span>
                    <p style={{ color: 'var(--stitch-on-surface-variant)', marginTop: '10px' }}>Cargando reporte de asistencia diaria...</p>
                </div>
            ) : error ? (
                <div style={{ padding: '16px', background: 'var(--stitch-error-container)', color: 'var(--stitch-error)', borderRadius: '10px' }}>
                    {error}
                </div>
            ) : (
                <div className="st-card" style={{ borderRadius: '12px', overflow: 'hidden', padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--stitch-surface-variant, rgba(0,0,0,0.03))', borderBottom: '1px solid var(--stitch-outline-variant)' }}>
                                    <th style={{ padding: '12px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>Código UA</th>
                                    <th style={{ padding: '12px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>Nombre Completo</th>
                                    <th style={{ padding: '12px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>Estado Asistencia</th>
                                    <th style={{ padding: '12px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>Justificada</th>
                                    <th style={{ padding: '12px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>Observaciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {asistencia.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--stitch-on-surface-variant)' }}>No hay reportes de asistencia para esta fecha.</td>
                                    </tr>
                                ) : (
                                    asistencia.map(a => {
                                        let estadoColor = 'var(--stitch-success)';
                                        let estadoLabel = 'Presente';
                                        if (a.estado === 'Inasistencia') {
                                            estadoColor = 'var(--stitch-error)';
                                            estadoLabel = 'Inasistencia';
                                        } else if (a.estado === 'Llegada Tarde') {
                                            estadoColor = 'var(--stitch-warning)';
                                            estadoLabel = 'Llegada Tarde';
                                        } else if (!a.estado) {
                                            estadoColor = 'var(--stitch-neutral-60)';
                                            estadoLabel = 'Sin Reportar';
                                        }

                                        return (
                                            <tr key={a.estudiante_id} style={{ borderBottom: '1px solid var(--stitch-outline-variant)', transition: 'background-color 0.15s' }}>
                                                <td style={{ padding: '12px 18px', fontSize: '14px', fontWeight: 600, color: 'var(--stitch-primary)' }}>{a.codigo_ua}</td>
                                                <td style={{ padding: '12px 18px', fontSize: '14px', color: 'var(--stitch-on-surface)' }}>{a.nombre_completo}</td>
                                                <td style={{ padding: '12px 18px' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                        background: `${estadoColor}22`, color: estadoColor,
                                                        border: `1px solid ${estadoColor}55`, borderRadius: '20px',
                                                        padding: '3px 10px', fontSize: '12px', fontWeight: 600
                                                    }}>
                                                        {estadoLabel}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 18px', fontSize: '14px' }}>
                                                    {a.estado === 'Inasistencia' ? (
                                                        a.justificada ? (
                                                            <span style={{ color: 'var(--stitch-success)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                                <span className="material-icons-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                                                                Sí
                                                            </span>
                                                        ) : (
                                                            <span style={{ color: 'var(--stitch-error)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                                <span className="material-icons-outlined" style={{ fontSize: '16px' }}>cancel</span>
                                                                No
                                                            </span>
                                                        )
                                                    ) : '-'}
                                                </td>
                                                <td style={{ padding: '12px 18px', fontSize: '14px', color: 'var(--stitch-on-surface-variant)' }}>
                                                    {a.observaciones || 'Sin observaciones'}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
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
