import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import '../../styles/StTheme.css';

// ============================================================================
// DOCUMENTACIÓN TÉCNICA DEL JSON REQUERIDO DESDE EL BACKEND (NODE.JS)
// ============================================================================
/*
El backend debe retornar la información en el siguiente formato para poblar esta vista:

1. GET /api/calificaciones/tutor/estudiantes
Response Array:
[
  {
    "id": 101,
    "nombre_completo": "Jose Ortega Cruz",
    "codigo_ua": "UA-26501",
    "parentesco": "Madre"
  }
]

2. GET /api/calificaciones/tutor/rendimiento/:estudiante_id
Response Object:
{
  "estudiante": {
    "id": 101,
    "nombre_completo": "Jose Ortega Cruz",
    "codigo_ua": "UA-26501",
    "grado": "Decimo Grado",
    "seccion": "A",
    "ciclo_escolar": 2026
  },
  "promedioGeneral": 82.5,
  "configuracionesProrrogas": {
    "nivel1": { "dias": 1, "notaMax": 75 },
    "nivel2": { "dias": 3, "notaMax": 50 },
    "nivel3": { "dias": 5, "notaMax": 25 },
    "intolerable": { "notaFija": 10 }
  },
  "cursos": [
    {
      "id": 1,
      "materia": "Matematica I",
      "profesor": "Carlos Gomez Estrada",
      "salon": "Salon 101",
      "color": "#3B82F6",
      "promedioActual": 85.0,
      "actividades": [
        {
          "id": 10,
          "titulo": "Hoja de Trabajo 1",
          "descripcion": "Ejercicios de Algebra y Ecuaciones Lineales",
          "ponderacion": 10.0,
          "tipo_actividad": "Hoja de Trabajo",
          "modalidad_entrega": "Virtual",
          "recursos_adjuntos_url": "http://url.archivo/jose_algebra.pdf",
          "fecha_hora_limite": "2026-07-05T23:59:59Z",
          "visible": true,
          "entrega": {
            "id": 201,
            "archivo_adjunto_url": "http://url.archivo/jose_algebra.pdf",
            "fecha_hora_entrega": "2026-07-05T21:40:00Z",
            "estado": "Calificada", // Calificada, Pendiente de Calificar, Entregada con Retraso, Justificada por Ausencia, Caso Especial, Intolerable
            "nota_obtenida": 9.0,
            "penalizacion_aplicada": 0.0,
            "justificacion_maestro": null,
            "porcentaje_entrega_personalizado": null,
            "nueva_fecha_limite": null,
            "fecha_calificacion": "2026-07-06T14:30:00Z"
          }
        }
      ]
    }
  ]
}
*/

// ============================================================================
// DATOS MOCK DE CONFERENCIA/RESPALDO (FALLBACK EN CASO DE ERROR DE CONEXIÓN)
// ============================================================================
const ESTUDIANTES_MOCK = [
  { id: 101, nombre_completo: 'Jose Ortega Cruz', codigo_ua: 'UA-26501', parentesco: 'Madre' },
  { id: 102, nombre_completo: 'Andrea Mendez Silva', codigo_ua: 'UA-26502', parentesco: 'Padre' }
];

const RENDIMIENTO_MOCK = {
  101: {
    estudiante: {
      id: 101,
      nombre_completo: 'Jose Ortega Cruz',
      codigo_ua: 'UA-26501',
      grado: 'Decimo Grado',
      seccion: 'A',
      ciclo_escolar: 2026
    },
    promedioGeneral: 80.5,
    configuracionesProrrogas: {
      nivel1: { dias: 1, notaMax: 75 },
      nivel2: { dias: 3, notaMax: 50 },
      nivel3: { dias: 5, notaMax: 25 },
      intolerable: { notaFija: 10 }
    },
    cursos: [
      {
        id: 1,
        materia: 'Matematica I',
        profesor: 'Carlos Gomez Estrada',
        salon: 'Salon 101',
        color: '#3B82F6',
        promedioActual: 88.0,
        actividades: [
          {
            id: 10,
            titulo: 'Hoja de Trabajo 1: Ecuaciones',
            descripcion: 'Ejercicios prácticos del capítulo 3 del libro de Álgebra.',
            ponderacion: 10.0,
            tipo_actividad: 'Tarea',
            modalidad_entrega: 'Virtual',
            recursos_adjuntos_url: 'https://storage.googleapis.com/ua-docs/ejercicios_algebra.pdf',
            fecha_hora_limite: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(), // Hace 5 días
            visible: true,
            entrega: {
              id: 201,
              archivo_adjunto_url: 'http://url.archivo/jose_algebra.pdf',
              fecha_hora_entrega: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000 - 2 * 60 * 60 * 1000).toISOString(), // A tiempo
              estado: 'Calificada',
              nota_obtenida: 9.0,
              penalizacion_aplicada: 0.0,
              justificacion_maestro: null,
              porcentaje_entrega_personalizado: null,
              nueva_fecha_limite: null,
              fecha_calificacion: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
            }
          },
          {
            id: 11,
            titulo: 'Hoja de Trabajo 2: Polinomios',
            descripcion: 'Simplificación de fracciones algebraicas complejas.',
            ponderacion: 10.0,
            tipo_actividad: 'Tarea',
            modalidad_entrega: 'Virtual',
            recursos_adjuntos_url: 'https://storage.googleapis.com/ua-docs/polinomios.pdf',
            fecha_hora_limite: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Hace 2 días
            visible: true,
            entrega: {
              id: 202,
              archivo_adjunto_url: 'http://url.archivo/jose_polinomios.pdf',
              fecha_hora_entrega: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000).toISOString(), // Tarde, nivel 1
              estado: 'Entregada con Retraso',
              nota_obtenida: 6.8, // 9 original, pero calificada sobre 7.5 max -> 6.8 pts final
              penalizacion_aplicada: 25.0, // 25% descuento (Nivel 1)
              justificacion_maestro: null,
              porcentaje_entrega_personalizado: null,
              nueva_fecha_limite: null,
              fecha_calificacion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
          },
          {
            id: 12,
            titulo: 'Investigación: Geometría Analítica',
            descripcion: 'Elaborar un ensayo sobre las aplicaciones de las secciones cónicas en la arquitectura.',
            ponderacion: 15.0,
            tipo_actividad: 'Proyecto',
            modalidad_entrega: 'Virtual',
            recursos_adjuntos_url: null,
            fecha_hora_limite: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toISOString(), // En 4 días
            visible: true,
            entrega: null
          },
          {
            id: 13,
            titulo: 'Examen Parcial I: Álgebra Lineal',
            descripcion: 'Evaluación presencial del primer bloque.',
            ponderacion: 30.0,
            tipo_actividad: 'Parcial',
            modalidad_entrega: 'Fisico',
            recursos_adjuntos_url: null,
            fecha_hora_limite: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(), // Hace 15 días
            visible: true,
            entrega: {
              id: 203,
              archivo_adjunto_url: null,
              fecha_hora_entrega: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
              estado: 'Calificada',
              nota_obtenida: 27.0,
              penalizacion_aplicada: 0.0,
              justificacion_maestro: null,
              porcentaje_entrega_personalizado: null,
              nueva_fecha_limite: null,
              fecha_calificacion: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
            }
          },
          {
            id: 14,
            titulo: 'Foro: Matrices en la vida cotidiana',
            descripcion: 'Discusión en el foro de comunidad sobre matrices.',
            ponderacion: 5.0,
            tipo_actividad: 'Foro',
            modalidad_entrega: 'Virtual',
            recursos_adjuntos_url: null,
            fecha_hora_limite: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
            visible: false, // Oculto
            entrega: null
          }
        ]
      },
      {
        id: 2,
        materia: 'Fisica Fundamental',
        profesor: 'Sofia Lopez Alvarado',
        salon: 'Salon 102',
        color: '#EF4444',
        promedioActual: 73.0,
        actividades: [
          {
            id: 20,
            titulo: 'Laboratorio: Movimiento Rectilíneo',
            descripcion: 'Reporte del experimento realizado en clase con sensores.',
            ponderacion: 15.0,
            tipo_actividad: 'Laboratorio',
            modalidad_entrega: 'Virtual',
            recursos_adjuntos_url: 'https://storage.googleapis.com/ua-docs/guia_lab_mru.pdf',
            fecha_hora_limite: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
            visible: true,
            entrega: {
              id: 210,
              archivo_adjunto_url: 'http://url.archivo/jose_mru.pdf',
              fecha_hora_entrega: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
              estado: 'Justificada por Ausencia',
              nota_obtenida: null,
              penalizacion_aplicada: 0.0,
              justificacion_maestro: null,
              porcentaje_entrega_personalizado: null,
              nueva_fecha_limite: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
              fecha_calificacion: null
            }
          },
          {
            id: 21,
            titulo: 'Proyecto Cinemática',
            descripcion: 'Construcción y análisis de un cohete propulsado por agua.',
            ponderacion: 20.0,
            tipo_actividad: 'Proyecto',
            modalidad_entrega: 'Virtual',
            recursos_adjuntos_url: null,
            fecha_hora_limite: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(), // Hace 4 días
            visible: true,
            entrega: {
              id: 211,
              archivo_adjunto_url: null,
              fecha_hora_entrega: null,
              estado: 'Intolerable',
              nota_obtenida: 2.0, // 10% automático de 20.00
              penalizacion_aplicada: 90.0,
              justificacion_maestro: null,
              porcentaje_entrega_personalizado: null,
              nueva_fecha_limite: null,
              fecha_calificacion: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
            }
          },
          {
            id: 22,
            titulo: 'Corto: Caída Libre',
            descripcion: 'Prueba conceptual de 5 preguntas sobre gravedad.',
            ponderacion: 10.0,
            tipo_actividad: 'Corto',
            modalidad_entrega: 'Virtual',
            recursos_adjuntos_url: null,
            fecha_hora_limite: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // Hace 1 día (Vence hoy/ayer)
            visible: true,
            entrega: {
              id: 212,
              archivo_adjunto_url: 'http://url.archivo/jose_caidalibre.pdf',
              fecha_hora_entrega: new Date(Date.now() - 0.5 * 24 * 60 * 60 * 1000).toISOString(),
              estado: 'Pendiente de Calificar',
              nota_obtenida: null,
              penalizacion_aplicada: 0.0,
              justificacion_maestro: null,
              porcentaje_entrega_personalizado: null,
              nueva_fecha_limite: null,
              fecha_calificacion: null
            }
          },
          {
            id: 23,
            titulo: 'Hoja de Trabajo 3: Vectores',
            descripcion: 'Suma de vectores por componentes rectangulares.',
            ponderacion: 15.0,
            tipo_actividad: 'Tarea',
            modalidad_entrega: 'Virtual',
            recursos_adjuntos_url: null,
            fecha_hora_limite: new Date(Date.now() + 18 * 60 * 60 * 1000).toISOString(), // Expira en 18 horas
            visible: true,
            entrega: null // No entregado aún, pero a tiempo
          },
          {
            id: 24,
            titulo: 'Laboratorio Especial: Dinámica',
            descripcion: 'Experimento especial del módulo avanzado.',
            ponderacion: 15.0,
            tipo_actividad: 'Laboratorio',
            modalidad_entrega: 'Virtual',
            recursos_adjuntos_url: null,
            fecha_hora_limite: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            visible: true,
            entrega: {
              id: 214,
              archivo_adjunto_url: 'http://url.archivo/jose_dinamica.pdf',
              fecha_hora_entrega: new Date(Date.now() - 2.8 * 24 * 60 * 60 * 1000).toISOString(),
              estado: 'Caso Especial',
              nota_obtenida: 12.6, // 14 obtenido, pero calificado sobre el 90% (excepción) -> 12.6
              penalizacion_aplicada: 10.0, // 10% deducción autorizada
              justificacion_maestro: 'El estudiante tuvo problemas de conexión validados. Se permite entregar sobre el 90%.',
              porcentaje_entrega_personalizado: 90.0,
              nueva_fecha_limite: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
              fecha_calificacion: new Date().toISOString()
            }
          },
          {
            id: 25,
            titulo: 'Hoja de Trabajo 4: Fricción',
            descripcion: 'Ejercicios teóricos sobre coeficientes de fricción estática y cinética.',
            ponderacion: 10.0,
            tipo_actividad: 'Tarea',
            modalidad_entrega: 'Virtual',
            recursos_adjuntos_url: null,
            fecha_hora_limite: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // Hace 2 días
            visible: true,
            entrega: null // VENCIDA Y SIN ENTREGAR. Caerá en Alertas de Incumplimiento.
          }
        ]
      }
    ]
  },
  102: {
    estudiante: {
      id: 102,
      nombre_completo: 'Andrea Mendez Silva',
      codigo_ua: 'UA-26502',
      grado: 'Undecimo Grado',
      seccion: 'B',
      ciclo_escolar: 2026
    },
    promedioGeneral: 87.5,
    configuracionesProrrogas: {
      nivel1: { dias: 1, notaMax: 75 },
      nivel2: { dias: 3, notaMax: 50 },
      nivel3: { dias: 5, notaMax: 25 },
      intolerable: { notaFija: 10 }
    },
    cursos: [
      {
        id: 3,
        materia: 'Química Orgánica',
        profesor: 'Jorge Diaz Herrera',
        salon: 'Salon 204',
        color: '#10B981',
        promedioActual: 87.5,
        actividades: [
          {
            id: 30,
            titulo: 'Nomenclatura Alquinos',
            descripcion: 'Ejercicios de nomenclatura IUPAC.',
            ponderacion: 20.0,
            tipo_actividad: 'Tarea',
            modalidad_entrega: 'Virtual',
            recursos_adjuntos_url: null,
            fecha_hora_limite: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
            visible: true,
            entrega: {
              id: 301,
              archivo_adjunto_url: 'http://url.archivo/andrea_alquinos.pdf',
              fecha_hora_entrega: new Date(Date.now() - 4.1 * 24 * 60 * 60 * 1000).toISOString(),
              estado: 'Calificada',
              nota_obtenida: 19.0,
              penalizacion_aplicada: 0.0,
              justificacion_maestro: null,
              porcentaje_entrega_personalizado: null,
              nueva_fecha_limite: null,
              fecha_calificacion: new Date().toISOString()
            }
          },
          {
            id: 31,
            titulo: 'Proyecto Hidrocarburos',
            descripcion: 'Modelado 3D de alcanos cíclicos.',
            ponderacion: 30.0,
            tipo_actividad: 'Proyecto',
            modalidad_entrega: 'Virtual',
            recursos_adjuntos_url: null,
            fecha_hora_limite: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
            visible: true,
            entrega: null
          }
        ]
      }
    ]
  }
};

// ============================================================================
// COMPONENTE PRINCIPAL DE RENDIMIENTO ACADÉMICO (TUTOR)
// ============================================================================
export default function RendimientoAcademico() {
  const { token } = useAuth();
  
  // Estados de control
  const [estudiantes, setEstudiantes] = useState([]);
  const [selectedEstudianteId, setSelectedEstudianteId] = useState(null);
  const [rendimiento, setRendimiento] = useState(null);
  
  const [loading, setLoading] = useState(true);
  const [usingMock, setUsingMock] = useState(false);
  
  // Navegación de interfaz
  const [selectedCurso, setSelectedCurso] = useState(null);
  const [activeTab, setActiveTab] = useState('tareas'); // tareas, historial, alertas
  
  // Modal de Detalle de Actividad
  const [selectedActividadModal, setSelectedActividadModal] = useState(null);

  // ---------------------------------------------------------------------------
  // CARGAR ESTUDIANTES DEL TUTOR
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function loadEstudiantes() {
      setLoading(true);
      try {
        const res = await fetch('/api/calificaciones/tutor/estudiantes', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Error al obtener estudiantes del servidor');
        }

        const data = await res.json();
        
        if (data.length > 0) {
          setEstudiantes(data);
          setSelectedEstudianteId(data[0].id);
        } else {
          // Si no devuelve nada, usamos los mocks
          console.warn('Backend cargó estudiantes vacíos. Cargando mock...');
          setEstudiantes(ESTUDIANTES_MOCK);
          setSelectedEstudianteId(ESTUDIANTES_MOCK[0].id);
          setUsingMock(true);
        }
      } catch (err) {
        console.error('Error cargando estudiantes. Cargando mock fallbacks...', err);
        setEstudiantes(ESTUDIANTES_MOCK);
        setSelectedEstudianteId(ESTUDIANTES_MOCK[0].id);
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    }
    
    if (token) {
      loadEstudiantes();
    }
  }, [token]);

  // ---------------------------------------------------------------------------
  // CARGAR RENDIMIENTO DEL ESTUDIANTE SELECCIONADO
  // ---------------------------------------------------------------------------
  useEffect(() => {
    async function loadRendimiento() {
      if (!selectedEstudianteId) return;
      
      setLoading(true);
      setSelectedCurso(null); // Resetear curso al cambiar de estudiante
      
      if (usingMock) {
        // Cargar desde mock directamente
        setTimeout(() => {
          setRendimiento(RENDIMIENTO_MOCK[selectedEstudianteId] || null);
          setLoading(false);
        }, 300);
        return;
      }
      
      try {
        const res = await fetch(`/api/calificaciones/tutor/rendimiento/${selectedEstudianteId}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!res.ok) {
          throw new Error('Error al obtener el rendimiento académico del estudiante');
        }

        const data = await res.json();
        setRendimiento(data);
      } catch (err) {
        console.error('Error cargando rendimiento de API. Usando mock...', err);
        setRendimiento(RENDIMIENTO_MOCK[selectedEstudianteId] || null);
        setUsingMock(true);
      } finally {
        setLoading(false);
      }
    }

    loadRendimiento();
  }, [selectedEstudianteId, token, usingMock]);

  // ---------------------------------------------------------------------------
  // DISPARAR IMPRESIÓN DEL BOLETÍN
  // ---------------------------------------------------------------------------
  const handleExportPDF = () => {
    window.print();
  };

  // ---------------------------------------------------------------------------
  // FORMATO DE FECHAS
  // ---------------------------------------------------------------------------
  const formatFecha = (isoString) => {
    if (!isoString) return 'No registrada';
    const date = new Date(isoString);
    return date.toLocaleDateString('es-GT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // ---------------------------------------------------------------------------
  // RENDERIZADO DEL CARGANDO O ERROR
  // ---------------------------------------------------------------------------
  if (loading && !rendimiento) {
    return (
      <div style={{ display: 'flex', height: '380px', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8FAFC' }}>
        <div style={{ textAlign: 'center' }}>
          <span className="material-icons-outlined" style={{ fontSize: '48px', color: 'var(--stitch-secondary)', animation: 'spin 1.5s linear infinite' }}>
            sync
          </span>
          <p style={{ color: 'var(--stitch-text-secondary)', marginTop: '12px', fontWeight: '500' }}>Cargando Rendimiento Académico...</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ fontFamily: 'var(--stitch-font)', padding: '4px' }}>
      
      {/* ESTILOS DE IMPRESIÓN EXCLUSIVOS PARA EL BOLETÍN EN PANTALLA Y EN PDF */}
      <style>{`
        @media print {
          body * {
            visibility: hidden !important;
          }
          #print-area, #print-area * {
            visibility: visible !important;
          }
          #print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            padding: 0 !important;
            margin: 0 !important;
            box-shadow: none !important;
            border: none !important;
            background: #FFFFFF !important;
            color: #000000 !important;
          }
          .no-print {
            display: none !important;
          }
          .stitch-card {
            box-shadow: none !important;
            border: 1px solid #CCCCCC !important;
          }
          .stitch-th {
            background-color: #EEEEEE !important;
            color: #000000 !important;
            border-bottom: 2px solid #999999 !important;
          }
          .stitch-td {
            border-bottom: 1px solid #DDDDDD !important;
          }
        }
      `}</style>

      {/* ── ALERTA DE MOCK ACTIVO (NO DISRUPTIVA, PREMIUM) ── */}
      {usingMock && (
        <div className="no-print stitch-alert stitch-alert-warning" style={{ margin: '0 0 16px 0', fontSize: '13px' }}>
          <span className="material-icons-outlined" style={{ fontSize: '18px' }}>info_outline</span>
          <span>
            Modo demostrativo activo: Visualizando datos pre-cargados de prueba del alumno. Las acciones se guardarán de forma local.
          </span>
        </div>
      )}

      {/* ── CABECERA PRINCIPAL Y SELECTOR DE HIJO ── */}
      <div className="no-print" style={{
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '24px'
      }}>
        <div>
          <h2 className="stitch-title-font" style={{ color: 'var(--stitch-primary)', fontWeight: '800', fontSize: '26px', margin: 0 }}>
            Rendimiento Académico
          </h2>
          <p style={{ color: 'var(--stitch-text-secondary)', fontSize: '14px', margin: '4px 0 0 0' }}>
            Portal de supervisión académica y estado de entregas del estudiante.
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {estudiantes.length > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span className="material-icons-outlined" style={{ color: 'var(--stitch-text-secondary)', fontSize: '20px' }}>
                face
              </span>
              <select
                className="stitch-select"
                style={{ width: '220px', padding: '8px 12px', fontSize: '13px', fontWeight: '600' }}
                value={selectedEstudianteId || ''}
                onChange={(e) => setSelectedEstudianteId(parseInt(e.target.value))}
              >
                {estudiantes.map(est => (
                  <option key={est.id} value={est.id}>
                    {est.nombre_completo}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* <button 
            onClick={handleExportPDF} 
            className="stitch-button"
            style={{ padding: '8px 16px', fontSize: '13px' }}
          >
            <span className="material-icons-outlined">picture_as_pdf</span>
            Descargar Boletín
          </button> */}
        </div>
      </div>

      {rendimiento && (
        <div id="print-area">
          
          {/* Cabecera del Boletín (Solo visible en impresión o en modo de impresión) */}
          <div style={{
            display: 'none',
            borderBottom: '3px double var(--stitch-primary)',
            paddingBottom: '16px',
            marginBottom: '24px'
          }} className="show-on-print">
            <table style={{ width: '100%' }}>
              <tbody>
                <tr>
                  <td>
                    <h1 style={{ color: '#0D2C54', margin: '0 0 4px 0', fontSize: '22px', fontWeight: '800' }}>
                      UNIDAD ACADÉMICA DE ORIENTE
                    </h1>
                    <p style={{ margin: 0, fontSize: '12px', color: '#666' }}>
                      Boletín Oficial de Calificaciones del Ciclo Escolar {rendimiento.estudiante.ciclo_escolar || 2026}
                    </p>
                  </td>
                  <td style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: '700', fontSize: '13px', color: '#000' }}>
                      FECHA DE EMISIÓN: {new Date().toLocaleDateString('es-GT')}
                    </div>
                    <div style={{ fontSize: '12px', color: '#555' }}>
                      Código Estudiante: {rendimiento.estudiante.codigo_ua}
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ── CARD METADATOS DEL ALUMNO Y PROMEDIO GENERAL ── */}
          <div className="stitch-card" style={{
            background: 'linear-gradient(135deg, var(--stitch-primary) 0%, #1e3a8a 100%)',
            color: '#FFFFFF',
            padding: '24px',
            marginBottom: '24px',
            borderRadius: 'var(--stitch-radius-md)'
          }}>
            <div style={{
              display: 'flex',
              flexWrap: 'wrap',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '20px'
            }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="material-icons-outlined" style={{ color: '#93C5FD' }}>school</span>
                  <span style={{ fontSize: '12px', letterSpacing: '1px', fontWeight: '700', textTransform: 'uppercase', color: '#93C5FD' }}>
                    Ficha de Alumno
                  </span>
                </div>
                <h3 className="stitch-title-font" style={{ margin: '0 0 8px 0', fontSize: '22px', fontWeight: '700' }}>
                  {rendimiento.estudiante.nombre_completo}
                </h3>
                <div style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '16px',
                  fontSize: '13px',
                  color: '#E0E7FF'
                }}>
                  <span>Código: <strong>{rendimiento.estudiante.codigo_ua}</strong></span>
                  <span>|</span>
                  <span>Grado: <strong>{rendimiento.estudiante.grado} - Sección "{rendimiento.estudiante.seccion}"</strong></span>
                  <span>|</span>
                  <span>Ciclo Escolar: <strong>{rendimiento.estudiante.ciclo_escolar || 2026}</strong></span>
                </div>
              </div>

              {/* Métrica de Promedio General Destacada */}
              <div style={{
                backgroundColor: 'rgba(255, 255, 255, 0.1)',
                padding: '16px 24px',
                borderRadius: 'var(--stitch-radius-md)',
                textAlign: 'center',
                minWidth: '150px',
                border: '1px solid rgba(255, 255, 255, 0.15)'
              }}>
                <span style={{ display: 'block', fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', color: '#BFDBFE', letterSpacing: '0.5px' }}>
                  Promedio Acumulado
                </span>
                <span style={{ display: 'block', fontSize: '38px', fontWeight: '800', color: '#FFFFFF', margin: '4px 0' }}>
                  {rendimiento.promedioGeneral}%
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: '600',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  backgroundColor: rendimiento.promedioGeneral >= 75 ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
                  color: rendimiento.promedioGeneral >= 75 ? '#A7F3D0' : '#FDE68A'
                }}>
                  {rendimiento.promedioGeneral >= 60 ? 'Aprobado' : 'Bajo Promedio'}
                </span>
              </div>
            </div>
          </div>

          {/* ── LISTADO DE CURSOS (PANEL GENERAL) ── */}
          {!selectedCurso ? (
            <div>
              <h4 style={{ color: 'var(--stitch-primary)', fontWeight: '700', fontSize: '16px', margin: '0 0 16px 0' }}>
                Resumen de Materias y Calificaciones Actuales
              </h4>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
                gap: '20px'
              }}>
                {rendimiento.cursos.map(curso => {
                  const hasBadges = curso.actividades.some(act => act.entrega && act.entrega.estado === 'Intolerable');
                  return (
                    <div 
                      key={curso.id}
                      className="stitch-card"
                      style={{
                        cursor: 'pointer',
                        padding: '20px',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderLeft: `5px solid ${curso.color}`
                      }}
                      onClick={() => {
                        setSelectedCurso(curso);
                        setActiveTab('tareas');
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                          <span style={{
                            color: curso.color,
                            fontSize: '11px',
                            fontWeight: '700',
                            backgroundColor: `${curso.color}10`,
                            padding: '3px 8px',
                            borderRadius: '8px'
                          }}>
                            {curso.salon}
                          </span>
                          {hasBadges && (
                            <span className="stitch-badge stitch-badge-urgent" style={{ fontSize: '10px', padding: '2px 6px' }}>
                              <span className="material-icons-outlined" style={{ fontSize: '12px' }}>warning</span> Alerta Tarea Bloqueada
                            </span>
                          )}
                        </div>
                        <h4 className="stitch-title-font" style={{ margin: '0 0 4px 0', fontSize: '17px', color: 'var(--stitch-primary)', fontWeight: '700' }}>
                          {curso.materia}
                        </h4>
                        <p style={{ margin: 0, fontSize: '13px', color: 'var(--stitch-text-secondary)' }}>
                          Docente: {curso.profesor}
                        </p>
                      </div>

                      <div style={{ marginTop: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', fontSize: '13px' }}>
                          <span style={{ fontWeight: '500', color: 'var(--stitch-text-secondary)' }}>Avance y Rendimiento:</span>
                          <span style={{ fontWeight: '700', color: 'var(--stitch-text-primary)' }}>{curso.promedioActual}%</span>
                        </div>
                        
                        {/* Progress Bar */}
                        <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            width: `${curso.promedioActual}%`,
                            height: '100%',
                            backgroundColor: curso.promedioActual >= 75 ? 'var(--stitch-success)' : (curso.promedioActual >= 60 ? 'var(--stitch-warning)' : 'var(--stitch-danger)'),
                            borderRadius: '4px',
                            transition: 'width 0.4s ease'
                          }} />
                        </div>
                      </div>

                      <div style={{
                        marginTop: '16px',
                        paddingTop: '12px',
                        borderTop: '1px solid var(--stitch-border)',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        color: 'var(--stitch-secondary)',
                        fontSize: '12px',
                        fontWeight: '600'
                      }} className="no-print">
                        <span>Ver actividades</span>
                        <span className="material-icons-outlined" style={{ fontSize: '16px' }}>chevron_right</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Tabla consolidada para la impresión oficial (Escondida en pantalla por defecto) */}
              <div style={{ display: 'none', marginTop: '30px' }} className="show-on-print">
                <h3 style={{ borderBottom: '1px solid #333', paddingBottom: '6px', fontSize: '15px' }}>
                  Resumen Consolidado de Calificaciones
                </h3>
                <table className="stitch-table">
                  <thead>
                    <tr>
                      <th className="stitch-th">Materia</th>
                      <th className="stitch-th">Profesor</th>
                      <th className="stitch-th">Salón</th>
                      <th className="stitch-th" style={{ textAlign: 'right' }}>Calificación</th>
                      <th className="stitch-th" style={{ textAlign: 'right' }}>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rendimiento.cursos.map(curso => (
                      <tr key={curso.id} className="stitch-tr-hover">
                        <td className="stitch-td" style={{ fontWeight: '700' }}>{curso.materia}</td>
                        <td className="stitch-td">{curso.profesor}</td>
                        <td className="stitch-td">{curso.salon}</td>
                        <td className="stitch-td" style={{ textAlign: 'right', fontWeight: '700' }}>{curso.promedioActual}%</td>
                        <td className="stitch-td" style={{ textAlign: 'right', fontWeight: '600', color: curso.promedioActual >= 60 ? '#047857' : '#B91C1C' }}>
                          {curso.promedioActual >= 60 ? 'Aprobado' : 'Reprobado'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

            </div>
          ) : (
            
            /* ── DETALLE POR CURSO (PANELES INTERNOS) ── */
            <div>
              {/* Navegación Retorno */}
              <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                <button
                  onClick={() => setSelectedCurso(null)}
                  className="stitch-button-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px', height: '32px' }}
                >
                  <span className="material-icons-outlined">arrow_back</span>
                  Volver al listado de materias
                </button>
                <span style={{ color: 'var(--stitch-text-secondary)', fontSize: '13px' }}>
                  Detalle del curso actual
                </span>
              </div>

              {/* Ficha del Curso */}
              <div className="stitch-card" style={{
                padding: '20px',
                marginBottom: '24px',
                borderLeft: `6px solid ${selectedCurso.color}`,
                backgroundColor: 'var(--stitch-surface)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', alignItems: 'center' }}>
                  <div>
                    <h3 className="stitch-title-font" style={{ margin: '0 0 4px 0', fontSize: '20px', color: 'var(--stitch-primary)', fontWeight: '800' }}>
                      {selectedCurso.materia}
                    </h3>
                    <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: 'var(--stitch-text-secondary)', flexWrap: 'wrap' }}>
                      <span>Docente: <strong>{selectedCurso.profesor}</strong></span>
                      <span>•</span>
                      <span>Ubicación: <strong>{selectedCurso.salon}</strong></span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{ display: 'block', fontSize: '11px', color: 'var(--stitch-text-secondary)', fontWeight: '700', textTransform: 'uppercase' }}>
                        Nota de Curso
                      </span>
                      <span style={{ fontSize: '24px', fontWeight: '800', color: selectedCurso.color }}>
                        {selectedCurso.promedioActual}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Selector de Pestañas (Tabs) de Stitch */}
              <div className="no-print stitch-tabs-container">
                <button
                  className={`stitch-tab-btn ${activeTab === 'tareas' ? 'stitch-tab-btn-active' : ''}`}
                  onClick={() => setActiveTab('tareas')}
                >
                  <span className="material-icons-outlined">calendar_today</span>
                  Pendientes ({selectedCurso.actividades.filter(a => !a.entrega && a.visible && new Date(a.fecha_hora_limite) >= new Date()).length})
                </button>
                <button
                  className={`stitch-tab-btn ${activeTab === 'historial' ? 'stitch-tab-btn-active' : ''}`}
                  onClick={() => setActiveTab('historial')}
                >
                  <span className="material-icons-outlined">task_alt</span>
                  Entregas e Historial ({selectedCurso.actividades.filter(a => a.entrega).length})
                </button>
                <button
                  className={`stitch-tab-btn ${activeTab === 'alertas' ? 'stitch-tab-btn-active' : ''}`}
                  onClick={() => setActiveTab('alertas')}
                >
                  <span className="material-icons-outlined">warning_amber</span>
                  Alertas y Vencidas ({selectedCurso.actividades.filter(a => {
                    const isVencida = new Date(a.fecha_hora_limite) < new Date();
                    const noEntrega = !a.entrega || (a.entrega && a.entrega.estado === 'Intolerable');
                    const hasJustificacion = a.entrega && a.entrega.estado === 'Justificada por Ausencia';
                    return isVencida && noEntrega && !hasJustificacion;
                  }).length})
                </button>
              </div>

              {/* ── CONTENIDO DE PESTAÑAS ── */}

              {/* PESTAÑA 1: Pendientes por Entregar (Cronograma) */}
              {activeTab === 'tareas' && (
                <div>
                  <h4 style={{ color: 'var(--stitch-primary)', fontWeight: '700', fontSize: '15px', margin: '0 0 16px 0' }}>
                    Actividades Programadas por Entregar
                  </h4>

                  {selectedCurso.actividades.filter(a => !a.entrega && a.visible && new Date(a.fecha_hora_limite) >= new Date()).length === 0 ? (
                    <div style={{
                      padding: '30px',
                      textAlign: 'center',
                      backgroundColor: 'var(--stitch-hover)',
                      borderRadius: 'var(--stitch-radius-md)',
                      color: 'var(--stitch-text-secondary)',
                      fontSize: '13px'
                    }}>
                      <span className="material-icons-outlined" style={{ fontSize: '32px', color: 'var(--stitch-text-secondary)', marginBottom: '8px' }}>
                        done_all
                      </span>
                      <p style={{ margin: 0, fontWeight: '500' }}>No hay tareas o evaluaciones pendientes de entregar para este curso.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      {selectedCurso.actividades
                        .filter(a => !a.entrega && a.visible && new Date(a.fecha_hora_limite) >= new Date())
                        .sort((a, b) => new Date(a.fecha_hora_limite) - new Date(b.fecha_hora_limite))
                        .map(act => (
                          <div 
                            key={act.id}
                            className="stitch-card stitch-tr-hover"
                            style={{
                              padding: '16px 20px',
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              flexWrap: 'wrap',
                              gap: '12px'
                            }}
                            onClick={() => setSelectedActividadModal(act)}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{
                                width: '40px',
                                height: '40px',
                                borderRadius: '50%',
                                backgroundColor: 'rgba(99, 102, 241, 0.1)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: 'var(--stitch-info)'
                              }}>
                                <span className="material-icons-outlined">
                                  {act.tipo_actividad === 'Proyecto' ? 'rocket_launch' : (act.tipo_actividad === 'Parcial' ? 'quiz' : 'assignment')}
                                </span>
                              </div>

                              <div>
                                <h5 className="stitch-title-font" style={{ margin: '0 0 4px 0', fontSize: '15px', color: 'var(--stitch-text-primary)', fontWeight: '700' }}>
                                  {act.titulo}
                                </h5>
                                <div style={{ display: 'flex', gap: '12px', fontSize: '12px', color: 'var(--stitch-text-secondary)', flexWrap: 'wrap' }}>
                                  <span>Tipo: <strong>{act.tipo_actividad}</strong></span>
                                  <span>•</span>
                                  <span>Entrega: <strong>{act.modalidad_entrega}</strong></span>
                                  <span>•</span>
                                  <span style={{ color: 'var(--stitch-danger)', fontWeight: '600' }}>
                                    Vence: {formatFecha(act.fecha_hora_limite)}
                                  </span>
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ textAlign: 'right' }}>
                                <span style={{ display: 'block', fontSize: '10px', color: 'var(--stitch-text-secondary)', textTransform: 'uppercase', fontWeight: '700' }}>
                                  Valor
                                </span>
                                <span style={{ fontSize: '16px', fontWeight: '700', color: 'var(--stitch-text-primary)' }}>
                                  {act.ponderacion} Pts.
                                </span>
                              </div>
                              <span className="material-icons-outlined" style={{ color: 'var(--stitch-text-secondary)' }}>chevron_right</span>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              )}

              {/* PESTAÑA 2: Historial de Entregas y Calificaciones */}
              {activeTab === 'historial' && (
                <div>
                  <h4 style={{ color: 'var(--stitch-primary)', fontWeight: '700', fontSize: '15px', margin: '0 0 16px 0' }}>
                    Historial Completo de Calificaciones y Entregas
                  </h4>

                  {selectedCurso.actividades.filter(a => a.entrega).length === 0 ? (
                    <div style={{
                      padding: '30px',
                      textAlign: 'center',
                      backgroundColor: 'var(--stitch-hover)',
                      borderRadius: 'var(--stitch-radius-md)',
                      color: 'var(--stitch-text-secondary)',
                      fontSize: '13px'
                    }}>
                      <span className="material-icons-outlined" style={{ fontSize: '32px', color: 'var(--stitch-text-secondary)', marginBottom: '8px' }}>
                        history
                      </span>
                      <p style={{ margin: 0, fontWeight: '500' }}>El alumno aún no registra entregas calificadas o pendientes en esta materia.</p>
                    </div>
                  ) : (
                    <div style={{ overflowX: 'auto', backgroundColor: '#FFFFFF', borderRadius: 'var(--stitch-radius-md)', border: '1px solid var(--stitch-border)' }}>
                      <table className="stitch-table">
                        <thead>
                          <tr>
                            <th className="stitch-th">Actividad</th>
                            <th className="stitch-th">Fecha Límite</th>
                            <th className="stitch-th">Fecha Envío</th>
                            <th className="stitch-th">Estado</th>
                            <th className="stitch-th" style={{ textAlign: 'right' }}>Calificación</th>
                            <th className="stitch-th" style={{ textAlign: 'right' }}>Detalle</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedCurso.actividades
                            .filter(a => a.entrega)
                            .map(act => {
                              const ent = act.entrega;
                              let badgeClass = 'stitch-badge-neutral';
                              let badgeLabel = ent.estado;
                              
                              if (ent.estado === 'Calificada') {
                                badgeClass = 'stitch-badge-success';
                              } else if (ent.estado === 'Pendiente de Calificar') {
                                badgeClass = 'stitch-badge-info';
                              } else if (ent.estado === 'Entregada con Retraso') {
                                badgeClass = 'stitch-badge-warning';
                                badgeLabel = 'Tarde';
                              } else if (ent.estado === 'Justificada por Ausencia') {
                                badgeClass = 'stitch-badge-info';
                                badgeLabel = 'Justificada';
                              } else if (ent.estado === 'Caso Especial') {
                                badgeClass = 'stitch-badge-success';
                                badgeLabel = 'Excepción';
                              } else if (ent.estado === 'Intolerable') {
                                badgeClass = 'stitch-badge-danger';
                                badgeLabel = 'Bloqueada (10%)';
                              }

                              return (
                                <tr key={act.id} className="stitch-tr-hover">
                                  <td className="stitch-td">
                                    <div style={{ fontWeight: '600', color: 'var(--stitch-text-primary)' }}>{act.titulo}</div>
                                    <div style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)' }}>{act.tipo_actividad}</div>
                                  </td>
                                  <td className="stitch-td">{formatFecha(act.fecha_hora_limite)}</td>
                                  <td className="stitch-td">{formatFecha(ent.fecha_hora_entrega)}</td>
                                  <td className="stitch-td">
                                    <span className={`stitch-badge ${badgeClass}`}>
                                      {badgeLabel}
                                    </span>
                                  </td>
                                  <td className="stitch-td" style={{ textAlign: 'right', fontWeight: '700' }}>
                                    {ent.nota_obtenida !== null ? `${ent.nota_obtenida} / ${act.ponderacion}` : '---'}
                                  </td>
                                  <td className="stitch-td" style={{ textAlign: 'right' }}>
                                    <button
                                      onClick={() => setSelectedActividadModal(act)}
                                      className="stitch-button-secondary"
                                      style={{ padding: '4px 8px', fontSize: '11px', borderRadius: '4px' }}
                                    >
                                      Ver Info
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* PESTAÑA 3: Alertas de Incumplimiento (Tareas Vencidas) */}
              {activeTab === 'alertas' && (
                <div>
                  <h4 style={{ color: 'var(--stitch-primary)', fontWeight: '700', fontSize: '15px', margin: '0 0 16px 0' }}>
                    Alertas de Actividades Vencidas y sin Entregar
                  </h4>

                  {selectedCurso.actividades.filter(a => {
                    const isVencida = new Date(a.fecha_hora_limite) < new Date();
                    const noEntrega = !a.entrega || (a.entrega && a.entrega.estado === 'Intolerable');
                    const hasJustificacion = a.entrega && a.entrega.estado === 'Justificada por Ausencia';
                    return isVencida && noEntrega && !hasJustificacion;
                  }).length === 0 ? (
                    <div style={{
                      padding: '30px',
                      textAlign: 'center',
                      backgroundColor: 'var(--stitch-hover)',
                      borderRadius: 'var(--stitch-radius-md)',
                      color: 'var(--stitch-text-secondary)',
                      fontSize: '13px'
                    }}>
                      <span className="material-icons-outlined" style={{ fontSize: '32px', color: 'var(--stitch-success)', marginBottom: '8px' }}>
                        verified
                      </span>
                      <p style={{ margin: 0, fontWeight: '500' }}>¡Felicidades! No hay alertas de incumplimiento activas para esta materia.</p>
                    </div>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      {selectedCurso.actividades
                        .filter(a => {
                          const isVencida = new Date(a.fecha_hora_limite) < new Date();
                          const noEntrega = !a.entrega || (a.entrega && a.entrega.estado === 'Intolerable');
                          const hasJustificacion = a.entrega && a.entrega.estado === 'Justificada por Ausencia';
                          return isVencida && noEntrega && !hasJustificacion;
                        })
                        .map(act => {
                          // Calcular si aún está dentro de los días de gracia (5 días del Nivel 3)
                          const limitDate = new Date(act.fecha_hora_limite);
                          const currentDate = new Date();
                          const diffMs = currentDate - limitDate;
                          const hrsRetraso = Math.floor(diffMs / (1000 * 60 * 60));
                          const diasRetraso = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
                          
                          const prorrga1 = rendimiento.configuracionesProrrogas.nivel1;
                          const prorrga2 = rendimiento.configuracionesProrrogas.nivel2;
                          const prorrga3 = rendimiento.configuracionesProrrogas.nivel3;
                          
                          let nivelActivo = 'Intolerable';
                          let notaMaxActiva = 10;
                          let horasRestantesFase = 0;
                          let sigFaseLabel = '';
                          
                          if (diasRetraso <= prorrga1.dias) {
                            nivelActivo = 'Nivel 1';
                            notaMaxActiva = prorrga1.notaMax;
                            const hrsLimiteFase = prorrga1.dias * 24;
                            horasRestantesFase = hrsLimiteFase - hrsRetraso;
                            sigFaseLabel = `Bajo el ${prorrga2.notaMax}%`;
                          } else if (diasRetraso <= prorrga2.dias) {
                            nivelActivo = 'Nivel 2';
                            notaMaxActiva = prorrga2.notaMax;
                            const hrsLimiteFase = prorrga2.dias * 24;
                            horasRestantesFase = hrsLimiteFase - hrsRetraso;
                            sigFaseLabel = `Bajo el ${prorrga3.notaMax}%`;
                          } else if (diasRetraso <= prorrga3.dias) {
                            nivelActivo = 'Nivel 3';
                            notaMaxActiva = prorrga3.notaMax;
                            const hrsLimiteFase = prorrga3.dias * 24;
                            horasRestantesFase = hrsLimiteFase - hrsRetraso;
                            sigFaseLabel = 'Bloqueo automático';
                          }

                          const pctRestante = Math.max(0, Math.min(100, (horasRestantesFase / 24) * 100));

                          return (
                            <div 
                              key={act.id} 
                              className="stitch-card" 
                              style={{
                                padding: '24px',
                                borderLeft: '6px solid var(--stitch-danger)',
                                backgroundColor: '#FFF5F5'
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                                <div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--stitch-danger)', fontWeight: '700', fontSize: '13px' }}>
                                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>warning</span>
                                    <span>Tolerancia de Entrega Activa: {nivelActivo}</span>
                                  </div>
                                  <h5 className="stitch-title-font" style={{ margin: '8px 0 4px 0', fontSize: '17px', color: 'var(--stitch-primary)', fontWeight: '800' }}>
                                    {act.titulo}
                                  </h5>
                                  <p style={{ margin: 0, fontSize: '12px', color: 'var(--stitch-text-secondary)' }}>
                                    Venció el: {formatFecha(act.fecha_hora_limite)} ({diasRetraso} días de retraso)
                                  </p>
                                </div>

                                <div style={{
                                  backgroundColor: 'rgba(239, 68, 68, 0.1)',
                                  padding: '10px 16px',
                                  borderRadius: '8px',
                                  textAlign: 'center',
                                  border: '1px solid rgba(239, 68, 68, 0.2)',
                                  minWidth: '130px'
                                }}>
                                  <span style={{ fontSize: '10px', color: '#991B1B', fontWeight: '700', textTransform: 'uppercase', display: 'block' }}>
                                    Nota Máxima
                                  </span>
                                  <span style={{ fontSize: '20px', fontWeight: '800', color: '#991B1B' }}>
                                    {notaMaxActiva}%
                                  </span>
                                  <span style={{ fontSize: '9px', color: '#777', display: 'block' }}>
                                    ({(act.ponderacion * (notaMaxActiva / 100)).toFixed(1)} / {act.ponderacion} pts)
                                  </span>
                                </div>
                              </div>

                              {nivelActivo !== 'Intolerable' ? (
                                <div style={{ backgroundColor: '#FFFFFF', padding: '16px', borderRadius: '8px', border: '1px solid rgba(239, 68, 68, 0.1)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '600', color: 'var(--stitch-text-primary)', marginBottom: '8px' }}>
                                    <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                      <span className="material-icons-outlined" style={{ fontSize: '16px', color: 'var(--stitch-warning)' }}>schedule</span>
                                      Quedan aproximadamente {horasRestantesFase} horas en esta fase
                                    </span>
                                    <span style={{ color: 'var(--stitch-text-secondary)' }}>Siguiente fase: {sigFaseLabel}</span>
                                  </div>

                                  <div style={{ width: '100%', height: '8px', backgroundColor: '#E2E8F0', borderRadius: '4px', overflow: 'hidden' }}>
                                    <div style={{
                                      width: `${pctRestante}%`,
                                      height: '100%',
                                      backgroundColor: 'var(--stitch-warning)',
                                      borderRadius: '4px'
                                    }} />
                                  </div>

                                  {/* Cronograma Visual de Prórroga */}
                                  <div style={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    marginTop: '16px',
                                    fontSize: '11px',
                                    color: 'var(--stitch-text-secondary)',
                                    fontWeight: '500',
                                    position: 'relative'
                                  }}>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                                      <span style={{ color: nivelActivo === 'Nivel 1' ? 'var(--stitch-secondary)' : '#999', fontWeight: '700' }}>Nivel 1 (75%)</span>
                                      <span>Máx. {prorrga1.dias} día</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                      <span style={{ color: nivelActivo === 'Nivel 2' ? 'var(--stitch-secondary)' : '#999', fontWeight: '700' }}>Nivel 2 (50%)</span>
                                      <span>Máx. {prorrga2.dias} días</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                      <span style={{ color: nivelActivo === 'Nivel 3' ? 'var(--stitch-secondary)' : '#999', fontWeight: '700' }}>Nivel 3 (25%)</span>
                                      <span>Máx. {prorrga3.dias} días</span>
                                    </div>
                                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                                      <span style={{ color: nivelActivo === 'Intolerable' ? 'var(--stitch-danger)' : '#999', fontWeight: '700' }}>Bloqueo (10%)</span>
                                      <span>Expirado</span>
                                    </div>
                                  </div>
                                </div>
                              ) : (
                                <div className="stitch-alert stitch-alert-danger" style={{ margin: 0, fontSize: '13px' }}>
                                  <span className="material-icons-outlined" style={{ fontSize: '18px' }}>lock_clock</span>
                                  <span>
                                    El tiempo de prórroga ha vencido. La tarea ha sido bloqueada automáticamente con nota mínima de contingencia del 10% ({(act.ponderacion * 0.1).toFixed(1)} pts).
                                  </span>
                                </div>
                              )}

                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>
              )}

            </div>
          )}

        </div>
      )}

      {/* ── MODAL DETALLE DE ACTIVIDAD (STITCH UI) ── */}
      {selectedActividadModal && (
        <div className="stitch-modal-backdrop" onClick={() => setSelectedActividadModal(null)}>
          <div className="stitch-modal-content" style={{ width: '550px' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--stitch-border)', paddingBottom: '16px', marginBottom: '20px' }}>
              <div>
                <span className="stitch-badge stitch-badge-info" style={{ fontSize: '10px', marginBottom: '8px' }}>
                  {selectedActividadModal.tipo_actividad}
                </span>
                <h4 className="stitch-title-font" style={{ margin: 0, fontSize: '18px', color: 'var(--stitch-primary)', fontWeight: '800' }}>
                  {selectedActividadModal.titulo}
                </h4>
              </div>
              <button 
                onClick={() => setSelectedActividadModal(null)} 
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--stitch-text-secondary)' }}
              >
                <span className="material-icons-outlined">close</span>
              </button>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', fontSize: '14px', lineHeight: '1.5' }}>
              <div>
                <strong style={{ display: 'block', color: 'var(--stitch-text-primary)', marginBottom: '4px' }}>Descripción:</strong>
                <p style={{ margin: 0, color: 'var(--stitch-text-secondary)', fontSize: '13px' }}>
                  {selectedActividadModal.descripcion || 'Sin descripción detallada registrada por el docente.'}
                </p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', backgroundColor: 'var(--stitch-hover)', padding: '16px', borderRadius: 'var(--stitch-radius-md)' }}>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)', display: 'block' }}>VALORACIÓN</span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--stitch-primary)' }}>{selectedActividadModal.ponderacion} Pts.</span>
                </div>
                <div>
                  <span style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)', display: 'block' }}>ENTREGA</span>
                  <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--stitch-primary)' }}>{selectedActividadModal.modalidad_entrega}</span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ fontSize: '11px', color: 'var(--stitch-text-secondary)', display: 'block' }}>FECHA LÍMITE</span>
                  <span style={{ fontSize: '14px', fontWeight: '700', color: 'var(--stitch-danger)' }}>{formatFecha(selectedActividadModal.fecha_hora_limite)}</span>
                </div>
              </div>

              {/* Archivos y Recursos Adjuntos */}
              {selectedActividadModal.recursos_adjuntos_url && (
                <div>
                  <strong style={{ display: 'block', color: 'var(--stitch-text-primary)', marginBottom: '8px' }}>Recursos y Adjuntos del Profesor:</strong>
                  <a 
                    href={selectedActividadModal.recursos_adjuntos_url}
                    target="_blank" 
                    rel="noreferrer"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '8px',
                      color: 'var(--stitch-secondary)',
                      textDecoration: 'none',
                      fontSize: '13px',
                      fontWeight: '600',
                      backgroundColor: 'rgba(59, 130, 246, 0.08)',
                      padding: '8px 12px',
                      borderRadius: '6px'
                    }}
                  >
                    <span className="material-icons-outlined" style={{ fontSize: '18px' }}>attachment</span>
                    Descargar Material de Apoyo
                  </a>
                </div>
              )}

              {/* Si hay datos de entrega, mostrar detalle premium del estado */}
              {selectedActividadModal.entrega && (
                <div style={{ marginTop: '8px', borderTop: '1px solid var(--stitch-border)', paddingTop: '16px' }}>
                  <h5 style={{ margin: '0 0 12px 0', fontSize: '13px', color: 'var(--stitch-primary)', fontWeight: '700' }}>
                    Información de Envío del Estudiante:
                  </h5>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--stitch-text-secondary)' }}>Estado registrado:</span>
                      <strong style={{ color: 'var(--stitch-text-primary)' }}>{selectedActividadModal.entrega.estado}</strong>
                    </div>

                    {selectedActividadModal.entrega.fecha_hora_entrega && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--stitch-text-secondary)' }}>Fecha de entrega:</span>
                        <span style={{ fontWeight: '500' }}>{formatFecha(selectedActividadModal.entrega.fecha_hora_entrega)}</span>
                      </div>
                    )}

                    {selectedActividadModal.entrega.fecha_calificacion && (
                      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--stitch-text-secondary)' }}>Calificado el:</span>
                        <span style={{ fontWeight: '500' }}>{formatFecha(selectedActividadModal.entrega.fecha_calificacion)}</span>
                      </div>
                    )}

                    {/* Explicación de las prórrogas/penalizaciones aplicadas */}
                    {selectedActividadModal.entrega.penalizacion_aplicada > 0 && (
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(245, 158, 11, 0.08)',
                        border: '1px solid rgba(245, 158, 11, 0.15)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--stitch-warning)', fontWeight: '700', fontSize: '12px', marginBottom: '4px' }}>
                          <span className="material-icons-outlined" style={{ fontSize: '16px' }}>schedule</span>
                          <span>Descuento por Entrega Tardía Aplicado</span>
                        </div>
                        <p style={{ margin: 0, fontSize: '12px', color: 'var(--stitch-text-secondary)' }}>
                          Se aplicó una penalización del <strong>{selectedActividadModal.entrega.penalizacion_aplicada}%</strong>.
                          La nota máxima calificada se redujo en correspondencia con los niveles de prórroga institucionales.
                        </p>
                      </div>
                    )}

                    {/* Explicación de Caso Especial / Excepción */}
                    {selectedActividadModal.entrega.estado === 'Caso Especial' && (
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(16, 185, 129, 0.08)',
                        border: '1px solid rgba(16, 185, 129, 0.15)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--stitch-success)', fontWeight: '700', fontSize: '12px', marginBottom: '6px' }}>
                          <span className="material-icons-outlined" style={{ fontSize: '16px' }}>verified</span>
                          <span>Excepción Manual Registrada</span>
                        </div>
                        <p style={{ margin: '0 0 6px 0', fontSize: '12px', color: 'var(--stitch-text-primary)', fontWeight: '600' }}>
                          Autorización del Docente: "{selectedActividadModal.entrega.justificacion_maestro}"
                        </p>
                        <p style={{ margin: 0, fontSize: '11px', color: 'var(--stitch-text-secondary)' }}>
                          Calificable sobre el <strong>{selectedActividadModal.entrega.porcentaje_entrega_personalizado}%</strong>. Nueva fecha acordada: {formatFecha(selectedActividadModal.entrega.nueva_fecha_limite)}.
                        </p>
                      </div>
                    )}

                    {/* Explicación de Justificada con botón de Puesta al día */}
                    {selectedActividadModal.entrega.estado === 'Justificada por Ausencia' && (
                      <div style={{
                        marginTop: '8px',
                        padding: '12px',
                        borderRadius: '6px',
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.15)',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px'
                      }}>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--stitch-info)', fontWeight: '700', fontSize: '12px', marginBottom: '4px' }}>
                            <span className="material-icons-outlined" style={{ fontSize: '16px' }}>info_outline</span>
                            <span>Ausencia Justificada Aprobada</span>
                          </div>
                          <p style={{ margin: 0, fontSize: '12px', color: 'var(--stitch-text-secondary)' }}>
                            El estudiante faltó el día de la entrega con justificación médica o familiar aprobada. La nota se mantiene temporalmente exenta.
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedActividadModal(null);
                            alert('Abriendo el Itinerario de Puesta al Día para recuperar las actividades del día de la falta.');
                          }}
                          className="stitch-button"
                          style={{
                            padding: '6px 12px',
                            fontSize: '11px',
                            backgroundColor: 'var(--stitch-info)',
                            alignSelf: 'flex-start'
                          }}
                        >
                          <span className="material-icons-outlined" style={{ fontSize: '14px' }}>menu_book</span>
                          Itinerario de Puesta al Día
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: '24px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedActividadModal(null)} 
                className="stitch-button"
                style={{ padding: '8px 16px', fontSize: '13px' }}
              >
                Cerrar Detalle
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
