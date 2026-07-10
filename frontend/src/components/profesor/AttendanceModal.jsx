import React, { useState, useEffect } from 'react';
import '../../styles/StTheme.css';

// ----------------------------------------------------------------------------
// COMPONENTE: MODAL DE ASISTENCIA Y JUSTIFICACIONES (VISTA DE ROLES CRUZADOS)
// ----------------------------------------------------------------------------
export default function AttendanceModal({ onClose, userRole, studentId, studentName }) {
    // 1. Estados para el formulario de justificación del Encargado
    const [fechaFalta, setFechaFalta] = useState('');
    const [motivo, setMotivo] = useState('');
    const [documentoUrl, setDocumentoUrl] = useState('');
    const [destino, setDestino] = useState('Profesor Guia');
    const [isPastDeadline, setIsPastDeadline] = useState(false);

    // 2. Estados para la programación de inasistencias masivas del Profesor
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [profObservation, setProfObservation] = useState('');
    const [bulkCourses, setBulkCourses] = useState([
        { id: 1, name: 'Matematica I', selected: true },
        { id: 2, name: 'Fisica Fundamental', selected: false }
    ]);

    // Verificar si la fecha de falta sobrepasa la hora límite (12:00 PM del día posterior)
    useEffect(() => {
        if (!fechaFalta) {
            setIsPastDeadline(false);
            return;
        }

        const [year, month, day] = fechaFalta.split('-').map(Number);
        // Crear la fecha del mediodía del día posterior
        const limiteJustificacion = new Date(year, month - 1, day + 1, 12, 0, 0);
        const ahora = new Date();

        if (ahora > limiteJustificacion) {
            setIsPastDeadline(true);
        } else {
            setIsPastDeadline(false);
        }
    }, [fechaFalta]);

    // Manejo de envío para Encargado
    const handleJustifySubmit = (e) => {
        e.preventDefault();
        if (isPastDeadline) {
            alert('Bloqueado: La fecha límite digital ha expirado. Debe resolver presencialmente.');
            return;
        }

        if (!fechaFalta || !motivo) {
            alert('Por favor completa los campos obligatorios de fecha y motivo.');
            return;
        }

        // Simulación de envío a backend (/api/attendance/justificar)
        alert(`[JUSTIFICACIÓN ENVIADA]
        Estudiante: ${studentName || studentId}
        Fecha Falta: ${fechaFalta}
        Motivo: ${motivo}
        Documento: ${documentoUrl || 'Ninguno'}
        Destinatario: ${destino}
        Estado inicial asignado: Pendiente`);
        
        onClose();
    };

    // Manejo de envío para Profesor (Inasistencia masiva programada)
    const handleBulkAbsenceSubmit = (e) => {
        e.preventDefault();
        if (!startDate || !endDate || !profObservation) {
            alert('Por favor selecciona las fechas de inicio, fin y escribe la observación académica.');
            return;
        }

        const selectedCourseIds = bulkCourses.filter(c => c.selected).map(c => c.name);
        if (selectedCourseIds.length === 0) {
            alert('Debes seleccionar al menos un curso/materia para bloquear.');
            return;
        }

        // Simulación de envío a backend
        alert(`[BLOQUEO MASIVO CREADO]
        Rango de fechas: ${startDate} al ${endDate}
        Cursos Bloqueados: ${selectedCourseIds.join(', ')}
        Observación del docente: ${profObservation}
        Lógica: Se inyectarán inasistencias en cascada para todos los periodos futuros del rango.`);

        onClose();
    };

    const isTeacher = userRole === 'Profesor';

    return (
        <div className="stitch-modal-backdrop">
            <div className="stitch-modal-content">
                {/* Cabecera */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '16px' }}>
                    <h3 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '700', fontSize: '20px' }}>
                        {isTeacher ? 'Programación de Inasistencias Masivas' : 'Justificación de Inasistencias'}
                    </h3>
                    <button 
                        onClick={onClose}
                        style={{ border: 'none', background: 'none', cursor: 'pointer', color: 'var(--stitch-text-secondary)' }}
                    >
                        <span className="material-icons-outlined">close</span>
                    </button>
                </div>

                {!isTeacher ? (
                    // --------------------------------------------------------
                    // FORMULARIO DEL ENCARGADO
                    // --------------------------------------------------------
                    <form onSubmit={handleJustifySubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                            <div style={{ backgroundColor: 'var(--stitch-background)', padding: '12px', borderRadius: '8px', fontSize: '14px' }}>
                                Alumno: <strong>{studentName || 'Estudiante UA'}</strong> (ID: {studentId || 'N/D'})
                            </div>

                            <div>
                                <label className="stitch-label">
                                    Fecha de la Inasistencia:
                                </label>
                                <input 
                                    type="date" 
                                    value={fechaFalta}
                                    onChange={(e) => setFechaFalta(e.target.value)}
                                    className="stitch-input"
                                    required
                                />
                            </div>

                            {/* Alerta de bloqueo por tiempo excedido */}
                            {isPastDeadline && (
                                <div className="stitch-alert stitch-alert-danger" style={{ margin: 0 }}>
                                    <div>
                                        <span style={{ fontWeight: '700', display: 'block', marginBottom: '4px' }}>
                                            ⚠ Plazo Excedido (Límite Mediodía)
                                        </span>
                                        La justificación digital expira a las 12:00 PM del día siguiente a la falta. Debes gestionar la justificación de forma presencial o por llamada con Control Académico.
                                        <div style={{ marginTop: '8px', fontWeight: 'bold' }}>
                                            Estado bloqueado: Sin justificación por falta.
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div>
                                <label className="stitch-label">
                                    Motivo o Justificación Médica/Personal:
                                </label>
                                <textarea 
                                    rows="4"
                                    value={motivo}
                                    onChange={(e) => setMotivo(e.target.value)}
                                    placeholder="Detalla de forma explícita el motivo de la falta del alumno..."
                                    className="stitch-textarea"
                                    disabled={isPastDeadline}
                                    required
                                />
                            </div>

                            <div>
                                <label className="stitch-label">
                                    URL de Documento de Soporte (Receta, Constancia):
                                </label>
                                <input 
                                    type="url" 
                                    value={documentoUrl}
                                    onChange={(e) => setDocumentoUrl(e.target.value)}
                                    placeholder="http://ejemplo.com/constancia.pdf"
                                    className="stitch-input"
                                    disabled={isPastDeadline}
                                />
                            </div>

                            <div>
                                <label className="stitch-label">
                                    Enviar solicitud a:
                                </label>
                                <select 
                                    value={destino}
                                    onChange={(e) => setDestino(e.target.value)}
                                    className="stitch-select"
                                    disabled={isPastDeadline}
                                >
                                    <option value="Profesor Guia">Profesor Guía de Grado</option>
                                    <option value="Secretaria">Control Académico (Secretaría)</option>
                                </select>
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="stitch-button-secondary"
                            >
                                Cancelar
                            </button>
                            <button 
                                type="submit" 
                                className="stitch-button"
                                style={{ backgroundColor: isPastDeadline ? 'var(--stitch-border)' : 'var(--stitch-primary)' }}
                                disabled={isPastDeadline}
                            >
                                Enviar Justificación Digital
                            </button>
                        </div>
                    </form>
                ) : (
                    // --------------------------------------------------------
                    // FORMULARIO DEL PROFESOR
                    // --------------------------------------------------------
                    <form onSubmit={handleBulkAbsenceSubmit}>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginBottom: '24px' }}>
                            <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-secondary)' }}>
                                Define un rango de fechas para inhabilitar en cascada la asistencia del estudiante para los periodos de las materias seleccionadas (ej. periodos de incapacidad médica del alumno).
                            </p>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                                <div>
                                    <label className="stitch-label">Fecha Inicio:</label>
                                    <input 
                                        type="date" 
                                        value={startDate}
                                        onChange={(e) => setStartDate(e.target.value)}
                                        className="stitch-input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="stitch-label">Fecha Fin:</label>
                                    <input 
                                        type="date" 
                                        value={endDate}
                                        onChange={(e) => setEndDate(e.target.value)}
                                        className="stitch-input"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="stitch-label">Materias/Cursos a Afectar:</label>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', border: '1px solid var(--stitch-border)', padding: '12px', borderRadius: '6px', backgroundColor: '#FFFFFF' }}>
                                    {bulkCourses.map((c, index) => (
                                        <label key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', cursor: 'pointer', color: 'var(--stitch-text-primary)', fontWeight: '500' }}>
                                            <input 
                                                type="checkbox" 
                                                checked={c.selected}
                                                onChange={() => {
                                                    setBulkCourses(bulkCourses.map((item, idx) => 
                                                        idx === index ? { ...item, selected: !item.selected } : item
                                                    ));
                                                }}
                                                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                            />
                                            {c.name}
                                        </label>
                                    ))}
                                </div>
                            </div>

                            <div>
                                <label className="stitch-label">Observación Académica o Motivo:</label>
                                <textarea 
                                    rows="3"
                                    value={profObservation}
                                    onChange={(e) => setProfObservation(e.target.value)}
                                    placeholder="Escribe la causa o justificación del bloqueo (ej: Licencia médica de 5 días emitida por el IGSS)..."
                                    className="stitch-textarea"
                                    required
                                />
                            </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                            <button 
                                type="button" 
                                onClick={onClose}
                                className="stitch-button-secondary"
                            >
                                Cancelar
                            </button>
                            <button type="submit" className="stitch-button">
                                Aplicar Bloqueo de Asistencias
                            </button>
                        </div>
                    </form>
                )}
            </div>
        </div>
    );
}

