import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

const CURSOS_INICIALES = [
    { id: 1, materia: 'Física General', grado: '4to Bachillerato', seccion: 'A', salon: 'Laboratorio de Ciencias', profesor: 'Carlos Gomez Estrada' },
    { id: 2, materia: 'Matemática Aplicada II', grado: '5to Bachillerato', seccion: 'B', salon: 'Salón 204', profesor: 'Sofia Lopez Alvarado' },
    { id: 3, materia: 'Seminario de Investigación', grado: '5to Bachillerato', seccion: 'A', salon: 'Aula Magna', profesor: 'Jorge Diaz Herrera' }
];

export default function GestionCursos() {
    const { token } = useAuth();
    const [cursos, setCursos] = useState(() => {
        const saved = localStorage.getItem('stitch_admin_cursos');
        return saved ? JSON.parse(saved) : CURSOS_INICIALES;
    });

    const [cursoEditando, setCursoEditando] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);

    // Inputs del formulario
    const [materia, setMateria] = useState('');
    const [grado, setGrado] = useState('');
    const [seccion, setSeccion] = useState('A');
    const [salon, setSalon] = useState('');
    const [profesor, setProfesor] = useState('');

    const [busqueda, setBusqueda] = useState('');

    const [dbGrados, setDbGrados] = useState([]);
    const [dbProfesores, setDbProfesores] = useState([]);

    // Fetch grados and profesores on mount
    useEffect(() => {
        if (!token) return;

        // Fetch Grados
        fetch('/api/control/grados', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setDbGrados(data);
                if (data.length > 0 && !grado) {
                    setGrado(data[0].nombre);
                }
            }
        })
        .catch(err => console.error('Error al obtener grados del backend:', err));

        // Fetch Profesores
        fetch('/api/control/profesores', {
            headers: { Authorization: `Bearer ${token}` }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setDbProfesores(data);
                if (data.length > 0 && !profesor) {
                    setProfesor(data[0].nombre_completo);
                }
            }
        })
        .catch(err => console.error('Error al obtener profesores del backend:', err));
    }, [token]);

    useEffect(() => {
        localStorage.setItem('stitch_admin_cursos', JSON.stringify(cursos));
    }, [cursos]);

    const handleCrearOEditar = (e) => {
        e.preventDefault();
        if (!materia.trim() || !grado.trim() || !salon.trim() || !profesor.trim()) {
            alert('Por favor llene todos los campos obligatorios.');
            return;
        }

        if (cursoEditando) {
            // Editar
            setCursos(prev => prev.map(c => {
                if (c.id === cursoEditando.id) {
                    return { ...c, materia, grado, seccion, salon, profesor };
                }
                return c;
            }));
            setCursoEditando(null);
        } else {
            // Crear
            const nuevo = {
                id: Date.now(),
                materia: materia.trim(),
                grado: grado.trim(),
                seccion,
                salon: salon.trim(),
                profesor: profesor.trim()
            };
            setCursos(prev => [nuevo, ...prev]);
        }

        // Limpiar inputs
        setMateria('');
        setGrado('');
        setSeccion('A');
        setSalon('');
        setProfesor('');
        setMostrarFormulario(false);
    };

    const handleIniciarEdicion = (c) => {
        setCursoEditando(c);
        setMateria(c.materia);
        setGrado(c.grado);
        setSeccion(c.seccion);
        setSalon(c.salon);
        setProfesor(c.profesor);
        setMostrarFormulario(true);
    };

    const handleEliminar = (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este curso?')) {
            setCursos(prev => prev.filter(c => c.id !== id));
        }
    };

    const cursosFiltrados = cursos.filter(c => {
        return c.materia.toLowerCase().includes(busqueda.toLowerCase()) ||
               c.grado.toLowerCase().includes(busqueda.toLowerCase()) ||
               c.profesor.toLowerCase().includes(busqueda.toLowerCase());
    });

    return (
        <div style={{ fontFamily: 'var(--stitch-font)', padding: '4px' }}>
            
            {/* CABECERA */}
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
                    school
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#93C5FD', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '14px' }}>admin_panel_settings</span>
                        Panel de Control Académico
                    </span>
                    <h2 style={{ color: '#FFFFFF', fontWeight: '800', margin: '4px 0 0 0', fontSize: '24px', fontFamily: 'Outfit, sans-serif' }}>
                        Gestión General de Cursos y Grados
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Crear, editar, y deshabilitar asignaciones académicas, salones de clase y profesores guías.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setCursoEditando(null);
                        setMateria('');
                        setGrado(dbGrados.length > 0 ? dbGrados[0].nombre : '');
                        setSeccion('A');
                        setSalon('');
                        setProfesor(dbProfesores.length > 0 ? dbProfesores[0].nombre_completo : '');
                        setMostrarFormulario(true);
                    }}
                    className="stitch-button"
                    style={{ backgroundColor: '#FFFFFF', color: 'var(--stitch-primary)', fontWeight: '700' }}
                >
                    <span className="material-icons-outlined">library_add</span>
                    Registrar Nuevo Curso
                </button>
            </div>

            {/* FILTROS */}
            <div className="stitch-card" style={{ padding: '16px', marginBottom: '24px', backgroundColor: '#FFFFFF' }}>
                <input
                    type="text"
                    placeholder="Buscar por materia, grado o profesor..."
                    value={busqueda}
                    onChange={e => setBusqueda(e.target.value)}
                    className="stitch-input"
                    style={{ width: '98%', padding: '10px' }}
                />
            </div>

            {/* TABLA DE CURSOS */}
            <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="stitch-table">
                        <thead>
                            <tr>
                                <th className="stitch-th">Asignatura / Materia</th>
                                <th className="stitch-th">Grado / Nivel</th>
                                <th className="stitch-th" style={{ textAlign: 'center' }}>Sección</th>
                                <th className="stitch-th">Salón / Aula</th>
                                <th className="stitch-th">Profesor Asignado</th>
                                <th className="stitch-th" style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {cursosFiltrados.map(c => (
                                <tr key={c.id} className="stitch-tr-hover">
                                    <td className="stitch-td" style={{ fontWeight: '700', color: 'var(--stitch-primary)' }}>{c.materia}</td>
                                    <td className="stitch-td" style={{ fontWeight: '600' }}>{c.grado}</td>
                                    <td className="stitch-td" style={{ textAlign: 'center' }}>
                                        <span className="stitch-badge" style={{ backgroundColor: '#DBEAFE', color: '#1E40AF', fontWeight: '800' }}>{c.seccion}</span>
                                    </td>
                                    <td className="stitch-td">{c.salon}</td>
                                    <td className="stitch-td" style={{ fontWeight: '600' }}>{c.profesor}</td>
                                    <td className="stitch-td" style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleIniciarEdicion(c)}
                                                className="stitch-button-secondary"
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleEliminar(c.id)}
                                                className="stitch-button"
                                                style={{ padding: '6px 12px', fontSize: '12px', backgroundColor: 'var(--stitch-danger)' }}
                                            >
                                                Eliminar
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* MODAL CREAR / EDITAR */}
            {mostrarFormulario && (
                <div className="stitch-modal-backdrop">
                    <div className="stitch-modal-content" style={{ width: '100%', maxWidth: '500px', padding: '24px' }}>
                        <h3 className="stitch-title-font" style={{ margin: '0 0 6px 0', color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '18px' }}>
                            {cursoEditando ? 'Modificar Información del Curso' : 'Registrar Nuevo Curso'}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', marginBottom: '20px' }}>
                            Complete los campos requeridos para registrar la materia en la jornada académica.
                        </p>
                        <form onSubmit={handleCrearOEditar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', marginBottom: '6px' }}>
                                    Nombre de Asignatura / Materia *
                                </label>
                                <input
                                    type="text"
                                    value={materia}
                                    onChange={e => setMateria(e.target.value)}
                                    placeholder="Ej: Física General"
                                    required
                                    className="stitch-input"
                                    style={{ width: '95%', padding: '10px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', marginBottom: '6px' }}>
                                    Grado / Nivel Académico *
                                </label>
                                <select
                                    value={grado}
                                    onChange={e => setGrado(e.target.value)}
                                    className="stitch-select"
                                    style={{ width: '100%', padding: '10px' }}
                                    required
                                >
                                    {dbGrados.map(g => (
                                        <option key={g.id} value={g.nombre}>{g.nombre}</option>
                                    ))}
                                    {dbGrados.length === 0 && (
                                        <>
                                            <option value="4to Bachillerato">4to Bachillerato</option>
                                            <option value="5to Bachillerato">5to Bachillerato</option>
                                            <option value="Decimo Grado">Decimo Grado</option>
                                            <option value="Undecimo Grado">Undecimo Grado</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', marginBottom: '6px' }}>
                                    Sección *
                                </label>
                                <select
                                    value={seccion}
                                    onChange={e => setSeccion(e.target.value)}
                                    className="stitch-select"
                                    style={{ width: '100%', padding: '10px' }}
                                >
                                    <option value="A">Sección A</option>
                                    <option value="B">Sección B</option>
                                    <option value="C">Sección C</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', marginBottom: '6px' }}>
                                    Salón / Aula Asignada *
                                </label>
                                <input
                                    type="text"
                                    value={salon}
                                    onChange={e => setSalon(e.target.value)}
                                    placeholder="Ej: Laboratorio de Ciencias / Salón 102"
                                    required
                                    className="stitch-input"
                                    style={{ width: '95%', padding: '10px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', marginBottom: '6px' }}>
                                    Profesor Catedrático *
                                </label>
                                <select
                                    value={profesor}
                                    onChange={e => setProfesor(e.target.value)}
                                    className="stitch-select"
                                    style={{ width: '100%', padding: '10px' }}
                                    required
                                >
                                    {dbProfesores.map(p => (
                                        <option key={p.id} value={p.nombre_completo}>{p.nombre_completo}</option>
                                    ))}
                                    {dbProfesores.length === 0 && (
                                        <>
                                            <option value="Carlos Gomez Estrada">Carlos Gomez Estrada</option>
                                            <option value="Sofia Lopez Alvarado">Sofia Lopez Alvarado</option>
                                            <option value="Jorge Diaz Herrera">Jorge Diaz Herrera</option>
                                        </>
                                    )}
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setMostrarFormulario(false)} className="stitch-button-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="stitch-button">
                                    Guardar Curso
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
