import React from 'react';
import { Link } from 'react-router-dom';
import '../styles/StTheme.css';

// ----------------------------------------------------------------------------
// COMPONENTE: SIDEBAR IZQUIERDO COLAPSABLE CON MENÚS DINÁMICOS POR ROL
// ----------------------------------------------------------------------------
export default function Sidebar({ userRole, onLogout, activeTab, setActiveTab, isCollapsed, setIsCollapsed }) {

    // Mapeo detallado de opciones de navegación según el rol oficial del usuario autenticado
    const menuOptionsByRole = {
        Administrador: [
            { id: 'inicio', label: 'Inicio', icon: 'home' },
            { id: 'usuarios', label: 'Gestión de Usuarios', icon: 'people' },
            { id: 'cursos', label: 'Cursos y Materias', icon: 'school' },
            { id: 'fichas', label: 'Fichas Médicas/Laborales', icon: 'badge' },
            { id: 'config', label: 'Ajustes del Sistema', icon: 'settings_suggest' }
        ],
        'Control Academico': [
            { id: 'inicio', label: 'Inicio', icon: 'home' },
            { id: 'alumnos', label: 'Alumnos y Familias', icon: 'groups' },
            { id: 'horarios', label: 'Personal y Horarios', icon: 'badge' },
            { id: 'asistencia_gral', label: 'Asistencia General', icon: 'done_all' },
            { id: 'circulares', label: 'Circulares y Firmas', icon: 'assignment' },
            { id: 'quejas', label: 'Atención de Incidentes', icon: 'assignment_late' },
            { id: 'foros_control', label: 'Foro Institucional', icon: 'forum' }
        ],
        Profesor: [
            { id: 'inicio', label: 'Inicio', icon: 'home' },
            { id: 'cursos', label: 'Mis Cursos', icon: 'class' },
            { id: 'mis_estudiantes', label: 'Mis Estudiantes', icon: 'groups' },
            { id: 'horarios', label: 'Horarios de Curso', icon: 'calendar_today' },
            { id: 'calendario', label: 'Calendario Escolar', icon: 'calendar_month' },
            { id: 'rubricas', label: 'Banco de Rúbricas', icon: 'assessment' },
            { id: 'actividades', label: 'Planificación Actividades', icon: 'event_note' },
            { id: 'notas', label: 'Centro Calificaciones', icon: 'grade' },
            { id: 'casos', label: 'Gestión de Casos', icon: 'assignment_late' },
            { id: 'foros', label: 'Foros y Comunidad', icon: 'forum' },
            { id: 'citas', label: 'Agenda y Citas', icon: 'calendar_month' }
        ],
        Encargado: [
            { id: 'inicio', label: 'Inicio', icon: 'home' },
            { id: 'rendimiento', label: 'Rendimiento Académico', icon: 'auto_stories' },
            { id: 'horarios', label: 'Horario de Clases', icon: 'calendar_today' },
            { id: 'calendario', label: 'Calendario Escolar', icon: 'calendar_month' },
            { id: 'circulares', label: 'Circulares y Firmas', icon: 'draw' },
            { id: 'foros_padres', label: 'Foro de Padres', icon: 'forum' },
            { id: 'incidentes', label: 'Reportes y Citas', icon: 'campaign' }
        ],
        Estudiante: [
            { id: 'inicio', label: 'Inicio', icon: 'home' },
            { id: 'cursos', label: 'Mis Cursos', icon: 'class' },
            { id: 'notas', label: 'Mis Calificaciones', icon: 'grade' },
            { id: 'horarios', label: 'Horario de Clases', icon: 'calendar_today' },
            { id: 'calendario', label: 'Calendario Escolar', icon: 'calendar_month' },
            { id: 'foros', label: 'Mis Foros Académicos', icon: 'forum' }
        ]
    };

    const options = menuOptionsByRole[userRole] || [];

    // Estilos del Sidebar
    const sidebarStyle = {
        width: isCollapsed ? '80px' : '260px',
        height: '100vh',
        backgroundColor: '#124281ff', // Azul Profundo UA
        color: '#FFFFFF',
        position: 'fixed',
        top: 0,
        left: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        zIndex: 1000,
        boxShadow: '4px 0 10px rgba(13, 44, 84, 0.15)',
        transition: 'width 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    const headerStyle = {
        padding: '24px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: isCollapsed ? 'center' : 'flex-start',
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
        gap: '12px',
        position: 'relative'
    };

    const toggleBtnStyle = {
        position: 'absolute',
        top: '20px',
        right: isCollapsed ? '-16px' : '12px',
        backgroundColor: '#3B82F6', // Azul Medio UA
        border: 'none',
        borderRadius: '50%',
        width: '32px',
        height: '32px',
        color: '#FFFFFF',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
        zIndex: 1100,
        transition: 'right 0.2s ease'
    };

    const menuContainerStyle = {
        flex: 1,
        padding: '20px 12px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        overflowY: 'auto'
    };

    const menuItemStyle = (isActive) => ({
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        padding: '12px 16px',
        borderRadius: '8px',
        cursor: 'pointer',
        backgroundColor: isActive ? '#3B82F6' : 'transparent',
        color: '#FFFFFF',
        textDecoration: 'none',
        fontWeight: isActive ? '600' : '400',
        transition: 'background-color 0.2s ease'
    });

    const footerStyle = {
        padding: '20px 12px',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px'
    };

    return (
        <div className="no-print" style={sidebarStyle}>
            {/* Cabecera: Logotipo y Título Institucional */}
            <div style={headerStyle}>
                <button
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: isCollapsed ? '-16px' : '12px',
                        backgroundColor: '#8babdeff',
                        border: 'none',
                        borderRadius: '50%',
                        width: '45px',
                        height: '45px',
                        color: '#FFFFFF',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 2px 5px rgba(0, 0, 0, 0.2)',
                        zIndex: 1100,
                        transition: 'right 0.2s ease'
                    }}
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    title={isCollapsed ? "Expandir menú" : "Colapsar menú"}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '25 px' }}>
                        {isCollapsed ? 'chevron_right' : 'chevron_left'}
                    </span>
                </button>

                <img
                    src="/logo/logo sin fondo.png"
                    alt="Logo UA"
                    style={{
                        display: 'block',                 // Cambia la imagen a bloque para permitir centrado
                        margin: '0 auto',                 // Centra horizontalmente (0 arriba/abajo, auto a los lados)
                        width: isCollapsed ? '40px' : '100px',
                        height: 'auto',
                        transition: 'width 0.2s ease'
                    }}
                />

                {!isCollapsed && (
                    <div style={{
                        display: 'block',          // Convierte el contenedor en un bloque rígido
                        width: '100%',             // Ocupa el 100% del espacio disponible del menú
                        margin: '8px auto 0 auto', // Centra la caja completa horizontalmente (8px arriba)
                        textAlign: 'center'        // Alinea los textos internos al centro exacto
                    }}>
                        <span style={{
                            display: 'block',
                            fontSize: '16px',
                            fontWeight: '800',
                            letterSpacing: '0.5px'
                        }}>
                            Unidad Academica<br></br>de Oriente
                        </span>
                        <div style={{
                            display: 'block',
                            fontSize: '11px',
                            color: '#93C5FD',
                            marginTop: '2px',
                            fontWeight: '500'
                        }}>
                            {userRole}
                        </div>
                    </div>


                )}
            </div>

            {/* Listado dinámico de navegación */}
            <div style={menuContainerStyle}>
                {options.map((opt) => {
                    const isActive = activeTab === opt.id;
                    const path = opt.id === 'inicio' ? '/' : `/${opt.id}`;
                    return (
                        <Link
                            key={opt.id}
                            to={path}
                            style={menuItemStyle(isActive)}
                            onClick={() => setActiveTab(opt.id)}
                            title={isCollapsed ? opt.label : ''}
                        >
                            <span className="material-icons-outlined" style={{ fontSize: '22px' }}>
                                {opt.icon}
                            </span>
                            {!isCollapsed && <span style={{ fontSize: '14px' }}>{opt.label}</span>}
                        </Link>
                    );
                })}
            </div>

            {/* Pie de navegación: Configuración y Salida */}
            <div style={footerStyle}>
                <Link
                    to="/config"
                    style={menuItemStyle(activeTab === 'config')}
                    onClick={() => setActiveTab('config')}
                    title={isCollapsed ? "Configuraciones" : ""}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '22px' }}>settings</span>
                    {!isCollapsed && <span style={{ fontSize: '14px' }}>Configuraciones</span>}
                </Link>

                <div
                    style={{ ...menuItemStyle(false), color: '#FCA5A5' }}
                    onClick={onLogout}
                    title={isCollapsed ? "Cerrar sesión" : ""}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '22px', color: '#FCA5A5' }}>
                        logout
                    </span>
                    {!isCollapsed && <span style={{ fontSize: '14px' }}>Cerrar sesión</span>}
                </div>
            </div>
        </div>
    );
}
