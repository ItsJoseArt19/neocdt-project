import { useState } from 'react';

const ConfirmSubmitModal = ({ isOpen, onClose, onConfirm, cdtData }) => {
    const [isSubmitting, setIsSubmitting] = useState(false);

    if (!isOpen) return null;

    const handleConfirm = async () => {
        setIsSubmitting(true);
        try {
            await onConfirm();
            onClose();
        } catch (error) {
            console.error('Error al enviar:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-container" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <h2>⚠️ Confirmar Envío a Revisión</h2>
                    <button className="modal-close" onClick={onClose}>×</button>
                </div>

                <div className="modal-body">
                    <div className="warning-box">
                        <div className="warning-icon">🔒</div>
                        <div className="warning-content">
                            <h3>Importante: No podrás modificar este CDT</h3>
                            <p>
                                Una vez enviado a revisión, <strong>no podrás editar</strong> los datos del CDT. 
                                Si necesitas hacer cambios después, deberás <strong>cancelar la solicitud</strong> y crear un nuevo CDT.
                            </p>
                        </div>
                    </div>

                    <div className="cdt-summary">
                        <h4>📋 Resumen del CDT:</h4>
                        <div className="summary-grid">
                            <div className="summary-item">
                                <span className="summary-label">Monto:</span>
                                <span className="summary-value">
                                    ${cdtData?.amount?.toLocaleString('es-CO')}
                                </span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Plazo:</span>
                                <span className="summary-value">
                                    {cdtData?.termDays} días
                                </span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Tasa de Interés:</span>
                                <span className="summary-value">
                                    {cdtData?.interestRate}% EA
                                </span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Fecha de Inicio:</span>
                                <span className="summary-value">
                                    {new Date(cdtData?.startDate).toLocaleDateString('es-CO')}
                                </span>
                            </div>
                            <div className="summary-item">
                                <span className="summary-label">Retorno Estimado:</span>
                                <span className="summary-value highlight">
                                    ${cdtData?.estimatedReturn?.toLocaleString('es-CO')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <div className="next-steps">
                        <h4>📌 ¿Qué sigue?</h4>
                        <ol>
                            <li>Tu CDT será <strong>enviado a revisión</strong></li>
                            <li>Un administrador lo revisará en las próximas horas</li>
                            <li>Recibirás una notificación cuando sea <strong>aprobado</strong> o <strong>rechazado</strong></li>
                            <li>Si es aprobado, tu CDT comenzará a generar intereses 🎉</li>
                        </ol>
                    </div>
                </div>

                <div className="modal-footer">
                    <button 
                        className="btn-cancel" 
                        onClick={onClose}
                        disabled={isSubmitting}
                    >
                        Revisar de nuevo
                    </button>
                    <button 
                        className="btn-confirm" 
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Enviando...' : '✓ Enviar a Revisión'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default ConfirmSubmitModal;
