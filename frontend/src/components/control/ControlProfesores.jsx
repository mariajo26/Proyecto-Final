import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import WeeklyScheduleCalendar from '../WeeklyScheduleCalendar';
import '../../styles/StTheme.css';

const DIAS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
const BLOQUES = [
    { num: 1, hora: '07:00 - 07:50' },
    { num: 2, hora: '07:50 - 08:40' },
    { num: 3, hora: '08:40 - 09:30' },
    { num: 4, hora: '09:50 - 10:40' },
    { num: 5, hora: '10:40 - 11:30' },
    { num: 6, hora: '11:30 - 12:20' }
];

export default function ControlProfesores() {
    const { token } = useAuth();
    const [profesores, setProfesores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal / Drawer de Horarios
    const [profSeleccionado, setProfSeleccionado] = useState(null);
    const [horarioData, setHorarioData] = useState(null);
    const [loadingHorario, setLoadingHorario] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
    };

    const fetchProfesores = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/control/profesores', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar la lista de docentes.');
            const data = await res.json();
            setProfesores(data);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchProfesores();
    }, [fetchProfesores]);

    // Cargar Horario y Ficha Laboral del Profesor
    const handleVerHorario = async (profesor) => {
        setProfSeleccionado(profesor);
        setHorarioData(null);
        setLoadingHorario(true);
        try {
            const res = await fetch(`/api/control/profesores/${profesor.id}/horarios`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar horarios del profesor.');
            const data = await res.json();
            setHorarioData(data);
        } catch (err) {
            showToast(err.message, 'error');
            setProfSeleccionado(null);
        } finally {
            setLoadingHorario(false);
        }
    };

    // Helper para buscar clase en matriz
    const getClaseEnPeriodo = (dia, horaInicio) => {
        if (!horarioData) return null;
        // Normalizar comparación de hora
        return horarioData.clases.find(c => {
            const matchingDia = c.dia_semana.toLowerCase() === dia.toLowerCase();
            const matchingHora = c.hora_inicio.substring(0, 5) === horaInicio.substring(0, 5);
            return matchingDia && matchingHora;
        });
    };

    // Helper para buscar horario de atención
    const getAtencionEnPeriodo = (dia, horaInicio) => {
        if (!horarioData) return null;
        return horarioData.horarios_atencion.find(a => {
            const matchingDia = a.dia_semana.toLowerCase() === dia.toLowerCase();
            const matchingHora = a.hora_inicio.substring(0, 5) === horaInicio.substring(0, 5);
            return matchingDia && matchingHora;
        });
    };

    return (
        <div style={{ padding: '0px', background: 'var(--stitch-background)', fontFamily: 'var(--stitch-font-family, Google Sans, sans-serif)' }}>
            
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '40px', color: 'var(--stitch-primary)', animation: 'spin 1s linear infinite' }}>sync</span>
                    <p style={{ color: 'var(--stitch-on-surface-variant)', marginTop: '10px' }}>Cargando personal docente...</p>
                </div>
            ) : error ? (
                <div style={{ padding: '16px', background: 'var(--stitch-error-container)', color: 'var(--stitch-error)', borderRadius: '10px' }}>
                    {error}
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
                    {profesores.map(prof => (
                        <div key={prof.id} className="st-card" style={{ borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px', border: '1px solid var(--stitch-outline-variant)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'var(--stitch-primary-container)', color: 'var(--stitch-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '18px' }}>
                                    {prof.nombre_completo.charAt(0)}
                                </div>
                                <div>
                                    <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>{prof.nombre_completo}</h4>
                                    <span style={{ fontSize: '12px', color: 'var(--stitch-on-surface-variant)' }}>Profesor Titular ({prof.codigo_ua})</span>
                                </div>
                            </div>

                            <div style={{ fontSize: '13px', color: 'var(--stitch-on-surface)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                                <span><strong>Email:</strong> {prof.correo_recuperacion}</span>
                                <span><strong>Teléfono:</strong> {prof.telefono_personal || 'No registrado'}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '4px' }}>
                                <button 
                                    className="st-button st-button-outlined"
                                    onClick={() => handleVerHorario(prof)}
                                    style={{ flex: 1, padding: '8px', fontSize: '12px', border: '1px solid var(--stitch-primary)', borderRadius: '8px', background: 'transparent', color: 'var(--stitch-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}
                                >
                                    <span className="material-icons-outlined" style={{ fontSize: '15px' }}>calendar_month</span>
                                    Ver Horarios
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* MODAL DRAWER DE HORARIO Y HOJA DE VIDA */}
            {profSeleccionado && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '16px' }} onClick={() => setProfSeleccionado(null)}>
                    <div style={{ background: 'var(--stitch-surface)', borderRadius: '16px', width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '24px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                        
                        {/* Cabecera */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--stitch-outline-variant)', paddingBottom: '16px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--stitch-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600, color: '#fff' }}>
                                    {profSeleccionado.nombre_completo.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--stitch-on-surface)' }}>{profSeleccionado.nombre_completo}</h3>
                                    <span style={{ fontSize: '13px', color: 'var(--stitch-on-surface-variant)' }}>Código: {profSeleccionado.codigo_ua}</span>
                                </div>
                            </div>
                            <button onClick={() => setProfSeleccionado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stitch-on-surface-variant)' }}>
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        {loadingHorario ? (
                            <div style={{ textAlign: 'center', padding: '40px' }}>
                                <span className="material-icons-outlined" style={{ animation: 'spin 1s linear infinite', color: 'var(--stitch-primary)' }}>sync</span>
                                <p style={{ fontSize: '13px', color: 'var(--stitch-on-surface-variant)' }}>Cargando horarios y ficha...</p>
                            </div>
                        ) : horarioData ? (
                            <div>
                                {/* Ficha Administrativa / Laboral */}
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', padding: '14px', background: 'var(--stitch-background)', borderRadius: '10px', border: '1px dashed var(--stitch-outline)', fontSize: '13px' }}>
                                    <div style={{ flex: 1, minWidth: '150px' }}>
                                        <strong>Fecha de Contratación:</strong> {horarioData.ficha_laboral ? new Date(horarioData.ficha_laboral.fecha_contratacion).toLocaleDateString() : 'No registrada'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: '120px' }}>
                                        <strong>NIT:</strong> {horarioData.ficha_laboral?.nit || 'No registrado'}
                                    </div>
                                    <div style={{ flex: 1, minWidth: '120px' }}>
                                        <strong>IGSS:</strong> {horarioData.ficha_laboral?.igss || 'No registrado'}
                                    </div>
                                </div>

                                {(() => {
                                    const mappedClases = (horarioData.clases || []).map(c => ({
                                        dia: c.dia_semana,
                                        periodo: c.periodo_numero,
                                        materia: c.materia,
                                        grado: `${c.grado} (${c.seccion})`,
                                        aula: c.salon
                                    }));

                                    const mappedAtencion = (horarioData.horarios_atencion || []).map(a => {
                                        const h = a.hora_inicio.substring(0, 5);
                                        let periodo = 1;
                                        if (h === '07:05') periodo = 1;
                                        else if (h === '07:55') periodo = 2;
                                        else if (h === '08:45') periodo = 3;
                                        else if (h === '10:15') periodo = 4;
                                        else if (h === '11:05') periodo = 5;
                                        else if (h === '11:55') periodo = 6;
                                        return {
                                            dia: a.dia_semana,
                                            periodo,
                                            titulo: 'Atención Padres',
                                            aula: 'Salón de Citas'
                                        };
                                    });

                                    return (
                                        <div style={{ marginTop: '16px' }}>
                                            <WeeklyScheduleCalendar 
                                                scheduleData={mappedClases} 
                                                temporaryActivities={mappedAtencion}
                                                title={`Horario Escolar - Profesor seleccionado`}
                                            />
                                        </div>
                                    );
                                })()}
                            </div>
                        ) : null}
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
