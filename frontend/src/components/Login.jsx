import React, { useState } from 'react';
import '../styles/StTheme.css';

// ----------------------------------------------------------------------------
// COMPONENTE: PANTALLA DE INICIO DE SESIÓN Y SEGURIDAD (LOGIN + OBLIGATORIO)
// ----------------------------------------------------------------------------
export default function Login({ onLoginSuccess }) {
    const [codigoUa, setCodigoUa] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [error, setError] = useState('');
    const [cargando, setCargando] = useState(false);

    // Flujo secundario: Cambio obligatorio de contrasenas temporales
    const [requiereCambio, setRequiereCambio] = useState(false);
    const [nuevaContrasena, setNuevaContrasena] = useState('');
    const [confirmarContrasena, setConfirmarContrasena] = useState('');
    const [tempToken, setTempToken] = useState('');

    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        try {
            const respuesta = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ codigo_ua: codigoUa, contrasena })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.error || 'Credenciales invalidas');
            }

            // Validar si el usuario requiere cambio obligatorio en su primer ingreso
            if (datos.usuario.es_temporal) {
                setTempToken(datos.token);
                setRequiereCambio(true);
            } else {
                onLoginSuccess(datos.usuario, datos.token);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    // Simulador de Google Sign-In mediante token QA de desarrollo
    const handleGoogleLogin = async () => {
        setError('');
        setCargando(true);

        try {
            const respuesta = await fetch('/api/auth/google', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    idToken: 'mock-google-token',
                    email: 'luisa.ortega@gmail.com' // Vinculado a la cuenta de Encargado UA-26401 (Luisa Ortega Cruz)
                })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.error || 'Error al autenticar con Google');
            }

            if (datos.usuario.es_temporal) {
                setTempToken(datos.token);
                setRequiereCambio(true);
            } else {
                onLoginSuccess(datos.usuario, datos.token);
            }

        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    const handleCambioContrasena = async (e) => {
        e.preventDefault();
        setError('');

        if (nuevaContrasena !== confirmarContrasena) {
            setError('Las contrasenas no coinciden.');
            return;
        }

        if (nuevaContrasena.length < 6) {
            setError('La nueva contrasena debe tener al menos 6 caracteres.');
            return;
        }

        setCargando(true);

        try {
            const respuesta = await fetch('/api/auth/cambio-inicial', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${tempToken}`
                },
                body: JSON.stringify({ nueva_contrasena: nuevaContrasena })
            });

            const datos = await respuesta.json();

            if (!respuesta.ok) {
                throw new Error(datos.error || 'Error al actualizar contrasena.');
            }

            alert('Contrasena actualizada con exito. Por favor inicia sesion con tus nuevas credenciales.');
            setRequiereCambio(false);
            setContrasena('');
            setNuevaContrasena('');
            setConfirmarContrasena('');
            setTempToken('');

        } catch (err) {
            setError(err.message);
        } finally {
            setCargando(false);
        }
    };

    // Estilos del panel de Login Stitch UI
    const containerStyle = {
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 100%)',
        fontFamily: 'var(--stitch-font)',
        padding: '20px'
    };

    const cardStyle = {
        backgroundColor: '#FFFFFF',
        borderRadius: 'var(--stitch-radius-lg)',
        boxShadow: 'var(--stitch-shadow-xl)',
        width: '100%',
        maxWidth: '420px',
        padding: '40px 32px',
        border: '1px solid rgba(255, 255, 255, 0.1)'
    };

    const logoContainerStyle = {
        textAlign: 'center',
        marginBottom: '32px'
    };

    const titleStyle = {
        fontSize: '24px',
        fontWeight: '700',
        color: '#0D2C54',
        marginBottom: '8px'
    };

    const subtitleStyle = {
        fontSize: '14px',
        color: '#64748B',
        marginBottom: '24px'
    };

    const inputGroupStyle = {
        marginBottom: '20px',
        textAlign: 'left'
    };

    const labelStyle = {
        display: 'block',
        fontSize: '13px',
        fontWeight: '600',
        color: '#334155',
        marginBottom: '6px'
    };

    const inputStyle = {
        width: '100%',
        padding: '12px 16px',
        borderRadius: '6px',
        border: '1px solid #CBD5E1',
        fontSize: '14px',
        color: '#1E293B',
        boxSizing: 'border-box',
        transition: 'border-color 0.15s ease'
    };

    const errorBannerStyle = {
        backgroundColor: '#FEF2F2',
        border: '1px solid #FCA5A5',
        borderRadius: '6px',
        padding: '12px',
        color: '#991B1B',
        fontSize: '13px',
        marginBottom: '20px',
        textAlign: 'left',
        fontWeight: '500'
    };

    return (
        <div style={containerStyle}>
            <div style={cardStyle}>
                <div style={logoContainerStyle}>
                    <img
                        src="/logo/logo fondo azul.png"
                        alt="Logo UA"
                        style={{
                            display: 'block',                 // Cambia la imagen a bloque para permitir centrado
                            margin: '0 auto',                 // Centra horizontalmente (0 arriba/abajo, auto a los lados)
                            height: 'auto',
                            width: '120px',
                            borderRadius: '10px'
                        }}
                    ></img>


                    <div
                        style={{
                            height: '3px',
                            width: '100px',
                            backgroundColor: 'var(--stitch-secondary)',
                            margin: '16px auto' // Añade 16px de espacio arriba (imagen) y 16px abajo (texto/contenido)
                        }}
                    ></div>

                    {!requiereCambio ? (
                        <>
                            <h2 style={titleStyle}>Ingresar al Portal</h2>
                            <p style={subtitleStyle}>Ingresa tus credenciales del centro educativo</p>
                        </>
                    ) : (
                        // VERIFICAR SI ESTA BIEN ESTA PARTE 
                        <>
                            <h2 style={titleStyle}>Cambio de Contrasena</h2>
                            <p style={subtitleStyle}>Es tu primer ingreso. Por seguridad, debes cambiar tu contrasena temporal.</p>
                        </>
                    )}
                </div>

                {error && <div style={errorBannerStyle}>{error}</div>}

                {/* Formulario Principal de Login */}
                {!requiereCambio ? (
                    <form onSubmit={handleLoginSubmit}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Codigo Unico UA:</label>
                            <input
                                type="text"
                                placeholder="Ej: UA-26301"
                                value={codigoUa}
                                onChange={(e) => setCodigoUa(e.target.value.toUpperCase())}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Contrasena:</label>
                            <input
                                type="password"
                                placeholder="••••••••"
                                value={contrasena}
                                onChange={(e) => setContrasena(e.target.value)}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={cargando}
                            className="stitch-button"
                            style={{
                                width: '100%',
                                padding: '14px',
                                marginTop: '8px',
                                display: 'flex',            // Activa el modo de caja flexible
                                flexDirection: 'column',    // Organiza los elementos internos uno abajo del otro
                                alignItems: 'center',       // Centra horizontalmente todo el contenido
                                justifyContent: 'center'    // Centra verticalmente todo el contenido
                            }}
                        >
                            {cargando ? 'Iniciando sesion...' : 'Entrar'}
                        </button>

                        <div style={{ display: 'flex', alignItems: 'center', margin: '24px 0' }}>
                            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }}></div>
                            <span style={{ padding: '0 12px', fontSize: '12px', color: '#94A3B8' }}>O</span>
                            <div style={{ flex: 1, height: '1px', backgroundColor: '#E2E8F0' }}></div>
                        </div>

                        {/* Google Login (QA local bypass) */}
                        <button
                            type="button"
                            onClick={handleGoogleLogin}
                            disabled={cargando}
                            style={{
                                width: '100%',
                                padding: '12px',
                                backgroundColor: '#FFFFFF',
                                border: '1px solid #CBD5E1',
                                borderRadius: '6px',
                                color: '#334155',
                                fontWeight: '600',
                                fontSize: '14px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '10px'
                            }}
                        >
                            <svg width="18" height="18" viewBox="0 0 18 18">
                                <path fill="#4285F4" d="M17.64 9.2c0-.63-.06-1.25-.16-1.84H9v3.47h4.84a4.14 4.14 0 0 1-1.8 2.71v2.26h2.91a8.78 8.78 0 0 0 2.69-6.6z" />
                                <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.2l-2.91-2.26a5.52 5.52 0 0 1-8.3-2.92H.78v2.33A9 9 0 0 0 9 18z" />
                                <path fill="#FBBC05" d="M3.75 10.62a5.4 5.4 0 0 1 0-3.24V5.05H.78a9 9 0 0 0 0 7.9l2.97-2.33z" />
                                <path fill="#EA4335" d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .78 5.05l2.97 2.33a5.52 5.52 0 0 1 8.3-2.93z" />
                            </svg>
                            Ingresar con Google
                        </button>
                    </form>
                ) : (
                    /* Formulario de Cambio Obligatorio de Contraseña */
                    <form onSubmit={handleCambioContrasena}>
                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Nueva Contrasena:</label>
                            <input
                                type="password"
                                placeholder="Minimo 6 caracteres"
                                value={nuevaContrasena}
                                onChange={(e) => setNuevaContrasena(e.target.value)}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <div style={inputGroupStyle}>
                            <label style={labelStyle}>Confirmar Nueva Contrasena:</label>
                            <input
                                type="password"
                                placeholder="Confirma tu contrasena"
                                value={confirmarContrasena}
                                onChange={(e) => setConfirmarContrasena(e.target.value)}
                                required
                                style={inputStyle}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={cargando}
                            className="stitch-button"
                            style={{ width: '100%', padding: '12px', marginTop: '8px' }}
                        >
                            {cargando ? 'Actualizando contrasena...' : 'Cambiar y Registrar'}
                        </button>

                        <button
                            type="button"
                            onClick={() => {
                                setRequiereCambio(false);
                                setTempToken('');
                            }}
                            style={{
                                width: '100%',
                                padding: '12px',
                                marginTop: '12px',
                                backgroundColor: 'transparent',
                                border: 'none',
                                color: '#64748B',
                                fontSize: '13px',
                                fontWeight: '500',
                                cursor: 'pointer'
                            }}
                        >
                            Cancelar y regresar
                        </button>
                    </form>
                )}

                {/* Nota para desarrollo local */}
                {/* Nota informativa de Soporte Técnico y Proyecto Final */}
                <div style={{ marginTop: '32px', borderTop: '1px solid #E2E8F0', paddingTop: '16px', fontSize: '11px', color: '#94A3B8', textAlign: 'center' }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px', color: '#64748B' }}>Proyecto Final de Beca CreaIA</div>
                    <div style={{ marginBottom: '2px' }}>Soporte Técnico: [EMAIL_ADDRESS]</div>
                    <div>Creado por: <b>Luz Castillo</b> en el año: <b>2026</b></div>
                </div>

            </div>
        </div>
    );
}
