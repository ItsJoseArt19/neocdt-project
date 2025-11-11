import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";

const CDTDetails = () => {
    const { id } = useParams(); // ID del CDT desde URL
    
    const [cdt, setCdt] = useState(null); // Datos del CDT
    const [loading, setLoading] = useState(true); // Estado de carga
    const [editMode, setEditMode] = useState(false); // Modo de edición
    const [formData, setFormData] = useState({ // Datos del formulario para editar
        amount: "",
        term: "",
        renovationOption: ""
    });
    const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Mensaje de éxito
    const [showCancelModal, setShowCancelModal] = useState(false); // Modal de cancelación
    const [cancelReason, setCancelReason] = useState(""); // Razón de cancelación
    const [error, setError] = useState(""); // Mensajes de error
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
        
        // Inicializar formData con los datos del CDT
        setFormData({
            amount: foundCDT.amount || "",
            term: foundCDT.term || "90",
            renovationOption: foundCDT.renovationOption || "capital"
        });
        
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

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setError("");
    };

    const handleSaveChanges = () => {
        // Validaciones
        const amount = parseFloat(formData.amount);
        
        if (!amount || amount < 500000) {
            setError("El monto mínimo es $500,000 COP");
            return;
        }

        // Actualizar en localStorage
        const allCDTs = JSON.parse(localStorage.getItem("userCDTs") || "[]");
        const updatedCDTs = allCDTs.map(c => {
            if (c.id === id) {
                // Recalcular intereses con los nuevos datos
                const rate = rates[formData.term] || 8.5;
                const term = parseInt(formData.term);
                const interestAmount = (amount * rate * term) / (100 * 360);
                const finalAmount = amount + interestAmount;
                
                return {
                    ...c,
                    amount: amount,
                    term: term,
                    rate: rate,
                    renovationOption: formData.renovationOption,
                    interestAmount: interestAmount,
                    finalAmount: finalAmount
                };
            }
            return c;
        });
        
        localStorage.setItem("userCDTs", JSON.stringify(updatedCDTs));
        
        // Actualizar estado local
        const updatedCDT = updatedCDTs.find(c => c.id === id);
        setCdt(updatedCDT);
        setEditMode(false);
        setShowSuccessMessage(true);
        
        // Ocultar mensaje después de 3 segundos
        setTimeout(() => setShowSuccessMessage(false), 3000);
    };

    const handleCancelEdit = () => {
        // Restaurar valores originales
        setFormData({
            amount: cdt.amount || "",
            term: cdt.term || "90",
            renovationOption: cdt.renovationOption || "capital"
        });
        setEditMode(false);
        setError("");
    };

    const handleCancelCDT = () => {
        if (cancelReason.length < 10) {
            alert("El motivo debe tener al menos 10 caracteres");
            return;
        }

        // Actualizar estado a 'cancelled' en localStorage
        const allCDTs = JSON.parse(localStorage.getItem("userCDTs") || "[]");
        const updatedCDTs = allCDTs.map(c => 
            c.id === id 
                ? { ...c, status: 'cancelled', cancellationReason: cancelReason, cancellationDate: new Date().toLocaleDateString('es-CO') }
                : c
        );
        
        localStorage.setItem("userCDTs", JSON.stringify(updatedCDTs));
        
        // Actualizar estado local
        setCdt({ ...cdt, status: 'cancelled' });
        setShowCancelModal(false);
        
        alert('CDT cancelado exitosamente');
        navigate('/dashboard');
    };

    const handleDeleteCDT = () => {
        const confirmed = window.confirm(
            '¿Estás seguro de eliminar este CDT permanentemente? Esta acción no se puede deshacer.'
        );
        
        if (!confirmed) return;

        // Eliminar de localStorage
        const allCDTs = JSON.parse(localStorage.getItem("userCDTs") || "[]");
        const updatedCDTs = allCDTs.filter(c => c.id !== id);
        localStorage.setItem("userCDTs", JSON.stringify(updatedCDTs));
        
        alert('CDT eliminado exitosamente');
        navigate('/dashboard');
    };

    // Tasas de interés por plazo
    const rates = {
        30: 7.5,
        60: 8.0,
        90: 8.5,
        180: 9.0,
        360: 9.5
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
    
    // Validar permisos de edición y eliminación según el estado
    const canEdit = cdt.status === 'active' || cdt.status === 'draft';
    const canCancel = cdt.status === 'active' || cdt.status === 'draft';
    const canDelete = cdt.status === 'draft' || cdt.status === 'cancelled';

    return (
        <div className="cdt-details-page">
            <div className="cdt-details-container">
                <div className="cdt-details-header">
                    <Link to="/dashboard" className="back-button">
                        ← Volver al Dashboard
                    </Link>
                    <h1>Detalles de tu CDT</h1>
                    <div className="header-actions">
                        {canEdit && !editMode && (
                            <button 
                                className="edit-btn"
                                onClick={() => setEditMode(true)}
                            >
                                ✏️ Editar CDT
                            </button>
                        )}
                        {editMode && (
                            <>
                                <button 
                                    className="save-btn"
                                    onClick={handleSaveChanges}
                                >
                                    💾 Guardar Cambios
                                </button>
                                <button 
                                    className="cancel-edit-btn"
                                    onClick={handleCancelEdit}
                                >
                                    ✖️ Cancelar
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {showSuccessMessage && (
                    <div className="success-message">
                        ✅ CDT actualizado exitosamente
                    </div>
                )}

                {error && (
                    <div className="error-message">
                        ⚠️ {error}
                    </div>
                )}

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
                                        {editMode ? (
                                            <input
                                                type="number"
                                                className="edit-input"
                                                value={formData.amount}
                                                onChange={(e) => handleInputChange('amount', e.target.value)}
                                                min="500000"
                                                step="100000"
                                            />
                                        ) : (
                                            <strong>{formatCurrency(cdt.amount)}</strong>
                                        )}
                                    </div>
                                    <div className="detail-row">
                                        <span>Tasa de Interés</span>
                                        <strong>{cdt.rate}% EA</strong>
                                    </div>
                                    <div className="detail-row">
                                        <span>Plazo</span>
                                        {editMode ? (
                                            <select
                                                className="edit-select"
                                                value={formData.term}
                                                onChange={(e) => handleInputChange('term', e.target.value)}
                                            >
                                                <option value="30">30 días - 7.5% EA</option>
                                                <option value="60">60 días - 8.0% EA</option>
                                                <option value="90">90 días - 8.5% EA</option>
                                                <option value="180">180 días - 9.0% EA</option>
                                                <option value="360">360 días - 9.5% EA</option>
                                            </select>
                                        ) : (
                                            <strong>{cdt.term} días</strong>
                                        )}
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
                                        {editMode ? (
                                            <select
                                                className="edit-select"
                                                value={formData.renovationOption}
                                                onChange={(e) => handleInputChange('renovationOption', e.target.value)}
                                            >
                                                <option value="capital">Renovar solo capital</option>
                                                <option value="capitalInterest">Renovar capital + intereses</option>
                                                <option value="noRenovation">No renovar automáticamente</option>
                                            </select>
                                        ) : (
                                            <strong>{getRenovationText()}</strong>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="cdt-actions">
                        <div className="actions-card">
                            <h3>Acciones Disponibles</h3>
                            <div className="actions-buttons">
                                {canCancel && !editMode && (
                                    <button 
                                        className="btn btn-warning"
                                        onClick={() => setShowCancelModal(true)}
                                    >
                                        🚫 Cancelar CDT
                                    </button>
                                )}
                                {canDelete && !editMode && (
                                    <button 
                                        className="btn btn-danger"
                                        onClick={handleDeleteCDT}
                                    >
                                        🗑️ Eliminar CDT
                                    </button>
                                )}
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

                {/* Modal de confirmación para cancelar CDT */}
                {showCancelModal && (
                    <div className="modal-overlay" onClick={() => setShowCancelModal(false)}>
                        <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                            <h3>¿Cancelar este CDT?</h3>
                            <p>Esta acción cambiará el estado del CDT a cancelado. Indica el motivo:</p>
                            
                            <textarea
                                className="cancel-reason-input"
                                placeholder="Motivo de cancelación (mínimo 10 caracteres)"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                minLength={10}
                                rows={4}
                            />
                            
                            <div className="modal-actions">
                                <button 
                                    className="btn btn-secondary"
                                    onClick={() => {
                                        setShowCancelModal(false);
                                        setCancelReason("");
                                    }}
                                >
                                    Volver
                                </button>
                                <button 
                                    className="btn btn-danger"
                                    onClick={handleCancelCDT}
                                    disabled={cancelReason.length < 10}
                                >
                                    Confirmar Cancelación
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CDTDetails;