import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

const USUARIOS_INICIALES = [
    { id: 1, codigo_ua: 'UA-26101', nombre_completo: 'Juan Perez Ortega', correo: 'juan.perez@ua.edu.gt', rol: 'Administrador', estado: 'Activo' },
    { id: 2, codigo_ua: 'UA-26201', nombre_completo: 'Maria Juarez Diaz', correo: 'maria.juarez@ua.edu.gt', rol: 'Control Academico', estado: 'Activo' },
    { id: 3, codigo_ua: 'UA-26301', nombre_completo: 'Carlos Gomez Estrada', correo: 'carlos.gomez@ua.edu.gt', rol: 'Profesor', estado: 'Activo' },
    { id: 4, codigo_ua: 'UA-26401', nombre_completo: 'Luisa Ortega Cruz', correo: 'luisa.ortega@gmail.com', rol: 'Encargado', estado: 'Activo' },
    { id: 5, codigo_ua: 'UA-26501', nombre_completo: 'Jose Ortega Cruz', correo: 'jose.ortega@ua.edu.gt', rol: 'Estudiante', estado: 'Activo' }
];

export default function GestionUsuarios() {
    const { token } = useAuth();
    const [usuarios, setUsuarios] = useState(() => {
        const saved = localStorage.getItem('stitch_admin_usuarios');
        return saved ? JSON.parse(saved) : USUARIOS_INICIALES;
    });

    const [usuarioEditando, setUsuarioEditando] = useState(null);
    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    
    // Inputs del formulario
    const [codigoUa, setCodigoUa] = useState('');
    const [nombre, setNombre] = useState('');
    const [correo, setCorreo] = useState('');
    const [rol, setRol] = useState('Estudiante');
    const [estado, setEstado] = useState('Activo');

    const [filtroRol, setFiltroRol] = useState('Todos');
    const [busqueda, setBusqueda] = useState('');

    useEffect(() => {
        localStorage.setItem('stitch_admin_usuarios', JSON.stringify(usuarios));
    }, [usuarios]);

    const handleCrearOEditar = (e) => {
        e.preventDefault();
        if (!codigoUa.trim() || !nombre.trim() || !correo.trim()) {
            alert('Por favor llene todos los campos obligatorios.');
            return;
        }

        if (usuarioEditando) {
            // Editar
            setUsuarios(prev => prev.map(u => {
                if (u.id === usuarioEditando.id) {
                    return { ...u, codigo_ua: codigoUa, nombre_completo: nombre, correo, rol, estado };
                }
                return u;
            }));
            setUsuarioEditando(null);
        } else {
            // Crear
            const nuevo = {
                id: Date.now(),
                codigo_ua: codigoUa.trim(),
                nombre_completo: nombre.trim(),
                correo: correo.trim(),
                rol,
                estado
            };
            setUsuarios(prev => [nuevo, ...prev]);
        }

        // Limpiar inputs
        setCodigoUa('');
        setNombre('');
        setCorreo('');
        setRol('Estudiante');
        setEstado('Activo');
        setMostrarFormulario(false);
    };

    const handleIniciarEdicion = (u) => {
        setUsuarioEditando(u);
        setCodigoUa(u.codigo_ua);
        setNombre(u.nombre_completo);
        setCorreo(u.correo);
        setRol(u.rol);
        setEstado(u.estado);
        setMostrarFormulario(true);
    };

    const handleEliminar = (id) => {
        if (window.confirm('¿Está seguro de que desea eliminar este usuario?')) {
            setUsuarios(prev => prev.filter(u => u.id !== id));
        }
    };

    const usuariosFiltrados = usuarios.filter(u => {
        const matchesRol = filtroRol === 'Todos' || u.rol === filtroRol;
        const matchesBusqueda = u.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) || 
                                u.codigo_ua.toLowerCase().includes(busqueda.toLowerCase()) ||
                                u.correo.toLowerCase().includes(busqueda.toLowerCase());
        return matchesRol && matchesBusqueda;
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
                    manage_accounts
                </div>
                <div style={{ position: 'relative', zIndex: 1 }}>
                    <span style={{ fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1.5px', color: '#93C5FD', fontWeight: '800', display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '14px' }}>admin_panel_settings</span>
                        Panel de Control Académico
                    </span>
                    <h2 style={{ color: '#FFFFFF', fontWeight: '800', margin: '4px 0 0 0', fontSize: '24px', fontFamily: 'Outfit, sans-serif' }}>
                        Gestión General de Usuarios
                    </h2>
                    <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '13px', margin: '4px 0 0 0' }}>
                        Crear, editar, y deshabilitar cuentas de Administradores, Profesores, Alumnos y Padres de familia.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => {
                        setUsuarioEditando(null);
                        setCodigoUa('');
                        setNombre('');
                        setCorreo('');
                        setRol('Estudiante');
                        setEstado('Activo');
                        setMostrarFormulario(true);
                    }}
                    className="stitch-button"
                    style={{ backgroundColor: '#FFFFFF', color: 'var(--stitch-primary)', fontWeight: '700' }}
                >
                    <span className="material-icons-outlined">person_add</span>
                    Registrar Nuevo Usuario
                </button>
            </div>

            {/* FILTROS */}
            <div className="stitch-card" style={{ padding: '16px', marginBottom: '24px', backgroundColor: '#FFFFFF', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: '200px' }}>
                    <input
                        type="text"
                        placeholder="Buscar por nombre, código o correo..."
                        value={busqueda}
                        onChange={e => setBusqueda(e.target.value)}
                        className="stitch-input"
                        style={{ width: '97%', padding: '10px' }}
                    />
                </div>
                <div>
                    <select
                        value={filtroRol}
                        onChange={e => setFiltroRol(e.target.value)}
                        className="stitch-select"
                        style={{ padding: '10px', minWidth: '180px' }}
                    >
                        <option value="Todos">Todos los Roles</option>
                        <option value="Administrador">Administrador</option>
                        <option value="Control Academico">Control Académico</option>
                        <option value="Profesor">Profesor</option>
                        <option value="Encargado">Encargado (Tutor)</option>
                        <option value="Estudiante">Estudiante</option>
                    </select>
                </div>
            </div>

            {/* TABLA DE USUARIOS */}
            <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF' }}>
                <div style={{ overflowX: 'auto' }}>
                    <table className="stitch-table">
                        <thead>
                            <tr>
                                <th className="stitch-th">Código UA</th>
                                <th className="stitch-th">Nombre Completo</th>
                                <th className="stitch-th">Correo de Recuperación</th>
                                <th className="stitch-th" style={{ textAlign: 'center' }}>Rol</th>
                                <th className="stitch-th" style={{ textAlign: 'center' }}>Estado</th>
                                <th className="stitch-th" style={{ textAlign: 'center' }}>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {usuariosFiltrados.map(u => (
                                <tr key={u.id} className="stitch-tr-hover">
                                    <td className="stitch-td" style={{ fontWeight: '700', color: 'var(--stitch-primary)' }}>{u.codigo_ua}</td>
                                    <td className="stitch-td" style={{ fontWeight: '600' }}>{u.nombre_completo}</td>
                                    <td className="stitch-td">{u.correo}</td>
                                    <td className="stitch-td" style={{ textAlign: 'center' }}>
                                        <span className="stitch-badge" style={{ backgroundColor: '#E2E8F0', color: '#1E293B', fontWeight: '700' }}>{u.rol}</span>
                                    </td>
                                    <td className="stitch-td" style={{ textAlign: 'center' }}>
                                        <span className={`stitch-badge ${u.estado === 'Activo' ? 'stitch-badge-success' : 'stitch-badge-danger'}`}>
                                            {u.estado}
                                        </span>
                                    </td>
                                    <td className="stitch-td" style={{ textAlign: 'center' }}>
                                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                                            <button
                                                type="button"
                                                onClick={() => handleIniciarEdicion(u)}
                                                className="stitch-button-secondary"
                                                style={{ padding: '6px 12px', fontSize: '12px' }}
                                            >
                                                Editar
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleEliminar(u.id)}
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
                            {usuarioEditando ? 'Modificar Datos de Usuario' : 'Registrar Nuevo Usuario'}
                        </h3>
                        <p style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', marginBottom: '20px' }}>
                            Complete los campos requeridos para guardar la información del usuario.
                        </p>
                        <form onSubmit={handleCrearOEditar} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', marginBottom: '6px' }}>
                                    Código UA / Carnet *
                                </label>
                                <input
                                    type="text"
                                    value={codigoUa}
                                    onChange={e => setCodigoUa(e.target.value)}
                                    placeholder="Ej: UA-26501"
                                    required
                                    className="stitch-input"
                                    style={{ width: '95%', padding: '10px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', marginBottom: '6px' }}>
                                    Nombre Completo *
                                </label>
                                <input
                                    type="text"
                                    value={nombre}
                                    onChange={e => setNombre(e.target.value)}
                                    placeholder="Nombre y Apellidos"
                                    required
                                    className="stitch-input"
                                    style={{ width: '95%', padding: '10px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', marginBottom: '6px' }}>
                                    Correo de Recuperación *
                                </label>
                                <input
                                    type="email"
                                    value={correo}
                                    onChange={e => setCorreo(e.target.value)}
                                    placeholder="correo@ejemplo.com"
                                    required
                                    className="stitch-input"
                                    style={{ width: '95%', padding: '10px' }}
                                />
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', marginBottom: '6px' }}>
                                    Rol en la Plataforma *
                                </label>
                                <select
                                    value={rol}
                                    onChange={e => setRol(e.target.value)}
                                    className="stitch-select"
                                    style={{ width: '100%', padding: '10px' }}
                                >
                                    <option value="Administrador">Administrador</option>
                                    <option value="Control Academico">Control Académico</option>
                                    <option value="Profesor">Profesor</option>
                                    <option value="Encargado">Encargado (Tutor)</option>
                                    <option value="Estudiante">Estudiante</option>
                                </select>
                            </div>
                            <div>
                                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--stitch-text-primary)', marginBottom: '6px' }}>
                                    Estado *
                                </label>
                                <select
                                    value={estado}
                                    onChange={e => setEstado(e.target.value)}
                                    className="stitch-select"
                                    style={{ width: '100%', padding: '10px' }}
                                >
                                    <option value="Activo">Activo</option>
                                    <option value="Inactivo">Inactivo</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                                <button type="button" onClick={() => setMostrarFormulario(false)} className="stitch-button-secondary">
                                    Cancelar
                                </button>
                                <button type="submit" className="stitch-button">
                                    Guardar Usuario
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </div>
    );
}
