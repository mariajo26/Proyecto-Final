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

    return (
        <div style={{ fontFamily: 'var(--stitch-font)', padding: '4px' }}>
            
            {/* ── CABECERA PREMIUM STITCH UI ── */}
            <div style={{
                background: 'linear-gradient(135deg, var(--stitch-primary) 0%, #1e40af 100%)',
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
                    badge
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#93C5FD', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '14px' }}>contact_page</span>
                        Control de Personal y Horarios
                    </span>
                    <h2 style={{ color: '#FFFFFF', fontWeight: '800', margin: '4px 0 0 0', fontSize: '24px', fontFamily: 'Outfit, sans-serif' }}>
                        Horarios y Fichas de Profesores
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Monitorea la carga de clases, horarios de atención y datos laborales del personal docente.
                    </p>
                </div>
            </div>

            {/* ── CONTENIDO PRINCIPAL ── */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '60px 0' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '40px', color: 'var(--stitch-primary)', animation: 'spin 1s linear infinite' }}>sync</span>
                    <p style={{ color: 'var(--stitch-text-secondary)', marginTop: '12px' }}>Cargando personal docente de la institución...</p>
                </div>
            ) : error ? (
                <div className="stitch-alert stitch-alert-danger" style={{ marginBottom: '24px' }}>
                    <span className="material-icons-outlined">error_outline</span>
                    <span>{error}</span>
                </div>
            ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                    {profesores.map(prof => (
                        <div key={prof.id} className="stitch-card" style={{ borderRadius: '12px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px', backgroundColor: '#FFFFFF' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'rgba(59,130,246,0.08)', color: 'var(--stitch-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', fontSize: '20px' }}>
                                    {prof.nombre_completo.charAt(0)}
                                </div>
                                <div>
                                    <h4 className="stitch-title-font" style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--stitch-primary)' }}>
                                        {prof.nombre_completo}
                                    </h4>
                                    <span style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', fontWeight: '600' }}>
                                        Profesor Titular ({prof.codigo_ua})
                                    </span>
                                </div>
                            </div>

                            <div style={{ fontSize: '13px', color: 'var(--stitch-text-primary)', display: 'flex', flexDirection: 'column', gap: '6px', borderTop: '1px solid var(--stitch-border)', paddingTop: '14px' }}>
                                <span><strong>Email:</strong> {prof.correo_recuperacion}</span>
                                <span><strong>Teléfono:</strong> {prof.telefono_personal || 'No registrado'}</span>
                            </div>

                            <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                                <button 
                                    type="button"
                                    className="stitch-button"
                                    onClick={() => handleVerHorario(prof)}
                                    style={{ flex: 1, padding: '8px 12px', fontSize: '12px', justifyContent: 'center', gap: '6px' }}
                                >
                                    <span className="material-icons-outlined" style={{ fontSize: '16px' }}>calendar_month</span>
                                    Ver Horarios e Info
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* ── MODAL DRAWER DE HORARIO Y HOJA DE VIDA ── */}
            {profSeleccionado && (
                <div className="stitch-modal-backdrop" onClick={() => setProfSeleccionado(null)}>
                    <div className="stitch-modal-content" style={{ width: '100%', maxWidth: '850px', maxHeight: '90vh', overflowY: 'auto', padding: '28px', backgroundColor: '#FFFFFF' }} onClick={e => e.stopPropagation()}>
                        
                        {/* Cabecera Modal */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '16px', marginBottom: '20px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                                <div style={{ width: '48px', height: '48px', borderRadius: '50%', backgroundColor: 'var(--stitch-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: '800', color: '#fff' }}>
                                    {profSeleccionado.nombre_completo.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="stitch-title-font" style={{ margin: 0, fontSize: '18px', fontWeight: '800', color: 'var(--stitch-primary)' }}>
                                        {profSeleccionado.nombre_completo}
                                    </h3>
                                    <span style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', fontWeight: '600' }}>
                                        Código Docente: {profSeleccionado.codigo_ua}
                                    </span>
                                </div>
                            </div>
                            <button 
                                type="button" 
                                onClick={() => setProfSeleccionado(null)} 
                                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stitch-text-secondary)', fontSize: '24px', lineHeight: 1 }}
                            >
                                ×
                            </button>
                        </div>

                        {loadingHorario ? (
                            <div style={{ textAlign: 'center', padding: '50px 0' }}>
                                <span className="material-icons-outlined" style={{ animation: 'spin 1s linear infinite', color: 'var(--stitch-primary)', fontSize: '32px' }}>sync</span>
                                <p style={{ fontSize: '13px', color: 'var(--stitch-text-secondary)', marginTop: '8px' }}>Cargando horarios y ficha...</p>
                            </div>
                        ) : horarioData ? (
                            <div>
                                {/* Ficha Administrativa / Laboral */}
                                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '24px', padding: '16px', background: 'var(--stitch-background)', borderRadius: '8px', border: '1px solid var(--stitch-border)', fontSize: '13px' }}>
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

            {/* Toast de Notificación */}
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
