import React, { useState } from 'react';
import '../../styles/StTheme.css';

// ----------------------------------------------------------------------------
// COMPONENTE: DETALLE DEL CURSO (VISTA DE RÚBRICAS, CALIFICACIONES Y TAREAS)
// ----------------------------------------------------------------------------
export default function CourseDetail({ courseId, userRole, onClose }) {
    // 1. Estados para el panel de Rúbricas
    const [rubrics, setRubrics] = useState([
        { id: 1, criterion: 'Contenido y Análisis', weight: 40, excellent: 'Analiza a profundidad el tema', good: 'Cubre el tema de forma general', poor: 'Información errónea o escasa' },
        { id: 2, criterion: 'Presentación y Estructura', weight: 30, excellent: 'Formato limpio, estructura lógica', good: 'Presentación adecuada sin estructura clara', poor: 'Desorganizado y descuidado' },
        { id: 3, criterion: 'Redacción y Ortografía', weight: 30, excellent: 'Sin faltas de ortografía, vocabulario fluido', good: 'Menos de 3 faltas ortográficas', poor: 'Muchas faltas ortográficas' }
    ]);
    const [newCriterion, setNewCriterion] = useState('');
    const [newWeight, setNewWeight] = useState(0);

    // 2. Estados para el listado de tareas enviadas por alumnos (Vista Profesor)
    const [studentSubmissions, setStudentSubmissions] = useState([
        { id: 101, studentName: 'Ana Sofia Gomez', taskTitle: 'Hoja de Trabajo 1', submittedAt: '2026-07-08 14:30', fileUrl: '#', status: 'Pendiente', grade: 0 },
        { id: 102, studentName: 'Carlos David Perez', taskTitle: 'Hoja de Trabajo 1', submittedAt: '2026-07-09 11:20', fileUrl: '#', status: 'Pendiente', grade: 0 },
        { id: 103, studentName: 'Maria Rodriguez Ramos', taskTitle: 'Laboratorio de Álgebra', submittedAt: '2026-07-07 09:15', fileUrl: '#', status: 'Calificada', grade: 9.5 }
    ]);

    // 3. Estado de tareas asignadas (Vista Espejo Alumno/Encargado)
    const [assignments, setAssignments] = useState([
        { id: 1, title: 'Práctica de Ecuaciones', limitDate: '2026-07-12 23:59', weight: 10, type: 'Proxima', status: 'Asignada', colorCode: 'var(--stitch-secondary)' },
        { id: 2, title: 'Hoja de Trabajo 1', limitDate: '2026-07-08 12:00', weight: 10, type: 'Pendiente de Calificar', status: 'Entregada', colorCode: 'var(--stitch-info)' },
        { id: 3, title: 'Proyecto Final de Ciclo', limitDate: '2026-07-20 23:59', weight: 30, type: 'Proxima', status: 'Asignada', colorCode: 'var(--stitch-secondary)' },
        { id: 4, title: 'Laboratorio de Vectores', limitDate: '2026-07-01 12:00', weight: 15, type: 'Calificadas', status: 'Calificada', grade: 14.0, colorCode: 'var(--stitch-success)' },
        { id: 5, title: 'Cuestionario Funciones', limitDate: '2026-07-05 12:00', weight: 15, type: 'Retrasadas/Intolerables', status: 'Retrasada - Nivel 2 (50% penalización)', colorCode: 'var(--stitch-warning)' },
        { id: 6, title: 'Guía Conceptual de Matrices', limitDate: '2026-06-25 12:00', weight: 20, type: 'Retrasadas/Intolerables', status: 'Intolerable (10% Automático)', colorCode: 'var(--stitch-danger)' }
    ]);

    // 4. Estados de control de edición
    const [filterType, setFilterType] = useState('Todas');
    const [gradingSubmission, setGradingSubmission] = useState(null);
    const [tempGrade, setTempGrade] = useState('');

    // Calcular suma total del peso de la rúbrica
    const totalRubricWeight = rubrics.reduce((acc, curr) => acc + curr.weight, 0);

    // Agregar criterio a la rúbrica
    const handleAddCriterion = (e) => {
        e.preventDefault();
        if (!newCriterion || newWeight <= 0) {
            alert('Por favor introduce un nombre de criterio y un peso válido mayor a 0.');
            return;
        }

        if (totalRubricWeight + Number(newWeight) > 100) {
            alert('La suma de los pesos de la rúbrica no puede exceder el 100%.');
            return;
        }

        const newId = rubrics.length + 1;
        setRubrics([
            ...rubrics,
            {
                id: newId,
                criterion: newCriterion,
                weight: Number(newWeight),
                excellent: 'Cumple de manera excepcional',
                good: 'Cumple satisfactoriamente',
                poor: 'No cumple con los mínimos requeridos'
            }
        ]);
        setNewCriterion('');
        setNewWeight(0);
    };

    // Calificar envío
    const handleGradeSubmission = (e) => {
        e.preventDefault();
        if (Number(tempGrade) < 0 || Number(tempGrade) > 10) {
            alert('La calificación debe estar comprendida entre 0.0 y 10.0');
            return;
        }

        setStudentSubmissions(
            studentSubmissions.map((sub) =>
                sub.id === gradingSubmission.id
                    ? { ...sub, status: 'Calificada', grade: Number(tempGrade) }
                    : sub
            )
        );
        setGradingSubmission(null);
        setTempGrade('');
    };

    // Renderizado según el rol
    const isTeacher = userRole === 'Profesor';

    return (
        <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '16px' }}>
                <h2 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '700', fontSize: '20px' }}>
                    Detalle del Curso - Código #{courseId}
                </h2>
                <button 
                    onClick={onClose}
                    className="stitch-button-secondary"
                >
                    Cerrar Detalle
                </button>
            </div>

            {isTeacher ? (
                // ------------------------------------------------------------
                // PANEL DEL PROFESOR
                // ------------------------------------------------------------
                <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
                    
                    {/* Sección: Banco de Rúbricas */}
                    <div>
                        <h3 className="stitch-title-font" style={{ color: 'var(--stitch-primary)', borderBottom: '2px solid var(--stitch-secondary)', paddingBottom: '8px', marginBottom: '16px', fontSize: '16px', fontWeight: '800' }}>
                            Gestión del Banco de Rúbricas
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table className="stitch-table">
                                    <thead>
                                        <tr>
                                            <th className="stitch-th">Criterio</th>
                                            <th className="stitch-th">Peso (%)</th>
                                            <th className="stitch-th">Excelente</th>
                                            <th className="stitch-th">Bien</th>
                                            <th className="stitch-th">Deficiente</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rubrics.map((r) => (
                                            <tr key={r.id} className="stitch-tr-hover">
                                                <td className="stitch-td" style={{ fontWeight: '700' }}>{r.criterion}</td>
                                                <td className="stitch-td" style={{ color: 'var(--stitch-secondary)', fontWeight: '800' }}>{r.weight}%</td>
                                                <td className="stitch-td" style={{ color: 'var(--stitch-text-secondary)', fontSize: '13px' }}>{r.excellent}</td>
                                                <td className="stitch-td" style={{ color: 'var(--stitch-text-secondary)', fontSize: '13px' }}>{r.good}</td>
                                                <td className="stitch-td" style={{ color: 'var(--stitch-text-secondary)', fontSize: '13px' }}>{r.poor}</td>
                                            </tr>
                                        ))}
                                        <tr style={{ backgroundColor: 'var(--stitch-background)', fontWeight: '700' }}>
                                            <td className="stitch-td" style={{ fontWeight: '800' }}>Total Ponderación Acumulada</td>
                                            <td className="stitch-td" style={{ color: totalRubricWeight === 100 ? 'var(--stitch-success)' : 'var(--stitch-danger)', fontWeight: '800' }}>
                                                {totalRubricWeight}%
                                            </td>
                                            <td colSpan="3" className="stitch-td" style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)' }}>
                                                {totalRubricWeight === 100 ? '✓ Rúbrica completa y lista.' : '⚠ La suma total debe ser exactamente 100%.'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Formulario para agregar criterios */}
                            <form onSubmit={handleAddCriterion} className="stitch-card" style={{ padding: '20px', backgroundColor: '#F8FAFC' }}>
                                <h4 className="stitch-title-font" style={{ margin: '0 0 16px 0', color: 'var(--stitch-primary)', fontSize: '14px', fontWeight: '800' }}>Añadir Criterio de Rúbrica</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                                    <div>
                                        <label className="stitch-label">Criterio:</label>
                                        <input 
                                            type="text" 
                                            value={newCriterion} 
                                            onChange={(e) => setNewCriterion(e.target.value)}
                                            placeholder="Ej. Análisis Crítico"
                                            className="stitch-input"
                                        />
                                    </div>
                                    <div>
                                        <label className="stitch-label">Peso (%):</label>
                                        <input 
                                            type="number" 
                                            value={newWeight || ''} 
                                            onChange={(e) => setNewWeight(Number(e.target.value))}
                                            placeholder="Ponderación (0-100)"
                                            className="stitch-input"
                                        />
                                    </div>
                                </div>
                                <button type="submit" className="stitch-button" style={{ width: '100%', justifyContent: 'center' }}>
                                    Guardar Criterio
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Sección: Entregas pendientes de calificación */}
                    <div>
                        <h3 className="stitch-title-font" style={{ color: 'var(--stitch-primary)', borderBottom: '2px solid var(--stitch-secondary)', paddingBottom: '8px', marginBottom: '16px', fontSize: '16px', fontWeight: '800' }}>
                            Tareas Enviadas por Estudiantes
                        </h3>

                        {gradingSubmission && (
                            <form onSubmit={handleGradeSubmission} className="stitch-alert stitch-alert-success" style={{ margin: '0 0 20px 0', padding: '16px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
                                <span style={{ color: 'inherit' }}>Calificando a <strong>{gradingSubmission.studentName}</strong> en <em>{gradingSubmission.taskTitle}</em>:</span>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    value={tempGrade} 
                                    onChange={(e) => setTempGrade(e.target.value)}
                                    placeholder="Nota (0.0 a 10.0)"
                                    className="stitch-input"
                                    style={{ width: '150px' }}
                                />
                                <button type="submit" className="stitch-button">Asignar Nota</button>
                                <button type="button" onClick={() => setGradingSubmission(null)} style={{ background: 'none', border: 'none', color: 'var(--stitch-danger)', cursor: 'pointer', fontWeight: '700' }}>Cancelar</button>
                            </form>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {studentSubmissions.map((sub) => (
                                <div key={sub.id} className="stitch-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', backgroundColor: '#FFFFFF' }}>
                                    <div>
                                        <h4 className="stitch-title-font" style={{ margin: '0 0 4px 0', color: 'var(--stitch-primary)', fontSize: '14px', fontWeight: '800' }}>{sub.studentName}</h4>
                                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-secondary)' }}>
                                            Tarea: <strong>{sub.taskTitle}</strong> | Recibida el: {sub.submittedAt}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {sub.status === 'Calificada' ? (
                                            <span className="stitch-badge stitch-badge-success" style={{ fontSize: '13px', padding: '4px 12px' }}>
                                                Nota: {sub.grade}/10.0
                                            </span>
                                        ) : (
                                            <>
                                                <span className="stitch-badge stitch-badge-warning">
                                                    Pendiente
                                                </span>
                                                <button 
                                                    onClick={() => setGradingSubmission(sub)}
                                                    className="stitch-button" 
                                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                                >
                                                    Evaluar con Rúbrica
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            ) : (
                // ------------------------------------------------------------
                // PANEL DE TAREAS (VISTA ESPEJO ALUMNO/ENCARGADO)
                // ------------------------------------------------------------
                <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <h3 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '16px' }}>
                            Asignaciones Académicas
                        </h3>
                        <div className="stitch-tabs-container" style={{ marginBottom: 0, border: 'none' }}>
                            {['Todas', 'Proxima', 'Calificadas', 'Pendiente de Calificar', 'Retrasadas/Intolerables'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    className={`stitch-tab-btn ${filterType === type ? 'stitch-tab-btn-active' : ''}`}
                                    style={{ padding: '6px 12px', fontSize: '12px' }}
                                >
                                    {type}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '16px' }}>
                        {assignments
                            .filter(a => filterType === 'Todas' || a.type === filterType)
                            .map((a) => (
                                <div 
                                    key={a.id} 
                                    className="stitch-card"
                                    style={{ 
                                        padding: '20px', 
                                        backgroundColor: '#FFFFFF', 
                                        borderLeft: `5px solid ${a.colorCode}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <h4 className="stitch-title-font" style={{ margin: '0 0 6px 0', fontSize: '15px', color: 'var(--stitch-primary)', fontWeight: '800' }}>{a.title}</h4>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--stitch-text-secondary)' }}>
                                            <span>Ponderación: <strong>{a.weight} Pts</strong></span>
                                            <span>Límite: {a.limitDate}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {a.status === 'Calificada' ? (
                                            <span className="stitch-badge stitch-badge-success" style={{ fontSize: '14px', padding: '6px 14px' }}>
                                                {a.grade} Pts
                                            </span>
                                        ) : (
                                            <span className={`stitch-badge ${
                                                a.status.includes('Retrasada') 
                                                    ? 'stitch-badge-warning' 
                                                    : (a.status.includes('Intolerable') ? 'stitch-badge-danger' : 'stitch-badge-neutral')
                                            }`} style={{ fontSize: '12px', padding: '4px 10px' }}>
                                                {a.status}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
