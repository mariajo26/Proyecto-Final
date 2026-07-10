import React, { useState, useEffect, useMemo } from 'react';
import '../../styles/StTheme.css';

// ============================================================================
// DATOS DEMO: ALUMNOS DEL DOCENTE PARA EL BUSCADOR
// ============================================================================
const ESTUDIANTES_DOCENTE = [
    { id: 101, nombre: 'Carlos Eduardo Méndez', encargado: 'Sr. Carlos Méndez (Padre)', codigo: 'UA-26501' },
    { id: 102, nombre: 'María José Flores', encargado: 'Sra. Elizabeth Flores (Madre)', codigo: 'UA-26502' },
    { id: 103, nombre: 'Sofía Isabel Castro', encargado: 'Sra. Claudia Castro (Madre)', codigo: 'UA-26505' },
    { id: 104, nombre: 'Diego Alejandro Ortiz', encargado: 'Sr. Roberto Ortiz (Padre)', codigo: 'UA-26508' }
];

// Bloques horarios estándar de atención a padres sincronizados con la jornada escolar
const BLOQUES_JORNADA = [
    { num: 1, label: 'P1: 07:05 - 07:55' },
    { num: 2, label: 'P2: 07:55 - 08:45' },
    { num: 3, label: 'P3: 08:45 - 09:35' },
    { num: 4, label: 'P4: 10:15 - 11:05' },
    { num: 5, label: 'P5: 11:05 - 11:55' },
    { num: 6, label: 'P6: 11:55 - 12:45' }
];

const ASIGNACIONES_DOCENTE = [
    { dia: 'Lunes', periodo: 1, materia: 'Física General', grado: '4to Bachillerato A', aula: 'Laboratorio de Ciencias' },
    { dia: 'Lunes', periodo: 2, materia: 'Física General', grado: '4to Bachillerato A', aula: 'Laboratorio de Ciencias' },
    { dia: 'Martes', periodo: 2, materia: 'Matemática Aplicada II', grado: '5to Bachillerato B', aula: 'Salón 204' },
    { dia: 'Martes', periodo: 3, materia: 'Matemática Aplicada II', grado: '5to Bachillerato B', aula: 'Salón 204' },
    { dia: 'Miércoles', periodo: 3, materia: 'Seminario de Investigación', grado: '5to Bachillerato A', aula: 'Aula Magna' },
    { dia: 'Miércoles', periodo: 4, materia: 'Física General', grado: '4to Bachillerato A', aula: 'Laboratorio de Ciencias' },
    { dia: 'Jueves', periodo: 1, materia: 'Matemática Aplicada II', grado: '5to Bachillerato B', aula: 'Salón 204' },
    { dia: 'Jueves', periodo: 5, materia: 'Seminario de Investigación', grado: '5to Bachillerato A', aula: 'Aula Magna' },
    { dia: 'Viernes', periodo: 6, materia: 'Seminario de Investigación', grado: '5to Bachillerato A', aula: 'Aula Magna' }
];

// Solicitudes iniciales de cita
const SOLICITUDES_INICIALES = [
    {
        id: 1,
        encargado: 'Sra. Elizabeth Flores (Madre)',
        alumno: 'María José Flores',
        codigo: 'UA-26502',
        fecha: '2026-07-15',
        hora: '10:30 - 11:15',
        modalidad: 'Virtual',
        motivo: 'Consulta sobre el rendimiento en el Examen Parcial II.',
        estado: 'Pendiente',
        prioridad: 'Normal'
    },
    {
        id: 2,
        encargado: 'Sr. Carlos Méndez (Padre)',
        alumno: 'Carlos Eduardo Méndez',
        codigo: 'UA-26501',
        fecha: '2026-07-13',
        hora: '08:00 - 08:45',
        modalidad: 'Presencial',
        motivo: 'Alineación de conducta en clase de física.',
        estado: 'Confirmada',
        prioridad: 'Normal'
    },
    {
        id: 3,
        encargado: 'Sra. Claudia Castro (Madre)',
        alumno: 'Sofía Isabel Castro',
        codigo: 'UA-26505',
        fecha: '2026-07-14',
        hora: '13:00 - 13:45',
        modalidad: 'Virtual',
        motivo: 'Revisión urgente de calificaciones justificadas.',
        estado: 'Pendiente',
        prioridad: 'Urgente'
    }
];

export default function AgendaCitas() {
    // -------------------------------------------------------------------------
    // ESTADOS PRINCIPALES
    // -------------------------------------------------------------------------
    const [pestañaActiva, setPestañaActiva] = useState('solicitudes'); // 'disponibilidad' | 'solicitudes' | 'convocatoria'
    const [solicitudes, setSolicitudes] = useState(() => {
        const saved = localStorage.getItem('stitch_citas_solicitudes');
        return saved ? JSON.parse(saved) : SOLICITUDES_INICIALES;
    });

    useEffect(() => {
        localStorage.setItem('stitch_citas_solicitudes', JSON.stringify(solicitudes));
    }, [solicitudes]);

    const [mensaje, setMensaje] = useState({ texto: '', tipo: '' });

    // Estado de Disponibilidad Semanal (Objeto mapeando Día -> Array de Bloques habilitados)
    const [disponibilidad, setDisponibilidad] = useState(() => {
        const saved = localStorage.getItem('stitch_citas_disponibilidad');
        return saved ? JSON.parse(saved) : {
            'Lunes': ['P3: 08:45 - 09:35'],
            'Martes': ['P4: 10:15 - 11:05'],
            'Miércoles': ['P5: 11:05 - 11:55', 'P6: 11:55 - 12:45'],
            'Jueves': [],
            'Viernes': ['P4: 10:15 - 11:05']
        };
    });

    useEffect(() => {
        localStorage.setItem('stitch_citas_disponibilidad', JSON.stringify(disponibilidad));
    }, [disponibilidad]);

    const [fechaReferencia, setFechaReferencia] = useState(new Date('2026-07-10'));
    const [bloqueSeleccionado, setBloqueSeleccionado] = useState(null);

    const [citaACancelar, setCitaACancelar] = useState(null);
    const [comentarioCancelacion, setComentarioCancelacion] = useState('');
    const [mostrarHistorial, setMostrarHistorial] = useState(false);

    const ACTIVIDADES_SEMANA_EXTRA = useMemo(() => [
        { fecha: '2026-07-14', periodo: 4, titulo: 'Comisión de Evaluación' }, // Martes 14 de Julio
        { fecha: '2026-07-16', periodo: 5, titulo: 'Reunión de Profesores' }  // Jueves 16 de Julio
    ], []);

    const getFechasSemana = (fechaBase) => {
        const dates = {};
        const current = new Date(fechaBase);
        const day = current.getDay();
        const diff = current.getDate() - day + (day === 0 ? -6 : 1);
        const lunes = new Date(current.setDate(diff));

        const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'];
        dias.forEach((d, index) => {
            const temp = new Date(lunes);
            temp.setDate(lunes.getDate() + index);
            dates[d] = temp.toISOString().split('T')[0];
        });
        return dates;
    };
    const fechasSemana = useMemo(() => getFechasSemana(fechaReferencia), [fechaReferencia]);

    // Estados del Formulario de Convocatoria Saliente (Citar a Encargado)
    const [busquedaAlumno, setBusquedaAlumno] = useState('');
    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
    const [convFecha, setConvFecha] = useState('');
    const [convHora, setConvHora] = useState('');
    const [convModalidad, setConvModalidad] = useState('Presencial');
    const [convMotivo, setConvMotivo] = useState('');
    const [convUrgente, setConvUrgente] = useState(false);
    const [esCitaEspecial, setEsCitaEspecial] = useState(false);

    // -------------------------------------------------------------------------
    // HANDLERS: CONFIGURACIÓN DE DISPONIBILIDAD
    // -------------------------------------------------------------------------
    const handleToggleBloque = (dia, bloqueLabel) => {
        const fechaExacta = fechasSemana[dia];
        const horaInicio = bloqueLabel.split(': ')[1].split(' - ')[0];

        if (bloqueSeleccionado && bloqueSeleccionado.dia === dia && bloqueSeleccionado.label === bloqueLabel) {
            setBloqueSeleccionado(null);
            setConvFecha('');
            setConvHora('');
        } else {
            setBloqueSeleccionado({ dia, label: bloqueLabel, fecha: fechaExacta, hora: horaInicio });
            setConvFecha(fechaExacta);
            setConvHora(horaInicio);
            setPestañaActiva('convocatoria');
            setMensaje({
                texto: `Horario del ${dia} (${horaInicio}) seleccionado. Formulario de convocatoria completado.`,
                tipo: 'exito'
            });
        }
    };

    const handleGuardarDisponibilidad = () => {
        // ---------------------------------------------------------------------
        // BACKEND QUERY (UPSERT DISPONIBILIDAD)
        // ---------------------------------------------------------------------
        /* 
           DELETE FROM profesores_disponibilidad WHERE profesor_id = :profesorId;
           INSERT INTO profesores_disponibilidad (profesor_id, dia, bloque_hora)
           VALUES (:profesorId, :dia, :bloque);
        */
        console.log('[BACKEND] Disponibilidad horaria guardada con éxito:', disponibilidad);
        setMensaje({
            texto: 'Tus bloques horarios de atención a padres se han actualizado y publicado con éxito.',
            tipo: 'exito'
        });
    };

    // -------------------------------------------------------------------------
    // HANDLERS: APROBACIÓN / CANCELACIÓN DE CITAS EN BANDEJA
    // -------------------------------------------------------------------------
    const handleCambiarEstadoCita = (id, nuevoEstado, justificacion = '') => {
        console.log(`[BACKEND] Cita ID ${id} cambiada al estado: ${nuevoEstado}`);
        
        setSolicitudes(prev => prev.map(sol => {
            if (sol.id === id) {
                return { 
                    ...sol, 
                    estado: nuevoEstado,
                    comentario_cancelacion: justificacion || sol.comentario_cancelacion || ''
                };
            }
            return sol;
        }));

        setMensaje({
            texto: `La cita ha sido marcada como "${nuevoEstado}" de manera exitosa y se ha notificado al encargado.${justificacion ? ' Justificación: ' + justificacion : ''}`,
            tipo: nuevoEstado === 'Confirmada' ? 'exito' : 'error'
        });
    };

    // -------------------------------------------------------------------------
    // HANDLERS: CONVOCATORIA DIRECTA (FLUJO SALIENTE)
    // -------------------------------------------------------------------------
    const handleEnviarConvocatoria = (e) => {
        e.preventDefault();

        if (!alumnoSeleccionado) {
            alert('Debe seleccionar un alumno de la lista.');
            return;
        }
        if (!convFecha || !convHora) {
            alert('Debe programar la fecha y hora de la cita.');
            return;
        }
        if (!convMotivo.trim()) {
            alert('Debe especificar la razón de la convocatoria.');
            return;
        }

        // ---------------------------------------------------------------------
        // BACKEND QUERY (INSERT CITA OUTBOUND Y NOTIFICACIÓN URGENTE)
        // ---------------------------------------------------------------------
        /* 
           INSERT INTO citas (profesor_id, estudiante_id, fecha, hora, modalidad, motivo, estado, prioridad, creado_por)
           VALUES (:profesorId, :estudianteId, :fecha, :hora, :modalidad, :motivo, 'Confirmada', :prioridad, 'Profesor');
           
           -- Enviar correo y push al padre
           if (convUrgente) {
               fetch(`/api/notifications/urgent-appointment`, {
                   body: JSON.stringify({ parentEmail: ..., details: convMotivo })
               });
           }
        */
        console.log(`[BACKEND] Enviando convocatoria a ${alumnoSeleccionado.encargado} para el ${convFecha} a las ${convHora}. Urgente: ${convUrgente}`);

        const nuevaCita = {
            id: Date.now(),
            encargado: alumnoSeleccionado.encargado,
            alumno: alumnoSeleccionado.nombre,
            codigo: alumnoSeleccionado.codigo,
            fecha: convFecha,
            hora: convHora + (esCitaEspecial ? ' [Cita Especial - Fuera de Jornada]' : ''),
            modalidad: convModalidad,
            motivo: convMotivo,
            estado: 'Confirmada',
            prioridad: convUrgente ? 'Urgente' : 'Normal',
            esCitaEspecial
        };

        setSolicitudes(prev => [nuevaCita, ...prev]);

        setMensaje({
            texto: convUrgente
                ? `¡Convocatoria URGENTE enviada! Se ha enviado una notificación prioritaria en color rojo y un correo electrónico de alerta al encargado de ${alumnoSeleccionado.nombre}.`
                : `Convocatoria enviada al encargado de ${alumnoSeleccionado.nombre} de forma exitosa.`,
            tipo: convUrgente ? 'error' : 'exito'
        });

        // Limpiar formulario
        setAlumnoSeleccionado(null);
        setBusquedaAlumno('');
        setConvFecha('');
        setConvHora('');
        setConvMotivo('');
        setConvUrgente(false);
        setEsCitaEspecial(false);
        setPestañaActiva('solicitudes'); // Volver a la bandeja
    };

    // Alumnos filtrados para el buscador
    const alumnosFiltrados = ESTUDIANTES_DOCENTE.filter(est => 
        est.nombre.toLowerCase().includes(busquedaAlumno.toLowerCase()) || 
        est.codigo.toLowerCase().includes(busquedaAlumno.toLowerCase())
    );

    return (
        <div style={{ fontFamily: 'var(--stitch-font)', padding: '4px' }}>
            
            {/* ── CABECERA ─────────────────────────────────────────────────── */}
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
                    calendar_month
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#93C5FD', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '14px' }}>date_range</span>
                        Control de Reuniones y Citas
                    </span>
                    <h2 style={{ color: '#FFFFFF', fontWeight: '800', margin: '4px 0 0 0', fontSize: '24px', fontFamily: 'Outfit, sans-serif' }}>
                        Agenda y Citas con Padres
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Configura tu horario semanal disponible, responde a solicitudes y convoca de urgencia a tutores.
                    </p>
                </div>
            </div>

            {/* ── ALERTA DE MENSAJES ────────────────────────────────────────── */}
            {mensaje.texto && (
                <div className={`stitch-alert ${mensaje.tipo === 'exito' ? 'stitch-alert-success' : 'stitch-alert-danger'}`}>
                    <span className="material-icons-outlined">
                        {mensaje.tipo === 'exito' ? 'check_circle' : 'error_outline'}
                    </span>
                    <span style={{ flex: 1 }}>{mensaje.texto}</span>
                    <button onClick={() => setMensaje({ texto: '', tipo: '' })} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '20px', color: 'inherit', lineHeight: 1 }}>×</button>
                </div>
            )}

            {/* ── TABS DE NAVEGACIÓN INTERNA ────────────────────────────────── */}
            <div className="stitch-tabs-container">
                <button
                    type="button"
                    onClick={() => setPestañaActiva('solicitudes')}
                    className={`stitch-tab-btn ${pestañaActiva === 'solicitudes' ? 'stitch-tab-btn-active' : ''}`}
                >
                    <span className="material-icons-outlined">inbox</span>
                    Bandeja de Solicitudes
                </button>
                <button
                    type="button"
                    onClick={() => setPestañaActiva('disponibilidad')}
                    className={`stitch-tab-btn ${pestañaActiva === 'disponibilidad' ? 'stitch-tab-btn-active' : ''}`}
                >
                    <span className="material-icons-outlined">schedule</span>
                    Mi Disponibilidad Semanal
                </button>
                <button
                    type="button"
                    onClick={() => setPestañaActiva('convocatoria')}
                    className={`stitch-tab-btn ${pestañaActiva === 'convocatoria' ? 'stitch-tab-btn-active' : ''}`}
                >
                    <span className="material-icons-outlined">notifications_active</span>
                    Convocar a Tutor
                </button>
            </div>

            {/* ───────────────────────────────────────────────────────────────
                PESTAÑA A: BANDEJA DE SOLICITUDES DE REUNIÓN
            ──────────────────────────────────────────────────────────────── */}
            {pestañaActiva === 'solicitudes' && (
                <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '12px' }}>
                        <h3 className="stitch-title-font" style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--stitch-primary)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                            {mostrarHistorial ? 'Historial de Citas (Pasadas / Canceladas)' : 'Reuniones Programadas y Solicitudes de Padres'}
                        </h3>
                        <label style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', fontWeight: '600', color: 'var(--stitch-text-primary)' }}>
                            <input
                                type="checkbox"
                                checked={mostrarHistorial}
                                onChange={(e) => setMostrarHistorial(e.target.checked)}
                                style={{ accentColor: 'var(--stitch-primary)', width: '16px', height: '16px' }}
                            />
                            Ver Historial / Canceladas
                        </label>
                    </div>

                    <div style={{ overflowX: 'auto' }}>
                        <table className="stitch-table">
                            <thead>
                                <tr>
                                    <th className="stitch-th">Encargado / Tutor</th>
                                    <th className="stitch-th">Alumno</th>
                                    <th className="stitch-th" style={{ textAlign: 'center' }}>Fecha Programada</th>
                                    <th className="stitch-th" style={{ textAlign: 'center' }}>Bloque Horario</th>
                                    <th className="stitch-th" style={{ textAlign: 'center' }}>Modalidad</th>
                                    <th className="stitch-th" style={{ width: '25%' }}>Asunto / Motivo</th>
                                    <th className="stitch-th" style={{ textAlign: 'center' }}>Prioridad</th>
                                    <th className="stitch-th" style={{ textAlign: 'center' }}>Estado</th>
                                    <th className="stitch-th" style={{ textAlign: 'center' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {solicitudes
                                    .filter(sol => {
                                        const esHistorico = ['Cancelada', 'Rechazada', 'Completada'].includes(sol.estado);
                                        return mostrarHistorial ? esHistorico : !esHistorico;
                                    })
                                    .map(sol => {
                                        const esUrgente = sol.prioridad === 'Urgente';
                                        return (
                                            <tr key={sol.id} className="stitch-tr-hover" style={{ backgroundColor: esUrgente ? 'rgba(239,68,68,0.03)' : 'transparent' }}>
                                                <td className="stitch-td">
                                                    <strong>{sol.encargado}</strong>
                                                </td>
                                                <td className="stitch-td">
                                                    <div>{sol.alumno}</div>
                                                    <div style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)' }}>{sol.codigo}</div>
                                                </td>
                                                <td className="stitch-td" style={{ textAlign: 'center', fontWeight: '700' }}>{sol.fecha}</td>
                                                <td className="stitch-td" style={{ textAlign: 'center', color: 'var(--stitch-primary)', fontWeight: '700' }}>{sol.hora}</td>
                                                <td className="stitch-td" style={{ textAlign: 'center' }}>
                                                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', fontWeight: '700', color: 'var(--stitch-text-primary)' }}>
                                                        <span className="material-icons-outlined" style={{ fontSize: '14px' }}>
                                                            {sol.modalidad === 'Virtual' ? 'laptop' : 'home'}
                                                        </span>
                                                        {sol.modalidad}
                                                    </span>
                                                </td>
                                                <td className="stitch-td" style={{ lineHeight: '1.4' }}>
                                                    <div>{sol.motivo}</div>
                                                    {sol.comentario_cancelacion && (
                                                        <div style={{ fontSize: '11px', color: 'var(--stitch-danger)', marginTop: '4px', fontStyle: 'italic', fontWeight: '600' }}>
                                                            * Razón de cancelación: {sol.comentario_cancelacion}
                                                        </div>
                                                    )}
                                                </td>
                                                <td className="stitch-td" style={{ textAlign: 'center' }}>
                                                    <span className={`stitch-badge ${esUrgente ? 'stitch-badge-urgent' : 'stitch-badge-neutral'}`}>
                                                        {sol.prioridad}
                                                    </span>
                                                </td>
                                                <td className="stitch-td" style={{ textAlign: 'center' }}>
                                                    <span className={`stitch-badge ${
                                                        sol.estado === 'Pendiente' 
                                                            ? 'stitch-badge-warning' 
                                                            : (sol.estado === 'Confirmada' ? 'stitch-badge-success' : 'stitch-badge-danger')
                                                    }`}>
                                                        {sol.estado}
                                                    </span>
                                                </td>
                                                <td className="stitch-td" style={{ textAlign: 'center' }}>
                                                    {sol.estado === 'Pendiente' ? (
                                                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                                                            <button
                                                                type="button"
                                                                onClick={() => handleCambiarEstadoCita(sol.id, 'Confirmada')}
                                                                className="stitch-button"
                                                                style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--stitch-success)' }}
                                                            >
                                                                <span className="material-icons-outlined" style={{ fontSize: '14px' }}>check</span>
                                                                Aceptar
                                                            </button>
                                                            <button
                                                                type="button"
                                                                onClick={() => { setCitaACancelar(sol.id); setComentarioCancelacion(''); }}
                                                                className="stitch-button"
                                                                style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--stitch-danger)' }}
                                                            >
                                                                <span className="material-icons-outlined" style={{ fontSize: '14px' }}>close</span>
                                                                Rechazar
                                                            </button>
                                                        </div>
                                                    ) : sol.estado === 'Confirmada' ? (
                                                        <button
                                                            type="button"
                                                            onClick={() => { setCitaACancelar(sol.id); setComentarioCancelacion(''); }}
                                                            className="stitch-button-secondary"
                                                            style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--stitch-danger)' }}
                                                        >
                                                            Cancelar
                                                        </button>
                                                    ) : (
                                                        <span style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', fontStyle: 'italic' }}>Archivado</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────────
                PESTAÑA B: CONFIGURACIÓN DE DISPONIBILIDAD HORARIA SEMANAS
            ──────────────────────────────────────────────────────────────── */}
            {pestañaActiva === 'disponibilidad' && (
                <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '16px', marginBottom: '20px' }}>
                        <div>
                            <h3 className="stitch-title-font" style={{ margin: 0, fontSize: '15px', fontWeight: '800', color: 'var(--stitch-primary)' }}>
                                Matriz Semanal de Horarios de Atención
                            </h3>
                            <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--stitch-text-secondary)' }}>
                                Selecciona un único bloque disponible para auto-completar el formulario de convocatoria a tutor.
                            </p>
                        </div>
                        
                        {/* Controles de navegación de semana */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button
                                type="button"
                                className="stitch-button-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => {
                                    const prev = new Date(fechaReferencia);
                                    prev.setDate(prev.getDate() - 7);
                                    setFechaReferencia(prev);
                                    setBloqueSeleccionado(null);
                                }}
                            >
                                <span className="material-icons-outlined" style={{ fontSize: '16px' }}>navigate_before</span>
                                Anterior
                            </button>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: 'var(--stitch-primary)', minWidth: '180px', textAlign: 'center' }}>
                                Sem. {fechasSemana['Lunes']} al {fechasSemana['Viernes']}
                            </span>
                            <button
                                type="button"
                                className="stitch-button-secondary"
                                style={{ padding: '6px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', gap: '4px' }}
                                onClick={() => {
                                    const next = new Date(fechaReferencia);
                                    next.setDate(next.getDate() + 7);
                                    setFechaReferencia(next);
                                    setBloqueSeleccionado(null);
                                }}
                            >
                                Siguiente
                                <span className="material-icons-outlined" style={{ fontSize: '16px' }}>navigate_next</span>
                            </button>
                        </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '16px', marginBottom: '24px' }}>
                        {['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'].map(dia => {
                            const bloquesDia = disponibilidad[dia] || [];
                            const fechaDia = fechasSemana[dia];
                            return (
                                <div key={dia} style={{ backgroundColor: '#F8FAFC', padding: '16px', borderRadius: '8px', border: '1px solid var(--stitch-border)' }}>
                                    <h4 className="stitch-title-font" style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: '800', color: 'var(--stitch-primary)', textAlign: 'center' }}>
                                        {dia}
                                    </h4>
                                    <div style={{ fontSize: '10px', color: 'var(--stitch-text-secondary)', textAlign: 'center', marginBottom: '12px', borderBottom: '1.5px solid var(--stitch-border)', paddingBottom: '6px' }}>
                                        {fechaDia}
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {BLOQUES_JORNADA.map(bloque => {
                                            const claseAsignada = ASIGNACIONES_DOCENTE.find(
                                                asig => asig.dia === dia && asig.periodo === bloque.num
                                            );
                                            const tieneClase = !!claseAsignada;
                                            
                                            // Actividades momentáneas extras de esa semana
                                            const actividadExtra = ACTIVIDADES_SEMANA_EXTRA.find(
                                                act => act.fecha === fechaDia && act.periodo === bloque.num
                                            );
                                            const tieneActividadExtra = !!actividadExtra;
                                            
                                            const bloqueEstaSeleccionado = bloqueSeleccionado && bloqueSeleccionado.dia === dia && bloqueSeleccionado.label === bloque.label;
                                            const activo = bloquesDia.includes(bloque.label);
                                            
                                            // Deshabilitar si tiene clase, actividad extra, o si hay otro bloque seleccionado
                                            const deshabilitarBtn = tieneClase || tieneActividadExtra || (bloqueSeleccionado && !bloqueEstaSeleccionado);
                                            
                                            let btnColor = undefined;
                                            let btnBg = undefined;
                                            let btnBorder = undefined;
                                            let labelText = bloque.label;

                                            if (bloqueEstaSeleccionado) {
                                                btnBg = 'var(--stitch-primary-container)';
                                                btnColor = 'var(--stitch-primary)';
                                                btnBorder = '2px solid var(--stitch-primary)';
                                            } else if (tieneClase) {
                                                btnBg = '#E2E8F0';
                                                btnColor = '#64748B';
                                                labelText += ' [Clase]';
                                            } else if (tieneActividadExtra) {
                                                btnBg = '#FEE2E2';
                                                btnColor = '#991B1B';
                                                labelText += ` [${actividadExtra.titulo}]`;
                                            }

                                            return (
                                                <button
                                                    key={bloque.label}
                                                    type="button"
                                                    disabled={deshabilitarBtn}
                                                    onClick={() => handleToggleBloque(dia, bloque.label)}
                                                    className={activo ? 'stitch-button' : 'stitch-button-secondary'}
                                                    style={{
                                                        width: '100%', padding: '10px 8px', fontSize: '11px', textAlign: 'center',
                                                        borderRadius: 'var(--stitch-radius-sm)', justifyContent: 'center',
                                                        opacity: deshabilitarBtn && !bloqueEstaSeleccionado ? 0.45 : 1,
                                                        cursor: deshabilitarBtn && !bloqueEstaSeleccionado ? 'not-allowed' : 'pointer',
                                                        backgroundColor: btnBg,
                                                        borderColor: btnBorder || (deshabilitarBtn ? '#CBD5E1' : undefined),
                                                        color: btnColor,
                                                        fontWeight: bloqueEstaSeleccionado ? '700' : undefined
                                                    }}
                                                    title={tieneClase ? `Ocupado por clase` : (tieneActividadExtra ? actividadExtra.titulo : undefined)}
                                                >
                                                    {labelText} {(tieneClase || tieneActividadExtra) && <span className="material-icons-outlined" style={{ fontSize: '12px', verticalAlign: 'middle', marginLeft: '4px' }}>lock</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                        <button
                            type="button"
                            onClick={handleGuardarDisponibilidad}
                            className="stitch-button"
                            style={{ padding: '10px 24px' }}
                        >
                            <span className="material-icons-outlined">save</span>
                            Guardar Horarios Habilitados
                        </button>
                    </div>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────────
                PESTAÑA C: CONVOCATORIA DIRECTA A TUTOR (FLUJO SALIENTE)
            ──────────────────────────────────────────────────────────────── */}
            {pestañaActiva === 'convocatoria' && (
                <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', maxWidth: '600px', margin: '0 auto' }}>
                    <h3 className="stitch-title-font" style={{ margin: '0 0 18px 0', fontSize: '15px', fontWeight: '800', color: 'var(--stitch-primary)', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '10px' }}>
                        Convocatoria Directa de Encargado
                    </h3>

                    <form onSubmit={handleEnviarConvocatoria} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        
                        {/* Selector/Buscador del estudiante */}
                        <div>
                            <label className="stitch-label">Buscar Estudiante *</label>
                            <div className="stitch-search-wrapper">
                                <span className="material-icons-outlined stitch-search-icon">search</span>
                                <input
                                    type="text"
                                    placeholder="Escribe el nombre del estudiante..."
                                    value={busquedaAlumno}
                                    onChange={e => {
                                        setBusquedaAlumno(e.target.value);
                                        if (alumnoSeleccionado) setAlumnoSeleccionado(null);
                                    }}
                                    className="stitch-input stitch-search-input"
                                />
                                {busquedaAlumno && !alumnoSeleccionado && (
                                    <div style={{
                                        position: 'absolute', top: '44px', left: 0, right: 0,
                                        backgroundColor: '#FFFFFF', border: '1px solid var(--stitch-border)',
                                        borderRadius: '6px', boxShadow: 'var(--stitch-shadow-lg)', zIndex: 100,
                                        maxHeight: '160px', overflowY: 'auto'
                                    }}>
                                        {alumnosFiltrados.length === 0 ? (
                                            <div style={{ padding: '10px 14px', fontSize: '13px', color: 'var(--stitch-text-secondary)' }}>
                                                No se encontraron coincidencias.
                                            </div>
                                        ) : (
                                            alumnosFiltrados.map(est => (
                                                <div
                                                    key={est.id}
                                                    onClick={() => {
                                                        setAlumnoSeleccionado(est);
                                                        setBusquedaAlumno(est.nombre);
                                                    }}
                                                    style={{ padding: '10px 14px', cursor: 'pointer', fontSize: '13px', borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.15s ease' }}
                                                    onMouseOver={e => e.currentTarget.style.backgroundColor = '#F1F5F9'}
                                                    onMouseOut={e => e.currentTarget.style.backgroundColor = 'transparent'}
                                                >
                                                    <strong>{est.nombre}</strong> · <small>Tutor: {est.encargado}</small>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                )}
                            </div>
                            {alumnoSeleccionado && (
                                <div className="stitch-badge stitch-badge-success" style={{ marginTop: '8px', padding: '6px 12px', borderRadius: '4px', display: 'flex', width: 'fit-content' }}>
                                    <span className="material-icons-outlined" style={{ fontSize: '15px' }}>person</span>
                                    Citar a: {alumnoSeleccionado.encargado} (Tutor de {alumnoSeleccionado.nombre})
                                </div>
                            )}
                        </div>

                        {/* Fecha y Hora en Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                            <div>
                                <label className="stitch-label">Fecha Propuesta *</label>
                                <input type="date" required value={convFecha} onChange={e => setConvFecha(e.target.value)} className="stitch-input" />
                            </div>
                            <div>
                                <label className="stitch-label">Hora de Cita *</label>
                                <input type="time" required value={convHora} onChange={e => setConvHora(e.target.value)} className="stitch-input" />
                            </div>
                        </div>

                        {/* Cita Especial Checkbox */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px', backgroundColor: '#F8FAFC', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                            <input 
                                type="checkbox" 
                                id="esCitaEspecial" 
                                checked={esCitaEspecial} 
                                onChange={e => setEsCitaEspecial(e.target.checked)} 
                                style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                            />
                            <label htmlFor="esCitaEspecial" style={{ fontSize: '13px', color: 'var(--stitch-primary)', fontWeight: '600', cursor: 'pointer' }}>
                                Agregar Cita Especial / Fuera de Horario (Extemporánea)
                            </label>
                        </div>

                        {/* Modalidad */}
                        <div>
                            <label className="stitch-label">Modalidad de la Reunión</label>
                            <select value={convModalidad} onChange={e => setConvModalidad(e.target.value)} className="stitch-select">
                                <option value="Presencial">Presencial (Instalaciones del Colegio)</option>
                                <option value="Virtual">Virtual (Enlace de Videollamada)</option>
                            </select>
                        </div>

                        {/* Motivo */}
                        <div>
                            <label className="stitch-label">Asunto / Motivo de la Cita *</label>
                            <textarea
                                required
                                rows={3}
                                value={convMotivo}
                                onChange={e => setConvMotivo(e.target.value)}
                                className="stitch-textarea"
                                style={{ resize: 'vertical' }}
                                placeholder="Describa el motivo del llamado (ej: Rendimiento escolar, comportamiento indisciplinado, etc.)..."
                            />
                        </div>

                        {/* Toggle Prioridad Urgente */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF5F5', border: '1px solid #FEE2E2', padding: '16px', borderRadius: '8px' }}>
                            <div>
                                <strong style={{ fontSize: '13px', color: 'var(--stitch-danger)', display: 'block' }}>Marcar como Convocatoria Urgente</strong>
                                <span style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)' }}>Resalta la cita en rojo en el panel del encargado y envía una alerta de correo.</span>
                            </div>
                            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '24px' }}>
                                <input
                                    type="checkbox"
                                    checked={convUrgente}
                                    onChange={e => setConvUrgente(e.target.checked)}
                                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                                />
                            </label>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                            <button
                                type="button"
                                onClick={() => setPestañaActiva('solicitudes')}
                                className="stitch-button-secondary"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                className="stitch-button"
                                style={{ padding: '10px 24px', backgroundColor: convUrgente ? '#EF4444' : 'var(--stitch-secondary)' }}
                            >
                                <span className="material-icons-outlined">send</span>
                                Enviar Citación Oficial
                            </button>
                        </div>

                    </form>
                </div>
            )}

            {/* ───────────────────────────────────────────────────────────────
                ESTRUCTURA DE MODELO DE DATOS RECOMENDADA (DOCUMENTACIÓN DE BD)
            ────────────────────────────────────────────────────────────────
                * SQL Relacional:
                  - Tabla: citas (id, profesor_id, encargado_id, estudiante_id, fecha, hora_inicio, modalidad, motivo, estado, prioridad, creado_por, created_at)
                    Estados: ('Pendiente', 'Confirmada', 'Cancelada')
                    Prioridades: ('Normal', 'Urgente')
                    Creado Por: ('Profesor', 'Encargado')
                  - Tabla: profesores_disponibilidad (id, profesor_id, dia_semana, bloque_horario)

            {/* Modal de Justificación de Cancelación / Rechazo Stitch UI */}
            {citaACancelar && (
                <div className="stitch-modal-backdrop">
                    <div className="stitch-modal-content" style={{ width: '100%', maxWidth: '400px', padding: '24px' }}>
                        <h3 className="stitch-title-font" style={{ margin: '0 0 10px', color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '18px' }}>
                            Justificar Cancelación / Rechazo
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', marginBottom: '16px' }}>
                            Escribe la razón para notificar al encargado del estudiante:
                        </p>
                        <textarea
                            rows="3"
                            value={comentarioCancelacion}
                            onChange={(e) => setComentarioCancelacion(e.target.value)}
                            placeholder="Ej: Cruce con reunión de departamento, favor elegir otro bloque..."
                            className="stitch-textarea"
                            style={{ width: '95%', marginBottom: '20px', fontSize: '13px', padding: '8px' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
                            <button type="button" onClick={() => setCitaACancelar(null)} className="stitch-button-secondary">
                                Volver
                            </button>
                            <button 
                                type="button" 
                                onClick={() => {
                                    handleCambiarEstadoCita(citaACancelar, 'Cancelada', comentarioCancelacion);
                                    setCitaACancelar(null);
                                }} 
                                className="stitch-button" 
                                style={{ backgroundColor: 'var(--stitch-danger)' }}
                            >
                                Confirmar Cancelación
                            </button>
                        </div>
                    </div>
                </div>
            )}

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
