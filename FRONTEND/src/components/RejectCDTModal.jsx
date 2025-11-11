import React, { useState } from 'react';

const RejectCDTModal = ({ isOpen, onClose, onReject, cdtData }) => {
    const [rejectReason, setRejectReason] = useState('');
    const [isRejecting, setIsRejecting] = useState(false);
    const [error, setError] = useState('');

    if (!isOpen) return null;

    const handleReject = async () => {
        // Validación: mínimo 20 caracteres
        if (rejectReason.trim().length < 20) {
            setError('La razón debe tener al menos 20 caracteres');
            return;
        }

        setIsRejecting(true);
        setError('');
        
        try {
            await onReject(rejectReason.trim());
            setRejectReason('');
            onClose();
        } catch (error) {
            console.error('Error al rechazar CDT:', error);
            setError(error.response?.data?.message || 'Error al rechazar el CDT');
        } finally {
            setIsRejecting(false);
        }
    };

    const handleClose = () => {
        setRejectReason('');
        setError('');
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={handleClose}>
            <div className="modal-container reject-modal" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>❌ Rechazar Solicitud de CDT</h2>
                    <button className="modal-close" onClick={handleClose}>×</button>
                </div>

                <div className="modal-body">
                    {/* Warning about rejection */}
                    <div className="warning-box reject-warning">
                        <span className="warning-icon">⚠️</span>
                        <div className="warning-content">
                            <h3>Importante</h3>
                            <p>
                                Al rechazar esta solicitud, el usuario <strong>verá tu comentario</strong> 
                                y podrá corregir los problemas antes de volver a enviar. 
                                Sé claro y específico sobre las razones del rechazo.
                            </p>
                        </div>
                    </div>

                    {/* CDT Summary */}
                    <div className="cdt-summary">
                        <h4>📋 Resumen del CDT</h4>
                        <div className="summary-grid">
                            <div className="summary-item">
                                <span className="summary-label">Usuario:</span>
                                <span className="summary-value">{cdtData.user_name || 'N/A'}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Documento:</span>
                                <span className="summary-value">{cdtData.user_document || 'N/A'}</span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Monto:</span>
                                <span className="summary-value">
                                    ${parseFloat(cdtData.amount).toLocaleString('es-CO')}
                                </span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Plazo:</span>
                                <span className="summary-value">{cdtData.term_months} meses</span>
                            </div>
                        </div>
                    </div>

                    {/* Rejection reason textarea */}
                    <div className="reject-reason-section">
                        <label htmlFor="rejectReason">
                            <strong>Razón del Rechazo *</strong>
                            <span className="char-count">
                                {rejectReason.length} / 20 mínimo
                            </span>
                        </label>
                        <textarea
                            id="rejectReason"
                            value={rejectReason}
                            onChange={(e) => {
                                setRejectReason(e.target.value);
                                setError('');
                            }}
                            placeholder="Explica claramente por qué se rechaza esta solicitud. Por ejemplo: monto mínimo no cumplido, documentación incompleta, información inconsistente, etc."
                            rows="6"
                            className={error ? 'error' : ''}
                        />
                        {error && <div className="error-message">{error}</div>}
                        <div className="helper-text">
                            💡 <strong>Consejo:</strong> Sé específico sobre qué debe corregir el usuario.
                        </div>
                    </div>

                    {/* What happens next */}
                    <div className="next-steps reject-next-steps">
                        <h4>¿Qué sucede después?</h4>
                        <ol>
                            <li>El CDT cambiará a estado <strong>"Rechazado"</strong></li>
                            <li>El usuario recibirá tu comentario de rechazo</li>
                            <li>El usuario podrá <strong>corregir</strong> los problemas</li>
                            <li>El usuario podrá enviar una <strong>nueva solicitud</strong></li>
                        </ol>
                    </div>
                </div>

                <div className="modal-footer">
                    <button 
                        className="btn-cancel" 
                        onClick={handleClose}
                        disabled={isRejecting}
                    >
                        Cancelar
                    </button>
                    <button 
                        className="btn-reject" 
                        onClick={handleReject}
                        disabled={isRejecting || rejectReason.trim().length < 20}
                    >
                        {isRejecting ? 'Rechazando...' : 'Rechazar Solicitud'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default RejectCDTModal;
