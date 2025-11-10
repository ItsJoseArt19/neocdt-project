// =========================================
// CANALESATENCION.JSX - PÁGINA DE CONTACTO Y SOPORTE
// =========================================
// Esta página institucional proporciona:
// - Información completa de canales de contacto
// - Líneas especializadas por tipo de consulta
// - Horarios de atención y datos de emergencia
// - Consejos para optimizar el servicio al cliente

import React from "react";
import { Link } from "react-router-dom";

const CanalesAtencion = () => {
    // ===== CONFIGURACIÓN DE CANALES DE ATENCIÓN =====
    const canales = [
        {
            id: 1,
            titulo: "Línea de Atención al Cliente",
            descripcion: "Atención personalizada 24/7 para resolver todas tus consultas",
            telefono: "(01) 8000 123 456",
            horario: "24 horas, todos los días",
            icon: "📞",
            color: "#3498DB"
        },
        {
            id: 2,
            titulo: "Chat en Línea",
            descripcion: "Chatea con nuestros asesores especializados en tiempo real",
            enlace: "#chat",
            horario: "Lunes a Domingo: 7:00 AM - 11:00 PM",
            icon: "💬",
            color: "#27AE60"
        },
        {
            id: 3,
            titulo: "Correo Electrónico",
            descripcion: "Envíanos tus consultas y te responderemos en máximo 24 horas",
            email: "atencion@neobank.com.co",
            horario: "Respuesta en 24 horas",
            icon: "📧",
            color: "#E74C3C"
        },
        {
            id: 4,
            titulo: "Oficinas Físicas",
            descripcion: "Visítanos en nuestras oficinas principales",
            direccion: "Carrera 7 # 32-16, Bogotá D.C.",
            horario: "Lunes a Viernes: 8:00 AM - 5:00 PM",
            icon: "🏢",
            color: "#9B59B6"
        },
        {
            id: 5,
            titulo: "WhatsApp Business",
            descripcion: "Contáctanos por WhatsApp para consultas rápidas",
            telefono: "+57 300 123 4567",
            horario: "Lunes a Sábado: 8:00 AM - 6:00 PM",
            icon: "📱",
            color: "#25D366"
        },
        {
            id: 6,
            titulo: "Redes Sociales",
            descripcion: "Síguenos y contáctanos a través de nuestras redes oficiales",
            redes: ["Facebook", "Twitter", "Instagram", "LinkedIn"],
            horario: "Respuesta en horario comercial",
            icon: "🌐",
            color: "#34495E"
        }
    ];

    const serviciosEspecializados = [
        {
            servicio: "Inversiones y CDTs",
            telefono: "(01) 8000 456 789",
            email: "inversiones@neobank.com.co",
            horario: "Lunes a Viernes: 8:00 AM - 6:00 PM"
        },
        {
            servicio: "Quejas y Reclamos",
            telefono: "(01) 8000 789 123",
            email: "pqr@neobank.com.co",
            horario: "24 horas, todos los días"
        },
        {
            servicio: "Soporte Técnico",
            telefono: "(01) 8000 321 654",
            email: "soporte@neobank.com.co",
            horario: "Lunes a Domingo: 6:00 AM - 10:00 PM"
        }
    ];

    return (
        <div className="canales-atencion-page">
            <div className="canales-container">
                {/* Header */}
                <div className="canales-header">
                    <Link to="/" className="back-button">
                        ← Regresar al Inicio
                    </Link>
                    <div className="header-content">
                        <h1>Canales de Atención</h1>
                        <p>Estamos aquí para ayudarte. Elige el canal que mejor se adapte a tus necesidades.</p>
                    </div>
                </div>

                {/* Canales Principales */}
                <div className="canales-grid">
                    {canales.map(canal => (
                        <div key={canal.id} className="canal-card" style={{ borderTopColor: canal.color }}>
                            <div className="canal-icon" style={{ color: canal.color }}>
                                {canal.icon}
                            </div>
                            <div className="canal-content">
                                <h3>{canal.titulo}</h3>
                                <p>{canal.descripcion}</p>
                                
                                <div className="canal-details">
                                    {canal.telefono && (
                                        <div className="detail-item">
                                            <strong>📞 Teléfono:</strong>
                                            <a href={`tel:${canal.telefono}`}>{canal.telefono}</a>
                                        </div>
                                    )}
                                    
                                    {canal.email && (
                                        <div className="detail-item">
                                            <strong>📧 Email:</strong>
                                            <a href={`mailto:${canal.email}`}>{canal.email}</a>
                                        </div>
                                    )}
                                    
                                    {canal.direccion && (
                                        <div className="detail-item">
                                            <strong>📍 Dirección:</strong>
                                            <span>{canal.direccion}</span>
                                        </div>
                                    )}
                                    
                                    {canal.redes && (
                                        <div className="detail-item">
                                            <strong>🌐 Redes:</strong>
                                            <div className="redes-list">
                                                {canal.redes.map(red => (
                                                    <span key={red} className="red-tag">{red}</span>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                    
                                    <div className="detail-item horario">
                                        <strong>🕒 Horario:</strong>
                                        <span>{canal.horario}</span>
                                    </div>
                                </div>
                                
                                {canal.enlace && (
                                    <button className="btn-contactar" style={{ backgroundColor: canal.color }}>
                                        Iniciar Chat
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Servicios Especializados */}
                <div className="servicios-especializados">
                    <h2>Líneas Especializadas</h2>
                    <p>Para consultas específicas, contáctanos a través de nuestras líneas especializadas:</p>
                    
                    <div className="servicios-grid">
                        {serviciosEspecializados.map((servicio, index) => (
                            <div key={index} className="servicio-especializado">
                                <h4>{servicio.servicio}</h4>
                                <div className="servicio-info">
                                    <div className="info-item">
                                        <span className="info-label">📞 Teléfono:</span>
                                        <a href={`tel:${servicio.telefono}`}>{servicio.telefono}</a>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">📧 Email:</span>
                                        <a href={`mailto:${servicio.email}`}>{servicio.email}</a>
                                    </div>
                                    <div className="info-item">
                                        <span className="info-label">🕒 Horario:</span>
                                        <span>{servicio.horario}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Información Adicional */}
                <div className="info-adicional">
                    <div className="info-cards">
                        <div className="info-card emergencia">
                            <div className="card-header">
                                <span className="card-icon">🚨</span>
                                <h3>¿Tienes una Emergencia?</h3>
                            </div>
                            <p>Si detectas movimientos no autorizados o perdiste tu tarjeta:</p>
                            <div className="emergency-contact">
                                <strong>Línea de Emergencia 24/7</strong>
                                <a href="tel:018000911234" className="emergency-phone">
                                    (01) 8000 911 234
                                </a>
                            </div>
                        </div>

                        <div className="info-card horarios">
                            <div className="card-header">
                                <span className="card-icon">🕒</span>
                                <h3>Horarios de Atención</h3>
                            </div>
                            <div className="horarios-list">
                                <div className="horario-item">
                                    <strong>Línea General:</strong> 24/7
                                </div>
                                <div className="horario-item">
                                    <strong>Chat en Línea:</strong> 7:00 AM - 11:00 PM
                                </div>
                                <div className="horario-item">
                                    <strong>Oficinas:</strong> Lun-Vie 8:00 AM - 5:00 PM
                                </div>
                                <div className="horario-item">
                                    <strong>WhatsApp:</strong> Lun-Sáb 8:00 AM - 6:00 PM
                                </div>
                            </div>
                        </div>

                        <div className="info-card consejos">
                            <div className="card-header">
                                <span className="card-icon">💡</span>
                                <h3>Consejos para tu Consulta</h3>
                            </div>
                            <ul className="consejos-list">
                                <li>Ten a mano tu número de documento</li>
                                <li>Describe claramente tu consulta</li>
                                <li>Para CDTs, menciona el número de inversión</li>
                                <li>Guarda el número de caso de referencia</li>
                            </ul>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="canales-footer">
                    <div className="footer-content">
                        <h3>¿No encuentras lo que buscas?</h3>
                        <p>Visita nuestra sección de preguntas frecuentes o explora nuestros productos y servicios.</p>
                        <div className="footer-links">
                            <Link to="/faq" className="footer-link">Preguntas Frecuentes</Link>
                            <Link to="/dashboard" className="footer-link">Mis Productos</Link>
                            <Link to="/simular-cdt" className="footer-link">Simular CDT</Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CanalesAtencion;