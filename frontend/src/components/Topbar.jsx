import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/StTheme.css';

// ----------------------------------------------------------------------------
// COMPONENTE: BARRA SUPERIOR (TOPBAR) CON DROPDOWNS DINÁMICOS Y ALERTAS DE HORAS
// ----------------------------------------------------------------------------
export default function Topbar({ userName, userRole, notifications = [], messages = [], onNavigate }) {
    const [activeDropdown, setActiveDropdown] = useState(null); // 'profile' | 'messages' | 'notifications' | null
    const navigate = useNavigate();

    const toggleDropdown = (type) => {
        setActiveDropdown(activeDropdown === type ? null : type);
    };

    const closeAll = () => setActiveDropdown(null);

    // Métodos de navegación cruzados con React Router y Estado Superior
    const handleRedirect = (id, path) => {
        closeAll();
        if (onNavigate) {
            onNavigate(id);
        }
        navigate(path);
    };

    // Estilos del Topbar
    const topbarStyle = {
        height: '70px',
        backgroundColor: '#ffffffff',
        borderBottom: '1px solid var(--stitch-border)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
        position: 'fixed',
        top: 0,
        right: 0,
        left: 0,
        zIndex: 900,
        boxShadow: 'var(--stitch-shadow-sm)',
        gap: '20px'
    };

    const actionIconStyle = {
        color: 'var(--stitch-text-secondary)',
        cursor: 'pointer',
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '8px',
        borderRadius: '50%',
        transition: 'background-color 0.2s ease'
    };

    const badgeStyle = {
        position: 'absolute',
        top: '2px',
        right: '2px',
        backgroundColor: 'var(--stitch-danger)',
        color: '#FFFFFF',
        borderRadius: '50%',
        fontSize: '10px',
        fontWeight: 'bold',
        width: '16px',
        height: '16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
    };

    const popoverStyle = {
        position: 'absolute',
        top: '60px',
        right: '0px',
        width: '340px',
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--stitch-radius-md)',
        boxShadow: 'var(--stitch-shadow-lg)',
        border: '1px solid var(--stitch-border)',
        overflow: 'hidden',
        zIndex: 950,
        display: 'flex',
        flexDirection: 'column'
    };

    const separatorStyle = {
        width: '1px',
        height: '24px',
        backgroundColor: 'var(--stitch-border)',
        margin: '0 4px'
    };

    return (
        <div style={topbarStyle}>
            
            {/* NOTIFICACIONES Y ALERTAS */}
            <div style={{ position: 'relative' }}>
                <div 
                    style={actionIconStyle} 
                    onClick={() => toggleDropdown('notifications')}
                >
                    <span className="material-icons-outlined">notifications</span>
                    {notifications.length > 0 && (
                        <span style={badgeStyle}>{notifications.length}</span>
                    )}
                </div>

                {activeDropdown === 'notifications' && (
                    <div style={popoverStyle}>
                        <div style={{ padding: '16px', borderBottom: '1px solid var(--stitch-border)', fontWeight: '700', color: 'var(--stitch-primary)' }}>
                            Notificaciones e Incidentes
                        </div>
                        <div style={{ maxHeight: '240px', overflowY: 'auto' }}>
                            {notifications.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--stitch-text-secondary)', fontSize: '13px' }}>
                                    No hay notificaciones disponibles
                                </div>
                            ) : (
                                notifications.map((notif, idx) => (
                                    <div 
                                        key={idx} 
                                        style={{ 
                                            padding: '12px 16px', 
                                            borderBottom: '1px solid var(--stitch-border)',
                                            backgroundColor: notif.tipo === 'Alerta' ? '#FEF2F2' : 'transparent' 
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            {notif.tipo === 'Alerta' && (
                                                <span className="material-icons" style={{ fontSize: '16px', color: 'var(--stitch-danger)' }}>error_outline</span>
                                            )}
                                            <span style={{ fontWeight: '600', fontSize: '13px', color: notif.tipo === 'Alerta' ? 'var(--stitch-danger)' : 'var(--stitch-text-primary)' }}>
                                                {notif.titulo}
                                            </span>
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', marginTop: '4px', lineHeight: '1.4' }}>
                                            {notif.mensaje}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                        <button 
                            className="stitch-button" 
                            style={{ margin: '12px', justifyContent: 'center' }}
                            onClick={() => handleRedirect('notificaciones', '/notificaciones')}
                        >
                            Ver todas las notificaciones
                        </button>
                    </div>
                )}
            </div>

            {/* MENSAJERÍA DIRECTA CON ADVERTENCIAS DE HORARIO */}
            <div style={{ position: 'relative' }}>
                <div 
                    style={actionIconStyle} 
                    onClick={() => toggleDropdown('messages')}
                >
                    <span className="material-icons-outlined">chat_bubble_outline</span>
                    {messages.length > 0 && (
                        <span style={badgeStyle}>{messages.length}</span>
                    )}
                </div>

                {activeDropdown === 'messages' && (
                    <div style={popoverStyle}>
                        <div style={{ padding: '16px', borderBottom: '1px solid var(--stitch-border)', fontWeight: '700', color: 'var(--stitch-primary)' }}>
                            Buzón de Chats Recientes
                        </div>
                        <div style={{ maxHeight: '260px', overflowY: 'auto' }}>
                            {messages.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--stitch-text-secondary)', fontSize: '13px' }}>
                                    No hay mensajes disponibles
                                </div>
                            ) : (
                                messages.map((msg, idx) => (
                                    <div 
                                        key={idx} 
                                        style={{ 
                                            padding: '12px 16px', 
                                            borderBottom: '1px solid var(--stitch-border)',
                                            backgroundColor: '#FFFFFF',
                                            cursor: 'pointer'
                                        }}
                                        onClick={() => handleRedirect('mensajeria', '/mensajeria')}
                                    >
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <span style={{ fontWeight: '600', fontSize: '13px', color: 'var(--stitch-primary)' }}>
                                                {msg.emisor_nombre}
                                            </span>
                                            {msg.fueraHorario && (
                                                <span style={{ color: 'var(--stitch-warning)', fontSize: '10px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                                    <span className="material-icons" style={{ fontSize: '12px' }}>schedule</span>
                                                    DIFERIDO
                                                </span>
                                            )}
                                        </div>
                                        <div style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                            {msg.contenido}
                                        </div>
                                        
                                        {/* Advertencia obligatoria si el mensaje se recibió fuera del horario escolar */}
                                        {msg.fueraHorario && (
                                            <div style={{ 
                                                fontSize: '10px', 
                                                color: 'var(--stitch-warning)', 
                                                backgroundColor: '#FFFBEB', 
                                                border: '1px solid #FCD34D', 
                                                padding: '6px', 
                                                borderRadius: '4px', 
                                                marginTop: '6px',
                                                lineHeight: '1.3'
                                            }}>
                                                Mensaje enviado fuera del horario de atención. Es probable que la respuesta sea demorada.
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </div>
                        <button 
                            className="stitch-button" 
                            style={{ margin: '12px', justifyContent: 'center' }}
                            onClick={() => handleRedirect('mensajeria', '/mensajeria')}
                        >
                            Ver todos los mensajes
                        </button>
                    </div>
                )}
            </div>

            {/* SEPARADOR VERTICAL */}
            <div style={separatorStyle}></div>

            {/* PERFIL E INFORMACIÓN DEL USUARIO */}
            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontWeight: '700', fontSize: '14px', color: 'var(--stitch-text-primary)' }}>{userName}</span>
                <span style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)', fontWeight: '500' }}>{userRole}</span>
            </div>

            <div style={{ position: 'relative' }}>
                <div 
                    onClick={() => toggleDropdown('profile')}
                    style={{ 
                        width: '42px', 
                        height: '42px', 
                        borderRadius: '50%', 
                        backgroundColor: '#3B82F6', 
                        color: '#FFFFFF',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 'bold',
                        cursor: 'pointer',
                        boxShadow: 'var(--stitch-shadow-sm)',
                        fontSize: '16px'
                    }}
                >
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </div>

                {activeDropdown === 'profile' && (
                    <div style={{ ...popoverStyle, width: '260px' }}>
                        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', alignItems: 'center', borderBottom: '1px solid var(--stitch-border)' }}>
                            <div style={{ 
                                width: '60px', 
                                height: '60px', 
                                borderRadius: '50%', 
                                backgroundColor: '#0D2C54', 
                                color: '#FFFFFF',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 'bold',
                                fontSize: '24px',
                                marginBottom: '12px'
                            }}>
                                {userName ? userName.charAt(0).toUpperCase() : 'U'}
                            </div>
                            <span style={{ fontWeight: '700', fontSize: '15px' }}>{userName}</span>
                            <span style={{ fontSize: '12px', color: 'var(--stitch-text-secondary)', marginTop: '2px' }}>{userRole}</span>
                        </div>
                        <button 
                            className="stitch-button" 
                            style={{ margin: '16px', justifyContent: 'center' }}
                            onClick={() => handleRedirect('mi-perfil', '/mi-perfil')}
                        >
                            Ver Perfil
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
