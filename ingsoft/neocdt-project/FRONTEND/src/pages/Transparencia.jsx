// =========================================
// TRANSPARENCIA.JSX - INFORMACIÓN CORPORATIVA Y REGULATORIA
// =========================================
// Esta página institucional presenta:
// - Indicadores financieros y métricas de solvencia
// - Documentos legales y regulatorios
// - Certificaciones y autorizaciones vigentes
// - Estructura de gobierno corporativo 

import React from "react";
import { Link } from "react-router-dom";

const Transparencia = () => {
    // ===== CONFIGURACIÓN DE DOCUMENTOS LEGALES =====
    const documentosLegales = [
        {
            id: 1,
            categoria: "Información Corporativa",
            titulo: "Estados Financieros 2024",
            descripcion: "Balance general y estado de resultados auditados",
            fecha: "Marzo 2024",
            tipo: "PDF",
            tamaño: "2.3 MB",
            icon: "📊"
        },
        {
            id: 2,
            categoria: "Información Corporativa",
            titulo: "Informe de Gestión Anual",
            descripcion: "Reporte completo de actividades y logros del año",
            fecha: "Diciembre 2023",
            tipo: "PDF",
            tamaño: "5.1 MB",
            icon: "📈"
        },
        {
            id: 3,
            categoria: "Marco Regulatorio",
            titulo: "Código de Ética y Conducta",
            descripcion: "Principios y valores que rigen nuestras operaciones",
            fecha: "Enero 2024",
            tipo: "PDF",
            tamaño: "1.8 MB",
            icon: "⚖️"
        },
        {
            id: 4,
            categoria: "Marco Regulatorio",
            titulo: "Política de Protección de Datos",
            descripcion: "Tratamiento y protección de información personal",
            fecha: "Febrero 2024",
            tipo: "PDF",
            tamaño: "2.1 MB",
            icon: "🔒"
        },
        {
            id: 5,
            categoria: "Productos y Servicios",
            titulo: "Tarifario CDTs",
            descripcion: "Tasas de interés y condiciones vigentes",
            fecha: "Septiembre 2024",
            tipo: "PDF",
            tamaño: "900 KB",
            icon: "💰"
        },
        {
            id: 6,
            categoria: "Productos y Servicios",
            titulo: "Reglamento de CDTs",
            descripcion: "Términos y condiciones para Certificados de Depósito",
            fecha: "Agosto 2024",
            tipo: "PDF",
            tamaño: "3.2 MB",
            icon: "📋"
        }
    ];

    const indicadores = [
        {
            nombre: "Solvencia",
            valor: "18.2%",
            descripcion: "Relación de patrimonio técnico sobre activos ponderados por riesgo",
            meta: "Mínimo 9%",
            status: "excelente"
        },
        {
            nombre: "Liquidez",
            valor: "25.8%",
            descripcion: "Capacidad para cumplir obligaciones de corto plazo",
            meta: "Mínimo 20%",
            status: "bueno"
        },
        {
            nombre: "Calidad de Activos",
            valor: "2.1%",
            descripcion: "Cartera vencida sobre cartera total",
            meta: "Máximo 5%",
            status: "excelente"
        },
        {
            nombre: "Rentabilidad (ROE)",
            valor: "12.4%",
            descripcion: "Rentabilidad sobre patrimonio",
            meta: "Objetivo 10-15%",
            status: "bueno"
        }
    ];

    const certificaciones = [
        {
            entidad: "Superintendencia Financiera",
            certificacion: "Autorización de Funcionamiento",
            numero: "SF-2023-001",
            vigencia: "Indefinida",
            icon: "🏛️"
        },
        {
            entidad: "ISO 27001",
            certificacion: "Seguridad de la Información",
            numero: "ISO-27001-2024",
            vigencia: "2024-2027",
            icon: "🔐"
        },
        {
            entidad: "FOGAFIN",
            certificacion: "Seguro de Depósitos",
            numero: "FOGAFIN-2024",
            vigencia: "Activa",
            icon: "🛡️"
        }
    ];

    const getStatusColor = (status) => {
        switch (status) {
            case 'excelente': return '#27AE60';
            case 'bueno': return '#3498DB';
            case 'regular': return '#F39C12';
            default: return '#95A5A6';
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'excelente': return '🟢';
            case 'bueno': return '🔵';
            case 'regular': return '🟡';
            default: return '⚫';
        }
    };

    return (
        <div className="transparencia-page">
            <div className="transparencia-container">
                {/* Header */}
                <div className="transparencia-header">
                    <Link to="/" className="back-button">
                        ← Regresar al Inicio
                    </Link>
                    <div className="header-content">
                        <h1>Transparencia y Buen Gobierno</h1>
                        <p>
                            En NeoBank creemos en la transparencia como pilar fundamental de la confianza. 
                            Aquí encontrarás toda la información relevante sobre nuestra gestión, estados financieros y marco regulatorio.
                        </p>
                    </div>
                </div>

                {/* Indicadores Financieros */}
                <div className="indicadores-section">
                    <h2>Indicadores Financieros</h2>
                    <p>Principales métricas de solidez y performance financiera</p>
                    
                    <div className="indicadores-grid">
                        {indicadores.map((indicador, index) => (
                            <div key={`indicador-${index}`} className="indicador-card">
                                <div className="indicador-header">
                                    <span className="status-icon">{getStatusIcon(indicador.status)}</span>
                                    <h3>{indicador.nombre}</h3>
                                </div>
                                <div className="indicador-valor" style={{ color: getStatusColor(indicador.status) }}>
                                    {indicador.valor}
                                </div>
                                <p className="indicador-descripcion">{indicador.descripcion}</p>
                                <div className="indicador-meta">
                                    <small><strong>Meta:</strong> {indicador.meta}</small>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Documentos por Categoría */}
                <div className="documentos-section">
                    <h2>Centro de Documentos</h2>
                    <p>Accede a nuestra información corporativa, regulatoria y de productos</p>
                    
                    {["Información Corporativa", "Marco Regulatorio", "Productos y Servicios"].map(categoria => (
                        <div key={categoria} className="categoria-seccion">
                            <h3 className="categoria-titulo">{categoria}</h3>
                            <div className="documentos-grid">
                                {documentosLegales
                                    .filter(doc => doc.categoria === categoria)
                                    .map(documento => (
                                        <div key={documento.id} className="documento-card">
                                            <div className="documento-icon">{documento.icon}</div>
                                            <div className="documento-content">
                                                <h4>{documento.titulo}</h4>
                                                <p>{documento.descripcion}</p>
                                                <div className="documento-meta">
                                                    <span className="fecha">📅 {documento.fecha}</span>
                                                    <span className="tipo">{documento.tipo}</span>
                                                    <span className="tamaño">{documento.tamaño}</span>
                                                </div>
                                            </div>
                                            <div className="documento-actions">
                                                <button className="btn-descargar">
                                                    📥 Descargar
                                                </button>
                                                <button className="btn-ver">
                                                    👁️ Ver
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                }
                            </div>
                        </div>
                    ))}
                </div>

                {/* Certificaciones */}
                <div className="certificaciones-section">
                    <h2>Certificaciones y Autorizaciones</h2>
                    <p>Reconocimientos y autorizaciones que respaldan nuestra operación</p>
                    
                    <div className="certificaciones-grid">
                        {certificaciones.map((cert, index) => (
                            <div key={`cert-${index}`} className="certificacion-card">
                                <div className="cert-icon">{cert.icon}</div>
                                <div className="cert-content">
                                    <h4>{cert.certificacion}</h4>
                                    <p><strong>Entidad:</strong> {cert.entidad}</p>
                                    <p><strong>Número:</strong> {cert.numero}</p>
                                    <p><strong>Vigencia:</strong> {cert.vigencia}</p>
                                </div>
                                <div className="cert-status">
                                    ✅ Activa
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Gobierno Corporativo */}
                <div className="gobierno-section">
                    <h2>Estructura de Gobierno Corporativo</h2>
                    
                    <div className="gobierno-cards">
                        <div className="gobierno-card">
                            <div className="card-header">
                                <span className="card-icon">👥</span>
                                <h3>Junta Directiva</h3>
                            </div>
                            <div className="card-content">
                                <p>Órgano colegiado de dirección que define la estrategia y supervisa la gestión.</p>
                                <ul>
                                    <li>7 miembros principales</li>
                                    <li>2 miembros independientes</li>
                                    <li>Reuniones mensuales</li>
                                    <li>Comités especializados</li>
                                </ul>
                            </div>
                        </div>

                        <div className="gobierno-card">
                            <div className="card-header">
                                <span className="card-icon">🔍</span>
                                <h3>Auditoría y Control</h3>
                            </div>
                            <div className="card-content">
                                <p>Sistema integral de control interno y gestión de riesgos.</p>
                                <ul>
                                    <li>Auditoría externa anual</li>
                                    <li>Control interno permanente</li>
                                    <li>Gestión integral de riesgos</li>
                                    <li>Cumplimiento normativo</li>
                                </ul>
                            </div>
                        </div>

                        <div className="gobierno-card">
                            <div className="card-header">
                                <span className="card-icon">📊</span>
                                <h3>Revelación de Información</h3>
                            </div>
                            <div className="card-content">
                                <p>Comunicación transparente y oportuna a todos los grupos de interés.</p>
                                <ul>
                                    <li>Informes trimestrales</li>
                                    <li>Estados financieros auditados</li>
                                    <li>Revelación de información relevante</li>
                                    <li>Canal de denuncias</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compromiso con la Sociedad */}
                <div className="compromiso-section">
                    <h2>Nuestro Compromiso</h2>
                    
                    <div className="compromiso-grid">
                        <div className="compromiso-item">
                            <div className="compromiso-icon">🌱</div>
                            <h4>Sostenibilidad</h4>
                            <p>Comprometidos con prácticas ambientalmente responsables y desarrollo sostenible.</p>
                        </div>
                        
                        <div className="compromiso-item">
                            <div className="compromiso-icon">🤝</div>
                            <h4>Inclusión Financiera</h4>
                            <p>Facilitamos el acceso a servicios financieros para todos los segmentos de la población.</p>
                        </div>
                        
                        <div className="compromiso-item">
                            <div className="compromiso-icon">🔒</div>
                            <h4>Protección de Datos</h4>
                            <p>Garantizamos la seguridad y privacidad de la información de nuestros clientes.</p>
                        </div>
                        
                        <div className="compromiso-item">
                            <div className="compromiso-icon">⚖️</div>
                            <h4>Ética y Transparencia</h4>
                            <p>Actuamos con integridad y transparencia en todas nuestras operaciones.</p>
                        </div>
                    </div>
                </div>

                {/* Contacto */}
                <div className="contacto-transparencia">
                    <div className="contacto-content">
                        <h3>¿Tienes preguntas sobre nuestra información?</h3>
                        <p>Para consultas específicas sobre transparencia, gobierno corporativo o información financiera:</p>
                        <div className="contacto-details">
                            <div className="contacto-item">
                                <strong>📧 Email:</strong>
                                <a href="mailto:transparencia@neobank.com.co">transparencia@neobank.com.co</a>
                            </div>
                            <div className="contacto-item">
                                <strong>📞 Teléfono:</strong>
                                <a href="tel:018000123456">(01) 8000 123 456</a>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Transparencia;