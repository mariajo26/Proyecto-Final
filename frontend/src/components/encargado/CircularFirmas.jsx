import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

// ============================================================================
// DOCUMENTACIÓN TÉCNICA: JSON ESPERADO DESDE EL BACKEND
// ============================================================================
/*
GET /api/comunicacion/circulares/tutor
Response Array:
[
  {
    "_id": "64b1a2e3f8d4c1a2b3c4d5e6",
    "titulo": "Circular N.01 — Asueto Día del Maestro",
    "contenido": "Se informa a los padres de familia...",
    "tipo": "Informativa" | "Autorizacion",
    "estado_global": "Enviada" | "Autorizado" | "No Autorizado",
    "fecha_publicacion": "2026-07-01T08:00:00Z",
    "fecha_limite": "2026-07-10T23:59:00Z",  // Solo Autorizacion
    "mi_firma": {
      "estado": "Enviada" | "Autorizado" | "No Autorizado",
      "metodo": "Virtual" | "Presencial",
      "fecha_firma": "2026-07-08T14:30:00Z"
    } | null,
    "leida_por_mi": false   // Solo Informativas
  }
]

PUT /api/comunicacion/circulares/:circular_id/leer    → auto-trigger al abrir
PUT /api/comunicacion/circulares/:circular_id/autorizar (body: { estudiante_id, autorizado: true })
PUT /api/comunicacion/circulares/:circular_id/rechazar (body: { estudiante_id })
*/

// ── Máquina de Estados FSM para la UI del Padre ──────────────────────────────
// Informativas: No Leido → Leido (al hacer clic)
// Autorizaciones:
//   Enviada (acción requerida) → Autorizado | No Autorizado
//   Todos los estados pasados → solo lectura en Historial

const ESTADO_CONFIG = {
    'No Leido':      { label: 'No Leído',            color: 'var(--stitch-warning)',    icon: 'mark_email_unread'   },
    'Leido':         { label: 'Leído',                color: 'var(--stitch-success)',    icon: 'mark_email_read'     },
    'Enviada':       { label: 'Firma Requerida',      color: 'var(--stitch-error)',      icon: 'priority_high'       },
    'Autorizado':    { label: 'Autorizado',           color: 'var(--stitch-success)',    icon: 'verified'            },
    'No Autorizado': { label: 'No Autorizado',        color: 'var(--stitch-neutral-60)', icon: 'do_not_disturb_on'  },
    'Presencial':    { label: 'Pendiente Firma Física', color: 'var(--stitch-info)',     icon: 'edit_note'           }
};

function EstadoBadge({ estado, metodo }) {
    const key = (estado === 'Enviada' && metodo === 'Presencial') ? 'Presencial' : estado;
    const cfg = ESTADO_CONFIG[key] || ESTADO_CONFIG['No Leido'];
    return (
        <span className="st-badge" style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: `${cfg.color}22`,
            color: cfg.color,
            border: `1px solid ${cfg.color}55`,
            borderRadius: '20px', padding: '3px 10px', fontSize: '12px', fontWeight: 600
        }}>
            <span className="material-icons-outlined" style={{ fontSize: '14px' }}>{cfg.icon}</span>
            {cfg.label}
        </span>
    );
}

function CircularCard({ circular, onAbrir, onAutorizar, onRechazar, loading }) {
    const esAutorizacion = circular.tipo === 'Autorizacion';
    const firmaEstado = circular.mi_firma?.estado;
    const firmaMetodo = circular.mi_firma?.metodo;
    const requiereAccion = esAutorizacion && firmaEstado === 'Enviada';
    const yaLeida = circular.leida_por_mi;

    const fechaLimite = circular.fecha_limite ? new Date(circular.fecha_limite) : null;
    const ahora = new Date();
    const horasRestantes = fechaLimite ? Math.max(0, Math.ceil((fechaLimite - ahora) / 3600000)) : null;
    const urgente = horasRestantes !== null && horasRestantes < 24 && requiereAccion;

    return (
        <div
            className="st-card"
            style={{
                borderRadius: '12px',
                padding: '16px 20px',
                marginBottom: '12px',
                borderLeft: `4px solid ${requiereAccion
                    ? (urgente ? 'var(--stitch-error)' : 'var(--stitch-warning)')
                    : (esAutorizacion ? 'var(--stitch-success)' : 'var(--stitch-primary)')}`,
                background: requiereAccion && urgente
                    ? 'var(--stitch-error-container, rgba(220,53,69,0.06))'
                    : 'var(--stitch-surface)',
                transition: 'box-shadow 0.2s',
                cursor: 'default'
            }}
        >
            {/* Fila superior: título + badge */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '12px', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span className="material-icons-outlined" style={{
                            fontSize: '20px',
                            color: esAutorizacion ? 'var(--stitch-warning)' : 'var(--stitch-primary)'
                        }}>
                            {esAutorizacion ? 'assignment' : 'campaign'}
                        </span>
                        <h3 style={{
                            margin: 0,
                            fontSize: '15px',
                            fontWeight: 600,
                            color: 'var(--stitch-on-surface)',
                            fontFamily: 'var(--stitch-font-family, Google Sans, sans-serif)'
                        }}>{circular.titulo}</h3>
                        {!yaLeida && !esAutorizacion && (
                            <span style={{
                                background: 'var(--stitch-primary)',
                                color: '#fff',
                                borderRadius: '10px',
                                fontSize: '10px',
                                padding: '2px 8px',
                                fontWeight: 700,
                                letterSpacing: '0.5px'
                            }}>NUEVO</span>
                        )}
                    </div>
                    <p style={{
                        margin: '4px 0 0 28px',
                        fontSize: '13px',
                        color: 'var(--stitch-on-surface-variant)',
                        fontFamily: 'var(--stitch-font-family)'
                    }}>
                        Publicado el {new Date(circular.fecha_publicacion).toLocaleDateString('es-GT', {
                            day: '2-digit', month: 'long', year: 'numeric'
                        })}
                    </p>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
                    {esAutorizacion
                        ? <EstadoBadge estado={firmaEstado || 'No Autorizado'} metodo={firmaMetodo} />
                        : <EstadoBadge estado={yaLeida ? 'Leido' : 'No Leido'} />
                    }
                </div>
            </div>

            {/* Info adicional para autorizaciones enviadas */}
            {requiereAccion && (
                <div style={{
                    marginTop: '12px',
                    padding: '10px 14px',
                    background: urgente ? 'var(--stitch-error-container, rgba(220,53,69,0.1))' : 'var(--stitch-warning-container, rgba(255,193,7,0.1))',
                    borderRadius: '8px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px'
                }}>
                    <span className="material-icons-outlined" style={{
                        fontSize: '18px',
                        color: urgente ? 'var(--stitch-error)' : 'var(--stitch-warning)',
                        marginTop: '1px'
                    }}>
                        {urgente ? 'warning' : 'info'}
                    </span>
                    <div style={{ fontSize: '13px', color: 'var(--stitch-on-surface)', lineHeight: 1.5 }}>
                        {fechaLimite && (
                            <div>
                                <strong>Fecha límite:</strong> {fechaLimite.toLocaleDateString('es-GT', {
                                    day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                                })}
                                {urgente && <span style={{ color: 'var(--stitch-error)', fontWeight: 700 }}> — ¡Vence en {horasRestantes}h!</span>}
                            </div>
                        )}
                        {firmaMetodo === 'Presencial' && (
                            <div style={{ marginTop: '4px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <span className="material-icons-outlined" style={{ fontSize: '15px' }}>edit_note</span>
                                Debe entregar el formato físico firmado en secretaría.
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Pie: botón leer + acciones */}
            <div style={{
                marginTop: '14px',
                display: 'flex',
                gap: '10px',
                flexWrap: 'wrap',
                justifyContent: 'flex-end'
            }}>
                {/* Botón ver / leer documento */}
                <button
                    className="st-button st-button-text"
                    onClick={() => onAbrir(circular)}
                    style={{
                        display: 'flex', alignItems: 'center', gap: '6px',
                        fontSize: '13px', padding: '6px 14px',
                        borderRadius: '8px', border: '1px solid var(--stitch-outline)',
                        background: 'transparent', color: 'var(--stitch-primary)',
                        cursor: 'pointer', fontFamily: 'var(--stitch-font-family)',
                        transition: 'background 0.15s'
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--stitch-primary-container, rgba(0,100,200,0.08))'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '16px' }}>
                        {esAutorizacion ? 'description' : 'open_in_new'}
                    </span>
                    Ver documento
                </button>

                {/* Acciones para autorizaciones en estado Enviada */}
                {requiereAccion && (
                    <>
                        <button
                            className="st-button st-button-filled"
                            onClick={() => onAutorizar(circular)}
                            disabled={loading}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                fontSize: '13px', padding: '6px 16px',
                                borderRadius: '8px', border: 'none',
                                background: 'var(--stitch-success, #198754)',
                                color: '#fff', cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: 'var(--stitch-font-family)', fontWeight: 600,
                                opacity: loading ? 0.7 : 1,
                                transition: 'opacity 0.15s'
                            }}
                        >
                            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                            Autorizar
                        </button>
                        <button
                            className="st-button st-button-outlined"
                            onClick={() => onRechazar(circular)}
                            disabled={loading}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                fontSize: '13px', padding: '6px 16px',
                                borderRadius: '8px', border: '1px solid var(--stitch-error)',
                                background: 'transparent', color: 'var(--stitch-error)',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                fontFamily: 'var(--stitch-font-family)', fontWeight: 600,
                                opacity: loading ? 0.7 : 1
                            }}
                        >
                            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>cancel</span>
                            No Autorizar
                        </button>
                    </>
                )}
            </div>
        </div>
    );
}

// ── Modal de lectura ──────────────────────────────────────────────────────────
function ModalLectura({ circular, onClose }) {
    if (!circular) return null;
    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--stitch-surface)',
                borderRadius: '16px',
                width: '100%', maxWidth: '640px',
                maxHeight: '85vh',
                display: 'flex', flexDirection: 'column',
                boxShadow: '0 24px 64px rgba(0,0,0,0.3)',
                overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
                {/* Cabecera */}
                <div style={{
                    padding: '20px 24px 16px',
                    borderBottom: '1px solid var(--stitch-outline-variant)',
                    display: 'flex', alignItems: 'flex-start', gap: '12px'
                }}>
                    <span className="material-icons-outlined" style={{
                        fontSize: '28px',
                        color: circular.tipo === 'Autorizacion' ? 'var(--stitch-warning)' : 'var(--stitch-primary)',
                        marginTop: '2px'
                    }}>
                        {circular.tipo === 'Autorizacion' ? 'assignment' : 'campaign'}
                    </span>
                    <div style={{ flex: 1 }}>
                        <h2 style={{
                            margin: 0, fontSize: '18px', fontWeight: 700,
                            color: 'var(--stitch-on-surface)',
                            fontFamily: 'var(--stitch-font-family)'
                        }}>{circular.titulo}</h2>
                        <p style={{
                            margin: '4px 0 0', fontSize: '13px',
                            color: 'var(--stitch-on-surface-variant)',
                            fontFamily: 'var(--stitch-font-family)'
                        }}>
                            {new Date(circular.fecha_publicacion).toLocaleDateString('es-GT', {
                                day: '2-digit', month: 'long', year: 'numeric'
                            })}
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--stitch-on-surface-variant)', padding: '4px'
                    }}>
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>

                {/* Cuerpo */}
                <div style={{
                    padding: '20px 24px',
                    overflowY: 'auto', flex: 1,
                    fontSize: '14px',
                    lineHeight: 1.7,
                    color: 'var(--stitch-on-surface)',
                    fontFamily: 'var(--stitch-font-family)',
                    whiteSpace: 'pre-wrap'
                }}>
                    {circular.contenido}

                    {circular.fecha_limite && (
                        <div style={{
                            marginTop: '20px',
                            padding: '12px 16px',
                            background: 'var(--stitch-warning-container, rgba(255,193,7,0.12))',
                            borderRadius: '10px',
                            display: 'flex', alignItems: 'center', gap: '8px',
                            fontSize: '13px', fontWeight: 600,
                            color: 'var(--stitch-on-surface)'
                        }}>
                            <span className="material-icons-outlined" style={{ fontSize: '18px', color: 'var(--stitch-warning)' }}>schedule</span>
                            Fecha límite de respuesta: {new Date(circular.fecha_limite).toLocaleString('es-GT', {
                                day: '2-digit', month: 'long', year: 'numeric',
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </div>
                    )}
                </div>

                <div style={{ padding: '16px 24px', borderTop: '1px solid var(--stitch-outline-variant)' }}>
                    <button onClick={onClose} className="st-button" style={{
                        width: '100%', padding: '10px',
                        borderRadius: '10px', border: 'none',
                        background: 'var(--stitch-primary)',
                        color: '#fff', fontWeight: 600,
                        fontSize: '14px', cursor: 'pointer',
                        fontFamily: 'var(--stitch-font-family)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px'
                    }}>
                        <span className="material-icons-outlined" style={{ fontSize: '18px' }}>done</span>
                        Entendido y Cerrar
                    </button>
                </div>
            </div>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function CircularFirmas() {
    const { token, user } = useAuth();
    const [circulares, setCirculares] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [tabActiva, setTabActiva] = useState('pendientes');
    const [circularModal, setCircularModal] = useState(null);
    const [toast, setToast] = useState(null);

    const showToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchCirculares = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/comunicacion/circulares/tutor', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('No se pudo cargar las circulares.');
            const data = await res.json();
            setCirculares(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchCirculares(); }, [fetchCirculares]);

    // Auto-trigger al abrir: marcar como leída
    const handleAbrir = async (circular) => {
        setCircularModal(circular);
        if (circular.tipo === 'Informativa' && !circular.leida_por_mi) {
            try {
                await fetch(`/api/comunicacion/circulares/${circular._id}/leer`, {
                    method: 'PUT',
                    headers: { Authorization: `Bearer ${token}` }
                });
                // Actualizar estado local
                setCirculares(prev => prev.map(c =>
                    c._id === circular._id ? { ...c, leida_por_mi: true } : c
                ));
            } catch (_) { /* silencioso */ }
        }
    };

    const handleAutorizar = async (circular) => {
        setActionLoading(true);
        try {
            const res = await fetch(`/api/comunicacion/circulares/autorizar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    circular_id: circular._id,
                    estudiante_id: circular.mi_firma?.estudiante_id,
                    autorizado: true
                })
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Error al autorizar.');
            }
            showToast('Circular autorizada correctamente.', 'success');
            await fetchCirculares();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleRechazar = async (circular) => {
        if (!window.confirm(`¿Seguro que desea NO AUTORIZAR la circular "${circular.titulo}"?`)) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/comunicacion/circulares/${circular._id}/rechazar`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({ estudiante_id: circular.mi_firma?.estudiante_id })
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Error al rechazar.');
            }
            showToast('Circular rechazada y archivada.', 'info');
            await fetchCirculares();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    // ── Filtrado por tab ──
    const circularesFiltradas = {
        pendientes: circulares.filter(c =>
            c.tipo === 'Autorizacion' && c.mi_firma?.estado === 'Enviada'
        ),
        informativas: circulares.filter(c => c.tipo === 'Informativa'),
        historial: circulares.filter(c =>
            c.mi_firma && ['Autorizado', 'No Autorizado'].includes(c.mi_firma.estado)
        )
    };

    const pendientesCount = circularesFiltradas.pendientes.length;

    const TABS = [
        { id: 'pendientes',   label: 'Firmas Pendientes', icon: 'priority_high',  count: pendientesCount },
        { id: 'informativas', label: 'Informativas',       icon: 'campaign',       count: 0               },
        { id: 'historial',    label: 'Historial',          icon: 'history',        count: 0               }
    ];

    return (
        <div style={{
            fontFamily: 'var(--stitch-font-family, Google Sans, sans-serif)',
            padding: '0',
            minHeight: '100vh',
            background: 'var(--stitch-background)'
        }}>
            {/* Header */}
            <div style={{
                background: 'var(--stitch-surface)',
                borderBottom: '1px solid var(--stitch-outline-variant)',
                padding: '20px 24px 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '28px', color: 'var(--stitch-primary)' }}>
                        mark_email_unread
                    </span>
                    <div>
                        <h1 style={{
                            margin: 0, fontSize: '22px', fontWeight: 700,
                            color: 'var(--stitch-on-surface)'
                        }}>
                            Circulares y Firmas
                        </h1>
                        <p style={{
                            margin: 0, fontSize: '13px',
                            color: 'var(--stitch-on-surface-variant)'
                        }}>
                            Comunicados oficiales y autorizaciones de la Dirección
                        </p>
                    </div>
                    {pendientesCount > 0 && (
                        <span style={{
                            marginLeft: 'auto',
                            background: 'var(--stitch-error)',
                            color: '#fff',
                            borderRadius: '50%',
                            width: '28px', height: '28px',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: '13px', fontWeight: 700
                        }}>
                            {pendientesCount}
                        </span>
                    )}
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2px', marginTop: '16px', overflowX: 'auto' }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setTabActiva(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '10px 18px',
                                border: 'none',
                                borderBottom: `3px solid ${tabActiva === tab.id ? 'var(--stitch-primary)' : 'transparent'}`,
                                background: 'transparent',
                                color: tabActiva === tab.id ? 'var(--stitch-primary)' : 'var(--stitch-on-surface-variant)',
                                fontWeight: tabActiva === tab.id ? 700 : 400,
                                fontSize: '14px',
                                cursor: 'pointer',
                                whiteSpace: 'nowrap',
                                transition: 'all 0.15s',
                                fontFamily: 'var(--stitch-font-family)'
                            }}
                        >
                            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>{tab.icon}</span>
                            {tab.label}
                            {tab.count > 0 && (
                                <span style={{
                                    background: 'var(--stitch-error)',
                                    color: '#fff',
                                    borderRadius: '12px',
                                    padding: '1px 7px',
                                    fontSize: '11px',
                                    fontWeight: 700
                                }}>
                                    {tab.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* Contenido */}
            <div style={{ padding: '20px 24px' }}>
                {loading && (
                    <div style={{ textAlign: 'center', padding: '48px 0' }}>
                        <span className="material-icons-outlined" style={{
                            fontSize: '48px', color: 'var(--stitch-primary)',
                            animation: 'spin 1s linear infinite'
                        }}>sync</span>
                        <p style={{ color: 'var(--stitch-on-surface-variant)', marginTop: '12px' }}>
                            Cargando circulares...
                        </p>
                    </div>
                )}

                {error && !loading && (
                    <div style={{
                        padding: '16px 20px', borderRadius: '12px',
                        background: 'var(--stitch-error-container, rgba(220,53,69,0.1))',
                        color: 'var(--stitch-error)', display: 'flex', gap: '10px', alignItems: 'center'
                    }}>
                        <span className="material-icons-outlined">error</span>
                        {error}
                        <button onClick={fetchCirculares} style={{
                            marginLeft: 'auto', background: 'none', border: 'none',
                            color: 'var(--stitch-error)', cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '4px', fontSize: '13px'
                        }}>
                            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>refresh</span>
                            Reintentar
                        </button>
                    </div>
                )}

                {!loading && !error && (() => {
                    const lista = circularesFiltradas[tabActiva] || [];
                    if (lista.length === 0) {
                        return (
                            <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                <span className="material-icons-outlined" style={{
                                    fontSize: '64px', color: 'var(--stitch-outline)'
                                }}>
                                    {tabActiva === 'pendientes' ? 'check_circle' :
                                     tabActiva === 'informativas' ? 'mark_email_read' : 'history'}
                                </span>
                                <p style={{
                                    color: 'var(--stitch-on-surface-variant)',
                                    marginTop: '12px', fontSize: '15px'
                                }}>
                                    {tabActiva === 'pendientes'
                                        ? 'No tiene autorizaciones pendientes. ¡Todo al día!'
                                        : tabActiva === 'informativas'
                                        ? 'No hay circulares informativas publicadas.'
                                        : 'No hay circulares en el historial.'}
                                </p>
                            </div>
                        );
                    }

                    return lista.map(c => (
                        <CircularCard
                            key={c._id}
                            circular={c}
                            onAbrir={handleAbrir}
                            onAutorizar={handleAutorizar}
                            onRechazar={handleRechazar}
                            loading={actionLoading}
                        />
                    ));
                })()}
            </div>

            {/* Modal de lectura */}
            <ModalLectura circular={circularModal} onClose={() => setCircularModal(null)} />

            {/* Toast notification */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', left: '50%',
                    transform: 'translateX(-50%)',
                    background: toast.tipo === 'success' ? 'var(--stitch-success, #198754)'
                              : toast.tipo === 'error'   ? 'var(--stitch-error, #dc3545)'
                              : 'var(--stitch-primary)',
                    color: '#fff',
                    borderRadius: '12px',
                    padding: '12px 24px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '14px', fontWeight: 500,
                    zIndex: 2000, animation: 'slideUp 0.3s ease',
                    fontFamily: 'var(--stitch-font-family)'
                }}>
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>
                        {toast.tipo === 'success' ? 'check_circle'
                         : toast.tipo === 'error' ? 'error'
                         : 'info'}
                    </span>
                    {toast.msg}
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}
