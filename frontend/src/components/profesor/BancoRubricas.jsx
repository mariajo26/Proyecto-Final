import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

// ============================================================================
// DATOS DEMO: BANCO DE RÚBRICAS
// ============================================================================
const RUBRICAS_DEMO = [
    {
        id: 1,
        titulo: 'Rúbrica para Ensayos y Análisis Críticos',
        materia: 'Matemática Aplicada II',
        publica: true,
        criterios: [
            { id: 11, nombre: 'Análisis Conceptual', desc: 'Evalúa la comprensión teórica profunda del tema.', pts: 40 },
            { id: 12, nombre: 'Estructura y Coherencia', desc: 'Evalúa la redacción lógica y orden de la argumentación.', pts: 30 },
            { id: 13, nombre: 'Ortografía y Citación', desc: 'Validación de normas gramaticales y formato de bibliografía.', pts: 30 }
        ],
        escalas: [
            { nombre: 'Excelente', multiplicador: 1.0 }, // 100% de los puntos
            { nombre: 'Satisfactorio', multiplicador: 0.8 }, // 80% de los puntos
            { nombre: 'Necesita Mejorar', multiplicador: 0.5 }, // 50% de los puntos
            { nombre: 'Deficiente', multiplicador: 0.1 } // 10% de los puntos
        ]
    },
    {
        id: 2,
        titulo: 'Rúbrica de Reportes de Laboratorio Práctico',
        materia: 'Física General',
        publica: false,
        criterios: [
            { id: 21, nombre: 'Metodología Científica', desc: 'Diseño experimental y registro preciso de pasos.', pts: 35 },
            { id: 22, nombre: 'Gráficas y Análisis de Datos', desc: 'Representación matemática y visual de los resultados.', pts: 35 },
            { id: 23, nombre: 'Conclusiones y Discusión', desc: 'Interpretación de errores y relación teórica.', pts: 30 }
        ],
        escalas: [
            { nombre: 'Excelente', multiplicador: 1.0 },
            { nombre: 'Bien', multiplicador: 0.75 },
            { nombre: 'Regular', multiplicador: 0.5 },
            { nombre: 'Deficiente', multiplicador: 0.2 }
        ]
    },
    {
        id: 3,
        titulo: 'Rúbrica de Exposición Oral y Defensa de Proyecto',
        materia: 'Seminario de Investigación',
        publica: true,
        criterios: [
            { id: 31, nombre: 'Dominio del Tema', desc: 'Habilidad para resolver cuestionamientos técnicos de la terna.', pts: 50 },
            { id: 32, nombre: 'Material de Apoyo Visual', desc: 'Calidad de diapositivas, infografías o maquetas expuestas.', pts: 25 },
            { id: 33, nombre: 'Oratoria y Lenguaje Corporal', desc: 'Tono de voz, postura, vocabulario técnico y manejo del tiempo.', pts: 25 }
        ],
        escalas: [
            { nombre: 'Sobresaliente', multiplicador: 1.0 },
            { nombre: 'Aceptable', multiplicador: 0.8 },
            { nombre: 'Insuficiente', multiplicador: 0.4 }
        ]
    }
];

// ============================================================================
// COMPONENTE BANCO DE RÚBRICAS
// ============================================================================
export default function BancoRubricas() {
    const navigate = useNavigate();
    const location = useLocation();
    const { token } = useAuth();
    
    const cursoRedirect = location.state?.curso || null;

    // -------------------------------------------------------------------------
    // ESTADOS PRINCIPALES
    // -------------------------------------------------------------------------
    const [rubricas, setRubricas] = useState(() => {
        const saved = localStorage.getItem('stitch_banco_rubricas');
        return saved ? JSON.parse(saved) : RUBRICAS_DEMO;
    });

    useEffect(() => {
        localStorage.setItem('stitch_banco_rubricas', JSON.stringify(rubricas));
    }, [rubricas]);
    const [vistaActual, setVistaActual] = useState(cursoRedirect ? 'formulario' : 'catalogo'); 
    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // Filtros del catálogo
    const [busqueda, setBusqueda] = useState('');
    const [filtroMateria, setFiltroMateria] = useState('');

    // Rúbrica seleccionada para visualización/impresión detallada
    const [rubricaSeleccionada, setRubricaSeleccionada] = useState(null);

    // -------------------------------------------------------------------------
    // ESTADO DEL FORMULARIO DINÁMICO
    // -------------------------------------------------------------------------
    const [formId, setFormId] = useState(null); // null = nuevo
    const [formTitulo, setFormTitulo] = useState('');
    const [formMateria, setFormMateria] = useState(cursoRedirect ? cursoRedirect.materia_nombre : '');
    const [formPublica, setFormPublica] = useState(false);
    const [formCriterios, setFormCriterios] = useState([
        { id: 1, nombre: 'Análisis del Tema', desc: 'Aspectos conceptuales.', pts: 50 },
        { id: 2, nombre: 'Redacción', desc: 'Sintaxis y coherencia.', pts: 50 }
    ]);
    const [formEscalas, setFormEscalas] = useState([
        { nombre: 'Excelente', multiplicador: 1.0 },
        { nombre: 'Bueno', multiplicador: 0.8 },
        { nombre: 'Regular', multiplicador: 0.5 },
        { nombre: 'Deficiente', multiplicador: 0.2 }
    ]);

    // -------------------------------------------------------------------------
    // CARGAR CURSOS DEL DOCENTE DESDE LA API
    // -------------------------------------------------------------------------
    const [misCursos, setMisCursos] = useState([]);
    const [formTareaAsociada, setFormTareaAsociada] = useState('mas_adelante');
    const [tareasFiltradas, setTareasFiltradas] = useState([]);

    useEffect(() => {
        const fetchCursos = async () => {
            try {
                const response = await fetch('/api/asistencias/mis-cursos', {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (response.ok) {
                    const data = await response.json();
                    setMisCursos(data);
                }
            } catch (error) {
                console.error("Error al cargar los cursos del docente:", error);
            }
        };
        if (token) {
            fetchCursos();
        }
    }, [token]);

    useEffect(() => {
        if (!formMateria) {
            setTareasFiltradas([]);
            setFormTareaAsociada('mas_adelante');
            return;
        }

        const fetchTareasParaMateria = async () => {
            const cursosDeMateria = misCursos.filter(c => c.materia_nombre === formMateria);
            let apiTareas = [];

            for (const curso of cursosDeMateria) {
                try {
                    const taskResponse = await fetch(`/api/tareas/curso/${curso.id}`, {
                        headers: { 'Authorization': `Bearer ${token}` }
                    });
                    if (taskResponse.ok) {
                        const tasksData = await taskResponse.json();
                        apiTareas = [...apiTareas, ...tasksData];
                    }
                } catch (e) {
                    console.error("Error fetching tasks for course:", e);
                }
            }

            // Fallback si no hay tareas cargadas en BD
            if (apiTareas.length === 0) {
                if (formMateria === 'Matemática Aplicada II') {
                    apiTareas = [
                        { id: 'mat_1', titulo: 'Examen Parcial I' },
                        { id: 'mat_2', titulo: 'Corto #1: Ecuaciones' },
                        { id: 'mat_3', titulo: 'Hoja de Trabajo #1' },
                        { id: 'mat_4', titulo: 'Proyecto Final Trimestre' }
                    ];
                } else if (formMateria === 'Física General') {
                    apiTareas = [
                        { id: 'fis_1', titulo: 'Reporte de Laboratorio #1' },
                        { id: 'fis_2', titulo: 'Corto #2: Dinámica' },
                        { id: 'fis_3', titulo: 'Examen Parcial II' }
                    ];
                } else if (formMateria === 'Seminario de Investigación') {
                    apiTareas = [
                        { id: 'sem_1', titulo: 'Entregable 1: Anteproyecto' },
                        { id: 'sem_2', titulo: 'Presentación de Avance' },
                        { id: 'sem_3', titulo: 'Defensa de Proyecto Final' }
                    ];
                } else {
                    apiTareas = [
                        { id: 'gen_1', titulo: 'Proyecto de Curso' },
                        { id: 'gen_2', titulo: 'Evaluación Corta' }
                    ];
                }
            }

            setTareasFiltradas(apiTareas);
            setFormTareaAsociada('mas_adelante');
        };

        fetchTareasParaMateria();
    }, [formMateria, misCursos, token]);

    // -------------------------------------------------------------------------
    // OPERACIONES DINÁMICAS EN EL FORMULARIO
    // -------------------------------------------------------------------------
    const handleAddCriterio = () => {
        setFormCriterios(prev => [...prev, { id: Date.now(), nombre: '', desc: '', pts: 10 }]);
    };

    const handleRemoveCriterio = (id) => {
        if (formCriterios.length <= 1) {
            setMensaje({ texto: 'Una rúbrica debe tener al menos un criterio de evaluación.', tipo: 'error' });
            return;
        }
        setFormCriterios(prev => prev.filter(c => c.id !== id));
    };

    const handleCriterioChange = (id, campo, valor) => {
        setFormCriterios(prev => prev.map(c => {
            if (c.id === id) {
                const valParsed = campo === 'pts' ? (parseInt(valor) || 0) : valor;
                return { ...c, [campo]: valParsed };
            }
            return c;
        }));
    };

    const handleAddEscala = () => {
        setFormEscalas(prev => [...prev, { nombre: 'Nuevo Nivel', multiplicador: 0.5 }]);
    };

    const handleRemoveEscala = (index) => {
        if (formEscalas.length <= 1) return;
        setFormEscalas(prev => prev.filter((_, i) => i !== index));
    };

    const handleEscalaChange = (index, campo, valor) => {
        setFormEscalas(prev => prev.map((esc, i) => {
            if (i === index) {
                const valParsed = campo === 'multiplicador' ? (parseFloat(valor) || 0) : valor;
                return { ...esc, [campo]: valParsed };
            }
            return esc;
        }));
    };

    // Suma en tiempo real
    const getPuntosTotales = () => {
        return formCriterios.reduce((sum, c) => sum + c.pts, 0);
    };

    const isPonderacionValida = () => {
        return getPuntosTotales() === 100;
    };

    // -------------------------------------------------------------------------
    // HANDLERS DE PERSISTENCIA Y FLUJOS
    // -------------------------------------------------------------------------
    const handleCrearNuevoForm = () => {
        setFormId(null);
        setFormTitulo('');
        setFormMateria('');
        setFormPublica(false);
        setFormCriterios([
            { id: 1, nombre: 'Análisis del Tema', desc: 'Aspectos conceptuales.', pts: 50 },
            { id: 2, nombre: 'Redacción', desc: 'Sintaxis y coherencia.', pts: 50 }
        ]);
        setFormEscalas([
            { nombre: 'Excelente', multiplicador: 1.0 },
            { nombre: 'Bueno', multiplicador: 0.8 },
            { nombre: 'Regular', multiplicador: 0.5 },
            { nombre: 'Deficiente', multiplicador: 0.2 }
        ]);
        setVistaActual('formulario');
        setMensaje({ texto: '', tipo: '' });
    };

    const handleEditar = (rubrica) => {
        setFormId(rubrica.id);
        setFormTitulo(rubrica.titulo);
        setFormMateria(rubrica.materia);
        setFormPublica(rubrica.publica);
        setFormCriterios([...rubrica.criterios]);
        setFormEscalas([...rubrica.escalas]);
        setVistaActual('formulario');
        setMensaje({ texto: '', tipo: '' });
    };

    const handleEliminar = (id) => {
        if (!window.confirm('¿Está seguro de eliminar esta rúbrica del banco permanente?')) return;
        setRubricas(prev => prev.filter(r => r.id !== id));
        setMensaje({ texto: 'Rúbrica eliminada del banco.', tipo: 'exito' });
    };

    const handleClonar = (rubrica) => {
        const clon = {
            ...rubrica,
            id: Date.now(),
            titulo: `${rubrica.titulo} (Copia)`,
            publica: false
        };
        setRubricas(prev => [clon, ...prev]);
        setMensaje({ texto: `Rúbrica duplicada con éxito bajo el nombre "${clon.titulo}".`, tipo: 'exito' });
    };

    const handleGuardar = (e) => {
        e.preventDefault();
        if (!formTitulo.trim() || !formMateria.trim()) {
            setMensaje({ texto: 'Completa los campos obligatorios: Título y Materia.', tipo: 'error' });
            return;
        }

        if (!isPonderacionValida()) {
            setMensaje({ texto: `La suma de los criterios actuales es de ${getPuntosTotales()} pts. Debe ser exactamente igual a 100 pts.`, tipo: 'error' });
            return;
        }

        // TODO: API - Guardar en Backend
        // POST /api/rubricas o PUT /api/rubricas/:id
        
        const rubricaGuardada = {
            id: formId || Date.now(),
            titulo: formTitulo,
            materia: formMateria,
            publica: formPublica,
            criterios: formCriterios,
            escalas: formEscalas
        };

        let msgTexto = 'Rúbrica registrada con éxito.';
        if (formTareaAsociada === 'mas_adelante') {
            msgTexto = `Rúbrica guardada y aplicada a todas las actividades de "${formMateria}".`;
        } else {
            const tareaAsociadaObj = tareasFiltradas.find(t => t.id.toString() === formTareaAsociada.toString());
            msgTexto = `Rúbrica guardada y asociada exitosamente a la tarea "${tareaAsociadaObj?.titulo || 'seleccionada'}".`;
        }

        if (formId) {
            setRubricas(prev => prev.map(r => r.id === formId ? rubricaGuardada : r));
            setMensaje({ texto: msgTexto, tipo: 'exito' });
        } else {
            setRubricas(prev => [rubricaGuardada, ...prev]);
            setMensaje({ texto: msgTexto, tipo: 'exito' });
        }

        setVistaActual('catalogo');
    };

    const handleImprimir = () => {
        window.print();
    };

    // -------------------------------------------------------------------------
    // FILTROS APLICADOS
    // -------------------------------------------------------------------------
    const rubricasFiltradas = rubricas.filter(r => {
        const coincideTitulo = r.titulo.toLowerCase().includes(busqueda.toLowerCase());
        const coincideMateria = !filtroMateria || r.materia === filtroMateria;
        return coincideTitulo && coincideMateria;
    });

    const materiasDisponibles = Array.from(new Set(rubricas.map(r => r.materia)));

    return (
        <div style={{ fontFamily: 'var(--stitch-font)', padding: '4px' }} className="no-print">
            
            {/* CSS de Impresión Dedicado para Aislar la Rúbrica */}
            <style dangerouslySetInnerHTML={{__html: `
                @media print {
                    body {
                        background-color: #FFFFFF !important;
                        color: #000000 !important;
                    }
                    .no-print {
                        display: none !important;
                    }
                    .print-rubric-area {
                        display: block !important;
                        width: 100% !important;
                        padding: 10px !important;
                    }
                    .print-rubric-table {
                        width: 100% !important;
                        border-collapse: collapse !important;
                        margin-top: 18px !important;
                    }
                    .print-rubric-table th, .print-rubric-table td {
                        border: 1px solid #475569 !important;
                        padding: 8px 12px !important;
                        text-align: left !important;
                        font-size: 12px !important;
                    }
                    .print-rubric-table th {
                        background-color: #F1F5F9 !important;
                        font-weight: bold !important;
                    }
                }
            `}} />

            {/* ── CABECERA ─────────────────────────────────────────────────── */}
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
                <div style={{ position: 'absolute', right: '-20px', bottom: '-45px', fontSize: '190px', color: 'rgba(255,255,255,0.04)', fontFamily: 'Material Icons Outlined', userSelect: 'none', pointerEvents: 'none' }}>
                    assessment
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', color: 'rgba(255, 255, 255, 0.7)', fontWeight: '700' }}>
                        Plantillas Reutilizables
                    </span>
                    <h2 style={{ color: '#FFFFFF', fontWeight: '800', margin: '4px 0 0 0', fontSize: '24px', fontFamily: 'Outfit, sans-serif' }}>
                        Banco de Rúbricas
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px', margin: '4px 0 0 0' }}>
                        Diseña criterios e indicadores de logro estandarizados para tus cursos.
                    </p>
                </div>
                {vistaActual === 'formulario' && (
                    <button
                        onClick={() => setVistaActual('catalogo')}
                        className="stitch-transition"
                        style={{
                            position: 'relative', zIndex: 1,
                            padding: '10px 18px',
                            borderRadius: 'var(--stitch-radius-sm)',
                            border: '1.5px solid rgba(255,255,255,0.3)',
                            backgroundColor: 'rgba(255,255,255,0.1)',
                            color: '#FFFFFF',
                            cursor: 'pointer',
                            fontWeight: '600',
                            fontSize: '13px',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            backdropFilter: 'blur(8px)',
                        }}
                    >
                        <span className="material-icons-outlined" style={{ fontSize: '18px' }}>arrow_back</span>
                        Volver al Catálogo
                    </button>
                )}
            </div>

            {/* ── ALERTA DE MENSAJES ────────────────────────────────────────── */}
            {mensaje.texto && (
                <div className={`stitch-alert ${mensaje.tipo === 'exito' ? 'stitch-alert-success' : 'stitch-alert-danger'}`} style={{ marginBottom: '20px' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '19px' }}>
                        {mensaje.tipo === 'exito' ? 'check_circle' : 'error_outline'}
                    </span>
                    <span style={{ flex: 1 }}>{mensaje.texto}</span>
                    <button onClick={() => setMensaje({ texto: '', tipo: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'inherit', lineHeight: 1 }}>×</button>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────────
                SECCIÓN A: CATÁLOGO DE RÚBRICAS
            ──────────────────────────────────────────────────────────────── */}
            {vistaActual === 'catalogo' && (
                <div className="no-print">
                    
                    {/* Barra de Filtros */}
                    <div className="stitch-card" style={{ padding: '20px', marginBottom: '28px', backgroundColor: '#FFFFFF' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div style={{ display: 'flex', gap: '12px', flex: 1, minWidth: '300px', flexWrap: 'wrap' }}>
                                <div style={{ flex: 1, minWidth: '200px' }}>
                                    <div className="stitch-search-wrapper">
                                        <span className="material-icons-outlined stitch-search-icon">search</span>
                                        <input
                                            type="text"
                                            placeholder="Buscar rúbrica por título..."
                                            value={busqueda}
                                            onChange={e => setBusqueda(e.target.value)}
                                            className="stitch-input stitch-search-input"
                                        />
                                    </div>
                                </div>
                                <div style={{ flex: 1, minWidth: '180px' }}>
                                    <select
                                        value={filtroMateria}
                                        onChange={e => setFiltroMateria(e.target.value)}
                                        className="stitch-select"
                                    >
                                        <option value="">— Todas las materias —</option>
                                        {materiasDisponibles.map(m => (
                                            <option key={m} value={m}>{m}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button onClick={handleCrearNuevoForm} className="stitch-button">
                                <span className="material-icons-outlined">add_circle</span>
                                Diseñar Nueva Rúbrica
                            </button>
                        </div>
                    </div>

                    {/* Catálogo de Tarjetas */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
                        {rubricasFiltradas.length === 0 ? (
                            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: 'var(--stitch-text-secondary)' }}>
                                <span className="material-icons-outlined" style={{ fontSize: '48px', display: 'block', marginBottom: '12px' }}>assessment</span>
                                No se encontraron plantillas de rúbricas guardadas.
                            </div>
                        ) : (
                            rubricasFiltradas.map(rub => (
                                <div key={rub.id} className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: '220px' }}>
                                    <div>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                            <span className="stitch-badge stitch-badge-info">
                                                {rub.materia}
                                            </span>
                                            <span className={`stitch-badge ${rub.publica ? 'stitch-badge-success' : 'stitch-badge-neutral'}`}>
                                                <span className="material-icons-outlined" style={{ fontSize: '13px', marginRight: '2px' }}>
                                                    {rub.publica ? 'public' : 'lock_outline'}
                                                </span>
                                                {rub.publica ? 'Pública' : 'Privada'}
                                            </span>
                                        </div>

                                        <h4 className="stitch-title-font" style={{ margin: '0 0 12px 0', fontSize: '16px', fontWeight: '800', color: 'var(--stitch-primary)', lineHeight: '1.4' }}>
                                            {rub.titulo}
                                        </h4>

                                        <div style={{ display: 'flex', gap: '16px', fontSize: '12px', color: 'var(--stitch-text-secondary)', marginBottom: '20px' }}>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <span className="material-icons-outlined" style={{ fontSize: '15px' }}>format_list_bulleted</span>
                                                {rub.criterios.length} criterios
                                            </span>
                                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                                <span className="material-icons-outlined" style={{ fontSize: '15px' }}>military_tech</span>
                                                {rub.escalas.length} niveles
                                            </span>
                                        </div>
                                    </div>

                                    {/* Acciones */}
                                    <div style={{ display: 'flex', gap: '8px', borderTop: '1px solid var(--stitch-border)', paddingTop: '16px', flexWrap: 'wrap' }}>
                                        <button
                                            onClick={() => setRubricaSeleccionada(rub)}
                                            className="stitch-button-secondary"
                                            style={{ flex: 1, padding: '8px 12px', fontSize: '12px', justifyContent: 'center' }}
                                        >
                                            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>visibility</span>
                                            Ver
                                        </button>
                                        <button
                                            onClick={() => handleEditar(rub)}
                                            className="stitch-button-secondary"
                                            style={{ flex: 1, padding: '8px 12px', fontSize: '12px', justifyContent: 'center', color: 'var(--stitch-secondary)' }}
                                        >
                                            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>edit</span>
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => handleClonar(rub)}
                                            className="stitch-button-secondary"
                                            style={{ flex: 1, padding: '8px 12px', fontSize: '12px', justifyContent: 'center', color: 'var(--stitch-success)' }}
                                        >
                                            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>content_copy</span>
                                            Clonar
                                        </button>
                                        <button
                                            onClick={() => handleEliminar(rub.id)}
                                            className="stitch-button-secondary"
                                            style={{ padding: '8px 12px', backgroundColor: '#FFF5F5', border: '1px solid #FECACA', color: 'var(--stitch-danger)', justifyContent: 'center' }}
                                        >
                                            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────────
                SECCIÓN B: FORMULARIO CREADOR / EDITOR DINÁMICO
            ──────────────────────────────────────────────────────────────── */}
            {vistaActual === 'formulario' && (
                <form onSubmit={handleGuardar} className="no-print">
                    
                    {/* Bloque superior: Datos Básicos */}
                    <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', marginBottom: '28px' }}>
                        <h3 className="stitch-title-font" style={{ margin: '0 0 18px 0', color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '16px' }}>
                            {formId ? 'Modificar Parámetros de Rúbrica' : 'Especificaciones Iniciales'}
                        </h3>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', alignItems: 'end' }}>
                            <div>
                                <label className="stitch-label">Título de la Rúbrica *</label>
                                <input
                                    type="text"
                                    required
                                    value={formTitulo}
                                    onChange={e => setFormTitulo(e.target.value)}
                                    className="stitch-input"
                                    placeholder="Ej: Ensayo Científico Trimestral"
                                />
                            </div>
                            <div>
                                <label className="stitch-label">Materia / Curso Vinculado *</label>
                                <select
                                    required
                                    value={formMateria}
                                    onChange={e => setFormMateria(e.target.value)}
                                    className="stitch-select"
                                    style={{ width: '100%' }}
                                >
                                    <option value="">— Seleccionar Materia —</option>
                                    {misCursos.length === 0 ? (
                                        <>
                                            <option value="Matemática Aplicada II">Matemática Aplicada II</option>
                                            <option value="Física General">Física General</option>
                                            <option value="Seminario de Investigación">Seminario de Investigación</option>
                                        </>
                                    ) : (
                                        // Agrupar por nombre de materia único para evitar duplicados
                                        Array.from(new Set(misCursos.map(c => c.materia_nombre))).map(materia => (
                                            <option key={materia} value={materia}>
                                                {materia}
                                            </option>
                                        ))
                                    )}
                                </select>
                            </div>
                            
                            <div>
                                <label className="stitch-label">Implementar a tarea (Es opcional)</label>
                                <select
                                    value={formTareaAsociada}
                                    onChange={e => setFormTareaAsociada(e.target.value)}
                                    className="stitch-select"
                                    style={{ width: '100%' }}
                                    disabled={!formMateria}
                                >
                                    <option value="mas_adelante">Implementar a todas</option>
                                    {tareasFiltradas.map(t => (
                                        <option key={t.id} value={t.id}>
                                            {t.titulo}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            {/* <div style={{ paddingBottom: '10px' }}>
                                <label className="stitch-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', margin: 0 }}>
                                    <input
                                        type="checkbox"
                                        checked={formPublica}
                                        onChange={e => setFormPublica(e.target.checked)}
                                        style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                                    />
                                    Compartir como "Pública" en el Colegio
                                </label>
                            </div> */}
                        </div>
                    </div>

                    {/* Bloque Central: Niveles de Logro (Columnas) */}
                    <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', marginBottom: '28px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '10px' }}>
                            <h3 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="material-icons-outlined">view_column</span>
                                Columnas de Niveles de Desempeño
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddEscala}
                                className="stitch-button-secondary"
                                style={{ padding: '6px 12px', borderStyle: 'dashed', fontSize: '12px' }}
                            >
                                + Agregar Nivel
                            </button>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '16px' }}>
                            {formEscalas.map((esc, idx) => (
                                <div key={idx} style={{ backgroundColor: '#F8FAFC', padding: '14px', borderRadius: '6px', border: '1px solid var(--stitch-border)', position: 'relative' }}>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveEscala(idx)}
                                        style={{ position: 'absolute', top: '6px', right: '6px', border: 'none', background: 'none', color: 'var(--stitch-danger)', cursor: 'pointer', fontSize: '18px', fontWeight: 'bold' }}
                                    >
                                        ×
                                    </button>
                                    <div style={{ marginBottom: '8px' }}>
                                        <label className="stitch-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Nivel</label>
                                        <input
                                            type="text"
                                            required
                                            value={esc.nombre}
                                            onChange={e => handleEscalaChange(idx, 'nombre', e.target.value)}
                                            className="stitch-input"
                                            style={{ padding: '6px 8px', fontSize: '13px' }}
                                            placeholder="Excelente..."
                                        />
                                    </div>
                                    <div>
                                        <label className="stitch-label" style={{ fontSize: '11px', marginBottom: '4px' }}>Multiplicador (0.0 a 1.0)</label>
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={esc.multiplicador}
                                            onChange={e => handleEscalaChange(idx, 'multiplicador', e.target.value)}
                                            className="stitch-input"
                                            style={{ padding: '6px 8px', fontSize: '13px', textAlign: 'center' }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Bloque Creador: Criterios e Inserción Dinámica (Filas) */}
                    <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', marginBottom: '28px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '10px' }}>
                            <h3 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                                <span className="material-icons-outlined">format_list_bulleted</span>
                                Filas de Criterios de Evaluación
                            </h3>
                            <button
                                type="button"
                                onClick={handleAddCriterio}
                                className="stitch-button-secondary"
                                style={{ padding: '6px 12px', borderStyle: 'dashed', fontSize: '12px' }}
                            >
                                + Agregar Criterio
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            {formCriterios.map((crit, idx) => (
                                <div key={crit.id} style={{ display: 'grid', gridTemplateColumns: '1fr 2fr 120px 50px', gap: '16px', alignItems: 'center', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '16px' }}>
                                    <div>
                                        <label className="stitch-label">Criterio #{idx + 1}</label>
                                        <input
                                            type="text"
                                            required
                                            value={crit.nombre}
                                            onChange={e => handleCriterioChange(crit.id, 'nombre', e.target.value)}
                                            className="stitch-input"
                                            placeholder="Título (Ej: Redacción)"
                                        />
                                    </div>
                                    <div>
                                        <label className="stitch-label">Descripción / Aspecto a Evaluar</label>
                                        <input
                                            type="text"
                                            required
                                            value={crit.desc}
                                            onChange={e => handleCriterioChange(crit.id, 'desc', e.target.value)}
                                            className="stitch-input"
                                            placeholder="Qué se evaluará..."
                                        />
                                    </div>
                                    <div>
                                        <label className="stitch-label">Ponderación Max</label>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                max="100"
                                                value={crit.pts}
                                                onChange={e => handleCriterioChange(crit.id, 'pts', e.target.value)}
                                                className="stitch-input"
                                                style={{ textAlign: 'center' }}
                                            />
                                            <span style={{ fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-secondary)' }}>pts</span>
                                        </div>
                                    </div>
                                    <div style={{ textAlign: 'center', paddingTop: '20px' }}>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveCriterio(crit.id)}
                                            className="stitch-button-secondary"
                                            style={{ padding: '8px', backgroundColor: '#FFF5F5', border: '1px solid #FECACA', color: 'var(--stitch-danger)', justifyContent: 'center' }}
                                        >
                                            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Barra de Validación y Sumatoria en Tiempo Real */}
                        <div className={`stitch-alert ${isPonderacionValida() ? 'stitch-alert-success' : 'stitch-alert-danger'}`} style={{ marginTop: '24px', justifyContent: 'space-between' }}>
                            <div>
                                <span style={{ fontSize: '13px', fontWeight: '700' }}>
                                    {isPonderacionValida() 
                                        ? '✓ Sumatoria correcta: El puntaje total de los criterios suma exactamente 100 pts.' 
                                        : `✗ Inconsistencia: El total actual es de ${getPuntosTotales()} pts. Debe sumar exactamente 100 pts.`
                                    }
                                </span>
                            </div>
                            <div style={{ fontSize: '18px', fontWeight: '800' }}>
                                {getPuntosTotales()} / 100 pts
                            </div>
                        </div>
                    </div>

                    {/* Botones de Envío */}
                    <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px', marginBottom: '40px' }}>
                        <button
                            type="button"
                            onClick={() => setVistaActual('catalogo')}
                            className="stitch-button-secondary"
                            style={{ padding: '12px 24px', fontSize: '14px' }}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="stitch-button"
                            style={{ padding: '12px 28px', fontSize: '14px' }}
                        >
                            <span className="material-icons-outlined">save</span>
                            {formId ? 'Guardar Cambios' : 'Registrar Rúbrica'}
                        </button>
                    </div>

                </form>
            )}

            {/* ── MODAL DETALLADO PARA VISUALIZACIÓN / IMPRESIÓN ─────────────── */}
            {rubricaSeleccionada && (
                <div className="stitch-modal-backdrop">
                    <div className="stitch-modal-content" style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', padding: 0 }}>
                        
                        {/* Cabecera Modal */}
                        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'var(--stitch-primary)', color: '#FFFFFF', borderTopLeftRadius: 'var(--stitch-radius-lg)', borderTopRightRadius: 'var(--stitch-radius-lg)' }}>
                            <div>
                                <h3 className="stitch-title-font" style={{ margin: 0, fontSize: '18px', fontWeight: '800' }}>Matriz de Evaluación Oficial</h3>
                                <div style={{ fontSize: '12px', color: '#93C5FD', marginTop: '2px' }}>
                                    Materia: {rubricaSeleccionada.materia}
                                </div>
                            </div>
                            <button
                                onClick={() => setRubricaSeleccionada(null)}
                                style={{ background: 'none', border: 'none', color: '#FFFFFF', fontSize: '24px', cursor: 'pointer' }}
                            >
                                ×
                            </button>
                        </div>

                        {/* Contenido / Matriz */}
                        <div style={{ padding: '24px', flex: 1, overflowY: 'auto' }}>
                            <h4 className="stitch-title-font" style={{ margin: '0 0 16px 0', color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '18px' }}>
                                {rubricaSeleccionada.titulo}
                            </h4>

                            <table className="stitch-table" style={{ marginTop: '10px' }}>
                                <thead>
                                    <tr>
                                        <th className="stitch-th" style={{ width: '25%' }}>Criterio</th>
                                        {rubricaSeleccionada.escalas.map(esc => (
                                            <th key={esc.nombre} className="stitch-th" style={{ textAlign: 'center' }}>
                                                {esc.nombre} <br />
                                                <small style={{ color: 'var(--stitch-text-secondary)', fontWeight: '500' }}>({esc.multiplicador * 100}%)</small>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {rubricaSeleccionada.criterios.map(crit => (
                                        <tr key={crit.id} className="stitch-tr-hover">
                                            <td className="stitch-td">
                                                <div style={{ fontWeight: '700', color: 'var(--stitch-text-primary)' }}>{crit.nombre}</div>
                                                <div style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)', marginTop: '4px' }}>{crit.desc}</div>
                                                <div style={{ fontSize: '11px', fontWeight: '700', color: 'var(--stitch-primary)', marginTop: '4px' }}>Valor: {crit.pts} pts</div>
                                            </td>
                                            {rubricaSeleccionada.escalas.map(esc => (
                                                <td key={esc.nombre} className="stitch-td" style={{ textAlign: 'center', backgroundColor: 'rgba(248, 250, 252, 0.5)', borderLeft: '1px solid var(--stitch-border)' }}>
                                                    <span style={{ fontWeight: '800', color: 'var(--stitch-primary)', fontSize: '14px' }}>
                                                        {(crit.pts * esc.multiplicador).toFixed(1)}
                                                    </span>
                                                    <span style={{ fontSize: '10px', color: 'var(--stitch-text-secondary)', fontWeight: '500' }}> pts</span>
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Pie del modal con acciones */}
                        <div style={{ padding: '20px 24px', borderTop: '1px solid var(--stitch-border)', backgroundColor: '#F8FAFC', display: 'flex', justifyContent: 'flex-end', gap: '12px', borderBottomLeftRadius: 'var(--stitch-radius-lg)', borderBottomRightRadius: 'var(--stitch-radius-lg)' }}>
                            {/* <button
                                onClick={handleImprimir}
                                className="stitch-button"
                                style={{ backgroundColor: '#10B981', display: 'flex', alignItems: 'center', gap: '6px' }}
                            >
                                <span className="material-icons-outlined">print</span>
                                Guardar / Imprimir Rúbrica
                            </button> */}
                            <button
                                onClick={() => setRubricaSeleccionada(null)}
                                className="stitch-button-secondary"
                            >
                                Cerrar
                            </button>
                        </div>

                    </div>
                </div>
            )}

            {/* ── ÁREA DE IMPRESIÓN EXCLUSIVA (OCULTO EN LA INTERFAZ) ── */}
            {rubricaSeleccionada && (
                <div style={{ display: 'none' }} className="print-rubric-area">
                    <div style={{ borderBottom: '2.5px solid #0F172A', paddingBottom: '10px', marginBottom: '20px', textAlign: 'center' }}>
                        <h2 style={{ margin: '0 0 6px 0', fontSize: '18px' }}>RÚBRICA DE EVALUACIÓN ACADÉMICA OFICIAL</h2>
                        <h3 style={{ margin: '0 0 4px 0', fontSize: '14px', color: '#334155' }}>Tema: {rubricaSeleccionada.titulo}</h3>
                        <p style={{ margin: 0, fontSize: '12px', color: '#64748B' }}>Materia: {rubricaSeleccionada.materia} | Total Ponderación Rúbrica: 100 Pts</p>
                    </div>

                    <table className="print-rubric-table">
                        <thead>
                            <tr>
                                <th style={{ width: '30%' }}>Aspecto / Criterio</th>
                                {rubricaSeleccionada.escalas.map(esc => (
                                    <th key={esc.nombre} style={{ textAlign: 'center' }}>
                                        {esc.nombre} <br />
                                        <small style={{ fontWeight: 'normal' }}>({esc.multiplicador * 100}%)</small>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {rubricaSeleccionada.criterios.map(crit => (
                                <tr key={crit.id}>
                                    <td>
                                        <strong>{crit.nombre}</strong><br />
                                        <small style={{ color: '#475569' }}>{crit.desc}</small><br />
                                        <strong>Valor: {crit.pts} pts</strong>
                                    </td>
                                    {rubricaSeleccionada.escalas.map(esc => (
                                        <td key={esc.nombre} style={{ textAlign: 'center' }}>
                                            <strong>{(crit.pts * esc.multiplicador).toFixed(1)} Pts</strong>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────────
                ESTRUCTURA DE MODELO DE DATOS RECOMENDADA (DOCUMENTACIÓN DE BD)
            ────────────────────────────────────────────────────────────────
                * SQL Relacional:
                  - Tabla: rubricas (id, titulo, materia, profesor_id, publica, created_at)
                  - Tabla: rubricas_criterios (id, rubrica_id, nombre, descripcion, puntos_maximo)
                  - Tabla: rubricas_escalas (id, rubrica_id, nombre, multiplicador_porcentaje)
                
                * NoSQL (MongoDB):
                  - Colección: rubricas
                  - Esquema:
                    {
                        _id: ObjectId,
                        profesor_id: ObjectId,
                        titulo: String,
                        materia: String,
                        publica: Boolean,
                        criterios: [
                            { nombre: String, desc: String, pts: Number }
                        ],
                        escalas: [
                            { nombre: String, multiplicador: Number }
                        ],
                        created_at: Date
                    }
            ──────────────────────────────────────────────────────────────── */}
        </div>
    );
}

const labelStyle = {
    display: 'block',
    fontSize: '12px',
    fontWeight: '700',
    color: 'var(--stitch-text-primary)',
    marginBottom: '6px'
};

const inputStyle = {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '6px',
    border: '1px solid var(--stitch-border)',
    fontSize: '14px',
    color: 'var(--stitch-text-primary)',
    outline: 'none',
    boxSizing: 'border-box',
    fontFamily: 'var(--stitch-font)'
};

const selectStyle = {
    ...inputStyle,
    cursor: 'pointer'
};
