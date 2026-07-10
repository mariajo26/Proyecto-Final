import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

// ============================================================================
// DOCUMENTACIÓN TÉCNICA: JSON ESPERADO DESDE EL BACKEND
// ============================================================================
/*
GET /api/incidentes/tutor
Response Array:
[
  {
    "id": 1,
    "titulo": "Problema con calificación de Matemática",
    "descripcion": "El profesor registró mal la nota del examen...",
    "estado": "Enviado" | "En Revision" | "Resuelto" | "Cerrado" | "Reabierto",
    "destino_tipo": "Profesor" | "Secretaria",
    "destino_nombre": "Carlos Gomez Estrada",
    "respuesta": "Se revisó el examen y se corrigió la nota.",
    "escalado_por": null | 12,
    "fecha_creacion": "2026-07-01T10:30:00Z",
    "fecha_actualizacion": "2026-07-05T15:00:00Z",
    "puede_editar": true,
    "puede_cerrar": false,
    "puede_reabrir": false,
    "bloqueado": false
  }
]

POST /api/incidentes/tutor          (body: { titulo, descripcion, destino_tipo, destino_id })
PUT  /api/incidentes/:id/cerrar
PUT  /api/incidentes/:id/reabrir    (body: { motivo_reopen })

GET  /api/incidentes/citas/tutor
Response Array:
[
  {
    "id": 5,
    "tipo": "recibida" | "solicitada",
    "contraparte_nombre": "Maria Lopez (Profesora de Biología)",
    "fecha_hora": "2026-07-15T09:00:00Z",
    "motivo": "Revisión de conducta escolar",
    "es_prioritaria": 1,
    "estado": "Pendiente" | "Confirmada" | "Cancelada"
  }
]

POST /api/incidentes/citas          (body: { destinatario_id, fecha_hora, motivo })
GET  /api/incidentes/citas/horarios/:profesor_id
Response Array: [{ dia_semana, hora_inicio, hora_fin }]
*/

// ── FSM Config de estados de casos ───────────────────────────────────────────
const CASO_ESTADOS = {
    'Enviado':    { label: 'Enviado',        color: 'var(--stitch-primary)',   icon: 'send',            desc: 'Su caso fue enviado. Puede editarlo.' },
    'En Revision':{ label: 'En Revisión',   color: 'var(--stitch-warning)',   icon: 'manage_search',   desc: 'El personal está revisando su caso. La edición está bloqueada.' },
    'Resuelto':   { label: 'Resuelto',       color: 'var(--stitch-success)',   icon: 'task_alt',        desc: 'El personal marcó este caso como resuelto. Puede cerrarlo o reabrirlo.' },
    'Cerrado':    { label: 'Cerrado',        color: 'var(--stitch-neutral-60, #757575)', icon: 'lock', desc: 'Caso archivado definitivamente.' },
    'Reabierto':  { label: 'Reabierto',      color: 'var(--stitch-error)',     icon: 'restart_alt',     desc: 'Caso reabierto. Esperando respuesta del personal.' }
};

const CITA_ESTADOS = {
    'Pendiente':  { label: 'Pendiente',      color: 'var(--stitch-warning)',   icon: 'schedule'         },
    'Confirmada': { label: 'Confirmada',     color: 'var(--stitch-success)',   icon: 'event_available'  },
    'Cancelada':  { label: 'Cancelada',      color: 'var(--stitch-error)',     icon: 'event_busy'       }
};

function CasoBadge({ estado }) {
    const cfg = CASO_ESTADOS[estado] || CASO_ESTADOS['Enviado'];
    return (
        <span style={{
            display: 'inline-flex', alignItems: 'center', gap: '4px',
            background: `${cfg.color}22`,
            color: cfg.color,
            border: `1px solid ${cfg.color}55`,
            borderRadius: '20px', padding: '3px 10px',
            fontSize: '12px', fontWeight: 600
        }}>
            <span className="material-icons-outlined" style={{ fontSize: '14px' }}>{cfg.icon}</span>
            {cfg.label}
        </span>
    );
}

// ── Stepper del ciclo de vida del caso ───────────────────────────────────────
function FsmStepper({ estado }) {
    const steps = ['Enviado', 'En Revision', 'Resuelto', 'Cerrado'];
    const especiales = { Reabierto: 2 }; // Reabierto visualmente vuelve al paso 2
    const idx = estado === 'Reabierto' ? 2 : steps.indexOf(estado);

    return (
        <div style={{
            display: 'flex', alignItems: 'center',
            gap: '0', margin: '12px 0 8px',
            overflowX: 'auto', paddingBottom: '4px'
        }}>
            {steps.map((s, i) => {
                const done = i < idx;
                const active = i === idx;
                const cfg = CASO_ESTADOS[s];
                return (
                    <React.Fragment key={s}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: '60px' }}>
                            <div style={{
                                width: '28px', height: '28px', borderRadius: '50%',
                                background: done ? 'var(--stitch-success)' : active ? cfg.color : 'var(--stitch-outline)',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'background 0.3s'
                            }}>
                                <span className="material-icons-outlined" style={{ fontSize: '16px', color: '#fff' }}>
                                    {done ? 'check' : cfg.icon}
                                </span>
                            </div>
                            <span style={{
                                fontSize: '10px', marginTop: '4px',
                                color: active ? cfg.color : 'var(--stitch-on-surface-variant)',
                                fontWeight: active ? 700 : 400,
                                textAlign: 'center', lineHeight: 1.2,
                                whiteSpace: 'nowrap'
                            }}>
                                {s === 'En Revision' ? 'En Revisión' : s}
                            </span>
                        </div>
                        {i < steps.length - 1 && (
                            <div style={{
                                flex: 1, height: '2px',
                                background: i < idx ? 'var(--stitch-success)' : 'var(--stitch-outline)',
                                minWidth: '20px',
                                transition: 'background 0.3s'
                            }} />
                        )}
                    </React.Fragment>
                );
            })}
            {estado === 'Reabierto' && (
                <div style={{
                    marginLeft: '8px', display: 'flex', alignItems: 'center', gap: '4px',
                    color: 'var(--stitch-error)', fontSize: '11px', fontWeight: 700,
                    whiteSpace: 'nowrap'
                }}>
                    <span className="material-icons-outlined" style={{ fontSize: '14px' }}>restart_alt</span>
                    Reabierto
                </div>
            )}
        </div>
    );
}

// ── Tarjeta de caso ───────────────────────────────────────────────────────────
function CasoCard({ caso, onCerrar, onReabrir, loading }) {
    const [expandido, setExpandido] = useState(false);
    const cfg = CASO_ESTADOS[caso.estado] || CASO_ESTADOS['Enviado'];

    return (
        <div style={{
            borderRadius: '12px',
            marginBottom: '12px',
            background: 'var(--stitch-surface)',
            border: `1px solid var(--stitch-outline-variant)`,
            borderLeft: `4px solid ${cfg.color}`,
            overflow: 'hidden',
            transition: 'box-shadow 0.2s'
        }}>
            {/* Cabecera clicable */}
            <div
                onClick={() => setExpandido(prev => !prev)}
                style={{ padding: '14px 18px', cursor: 'pointer' }}
            >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', flexWrap: 'wrap' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '22px', color: cfg.color, marginTop: '2px' }}>
                        {cfg.icon}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                            <h3 style={{
                                margin: 0, fontSize: '15px', fontWeight: 600,
                                color: 'var(--stitch-on-surface)',
                                fontFamily: 'var(--stitch-font-family)'
                            }}>{caso.titulo}</h3>
                            <CasoBadge estado={caso.estado} />
                        </div>
                        <p style={{
                            margin: '4px 0 0', fontSize: '12px',
                            color: 'var(--stitch-on-surface-variant)',
                            fontFamily: 'var(--stitch-font-family)'
                        }}>
                            <span className="material-icons-outlined" style={{ fontSize: '13px', verticalAlign: 'middle' }}>person</span>{' '}
                            {caso.destino_nombre} &nbsp;·&nbsp;
                            <span className="material-icons-outlined" style={{ fontSize: '13px', verticalAlign: 'middle' }}>calendar_today</span>{' '}
                            {new Date(caso.fecha_actualizacion).toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                    </div>
                    <span className="material-icons-outlined" style={{
                        fontSize: '20px', color: 'var(--stitch-on-surface-variant)',
                        transform: expandido ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s'
                    }}>expand_more</span>
                </div>

                {/* Stepper siempre visible */}
                <FsmStepper estado={caso.estado} />

                {/* Hint contextual del estado */}
                <p style={{
                    margin: '4px 0 0', fontSize: '12px',
                    color: cfg.color,
                    fontFamily: 'var(--stitch-font-family)',
                    display: 'flex', alignItems: 'center', gap: '4px'
                }}>
                    <span className="material-icons-outlined" style={{ fontSize: '13px' }}>info</span>
                    {cfg.desc}
                </p>
            </div>

            {/* Detalle expandido */}
            {expandido && (
                <div style={{
                    borderTop: '1px solid var(--stitch-outline-variant)',
                    padding: '16px 18px'
                }}>
                    <p style={{
                        margin: '0 0 12px', fontSize: '14px',
                        color: 'var(--stitch-on-surface)',
                        lineHeight: 1.6, whiteSpace: 'pre-wrap',
                        fontFamily: 'var(--stitch-font-family)'
                    }}>{caso.descripcion}</p>

                    {/* Respuesta del personal */}
                    {caso.respuesta && (
                        <div style={{
                            padding: '12px 16px',
                            background: 'var(--stitch-success-container, rgba(25,135,84,0.08))',
                            borderRadius: '10px',
                            marginBottom: '12px'
                        }}>
                            <div style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                marginBottom: '6px', fontSize: '12px',
                                fontWeight: 700, color: 'var(--stitch-success)',
                                fontFamily: 'var(--stitch-font-family)'
                            }}>
                                <span className="material-icons-outlined" style={{ fontSize: '16px' }}>chat</span>
                                Respuesta del personal
                            </div>
                            <p style={{
                                margin: 0, fontSize: '14px',
                                color: 'var(--stitch-on-surface)',
                                whiteSpace: 'pre-wrap',
                                fontFamily: 'var(--stitch-font-family)'
                            }}>
                                {caso.respuesta}
                            </p>
                        </div>
                    )}

                    {/* Nota de escalamiento */}
                    {caso.escalado_por && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 12px',
                            background: 'var(--stitch-warning-container, rgba(255,193,7,0.1))',
                            borderRadius: '8px', marginBottom: '12px',
                            fontSize: '12px', color: 'var(--stitch-on-surface)',
                            fontFamily: 'var(--stitch-font-family)'
                        }}>
                            <span className="material-icons-outlined" style={{ fontSize: '16px', color: 'var(--stitch-warning)' }}>transfer_within_a_station</span>
                            Este caso fue escalado a Secretaría por el docente.
                        </div>
                    )}

                    {/* Acciones según estado FSM */}
                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                        {caso.puede_cerrar && (
                            <button
                                onClick={() => onCerrar(caso.id)}
                                disabled={loading}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                                    background: 'var(--stitch-success, #198754)',
                                    color: '#fff', cursor: 'pointer',
                                    fontSize: '13px', fontWeight: 600,
                                    fontFamily: 'var(--stitch-font-family)',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                <span className="material-icons-outlined" style={{ fontSize: '16px' }}>lock</span>
                                Cerrar caso
                            </button>
                        )}
                        {caso.puede_reabrir && (
                            <button
                                onClick={() => onReabrir(caso.id)}
                                disabled={loading}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '6px',
                                    padding: '8px 16px', borderRadius: '8px',
                                    border: '1px solid var(--stitch-error)',
                                    background: 'transparent',
                                    color: 'var(--stitch-error)',
                                    cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                                    fontFamily: 'var(--stitch-font-family)',
                                    opacity: loading ? 0.7 : 1
                                }}
                            >
                                <span className="material-icons-outlined" style={{ fontSize: '16px' }}>restart_alt</span>
                                En desacuerdo — Reabrir
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

// ── Tarjeta de Cita ───────────────────────────────────────────────────────────
function CitaCard({ cita }) {
    const cfg = CITA_ESTADOS[cita.estado] || CITA_ESTADOS['Pendiente'];
    const esPrioritaria = cita.es_prioritaria === 1 || cita.es_prioritaria === true;

    return (
        <div style={{
            borderRadius: '12px',
            padding: '16px 20px',
            marginBottom: '12px',
            background: esPrioritaria
                ? 'linear-gradient(135deg, rgba(220,53,69,0.08) 0%, rgba(255,193,7,0.08) 100%)'
                : 'var(--stitch-surface)',
            border: `1px solid ${esPrioritaria ? 'var(--stitch-error)' : 'var(--stitch-outline-variant)'}`,
            borderLeft: `4px solid ${esPrioritaria ? 'var(--stitch-error)' : cfg.color}`
        }}>
            {/* Alerta de prioridad */}
            {esPrioritaria && (
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '6px',
                    background: 'var(--stitch-error)',
                    color: '#fff', borderRadius: '8px',
                    padding: '4px 12px', marginBottom: '12px',
                    fontSize: '12px', fontWeight: 700, width: 'fit-content',
                    fontFamily: 'var(--stitch-font-family)'
                }}>
                    <span className="material-icons-outlined" style={{ fontSize: '15px' }}>notification_important</span>
                    CITA PRIORITARIA — Atención Inmediata Requerida
                </div>
            )}

            <div style={{ display: 'flex', gap: '14px', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                {/* Icono de tipo */}
                <div style={{
                    width: '44px', height: '44px', borderRadius: '12px', flexShrink: 0,
                    background: `${esPrioritaria ? 'var(--stitch-error)' : 'var(--stitch-primary)'}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                    <span className="material-icons-outlined" style={{
                        fontSize: '24px',
                        color: esPrioritaria ? 'var(--stitch-error)' : 'var(--stitch-primary)'
                    }}>
                        {cita.tipo === 'recibida' ? 'person_pin_circle' : 'event'}
                    </span>
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                        <h3 style={{
                            margin: 0, fontSize: '15px', fontWeight: 600,
                            color: 'var(--stitch-on-surface)',
                            fontFamily: 'var(--stitch-font-family)'
                        }}>
                            {cita.tipo === 'recibida'
                                ? `Cita convocada por ${cita.contraparte_nombre}`
                                : `Cita solicitada con ${cita.contraparte_nombre}`
                            }
                        </h3>
                        <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: '4px',
                            background: `${cfg.color}22`, color: cfg.color,
                            border: `1px solid ${cfg.color}55`,
                            borderRadius: '20px', padding: '3px 10px',
                            fontSize: '12px', fontWeight: 600
                        }}>
                            <span className="material-icons-outlined" style={{ fontSize: '13px' }}>{cfg.icon}</span>
                            {cfg.label}
                        </span>
                    </div>

                    <div style={{
                        marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '16px',
                        fontSize: '13px', color: 'var(--stitch-on-surface-variant)',
                        fontFamily: 'var(--stitch-font-family)'
                    }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '15px' }}>event</span>
                            {new Date(cita.fecha_hora).toLocaleDateString('es-GT', {
                                weekday: 'long', day: '2-digit', month: 'long', year: 'numeric'
                            })}
                        </span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '15px' }}>schedule</span>
                            {new Date(cita.fecha_hora).toLocaleTimeString('es-GT', {
                                hour: '2-digit', minute: '2-digit'
                            })}
                        </span>
                    </div>

                    {cita.motivo && (
                        <p style={{
                            margin: '6px 0 0', fontSize: '13px',
                            color: 'var(--stitch-on-surface)',
                            fontFamily: 'var(--stitch-font-family)',
                            display: 'flex', alignItems: 'flex-start', gap: '4px'
                        }}>
                            <span className="material-icons-outlined" style={{ fontSize: '14px', marginTop: '1px', flexShrink: 0 }}>notes</span>
                            {cita.motivo}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Modal crear nuevo caso ────────────────────────────────────────────────────
function ModalNuevoCaso({ onClose, onSubmit, loading }) {
    const [form, setForm] = useState({
        titulo: '',
        descripcion: '',
        destino_tipo: 'Profesor',
        destino_id: ''
    });

    const handleChange = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.titulo.trim() || !form.descripcion.trim() || !form.destino_id) return;
        await onSubmit(form);
    };

    const inputStyle = {
        width: '100%', padding: '10px 14px',
        borderRadius: '8px',
        border: '1px solid var(--stitch-outline)',
        background: 'var(--stitch-surface-variant, rgba(0,0,0,0.04))',
        color: 'var(--stitch-on-surface)',
        fontSize: '14px', fontFamily: 'var(--stitch-font-family)',
        outline: 'none', boxSizing: 'border-box',
        transition: 'border-color 0.15s'
    };

    return (
        <div style={{
            position: 'fixed', inset: 0, zIndex: 1000,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '16px'
        }} onClick={onClose}>
            <div style={{
                background: 'var(--stitch-surface)',
                borderRadius: '16px', width: '100%', maxWidth: '540px',
                boxShadow: '0 24px 64px rgba(0,0,0,0.3)', overflow: 'hidden'
            }} onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div style={{
                    padding: '20px 24px',
                    borderBottom: '1px solid var(--stitch-outline-variant)',
                    display: 'flex', alignItems: 'center', gap: '12px'
                }}>
                    <span className="material-icons-outlined" style={{ fontSize: '26px', color: 'var(--stitch-primary)' }}>
                        report_problem
                    </span>
                    <div style={{ flex: 1 }}>
                        <h2 style={{
                            margin: 0, fontSize: '18px', fontWeight: 700,
                            color: 'var(--stitch-on-surface)',
                            fontFamily: 'var(--stitch-font-family)'
                        }}>Nuevo Reporte / Queja</h2>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-on-surface-variant)', fontFamily: 'var(--stitch-font-family)' }}>
                            Complete el formulario para enviar su caso al personal
                        </p>
                    </div>
                    <button onClick={onClose} style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        color: 'var(--stitch-on-surface-variant)'
                    }}>
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stitch-on-surface)', fontFamily: 'var(--stitch-font-family)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '15px' }}>title</span>
                            Título del caso
                        </label>
                        <input
                            required
                            style={inputStyle}
                            placeholder="Ej: Inconformidad con calificación de Matemática..."
                            value={form.titulo}
                            onChange={e => handleChange('titulo', e.target.value)}
                            onFocus={e => e.target.style.borderColor = 'var(--stitch-primary)'}
                            onBlur={e => e.target.style.borderColor = 'var(--stitch-outline)'}
                        />
                    </div>

                    <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stitch-on-surface)', fontFamily: 'var(--stitch-font-family)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '15px' }}>description</span>
                            Descripción detallada
                        </label>
                        <textarea
                            required
                            rows={4}
                            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
                            placeholder="Describa el problema con el mayor detalle posible..."
                            value={form.descripcion}
                            onChange={e => handleChange('descripcion', e.target.value)}
                            onFocus={e => e.target.style.borderColor = 'var(--stitch-primary)'}
                            onBlur={e => e.target.style.borderColor = 'var(--stitch-outline)'}
                        />
                    </div>

                    <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                        <div style={{ flex: 1, minWidth: '140px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stitch-on-surface)', fontFamily: 'var(--stitch-font-family)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                                <span className="material-icons-outlined" style={{ fontSize: '15px' }}>send_to_mobile</span>
                                Dirigir a
                            </label>
                            <select
                                style={inputStyle}
                                value={form.destino_tipo}
                                onChange={e => handleChange('destino_tipo', e.target.value)}
                            >
                                <option value="Profesor">Profesor</option>
                                <option value="Secretaria">Secretaría</option>
                            </select>
                        </div>
                        <div style={{ flex: 1, minWidth: '140px' }}>
                            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--stitch-on-surface)', fontFamily: 'var(--stitch-font-family)', display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
                                <span className="material-icons-outlined" style={{ fontSize: '15px' }}>badge</span>
                                ID del destinatario
                            </label>
                            <input
                                required
                                type="number"
                                style={inputStyle}
                                placeholder="ID del usuario"
                                value={form.destino_id}
                                onChange={e => handleChange('destino_id', e.target.value)}
                                onFocus={e => e.target.style.borderColor = 'var(--stitch-primary)'}
                                onBlur={e => e.target.style.borderColor = 'var(--stitch-outline)'}
                            />
                        </div>
                    </div>

                    <div style={{
                        padding: '10px 14px',
                        background: 'var(--stitch-primary-container, rgba(0,100,200,0.08))',
                        borderRadius: '10px',
                        display: 'flex', alignItems: 'flex-start', gap: '8px',
                        fontSize: '12px', color: 'var(--stitch-on-surface)',
                        fontFamily: 'var(--stitch-font-family)'
                    }}>
                        <span className="material-icons-outlined" style={{ fontSize: '16px', color: 'var(--stitch-primary)', marginTop: '1px' }}>info</span>
                        <span>Si el caso es académico dirígelo al <strong>Profesor</strong>. Si es administrativo dirígelo a <strong>Secretaría</strong>.</span>
                    </div>

                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                        <button type="button" onClick={onClose} style={{
                            padding: '10px 20px', borderRadius: '8px',
                            border: '1px solid var(--stitch-outline)',
                            background: 'transparent', color: 'var(--stitch-on-surface)',
                            cursor: 'pointer', fontSize: '14px',
                            fontFamily: 'var(--stitch-font-family)'
                        }}>
                            Cancelar
                        </button>
                        <button type="submit" disabled={loading} style={{
                            padding: '10px 24px', borderRadius: '8px', border: 'none',
                            background: 'var(--stitch-primary)', color: '#fff',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            fontSize: '14px', fontWeight: 600,
                            fontFamily: 'var(--stitch-font-family)',
                            opacity: loading ? 0.7 : 1,
                            display: 'flex', alignItems: 'center', gap: '6px'
                        }}>
                            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>send</span>
                            {loading ? 'Enviando...' : 'Enviar caso'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

// ── Componente principal ──────────────────────────────────────────────────────
export default function GestionCasos() {
    const { token } = useAuth();
    const [tabActiva, setTabActiva] = useState('casos');
    const [casos, setCasos] = useState([]);
    const [citas, setCitas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [error, setError] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [toast, setToast] = useState(null);

    const showToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchCasos = useCallback(async () => {
        setLoading(true); setError(null);
        try {
            const [resCasos, resCitas] = await Promise.all([
                fetch('/api/incidentes/tutor', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/incidentes/citas/tutor', { headers: { Authorization: `Bearer ${token}` } })
            ]);
            if (!resCasos.ok || !resCitas.ok) throw new Error('Error al cargar los datos.');
            const [dataCasos, dataCitas] = await Promise.all([resCasos.json(), resCitas.json()]);
            setCasos(dataCasos);
            setCitas(dataCitas);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => { fetchCasos(); }, [fetchCasos]);

    const handleCrearCaso = async (form) => {
        setActionLoading(true);
        try {
            const res = await fetch('/api/incidentes/tutor', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify(form)
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error || 'Error al crear el caso.');
            }
            showToast('Caso enviado exitosamente.', 'success');
            setMostrarFormulario(false);
            await fetchCasos();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleCerrar = async (id) => {
        if (!window.confirm('¿Confirma que la solución fue satisfactoria y desea cerrar este caso definitivamente?')) return;
        setActionLoading(true);
        try {
            const res = await fetch(`/api/incidentes/${id}/cerrar`, {
                method: 'PUT',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error);
            }
            showToast('Caso cerrado y archivado.', 'success');
            await fetchCasos();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const handleReabrir = async (id) => {
        const motivo = window.prompt('Indique por qué no está de acuerdo con la resolución:');
        if (motivo === null) return; // Canceló
        setActionLoading(true);
        try {
            const res = await fetch(`/api/incidentes/${id}/reabrir`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ motivo_reopen: motivo })
            });
            if (!res.ok) {
                const d = await res.json();
                throw new Error(d.error);
            }
            showToast('Caso reabierto. El personal ha sido notificado.', 'info');
            await fetchCasos();
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setActionLoading(false);
        }
    };

    const casosActivos = casos.filter(c => c.estado !== 'Cerrado');
    const casosArchivados = casos.filter(c => c.estado === 'Cerrado');
    const citasEntrantes = citas.filter(c => c.tipo === 'recibida' && c.estado !== 'Cancelada');
    const citasPrioritarias = citas.filter(c => c.es_prioritaria === 1 || c.es_prioritaria === true);

    const TABS = [
        { id: 'casos',    label: 'Reportes e Incidentes', icon: 'report_problem', count: casosActivos.length   },
        { id: 'historial',label: 'Historial',              icon: 'archive',       count: 0                     },
        { id: 'citas',    label: 'Citas Presenciales',     icon: 'event',         count: citasEntrantes.length }
    ];

    return (
        <div style={{
            fontFamily: 'var(--stitch-font-family, Google Sans, sans-serif)',
            minHeight: '100vh',
            background: 'var(--stitch-background)'
        }}>
            {/* Header */}
            <div style={{
                background: 'var(--stitch-surface)',
                borderBottom: '1px solid var(--stitch-outline-variant)',
                padding: '20px 24px 0'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '4px', flexWrap: 'wrap' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '28px', color: 'var(--stitch-primary)' }}>
                        support_agent
                    </span>
                    <div style={{ flex: 1 }}>
                        <h1 style={{ margin: 0, fontSize: '22px', fontWeight: 700, color: 'var(--stitch-on-surface)' }}>
                            Gestión de Casos
                        </h1>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-on-surface-variant)' }}>
                            Reportes, quejas, incidentes y citas presenciales
                        </p>
                    </div>

                    {/* Alerta de citas prioritarias */}
                    {citasPrioritarias.length > 0 && (
                        <div style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            background: 'var(--stitch-error)',
                            color: '#fff', borderRadius: '10px',
                            padding: '6px 12px', fontSize: '12px', fontWeight: 700,
                            animation: 'pulse 1.5s ease infinite'
                        }}>
                            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>notification_important</span>
                            {citasPrioritarias.length} cita{citasPrioritarias.length > 1 ? 's' : ''} prioritaria{citasPrioritarias.length > 1 ? 's' : ''}
                        </div>
                    )}

                    <button
                        onClick={() => setMostrarFormulario(true)}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '6px',
                            padding: '8px 18px', borderRadius: '10px', border: 'none',
                            background: 'var(--stitch-primary)', color: '#fff',
                            cursor: 'pointer', fontSize: '14px', fontWeight: 600,
                            fontFamily: 'var(--stitch-font-family)',
                            transition: 'opacity 0.15s'
                        }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '0.85'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '1'}
                    >
                        <span className="material-icons-outlined" style={{ fontSize: '18px' }}>add_circle</span>
                        Nuevo reporte
                    </button>
                </div>

                {/* Tabs */}
                <div style={{ display: 'flex', gap: '2px', marginTop: '16px', overflowX: 'auto' }}>
                    {TABS.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setTabActiva(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '6px',
                                padding: '10px 18px', border: 'none',
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
                            {tab.count > 0 && (
                                <span style={{
                                    background: tab.id === 'citas' && citasPrioritarias.length > 0
                                        ? 'var(--stitch-error)' : 'var(--stitch-primary)',
                                    color: '#fff', borderRadius: '12px',
                                    padding: '1px 7px', fontSize: '11px', fontWeight: 700
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
                            animation: 'spin 1s linear infinite', display: 'block'
                        }}>sync</span>
                        <p style={{ color: 'var(--stitch-on-surface-variant)', marginTop: '12px' }}>
                            Cargando información...
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
                        <button onClick={fetchCasos} style={{
                            marginLeft: 'auto', background: 'none', border: 'none',
                            color: 'var(--stitch-error)', cursor: 'pointer', fontSize: '13px',
                            display: 'flex', alignItems: 'center', gap: '4px'
                        }}>
                            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>refresh</span>
                            Reintentar
                        </button>
                    </div>
                )}

                {!loading && !error && (
                    <>
                        {/* Tab: Reportes e Incidentes */}
                        {tabActiva === 'casos' && (
                            casosActivos.length === 0
                                ? <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                    <span className="material-icons-outlined" style={{ fontSize: '64px', color: 'var(--stitch-outline)', display: 'block' }}>sentiment_satisfied</span>
                                    <p style={{ color: 'var(--stitch-on-surface-variant)', marginTop: '12px', fontSize: '15px' }}>
                                        No tiene casos activos. Presione "Nuevo reporte" si necesita reportar algo.
                                    </p>
                                </div>
                                : casosActivos.map(c => (
                                    <CasoCard
                                        key={c.id}
                                        caso={c}
                                        onCerrar={handleCerrar}
                                        onReabrir={handleReabrir}
                                        loading={actionLoading}
                                    />
                                ))
                        )}

                        {/* Tab: Historial */}
                        {tabActiva === 'historial' && (
                            casosArchivados.length === 0
                                ? <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                    <span className="material-icons-outlined" style={{ fontSize: '64px', color: 'var(--stitch-outline)', display: 'block' }}>archive</span>
                                    <p style={{ color: 'var(--stitch-on-surface-variant)', marginTop: '12px', fontSize: '15px' }}>
                                        No hay casos archivados.
                                    </p>
                                </div>
                                : casosArchivados.map(c => (
                                    <CasoCard
                                        key={c.id}
                                        caso={c}
                                        onCerrar={handleCerrar}
                                        onReabrir={handleReabrir}
                                        loading={actionLoading}
                                    />
                                ))
                        )}

                        {/* Tab: Citas Presenciales */}
                        {tabActiva === 'citas' && (
                            citas.length === 0
                                ? <div style={{ textAlign: 'center', padding: '60px 0' }}>
                                    <span className="material-icons-outlined" style={{ fontSize: '64px', color: 'var(--stitch-outline)', display: 'block' }}>event_available</span>
                                    <p style={{ color: 'var(--stitch-on-surface-variant)', marginTop: '12px', fontSize: '15px' }}>
                                        No tiene citas programadas.
                                    </p>
                                </div>
                                : (
                                    <>
                                        {/* Prioritarias primero */}
                                        {citasPrioritarias.length > 0 && (
                                            <div style={{ marginBottom: '16px' }}>
                                                <h4 style={{
                                                    margin: '0 0 10px', fontSize: '13px',
                                                    color: 'var(--stitch-error)',
                                                    fontFamily: 'var(--stitch-font-family)',
                                                    display: 'flex', alignItems: 'center', gap: '4px',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                                }}>
                                                    <span className="material-icons-outlined" style={{ fontSize: '15px' }}>notification_important</span>
                                                    Prioritarias
                                                </h4>
                                                {citasPrioritarias.map(c => <CitaCard key={c.id} cita={c} />)}
                                            </div>
                                        )}

                                        {/* Resto de citas */}
                                        {citas.filter(c => !c.es_prioritaria).length > 0 && (
                                            <div>
                                                <h4 style={{
                                                    margin: '0 0 10px', fontSize: '13px',
                                                    color: 'var(--stitch-on-surface-variant)',
                                                    fontFamily: 'var(--stitch-font-family)',
                                                    display: 'flex', alignItems: 'center', gap: '4px',
                                                    textTransform: 'uppercase', letterSpacing: '0.5px'
                                                }}>
                                                    <span className="material-icons-outlined" style={{ fontSize: '15px' }}>event</span>
                                                    Otras citas
                                                </h4>
                                                {citas.filter(c => !c.es_prioritaria).map(c => <CitaCard key={c.id} cita={c} />)}
                                            </div>
                                        )}
                                    </>
                                )
                        )}
                    </>
                )}
            </div>

            {/* Modal nuevo caso */}
            {mostrarFormulario && (
                <ModalNuevoCaso
                    onClose={() => setMostrarFormulario(false)}
                    onSubmit={handleCrearCaso}
                    loading={actionLoading}
                />
            )}

            {/* Toast */}
            {toast && (
                <div style={{
                    position: 'fixed', bottom: '24px', left: '50%',
                    transform: 'translateX(-50%)',
                    background: toast.tipo === 'success' ? 'var(--stitch-success, #198754)'
                              : toast.tipo === 'error'   ? 'var(--stitch-error, #dc3545)'
                              : 'var(--stitch-primary)',
                    color: '#fff', borderRadius: '12px', padding: '12px 24px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
                    display: 'flex', alignItems: 'center', gap: '10px',
                    fontSize: '14px', fontWeight: 500, zIndex: 2000,
                    animation: 'slideUp 0.3s ease',
                    fontFamily: 'var(--stitch-font-family)'
                }}>
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>
                        {toast.tipo === 'success' ? 'check_circle'
                         : toast.tipo === 'error' ? 'error' : 'info'}
                    </span>
                    {toast.msg}
                </div>
            )}

            <style>{`
                @keyframes spin    { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
                @keyframes slideUp { from { transform: translateX(-50%) translateY(20px); opacity: 0; } to { transform: translateX(-50%) translateY(0); opacity: 1; } }
                @keyframes pulse   { 0%,100% { opacity: 1; } 50% { opacity: 0.7; } }
            `}</style>
        </div>
    );
}
