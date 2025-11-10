import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const CDTDetails = () => {
    const { id } = useParams(); // ID del CDT desde URL
    
    const [cdt, setCdt] = useState(null); // Datos del CDT
    const [loading, setLoading] = useState(true); // Estado de carga
    const navigate = useNavigate();

    useEffect(() => {
        // Verificar que el usuario esté logueado
        const user = localStorage.getItem("currentUser");
        if (!user) {
            navigate("/"); // Redirigir si no hay sesión
            return;
        }

        // Buscar CDT específico en localStorage
        const allCDTs = JSON.parse(localStorage.getItem("userCDTs") || "[]");
        const foundCDT = allCDTs.find(cdt => cdt.id === id);
        
        if (!foundCDT) {
            navigate("/dashboard");
            return;
        }
        
        setCdt(foundCDT);
        setLoading(false);
    }, [id, navigate]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const calculateProgress = () => {
        if (!cdt) return 0;
        
        const startDate = new Date(cdt.createdDate.split('/').reverse().join('-'));
        const endDate = new Date(cdt.maturityDate.split('/').reverse().join('-'));
        const currentDate = new Date();
        
        const totalDuration = endDate - startDate;
        const elapsed = currentDate - startDate;
        
        return Math.min(Math.max((elapsed / totalDuration) * 100, 0), 100);
    };

    const getDaysRemaining = () => {
        if (!cdt) return 0;
        
        const endDate = new Date(cdt.maturityDate.split('/').reverse().join('-'));
        const currentDate = new Date();
        const diffTime = endDate - currentDate;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        return Math.max(diffDays, 0);
    };

    const getCurrentValue = () => {
        if (!cdt) return 0;
        
        const progress = calculateProgress() / 100;
        const earnedInterest = cdt.interestAmount * progress;
        return cdt.amount + earnedInterest;
    };

    const getRenovationText = () => {
        const options = {
            'capital': 'Renovar solo capital',
            'capitalInterest': 'Renovar capital + intereses',
            'noRenovation': 'No renovar automáticamente'
        };
        return options[cdt?.renovationOption] || 'No especificado';
    };

    if (loading) {
        return (
            <div className="cdt-details-page loading">
                <div className="loading-spinner">Cargando...</div>
            </div>
        );
    }

    if (!cdt) {
        return (
            <div className="cdt-details-page error">
                <h2>CDT no encontrado</h2>
                <Link to="/dashboard">Volver al Dashboard</Link>
            </div>
        );
    }

    const progress = calculateProgress();
    const daysRemaining = getDaysRemaining();
    const currentValue = getCurrentValue();

    return (
        <div className="cdt-details-page">
            <div className="cdt-details-container">
                <div className="cdt-details-header">
                    <Link to="/dashboard" className="back-button">
                        ← Volver al Dashboard
                    </Link>
                    <h1>Detalles de tu CDT</h1>
                    <p>Información completa de tu inversión</p>
                </div>

                <div className="cdt-details-content">
                    <div className="cdt-main-info">
                        <div className="cdt-status-card">
                            <div className="status-header">
                                <h2>CDT #{cdt.id}</h2>
                                <span className={`status-badge ${cdt.status}`}>
                                    {cdt.status === 'active' ? 'Activo' : 'Vencido'}
                                </span>
                            </div>
                            
                            <div className="amount-display">
                                <div className="current-value">
                                    <span>Valor Actual</span>
                                    <div className="value">{formatCurrency(currentValue)}</div>
                                </div>
                                <div className="final-value">
                                    <span>Valor al Vencimiento</span>
                                    <div className="value highlight">{formatCurrency(cdt.finalAmount)}</div>
                                </div>
                            </div>

                            <div className="progress-section">
                                <div className="progress-header">
                                    <span>Progreso de la inversión</span>
                                    <span>{progress.toFixed(1)}%</span>
                                </div>
                                <div className="progress-bar">
                                    <div 
                                        className="progress-fill" 
                                        style={{ width: `${progress}%` }}
                                    ></div>
                                </div>
                                <div className="progress-info">
                                    <span>{daysRemaining} días restantes</span>
                                    <span>Vence: {cdt.maturityDate}</span>
                                </div>
                            </div>
                        </div>

                        <div className="cdt-details-grid">
                            <div className="detail-card">
                                <h3>Información de la Inversión</h3>
                                <div className="detail-rows">
                                    <div className="detail-row">
                                        <span>Monto Inicial</span>
                                        <strong>{formatCurrency(cdt.amount)}</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>Tasa de Interés</span>
                                        <strong>{cdt.rate}% EA</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>Plazo</span>
                                        <strong>{cdt.term} días</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>Intereses Totales</span>
                                        <strong className="success">{formatCurrency(cdt.interestAmount)}</strong>
                                    </div>
                                </div>
                            </div>

                            <div className="detail-card">
                                <h3>Fechas Importantes</h3>
                                <div className="detail-rows">
                                    <div className="detail-row">
                                        <span>Fecha de Apertura</span>
                                        <strong>{cdt.createdDate}</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>Fecha de Vencimiento</span>
                                        <strong>{cdt.maturityDate}</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>Días Transcurridos</span>
                                        <strong>{Math.floor((cdt.term * progress) / 100)} días</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>Renovación</span>
                                        <strong>{getRenovationText()}</strong>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="cdt-actions">
                        <div className="actions-card">
                            <h3>Acciones Disponibles</h3>
                            <div className="actions-buttons">
                                <button className="btn btn-primary" disabled>
                                    📄 Descargar Certificado
                                </button>
                                <button className="btn btn-secondary" disabled>
                                    📧 Enviar por Email
                                </button>
                                <Link to="/simular-cdt" className="btn btn-outline">
                                    🧮 Simular Renovación
                                </Link>
                                <Link to="/crear-cdt" className="btn btn-outline">
                                    ➕ Crear Nuevo CDT
                                </Link>
                            </div>
                            
                            <div className="legal-info">
                                <h4>Información Legal</h4>
                                <ul>
                                    <li>• Inversión protegida por Fogafín hasta $50,000,000</li>
                                    <li>• Tasa de interés fija garantizada</li>
                                    <li>• No hay penalidades por renovación</li>
                                    <li>• Consulta términos y condiciones completos</li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CDTDetails;