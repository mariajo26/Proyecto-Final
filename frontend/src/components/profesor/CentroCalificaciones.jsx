import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

// ============================================================================
// DATOS DEMO DE ESTUDIANTES, ACTIVIDADES Y CALIFICACIONES (LEÍDOS DEL BACKEND)
// ============================================================================
const ESTUDIANTES_DEMO = [
    { id: 1, codigo_ua: 'UA-26501', nombre: 'Carlos Eduardo Méndez', correo: 'carlos.mendez@gmail.com', seccion: 'A' },
    { id: 2, codigo_ua: 'UA-26502', nombre: 'María José Flores', correo: 'maria.flores@gmail.com', seccion: 'A' },
    { id: 3, codigo_ua: 'UA-26503', nombre: 'Ana Victoria Ramos', correo: 'ana.ramos@gmail.com', seccion: 'B' },
    { id: 4, codigo_ua: 'UA-26504', nombre: 'Juan Francisco Ortiz', correo: 'juan.ortiz@gmail.com', seccion: 'B' },
    { id: 5, codigo_ua: 'UA-26505', nombre: 'Sofía Isabel Castro', correo: 'sofia.castro@gmail.com', seccion: 'A' },
];

const ACTIVIDADES_DEMO = [
    { id: 101, titulo: 'Examen Parcial I', ponderacion: 20, tipo: 'Examen Parcial - Escrita', rubrica: { nombre: 'Rúbrica de Examen Escrito', criterios: ['Comprensión y Análisis (10 pts)', 'Estructura y Redacción (10 pts)'] } },
    { id: 102, titulo: 'Corto #1: Ecuaciones', ponderacion: 10, tipo: 'Corto', rubrica: null },
    { id: 103, titulo: 'Hoja de Trabajo #1', ponderacion: 15, tipo: 'Hoja de Trabajo', rubrica: null },
    { id: 104, titulo: 'Laboratorio de Campo', ponderacion: 25, tipo: 'Laboratorio', rubrica: { nombre: 'Rúbrica de Laboratorio Práctico', criterios: ['Metodología Científica (15 pts)', 'Resultados y Gráficas (10 pts)'] } },
    { id: 105, titulo: 'Proyecto Final Trimestre', ponderacion: 30, tipo: 'Examen Final', rubrica: { nombre: 'Rúbrica de Proyecto e Innovación', criterios: ['Desarrollo Técnico (15 pts)', 'Presentación y Defensa (15 pts)'] } },
];

const NOTAS_INICIALES = {
    // estudianteId_actividadId: { nota: XX, retraso: 'Ninguno'|'Nivel 1'|'Nivel 2'|'Nivel 3'|'Intolerable', notaOriginal: XX, rubricaEvaluada: true/false }
    '1_101': { nota: 18, retraso: 'Ninguno', notaOriginal: 18, rubricaEvaluada: true },
    '1_102': { nota: 9, retraso: 'Ninguno', notaOriginal: 9, rubricaEvaluada: false },
    '1_103': { nota: 12, retraso: 'Nivel 1', notaOriginal: 15, rubricaEvaluada: false }, // -20%
    '1_104': { nota: 22, retraso: 'Ninguno', notaOriginal: 22, rubricaEvaluada: true },
    '1_105': { nota: 27, retraso: 'Ninguno', notaOriginal: 27, rubricaEvaluada: true },

    '2_101': { nota: 20, retraso: 'Ninguno', notaOriginal: 20, rubricaEvaluada: true },
    '2_102': { nota: 8, retraso: 'Ninguno', notaOriginal: 8, rubricaEvaluada: false },
    '2_103': { nota: 15, retraso: 'Ninguno', notaOriginal: 15, rubricaEvaluada: false },
    '2_104': { nota: 2.5, retraso: 'Intolerable', notaOriginal: 25, rubricaEvaluada: true }, // -90% (10% nota máx)
    '2_105': { nota: 29, retraso: 'Ninguno', notaOriginal: 29, rubricaEvaluada: true },

    '3_101': { nota: 15, retraso: 'Ninguno', notaOriginal: 15, rubricaEvaluada: true },
    '3_102': { nota: 10, retraso: 'Ninguno', notaOriginal: 10, rubricaEvaluada: false },
    '3_103': { nota: 10.5, retraso: 'Nivel 2', notaOriginal: 15, rubricaEvaluada: false }, // -30%
    '3_104': { nota: 19, retraso: 'Ninguno', notaOriginal: 19, rubricaEvaluada: true },
    '3_105': { nota: 24, retraso: 'Ninguno', notaOriginal: 24, rubricaEvaluada: true },

    '4_101': { nota: 14, retraso: 'Ninguno', notaOriginal: 14, rubricaEvaluada: true },
    '4_102': { nota: 7, retraso: 'Ninguno', notaOriginal: 7, rubricaEvaluada: false },
    '4_103': { nota: 7.5, retraso: 'Nivel 3', notaOriginal: 15, rubricaEvaluada: false }, // -50%
    '4_104': { nota: 23, retraso: 'Ninguno', notaOriginal: 23, rubricaEvaluada: true },
    '4_105': { nota: 26, retraso: 'Ninguno', notaOriginal: 26, rubricaEvaluada: true },

    '5_101': { nota: 17, retraso: 'Ninguno', notaOriginal: 17, rubricaEvaluada: true },
    '5_102': { nota: 9, retraso: 'Ninguno', notaOriginal: 9, rubricaEvaluada: false },
    '5_103': { nota: 14, retraso: 'Ninguno', notaOriginal: 14, rubricaEvaluada: false },
    '5_104': { nota: 20, retraso: 'Ninguno', notaOriginal: 20, rubricaEvaluada: true },
    '5_105': { nota: 28, retraso: 'Ninguno', notaOriginal: 28, rubricaEvaluada: true },
};

// ============================================================================
// COMPONENTE VISTA DE CONSULTA (SOLO LECTURA)
// ============================================================================
export default function CentroCalificaciones() {
    const location = useLocation();
    const navigate = useNavigate();
    const { token } = useAuth();

    // Curso/Unidad Académica seleccionada
    const curso = location.state?.curso || {
        id: 1,
        materia_nombre: 'Matemática Aplicada II',
        grado_nombre: '5to Bachillerato',
        seccion_nombre: 'A',
        salon: '204',
        color_hex: '#0D2C54'
    };

    // -------------------------------------------------------------------------
    // ESTADOS DE FILTRADO
    // -------------------------------------------------------------------------
    const [filtroSeccion, setFiltroSeccion] = useState(''); // Filtro por Salón de Clases / Sección
    const [filtroEstudianteId, setFiltroEstudianteId] = useState(''); // Filtro de estudiante individual
    const [busquedaTexto, setBusquedaTexto] = useState(''); // Búsqueda rápida por nombre/código
    const [detalleRubrica, setDetalleRubrica] = useState(null); // Modal de consulta de rúbrica

    // Datos estáticos/locales de la consulta
    const [alumnos] = useState(ESTUDIANTES_DEMO);
    const [actividades] = useState(ACTIVIDADES_DEMO);
    const [calificaciones, setCalificaciones] = useState(() => {
        const saved = localStorage.getItem('stitch_calificaciones_cuadricula');
        return saved ? JSON.parse(saved) : NOTAS_INICIALES;
    });

    useEffect(() => {
        localStorage.setItem('stitch_calificaciones_cuadricula', JSON.stringify(calificaciones));
    }, [calificaciones]);

    // -------------------------------------------------------------------------
    // TODO: API - Carga opcional de calificaciones del curso
    // GET /api/calificaciones/cuadricula/:cursoId
    // -------------------------------------------------------------------------

    // -------------------------------------------------------------------------
    // MÓDULO DE IMPRESIÓN / EXPORTACIÓN
    // -------------------------------------------------------------------------
    const handleImprimir = () => {
        window.print();
    };

    // -------------------------------------------------------------------------
    // LÓGICA DE PROMEDIOS Y MÉTRICAS
    // -------------------------------------------------------------------------
    const getEstudiantePromedio = (alumnoId) => {
        let totalPuntosObtenidos = 0;
        let totalPonderacion = 0;

        actividades.forEach(act => {
            const key = `${alumnoId}_${act.id}`;
            const registro = calificaciones[key];
            if (registro && registro.nota !== '') {
                totalPuntosObtenidos += registro.nota;
                totalPonderacion += act.ponderacion;
            }
        });

        if (totalPonderacion === 0) return 0;
        return ((totalPuntosObtenidos / totalPonderacion) * 100).toFixed(1);
    };

    const getPromedioGeneralCurso = () => {
        const promedios = alumnos.map(al => parseFloat(getEstudiantePromedio(al.id)));
        const suma = promedios.reduce((s, p) => s + p, 0);
        return (suma / alumnos.length).toFixed(1);
    };

    const countEntregasTardias = () => {
        return Object.values(calificaciones).filter(c => c.retraso !== 'Ninguno').length;
    };

    // -------------------------------------------------------------------------
    // APLICACIÓN DE FILTROS EN CASCADA
    // -------------------------------------------------------------------------
    const alumnosFiltrados = alumnos.filter(al => {
        // 1. Filtrar por Sección/Salón
        if (filtroSeccion && al.seccion !== filtroSeccion) return false;
        
        // 2. Filtrar por Estudiante Individual
        if (filtroEstudianteId && al.id !== parseInt(filtroEstudianteId)) return false;

        // 3. Búsqueda por texto (nombre o código)
        if (busquedaTexto) {
            const coincideNombre = al.nombre.toLowerCase().includes(busquedaTexto.toLowerCase());
            const coincideCodigo = al.codigo_ua.toLowerCase().includes(busquedaTexto.toLowerCase());
            return coincideNombre || coincideCodigo;
        }

        return true;
    });

    const getRetrasoStyle = (retraso) => {
        switch (retraso) {
            case 'Nivel 1':
                return { bg: 'rgba(245, 158, 11, 0.1)', color: '#D97706', label: 'Prórroga Nivel 1 (-20%)' };
            case 'Nivel 2':
                return { bg: 'rgba(249, 115, 22, 0.1)', color: '#EA580C', label: 'Prórroga Nivel 2 (-30%)' };
            case 'Nivel 3':
                return { bg: 'rgba(239, 68, 68, 0.1)', color: '#DC2626', label: 'Prórroga Nivel 3 (-50%)' };
            case 'Intolerable':
                return { bg: 'rgba(15, 23, 42, 0.1)', color: '#1E293B', label: 'Intolerable (10% Nota Máx)' };
            default:
                return null;
        }
    };

    return (
        <div style={{ fontFamily: 'var(--stitch-font)', padding: '4px' }}>
            
            {/* Hoja de estilos condicional para impresión en formato PDF */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body {
                        background-color: #FFFFFF !important;
                        color: #000000 !important;
                        font-family: 'Inter', sans-serif !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-report-container {
                        display: block !important;
                        width: 100% !important;
                        padding: 20px !important;
                    }
                    .print-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        margin-top: 16px !important;
                    }
                    .print-table th, .print-table td {
                        border: 1px solid #94A3B8 !important;
                        padding: 10px !important;
                        text-align: left !important;
                        font-size: 12px !important;
                    }
                    .print-table th {
                        background-color: #F1F5F9 !important;
                        color: #0F172A !important;
                        font-weight: bold !important;
                    }
                    .print-badge {
                        font-weight: bold !important;
                        border: 1px solid #000000 !important;
                        padding: 1px 4px !important;
                        font-size: 10px !important;
                    }
                }
            `}} />

            {/* ── CABECERA DEL CENTRO DE CONSULTA ─────────────────────────────── */}
            <div className="no-print" style={{
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
                <div style={{ position: 'absolute', right: '-20px', bottom: '-40px', fontSize: '180px', color: 'rgba(255,255,255,0.04)', fontFamily: 'Material Icons Outlined', userSelect: 'none', pointerEvents: 'none' }}>
                    analytics
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '16px', color: '#93C5FD' }}>lock</span>
                        <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: '#93C5FD', fontWeight: '700' }}>
                            Panel de Consulta (Solo Lectura)
                        </span>
                    </div>
                    <h2 className="stitch-title-font" style={{ color: '#FFFFFF', fontWeight: '800', margin: '4px 0 0 0', fontSize: '24px' }}>
                        Centro de Calificaciones
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px', margin: '4px 0 0 0' }}>
                        <strong>Unidad Académica:</strong> {curso.materia_nombre} · Grado: {curso.grado_nombre}
                    </p>
                </div>
                <button
                    onClick={() => navigate('/cursos')}
                    className="stitch-button-secondary no-print"
                    style={{
                        position: 'relative', zIndex: 1,
                        borderColor: 'rgba(255,255,255,0.3)',
                        backgroundColor: 'rgba(255,255,255,0.1)',
                        color: '#FFFFFF',
                        backdropFilter: 'blur(8px)',
                    }}
                >
                    <span className="material-icons-outlined">arrow_back</span>
                    Cursos asignados
                </button>
            </div>

            {/* ── METRICAS RÁPIDAS DEL CURSO (CONSULTA) ─────────────────────── */}
            <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '24px' }}>
                <div className="stitch-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#FFFFFF' }}>
                    <div style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)', color: 'var(--stitch-secondary)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '24px' }}>leaderboard</span>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', fontWeight: '600' }}>Promedio General</div>
                        <div className="stitch-title-font" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--stitch-primary)' }}>{getPromedioGeneralCurso()}%</div>
                    </div>
                </div>

                <div className="stitch-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#FFFFFF' }}>
                    <div style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', color: 'var(--stitch-success)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '24px' }}>rule</span>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', fontWeight: '600' }}>Calificaciones Totales</div>
                        <div className="stitch-title-font" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--stitch-primary)' }}>{Object.keys(calificaciones).length}</div>
                    </div>
                </div>

                <div className="stitch-card" style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', backgroundColor: '#FFFFFF' }}>
                    <div style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', color: 'var(--stitch-warning)', borderRadius: '50%', width: '44px', height: '44px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '24px' }}>timer</span>
                    </div>
                    <div>
                        <div style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', fontWeight: '600' }}>Tareas en Prórroga</div>
                        <div className="stitch-title-font" style={{ fontSize: '20px', fontWeight: '800', color: 'var(--stitch-primary)' }}>{countEntregasTardias()}</div>
                    </div>
                </div>
            </div>

            {/* ── FILTROS DE VISUALIZACIÓN AVANZADOS ──────────────────────────── */}
            <div className="stitch-card no-print" style={{ padding: '20px', marginBottom: '24px', backgroundColor: '#FFFFFF' }}>
                <h3 className="stitch-title-font" style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '800', color: 'var(--stitch-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>filter_alt</span>
                    Filtros de Visualización Avanzados
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', alignItems: 'end' }}>
                    
                    {/* Filtro 1: Salón de Clases / Sección */}
                    <div>
                        <label className="stitch-label">
                            Filtrar por Salón / Sección
                        </label>
                        <select
                            value={filtroSeccion}
                            onChange={e => { setFiltroSeccion(e.target.value); setFiltroEstudianteId(''); }}
                            className="stitch-select"
                        >
                            <option value="">— Todos los Salones/Secciones —</option>
                            <option value="A">Salón 204 - Sección A</option>
                            <option value="B">Salón 205 - Sección B</option>
                        </select>
                    </div>

                    {/* Filtro 2: Estudiante Individual */}
                    <div>
                        <label className="stitch-label">
                            Aislar Estudiante Individual
                        </label>
                        <select
                            value={filtroEstudianteId}
                            onChange={e => setFiltroEstudianteId(e.target.value)}
                            className="stitch-select"
                        >
                            <option value="">— Listar todos los estudiantes —</option>
                            {alumnos
                                .filter(al => !filtroSeccion || al.seccion === filtroSeccion)
                                .map(al => (
                                    <option key={al.id} value={al.id}>{al.nombre} ({al.codigo_ua})</option>
                                ))
                            }
                        </select>
                    </div>

                    {/* Filtro 3: Búsqueda rápida por nombre */}
                    <div>
                        <label className="stitch-label">
                            Búsqueda rápida (Nombre/Código)
                        </label>
                        <input
                            type="text"
                            placeholder="Ej: Carlos..."
                            value={busquedaTexto}
                            onChange={e => setBusquedaTexto(e.target.value)}
                            className="stitch-input"
                        />
                    </div>

                    {/* Botón de Impresión optimizada */}
                    <div>
                        <button
                            onClick={handleImprimir}
                            className="stitch-button"
                            style={{ backgroundColor: '#10B981', width: '100%', height: '40px', justifyContent: 'center' }}
                        >
                            <span className="material-icons-outlined" style={{ fontSize: '20px' }}>picture_as_pdf</span>
                            Imprimir Reporte PDF
                        </button>
                    </div>

                </div>
            </div>

            {/* ── CUADRÍCULA DE CALIFICACIONES (MODO SOLO LECTURA BLOQUEADO) ── */}
            <div className="stitch-card" style={{ backgroundColor: '#FFFFFF', overflow: 'hidden', padding: 0 }}>
                
                {/* Indicador de Vista Protegida de Solo Lectura */}
                <div style={{ backgroundColor: '#EFF6FF', borderBottom: '1px solid #BFDBFE', padding: '12px 20px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: '#1E40AF', fontWeight: '600' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>info</span>
                    Esta vista se encuentra en Modo de Solo Lectura. Cualquier modificación o edición está deshabilitada.
                </div>

                <div style={{ overflowX: 'auto' }}>
                    <table className="stitch-table">
                        <thead>
                            <tr style={{ backgroundColor: 'var(--stitch-primary)', color: '#1E3A8A' }}>
                                <th className="stitch-th" style={{ color: '#1E3A8A', minWidth: '220px' }}>Estudiante</th>
                                {actividades.map(act => (
                                    <th key={act.id} className="stitch-th" style={{ color: '#1E3A8A', textAlign: 'center', minWidth: '120px', borderLeft: '1px solid rgba(255,255,255,0.1)' }}>
                                        <div style={{ fontSize: '13px' }}>{act.titulo}</div>
                                        <div style={{ fontSize: '10px', color: '#1E3A8A', marginTop: '2px', fontWeight: '500' }}>
                                            {act.ponderacion} pts · {act.tipo}
                                        </div>
                                    </th>
                                ))}
                                <th className="stitch-th" style={{ color: '#ffffffff', textAlign: 'center', minWidth: '110px', backgroundColor: '#1E3A8A' }}>Promedio Final</th>
                            </tr>
                        </thead>
                        <tbody>
                            {alumnosFiltrados.length === 0 ? (
                                <tr>
                                    <td colSpan={actividades.length + 2} className="stitch-td" style={{ textAlign: 'center', padding: '32px' }}>
                                        No se encontraron alumnos con los filtros de búsqueda establecidos.
                                    </td>
                                </tr>
                            ) : (
                                alumnosFiltrados.map((alumno) => (
                                    <tr key={alumno.id} className="stitch-tr-hover">
                                        
                                        {/* Información del Estudiante */}
                                        <td className="stitch-td">
                                            <div style={{ fontWeight: '700', color: 'var(--stitch-text-primary)' }}>{alumno.nombre}</div>
                                            <div style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)', marginTop: '2px' }}>
                                                {alumno.codigo_ua} · Salón Sección {alumno.seccion}
                                            </div>
                                        </td>

                                        {/* Celdas de Calificación de Solo Lectura */}
                                        {actividades.map(act => {
                                            const key = `${alumno.id}_${act.id}`;
                                            const notaObj = calificaciones[key] || { nota: 0, retraso: 'Ninguno', notaOriginal: 0, rubricaEvaluada: false };
                                            const retrasoInfo = getRetrasoStyle(notaObj.retraso);

                                            return (
                                                <td key={act.id} className="stitch-td" style={{ textAlign: 'center', verticalAlign: 'middle', borderLeft: '1px solid var(--stitch-border)', backgroundColor: retrasoInfo ? retrasoInfo.bg : 'transparent' }}>
                                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                                                        
                                                        {/* Calificación de Solo Lectura */}
                                                        <div style={{ fontSize: '15px', fontWeight: '800', color: retrasoInfo ? retrasoInfo.color : 'var(--stitch-primary)' }}>
                                                            {notaObj.nota} <span style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)', fontWeight: '500' }}>/ {act.ponderacion}</span>
                                                        </div>

                                                        {/* Enlace para Consultar Rúbrica */}
                                                        {act.rubrica && (
                                                            <button
                                                                onClick={() => setDetalleRubrica({ rubrica: act.rubrica, estudiante: alumno.nombre, actividad: act.titulo, nota: notaObj.nota, ponderacion: act.ponderacion })}
                                                                style={{ border: 'none', background: 'none', color: 'var(--stitch-secondary)', fontSize: '11px', fontWeight: '700', cursor: 'pointer', textDecoration: 'underline', padding: '2px' }}
                                                            >
                                                                Ver Rúbrica
                                                            </button>
                                                        )}

                                                        {/* Badge de Penalización Automática */}
                                                        {retrasoInfo && (
                                                            <span
                                                                className={`stitch-badge ${
                                                                    notaObj.retraso === 'Intolerable' 
                                                                        ? 'stitch-badge-neutral' 
                                                                        : (notaObj.retraso === 'Nivel 3' ? 'stitch-badge-danger' : 'stitch-badge-warning')
                                                                }`}
                                                                title={`Nota original antes de penalización: ${notaObj.notaOriginal} pts.`}
                                                            >
                                                                {notaObj.retraso}
                                                            </span>
                                                        )}

                                                    </div>
                                                </td>
                                            );
                                        })}

                                        {/* Promedio Final */}
                                        <td className="stitch-td" style={{ textAlign: 'center', fontWeight: '800', fontSize: '15px', color: '#1E3A8A', backgroundColor: 'rgba(30, 58, 138, 0.05)', borderLeft: '1px solid var(--stitch-border)' }}>
                                            {getEstudiantePromedio(alumno.id)}%
                                        </td>

                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* ── EXPEDIENTE INDIVIDUAL AISLADO (Si se selecciona 1 solo alumno) ── */}
            {((filtroEstudianteId !== '') || (alumnosFiltrados.length === 1)) && alumnosFiltrados.length === 1 && (
                <div className="stitch-card" style={{ padding: '24px', marginTop: '28px', backgroundColor: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '12px' }}>
                        <h3 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-icons-outlined">folder_shared</span>
                            Expediente Académico Aislado
                        </h3>
                        <span className="stitch-badge stitch-badge-info" style={{ fontSize: '13px', padding: '4px 12px' }}>
                            Promedio General: {getEstudiantePromedio(alumnosFiltrados[0].id)}%
                        </span>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                        
                        {/* Info General del Estudiante */}
                        <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid var(--stitch-border)' }}>
                            <h4 className="stitch-title-font" style={{ margin: '0 0 12px 0', color: 'var(--stitch-primary)', fontWeight: '700', fontSize: '14px' }}>Datos Generales</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                                <div><strong>Estudiante:</strong> {alumnosFiltrados[0].nombre}</div>
                                <div><strong>Código Institucional:</strong> {alumnosFiltrados[0].codigo_ua}</div>
                                <div><strong>Correo de Recuperación:</strong> {alumnosFiltrados[0].correo}</div>
                                <div><strong>Salón/Sección:</strong> Salón 204 - Sección {alumnosFiltrados[0].seccion}</div>
                            </div>
                        </div>

                        {/* Desglose de Actividades */}
                        <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid var(--stitch-border)' }}>
                            <h4 className="stitch-title-font" style={{ margin: '0 0 12px 0', color: 'var(--stitch-primary)', fontWeight: '700', fontSize: '14px' }}>Rendimiento por Actividad</h4>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
                                {actividades.map(act => {
                                    const key = `${alumnosFiltrados[0].id}_${act.id}`;
                                    const notaObj = calificaciones[key] || { nota: 0, retraso: 'Ninguno', notaOriginal: 0 };
                                    return (
                                        <div key={act.id} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed var(--stitch-border)', paddingBottom: '6px' }}>
                                            <span>{act.titulo} ({act.ponderacion} pts):</span>
                                            <span style={{ fontWeight: '700' }}>
                                                {notaObj.nota} pts
                                                {notaObj.retraso !== 'Ninguno' && (
                                                    <span style={{ color: '#DC2626', marginLeft: '6px', fontSize: '11px' }}>
                                                        ({notaObj.retraso})
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                    </div>
                </div>
            )}

            {/* ── MODAL DE CONSULTR DE RÚBRICA (SOLO LECTURA) ───────────────── */}
            {detalleRubrica && (
                <div className="stitch-modal-backdrop">
                    <div className="stitch-modal-content" style={{ maxWidth: '600px' }}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '12px', marginBottom: '16px' }}>
                            <h3 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '16px' }}>
                                Consulta de Rúbrica Evaluada
                            </h3>
                            <button
                                onClick={() => setDetalleRubrica(null)}
                                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: 'var(--stitch-text-secondary)' }}
                            >
                                ×
                            </button>
                        </div>

                        <div style={{ fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                            <div><strong>Estudiante:</strong> {detalleRubrica.estudiante}</div>
                            <div><strong>Actividad:</strong> {detalleRubrica.actividad}</div>
                            <div><strong>Rúbrica:</strong> {detalleRubrica.rubrica.nombre}</div>
                            <div><strong>Nota Asignada:</strong> <span style={{ color: '#1E3A8A', fontWeight: '800' }}>{detalleRubrica.nota} / {detalleRubrica.ponderacion} pts</span></div>
                        </div>

                        <div style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid var(--stitch-border)' }}>
                            <h4 className="stitch-title-font" style={{ margin: '0 0 10px 0', fontSize: '13px', fontWeight: '700', color: 'var(--stitch-primary)' }}>
                                Criterios Evaluados:
                            </h4>
                            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '12px', color: 'var(--stitch-text-primary)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {detalleRubrica.rubrica.criterios.map((crit, i) => (
                                    <li key={i}>{crit}</li>
                                ))}
                            </ul>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '20px' }}>
                            <button
                                onClick={() => setDetalleRubrica(null)}
                                className="stitch-button"
                                style={{ padding: '8px 18px' }}
                            >
                                Entendido
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ── ÁREA DE IMPRESIÓN EXCLUSIVA (OCULTO EN INTERFAZ) ──────────────── */}
            <div style={{ display: 'none' }} className="print-report-container">
                <div style={{ textAlign: 'center', borderBottom: '2px solid #0F172A', paddingBottom: '12px', marginBottom: '24px' }}>
                    <h2 style={{ margin: '0 0 4px 0', color: '#0F172A' }}>CENTRO DE CALIFICACIONES OFICIAL</h2>
                    <h3 style={{ margin: '0 0 4px 0', color: '#334155' }}>Unidad Académica: {curso.materia_nombre}</h3>
                    <p style={{ margin: 0, color: '#64748B', fontSize: '12px' }}>
                        Reporte emitido por el docente el {new Date().toLocaleDateString()}
                    </p>
                </div>

                <table className="print-table">
                    <thead>
                        <tr>
                            <th>Estudiante</th>
                            {actividades.map(act => (
                                <th key={act.id}>{act.titulo} ({act.ponderacion} pts)</th>
                            ))}
                            <th>Promedio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {alumnosFiltrados.map(alumno => (
                            <tr key={alumno.id}>
                                <td><strong>{alumno.nombre}</strong><br /><small>{alumno.codigo_ua}</small></td>
                                {actividades.map(act => {
                                    const key = `${alumno.id}_${act.id}`;
                                    const notaObj = calificaciones[key] || { nota: '-' };
                                    return (
                                        <td key={act.id}>
                                            {notaObj.nota}
                                            {notaObj.retraso !== 'Ninguno' && (
                                                <span className="print-badge" style={{ marginLeft: '4px' }}>
                                                    {notaObj.retraso}
                                                </span>
                                            )}
                                        </td>
                                    );
                                })}
                                <td><strong>{getEstudiantePromedio(alumno.id)}%</strong></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

        </div>
    );
}

