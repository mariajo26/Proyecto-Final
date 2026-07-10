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
        <div style={{ backgroundColor: 'var(--stitch-surface)', borderRadius: 'var(--stitch-radius-md)', border: '1px solid var(--stitch-border)', padding: '24px', boxShadow: 'var(--stitch-shadow-md)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '16px' }}>
                <h2 style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '700' }}>
                    Detalle del Curso - Código #{courseId}
                </h2>
                <button 
                    onClick={onClose}
                    className="stitch-button"
                    style={{ backgroundColor: 'transparent', border: '1px solid var(--stitch-border)', color: 'var(--stitch-text-primary)' }}
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
                        <h3 style={{ color: 'var(--stitch-primary)', borderBottom: '2px solid var(--stitch-secondary)', paddingBottom: '8px', marginBottom: '16px' }}>
                            Gestión del Banco de Rúbricas
                        </h3>
                        
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: '24px', alignItems: 'start' }}>
                            <div style={{ overflowX: 'auto' }}>
                                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
                                    <thead>
                                        <tr style={{ borderBottom: '2px solid var(--stitch-border)' }}>
                                            <th style={{ padding: '12px' }}>Criterio</th>
                                            <th style={{ padding: '12px' }}>Peso (%)</th>
                                            <th style={{ padding: '12px' }}>Excelente</th>
                                            <th style={{ padding: '12px' }}>Bien</th>
                                            <th style={{ padding: '12px' }}>Deficiente</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rubrics.map((r) => (
                                            <tr key={r.id} style={{ borderBottom: '1px solid var(--stitch-border)' }}>
                                                <td style={{ padding: '12px', fontWeight: '500' }}>{r.criterion}</td>
                                                <td style={{ padding: '12px', color: 'var(--stitch-secondary)', fontWeight: '600' }}>{r.weight}%</td>
                                                <td style={{ padding: '12px', color: 'var(--stitch-text-secondary)' }}>{r.excellent}</td>
                                                <td style={{ padding: '12px', color: 'var(--stitch-text-secondary)' }}>{r.good}</td>
                                                <td style={{ padding: '12px', color: 'var(--stitch-text-secondary)' }}>{r.poor}</td>
                                            </tr>
                                        ))}
                                        <tr style={{ backgroundColor: 'var(--stitch-background)', fontWeight: '700' }}>
                                            <td style={{ padding: '12px' }}>Total Ponderación Acumulada</td>
                                            <td style={{ padding: '12px', color: totalRubricWeight === 100 ? 'var(--stitch-success)' : 'var(--stitch-danger)' }}>
                                                {totalRubricWeight}%
                                            </td>
                                            <td colSpan="3" style={{ padding: '12px', fontSize: '12px', color: 'var(--stitch-text-secondary)' }}>
                                                {totalRubricWeight === 100 ? '✓ Rúbrica completa y lista.' : '⚠ La suma total debe ser exactamente 100%.'}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Formulario para agregar criterios */}
                            <form onSubmit={handleAddCriterion} style={{ backgroundColor: 'var(--stitch-background)', padding: '20px', borderRadius: 'var(--stitch-radius-sm)', border: '1px solid var(--stitch-border)' }}>
                                <h4 style={{ margin: '0 0 16px 0', color: 'var(--stitch-primary)' }}>Añadir Criterio de Rúbrica</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Criterio:</label>
                                        <input 
                                            type="text" 
                                            value={newCriterion} 
                                            onChange={(e) => setNewCriterion(e.target.value)}
                                            placeholder="Ej. Análisis Crítico"
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--stitch-border)', boxSizing: 'border-box' }}
                                        />
                                    </div>
                                    <div>
                                        <label style={{ fontSize: '12px', fontWeight: '600', display: 'block', marginBottom: '4px' }}>Peso (%):</label>
                                        <input 
                                            type="number" 
                                            value={newWeight || ''} 
                                            onChange={(e) => setNewWeight(Number(e.target.value))}
                                            placeholder="Ponderación (0-100)"
                                            style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--stitch-border)', boxSizing: 'border-box' }}
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
                        <h3 style={{ color: 'var(--stitch-primary)', borderBottom: '2px solid var(--stitch-secondary)', paddingBottom: '8px', marginBottom: '16px' }}>
                            Tareas Enviadas por Estudiantes
                        </h3>

                        {gradingSubmission && (
                            <form onSubmit={handleGradeSubmission} style={{ backgroundColor: '#EFF6FF', border: '1px solid var(--stitch-secondary)', padding: '16px', borderRadius: '8px', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
                                <span>Calificando a <strong>{gradingSubmission.studentName}</strong> en <em>{gradingSubmission.taskTitle}</em>:</span>
                                <input 
                                    type="number" 
                                    step="0.1" 
                                    value={tempGrade} 
                                    onChange={(e) => setTempGrade(e.target.value)}
                                    placeholder="Nota (0.0 a 10.0)"
                                    style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--stitch-border)', width: '150px' }}
                                />
                                <button type="submit" className="stitch-button">Asignar Nota</button>
                                <button type="button" onClick={() => setGradingSubmission(null)} style={{ background: 'none', border: 'none', color: 'var(--stitch-danger)', cursor: 'pointer', fontWeight: '500' }}>Cancelar</button>
                            </form>
                        )}

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                            {studentSubmissions.map((sub) => (
                                <div key={sub.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', border: '1px solid var(--stitch-border)', borderRadius: '8px', backgroundColor: '#FFFFFF' }}>
                                    <div>
                                        <h4 style={{ margin: '0 0 4px 0', color: 'var(--stitch-primary)' }}>{sub.studentName}</h4>
                                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-secondary)' }}>
                                            Tarea: <strong>{sub.taskTitle}</strong> | Recibida el: {sub.submittedAt}
                                        </p>
                                    </div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                                        {sub.status === 'Calificada' ? (
                                            <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--stitch-success)' }}>
                                                Nota: {sub.grade}/10.0
                                            </span>
                                        ) : (
                                            <>
                                                <span style={{ fontSize: '12px', fontWeight: '600', color: 'var(--stitch-warning)', backgroundColor: '#FEF3C7', padding: '4px 8px', borderRadius: '12px' }}>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                        <h3 style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '600' }}>
                            Asignaciones Académicas
                        </h3>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            {['Todas', 'Proxima', 'Calificadas', 'Pendiente de Calificar', 'Retrasadas/Intolerables'].map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setFilterType(type)}
                                    style={{
                                        padding: '6px 12px',
                                        fontSize: '12px',
                                        borderRadius: '20px',
                                        border: filterType === type ? '1px solid var(--stitch-primary)' : '1px solid var(--stitch-border)',
                                        backgroundColor: filterType === type ? 'var(--stitch-primary)' : '#FFFFFF',
                                        color: filterType === type ? '#FFFFFF' : 'var(--stitch-text-secondary)',
                                        cursor: 'pointer',
                                        fontWeight: '500'
                                    }}
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
                                    style={{ 
                                        padding: '20px', 
                                        borderRadius: 'var(--stitch-radius-md)', 
                                        backgroundColor: '#FFFFFF', 
                                        border: `1px solid var(--stitch-border)`, 
                                        borderLeft: `5px solid ${a.colorCode}`,
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center'
                                    }}
                                >
                                    <div>
                                        <h4 style={{ margin: '0 0 6px 0', fontSize: '16px', color: 'var(--stitch-primary)' }}>{a.title}</h4>
                                        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: 'var(--stitch-text-secondary)' }}>
                                            <span>Ponderación: <strong>{a.weight} Pts</strong></span>
                                            <span>Límite: {a.limitDate}</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        {a.status === 'Calificada' ? (
                                            <span style={{ fontSize: '18px', fontWeight: '700', color: 'var(--stitch-success)' }}>
                                                {a.grade} Pts
                                            </span>
                                        ) : (
                                            <span style={{ 
                                                fontSize: '12px', 
                                                fontWeight: '700', 
                                                color: '#FFFFFF', 
                                                backgroundColor: a.colorCode,
                                                padding: '4px 10px',
                                                borderRadius: '20px'
                                            }}>
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
