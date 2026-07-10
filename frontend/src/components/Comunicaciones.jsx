import React, { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from '../context/AuthContext';
import '../styles/StTheme.css';

// ----------------------------------------------------------------------------
// MÓDULO UNIFICADO: CENTRO DE MENSAJES Y NOTIFICACIONES (STITCH UI)
// ----------------------------------------------------------------------------
export default function Comunicaciones({ defaultTab = 'chats' }) {
    const { usuario, token } = useAuth();
    const [tabActiva, setTabActiva] = useState(defaultTab);
    const [contactoSeleccionado, setContactoSeleccionado] = useState(null);
    const [nuevoMensaje, setNuevoMensaje] = useState('');
    const [sendingStatus, setSendingStatus] = useState(null); // 'sending', 'error', 'success'
    
    // Referencia al final del contenedor de chat para autoscroll
    const chatEndRef = useRef(null);
    const socketRef = useRef(null);

    // Sincronizar tab activa con propiedad externa (ej: clics en Topbar)
    useEffect(() => {
        if (defaultTab) {
            setTabActiva(defaultTab);
        }
    }, [defaultTab]);

    // Autoscroll al recibir o mandar mensaje
    useEffect(() => {
        if (chatEndRef.current) {
            chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [contactoSeleccionado, contactoSeleccionado?.historial]);

    // Cargar historial de chat real desde la base de datos
    useEffect(() => {
        if (!contactoSeleccionado || !token) return;

        fetch(`/api/comunicacion/messages/${contactoSeleccionado.codigo_ua}`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data)) {
                // Convertir el historial de MongoDB a la estructura esperada por la interfaz
                const mappedHistory = data.map(m => ({
                    id: m._id,
                    emisor: m.emisor_id === usuario?.codigo_ua ? 'yo' : 'contacto',
                    contenido: m.contenido,
                    hora: new Date(m.fecha_envio || m.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                }));
                
                setContactoSeleccionado(prev => ({
                    ...prev,
                    historial: mappedHistory
                }));
            }
        })
        .catch(err => console.error('Error al cargar historial:', err));
    }, [contactoSeleccionado?.codigo_ua, token, usuario?.codigo_ua]);

    // Conectar a Socket.io en tiempo real
    useEffect(() => {
        if (!usuario?.codigo_ua || !contactoSeleccionado) return;

        // Conectar a Socket.io
        const socket = io('http://localhost:5000');
        socketRef.current = socket;

        // Unirse a la sala de chat
        const room = [usuario.codigo_ua, contactoSeleccionado.codigo_ua].sort().join('_');
        socket.emit('join_room', room);

        // Escuchar nuevos mensajes
        socket.on('recibir_mensaje', (msg) => {
            if (msg.emisor_id === usuario.codigo_ua) return;

            const nuevoMsgObj = {
                id: msg._id,
                emisor: 'contacto',
                contenido: msg.contenido,
                hora: new Date(msg.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            };

            setContactoSeleccionado(prev => {
                if (prev && prev.codigo_ua === msg.emisor_id) {
                    return {
                        ...prev,
                        ultimoMensaje: nuevoMsgObj.contenido,
                        horaUltimo: nuevoMsgObj.hora,
                        historial: [...(prev.historial || []), nuevoMsgObj]
                    };
                }
                return prev;
            });
        });

        // Limpiar al desmontar o cambiar de contacto (evita memory leaks)
        return () => {
            socket.disconnect();
        };
    }, [contactoSeleccionado?.codigo_ua, usuario?.codigo_ua]);

    // ────────────────────────────────────────────────────────────────────────
    // 💾 ESTADO Y DATOS DE PRUEBA (MOCK DATA)
    // ────────────────────────────────────────────────────────────────────────

    // Listado inicial de contactos reales del sistema
    const [contactos, setContactos] = useState([
        {
            id: 1,
            nombre: 'Jose Ortega Cruz',
            codigo_ua: 'UA-26501',
            rol: 'Estudiante',
            avatarColor: '#3B82F6', // Azul
            ultimoMensaje: 'Cargando último mensaje...',
            horaUltimo: '',
            noLeidos: 0,
            enLinea: true,
            historial: []
        },
        {
            id: 2,
            nombre: 'Andrea Mendez Silva',
            codigo_ua: 'UA-26502',
            rol: 'Estudiante',
            avatarColor: '#10B981', // Verde
            ultimoMensaje: 'Cargando último mensaje...',
            horaUltimo: '',
            noLeidos: 0,
            enLinea: false,
            historial: []
        },
        {
            id: 3,
            nombre: 'Carlos Gomez Estrada',
            codigo_ua: 'UA-26301',
            rol: 'Profesor Guía',
            avatarColor: '#F59E0B', // Naranja/Amarillo
            ultimoMensaje: 'Cargando último mensaje...',
            horaUltimo: '',
            noLeidos: 0,
            enLinea: true,
            historial: []
        },
        {
            id: 4,
            nombre: 'Sofia Lopez Alvarado',
            codigo_ua: 'UA-26302',
            rol: 'Profesor de Materia',
            avatarColor: '#EC4899', // Rosa
            ultimoMensaje: 'Cargando último mensaje...',
            horaUltimo: '',
            noLeidos: 0,
            enLinea: false,
            historial: []
        },
        {
            id: 5,
            nombre: 'Luisa Ortega Cruz',
            codigo_ua: 'UA-26401',
            rol: 'Padre de Familia',
            avatarColor: '#8B5CF6', // Violeta
            ultimoMensaje: 'Cargando último mensaje...',
            horaUltimo: '',
            noLeidos: 0,
            enLinea: true,
            historial: []
        }
    ]);

    // Listado inicial de notificaciones
    const [notificaciones, setNotificaciones] = useState([
        {
            id: 1,
            titulo: 'Justificación Aprobada',
            mensaje: 'La justificación por inasistencia del alumno Carlos Eduardo Méndez para el día 08/07/2026 ha sido aprobada por la dirección.',
            fecha: 'Hoy, 11:30 AM',
            tipo: 'exito', // Success
            leido: false,
            icono: 'check_circle'
        },
        {
            id: 2,
            titulo: 'Alerta de Inasistencia Prolongada',
            mensaje: 'El estudiante Diego Alejandro Ortiz ha registrado 3 inasistencias consecutivas en el curso de Álgebra Lineal.',
            fecha: 'Hoy, 09:15 AM',
            tipo: 'alerta', // Danger/Warning
            leido: false,
            icono: 'error_outline'
        },
        {
            id: 3,
            titulo: 'Cita Confirmada con Padre de Familia',
            mensaje: 'El encargado de la alumna Sofia Isabel Castro ha confirmado su asistencia a la cita de tutoría mañana a las 11:00 AM.',
            fecha: 'Ayer, 04:20 PM',
            tipo: 'info', // Info
            leido: true,
            icono: 'campaign'
        },
        {
            id: 4,
            titulo: 'Nuevo Foro Académico Creado',
            mensaje: 'Se ha abierto el foro institucional: "Retroalimentación sobre Evaluaciones de Matemáticas" para discusiones académicas.',
            fecha: 'Hace 2 días',
            tipo: 'neutro',
            leido: true,
            icono: 'forum'
        }
    ]);

    // Establecer primer contacto activo por defecto si no hay ninguno
    useEffect(() => {
        if (contactos.length > 0 && !contactoSeleccionado) {
            const firstValid = contactos.find(c => c.codigo_ua !== usuario?.codigo_ua);
            if (firstValid) {
                setContactoSeleccionado(firstValid);
            }
        }
    }, [contactos, contactoSeleccionado, usuario?.codigo_ua]);

    // Cargar notificaciones reales desde el backend
    useEffect(() => {
        if (!token) return;

        fetch('/api/comunicacion/notifications', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                const mappedNotifs = data.map(n => {
                    let tipoVal = 'neutro';
                    if (n.tipo === 'Alerta') tipoVal = 'alerta';
                    else if (n.modulo_origen === 'Citas') tipoVal = 'info';
                    else if (n.modulo_origen === 'Asistencia') tipoVal = 'exito';

                    let iconoVal = 'notifications';
                    if (n.modulo_origen === 'Asistencia') iconoVal = 'check_circle';
                    else if (n.modulo_origen === 'Calificaciones') iconoVal = 'grade';
                    else if (n.modulo_origen === 'Circulares') iconoVal = 'draw';
                    else if (n.modulo_origen === 'Foros') iconoVal = 'forum';
                    else if (n.modulo_origen === 'Citas') iconoVal = 'campaign';
                    else if (n.modulo_origen === 'Quejas') iconoVal = 'assignment_late';

                    const fechaFormato = new Date(n.fecha_creacion).toLocaleDateString() + ' ' + 
                                         new Date(n.fecha_creacion).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                    return {
                        id: n._id,
                        titulo: n.titulo,
                        mensaje: n.mensaje,
                        fecha: fechaFormato,
                        tipo: tipoVal,
                        leido: n.leido,
                        icono: iconoVal
                    };
                });
                setNotificaciones(mappedNotifs);
            }
        })
        .catch(err => console.error('Error al cargar notificaciones reales:', err));
    }, [token]);

    // Cargar conversaciones y contactos con historial reciente desde el backend
    useEffect(() => {
        if (!token || !usuario?.codigo_ua) return;

        fetch('/api/comunicacion/messages', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .then(data => {
            if (Array.isArray(data) && data.length > 0) {
                const uniqueInterlocutors = {};
                
                data.forEach(m => {
                    const interlocutorCode = m.emisor_id === usuario?.codigo_ua ? m.receptor_id : m.emisor_id;
                    if (!uniqueInterlocutors[interlocutorCode]) {
                        uniqueInterlocutors[interlocutorCode] = {
                            id: m.id,
                            nombre: m.emisor_nombre || interlocutorCode,
                            codigo_ua: interlocutorCode,
                            rol: interlocutorCode.startsWith('UA-10') || interlocutorCode.startsWith('UA-263') ? 'Docente / Staff' : 'Estudiante / Tutor',
                            avatarColor: '#3B82F6',
                            ultimoMensaje: m.contenido,
                            horaUltimo: new Date(m.fecha_envio).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                            noLeidos: 0,
                            enLinea: false,
                            historial: []
                        };
                    }
                });

                const loadedContacts = Object.values(uniqueInterlocutors);
                if (loadedContacts.length > 0) {
                    setContactos(prev => {
                        const merged = [...loadedContacts];
                        prev.forEach(p => {
                            if (!merged.some(m => m.codigo_ua === p.codigo_ua)) {
                                merged.push(p);
                            }
                        });
                        return merged;
                    });
                }
            }
        })
        .catch(err => console.error('Error al obtener bandeja de entrada de mensajes:', err));
    }, [token, usuario?.codigo_ua]);

    // ────────────────────────────────────────────────────────────────────────
    // 🔄 LÓGICA DE INTERACCIÓN (CHATS)
    // ────────────────────────────────────────────────────────────────────────
    
    // Seleccionar un contacto de la lista
    const handleSeleccionarContacto = (c) => {
        setContactoSeleccionado(c);
        // Marcar mensajes como leídos en local
        setContactos(prev => prev.map(item => {
            if (item.id === c.id) {
                return { ...item, noLeidos: 0 };
            }
            return item;
        }));
    };

    // Enviar un nuevo mensaje
    const handleEnviarMensaje = (e) => {
        e.preventDefault();
        if (!nuevoMensaje.trim() || !contactoSeleccionado) return;

        const msjTexto = nuevoMensaje.trim();
        setNuevoMensaje('');
        setSendingStatus('sending');

        // 1. Pintar localmente en la interfaz de usuario
        const nuevoMsgObj = {
            id: Date.now(),
            emisor: 'yo',
            contenido: msjTexto,
            hora: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        };

        const historialActualizado = [...(contactoSeleccionado.historial || []), nuevoMsgObj];

        // Actualizar la lista general de contactos (mover arriba con el último mensaje)
        setContactos(prev => {
            const list = prev.map(item => {
                if (item.codigo_ua === contactoSeleccionado.codigo_ua) {
                    return {
                        ...item,
                        ultimoMensaje: msjTexto,
                        horaUltimo: nuevoMsgObj.hora,
                        historial: historialActualizado
                    };
                }
                return item;
            });
            const activeContact = list.find(item => item.codigo_ua === contactoSeleccionado.codigo_ua);
            const otherContacts = list.filter(item => item.codigo_ua !== contactoSeleccionado.codigo_ua);
            return activeContact ? [activeContact, ...otherContacts] : list;
        });

        // Mantener el contacto seleccionado con los datos actualizados
        setContactoSeleccionado(prev => ({
            ...prev,
            ultimoMensaje: msjTexto,
            horaUltimo: nuevoMsgObj.hora,
            historial: historialActualizado
        }));

        // 2. Guardar en Base de Datos vía petición HTTP POST
        fetch('/api/comunicacion/mensajes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                receptor_id: contactoSeleccionado.codigo_ua,
                contenido: msjTexto
            })
        })
        .then(res => {
            if (!res.ok) throw new Error('No se pudo guardar el mensaje.');
            return res.json();
        })
        .then(data => {
            setSendingStatus('success');
            setTimeout(() => setSendingStatus(null), 2000);
        })
        .catch(err => {
            console.error('Error al guardar mensaje en BD:', err);
            setSendingStatus('error');
        });
    };

    // ────────────────────────────────────────────────────────────────────────
    // 🔔 LÓGICA DE INTERACCIÓN (NOTIFICACIONES)
    // ────────────────────────────────────────────────────────────────────────

    // Marcar una notificación individual como leída
    const handleMarcarLeida = (id) => {
        setNotificaciones(prev => prev.map(n => {
            if (n.id === id) {
                return { ...n, leido: true };
            }
            return n;
        }));

        fetch(`/api/comunicacion/notifications/${id}/read`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .catch(err => console.error('Error al marcar notificacion leida en backend:', err));
    };

    // Marcar todas las notificaciones como leídas
    const handleMarcarTodasLeidas = () => {
        setNotificaciones(prev => prev.map(n => ({ ...n, leido: true })));

        fetch('/api/comunicacion/notifications/read-all', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        })
        .then(res => res.json())
        .catch(err => console.error('Error al marcar todas las notificaciones como leidas:', err));
    };

    // Contadores rápidos para los badges en las pestañas
    const totalChatsNoLeidos = contactos.reduce((acc, c) => acc + c.noLeidos, 0);
    const totalNotifsNoLeidas = notificaciones.filter(n => !n.leido).length;

    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 160px)', minHeight: '520px' }}>
            
            {/* PESTAÑAS PRINCIPALES DE COMUNICACIÓN */}
            <div className="stitch-tabs-container" style={{ marginBottom: 0, paddingBottom: 0, borderBottom: '1.5px solid var(--stitch-border)' }}>
                <button
                    onClick={() => setTabActiva('chats')}
                    className={`stitch-tab-btn ${tabActiva === 'chats' ? 'stitch-tab-btn-active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '14px', fontSize: '14.5px' }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '20px' }}>chat_bubble_outline</span>
                    <span>Bandeja de Chats</span>
                    {totalChatsNoLeidos > 0 && (
                        <span className="stitch-badge stitch-badge-danger" style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', marginLeft: '4px' }}>
                            {totalChatsNoLeidos}
                        </span>
                    )}
                </button>

                <button
                    onClick={() => setTabActiva('notificaciones')}
                    className={`stitch-tab-btn ${tabActiva === 'notificaciones' ? 'stitch-tab-btn-active' : ''}`}
                    style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingBottom: '14px', fontSize: '14.5px' }}
                >
                    <span className="material-icons-outlined" style={{ fontSize: '20px' }}>notifications</span>
                    <span>Centro de Notificaciones</span>
                    {totalNotifsNoLeidas > 0 && (
                        <span className="stitch-badge stitch-badge-warning" style={{ fontSize: '10px', padding: '2px 6px', borderRadius: '10px', marginLeft: '4px', backgroundColor: 'var(--stitch-warning)', color: '#FFFFFF' }}>
                            {totalNotifsNoLeidas}
                        </span>
                    )}
                </button>
            </div>

            {/* ── SECCIÓN 1: VISTA DE BANDEJA DE CHATS ───────────────────────── */}
            {tabActiva === 'chats' && (
                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '20px', flex: 1, overflow: 'hidden' }}>
                    
                    {/* LISTA LATERAL DE CONTACTOS */}
                    <div className="stitch-card" style={{ padding: '16px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                        <h4 className="stitch-title-font" style={{ margin: '0 0 16px 0', color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '15px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span className="material-icons-outlined">forum</span>
                            Conversaciones
                        </h4>
                        
                        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '6px' }} className="no-print">
                            {contactos.filter(c => c.codigo_ua !== usuario?.codigo_ua).map(c => {
                                const isSelected = contactoSeleccionado?.id === c.id;
                                return (
                                    <div
                                        key={c.id}
                                        onClick={() => handleSeleccionarContacto(c)}
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '12px',
                                            padding: '12px',
                                            borderRadius: '8px',
                                            cursor: 'pointer',
                                            backgroundColor: isSelected ? 'rgba(59, 130, 246, 0.08)' : 'transparent',
                                            border: `1.5px solid ${isSelected ? 'rgba(59, 130, 246, 0.2)' : 'transparent'}`,
                                            transition: 'all 0.2s ease',
                                        }}
                                        className="contact-item-hover"
                                    >
                                        {/* Avatar Circular */}
                                        <div style={{ position: 'relative' }}>
                                            <div style={{
                                                width: '42px',
                                                height: '42px',
                                                borderRadius: '50%',
                                                backgroundColor: c.avatarColor,
                                                color: '#FFFFFF',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                fontWeight: '700',
                                                fontSize: '15px'
                                            }}>
                                                {c.nombre.charAt(0)}
                                            </div>
                                            {/* Indicador de Conexión en Línea */}
                                            {c.enLinea && (
                                                <div style={{
                                                    position: 'absolute',
                                                    bottom: '0',
                                                    right: '0',
                                                    width: '12px',
                                                    height: '12px',
                                                    borderRadius: '50%',
                                                    backgroundColor: '#10B981', // Verde éxito
                                                    border: '2px solid #FFFFFF'
                                                }} />
                                            )}
                                        </div>

                                        {/* Información del Contacto */}
                                        <div style={{ flex: 1, minWidth: 0 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px' }}>
                                                <span style={{ fontSize: '13px', fontWeight: c.noLeidos > 0 ? '700' : '600', color: 'var(--stitch-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                                    {c.nombre}
                                                </span>
                                                <span style={{ fontSize: '10px', color: 'var(--stitch-text-secondary)' }}>
                                                    {c.horaUltimo}
                                                </span>
                                            </div>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                <p style={{
                                                    margin: 0,
                                                    fontSize: '11px',
                                                    color: c.noLeidos > 0 ? 'var(--stitch-text-primary)' : 'var(--stitch-text-secondary)',
                                                    fontWeight: c.noLeidos > 0 ? '600' : '400',
                                                    whiteSpace: 'nowrap',
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    maxWidth: '180px'
                                                }}>
                                                    {c.ultimoMensaje}
                                                </p>
                                                {c.noLeidos > 0 && (
                                                    <span className="stitch-badge stitch-badge-danger" style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '8px' }}>
                                                        {c.noLeidos}
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* VENTANA DE CONVERSACIÓN ACTIVA */}
                    <div className="stitch-card" style={{ padding: 0, backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
                        {contactoSeleccionado ? (
                            <>
                                {/* Encabezado del Chat */}
                                <div style={{
                                    padding: '16px 20px',
                                    borderBottom: '1px solid var(--stitch-border)',
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                    backgroundColor: '#FAFBFD'
                                }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                        <div style={{
                                            width: '40px',
                                            height: '40px',
                                            borderRadius: '50%',
                                            backgroundColor: contactoSeleccionado.avatarColor,
                                            color: '#FFFFFF',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            fontWeight: '700'
                                        }}>
                                            {contactoSeleccionado.nombre.charAt(0)}
                                        </div>
                                        <div>
                                            <h5 className="stitch-title-font" style={{ margin: 0, fontSize: '14.5px', color: 'var(--stitch-primary)', fontWeight: '700' }}>
                                                {contactoSeleccionado.nombre}
                                            </h5>
                                            <span style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                                {contactoSeleccionado.rol} • 
                                                <span style={{
                                                    display: 'inline-block',
                                                    width: '7px',
                                                    height: '7px',
                                                    borderRadius: '50%',
                                                    backgroundColor: contactoSeleccionado.enLinea ? '#10B981' : '#94A3B8'
                                                }} />
                                                {contactoSeleccionado.enLinea ? 'En línea' : 'Ausente'}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Código identificador único del estudiante o docente */}
                                    <span style={{ fontSize: '11px', backgroundColor: '#E2E8F0', padding: '3px 8px', borderRadius: '4px', color: 'var(--stitch-text-primary)', fontWeight: '700' }}>
                                        {contactoSeleccionado.codigo_ua}
                                    </span>
                                </div>

                                {/* Historial de Burbujas */}
                                <div style={{
                                    flex: 1,
                                    padding: '20px',
                                    overflowY: 'auto',
                                    backgroundColor: '#F8FAFC',
                                    display: 'flex',
                                    flexDirection: 'column',
                                    gap: '14px'
                                }}>
                                    {contactoSeleccionado.historial.map(m => {
                                        const soyYo = m.emisor === 'yo';
                                        return (
                                            <div
                                                key={m.id}
                                                style={{
                                                    alignSelf: soyYo ? 'flex-end' : 'flex-start',
                                                    maxWidth: '70%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: soyYo ? 'flex-end' : 'flex-start'
                                                }}
                                            >
                                                {/* Burbuja */}
                                                <div style={{
                                                    padding: '10px 16px',
                                                    borderRadius: soyYo ? '16px 16px 2px 16px' : '16px 16px 16px 2px',
                                                    backgroundColor: soyYo ? 'var(--stitch-primary)' : '#FFFFFF',
                                                    color: soyYo ? '#FFFFFF' : 'var(--stitch-text-primary)',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
                                                    border: soyYo ? 'none' : '1px solid var(--stitch-border)',
                                                    fontSize: '13px',
                                                    lineHeight: '1.5'
                                                }}>
                                                    {m.contenido}
                                                </div>
                                                
                                                {/* Hora de envío */}
                                                <span style={{ fontSize: '10px', color: 'var(--stitch-text-secondary)', marginTop: '4px', padding: '0 4px' }}>
                                                    {m.hora}
                                                </span>
                                            </div>
                                        );
                                    })}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Formulario para enviar mensajes */}
                                <form
                                    onSubmit={handleEnviarMensaje}
                                    style={{
                                        padding: '16px',
                                        borderTop: '1px solid var(--stitch-border)',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        backgroundColor: '#FAFBFD'
                                    }}
                                >
                                    <div style={{ display: 'flex', gap: '12px', alignItems: 'center', width: '100%' }}>
                                        <input
                                            type="text"
                                            value={nuevoMensaje}
                                            onChange={e => setNuevoMensaje(e.target.value)}
                                            className="stitch-input"
                                            placeholder="Escribe un mensaje aquí..."
                                            style={{ flex: 1, height: '42px', marginBottom: 0 }}
                                            required
                                        />
                                        <button
                                            type="submit"
                                            className="stitch-button"
                                            style={{ height: '42px', padding: '0 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
                                            disabled={sendingStatus === 'sending'}
                                        >
                                            <span className="material-icons-outlined" style={{ fontSize: '18px' }}>send</span>
                                            <span>Enviar</span>
                                        </button>
                                    </div>
                                    {sendingStatus && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: sendingStatus === 'sending' ? 'var(--stitch-text-secondary)' : (sendingStatus === 'error' ? 'var(--stitch-danger)' : '#10B981') }}>
                                            {sendingStatus === 'sending' && <span>Enviando mensaje...</span>}
                                            {sendingStatus === 'error' && <span>⚠️ Error al enviar. No se guardó en BD.</span>}
                                            {sendingStatus === 'success' && <span>✓ Mensaje persistido y transmitido en tiempo real.</span>}
                                        </div>
                                    )}
                                </form>
                            </>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', flex: 1, padding: '40px', color: 'var(--stitch-text-secondary)', backgroundColor: '#F8FAFC' }}>
                                <span className="material-icons-outlined" style={{ fontSize: '48px', marginBottom: '12px', color: 'var(--stitch-border)' }}>chat</span>
                                <p style={{ fontSize: '14px', margin: 0 }}>Selecciona un contacto lateral para iniciar la mensajería.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* ── SECCIÓN 2: VISTA DEL CENTRO DE NOTIFICACIONES ──────────────── */}
            {tabActiva === 'notificaciones' && (
                <div className="stitch-card" style={{ padding: '24px', backgroundColor: '#FFFFFF', flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                    
                    {/* Cabecera y Acciones Rápidas */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span className="material-icons-outlined" style={{ color: 'var(--stitch-primary)', fontSize: '24px' }}>notifications</span>
                            <h4 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '16px' }}>
                                Historial de Notificaciones Recibidas
                            </h4>
                        </div>
                        {totalNotifsNoLeidas > 0 && (
                            <button
                                onClick={handleMarcarTodasLeidas}
                                className="stitch-button-secondary"
                                style={{
                                    padding: '6px 12px',
                                    fontSize: '12.5px',
                                    borderColor: 'var(--stitch-secondary)',
                                    color: 'var(--stitch-secondary)',
                                    fontWeight: '700'
                                }}
                            >
                                <span className="material-icons-outlined" style={{ fontSize: '16px', marginRight: '6px' }}>done_all</span>
                                Marcar todas como leídas
                            </button>
                        )}
                    </div>

                    {/* Lista cronológica */}
                    <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                        {notificaciones.length === 0 ? (
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', color: 'var(--stitch-text-secondary)' }}>
                                <span className="material-icons-outlined" style={{ fontSize: '48px', marginBottom: '12px', color: 'var(--stitch-border)' }}>notifications_off</span>
                                <p style={{ fontSize: '14px', margin: 0 }}>No se han registrado notificaciones en tu bandeja.</p>
                            </div>
                        ) : (
                            notificaciones.map(n => {
                                // Seleccionar estilos según el tipo de notificación y si ya fue leída
                                let colorClase = 'rgba(71, 85, 105, 0.05)';
                                let textoClase = '#475569';
                                let bordeClase = '1.5px solid var(--stitch-border)';

                                if (!n.leido) {
                                    if (n.tipo === 'exito') {
                                        colorClase = 'rgba(16, 185, 129, 0.06)';
                                        textoClase = '#10B981';
                                        bordeClase = '1.5px solid rgba(16, 185, 129, 0.25)';
                                    } else if (n.tipo === 'alerta') {
                                        colorClase = 'rgba(239, 68, 68, 0.06)';
                                        textoClase = '#EF4444';
                                        bordeClase = '1.5px solid rgba(239, 68, 68, 0.25)';
                                    } else if (n.tipo === 'info') {
                                        colorClase = 'rgba(59, 130, 246, 0.06)';
                                        textoClase = '#3B82F6';
                                        bordeClase = '1.5px solid rgba(59, 130, 246, 0.25)';
                                    }
                                }

                                return (
                                    <div
                                        key={n.id}
                                        style={{
                                            padding: '16px',
                                            borderRadius: '8px',
                                            backgroundColor: n.leido ? '#FFFFFF' : colorClase,
                                            border: n.leido ? '1px solid var(--stitch-border)' : bordeClase,
                                            display: 'flex',
                                            gap: '16px',
                                            alignItems: 'flex-start',
                                            transition: 'all 0.2s ease',
                                            boxShadow: n.leido ? 'none' : '0 1px 3px rgba(0, 0, 0, 0.02)'
                                        }}
                                    >
                                        {/* Icono de Tipo */}
                                        <div style={{
                                            backgroundColor: n.leido ? '#F1F5F9' : colorClase,
                                            color: n.leido ? 'var(--stitch-text-secondary)' : textoClase,
                                            padding: '8px',
                                            borderRadius: '8px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}>
                                            <span className="material-icons-outlined" style={{ fontSize: '20px' }}>
                                                {n.icono}
                                            </span>
                                        </div>

                                        {/* Detalle de la Alerta */}
                                        <div style={{ flex: 1 }}>
                                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '4px' }}>
                                                <h5 className="stitch-title-font" style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: 'var(--stitch-primary)' }}>
                                                    {n.titulo}
                                                    {!n.leido && (
                                                        <span className="stitch-badge stitch-badge-urgent" style={{ fontSize: '9px', padding: '1px 5px', borderRadius: '4px', marginLeft: '8px', textTransform: 'uppercase', verticalAlign: 'middle' }}>
                                                            Nueva
                                                        </span>
                                                    )}
                                                </h5>
                                                <span style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)', fontWeight: '500' }}>
                                                    {n.fecha}
                                                </span>
                                            </div>
                                            <p style={{ margin: 0, fontSize: '12.5px', color: 'var(--stitch-text-primary)', lineHeight: '1.5' }}>
                                                {n.mensaje}
                                            </p>
                                        </div>

                                        {/* Acción individual para marcar leída */}
                                        {!n.leido && (
                                            <button
                                                onClick={() => handleMarcarLeida(n.id)}
                                                className="stitch-button-secondary"
                                                style={{
                                                    padding: '4px 8px',
                                                    fontSize: '11px',
                                                    border: '1px solid var(--stitch-border)',
                                                    borderRadius: '4px',
                                                    color: 'var(--stitch-text-primary)'
                                                }}
                                                title="Marcar como leída"
                                            >
                                                Marcar Leída
                                            </button>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
