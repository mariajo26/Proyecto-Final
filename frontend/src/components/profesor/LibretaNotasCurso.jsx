import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

// ============================================================================
// DATOS DEMO: ALUMNOS E INASISTENCIAS DEL CURSO
// ============================================================================
const ESTUDIANTES_DEMO = [
    { id: 101, nombre: 'Carlos Eduardo Méndez', codigo: 'UA-26501' },
    { id: 102, nombre: 'María José Flores', codigo: 'UA-26502' },
    { id: 103, nombre: 'Sofía Isabel Castro', codigo: 'UA-26505' },
    { id: 104, nombre: 'Diego Alejandro Ortiz', codigo: 'UA-26508' }
];

// Actividades planificadas del curso clasificadas y divididas por unidades
const ACTIVIDADES_POR_UNIDAD = {
    'Unidad 1': [
        { id: 1, titulo: 'Hoja de Trabajo 1', tipo: 'Hojas de Trabajo', ponderacion: 10 },
        { id: 2, titulo: 'Hoja de Trabajo 2', tipo: 'Hojas de Trabajo', ponderacion: 10 },
        { id: 3, titulo: 'Corto Temático 1', tipo: 'Cortos', ponderacion: 15 },
        { id: 4, titulo: 'Examen de Unidad', tipo: 'Exámenes', ponderacion: 65 }
    ],
    'Unidad 2': [ // Unidad actual (En edición)
        { id: 5, titulo: 'Hoja de Trabajo 3', tipo: 'Hojas de Trabajo', ponderacion: 15 },
        { id: 6, titulo: 'Investigación Álgebra', tipo: 'Tareas Comunes', ponderacion: 20 },
        { id: 7, titulo: 'Corto Funciones', tipo: 'Cortos', ponderacion: 15 },
        { id: 8, titulo: 'Examen Parcial II', tipo: 'Exámenes', ponderacion: 50 }
    ],
    'Unidad 3': [
        { id: 9, titulo: 'Laboratorio de Vectores', tipo: 'Laboratorios', ponderacion: 20 },
        { id: 10, titulo: 'Hoja de Trabajo 4', tipo: 'Hojas de Trabajo', ponderacion: 15 },
        { id: 11, titulo: 'Examen Parcial III', tipo: 'Exámenes', ponderacion: 65 }
    ],
    'Unidad 4': [
        { id: 12, titulo: 'Proyecto Integrador', tipo: 'Proyectos', ponderacion: 40 },
        { id: 13, titulo: 'Defensa Práctica', tipo: 'Evaluación Oral', ponderacion: 20 },
        { id: 14, titulo: 'Examen Final Escrito', tipo: 'Exámenes', ponderacion: 40 }
    ]
};

// Calificaciones iniciales por alumno y actividad
const CALIFICACIONES_INICIALES = {
    // Alumno 101
    '101_1': 9, '101_2': 10, '101_3': 14, '101_4': 60, // U1
    '101_5': 12, '101_6': 18, '101_7': 13, '101_8': 45, // U2 (Actual)
    // Alumno 102
    '102_1': 10, '102_2': 9, '102_3': 15, '102_4': 63, // U1
    '102_5': 15, '102_6': 20, '102_7': 14, '102_8': 48, // U2
    // Alumno 103
    '103_1': 8, '103_2': 8, '103_3': 12, '103_4': 55, // U1
    '103_5': 11, '103_6': 16, '103_7': 11, '103_8': 38, // U2
    // Alumno 104
    '104_1': 7, '104_2': 9, '104_3': 11, '104_4': 58, // U1
    '104_5': 13, '104_6': 17, '104_7': 12, '104_8': 42  // U2
};

export default function LibretaNotasCurso() {
    const location = useLocation();
    const navigate = useNavigate();
    const { token } = useAuth();

    // Recuperar el curso recibido por navigation state
    const curso = location.state?.curso || null;

    useEffect(() => {
        if (!curso) {
            navigate('/cursos');
        }
    }, [curso, navigate]);

    // -------------------------------------------------------------------------
    // ESTADOS DE LA LIBRETA
    // -------------------------------------------------------------------------
    const [unidadActiva, setUnidadActiva] = useState('Unidad 2'); // Por defecto Unidad 2 (Unidad Actual)
    const [calificaciones, setCalificaciones] = useState(CALIFICACIONES_INICIALES);
    const [guardando, setGuardando] = useState(false);
    const [cambiosPendientes, setCambiosPendientes] = useState(false);

    const unidadActual = 'Unidad 2'; // Definimos rigidamente la unidad actual editable

    if (!curso) return null;

    // Obtener actividades de la unidad seleccionada
    const actividades = ACTIVIDADES_POR_UNIDAD[unidadActiva] || [];

    // Agrupar actividades por su clasificación/tipo para la primera fila de cabecera
    const clasificaciones = actividades.reduce((acc, act) => {
        if (!acc[act.tipo]) {
            acc[act.tipo] = [];
        }
        acc[act.tipo].push(act);
        return acc;
    }, {});

    // -------------------------------------------------------------------------
    // HANDLER DE NOTAS (Edición en tiempo real para Unidad Actual)
    // -------------------------------------------------------------------------
    const handleNotaChange = (alumnoId, actividadId, maxPts, valor) => {
        if (unidadActiva !== unidadActual) return; // Bloquear si no es la unidad actual

        let notaVal = valor === '' ? '' : parseFloat(valor);
        if (notaVal !== '') {
            if (notaVal < 0) notaVal = 0;
            if (notaVal > maxPts) notaVal = maxPts;
        }

        const key = `${alumnoId}_${actividadId}`;
        setCalificaciones(prev => ({
            ...prev,
            [key]: notaVal
        }));
        setCambiosPendientes(true);
    };

    // Simular guardado automático (autosave al perder foco)
    const handleBlurSave = () => {
        if (!cambiosPendientes) return;
        setGuardando(true);
        setTimeout(() => {
            setGuardando(false);
            setCambiosPendientes(false);
            console.log('Notas guardadas en la base de datos para el curso:', curso.id);
        }, 800);
    };

    // Calcular promedio final ponderado de la unidad por alumno
    const getPromedioUnidad = (alumnoId) => {
        let sumaObtenida = 0;
        let sumaPonderacion = 0;

        actividades.forEach(act => {
            const key = `${alumnoId}_${act.id}`;
            const nota = calificaciones[key] || 0;
            sumaObtenida += nota;
            sumaPonderacion += act.ponderacion;
        });

        if (sumaPonderacion === 0) return 0;
        return Math.round((sumaObtenida / sumaPonderacion) * 100);
    };

    return (
        <div style={{ fontFamily: 'var(--stitch-font)', padding: '4px' }}>
            
            {/* ── CABECERA Y METADATOS ──────────────────────────────────────── */}
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
                    menu_book
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#93C5FD', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '14px' }}>class</span>
                        Libreta de Calificaciones Interna
                    </span>
                    <h2 style={{ color: '#FFFFFF', fontWeight: '800', margin: '4px 0 0 0', fontSize: '24px', fontFamily: 'Outfit, sans-serif' }}>
                        {curso.materia_nombre}
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Salón: {curso.aula} · Sección: {curso.seccion} · Ciclo Académico Actual
                    </p>
                </div>
                
                <button
                    onClick={() => navigate('/cursos')}
                    className="stitch-button-secondary"
                    style={{
                        position: 'relative', zIndex: 1,
                        border: '1.5px solid rgba(255,255,255,0.3)',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        color: '#FFFFFF',
                    }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                    Mis Cursos
                </button>
            </div>

            {/* ── SELECTOR DE UNIDADES (PESTAÑAS) ───────────────────────────── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '16px' }}>
                <div className="stitch-tabs-container" style={{ marginBottom: 0 }}>
                    {Object.keys(ACTIVIDADES_POR_UNIDAD).map(u => {
                        const esActual = u === unidadActual;
                        const seleccionada = u === unidadActiva;
                        return (
                            <button
                                key={u}
                                onClick={() => setUnidadActiva(u)}
                                className={`stitch-tab-btn ${seleccionada ? 'stitch-tab-btn-active' : ''}`}
                                style={{ padding: '8px 16px', fontSize: '13px' }}
                            >
                                {u}
                                {esActual && (
                                    <span style={{ width: '6px', height: '6px', backgroundColor: 'var(--stitch-success)', borderRadius: '50%' }} title="Unidad en Curso" />
                                )}
                            </button>
                        );
                    })}
                </div>

                {/* Feedback del Autosave */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', fontWeight: '600' }}>
                    {unidadActiva === unidadActual ? (
                        <>
                            <span className="material-icons-outlined" style={{ fontSize: '18px', color: 'var(--stitch-success)' }}>edit</span>
                            <span style={{ color: 'var(--stitch-success)' }}>Modo Edición Habilitado</span>
                            {guardando ? (
                                <span style={{ color: 'var(--stitch-text-secondary)', fontStyle: 'italic', marginLeft: '10px' }}>(Guardando cambios...)</span>
                            ) : (
                                cambiosPendientes && <span style={{ color: 'var(--stitch-warning)', marginLeft: '10px' }}>(Cambios sin guardar)</span>
                            )}
                        </>
                    ) : (
                        <>
                            <span className="material-icons-outlined" style={{ fontSize: '18px', color: 'var(--stitch-danger)' }}>lock</span>
                            <span style={{ color: 'var(--stitch-danger)' }}>Modo Lectura Histórico (Bloqueado)</span>
                        </>
                    )}
                </div>
            </div>

            {/* ── CUADRÍCULA DE CALIFICACIONES CLASIFICADA ───────────────────── */}
            <div className="stitch-card" style={{ padding: '0px', backgroundColor: '#FFFFFF', overflow: 'hidden' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="stitch-table">
                        
                        {/* Cabecera Nivel 1: Clasificación de Actividades */}
                        <thead>
                            <tr>
                                <th rowSpan={2} className="stitch-th" style={{ width: '220px', borderRight: '2px solid var(--stitch-border)', verticalAlign: 'middle' }}>
                                    Datos del Estudiante
                                </th>
                                {Object.keys(clasificaciones).map(tipo => {
                                    const colsCount = clasificaciones[tipo].length;
                                    return (
                                        <th
                                            key={tipo}
                                            colSpan={colsCount}
                                            className="stitch-th"
                                            style={{
                                                textAlign: 'center',
                                                borderRight: '1px solid var(--stitch-border)',
                                                borderBottom: '1px solid var(--stitch-border)',
                                                backgroundColor: 'rgba(30, 41, 59, 0.03)',
                                                textTransform: 'uppercase',
                                                fontSize: '11px',
                                                letterSpacing: '0.5px'
                                            }}
                                        >
                                            {tipo}
                                        </th>
                                    );
                                })}
                                <th rowSpan={2} className="stitch-th" style={{ textAlign: 'center', width: '100px', borderLeft: '2px solid var(--stitch-border)', backgroundColor: 'rgba(30, 58, 138, 0.03)', verticalAlign: 'middle' }}>
                                    Promedio Unidad
                                </th>
                            </tr>

                            {/* Cabecera Nivel 2: Títulos de Tareas rotados 90 grados */}
                            <tr style={{ backgroundColor: '#FFFFFF', borderBottom: '2px solid var(--stitch-border)' }}>
                                {actividades.map(act => (
                                    <th
                                        key={act.id}
                                        className="stitch-th"
                                        style={{
                                            height: '140px',
                                            verticalAlign: 'bottom',
                                            padding: '10px 4px',
                                            borderRight: '1px solid var(--stitch-border)',
                                            width: '80px',
                                            minWidth: '80px',
                                            textAlign: 'center'
                                        }}
                                    >
                                        <div style={{
                                            writingMode: 'vertical-rl',
                                            transform: 'rotate(180deg)',
                                            whiteSpace: 'nowrap',
                                            fontWeight: '700',
                                            color: 'var(--stitch-text-primary)',
                                            display: 'inline-flex',
                                            alignItems: 'flex-start',
                                            fontSize: '12px',
                                            width: '100%',
                                            boxSizing: 'border-box'
                                        }}>
                                            <span style={{ display: 'block', maxWidth: '110px', overflow: 'hidden', textOverflow: 'ellipsis' }} title={act.titulo}>
                                                {act.titulo}
                                            </span>
                                            <span style={{ fontSize: '10px', color: 'var(--stitch-text-secondary)', fontWeight: '500', marginTop: '4px' }}>
                                                ({act.ponderacion} pts)
                                            </span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        {/* Cuerpo de Calificaciones */}
                        <tbody>
                            {ESTUDIANTES_DEMO.map((alumno, idx) => (
                                <tr key={alumno.id} className="stitch-tr-hover">
                                    
                                    {/* Info Alumno */}
                                    <td className="stitch-td" style={{ borderRight: '2px solid var(--stitch-border)', whiteSpace: 'nowrap' }}>
                                        <div style={{ fontWeight: '700', color: 'var(--stitch-text-primary)' }}>{alumno.nombre}</div>
                                        <div style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)', marginTop: '2px' }}>{alumno.codigo}</div>
                                    </td>

                                    {/* Celdas de Notas (Inputs en Unidad Actual, Texto estático en otras) */}
                                    {actividades.map(act => {
                                        const key = `${alumno.id}_${act.id}`;
                                        const notaVal = calificaciones[key] ?? '';
                                        const esEditable = unidadActiva === unidadActual;

                                        return (
                                            <td
                                                key={act.id}
                                                className="stitch-td"
                                                style={{
                                                    textAlign: 'center',
                                                    borderRight: '1px solid var(--stitch-border)',
                                                    verticalAlign: 'middle'
                                                }}
                                            >
                                                {esEditable ? (
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max={act.ponderacion}
                                                        step="0.5"
                                                        value={notaVal}
                                                        onChange={e => handleNotaChange(alumno.id, act.id, act.ponderacion, e.target.value)}
                                                        onBlur={handleBlurSave}
                                                        className="stitch-input"
                                                        style={{
                                                            width: '55px',
                                                            padding: '6px',
                                                            textAlign: 'center',
                                                            fontWeight: '700',
                                                            color: 'var(--stitch-primary)',
                                                            backgroundColor: '#FFFFFF',
                                                            boxSizing: 'border-box',
                                                            margin: '0 auto'
                                                        }}
                                                    />
                                                ) : (
                                                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--stitch-text-primary)' }}>
                                                        {notaVal !== '' ? notaVal : '—'}
                                                    </span>
                                                )}
                                            </td>
                                        );
                                    })}

                                    {/* Promedio Final */}
                                    <td
                                        className="stitch-td"
                                        style={{
                                            textAlign: 'center',
                                            fontWeight: '800',
                                            fontSize: '14px',
                                            color: '#1E3A8A',
                                            backgroundColor: 'rgba(30, 58, 138, 0.04)',
                                            borderLeft: '2px solid var(--stitch-border)',
                                            verticalAlign: 'middle'
                                        }}
                                    >
                                        {getPromedioUnidad(alumno.id)}%
                                    </td>

                                </tr>
                            ))}
                        </tbody>

                    </table>
                </div>
            </div>

            {/* ───────────────────────────────────────────────────────────────
                ESTRUCTURA DE MODELO DE DATOS RECOMENDADA (DOCUMENTACIÓN DE BD)
            ────────────────────────────────────────────────────────────────
                * SQL Relacional:
                  - Tabla: libreta_calificaciones (id, curso_id, alumno_id, actividad_id, nota, creado_por, updated_at)
                    Clave única compuesta: (alumno_id, actividad_id) para garantizar 1 nota por actividad.
                
                * NoSQL (MongoDB):
                  - Colección: calificaciones
                  - Esquema:
                    {
                        _id: ObjectId,
                        curso_id: ObjectId,
                        alumno_id: ObjectId,
                        actividades_notas: [
                            { actividad_id: ObjectId, nota: Number, fecha_registro: Date }
                        ],
                        promedios_unidades: {
                            unidad_1: Number,
                            unidad_2: Number,
                            unidad_3: Number,
                            unidad_4: Number
                        }
                    }
            ──────────────────────────────────────────────────────────────── */}
        </div>
    );
}
