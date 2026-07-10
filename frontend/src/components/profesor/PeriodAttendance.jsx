import React, { useState } from 'react';
import '../../styles/StTheme.css';

// ----------------------------------------------------------------------------
// COMPONENTE: FORMULARIO DE ASISTENCIA CRUZADA POR PERIODO (VISTA DOCENTE)
// ----------------------------------------------------------------------------
export default function PeriodAttendance({ courseId, students = [], onSaveAttendance, guardando }) {
    
    // El estado local inicial se construye evaluando las reglas de Asistencia Cruzada
    const [attendanceData, setAttendanceData] = useState(
        students.reduce((acc, student) => {
            const isPreprogrammed = student.asistencia_manana === 'Inasistencia Programada' || student.asistencia_manana === 'Preprogramada';
            
            acc[student.id] = {
                estado: isPreprogrammed ? 'No Asistió' : (student.asistencia_local || student.asistencia_manana || 'Sin Registro'),
                observacion: isPreprogrammed ? (student.justificacion || 'Inasistencia programada por Profesor Guía') : (student.observacion_local || ''),
                validated: false, // Controla si se presionó el botón en "Caso C" (Presente)
                general: student.asistencia_manana || 'Sin Registro'
            };
            return acc;
        }, {})
    );

    const [isPastDay, setIsPastDay] = useState(false);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [periodoNumero, setPeriodoNumero] = useState(1);

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
        // Simulacion de envio de alertas de desviacion al Profesor Guia
        const alertasSimuladas = [];

        const payload = Object.keys(attendanceData).map(studentId => {
            const data = attendanceData[studentId];
            const studentInfo = students.find(s => s.id === parseInt(studentId, 10));

            // Si el alumno llego "Presente" en la mañana pero el profesor lo marca "Inasistencia" o "No Asistió", genera alerta
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

        onSaveAttendance(courseId, payload);
    };

    const containerStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--stitch-radius-md)',
        border: '1px solid var(--stitch-border)',
        boxShadow: 'var(--stitch-shadow-lg)',
        padding: '24px'
    };

    const tableStyle = {
        width: '100%',
        borderCollapse: 'collapse',
        marginTop: '16px'
    };

    const thStyle = {
        backgroundColor: '#F1F5F9',
        color: 'var(--stitch-primary)',
        fontWeight: '600',
        padding: '12px 16px',
        textAlign: 'left',
        borderBottom: '2px solid var(--stitch-border)',
        fontSize: '14px'
    };

    const tdStyle = {
        padding: '16px',
        borderBottom: '1px solid var(--stitch-border)',
        fontSize: '13px',
        color: 'var(--stitch-text-primary)'
    };

    const chipStyle = (status) => {
        let bgColor = '#F1F5F9';
        let textColor = '#334155';
        if (status === 'Presente') { bgColor = '#D1FAE5'; textColor = '#065F46'; }
        else if (status === 'Inasistencia' || status === 'No Asistió' || status === 'Inasistencia Programada' || status === 'Preprogramada') { bgColor = '#FEE2E2'; textColor = '#991B1B'; }
        else if (status === 'Llegada Tarde') { bgColor = '#FEF3C7'; textColor = '#92400E'; }
        
        return {
            padding: '4px 8px',
            borderRadius: '12px',
            fontWeight: '600',
            fontSize: '11px',
            display: 'inline-block',
            backgroundColor: bgColor,
            color: textColor
        };
    };

    return (
        <div style={containerStyle}>
            {/* Cabecera de Configuración de Fecha */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label style={{ fontWeight: '600', fontSize: '14px' }}>Fecha de Registro:</label>
                        <input 
                            type="date" 
                            value={selectedDate} 
                            onChange={(e) => {
                                setSelectedDate(e.target.value);
                                const today = new Date().toISOString().split('T')[0];
                                setIsPastDay(e.target.value < today);
                            }}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--stitch-border)', fontSize: '14px' }}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <label style={{ fontWeight: '600', fontSize: '14px' }}>Periodo / Bloque:</label>
                        <select
                            value={periodoNumero}
                            onChange={(e) => setPeriodoNumero(parseInt(e.target.value, 10))}
                            style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--stitch-border)', backgroundColor: '#FFFFFF', fontSize: '14px' }}
                        >
                            <option value={1}>Periodo 1</option>
                            <option value={2}>Periodo 2</option>
                            <option value={3}>Periodo 3</option>
                            <option value={4}>Periodo 4</option>
                            <option value={5}>Periodo 5</option>
                        </select>
                    </div>
                </div>

                {isPastDay && (
                    <div style={{ backgroundColor: '#FEF3C7', color: '#92400E', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '16px' }}>warning</span>
                        Modo Historial: Edición bloqueada para alumnos que estuvieron Presentes.
                    </div>
                )}
            </div>

            {/* Listado de Estudiantes */}
            <table style={tableStyle}>
                <thead>
                    <tr>
                        <th style={thStyle}>Estudiante</th>
                        <th style={thStyle}>Asistencia General</th>
                        <th style={thStyle}>Acción Dinámica</th>
                        <th style={thStyle}>Estado Curso</th>
                        <th style={thStyle}>Observaciones / Justificación</th>
                    </tr>
                </thead>
                <tbody>
                    {students.map((student) => {
                        const localData = attendanceData[student.id];
                        const generalState = localData.general;
                        const isPreprogrammed = generalState === 'Inasistencia Programada' || generalState === 'Preprogramada';
                        const isPastLocked = isPastDay && generalState === 'Presente';

                        // Renderización condicional del Botón Dinámico según Reglas (Casos A, B, C)
                        let ActionButton = null;
                        if (!isPreprogrammed && !isPastLocked) {
                            if (generalState === 'Sin Registro') {
                                ActionButton = (
                                    <button onClick={() => handleActionClick(student.id, 'CASE_A')} style={{ padding: '6px 12px', backgroundColor: '#3B82F6', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                                        Tomar asistencia
                                    </button>
                                );
                            } else if (generalState === 'No Asistió') {
                                ActionButton = (
                                    <button onClick={() => handleActionClick(student.id, 'CASE_B')} style={{ padding: '6px 12px', backgroundColor: '#F59E0B', color: '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                                        Tomar asistencia del curso
                                    </button>
                                );
                            } else if (generalState === 'Presente') {
                                ActionButton = (
                                    <button onClick={() => handleActionClick(student.id, 'CASE_C')} disabled={localData.validated} style={{ padding: '6px 12px', backgroundColor: localData.validated ? '#E2E8F0' : '#10B981', color: localData.validated ? '#94A3B8' : '#FFF', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: localData.validated ? 'not-allowed' : 'pointer', fontWeight: '600' }}>
                                        {localData.validated ? 'Validado' : 'Tomar asistencia del curso'}
                                    </button>
                                );
                            }
                        }

                        // Habilitar input de observación solo si no está bloqueado por el guía, y si se requiere
                        const obsDisabled = isPreprogrammed || isPastLocked || (generalState === 'Presente' && !localData.validated && localData.estado === 'Presente');

                        return (
                            <tr key={student.id}>
                                <td style={tdStyle}>
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
                                <td style={tdStyle}>
                                    <span style={chipStyle(generalState)}>{generalState}</span>
                                </td>
                                <td style={tdStyle}>
                                    {isPreprogrammed ? <span style={{ fontSize: '12px', color: '#64748B', fontStyle: 'italic' }}>Bloqueado por Guía</span> : ActionButton}
                                </td>
                                <td style={tdStyle}>
                                    <select 
                                        value={localData.estado} 
                                        onChange={(e) => handleStatusChange(student.id, e.target.value)}
                                        disabled={isPreprogrammed || isPastLocked}
                                        style={{ padding: '6px', borderRadius: '4px', border: '1px solid #CBD5E1', fontSize: '12px', backgroundColor: (isPreprogrammed || isPastLocked) ? '#F1F5F9' : '#FFF' }}
                                    >
                                        <option value="Sin Registro">Sin Registro</option>
                                        <option value="Presente">Presente</option>
                                        <option value="Llegada Tarde">Llegada Tarde</option>
                                        <option value="No Asistió">No Asistió</option>
                                        <option value="Inasistencia">Inasistencia (Fuga)</option>
                                    </select>
                                </td>
                                <td style={tdStyle}>
                                    <input 
                                        type="text"
                                        placeholder={isPreprogrammed ? "Bloqueado" : "Ej: En enfermería..."}
                                        value={localData.observacion}
                                        disabled={obsDisabled}
                                        onChange={(e) => handleObservationChange(student.id, e.target.value)}
                                        style={{ width: '90%', padding: '8px', borderRadius: '6px', border: '1px solid var(--stitch-border)', fontSize: '12px', backgroundColor: obsDisabled ? '#F1F5F9' : '#FFF' }}
                                    />
                                    { (localData.estado === 'Inasistencia' || localData.estado === 'No Asistió') && generalState === 'Presente' && !obsDisabled && (
                                        <div style={{ color: '#DC2626', fontSize: '10px', marginTop: '4px', fontWeight: 'bold' }}>
                                            * Requerido: Especifique la justificación. Se enviará alerta al Guía.
                                        </div>
                                    )}
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {/* Acciones de Formulario */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                <button className="stitch-button" onClick={handleSave} disabled={guardando}>
                    <span className="material-icons-outlined">{guardando ? 'sync' : 'save'}</span>
                    {guardando ? 'Guardando...' : 'Guardar Asistencias del Período'}
                </button>
            </div>
        </div>
    );
}
