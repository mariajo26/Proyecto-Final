import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import CourseCard from "./CourseCard";
import PeriodAttendance from "./PeriodAttendance";
import "../../styles/StTheme.css";

// ----------------------------------------------------------------------------
// COMPONENTE: VISTA DE MIS CURSOS ASIGNADOS (CARGA DINAMICA - VISTA DOCENTE)
// Consume los endpoints:
//   GET /api/asistencias/mis-cursos         -> Cursos del profesor autenticado
//   GET /api/asistencias/curso/:id/alumnos  -> Alumnos del curso con asistencia del dia
//   POST /api/asistencias/periodo           -> Guarda el registro de asistencia
// ----------------------------------------------------------------------------
export default function MisCursos() {
    const { token } = useAuth();

    // Estado de la lista de cursos
    const [cursos, setCursos] = useState([]);
    const [cargandoCursos, setCargandoCursos] = useState(true);
    const [errorCursos, setErrorCursos] = useState("");

    // Estado del curso seleccionado para tomar asistencia
    const [cursoSeleccionado, setCursoSeleccionado] = useState(null);
    const [alumnos, setAlumnos] = useState([]);
    const [cargandoAlumnos, setCargandoAlumnos] = useState(false);
    const [errorAlumnos, setErrorAlumnos] = useState("");

    // Estado de guardado de asistencia
    const [guardando, setGuardando] = useState(false);
    const [mensajeGuardado, setMensajeGuardado] = useState("");

    // -------------------------------------------------------------------------
    // Cargar los cursos asignados al profesor al montar el componente
    // -------------------------------------------------------------------------
    useEffect(() => {
        const cargarCursos = async () => {
            setCargandoCursos(true);
            setErrorCursos("");

            try {
                const respuesta = await fetch("/api/asistencias/mis-cursos", {
                    headers: { Authorization: `Bearer ${token}` },
                });

                const datos = await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(datos.error || "Error al cargar los cursos.");
                }

                setCursos(datos);
            } catch (err) {
                setErrorCursos(err.message);
            } finally {
                setCargandoCursos(false);
            }
        };

        if (token) cargarCursos();
    }, [token]);

    // -------------------------------------------------------------------------
    // Cargar los alumnos del curso seleccionado con asistencia del dia
    // -------------------------------------------------------------------------
    const abrirAsistenciaCurso = useCallback(
        async (curso) => {
            setCursoSeleccionado(curso);
            setCargandoAlumnos(true);
            setErrorAlumnos("");
            setAlumnos([]);
            setMensajeGuardado("");

            try {
                const respuesta = await fetch(
                    `/api/asistencias/curso/${curso.id}/alumnos`,
                    { headers: { Authorization: `Bearer ${token}` } }
                );

                const datos = await respuesta.json();

                if (!respuesta.ok) {
                    throw new Error(datos.error || "Error al cargar los alumnos del curso.");
                }

                setAlumnos(datos);
            } catch (err) {
                setErrorAlumnos(err.message);
            } finally {
                setCargandoAlumnos(false);
            }
        },
        [token]
    );

    // -------------------------------------------------------------------------
    // Guardar el registro de asistencia de un periodo en la base de datos
    // -------------------------------------------------------------------------
    const handleGuardarAsistencia = async (cursoId, payload) => {
        setGuardando(true);
        setMensajeGuardado("");

        try {
            const respuesta = await fetch("/api/asistencias/periodo", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(payload),
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.error || "Error al guardar la asistencia.");
            }

            setMensajeGuardado("Asistencia guardada exitosamente.");
        } catch (err) {
            setMensajeGuardado(`Error: ${err.message}`);
        } finally {
            setGuardando(false);
        }
    };

    // =========================================================================
    // RENDER: Estado de carga inicial de cursos
    // =========================================================================
    if (cargandoCursos) {
        return (
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", height: "350px", gap: "16px", fontFamily: "var(--stitch-font)" }}>
                <span className="material-icons-outlined" style={{ fontSize: "52px", color: "var(--stitch-secondary)", animation: "spin 1.5s linear infinite" }}>
                    sync
                </span>
                <p style={{ color: "var(--stitch-text-secondary)", fontWeight: "600", fontSize: "15px", margin: 0 }}>
                    Cargando cursos asignados...
                </p>
            </div>
        );
    }

    if (errorCursos) {
        return (
            <div 
                className="stitch-card" 
                style={{ 
                    padding: "32px", 
                    backgroundColor: "rgba(239, 68, 68, 0.04)", 
                    border: "1.5px solid rgba(239, 68, 68, 0.15)", 
                    borderRadius: "var(--stitch-radius-md)",
                    fontFamily: "var(--stitch-font)",
                    maxWidth: "600px",
                    margin: "40px auto",
                    boxShadow: "var(--stitch-shadow-sm)"
                }}
            >
                <div style={{ display: "flex", gap: "16px" }}>
                    <div style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        width: "48px",
                        height: "48px",
                        borderRadius: "50%",
                        backgroundColor: "rgba(239, 68, 68, 0.1)",
                        color: "#DC2626"
                    }}>
                        <span className="material-icons-outlined" style={{ fontSize: "28px" }}>error_outline</span>
                    </div>
                    <div style={{ flex: 1 }}>
                        <h3 style={{ margin: "0 0 8px 0", color: "#991B1B", fontWeight: "700", fontSize: "18px" }}>
                            Error de Conexión
                        </h3>
                        <p style={{ color: "#DC2626", fontSize: "14px", lineHeight: "1.6", margin: "0 0 16px 0" }}>
                            No se pudieron cargar los cursos. Esto ocurre si el servidor backend local no está encendido o si hay problemas en la base de datos local.
                            <br />
                            <strong style={{ fontSize: "12px", fontFamily: "monospace", display: "block", marginTop: "8px" }}>Detalle técnico: {errorCursos}</strong>
                        </p>
                        
                        <div style={{ display: "flex", gap: "12px" }}>
                            <button
                                onClick={() => window.location.reload()}
                                className="stitch-button"
                                style={{ backgroundColor: "#DC2626" }}
                            >
                                <span className="material-icons-outlined" style={{ fontSize: "18px" }}>refresh</span>
                                Reintentar Carga
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // =========================================================================
    // RENDER: Vista de asistencia del curso seleccionado
    // =========================================================================
    if (cursoSeleccionado) {
        const exito = mensajeGuardado && !mensajeGuardado.startsWith("Error");

        return (
            <div>
                {/* Barra de navegacion superior */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
                    <button
                        onClick={() => { setCursoSeleccionado(null); setAlumnos([]); setMensajeGuardado(""); }}
                        style={{ padding: "8px 16px", borderRadius: "6px", border: "1px solid var(--stitch-border)", backgroundColor: "#FFFFFF", cursor: "pointer", fontWeight: "500", display: "flex", alignItems: "center", gap: "6px", fontSize: "14px" }}
                    >
                        <span className="material-icons-outlined" style={{ fontSize: "18px" }}>arrow_back</span>
                        Volver a Mis Cursos
                    </button>

                    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
                        <h2 style={{ color: "var(--stitch-primary)", fontWeight: "700", margin: 0, fontSize: "18px" }}>
                            {cursoSeleccionado.materia_nombre}
                        </h2>
                        <span style={{ color: "var(--stitch-text-secondary)", fontSize: "13px" }}>
                            {cursoSeleccionado.grado_nombre} — Seccion {cursoSeleccionado.seccion_nombre} · {cursoSeleccionado.salon}
                        </span>
                    </div>
                </div>

                {/* Mensaje de resultado del guardado */}
                {mensajeGuardado && (
                    <div style={{ padding: "12px 16px", borderRadius: "8px", marginBottom: "16px", fontWeight: "600", fontSize: "14px", backgroundColor: exito ? "#D1FAE5" : "#FEE2E2", color: exito ? "#065F46" : "#991B1B", display: "flex", alignItems: "center", gap: "8px" }}>
                        <span className="material-icons-outlined" style={{ fontSize: "18px" }}>
                            {exito ? "check_circle" : "error_outline"}
                        </span>
                        {mensajeGuardado}
                    </div>
                )}

                {/* Estado: Cargando alumnos */}
                {cargandoAlumnos && (
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "24px", color: "var(--stitch-text-secondary)" }}>
                        <span className="material-icons-outlined" style={{ animation: "spin 1.5s linear infinite", color: "#3B82F6" }}>sync</span>
                        Cargando lista de estudiantes y asistencia del dia...
                    </div>
                )}

                {/* Estado: Error al cargar alumnos */}
                {errorAlumnos && !cargandoAlumnos && (
                    <div style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA", borderRadius: "8px", padding: "16px", color: "#991B1B", fontSize: "14px", display: "flex", gap: "8px" }}>
                        <span className="material-icons-outlined">error_outline</span>
                        {errorAlumnos}
                    </div>
                )}

                {/* Formulario de asistencia (solo si hay alumnos cargados) */}
                {!cargandoAlumnos && !errorAlumnos && (
                    <PeriodAttendance
                        courseId={cursoSeleccionado.id}
                        students={alumnos}
                        onSaveAttendance={handleGuardarAsistencia}
                        guardando={guardando}
                    />
                )}
            </div>
        );
    }

    // =========================================================================
    // RENDER: Lista de cursos asignados (vista principal)
    // =========================================================================
    return (
        <div>
            <div style={{
                background: 'linear-gradient(135deg, var(--stitch-primary) 0%, #1e40af 100%)',
                color: '#FFFFFF',
                padding: '28px 32px',
                borderRadius: 'var(--stitch-radius-md)',
                marginBottom: '32px',
                boxShadow: 'var(--stitch-shadow-lg)',
                position: 'relative',
                overflow: 'hidden'
            }}>
                <div style={{ position: 'relative', zIndex: 2 }}>
                    <h2 style={{ color: '#FFFFFF', fontWeight: '800', margin: '0 0 6px 0', fontSize: '24px', fontFamily: 'Outfit, sans-serif' }}>
                        Mis Cursos Asignados
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '14px', margin: 0, fontWeight: '500' }}>
                        Docente UA: Planifica clases, gestiona asistencia por período y realiza el seguimiento escolar.
                    </p>
                </div>
                <div style={{
                    position: 'absolute',
                    right: '-40px',
                    bottom: '-40px',
                    fontSize: '180px',
                    color: 'rgba(255, 255, 255, 0.05)',
                    fontFamily: 'Material Icons Outlined',
                    userSelect: 'none',
                    pointerEvents: 'none'
                }}>
                    school
                </div>
            </div>

            {cursos.length === 0 ? (
                <div style={{ textAlign: "center", padding: "48px", color: "var(--stitch-text-secondary)" }}>
                    <span className="material-icons-outlined" style={{ fontSize: "48px", marginBottom: "12px", display: "block" }}>school</span>
                    No tienes cursos asignados en este momento.
                </div>
            ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
                    {cursos.map((curso) => (
                        <CourseCard
                            key={curso.id}
                            course={{
                                id: curso.id,
                                materia_nombre: curso.materia_nombre,
                                grado_nombre: curso.grado_nombre,
                                seccion_nombre: curso.seccion_nombre,
                                salon: curso.salon,
                                color_hex: curso.color_hex || "#3B82F6",
                                horario: curso.horario,
                                totalAlumnos: curso.total_alumnos || 0,
                            }}
                            onSelectAction={(id, action) => {
                                if (action === "asistencia") {
                                    abrirAsistenciaCurso(curso);
                                } else if (action === "tareas") {
                                    alert(`Módulo de Tareas para ${curso.materia_nombre} — en desarrollo.`);
                                } else if (action === "notas") {
                                    alert(`Módulo de Calificaciones para ${curso.materia_nombre} — en desarrollo.`);
                                }
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
