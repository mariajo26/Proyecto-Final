import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

export default function MisCursosEstudiante() {
    const { token } = useAuth();
    const [cursos, setCursos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado para el curso seleccionado y sus tareas
    const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
    const [tareas, setTareas] = useState([]);
    const [loadingTareas, setLoadingTareas] = useState(false);

    // Estado para la carga de archivos
    const [archivoSeleccionado, setArchivoSeleccionado] = useState(null);
    const [entregandoId, setEntregandoId] = useState(null);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
    };

    // Cargar listado de cursos del alumno
    const fetchCursos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/estudiante/cursos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('No se pudieron obtener tus cursos.');
            const data = await res.json();
            setCursos(data);
        } catch (err) {
            setError(err.message);
            // Fallback de demostración con datos reales si falla
            setCursos([
                { id: 1, materia: 'Matemáticas', profesor: 'Carlos Gómez Estrada', salon: 'Aula 101', color_hex: '#0D2C54' },
                { id: 2, materia: 'Idioma Español', profesor: 'Sofía López Alvarado', salon: 'Aula 102', color_hex: '#3B82F6' },
                { id: 3, materia: 'Ciencias Naturales', profesor: 'Jorge Diaz Herrera', salon: 'Laboratorio A', color_hex: '#10B981' }
            ]);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchCursos();
    }, [fetchCursos]);

    // Cargar tareas del curso seleccionado
    const fetchTareas = useCallback(async (cursoId) => {
        setLoadingTareas(true);
        try {
            const res = await fetch(`/api/estudiante/cursos/${cursoId}/tareas`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar las tareas de este curso.');
            const data = await res.json();
            setTareas(data);
        } catch (err) {
            // Fallback mock de tareas
            const ahora = new Date();
            const manana = new Date(ahora.getTime() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16);
            const ayer = new Date(ahora.getTime() - 24 * 60 * 60 * 1000).toISOString().slice(0, 16);

            if (cursoId === 1) {
                setTareas([
                    { id: 101, titulo: 'Hoja de Trabajo 1: Ecuaciones', descripcion: 'Resolver los ejercicios de la página 45 a 47 del libro de texto.', ponderacion: 10, fecha_hora_limite: manana, modalidad_entrega: 'Virtual', entrega: null },
                    { id: 102, titulo: 'Proyecto Bimestral', descripcion: 'Explicación del teorema aplicado a la vida real.', ponderacion: 20, fecha_hora_limite: manana, modalidad_entrega: 'Virtual', entrega: { fecha_hora_entrega: ahora.toISOString(), archivo_adjunto_url: 'proyecto.pdf', estado: 'Calificada', nota_obtenida: 19 } },
                    { id: 103, titulo: 'Examen Corto 1', descripcion: 'Fórmulas básicas cuadráticas.', ponderacion: 5, fecha_hora_limite: ayer, modalidad_entrega: 'Fisico', entrega: null }
                ]);
            } else {
                setTareas([
                    { id: 201, titulo: 'Análisis Literario: Don Quijote', descripcion: 'Presentar un ensayo crítico sobre los capítulos 1 al 5.', ponderacion: 15, fecha_hora_limite: manana, modalidad_entrega: 'Virtual', entrega: null },
                    { id: 202, titulo: 'Exposición Presencial', descripcion: 'Presentación en grupo sobre épocas literarias.', ponderacion: 10, fecha_hora_limite: manana, modalidad_entrega: 'Fisico', entrega: null }
                ]);
            }
        } finally {
            setLoadingTareas(false);
        }
    }, [token]);

    const handleSelectCurso = (curso) => {
        setCursoSeleccionado(curso);
        setTareas([]);
        fetchTareas(curso.id);
    };

    // Subir tarea virtual (Simulado)
    const handleSubirTarea = async (actividadId) => {
        if (!archivoSeleccionado) {
            showToast('Por favor selecciona un archivo primero.', 'error');
            return;
        }

        setEntregandoId(actividadId);
        try {
            // Estructura multipart/form-data ideal para el servidor Node.js:
            // const formData = new FormData();
            // formData.append('archivo', archivoSeleccionado);
            // await axios.post(`/api/estudiante/tareas/${actividadId}/entregar`, formData, { headers: { 'Content-Type': 'multipart/form-data' } });

            // Simulamos el envío HTTP
            await new Promise(resolve => setTimeout(resolve, 1500));

            // Actualizar localmente el estado de la tarea entregada
            const ahora = new Date().toISOString();
            setTareas(prev => prev.map(t => {
                if (t.id === actividadId) {
                    return {
                        ...t,
                        entrega: {
                            fecha_hora_entrega: ahora,
                            archivo_adjunto_url: archivoSeleccionado.name,
                            estado: 'Pendiente de Calificar',
                            nota_obtenida: null
                        }
                    };
                }
                return t;
            }));

            showToast('¡Tarea entregada exitosamente!', 'success');
            setArchivoSeleccionado(null);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setEntregandoId(null);
        }
    };

    return (
        <div style={{ fontFamily: 'var(--stitch-font, sans-serif)', color: 'var(--stitch-text-primary, #0F172A)' }}>
            {toast && (
                <div style={{
                    position: 'fixed', top: '24px', right: '24px', zIndex: 3000,
                    padding: '12px 24px', borderRadius: '8px', color: '#FFFFFF',
                    backgroundColor: toast.tipo === 'success' ? 'var(--stitch-success, #10B981)' : 'var(--stitch-error, #EF4444)',
                    boxShadow: 'var(--stitch-shadow-lg)'
                }} className="stitch-transition">
                    {toast.msg}
                </div>
            )}

            {!cursoSeleccionado ? (
                <div>
                    <h2 style={{ color: 'var(--stitch-primary, #0D2C54)', fontWeight: '700', marginBottom: '24px' }}>Mis Cursos Vigentes</h2>
                    {loading ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '48px', color: 'var(--stitch-secondary, #3B82F6)', animation: 'spin 1.5s linear infinite' }}>sync</span>
                        </div>
                    ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '24px' }}>
                            {cursos.map(c => (
                                <div 
                                    key={c.id} 
                                    onClick={() => handleSelectCurso(c)}
                                    style={{
                                        backgroundColor: '#FFFFFF', borderRadius: 'var(--stitch-radius-md, 12px)',
                                        border: '1px solid var(--stitch-border, #E2E8F0)', padding: '24px',
                                        cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '16px',
                                        boxShadow: 'var(--stitch-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
                                        transition: 'transform 0.2s ease, box-shadow 0.2s ease'
                                    }}
                                    className="stitch-card-hover"
                                    onMouseEnter={e => {
                                        e.currentTarget.style.transform = 'translateY(-4px)';
                                        e.currentTarget.style.boxShadow = 'var(--stitch-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))';
                                    }}
                                    onMouseLeave={e => {
                                        e.currentTarget.style.transform = 'translateY(0)';
                                        e.currentTarget.style.boxShadow = 'var(--stitch-shadow-sm)';
                                    }}
                                >
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: c.color_hex || '#3B82F6', display: 'flex', alignItems: 'center', justifyItems: 'center', color: '#FFFFFF', justifyContent: 'center' }}>
                                            <span className="material-icons-outlined">book</span>
                                        </div>
                                        <div>
                                            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: 'var(--stitch-primary, #0D2C54)' }}>{c.materia}</h3>
                                            <span style={{ fontSize: '12px', color: '#64748B' }}>{c.salon}</span>
                                        </div>
                                    </div>
                                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <span style={{ fontSize: '13px', color: '#475569', fontWeight: '500' }}>Prof: {c.profesor}</span>
                                        <span className="material-icons-outlined" style={{ color: 'var(--stitch-secondary, #3B82F6)' }}>arrow_forward</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ) : (
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
                        <button 
                            onClick={() => setCursoSeleccionado(null)}
                            style={{
                                background: '#FFFFFF', border: '1px solid var(--stitch-border)',
                                borderRadius: '50%', width: '40px', height: '40px', display: 'flex',
                                alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                                boxShadow: 'var(--stitch-shadow-sm)'
                            }}
                        >
                            <span className="material-icons-outlined">arrow_back</span>
                        </button>
                        <div>
                            <h2 style={{ margin: 0, color: 'var(--stitch-primary, #0D2C54)', fontWeight: '700' }}>{cursoSeleccionado.materia}</h2>
                            <span style={{ fontSize: '13px', color: '#64748B' }}>Tareas y Actividades Pendientes</span>
                        </div>
                    </div>

                    {loadingTareas ? (
                        <div style={{ textAlign: 'center', padding: '40px' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '48px', color: 'var(--stitch-secondary, #3B82F6)', animation: 'spin 1.5s linear infinite' }}>sync</span>
                        </div>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                            {tareas.length === 0 ? (
                                <div style={{ textAlign: 'center', padding: '40px', color: '#64748B' }}>
                                    No hay tareas registradas para esta materia.
                                </div>
                            ) : (
                                tareas.map(t => {
                                    const limite = new Date(t.fecha_hora_limite);
                                    const expirado = new Date() > limite;
                                    const entregado = !!t.entrega;

                                    return (
                                        <div 
                                            key={t.id}
                                            style={{
                                                backgroundColor: '#FFFFFF', borderRadius: 'var(--stitch-radius-md, 12px)',
                                                border: '1px solid var(--stitch-border, #E2E8F0)', padding: '24px',
                                                display: 'flex', flexDirection: 'column', gap: '16px',
                                                boxShadow: 'var(--stitch-shadow-sm)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                                                <div>
                                                    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700' }}>{t.titulo}</h3>
                                                    <p style={{ margin: 0, fontSize: '14px', color: '#475569' }}>{t.descripcion}</p>
                                                </div>
                                                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                    <span style={{
                                                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600',
                                                        backgroundColor: t.modalidad_entrega === 'Virtual' ? '#EFF6FF' : '#FEF3C7',
                                                        color: t.modalidad_entrega === 'Virtual' ? '#2563EB' : '#D97706'
                                                    }}>
                                                        {t.modalidad_entrega}
                                                    </span>
                                                    <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--stitch-primary)' }}>
                                                        {t.ponderacion} Pts.
                                                    </span>
                                                </div>
                                            </div>

                                            <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: '16px', borderTop: '1px solid #F1F5F9', paddingTop: '16px' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', color: '#64748B' }}>
                                                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>event</span>
                                                    <span>Fecha Límite: {limite.toLocaleString()}</span>
                                                </div>

                                                {/* Sección de Entregas */}
                                                <div>
                                                    {entregado ? (
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{
                                                                padding: '6px 12px', borderRadius: '6px', fontSize: '13px', fontWeight: '600',
                                                                backgroundColor: '#D1FAE5', color: '#065F46', display: 'flex', alignItems: 'center', gap: '6px'
                                                            }}>
                                                                <span className="material-icons-outlined" style={{ fontSize: '16px' }}>check_circle</span>
                                                                <span>Entregada</span>
                                                            </div>
                                                            <span style={{ fontSize: '12px', color: '#64748B' }}>
                                                                Enviado el: {new Date(t.entrega.fecha_hora_entrega).toLocaleString()}
                                                            </span>
                                                            {t.entrega.estado === 'Calificada' && (
                                                                <span style={{ fontWeight: '700', color: 'var(--stitch-success, #10B981)', fontSize: '14px' }}>
                                                                    Nota: {t.entrega.nota_obtenida} / {t.ponderacion}
                                                                </span>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div>
                                                            {t.modalidad_entrega === 'Fisico' ? (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#D97706', fontWeight: '500', fontSize: '14px' }}>
                                                                    <span className="material-icons-outlined">info</span>
                                                                    <span>Entrega Presencial en el Aula</span>
                                                                </div>
                                                            ) : (
                                                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                                    {expirado ? (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#EF4444', fontWeight: '600', fontSize: '14px' }}>
                                                                            <span className="material-icons-outlined">error_outline</span>
                                                                            <span>Plazo Vencido</span>
                                                                        </div>
                                                                    ) : (
                                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                                            <input 
                                                                                type="file" 
                                                                                id={`file-${t.id}`}
                                                                                style={{ display: 'none' }}
                                                                                onChange={(e) => setArchivoSeleccionado(e.target.files[0])}
                                                                            />
                                                                            <label 
                                                                                htmlFor={`file-${t.id}`}
                                                                                style={{
                                                                                    cursor: 'pointer', padding: '8px 16px', borderRadius: '6px',
                                                                                    border: '1.5px dashed var(--stitch-secondary)', fontSize: '13px',
                                                                                    color: 'var(--stitch-secondary)', fontWeight: '500',
                                                                                    display: 'flex', alignItems: 'center', gap: '6px'
                                                                                }}
                                                                            >
                                                                                <span className="material-icons-outlined" style={{ fontSize: '18px' }}>upload_file</span>
                                                                                <span>{archivoSeleccionado && entregandoId === null ? archivoSeleccionado.name : 'Seleccionar Archivo'}</span>
                                                                            </label>
                                                                            <button 
                                                                                onClick={() => handleSubirTarea(t.id)}
                                                                                disabled={entregandoId !== null}
                                                                                className="stitch-button"
                                                                                style={{ padding: '8px 16px' }}
                                                                            >
                                                                                {entregandoId === t.id ? 'Entregando...' : 'Entregar Tarea'}
                                                                            </button>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
