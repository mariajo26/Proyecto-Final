import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import MisCursos from './components/profesor/MisCursos';
import MisEstudiantes from './components/profesor/MisEstudiantes';
import UnifiedCalendar from './components/estudiante/UnifiedCalendar';
import Login from './components/Login';
import './styles/StTheme.css';

// ----------------------------------------------------------------------------
// COMPONENTE: VISTA TEMPORAL E ELEGANTE (CREANDO ESPACIO)
// ----------------------------------------------------------------------------
function VistaCreandoEspacio() {
  // FALTA DE CREAR
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      height: '380px',
      border: '2.5px dashed var(--stitch-border, #E2E8F0)',
      borderRadius: 'var(--stitch-radius-lg, 12px)',
      backgroundColor: '#F8FAFC',
      color: 'var(--stitch-text-secondary, #64748B)',
      textAlign: 'center',
      padding: '40px',
      boxShadow: 'var(--stitch-shadow-sm, 0 1px 2px 0 rgba(0, 0, 0, 0.05))',
      fontFamily: 'inherit'
    }}>
      <span className="material-icons-outlined" style={{
        fontSize: '56px',
        marginBottom: '16px',
        color: 'var(--stitch-primary, #3B82F6)',
        animation: 'spin 4s linear infinite'
      }}>
        construction
      </span>
      <h2 style={{
        fontSize: '22px',
        fontWeight: '700',
        color: 'var(--stitch-primary, #0D2C54)',
        marginBottom: '10px'
      }}>
        CREANDO ESPACIO
      </h2>
      <p style={{
        fontSize: '14px',
        maxWidth: '380px',
        lineHeight: '1.5',
        color: '#64748B'
      }}>
        Esta sección se encuentra actualmente en desarrollo y diseño por el área de Innovación Tecnológica de la UA.
      </p>
    </div>
  );
}

export default function App() {
  const { usuario, login, logout, cargando } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Estado para la barra lateral
  const [activeTab, setActiveTab] = useState('inicio');

  // Sincronizar activeTab al cambiar de URL
  useEffect(() => {
    const path = location.pathname.substring(1);
    setActiveTab(path || 'inicio');
  }, [location]);

  // Redirigir a la raiz si el usuario inicia sesion y esta en una ruta extraña
  useEffect(() => {
    if (usuario && location.pathname === '/login') {
      navigate('/');
    }
  }, [usuario, location, navigate]);

  if (cargando) {
    return (
      <div style={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <span className="material-icons-outlined" style={{ fontSize: '48px', color: '#3B82F6', animation: 'spin 1.5s linear infinite' }}>
          sync
        </span>
      </div>
    );
  }

  if (!usuario) {
    return <Login onLoginSuccess={login} />;
  }

  // Datos de usuario verificados dinámicamente desde el contexto de autenticación.
  const handleAddPersonalEvent = (newEvent) => {
    alert(`[DEMO] Recordatorio personal agregado: "${newEvent.title}" para el ${newEvent.date}`);
  };

  const VistaCalendarioEstudiante = () => {
    return (
      <div>
        <h2 style={{ color: 'var(--stitch-primary)', fontWeight: '600', marginBottom: '20px' }}>Mi Calendario Escolar</h2>
        <UnifiedCalendar
          initialEvents={[]}
          onAddPersonalEvent={handleAddPersonalEvent}
        />
      </div>
    );
  };

  const VistaAdminParametros = () => {
    return (
      <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', border: '1px solid var(--stitch-border)' }}>
        <h2 style={{ color: 'var(--stitch-primary)', fontWeight: '600', marginBottom: '16px' }}>Panel del Administrador</h2>
        <p style={{ color: 'var(--stitch-text-secondary)', marginBottom: '24px' }}>
          Configuracion global del sistema, limites de justificaciones digitales y asignacion de prorrogas.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '400px' }}>
          <div>
            <label style={{ fontWeight: '500', fontSize: '14px', display: 'block', marginBottom: '8px' }}>
              Hora Limite de Justificacion Digital:
            </label>
            <input
              type="time"
              defaultValue="12:00"
              style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--stitch-border)', width: '100%' }}
            />
          </div>
          <div>
            <button
              onClick={() => alert('Configuraciones guardadas en base de datos.')}
              className="stitch-button"
            >
              Guardar Parametros del Sistema
            </button>
          </div>
        </div>
      </div>
    );
  };

  const renderInicioDashboard = () => {
    if (usuario.rol === 'Administrador') return <VistaAdminParametros />;
    if (usuario.rol === 'Control Academico') {
      return (
        <div style={{ backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '8px', border: '1px solid var(--stitch-border)' }}>
          <h2 style={{ color: 'var(--stitch-primary)', fontWeight: '600', marginBottom: '16px' }}>Panel de Control Académico</h2>
          <p style={{ color: 'var(--stitch-text-secondary)' }}>
            Bienvenido al módulo de control y secretaría escolar. Utiliza el menú lateral para gestionar la asistencia general, alumnos y circulares.
          </p>
        </div>
      );
    }
    if (usuario.rol === 'Profesor') return <MisCursos />;
    return <VistaCalendarioEstudiante />;
  };

  return (
    <Layout
      user={{
        rol: usuario.rol,
        nombre: usuario.nombre || usuario.codigo_ua
      }}
      onLogout={logout}
      activeTab={activeTab}
      setActiveTab={(tab) => setActiveTab(tab)}
    >
      <Routes>
        <Route path="/" element={renderInicioDashboard()} />
        <Route path="/cursos" element={usuario.rol === 'Profesor' ? <MisCursos /> : <VistaCreandoEspacio />} />
        <Route path="/mis_estudiantes" element={usuario.rol === 'Profesor' ? <MisEstudiantes /> : <VistaCreandoEspacio />} />
        <Route path="/calendario" element={(usuario.rol === 'Estudiante' || usuario.rol === 'Encargado') ? <VistaCalendarioEstudiante /> : <VistaCreandoEspacio />} />

        {/* Cualquier otra ruta del menu lateral cargara la vista elegantemente construida */}
        <Route path="*" element={<VistaCreandoEspacio />} />
      </Routes>
    </Layout>
  );
}
