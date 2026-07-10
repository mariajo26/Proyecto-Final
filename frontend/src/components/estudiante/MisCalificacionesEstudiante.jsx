import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

export default function MisCalificacionesEstudiante() {
    const { token } = useAuth();
    const [calificaciones, setCalificaciones] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cargar calificaciones
    const fetchCalificaciones = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/estudiante/calificaciones', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('No se pudieron obtener tus calificaciones.');
            const data = await res.json();
            setCalificaciones(data);
        } catch (err) {
            setError(err.message);
            // Fallback de demostración
            setCalificaciones([
                { id: 1, materia: 'Matemáticas', promedio: 88, total_actividades: 3, entregadas: 2, historial: [
                    { id: 101, tarea: 'Hoja de Trabajo 1: Ecuaciones', nota: null, total: 10, estado: 'Pendiente de Calificar', fecha_entrega: '2026-07-09T14:30:00Z' },
                    { id: 102, tarea: 'Proyecto Bimestral', nota: 19, total: 20, estado: 'Calificada', fecha_entrega: '2026-07-08T09:15:00Z' },
                    { id: 103, tarea: 'Examen Corto 1', nota: 0, total: 5, estado: 'No Entregado', fecha_entrega: null }
                ]},
                { id: 2, materia: 'Idioma Español', promedio: 95, total_actividades: 2, entregadas: 1, historial: [
                    { id: 201, tarea: 'Análisis Literario: Don Quijote', nota: 14, total: 15, estado: 'Calificada', fecha_entrega: '2026-07-07T18:45:00Z' },
                    { id: 202, tarea: 'Exposición Presencial', nota: null, total: 10, estado: 'No Entregado', fecha_entrega: null }
                ]}
            ]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchCalificaciones();
    }, [fetchCalificaciones]);

    return (
        <div style={{ fontFamily: 'var(--stitch-font, sans-serif)', color: 'var(--stitch-text-primary, #0F172A)' }}>
            <h2 style={{ color: 'var(--stitch-primary, #0D2C54)', fontWeight: '700', marginBottom: '24px' }}>Mis Calificaciones y Rendimiento</h2>

            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '48px', color: 'var(--stitch-secondary, #3B82F6)', animation: 'spin 1.5s linear infinite' }}>sync</span>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                    {calificaciones.map(c => (
                        <div 
                            key={c.id}
                            style={{
                                backgroundColor: '#FFFFFF', borderRadius: 'var(--stitch-radius-md, 12px)',
                                border: '1px solid var(--stitch-border, #E2E8F0)', padding: '24px',
                                boxShadow: 'var(--stitch-shadow-sm)'
                            }}
                        >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid #F1F5F9', paddingBottom: '12px' }}>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '700', color: 'var(--stitch-primary)' }}>{c.materia}</h3>
                                    <span style={{ fontSize: '13px', color: '#64748B' }}>Progreso: {c.entregadas} de {c.total_actividades} actividades entregadas</span>
                                </div>
                                <div style={{ textAlign: 'right' }}>
                                    <span style={{ fontSize: '13px', color: '#64748B', display: 'block' }}>Promedio Actual</span>
                                    <span style={{
                                        fontSize: '24px', fontWeight: '800',
                                        color: c.promedio >= 70 ? 'var(--stitch-success, #10B981)' : 'var(--stitch-error, #EF4444)'
                                    }}>{c.promedio}%</span>
                                </div>
                            </div>

                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ color: '#64748B', borderBottom: '1px solid var(--stitch-border)' }}>
                                            <th style={{ padding: '10px 0', fontWeight: '600' }}>Actividad / Tarea</th>
                                            <th style={{ padding: '10px', fontWeight: '600' }}>Fecha de Entrega</th>
                                            <th style={{ padding: '10px', fontWeight: '600' }}>Estado</th>
                                            <th style={{ padding: '10px', fontWeight: '600', textAlign: 'right' }}>Calificación</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {c.historial.map(h => (
                                            <tr key={h.id} style={{ borderBottom: '1px solid #F8FAFC' }}>
                                                <td style={{ padding: '12px 0', fontWeight: '500' }}>{h.tarea}</td>
                                                <td style={{ padding: '12px', color: '#64748B' }}>
                                                    {h.fecha_entrega ? new Date(h.fecha_entrega).toLocaleString() : '—'}
                                                </td>
                                                <td style={{ padding: '12px' }}>
                                                    <span style={{
                                                        padding: '4px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '600',
                                                        backgroundColor: h.estado === 'Calificada' ? '#D1FAE5' : (h.estado === 'Pendiente de Calificar' ? '#FEF3C7' : '#FEE2E2'),
                                                        color: h.estado === 'Calificada' ? '#065F46' : (h.estado === 'Pendiente de Calificar' ? '#92400E' : '#991B1B')
                                                    }}>
                                                        {h.estado}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px', fontWeight: '700', textAlign: 'right', color: h.nota !== null ? 'var(--stitch-primary)' : '#64748B' }}>
                                                    {h.nota !== null ? `${h.nota} / ${h.total}` : `— / ${h.total}`}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
