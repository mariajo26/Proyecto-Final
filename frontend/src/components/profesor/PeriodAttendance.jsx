import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/StTheme.css';

// Helper para obtener el periodo según la hora del sistema
const obtenerPeriodoSistema = () => {
    const ahora = new Date();
    const horaMinuto = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
    
    if (horaMinuto >= '07:05' && horaMinuto < '07:55') return 1;
    if (horaMinuto >= '07:55' && horaMinuto < '08:45') return 2;
    if (horaMinuto >= '08:45' && horaMinuto < '09:35') return 3;
    if (horaMinuto >= '10:15' && horaMinuto < '11:05') return 4;
    if (horaMinuto >= '11:05' && horaMinuto < '11:55') return 5;
    if (horaMinuto >= '11:55' && horaMinuto < '12:45') return 6;
    
    // Bloques fijos
    if (horaMinuto >= '07:00' && horaMinuto < '07:05') return 'guia_inicial';
    if (horaMinuto >= '09:35' && horaMinuto < '10:15') return 'recreo';
    if (horaMinuto >= '12:45' && horaMinuto < '12:55') return 'transicion';
    if (horaMinuto >= '12:55' && horaMinuto < '13:00') return 'guia_final';
    
    return null; // Fuera de horario escolar
};

const obtenerNombreDiaHoy = () => {
    const dias = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
    return dias[new Date().getDay()];
};

// COMPONENTE: FORMULARIO DE ASISTENCIA CRUZADA POR PERIODO (VISTA DOCENTE)
// ----------------------------------------------------------------------------
export default function PeriodAttendance({ courseId, students = [], onSaveAttendance, guardando }) {
    
    const [attendanceData, setAttendanceData] = useState({});
    const [mensajeLocal, setMensajeLocal] = useState({ texto: '', tipo: '' });

    useEffect(() => {
        setAttendanceData(
            students.reduce((acc, student) => {
                const isPreprogrammed = student.asistencia_manana === 'Inasistencia Programada' || student.asistencia_manana === 'Preprogramada';
                
                acc[student.id] = {
                    estado: isPreprogrammed ? 'No Asistió' : (student.asistencia_local || student.asistencia_manana || 'Sin Registro'),
                    observacion: isPreprogrammed ? (student.justificacion || 'Inasistencia programada por Profesor Guía') : (student.observacion_local || ''),
                    validated: false, 
                    general: student.asistencia_manana || 'Sin Registro'
                };
                return acc;
            }, {})
        );
    }, [students]);

    const isPastDay = false; 
    const selectedDate = useMemo(() => new Date().toISOString().split('T')[0], []);
    const [periodoNumero, setPeriodoNumero] = useState(() => obtenerPeriodoSistema());

    // Actualizar el periodo automáticamente si cambia la hora del sistema
    useEffect(() => {
        const interval = setInterval(() => {
            setPeriodoNumero(obtenerPeriodoSistema());
        }, 15000);
        return () => clearInterval(interval);
    }, []);

    const diaHoy = useMemo(() => obtenerNombreDiaHoy(), []);
    const tieneClaseHoy = useMemo(() => {
        if (diaHoy === 'Sábado' || diaHoy === 'Domingo') return false;
        // Solo periodos académicos del 1 al 6 son válidos para clases
        return typeof periodoNumero === 'number' && periodoNumero >= 1 && periodoNumero <= 6;
    }, [diaHoy, periodoNumero]);

    const handleActionClick = (studentId, actionType) => {
        setAttendanceData(prev => {
            const current = prev[studentId];
            
            // Caso A: Sin Registro -> Pasa a Presente general y local
            if (actionType === 'CASE_A') {
                return {
                    ...prev,
                    [studentId]: { ...current, estado: 'Presente', general: 'Presente' }
                };
            }
            // Caso B: No Asistió -> Pasa a Llegada Tarde local
            if (actionType === 'CASE_B') {
                return {
                    ...prev,
                    [studentId]: { ...current, estado: 'Llegada Tarde' }
                };
            }
            // Caso C: Presente -> Valida y desbloquea observación
            if (actionType === 'CASE_C') {
                return {
                    ...prev,
                    [studentId]: { ...current, validated: true }
                };
            }
            return prev;
        });
    };

    const handleStatusChange = (studentId, newStatus) => {
        setAttendanceData(prev => {
            const current = prev[studentId];
            if (isPastDay && current.general === 'Presente') {
                alert('RESTRICCION: No se permite modificar la asistencia de dias pasados para estudiantes que estuvieron Presentes.');
                return prev;
            }
            return {
                ...prev,
                [studentId]: { ...current, estado: newStatus }
            };
        });
    };

    const handleObservationChange = (studentId, text) => {
        setAttendanceData(prev => ({
            ...prev,
            [studentId]: { ...prev[studentId], observacion: text }
        }));
    };

    const handleSave = () => {
        const alertasSimuladas = [];

        const payload = Object.keys(attendanceData).map(studentId => {
            const data = attendanceData[studentId];
            const studentInfo = students.find(s => s.id === parseInt(studentId, 10));

            if (data.general === 'Presente' && (data.estado === 'Inasistencia' || data.estado === 'No Asistió')) {
                alertasSimuladas.push(`Alerta al Profesor Guía: ${studentInfo?.nombre} no está en la clase actual pese a llegar al colegio.`);
            }

            return {
                estudiante_id: parseInt(studentId, 10),
                curso_id: courseId,
                periodo_numero: periodoNumero,
                estado: data.estado,
                observacion_docente: data.observacion,
                fecha: selectedDate
            };
        });

        if (alertasSimuladas.length > 0) {
            console.log("MUTACION SIMULADA: Enviando alertas al Profesor Guia:", alertasSimuladas);
        }

        // Guardar localmente
        localStorage.setItem(`stitch_asistencia_periodo_${courseId}_${periodoNumero}`, JSON.stringify(payload));
        setMensajeLocal({ 
            texto: `Asistencias del Período ${periodoNumero} guardadas localmente con éxito (Simulación de entrega).`, 
            tipo: 'exito' 
        });
    };

    const getBadgeClass = (status) => {
        if (status === 'Presente') return 'stitch-badge stitch-badge-success';
        if (status === 'Inasistencia' || status === 'No Asistió' || status === 'Inasistencia Programada' || status === 'Preprogramada') return 'stitch-badge stitch-badge-danger';
        if (status === 'Llegada Tarde') return 'stitch-badge stitch-badge-warning';
        return 'stitch-badge stitch-badge-neutral';
    };

    return (
        <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
            {/* Mensaje de Alerta Local */}
            {mensajeLocal.texto && (
                <div className={`stitch-alert ${mensajeLocal.tipo === 'exito' ? 'stitch-alert-success' : 'stitch-alert-danger'}`} style={{ marginBottom: '20px' }}>
                    <span className="material-icons-outlined">
                        {mensajeLocal.tipo === 'exito' ? 'check_circle' : 'error_outline'}
                    </span>
                    <span style={{ flex: 1 }}>{mensajeLocal.texto}</span>
                    <button onClick={() => setMensajeLocal({ texto: '', tipo: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'inherit', lineHeight: 1 }}>×</button>
                </div>
            )}

            {/* Cabecera de Configuración de Fecha */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label className="stitch-label" style={{ margin: 0 }}>Fecha de Registro:</label>
                        <input 
                            type="date" 
                            value={selectedDate} 
                            disabled
                            className="stitch-input"
                            style={{ width: 'auto', padding: '8px 12px', backgroundColor: '#F1F5F9', color: '#64748B', cursor: 'not-allowed' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label className="stitch-label" style={{ margin: 0 }}>Periodo / Bloque:</label>
                        <select
                            value={periodoNumero || ''}
                            disabled
                            className="stitch-select"
                            style={{ width: 'auto', padding: '8px 36px 8px 12px', backgroundColor: '#F1F5F9', color: '#64748B', cursor: 'not-allowed' }}
                        >
                            <option value="">Fuera de Horario</option>
                            <option value="guia_inicial">Profesor Guía Inicial (07:00 - 07:05)</option>
                            <option value={1}>Periodo 1 (07:05 - 07:55)</option>
                            <option value={2}>Periodo 2 (07:55 - 08:45)</option>
                            <option value={3}>Periodo 3 (08:45 - 09:35)</option>
                            <option value="recreo">Recreo / Receso (09:35 - 10:15)</option>
                            <option value={4}>Periodo 4 (10:15 - 11:05)</option>
                            <option value={5}>Periodo 5 (11:05 - 11:55)</option>
                            <option value={6}>Periodo 6 (11:55 - 12:45)</option>
                            <option value="transicion">Tiempo Transición (12:45 - 12:55)</option>
                            <option value="guia_final">Profesor Guía Final (12:55 - 13:00)</option>
                        </select>
                    </div>
                </div>
            </div>

            {!tieneClaseHoy ? (
                <div className="stitch-alert stitch-alert-warning" style={{ padding: '20px', display: 'flex', gap: '16px', alignItems: 'center' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '32px', color: '#D97706' }}>lock</span>
                    <div>
                        <strong style={{ display: 'block', fontSize: '15px', marginBottom: '4px', color: '#92400E' }}>Registro de Asistencia Deshabilitado</strong>
                        Solo se permite tomar asistencia durante los períodos académicos de clase (Periodos 1 al 6, de Lunes a Viernes). 
                        <span style={{ display: 'block', marginTop: '4px', fontSize: '12px', color: '#B45309' }}>
                            Día actual: <strong>{diaHoy}</strong> · Período actual: <strong>{periodoNumero || 'Fuera de Horario'}</strong>
                        </span>
                    </div>
                </div>
            ) : (
                <>
                    {/* Listado de Estudiantes */}
                    <div style={{ overflowX: 'auto' }}>
                        <table className="stitch-table" style={{ marginTop: '16px' }}>
                            <thead>
                                <tr>
                                    <th className="stitch-th">Estudiante</th>
                                    <th className="stitch-th">Asistencia General</th>
                                    <th className="stitch-th">Acción Dinámica</th>
                                    <th className="stitch-th">Estado Curso</th>
                                    <th className="stitch-th">Observaciones / Justificación</th>
                                </tr>
                            </thead>
                            <tbody>
                                {students.map((student) => {
                                    const localData = attendanceData[student.id] || { estado: 'Sin Registro', observacion: '', validated: false, general: 'Sin Registro' };
                                    const generalState = localData.general;
                                    const isPreprogrammed = generalState === 'Inasistencia Programada' || generalState === 'Preprogramada';
                                    const isPastLocked = isPastDay && generalState === 'Presente';

                                    // Renderización condicional del Botón Dinámico según Reglas (Casos A, B, C)
                                    let ActionButton = null;
                                    if (!isPreprogrammed && !isPastLocked) {
                                        if (generalState === 'Sin Registro') {
                                            ActionButton = (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleActionClick(student.id, 'CASE_A')} 
                                                    className="stitch-button" 
                                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                                >
                                                    Tomar asistencia
                                                </button>
                                            );
                                        } else if (generalState === 'No Asistió') {
                                            ActionButton = (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleActionClick(student.id, 'CASE_B')} 
                                                    className="stitch-button" 
                                                    style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--stitch-warning)' }}
                                                >
                                                    Tomar asistencia del curso
                                                </button>
                                            );
                                        } else if (generalState === 'Presente') {
                                            ActionButton = (
                                                <button 
                                                    type="button"
                                                    onClick={() => handleActionClick(student.id, 'CASE_C')} 
                                                    disabled={localData.validated} 
                                                    className="stitch-button"
                                                    style={{ 
                                                        padding: '6px 12px', 
                                                        fontSize: '12px', 
                                                        backgroundColor: localData.validated ? 'var(--stitch-border)' : 'var(--stitch-success)',
                                                        color: localData.validated ? 'var(--stitch-text-secondary)' : '#FFF',
                                                        cursor: localData.validated ? 'not-allowed' : 'pointer'
                                                    }}
                                                >
                                                    {localData.validated ? 'Validado' : 'Tomar asistencia del curso'}
                                                </button>
                                            );
                                        }
                                    }

                                    // Habilitar input de observación solo si no está bloqueado por el guía, y si se requiere
                                    const obsDisabled = isPreprogrammed || isPastLocked || (generalState === 'Presente' && !localData.validated && localData.estado === 'Presente');

                                    return (
                                        <tr key={student.id} className="stitch-tr-hover">
                                            <td className="stitch-td">
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                    <img 
                                                        src={`https://ui-avatars.com/api/?name=${encodeURIComponent(student.nombre)}&background=0D2C54&color=fff&bold=true&rounded=true&size=36`} 
                                                        alt={student.nombre}
                                                        style={{ width: '36px', height: '36px', borderRadius: '50%', border: '1px solid var(--stitch-border)' }}
                                                    />
                                                    <div>
                                                        <div style={{ fontWeight: 'bold', color: 'var(--stitch-text-primary)' }}>{student.nombre}</div>
                                                        <div style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)', marginTop: '2px' }}>{student.codigo_ua}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="stitch-td">
                                                <span className={getBadgeClass(generalState)}>{generalState}</span>
                                            </td>
                                            <td className="stitch-td">
                                                {isPreprogrammed ? <span style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>Bloqueado por Guía</span> : ActionButton}
                                            </td>
                                            <td className="stitch-td">
                                                <select 
                                                    value={localData.estado} 
                                                    onChange={(e) => handleStatusChange(student.id, e.target.value)}
                                                    disabled={isPreprogrammed || isPastLocked}
                                                    className="stitch-select"
                                                    style={{ padding: '6px 28px 6px 10px', fontSize: '12px', width: 'auto' }}
                                                >
                                                    <option value="Sin Registro">Sin Registro</option>
                                                    <option value="Presente">Presente</option>
                                                    <option value="Llegada Tarde">Llegada Tarde</option>
                                                    <option value="No Asistió">No Asistió</option>
                                                    <option value="Inasistencia">Inasistencia (Fuga)</option>
                                                </select>
                                            </td>
                                            <td className="stitch-td">
                                                <input 
                                                    type="text"
                                                    placeholder={isPreprogrammed ? "Bloqueado" : "Ej: En enfermería..."}
                                                    value={localData.observacion}
                                                    disabled={obsDisabled}
                                                    onChange={(e) => handleObservationChange(student.id, e.target.value)}
                                                    className="stitch-input"
                                                    style={{ width: '90%', padding: '8px', fontSize: '12px' }}
                                                />
                                                { (localData.estado === 'Inasistencia' || localData.estado === 'No Asistió') && generalState === 'Presente' && !obsDisabled && (
                                                    <div style={{ color: 'var(--stitch-danger)', fontSize: '10px', marginTop: '4px', fontWeight: 'bold' }}>
                                                        * Requerido: Especifique la justificación. Se enviará alerta al Guía.
                                                    </div>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Acciones de Formulario */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                        <button type="button" className="stitch-button" onClick={handleSave} disabled={guardando}>
                            <span className="material-icons-outlined">{guardando ? 'sync' : 'save'}</span>
                            {guardando ? 'Guardando...' : 'Guardar Asistencias del Período'}
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}

