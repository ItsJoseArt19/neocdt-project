import React, { useState, useEffect, useCallback } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { getCDTById, updateCDT, cancelCDT, submitCDTForReview } from "../utils/api";
import { toast } from 'react-hot-toast';
import CDTStatusBadge from '../components/CDTStatusBadge';
import '../styles/cdt-pages.css';

const CDTDetails = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    
    const [cdt, setCdt] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editMode, setEditMode] = useState(false);
    const [submittingReview, setSubmittingReview] = useState(false);
    const [formData, setFormData] = useState({
        amount: "",
        termMonths: "3",
        renovationOption: "capital"
    });
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState("");
    const [error, setError] = useState("");

    const rates = {
        1: 7.5,
        2: 8,
        3: 8.5,
        6: 9,
        12: 9.5
    };

    const loadCDTData = useCallback(async () => {
        try {
            setLoading(true);
            
            const userStr = localStorage.getItem("currentUser");
            if (!userStr) {
                navigate("/");
                return;
            }
            
            const response = await getCDTById(id);
            const cdtData = response.cdt;
            
            setCdt(cdtData);
            
            setFormData({
                amount: cdtData.amount || "",
                termMonths: cdtData.termMonths || Math.floor((cdtData.termDays || 90) / 30) || 3,
                renovationOption: cdtData.renovationOption || "capital"
            });
            
        } catch (err) {
            console.error("Error al cargar CDT:", err);
            toast.error(err.response?.data?.message || "Error al cargar los detalles del CDT");
            navigate("/dashboard");
        } finally {
            setLoading(false);
        }
    }, [id, navigate]);

    useEffect(() => {
        loadCDTData();
    }, [loadCDTData]);

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount || 0);
    };

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-CO');
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setError("");
    };

    const calculateProjection = () => {
        const amount = Number.parseFloat(formData.amount) || 0;
        const months = Number.parseInt(formData.termMonths, 10) || 3;
        const rate = rates[months] || 8.5;
        
        const days = months * 30;
        const interest = (amount * rate * days) / (365 * 100);
        const finalAmount = amount + interest;
        
        return {
            rate,
            interest,
            finalAmount,
            days
        };
    };

    // Obtener los meses del plazo

    const handleSaveChanges = async () => {
        try {
            const amount = Number.parseFloat(formData.amount);
            if (Number.isNaN(amount) || amount < 500000) {
                setError("El monto mínimo es $500,000 COP");
                return;
            }
            if (amount > 100000000) {
                setError("El monto máximo es $100,000,000 COP");
                return;
            }

            const projection = calculateProjection();
            
            const updateData = {
                amount,
                term_days: projection.days,
                interest_rate: projection.rate,
                projected_interest: projection.interest,
                final_amount: projection.finalAmount,
                renovation_option: formData.renovationOption
            };

            await updateCDT(id, updateData);
            
            toast.success('CDT actualizado exitosamente');
            setEditMode(false);
            await loadCDTData();
            
        } catch (err) {
            console.error("Error al actualizar CDT:", err);
            const errorMessage = err.response?.data?.message || "Error al actualizar el CDT";
            setError(errorMessage);
            toast.error(errorMessage);
        }
    };

    const handleCancelCDT = async () => {
        try {
            if (!cancelReason.trim() || cancelReason.trim().length < 10) {
                toast.error('Debes proporcionar una razón válida (mínimo 10 caracteres)');
                return;
            }

            await cancelCDT(id, cancelReason.trim());
            
            // Actualizar el estado localmente de inmediato para feedback visual
            setCdt(prevCdt => ({
                ...prevCdt,
                status: 'cancelled',
                adminNotes: cancelReason.trim()
            }));
            
            toast.success('CDT cancelado exitosamente');
            setShowCancelModal(false);
            setCancelReason('');
            
            // Recargar datos desde el servidor para confirmar
            await loadCDTData();
            
        } catch (err) {
            console.error("Error al cancelar CDT:", err);
            const errorMessage = err.response?.data?.message || "Error al cancelar el CDT";
            toast.error(errorMessage);
        }
    };

    const handleSubmitForReview = async () => {
        try {
            if (!globalThis.confirm('¿Estás seguro de enviar este CDT a revisión? No podrás editarlo después.')) {
                return;
            }

            setSubmittingReview(true);
            setError("");

            await submitCDTForReview(id);
            
            // Actualizar el estado localmente de inmediato para feedback visual
            setCdt(prevCdt => ({
                ...prevCdt,
                status: 'pending'
            }));

            toast.success('CDT enviado a revisión exitosamente');
            
            // Recargar datos para confirmar desde el servidor
            await loadCDTData();
            
        } catch (err) {
            console.error("Error al enviar CDT a revisión:", err);
            const errorMessage = err.response?.data?.message || "Error al enviar el CDT a revisión";
            setError(errorMessage);
            toast.error(errorMessage);
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) {
        return (
            <div className="cdt-details-page">
                <div className="loading-container">
                    <div className="spinner"></div>
                    <p>Cargando detalles del CDT...</p>
                </div>
            </div>
        );
    }

    if (!cdt) {
        return (
            <div className="cdt-details-page">
                <div className="error-container">
                    <h2>CDT no encontrado</h2>
                    <p>No se pudo cargar la información del CDT solicitado.</p>
                    <Link to="/dashboard" className="btn btn-primary">
                        Volver al Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    const projection = calculateProjection();
    const canEdit = cdt.status === 'draft';
    const canCancel = ['active', 'pending'].includes(cdt.status);

    return (
        <div className="cdt-details-page">
            <div className="cdt-details-container">
                <div className="cdt-details-header">
                    <div className="header-left">
                        <Link to="/dashboard" className="back-link">
                            ← Volver al Dashboard
                        </Link>
                        <h1>Detalles del CDT #{cdt.id}</h1>
                        <CDTStatusBadge status={cdt.status} />
                    </div>
                    <div className="header-actions">
                        {canEdit && !editMode && (
                            <button 
                                className="btn btn-secondary"
                                onClick={() => setEditMode(true)}
                            >
                                ✏️ Editar
                            </button>
                        )}
                        {cdt.status === 'draft' && !editMode && (
                            <button 
                                className="btn btn-primary"
                                onClick={handleSubmitForReview}
                                disabled={submittingReview}
                                style={{ 
                                    marginLeft: '8px',
                                    opacity: submittingReview ? 0.6 : 1,
                                    cursor: submittingReview ? 'not-allowed' : 'pointer'
                                }}
                            >
                                {submittingReview ? '⏳ Enviando...' : '📤 Enviar a Revisión'}
                            </button>
                        )}
                        {canEdit && editMode && (
                            <>
                                <button 
                                    className="btn btn-outline"
                                    onClick={() => {
                                        setEditMode(false);
                                        setFormData({
                                            amount: cdt.amount,
                                            termMonths: cdt.termMonths || Math.floor((cdt.termDays || 0) / 30),
                                            renovationOption: cdt.renovationOption
                                        });
                                        setError("");
                                    }}
                                >
                                    Cancelar
                                </button>
                                <button 
                                    className="btn btn-primary"
                                    onClick={handleSaveChanges}
                                >
                                    ��� Guardar Cambios
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {error && (
                    <div className="alert alert-danger">
                        {error}
                    </div>
                )}

                <div className="cdt-details-content">
                    <div className="detail-card">
                        <h2 className="card-title">��� Información Básica</h2>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <label htmlFor="amount-display">Monto Invertido</label>
                                {editMode ? (
                                    <input
                                        id="amount-display"
                                        type="number"
                                        className="form-control"
                                        value={formData.amount}
                                        onChange={(e) => handleInputChange('amount', e.target.value)}
                                        placeholder="Ej: 5000000"
                                        min="500000"
                                        max="100000000"
                                    />
                                ) : (
                                    <div className="detail-value" id="amount-display">{formatCurrency(cdt.amount)}</div>
                                )}
                            </div>

                            <div className="detail-item">
                                <label htmlFor="term-display">Plazo</label>
                                {editMode ? (
                                    <select
                                        id="term-display"
                                        className="form-control"
                                        value={formData.termMonths}
                                        onChange={(e) => handleInputChange('termMonths', e.target.value)}
                                    >
                                        <option value="1">1 mes (30 días)</option>
                                        <option value="2">2 meses (60 días)</option>
                                        <option value="3">3 meses (90 días)</option>
                                        <option value="6">6 meses (180 días)</option>
                                        <option value="12">12 meses (360 días)</option>
                                    </select>
                                ) : (
                                    <div className="detail-value" id="term-display">{cdt.termDays || 0} días ({cdt.termMonths || Math.floor((cdt.termDays || 0) / 30)} meses)</div>
                                )}
                            </div>

                            <div className="detail-item">
                                <label htmlFor="rate-display">Tasa de Interés</label>
                                <div className="detail-value highlight" id="rate-display">
                                    {editMode ? `${projection.rate}%` : `${cdt.interestRate || 0}%`} E.A.
                                </div>
                            </div>

                            <div className="detail-item">
                                <label htmlFor="renovation-display">Renovación</label>
                                {editMode ? (
                                    <select
                                        id="renovation-display"
                                        className="form-control"
                                        value={formData.renovationOption}
                                        onChange={(e) => handleInputChange('renovationOption', e.target.value)}
                                    >
                                        <option value="capital">Solo Capital</option>
                                        <option value="interest">Solo Intereses</option>
                                        <option value="both">Capital + Intereses</option>
                                    </select>
                                ) : (
                                    <div className="detail-value" id="renovation-display">
                                        {cdt.renovationOption === 'capital' && 'Solo Capital'}
                                        {cdt.renovationOption === 'interest' && 'Solo Intereses'}
                                        {cdt.renovationOption === 'both' && 'Capital + Intereses'}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="detail-card highlight-card">
                        <h2 className="card-title">��� Proyección Financiera</h2>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <label htmlFor="projected-interest">Intereses Proyectados</label>
                                <div className="detail-value success" id="projected-interest">
                                    {editMode ? formatCurrency(projection.interest) : formatCurrency(cdt.estimatedReturn || cdt.projected_interest || 0)}
                                </div>
                            </div>

                            <div className="detail-item">
                                <label htmlFor="final-amount">Monto Final</label>
                                <div className="detail-value success bold" id="final-amount">
                                    {editMode ? formatCurrency(projection.finalAmount) : formatCurrency((cdt.amount || 0) + (cdt.estimatedReturn || cdt.projected_interest || 0))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Información del Usuario */}
                    {(cdt.userName || cdt.userEmail || cdt.userDocument) && (
                        <div className="detail-card info-card">
                            <h2 className="card-title">👤 Información del Titular</h2>
                            <div className="detail-grid">
                                {cdt.userName && (
                                    <div className="detail-item">
                                        <label htmlFor="user-name">Nombre</label>
                                        <div className="detail-value" id="user-name">{cdt.userName}</div>
                                    </div>
                                )}
                                {cdt.userEmail && (
                                    <div className="detail-item">
                                        <label htmlFor="user-email">Email</label>
                                        <div className="detail-value" id="user-email">{cdt.userEmail}</div>
                                    </div>
                                )}
                                {cdt.userDocument && (
                                    <div className="detail-item">
                                        <label htmlFor="user-document">Documento</label>
                                        <div className="detail-value" id="user-document">{cdt.userDocument}</div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="detail-card">
                        <h2 className="card-title">📅 Fechas Importantes</h2>
                        <div className="detail-grid">
                            <div className="detail-item">
                                <label htmlFor="created-date">Fecha de Creación</label>
                                <div className="detail-value" id="created-date">{formatDate(cdt.createdAt)}</div>
                            </div>

                            {cdt.submittedAt && (
                                <div className="detail-item">
                                    <label htmlFor="submitted-date">Fecha de Envío</label>
                                    <div className="detail-value" id="submitted-date">{formatDate(cdt.submittedAt)}</div>
                                </div>
                            )}

                            {cdt.reviewedAt && (
                                <div className="detail-item">
                                    <label htmlFor="approval-date">Fecha de Aprobación</label>
                                    <div className="detail-value" id="approval-date">{formatDate(cdt.reviewedAt)}</div>
                                </div>
                            )}

                            {cdt.startDate && (
                                <div className="detail-item">
                                    <label htmlFor="start-date">Fecha de Inicio</label>
                                    <div className="detail-value" id="start-date">{formatDate(cdt.startDate)}</div>
                                </div>
                            )}

                            {cdt.endDate && (
                                <div className="detail-item">
                                    <label htmlFor="maturity-date">Fecha de Vencimiento</label>
                                    <div className="detail-value highlight" id="maturity-date">{formatDate(cdt.endDate)}</div>
                                </div>
                            )}
                        </div>
                    </div>

                    {(cdt.rejectionReason || cdt.cancellationReason || cdt.adminNotes) && (
                        <div className="detail-card warning-card">
                            <h2 className="card-title">📋 Información Adicional</h2>
                            {cdt.adminNotes && (
                                <div className="detail-item">
                                    <label htmlFor="admin-notes">
                                        {cdt.status === 'cancelled' ? 'Motivo de Cancelación' : 
                                         cdt.status === 'rejected' ? 'Motivo de Rechazo' : 
                                         'Notas del Administrador'}
                                    </label>
                                    <div className="detail-value" id="admin-notes">{cdt.adminNotes}</div>
                                </div>
                            )}
                            {cdt.rejectionReason && (
                                <div className="detail-item">
                                    <label htmlFor="rejection-reason">Motivo de Rechazo</label>
                                    <div className="detail-value" id="rejection-reason">{cdt.rejectionReason}</div>
                                </div>
                            )}
                            {cdt.cancellationReason && (
                                <div className="detail-item">
                                    <label htmlFor="cancellation-reason">Motivo de Cancelación</label>
                                    <div className="detail-value" id="cancellation-reason">{cdt.cancellationReason}</div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Botón de Cancelación visible en el contenido */}
                    {canCancel && (
                        <div className="detail-card danger-card">
                            <h2 className="card-title">⚠️ Zona de Peligro</h2>
                            <p>Si necesitas cancelar este CDT, puedes hacerlo aquí. Esta acción es irreversible.</p>
                            <button 
                                className="btn btn-danger btn-large"
                                onClick={() => setShowCancelModal(true)}
                            >
                                🗑️ Cancelar CDT
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {showCancelModal && (
                <div 
                    className="modal-overlay"
                    onClick={() => setShowCancelModal(false)}
                    onKeyDown={(e) => e.key === 'Escape' && setShowCancelModal(false)}
                    role="presentation"
                    tabIndex={-1}
                >
                    <div 
                        className="modal-content"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="cancel-modal-title"
                        tabIndex={0}
                    >
                        <h2 id="cancel-modal-title">⚠️ Confirmar Cancelación</h2>
                        <p>¿Estás seguro de que deseas cancelar este CDT?</p>
                        <p className="warning-text">
                            Esta acción es <strong>irreversible</strong>. El CDT será cancelado y no podrás recuperarlo.
                        </p>
                        
                        <div className="form-group">
                            <label htmlFor="cancel-reason-input">
                                Motivo de cancelación (mínimo 10 caracteres) *
                            </label>
                            <textarea
                                id="cancel-reason-input"
                                className="form-control"
                                value={cancelReason}
                                onChange={(e) => setCancelReason(e.target.value)}
                                placeholder="Explica por qué deseas cancelar este CDT..."
                                rows="4"
                                minLength={10}
                                required
                            />
                            <small className="form-text">
                                {cancelReason.length}/10 caracteres mínimos
                            </small>
                        </div>

                        <div className="modal-actions">
                            <button 
                                className="btn btn-outline"
                                onClick={() => setShowCancelModal(false)}
                            >
                                No, mantener CDT
                            </button>
                            <button 
                                className="btn btn-danger"
                                onClick={handleCancelCDT}
                                disabled={!cancelReason.trim() || cancelReason.trim().length < 10}
                            >
                                Sí, cancelar CDT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CDTDetails;
