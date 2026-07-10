import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [usuario, setUsuario] = useState(null);
    const [token, setToken] = useState('');
    const [cargando, setCargando] = useState(true);

    useEffect(() => {
        // Cargar sesion existente del localStorage al iniciar
        const sessionToken = localStorage.getItem('ua_session_token');
        const sessionUser = localStorage.getItem('ua_session_user');
        
        if (sessionToken && sessionUser) {
            setToken(sessionToken);
            setUsuario(JSON.parse(sessionUser));
        }
        setCargando(false);
    }, []);

    const login = (user, jwtToken) => {
        setUsuario(user);
        setToken(jwtToken);
        localStorage.setItem('ua_session_token', jwtToken);
        localStorage.setItem('ua_session_user', JSON.stringify(user));
    };

    const logout = () => {
        setUsuario(null);
        setToken('');
        localStorage.removeItem('ua_session_token');
        localStorage.removeItem('ua_session_user');
    };

    // Extraer inicial del nombre del usuario de forma dinamica
    const getInicial = () => {
        if (usuario && usuario.nombre) {
            return usuario.nombre.charAt(0).toUpperCase();
        }
        if (usuario && usuario.codigo_ua) {
            return usuario.codigo_ua.charAt(3) || 'U';
        }
        return 'U';
    };

    return (
        <AuthContext.Provider value={{ usuario, token, login, logout, getInicial, cargando }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth debe ser usado dentro de un AuthProvider');
    }
    return context;
}
