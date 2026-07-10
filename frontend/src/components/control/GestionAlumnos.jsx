import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

export default function GestionAlumnos() {
    const { token } = useAuth();
    const [alumnos, setAlumnos] = useState([]);
    const [grados, setGrados] = useState([]);
    const [secciones, setSecciones] = useState([]);
    const [filtroGrado, setFiltroGrado] = useState('Todos');
    const [filtroSeccion, setFiltroSeccion] = useState('Todos');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Detalle del alumno (Drawer)
    const [alumnoSeleccionado, setAlumnoSeleccionado] = useState(null);
    const [perfilEstudiante, setPerfilEstudiante] = useState(null);
    const [loadingPerfil, setLoadingPerfil] = useState(false);

    // Detalle del tutor (Drawer Secundario)
    const [tutorSeleccionado, setTutorSeleccionado] = useState(null);
    const [perfilTutor, setPerfilTutor] = useState(null);
    const [loadingTutor, setLoadingTutor] = useState(false);

    // Toast
    const [toast, setToast] = useState(null);
    const showToast = (msg, tipo = 'success') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
    };

    // Cargar alumnos
    const fetchAlumnos = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/control/alumnos', {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('No se pudo obtener el listado de alumnos.');
            const data = await res.json();
            setAlumnos(data);

            // Obtener grados y secciones únicos para los selectores de filtro
            const uniqueGrados = ['Todos', ...new Set(data.map(a => a.grado))];
            const uniqueSecciones = ['Todos', ...new Set(data.map(a => a.seccion))];
            setGrados(uniqueGrados);
            setSecciones(uniqueSecciones);
        } catch (err) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    }, [token]);

    useEffect(() => {
        fetchAlumnos();
    }, [fetchAlumnos]);

    // Ver perfil de estudiante (Drawer)
    const handleVerEstudiante = async (alumno) => {
        setAlumnoSeleccionado(alumno);
        setPerfilEstudiante(null);
        setTutorSeleccionado(null);
        setPerfilTutor(null);
        setLoadingPerfil(true);
        try {
            const res = await fetch(`/api/control/alumnos/${alumno.id}/perfil`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar la ficha del alumno.');
            const data = await res.json();
            setPerfilEstudiante(data);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoadingPerfil(false);
        }
    };

    // Ver perfil de tutor (Drawer secundario)
    const handleVerTutor = async (tutorId) => {
        setTutorSeleccionado(tutorId);
        setPerfilTutor(null);
        setLoadingTutor(true);
        try {
            const res = await fetch(`/api/control/tutores/${tutorId}/perfil`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error('Error al cargar la ficha del tutor.');
            const data = await res.json();
            setPerfilTutor(data);
        } catch (err) {
            showToast(err.message, 'error');
        } finally {
            setLoadingTutor(false);
        }
    };

    // Modificar privacidad de datos familiares (Toggle)
    const handleTogglePrivacidad = async (tutorId, campo, valorActual) => {
        if (!perfilEstudiante) return;
        const newPrivacidad = {
            ver_direccion: campo === 'ver_direccion' ? !valorActual : (perfilEstudiante.encargados.find(e => e.id === tutorId)?.privacidad?.ver_direccion ?? true),
            ver_telefono: campo === 'ver_telefono' ? !valorActual : (perfilEstudiante.encargados.find(e => e.id === tutorId)?.privacidad?.ver_telefono ?? true),
            ver_notas: campo === 'ver_notas' ? !valorActual : (perfilEstudiante.encargados.find(e => e.id === tutorId)?.privacidad?.ver_notas ?? true)
        };

        try {
            const res = await fetch(`/api/control/alumnos/${alumnoSeleccionado.id}/tutores/${tutorId}/privacidad`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(newPrivacidad)
            });
            if (!res.ok) throw new Error('No se pudo guardar la regla de privacidad.');

            // Actualizar estado local del perfil de encargados
            setPerfilEstudiante(prev => ({
                ...prev,
                encargados: prev.encargados.map(e => e.id === tutorId ? { ...e, privacidad: newPrivacidad } : e)
            }));
            showToast('Privacidad actualizada correctamente.', 'success');
        } catch (err) {
            showToast(err.message, 'error');
        }
    };

    // Filtrado
    const alumnosFiltrados = alumnos.filter(a => {
        const matchesGrado = filtroGrado === 'Todos' || a.grado === filtroGrado;
        const matchesSeccion = filtroSeccion === 'Todos' || a.seccion === filtroSeccion;
        return matchesGrado && matchesSeccion;
    });

    return (
        <div style={{ padding: '0px', background: 'var(--stitch-background)', fontFamily: 'var(--stitch-font-family, Google Sans, sans-serif)' }}>
            
            {/* Filtros de Busqueda */}
            <div className="st-card" style={{ padding: '16px 20px', marginBottom: '20px', borderRadius: '12px', display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="material-icons-outlined" style={{ color: 'var(--stitch-primary)' }}>filter_list</span>
                    <strong style={{ fontSize: '14px', color: 'var(--stitch-on-surface)' }}>Filtros de Alumnos:</strong>
                </div>
                
                <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <div>
                        <label style={{ fontSize: '12px', color: 'var(--stitch-on-surface-variant)', display: 'block', marginBottom: '4px' }}>Filtrar por Grado:</label>
                        <select 
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)' }}
                            value={filtroGrado}
                            onChange={e => setFiltroGrado(e.target.value)}
                        >
                            {grados.map(g => <option key={g} value={g}>{g}</option>)}
                        </select>
                    </div>
                    <div>
                        <label style={{ fontSize: '12px', color: 'var(--stitch-on-surface-variant)', display: 'block', marginBottom: '4px' }}>Filtrar por Sección:</label>
                        <select 
                            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid var(--stitch-outline)', background: 'var(--stitch-surface)', color: 'var(--stitch-on-surface)' }}
                            value={filtroSeccion}
                            onChange={e => setFiltroSeccion(e.target.value)}
                        >
                            {secciones.map(s => <option key={s} value={s}>{s}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Listado Principal */}
            {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '40px', color: 'var(--stitch-primary)', animation: 'spin 1s linear infinite' }}>sync</span>
                    <p style={{ color: 'var(--stitch-on-surface-variant)', marginTop: '10px' }}>Cargando lista de alumnos...</p>
                </div>
            ) : error ? (
                <div style={{ padding: '16px', background: 'var(--stitch-error-container)', color: 'var(--stitch-error)', borderRadius: '10px' }}>
                    {error}
                </div>
            ) : (
                <div className="st-card" style={{ borderRadius: '12px', overflow: 'hidden', padding: 0 }}>
                    <div style={{ overflowX: 'auto' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                            <thead>
                                <tr style={{ background: 'var(--stitch-surface-variant, rgba(0,0,0,0.03))', borderBottom: '1px solid var(--stitch-outline-variant)' }}>
                                    <th style={{ padding: '12px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>Código UA</th>
                                    <th style={{ padding: '12px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>Nombre Completo</th>
                                    <th style={{ padding: '12px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>Grado</th>
                                    <th style={{ padding: '12px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>Sección</th>
                                    <th style={{ padding: '12px 18px', fontSize: '13px', fontWeight: 600, color: 'var(--stitch-on-surface)' }}>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {alumnosFiltrados.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" style={{ padding: '24px', textAlign: 'center', color: 'var(--stitch-on-surface-variant)' }}>No hay alumnos que coincidan con los filtros seleccionados.</td>
                                    </tr>
                                ) : (
                                    alumnosFiltrados.map(a => (
                                        <tr key={a.id} style={{ borderBottom: '1px solid var(--stitch-outline-variant)', transition: 'background-color 0.15s' }}>
                                            <td style={{ padding: '12px 18px', fontSize: '14px', fontWeight: 600, color: 'var(--stitch-primary)' }}>{a.codigo_ua}</td>
                                            <td style={{ padding: '12px 18px', fontSize: '14px', color: 'var(--stitch-on-surface)' }}>{a.nombre_completo}</td>
                                            <td style={{ padding: '12px 18px', fontSize: '14px', color: 'var(--stitch-on-surface)' }}>{a.grado}</td>
                                            <td style={{ padding: '12px 18px', fontSize: '14px', color: 'var(--stitch-on-surface)' }}>Sección {a.seccion}</td>
                                            <td style={{ padding: '12px 18px' }}>
                                                <button 
                                                    className="st-button st-button-filled"
                                                    onClick={() => handleVerEstudiante(a)}
                                                    style={{ padding: '6px 12px', fontSize: '12px', display: 'inline-flex', alignItems: 'center', gap: '4px', border: 'none', background: 'var(--stitch-primary)', color: '#fff', borderRadius: '8px', cursor: 'pointer' }}
                                                >
                                                    <span className="material-icons-outlined" style={{ fontSize: '14px' }}>visibility</span>
                                                    Ficha del Alumno
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* DRAWER PRINCIPAL: DETALLE DEL ALUMNO */}
            {alumnoSeleccionado && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(0,0,0,0.4)', display: 'flex', justifyContent: 'flex-end' }} onClick={() => setAlumnoSeleccionado(null)}>
                    <div style={{ width: '100%', maxWidth: '500px', height: '100%', background: 'var(--stitch-surface)', boxShadow: '-8px 0 24px rgba(0,0,0,0.15)', display: 'flex', flexDirection: 'column' }} onClick={e => e.stopPropagation()}>
                        
                        {/* Drawer Header */}
                        <div style={{ padding: '20px 24px', borderBottom: '1px solid var(--stitch-outline-variant)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span className="material-icons-outlined" style={{ color: 'var(--stitch-primary)', fontSize: '24px' }}>badge</span>
                                <div>
                                    <h3 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: 'var(--stitch-on-surface)' }}>{alumnoSeleccionado.nombre_completo}</h3>
                                    <span style={{ fontSize: '12px', color: 'var(--stitch-on-surface-variant)' }}>Código: {alumnoSeleccionado.codigo_ua}</span>
                                </div>
                            </div>
                            <button onClick={() => setAlumnoSeleccionado(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stitch-on-surface-variant)' }}>
                                <span className="material-icons-outlined">close</span>
                            </button>
                        </div>

                        {/* Drawer Content */}
                        <div style={{ padding: '24px', overflowY: 'auto', flex: 1 }}>
                            {loadingPerfil ? (
                                <div style={{ textAlign: 'center', padding: '20px' }}>
                                    <span className="material-icons-outlined" style={{ animation: 'spin 1s linear infinite', color: 'var(--stitch-primary)' }}>sync</span>
                                    <p style={{ fontSize: '13px', color: 'var(--stitch-on-surface-variant)' }}>Cargando datos familiares y médicos...</p>
                                </div>
                            ) : perfilEstudiante ? (
                                <div>
                                    {/* Ficha Médica */}
                                    <div style={{ marginBottom: '24px' }}>
                                        <h4 style={{ margin: '0 0 10px', fontSize: '13px', textTransform: 'uppercase', color: 'var(--stitch-error)', borderBottom: '1px solid var(--stitch-outline-variant)', paddingBottom: '6px' }}>Ficha Médica de Emergencia</h4>
                                        {perfilEstudiante.ficha_medica ? (
                                            <div style={{ background: 'rgba(220,53,69,0.05)', border: '1px solid rgba(220,53,69,0.2)', padding: '12px', borderRadius: '8px', fontSize: '13px' }}>
                                                <p style={{ margin: '0 0 6px' }}><strong>Tipo de Sangre:</strong> {perfilEstudiante.ficha_medica.tipo_sangre}</p>
                                                <p style={{ margin: '0 0 6px' }}><strong>Alergias:</strong> {perfilEstudiante.ficha_medica.alergias || 'Ninguna'}</p>
                                                <p style={{ margin: '0' }}><strong>Padecimientos Crónicos:</strong> {perfilEstudiante.ficha_medica.padecimientos_cronicos || 'Ninguno'}</p>
                                            </div>
                                        ) : (
                                            <p style={{ fontSize: '13px', color: 'var(--stitch-on-surface-variant)' }}>No se ha registrado ficha médica para este estudiante.</p>
                                        )}
                                    </div>

                                    {/* Vinculación Familiar */}
                                    <div>
                                        <h4 style={{ margin: '0 0 12px', fontSize: '13px', textTransform: 'uppercase', color: 'var(--stitch-primary)', borderBottom: '1px solid var(--stitch-outline-variant)', paddingBottom: '6px' }}>Familiares y Encargados</h4>
                                        {perfilEstudiante.encargados.length === 0 ? (
                                            <p style={{ fontSize: '13px', color: 'var(--stitch-on-surface-variant)' }}>No hay encargados registrados vinculados a este alumno.</p>
                                        ) : (
                                            perfilEstudiante.encargados.map(enc => (
                                                <div key={enc.id} style={{ border: '1px solid var(--stitch-outline-variant)', padding: '14px', borderRadius: '10px', marginBottom: '12px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                                                        <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--stitch-primary-container)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 600, color: 'var(--stitch-primary)' }}>
                                                            {enc.nombre_completo.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h5 style={{ margin: 0, fontSize: '14px', color: 'var(--stitch-on-surface)' }}>{enc.nombre_completo}</h5>
                                                            <span style={{ fontSize: '12px', color: 'var(--stitch-primary)', fontWeight: 600 }}>{enc.parentesco} ({enc.codigo_ua})</span>
                                                        </div>
                                                        <button 
                                                            onClick={() => handleVerTutor(enc.id)}
                                                            style={{ marginLeft: 'auto', border: 'none', background: 'transparent', color: 'var(--stitch-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px' }}
                                                        >
                                                            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>open_in_new</span>
                                                            Ficha
                                                        </button>
                                                    </div>

                                                    {/* Control de Privacidad */}
                                                    <div style={{ background: 'var(--stitch-background)', padding: '10px', borderRadius: '8px', border: '1px dashed var(--stitch-outline)' }}>
                                                        <span style={{ fontSize: '11px', textTransform: 'uppercase', color: 'var(--stitch-on-surface-variant)', fontWeight: 700, display: 'block', marginBottom: '8px' }}>Privacidad de Datos Familiares</span>
                                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '12px', color: 'var(--stitch-on-surface)' }}>Ver Dirección Residencial:</span>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={enc.privacidad?.ver_direccion ?? true} 
                                                                    onChange={() => handleTogglePrivacidad(enc.id, 'ver_direccion', enc.privacidad?.ver_direccion ?? true)} 
                                                                />
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '12px', color: 'var(--stitch-on-surface)' }}>Ver Teléfono de Contacto:</span>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={enc.privacidad?.ver_telefono ?? true} 
                                                                    onChange={() => handleTogglePrivacidad(enc.id, 'ver_telefono', enc.privacidad?.ver_telefono ?? true)} 
                                                                />
                                                            </div>
                                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                                <span style={{ fontSize: '12px', color: 'var(--stitch-on-surface)' }}>Ver Reportes de Calificaciones:</span>
                                                                <input 
                                                                    type="checkbox" 
                                                                    checked={enc.privacidad?.ver_notas ?? true} 
                                                                    onChange={() => handleTogglePrivacidad(enc.id, 'ver_notas', enc.privacidad?.ver_notas ?? true)} 
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            ) : null}
                        </div>
                    </div>
                </div>
            )}

            {/* DRAWER SECUNDARIO: PERFIL DE TUTOR */}
            {tutorSeleccionado && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 1100, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center' }} onClick={() => setTutorSeleccionado(null)}>
                    <div style={{ background: 'var(--stitch-surface)', borderRadius: '16px', width: '100%', maxWidth: '440px', padding: '24px', boxShadow: '0 12px 40px rgba(0,0,0,0.2)' }} onClick={e => e.stopPropagation()}>
                        {loadingTutor ? (
                            <div style={{ textAlign: 'center', padding: '20px' }}>
                                <span className="material-icons-outlined" style={{ animation: 'spin 1s linear infinite', color: 'var(--stitch-primary)' }}>sync</span>
                                <p style={{ fontSize: '13px', color: 'var(--stitch-on-surface-variant)' }}>Cargando ficha del tutor...</p>
                            </div>
                        ) : perfilTutor ? (
                            <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--stitch-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', fontWeight: 600, color: '#fff' }}>
                                        {perfilTutor.tutor.nombre_completo.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--stitch-on-surface)' }}>{perfilTutor.tutor.nombre_completo}</h3>
                                        <span style={{ fontSize: '12px', color: 'var(--stitch-on-surface-variant)' }}>Código: {perfilTutor.tutor.codigo_ua}</span>
                                    </div>
                                    <button onClick={() => setTutorSeleccionado(null)} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stitch-on-surface-variant)' }}>
                                        <span className="material-icons-outlined">close</span>
                                    </button>
                                </div>

                                <div style={{ background: 'var(--stitch-background)', padding: '14px', borderRadius: '8px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                                    <p style={{ margin: 0 }}><strong>Correo:</strong> {perfilTutor.tutor.correo_recuperacion}</p>
                                    <p style={{ margin: 0 }}><strong>Teléfono:</strong> {perfilTutor.tutor.telefono_personal || 'No registrado'}</p>
                                    <p style={{ margin: 0 }}><strong>Teléfono Emergencia:</strong> {perfilTutor.tutor.telefono_emergencia || 'No registrado'}</p>
                                    <p style={{ margin: 0 }}><strong>Fecha Vinculación:</strong> {new Date(perfilTutor.tutor.creado_en).toLocaleDateString()}</p>
                                </div>

                                <h4 style={{ fontSize: '12px', textTransform: 'uppercase', color: 'var(--stitch-primary)', margin: '0 0 10px' }}>Alumnos Vinculados a este Tutor</h4>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                    {perfilTutor.hijos.map(hijo => (
                                        <div key={hijo.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 12px', background: 'var(--stitch-surface)', border: '1px solid var(--stitch-outline-variant)', borderRadius: '8px', fontSize: '13px' }}>
                                            <span><strong>{hijo.nombre_completo}</strong> ({hijo.codigo_ua})</span>
                                            <span style={{ color: 'var(--stitch-primary)', fontWeight: 600 }}>{hijo.parentesco}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            )}

            {/* Toast */}
            {toast && (
                <div style={{ position: 'fixed', bottom: '24px', left: '50%', transform: 'translateX(-50%)', background: toast.tipo === 'success' ? 'var(--stitch-success)' : 'var(--stitch-error)', color: '#fff', padding: '12px 24px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', zIndex: 2000, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>{toast.tipo === 'success' ? 'check_circle' : 'error'}</span>
                    {toast.msg}
                </div>
            )}

            <style>{`
                @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
            `}</style>
        </div>
    );
}
