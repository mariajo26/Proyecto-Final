import React, { useState, useEffect } from 'react';
import { Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import MisCursos from './components/profesor/MisCursos';
import MisEstudiantes from './components/profesor/MisEstudiantes';
import PlanificacionActividades from './components/profesor/PlanificacionActividades';
import CentroCalificaciones from './components/profesor/CentroCalificaciones';
import BancoRubricas from './components/profesor/BancoRubricas';
import GestionTareas from './components/profesor/GestionTareas';
import LibretaNotasCurso from './components/profesor/LibretaNotasCurso';
import GestionCasos from './components/profesor/GestionCasos';
import ForosComunidad from './components/profesor/ForosComunidad';
import AgendaCitas from './components/profesor/AgendaCitas';
import HorariosCurso from './components/profesor/HorariosCurso';
import WeeklyScheduleCalendar from './components/WeeklyScheduleCalendar';
import RoleCalendar from './components/RoleCalendar';
import Login from './components/Login';
import Comunicaciones from './components/Comunicaciones';
import RendimientoAcademico from './components/encargado/RendimientoAcademico';
import CircularFirmas from './components/encargado/CircularFirmas';
import GestionCasosEncargado from './components/encargado/GestionCasos';
import ForosPadres from './components/encargado/ForosPadres';
import GestionAlumnos from './components/control/GestionAlumnos';
import ControlProfesores from './components/control/ControlProfesores';
import AsistenciaGeneralControl from './components/control/AsistenciaGeneralControl';
import CircularesControl from './components/control/CircularesControl';
import IncidentesControl from './components/control/IncidentesControl';
import ForosControl from './components/control/ForosControl';
import GestionUsuarios from './components/control/GestionUsuarios';
import GestionCursos from './components/control/GestionCursos';
import DashboardEstudiante from './components/estudiante/DashboardEstudiante';
import MisCursosEstudiante from './components/estudiante/MisCursosEstudiante';
import MisCalificacionesEstudiante from './components/estudiante/MisCalificacionesEstudiante';
import MisForosEstudiante from './components/estudiante/MisForosEstudiante';
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

  const VistaHorarioClasesEstudiante = () => {
    const hijos = [
      { codigo_ua: 'UA-26501', nombre: 'José Ortega', avatarColor: '#3B82F6', iniciales: 'JO' },
      { codigo_ua: 'UA-26502', nombre: 'Andrea Méndez', avatarColor: '#10B981', iniciales: 'AM' }
    ];

    const [hijoSeleccionado, setHijoSeleccionado] = useState(hijos[0]);

    const activeUa = usuario.rol === 'Encargado' ? hijoSeleccionado.codigo_ua : usuario.codigo_ua;

    const HORARIOS_POR_ESTUDIANTE = {
      'UA-26501': [
        { dia: 'Lunes', periodo: 1, materia: 'Matematica I', grado: 'Decimo Grado A', aula: 'Salon 101' },
        { dia: 'Lunes', periodo: 2, materia: 'Matematica I', grado: 'Decimo Grado A', aula: 'Salon 101' },
        { dia: 'Miércoles', periodo: 3, materia: 'Matematica I', grado: 'Decimo Grado A', aula: 'Salon 101' },
        { dia: 'Jueves', periodo: 4, materia: 'Matematica I', grado: 'Decimo Grado A', aula: 'Salon 101' },
        { dia: 'Viernes', periodo: 2, materia: 'Matematica I', grado: 'Decimo Grado A', aula: 'Salon 101' }
      ],
      'UA-26502': [
        { dia: 'Lunes', periodo: 3, materia: 'Fisica Fundamental', grado: 'Undecimo Grado B', aula: 'Salon 102' },
        { dia: 'Martes', periodo: 1, materia: 'Fisica Fundamental', grado: 'Undecimo Grado B', aula: 'Salon 102' },
        { dia: 'Martes', periodo: 2, materia: 'Fisica Fundamental', grado: 'Undecimo Grado B', aula: 'Salon 102' },
        { dia: 'Jueves', periodo: 2, materia: 'Fisica Fundamental', grado: 'Undecimo Grado B', aula: 'Salon 102' },
        { dia: 'Viernes', periodo: 5, materia: 'Fisica Fundamental', grado: 'Undecimo Grado B', aula: 'Salon 102' }
      ]
    };

    const currentSchedule = HORARIOS_POR_ESTUDIANTE[activeUa] || HORARIOS_POR_ESTUDIANTE['UA-26501'];

    return (
      <div>
        {usuario.rol === 'Encargado' && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            backgroundColor: '#FFFFFF',
            padding: '16px',
            borderRadius: 'var(--stitch-radius-md, 12px)',
            border: '1px solid var(--stitch-border, #E5E7EB)',
            boxShadow: 'var(--stitch-shadow-sm)',
            marginBottom: '20px'
          }}>
            <span style={{ fontWeight: '600', color: 'var(--stitch-primary)' }}>Seleccionar Estudiante:</span>
            <div style={{ display: 'flex', gap: '8px' }}>
              {hijos.map(h => (
                <button
                  key={h.codigo_ua}
                  onClick={() => setHijoSeleccionado(h)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '8px 12px',
                    borderRadius: '20px',
                    border: hijoSeleccionado.codigo_ua === h.codigo_ua ? '2px solid var(--stitch-primary)' : '1px solid var(--stitch-border)',
                    backgroundColor: hijoSeleccionado.codigo_ua === h.codigo_ua ? '#EFF6FF' : '#FFFFFF',
                    cursor: 'pointer',
                    fontWeight: '500',
                    transition: 'all 0.2s'
                  }}
                >
                  <div style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    backgroundColor: h.avatarColor,
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '11px',
                    fontWeight: 'bold'
                  }}>{h.iniciales}</div>
                  <span>{h.nombre}</span>
                </button>
              ))}
            </div>
          </div>
        )}
        <WeeklyScheduleCalendar
          scheduleData={currentSchedule}
          title={usuario.rol === 'Encargado' ? `Horario de Clases - ${hijoSeleccionado.nombre}` : "Horario de Clases"}
        />
      </div>
    );
  };

  const VistaCalendarioEscolar = () => {
    return (
      <div>
        <h2 style={{ color: 'var(--stitch-primary)', fontWeight: '600', marginBottom: '20px' }}>Calendario Escolar</h2>
        <RoleCalendar userRole={usuario.rol} />
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
    const getDashboardInfo = () => {
      switch (usuario.rol) {
        case 'Administrador':
          return {
            subtitulo: 'Panel de Control General',
            descripcion: 'Bienvenido al módulo de administración y control general de la plataforma. Utiliza el menú lateral para gestionar las configuraciones del sistema.'
          };
        case 'Control Academico':
          return {
            subtitulo: 'Panel de Control Académico',
            descripcion: 'Bienvenido al módulo de control y secretaría escolar. Utiliza el menú lateral para gestionar la asistencia general, alumnos y circulares.'
          };
        case 'Profesor':
          return {
            subtitulo: 'Panel de Control de Profesores',
            descripcion: 'Bienvenido al portal docente. Utiliza el menú lateral para gestionar tus cursos, calificaciones, planificación de actividades y citas.'
          };
        case 'Estudiante':
          return {
            subtitulo: 'Panel del Estudiante',
            descripcion: 'Bienvenido a tu portal de estudiante. Utiliza el menú lateral para consultar tus cursos, calificaciones, foros académicos y agenda escolar.'
          };
        default:
          return {
            subtitulo: 'Panel de Tutor / Encargado',
            descripcion: 'Bienvenido al portal de padres y encargados. Utiliza el menú lateral para visualizar el rendimiento de tus tutorados, firmar circulares y gestionar citas.'
          };
      }
    };

    const info = getDashboardInfo();

    return (
      <div className="stitch-card" style={{ padding: '32px', backgroundColor: '#FFFFFF', display: 'flex', flexDirection: 'column', gap: '16px', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span className="material-icons-outlined" style={{ color: 'var(--stitch-primary)', fontSize: '24px' }}>home</span>
          <h4 className="stitch-title-font" style={{ margin: 0, color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '18px' }}>
            Inicio
          </h4>
        </div>
        <div style={{ borderTop: '1px solid var(--stitch-border)', paddingTop: '16px' }}>
          <h5 className="stitch-title-font" style={{ margin: '0 0 8px 0', color: 'var(--stitch-primary)', fontWeight: '700', fontSize: '15px' }}>
            {info.subtitulo}
          </h5>
          <p style={{ color: 'var(--stitch-text-secondary)', margin: 0, fontSize: '13.5px', lineHeight: '1.6' }}>
            {info.descripcion}
          </p>
        </div>
      </div>
    );
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
        <Route path="/cursos" element={usuario.rol === 'Profesor' ? <MisCursos /> : (usuario.rol === 'Estudiante' ? <MisCursosEstudiante /> : ((usuario.rol === 'Administrador' || usuario.rol === 'Control Academico') ? <GestionCursos /> : <VistaCreandoEspacio />))} />
        <Route path="/usuarios" element={(usuario.rol === 'Administrador' || usuario.rol === 'Control Academico') ? <GestionUsuarios /> : <VistaCreandoEspacio />} />
        <Route path="/cursos/tareas" element={usuario.rol === 'Profesor' ? <GestionTareas /> : <VistaCreandoEspacio />} />
        <Route path="/actividades" element={usuario.rol === 'Profesor' ? <PlanificacionActividades /> : <VistaCreandoEspacio />} />
        <Route path="/cursos/notas" element={usuario.rol === 'Profesor' ? <LibretaNotasCurso /> : <VistaCreandoEspacio />} />
        <Route path="/notas" element={usuario.rol === 'Profesor' ? <CentroCalificaciones /> : (usuario.rol === 'Estudiante' ? <MisCalificacionesEstudiante /> : <VistaCreandoEspacio />)} />
        <Route path="/rubricas" element={usuario.rol === 'Profesor' ? <BancoRubricas /> : <VistaCreandoEspacio />} />
        <Route path="/horarios" element={usuario.rol === 'Profesor' ? <HorariosCurso /> : (usuario.rol === 'Control Academico' ? <ControlProfesores /> : <VistaHorarioClasesEstudiante />)} />
        <Route path="/casos" element={usuario.rol === 'Profesor' ? <GestionCasos /> : <VistaCreandoEspacio />} />
        <Route path="/foros" element={(usuario.rol === 'Profesor' || usuario.rol === 'Estudiante' || usuario.rol === 'Encargado' || usuario.rol === 'Control Academico') ? <ForosComunidad /> : <VistaCreandoEspacio />} />
        <Route path="/foros_padres" element={usuario.rol === 'Encargado' ? <ForosPadres /> : <VistaCreandoEspacio />} />
        <Route path="/foros_control" element={usuario.rol === 'Control Academico' ? <ForosControl /> : <VistaCreandoEspacio />} />
        <Route path="/citas" element={usuario.rol === 'Profesor' ? <AgendaCitas /> : <VistaCreandoEspacio />} />
        <Route path="/mis_estudiantes" element={usuario.rol === 'Profesor' ? <MisEstudiantes /> : <VistaCreandoEspacio />} />
        <Route path="/calendario" element={(usuario.rol === 'Estudiante' || usuario.rol === 'Encargado' || usuario.rol === 'Profesor') ? <VistaCalendarioEscolar /> : <VistaCreandoEspacio />} />
        <Route path="/rendimiento" element={usuario.rol === 'Encargado' ? <RendimientoAcademico /> : <VistaCreandoEspacio />} />
        <Route path="/circulares" element={usuario.rol === 'Encargado' ? <CircularFirmas /> : (usuario.rol === 'Control Academico' ? <CircularesControl /> : <VistaCreandoEspacio />)} />
        <Route path="/incidentes" element={usuario.rol === 'Encargado' ? <GestionCasosEncargado /> : <VistaCreandoEspacio />} />
        
        {/* Rutas exclusivas de Secretaría/Administración */}
        <Route path="/alumnos" element={usuario.rol === 'Control Academico' ? <GestionAlumnos /> : <VistaCreandoEspacio />} />
        <Route path="/asistencia_gral" element={usuario.rol === 'Control Academico' ? <AsistenciaGeneralControl /> : <VistaCreandoEspacio />} />
        <Route path="/quejas" element={usuario.rol === 'Control Academico' ? <IncidentesControl /> : <VistaCreandoEspacio />} />
        
        {/* Rutas unificadas de mensajería y alertas */}
        <Route path="/comunicaciones" element={<Comunicaciones defaultTab="chats" />} />
        <Route path="/notificaciones" element={<Comunicaciones defaultTab="notificaciones" />} />
        <Route path="/mensajeria" element={<Comunicaciones defaultTab="chats" />} />

        {/* Cualquier otra ruta del menu lateral cargara la vista elegantemente construida */}
        <Route path="*" element={<VistaCreandoEspacio />} />
      </Routes>
    </Layout>
  );
}
