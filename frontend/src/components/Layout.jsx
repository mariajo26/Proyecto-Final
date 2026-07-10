import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { useAuth } from '../context/AuthContext';
import '../styles/StTheme.css';

// ----------------------------------------------------------------------------
// COMPONENTE: LAYOUT GLOBAL CON CONSULTAS REALES A LA BASE DE DATOS (API)
// ----------------------------------------------------------------------------
export default function Layout({ user, onLogout, children, activeTab, setActiveTab }) {
    const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
    const navigate = useNavigate();
    const { token } = useAuth();

    // Estados para notificaciones y mensajes cargados dinámicamente de la base de datos
    const [notifications, setNotifications] = useState([]);
    const [messages, setMessages] = useState([]);

    // Cargar notificaciones y mensajes desde el backend en tiempo real
    useEffect(() => {
        if (!token) return;

        // Cargar Notificaciones
        fetch('/api/comunicacion/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setNotifications(data);
            }
        })
        .catch(err => console.error('Error al cargar notificaciones reales:', err));

        // Cargar Mensajes
        fetch('/api/comunicacion/messages', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                setMessages(data);
            }
        })
        .catch(err => console.error('Error al cargar mensajes reales:', err));
    }, [token, activeTab]); // Recargar también al navegar entre secciones

    // Estilos del Layout
    const layoutStyle = {
        display: 'flex',
        minHeight: '100vh',
        backgroundColor: '#F8FAFC', // Warm Light Grey UA
        fontFamily: 'var(--stitch-font)'
    };

    const mainContentStyle = {
        flex: 1,
        marginLeft: isSidebarCollapsed ? '80px' : '260px',
        marginTop: '70px',
        padding: '32px',
        transition: 'margin-left 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
        minWidth: 0
    };

    const topbarWrapperStyle = {
        position: 'fixed',
        top: 0,
        right: 0,
        left: isSidebarCollapsed ? '80px' : '260px',
        height: '70px',
        zIndex: 900,
        transition: 'left 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
    };

    const breadcrumbStyle = {
        fontSize: '12px',
        color: 'var(--stitch-text-secondary)',
        marginBottom: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '6px'
    };

    const titleStyle = {
        fontSize: '26px',
        fontWeight: '800',
        color: 'var(--stitch-primary)',
        margin: 0
    };

    // Mapeo dinámico de breadcrumbs
    const getBreadcrumbs = () => {
        const list = [{ label: 'Inicio', path: '/' }];
        if (activeTab && activeTab.toLowerCase() !== 'inicio') {
            list.push({
                label: activeTab.charAt(0).toUpperCase() + activeTab.slice(1),
                path: `/${activeTab}`
            });
        }

        return (
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                {list.map((item, idx) => (
                    <React.Fragment key={idx}>
                        {idx > 0 && <span style={{ color: 'var(--stitch-text-secondary)' }}>&gt;</span>}
                        <Link 
                            to={item.path} 
                            onClick={() => setActiveTab(item.label.toLowerCase() === 'inicio' ? 'inicio' : activeTab)}
                            style={{ 
                                color: idx === list.length - 1 ? 'var(--stitch-primary)' : 'var(--stitch-text-secondary)',
                                fontWeight: idx === list.length - 1 ? '600' : '400',
                                textDecoration: 'none',
                                transition: 'color 0.2s ease'
                            }}
                        >
                            {item.label}
                        </Link>
                    </React.Fragment>
                ))}
            </div>
        );
    };

    const getPageTitle = () => {
        switch (activeTab) {
            case 'inicio': return 'Panel de Control General';
            case 'usuarios': return 'Control de Usuarios (CRUD)';
            case 'cursos': return 'Planificación de Cursos y Materias';
            case 'fichas': return 'Fichas Médicas y Laborales';
            case 'asistencia_gral': return 'Control de Asistencias del Día';
            case 'circulares': return 'Circulares y Autorizaciones Especiales';
            case 'rendimiento': return 'Rendimiento y Calificaciones Académicas';
            case 'calendario': return 'Calendario Escolar Unificado';
            case 'foros': return 'Centro de Foros y Comunidad UA';
            case 'incidentes': return 'Buzón de Incidentes y Citas';
            case 'notas': return 'Mis Notas de Ciclo';
            case 'agenda': return 'Mi Agenda de Actividades';
            case 'asistencia': return 'Registro de Asistencias y Faltas';
            case 'mi-perfil': return 'Ficha de Perfil Personal';
            case 'notificaciones': return 'Centro de Alertas y Notificaciones';
            case 'mensajeria': return 'Buzón de Mensajes Directos';
            case 'crear-foro': return 'Crear Espacio de Foro';
            default: return 'UA - Sistema Escolar';
        }
    };

    // Acción para el botón Crear Espacio (Para foros grupales del profesor)
    const handleCreateForumSpace = () => {
        setActiveTab('crear-foro');
        navigate('/crear-foro');
    };

    return (
        <div style={layoutStyle}>
            {/* Sidebar Izquierdo */}
            <Sidebar 
                userRole={user.rol} 
                onLogout={onLogout} 
                activeTab={activeTab} 
                setActiveTab={setActiveTab}
                isCollapsed={isSidebarCollapsed}
                setIsCollapsed={setIsSidebarCollapsed}
            />

            {/* Barra Superior */}
            <div style={topbarWrapperStyle}>
                <Topbar 
                    userName={user.nombre} 
                    userRole={user.rol} 
                    notifications={notifications}
                    messages={messages}
                    onNavigate={(tab) => setActiveTab(tab)}
                />
            </div>

            {/* Área de Contenido Central */}
            <main style={mainContentStyle}>
                {/* Ruta de navegación (Breadcrumbs) */}
                <div style={breadcrumbStyle}>
                    <span className="material-icons-outlined" style={{ fontSize: '14px', marginTop: '-2px' }}>home</span>
                    {getBreadcrumbs()}
                </div>

                {/* Título de la Página y Acciones Rápidas */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
                    <h1 style={titleStyle}>{getPageTitle()}</h1>
                    
                    {/* Botón dinámico "Crear Espacio" exclusivo para Profesor en el módulo de foros */}
                    {activeTab === 'foros' && user.rol === 'Profesor' && (
                        <button 
                            onClick={handleCreateForumSpace}
                            className="stitch-button"
                            style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 20px' }}
                        >
                            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>add</span>
                            Crear Espacio
                        </button>
                    )}
                </div>

                {/* Renderizar Contenido Dinámico */}
                <div className="stitch-transition" style={{ position: 'relative' }}>
                    {children}
                </div>
            </main>
        </div>
    );
}
