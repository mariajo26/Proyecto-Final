import React, { useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import '../styles/StTheme.css';

/**
 * WeeklyScheduleCalendar
 * Componente unificado y modular para visualizar el horario de clases y actividades
 * bajo el sistema de diseño Stitch Google.
 * 
 * Props:
 * - scheduleData: Array de asignaciones del backend, ej: [{ dia: 'Lunes', periodo: 1, materia: 'Física', grado: '4to A', aula: 'L1' }]
 * - temporaryActivities: Array de eventos momentáneos temporales: [{ dia: 'Martes', periodo: 3, titulo: 'Reunión Docente', fecha: '2026-07-10' }]
 * - title: Título opcional de la cabecera
 */
export default function WeeklyScheduleCalendar({ scheduleData = [], temporaryActivities = [], title = "Horario de Clases" }) {
    const { usuario } = useAuth();
    const [vistaDiaria, setVistaDiaria] = useState(false);
    const [diaSeleccionado, setDiaSeleccionado] = useState('Lunes');

    const diasSemana = useMemo(() => ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes'], []);

    // Bloques horarios oficiales de la jornada escolar
    const jornadaConfig = useMemo(() => [
        { id: 'guia_inicial', horaInicio: '07:00', horaFin: '07:05', duracion: 5, clasificacion: 'Guia Inicial', nombre: 'Bloque Inicial: Profesor Guía', inamovible: true },
        { id: 'periodo_1', horaInicio: '07:05', horaFin: '07:55', duracion: 50, clasificacion: 'Periodo Academico', numero: 1, inamovible: false },
        { id: 'periodo_2', horaInicio: '07:55', horaFin: '08:45', duracion: 50, clasificacion: 'Periodo Academico', numero: 2, inamovible: false },
        { id: 'periodo_3', horaInicio: '08:45', horaFin: '09:35', duracion: 50, clasificacion: 'Periodo Academico', numero: 3, inamovible: false },
        { id: 'recreo', horaInicio: '09:35', horaFin: '10:15', duracion: 40, clasificacion: 'Recreo', nombre: 'Recreo / Receso General', inamovible: true },
        { id: 'periodo_4', horaInicio: '10:15', horaFin: '11:05', duracion: 50, clasificacion: 'Periodo Academico', numero: 4, inamovible: false },
        { id: 'periodo_5', horaInicio: '11:05', horaFin: '11:55', duracion: 50, clasificacion: 'Periodo Academico', numero: 5, inamovible: false },
        { id: 'periodo_6', horaInicio: '11:55', horaFin: '12:45', duracion: 50, clasificacion: 'Periodo Academico', numero: 6, inamovible: false },
        { id: 'transicion', horaInicio: '12:45', horaFin: '12:55', duracion: 10, clasificacion: 'Transicion', nombre: 'Tiempo de Transición / Libre', inamovible: true },
        { id: 'guia_final', horaInicio: '12:55', horaFin: '13:00', duracion: 5, clasificacion: 'Guia Final', nombre: 'Bloque Final: Profesor Guía', inamovible: true }
    ], []);

    // Construcción de la matriz horaria mezclando clases normales + actividades momentáneas
    const matrizHoraria = useMemo(() => {
        return jornadaConfig.map(periodo => {
            const diasFila = {};
            diasSemana.forEach(dia => {
                if (periodo.inamovible) {
                    diasFila[dia] = {
                        tipo: 'BloqueFijo',
                        clasificacion: periodo.clasificacion,
                        nombre: periodo.nombre
                    };
                } else {
                    // 1. Buscar si hay una actividad momentánea programada para hoy en este periodo
                    const actividad = temporaryActivities.find(
                        act => act.dia === dia && act.periodo === periodo.numero
                    );

                    if (actividad) {
                        diasFila[dia] = {
                            tipo: 'ActividadMomentanea',
                            materia: actividad.titulo,
                            grado: 'Evento Especial',
                            aula: actividad.aula || 'Salón Principal',
                            esMomentaneo: true
                        };
                    } else {
                        // 2. Buscar clase regular
                        const clase = scheduleData.find(
                            asig => asig.dia === dia && asig.periodo === periodo.numero
                        );
                        if (clase) {
                            diasFila[dia] = {
                                tipo: 'Clase',
                                materia: clase.materia,
                                grado: clase.grado,
                                aula: clase.aula
                            };
                        } else {
                            diasFila[dia] = {
                                tipo: 'Libre',
                                nombre: 'Período Libre'
                            };
                        }
                    }
                }
            });
            return {
                ...periodo,
                dias: diasFila
            };
        });
    }, [jornadaConfig, diasSemana, scheduleData, temporaryActivities]);

    const handleSiguienteDia = () => {
        const idx = diasSemana.indexOf(diaSeleccionado);
        if (idx < diasSemana.length - 1) {
            setDiaSeleccionado(diasSemana[idx + 1]);
        } else {
            setDiaSeleccionado(diasSemana[0]);
        }
    };

    const handleAnteriorDia = () => {
        const idx = diasSemana.indexOf(diaSeleccionado);
        if (idx > 0) {
            setDiaSeleccionado(diasSemana[idx - 1]);
        } else {
            setDiaSeleccionado(diasSemana[diasSemana.length - 1]);
        }
    };

    return (
        <div className="weekly-schedule-calendar-printable" style={{
            backgroundColor: '#FFFFFF',
            borderRadius: 'var(--stitch-radius-md, 12px)',
            border: '1px solid var(--stitch-border, #E5E7EB)',
            boxShadow: 'var(--stitch-shadow-md, 0 4px 6px -1px rgba(0, 0, 0, 0.1))',
            padding: '24px',
            fontFamily: 'var(--stitch-font, inherit)'
        }}>


            {/* Header del Calendario Horario */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                flexWrap: 'wrap',
                gap: '16px',
                marginBottom: '20px',
                borderBottom: '1px solid var(--stitch-border, #E5E7EB)',
                paddingBottom: '16px'
            }}>
                <h3 style={{
                    color: 'var(--stitch-primary, #0D2C54)',
                    fontWeight: '600',
                    fontSize: '1.25rem',
                    margin: 0
                }}>{title}</h3>

                {/* Alternador de Vista (Semanal vs Diaria) e Impresión */}
                <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }} className="no-print">
                    <button
                        onClick={() => window.print()}
                        className="stitch-button-secondary"
                    >
                        <span className="material-icons-outlined">print</span>
                        Imprimir
                    </button>
                    
                    <button
                        onClick={() => setVistaDiaria(false)}
                        className={!vistaDiaria ? 'stitch-button' : 'stitch-button-secondary'}
                    >
                        <span className="material-icons-outlined">view_week</span>
                        Vista Semanal
                    </button>
                    
                    <button
                        onClick={() => setVistaDiaria(true)}
                        className={vistaDiaria ? 'stitch-button' : 'stitch-button-secondary'}
                    >
                        <span className="material-icons-outlined">calendar_view_day</span>
                        Vista Diaria
                    </button>
                </div>
            </div>

            {/* Controles de Navegación de Día (si la vista es diaria) */}
            {vistaDiaria && (
                <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: '#F3F4F6',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    marginBottom: '16px'
                }}>
                    <button onClick={handleAnteriorDia} className="stitch-btn-secondary" style={{ padding: '6px 12px', borderRadius: '4px' }}>
                        &larr; Anterior
                    </button>
                    <span style={{ fontWeight: '600', color: 'var(--stitch-primary, #0D2C54)', fontSize: '1.1rem' }}>
                        {diaSeleccionado}
                    </span>
                    <button onClick={handleSiguienteDia} className="stitch-btn-secondary" style={{ padding: '6px 12px', borderRadius: '4px' }}>
                        Siguiente &rarr;
                    </button>
                </div>
            )}

            {/* Cuadrícula / Matriz Horaria */}
            <div style={{ overflowX: 'auto' }}>
                <table style={{
                    width: '100%',
                    borderCollapse: 'separate',
                    borderSpacing: '4px',
                    fontSize: '14px'
                }}>
                    <thead>
                        <tr style={{ backgroundColor: '#F9FAFB' }}>
                            <th style={{ padding: '12px', textAlign: 'left', color: '#374151', fontWeight: '600', borderBottom: '2px solid #E5E7EB', width: '120px' }}>Hora</th>
                            {!vistaDiaria ? (
                                diasSemana.map(dia => (
                                    <th key={dia} style={{ padding: '12px', textAlign: 'center', color: '#374151', fontWeight: '600', borderBottom: '2px solid #E5E7EB' }}>
                                        {dia}
                                    </th>
                                ))
                            ) : (
                                <th style={{ padding: '12px', textAlign: 'center', color: '#374151', fontWeight: '600', borderBottom: '2px solid #E5E7EB' }}>
                                    {diaSeleccionado}
                                </th>
                            )}
                        </tr>
                    </thead>
                    <tbody>
                        {matrizHoraria.map(fila => (
                            <tr key={fila.id}>
                                {/* Bloque de tiempo */}
                                <td style={{
                                    padding: '12px',
                                    fontWeight: '500',
                                    color: '#4B5563',
                                    borderRight: '1px solid #E5E7EB',
                                    verticalAlign: 'middle'
                                }}>
                                    <div style={{ fontWeight: '600', color: 'var(--stitch-primary, #0D2C54)' }}>
                                        {fila.horaInicio} - {fila.horaFin}
                                    </div>
                                    <div style={{ fontSize: '11px', color: '#9CA3AF' }}>
                                        {fila.clasificacion}
                                    </div>
                                </td>

                                {/* Celdas por día */}
                                {!vistaDiaria ? (
                                    diasSemana.map(dia => {
                                        const celda = fila.dias[dia];
                                        return renderCelda(celda, dia + fila.id);
                                    })
                                ) : (
                                    renderCelda(fila.dias[diaSeleccionado], diaSeleccionado + fila.id)
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pie de Firma/Identificación en Impresión */}
            <div className="print-only-footer" style={{
                marginTop: '16px',
                textAlign: 'right',
                fontSize: '12px',
                color: '#374151',
                fontWeight: '600',
                fontFamily: 'var(--stitch-font, sans-serif)'
            }}>
                <span>{usuario?.nombre || usuario?.codigo_ua || 'Desconocido'} · {usuario?.rol || 'Visitante'}</span>
            </div>
        </div>
    );

    // Función auxiliar para renderizar celdas individuales
    function renderCelda(celda, key) {
        if (!celda) return <td key={key}></td>;

        let style = {
            padding: '12px',
            borderRadius: '6px',
            textAlign: 'center',
            verticalAlign: 'middle',
            transition: 'all 0.2s'
        };

        if (celda.tipo === 'BloqueFijo') {
            style.backgroundColor = 'var(--stitch-background-alert, #FEF3C7)'; // Naranja/Amarillo tenue
            style.border = '1px solid var(--stitch-border-alert, #FDE68A)';
            style.color = 'var(--stitch-text-alert, #92400E)';
            style.fontWeight = '600';
            return (
                <td key={key} style={style}>
                    <div>{celda.nombre}</div>
                </td>
            );
        }

        if (celda.tipo === 'ActividadMomentanea') {
            style.backgroundColor = '#F0FDF4'; // Verde suave
            style.border = '1px dashed #4ADE80';
            style.color = '#15803D';
            style.fontWeight = '600';
            style.cursor = 'default';
            return (
                <td key={key} style={style}>
                    <div style={{ fontSize: '11px', color: '#166534', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '12px' }}>bolt</span>
                        Actividad Especial
                    </div>
                    <div style={{ fontWeight: '700' }}>{celda.materia}</div>
                    <div style={{ fontSize: '12px', opacity: 0.9, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '11px' }}>place</span>
                        {celda.aula}
                    </div>
                </td>
            );
        }

        if (celda.tipo === 'Clase') {
            style.backgroundColor = 'var(--stitch-background-primary-light, #EFF6FF)'; // Celeste suave
            style.border = '1px solid var(--stitch-border, #BFDBFE)';
            style.color = 'var(--stitch-primary, #1E40AF)';
            return (
                <td key={key} style={style}>
                    <div style={{ fontWeight: '600' }}>{celda.materia}</div>
                    <div style={{ fontSize: '12px', color: '#4B5563' }}>{celda.grado}</div>
                    <div style={{ fontSize: '11px', color: '#6B7280', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '2px' }}>
                        <span className="material-icons-outlined" style={{ fontSize: '11px' }}>place</span>
                        {celda.aula}
                    </div>
                </td>
            );
        }

        // Período Libre
        style.backgroundColor = '#F9FAFB';
        style.border = '1px solid #E5E7EB';
        style.color = '#9CA3AF';
        style.fontStyle = 'italic';
        return (
            <td key={key} style={style}>
                <div>Período Libre</div>
            </td>
        );
    }
}
