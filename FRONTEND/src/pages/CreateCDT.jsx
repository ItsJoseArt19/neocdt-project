import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createCDT, submitCDTForReview } from "../utils/api";
import { toast } from 'react-hot-toast';
import ConfirmSubmitModal from '../components/ConfirmSubmitModal';

const CreateCDT = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [formData, setFormData] = useState({
        amount: "",
        term_months: "3",
        interest_rate: 8.5,
        renovation_type: "none"
    });
    const [simulationResult, setSimulationResult] = useState(null);
    const [isSavingDraft, setIsSavingDraft] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const navigate = useNavigate();

    const rates = {
        1: 7.5,
        2: 8.0,
        3: 8.5,
        6: 9.0,
        12: 9.5
    };

    useEffect(() => {
        const user = localStorage.getItem("currentUser");
        if (!user) {
            navigate("/");
            return;
        }
        const userData = JSON.parse(user);
        setCurrentUser(userData);
    }, [navigate]);

    const handleInputChange = (field, value) => {
        let updatedFormData = { ...formData, [field]: value };
        if (field === 'term_months') {
            const termMonths = parseInt(value);
            updatedFormData.interest_rate = rates[termMonths] || 8.5;
        }
        setFormData(updatedFormData);
        setError("");
        if (field === 'amount' || field === 'term_months') {
            calculateSimulation(updatedFormData);
        }
    };

    const calculateSimulation = (data = formData) => {
        const amount = parseFloat(data.amount);
        const termMonths = parseInt(data.term_months);
        if (!amount || amount < 500000) {
            setSimulationResult(null);
            setError("");
            return;
        }
        const rate = rates[termMonths] || 8.5;
        const termDays = termMonths * 30;
        const interestAmount = (amount * rate * termDays) / (100 * 360);
        const finalAmount = amount + interestAmount;
        
        // Calcular fecha de inicio como mañana para evitar problemas de timezone
        const startDate = new Date();
        startDate.setDate(startDate.getDate() + 1); // Mañana
        startDate.setHours(0, 0, 0, 0); // Medianoche
        
        const endDate = new Date(startDate);
        endDate.setMonth(endDate.getMonth() + termMonths);
        
        setSimulationResult({
            // Propiedades originales (para el frontend)
            initialAmount: amount,
            amount: amount, // Alias para compatibilidad
            rate: rate,
            interestRate: rate, // Alias para el modal
            termMonths: termMonths,
            termDays: termDays, // Para el modal
            interestAmount: interestAmount,
            estimatedReturn: interestAmount, // Alias para el modal
            finalAmount: finalAmount,
            monthlyReturn: interestAmount / termMonths,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        });
    };

    const handleSaveAsDraft = async (e) => {
        e.preventDefault();
        setIsSavingDraft(true);
        setError("");
        const amount = parseFloat(formData.amount);
        if (amount < 500000) {
            setError("El monto mínimo para un CDT es $500,000");
            setIsSavingDraft(false);
            return;
        }
        if (!simulationResult) {
            setError("Error en la simulación. Por favor, verifica los datos.");
            setIsSavingDraft(false);
            return;
        }
        try {
            const cdtData = {
                amount: simulationResult.initialAmount,
                interest_rate: simulationResult.rate,
                term_months: simulationResult.termMonths,
                start_date: simulationResult.startDate,
                renovation_type: formData.renovation_type
            };
            await createCDT(cdtData);
            toast.success('CDT guardado como borrador exitosamente');
            setTimeout(() => { navigate("/dashboard"); }, 1500);
        } catch (error) {
            console.error('Error al guardar borrador:', error);
            const errorMsg = error.response?.data?.message || 'Error al guardar el CDT como borrador';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setIsSavingDraft(false);
        }
    };

    const handleSubmitForReview = async (e) => {
        e.preventDefault();
        setError("");
        const amount = parseFloat(formData.amount);
        if (amount < 500000) {
            setError("El monto mínimo para un CDT es $500,000");
            return;
        }
        if (!simulationResult) {
            setError("Error en la simulación. Por favor, verifica los datos.");
            return;
        }
        setShowConfirmModal(true);
    };

    const confirmSubmit = async () => {
        setIsSubmitting(true);
        setError("");
        try {
            const cdtData = {
                amount: simulationResult.initialAmount,
                interest_rate: simulationResult.rate,
                term_months: simulationResult.termMonths,
                start_date: simulationResult.startDate,
                renovation_type: formData.renovation_type
            };
            
            // createCDT ahora retorna { cdt: {...} } directamente
            const createResponse = await createCDT(cdtData);
            const cdtId = createResponse.cdt?.id;
            
            if (!cdtId) {
                console.error('Respuesta de createCDT:', createResponse);
                throw new Error('No se pudo obtener el ID del CDT creado');
            }
            
            await submitCDTForReview(cdtId);
            toast.success('CDT enviado a revisión exitosamente');
            setTimeout(() => { navigate("/dashboard"); }, 1500);
        } catch (error) {
            console.error('Error al enviar CDT:', error);
            const errorMsg = error.response?.data?.message || error.message || 'Error al enviar el CDT a revisión';
            setError(errorMsg);
            toast.error(errorMsg);
            setShowConfirmModal(false);
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (!currentUser) return <div>Cargando...</div>;

    return (
        <div className="create-cdt">
            <div className="create-cdt-container">
                <div className="create-cdt-header">
                    <h1>Crear Nuevo CDT</h1>
                    <p>Invierte con rentabilidad garantizada y seguridad total</p>
                </div>
                <div className="create-cdt-content">
                    <div className="cdt-form-section">
                        <form className="cdt-form">
                            <div className="form-group">
                                <label htmlFor="amount">Monto a Invertir</label>
                                <div className="input-wrapper">
                                    <span className="currency-symbol">\$</span>
                                    <input id="amount" type="number" placeholder="500,000"
                                        value={formData.amount}
                                        onChange={(e) => handleInputChange('amount', e.target.value)}
                                        min="500000" step="100000" required />
                                </div>
                                <small>Monto mínimo: \$500,000 COP</small>
                            </div>
                            <div className="form-group">
                                <label htmlFor="term">Plazo de Inversión</label>
                                <select id="term" value={formData.term_months}
                                    onChange={(e) => handleInputChange('term_months', e.target.value)} required>
                                    <option value="1">1 mes - {rates[1]}% EA</option>
                                    <option value="2">2 meses - {rates[2]}% EA</option>
                                    <option value="3">3 meses - {rates[3]}% EA</option>
                                    <option value="6">6 meses - {rates[6]}% EA</option>
                                    <option value="12">12 meses - {rates[12]}% EA</option>
                                </select>
                            </div>
                            <div className="form-group">
                                <label htmlFor="renovation">Opción de Renovación</label>
                                <select id="renovation" value={formData.renovation_type}
                                    onChange={(e) => handleInputChange('renovation_type', e.target.value)} required>
                                    <option value="none">No renovar automáticamente</option>
                                    <option value="capital">Renovar solo capital</option>
                                    <option value="capital_interest">Renovar capital + intereses</option>
                                </select>
                            </div>
                            {error && <div className="form-error">{error}</div>}
                            <div className="form-actions">
                                <button type="button" onClick={handleSaveAsDraft} className="save-draft-btn"
                                    disabled={isSavingDraft || isSubmitting || !simulationResult}>
                                    {isSavingDraft ? 'Guardando...' : '��� Guardar como Borrador'}
                                </button>
                                <button type="button" onClick={handleSubmitForReview} className="submit-review-btn"
                                    disabled={isSavingDraft || isSubmitting || !simulationResult}>
                                    {isSubmitting ? 'Enviando...' : '✅ Enviar a Revisión'}
                                </button>
                            </div>
                            <small className="form-note">
                                ��� <strong>Nota:</strong> Puedes guardar como borrador y editar después, 
                                o enviar directamente a revisión. Una vez enviado a revisión, no podrás editarlo.
                            </small>
                        </form>
                    </div>
                    <div className="simulation-section">
                        <div className="simulation-card">
                            <h3>Simulación de tu Inversión</h3>
                            {simulationResult ? (
                                <div className="simulation-results">
                                    <div className="result-item">
                                        <span>Monto Inicial</span>
                                        <strong>{formatCurrency(simulationResult.initialAmount)}</strong>
                                    </div>
                                    <div className="result-item">
                                        <span>Tasa de Interés</span>
                                        <strong>{simulationResult.rate}% EA</strong>
                                    </div>
                                    <div className="result-item">
                                        <span>Plazo</span>
                                        <strong>{simulationResult.termMonths} meses</strong>
                                    </div>
                                    <div className="result-item">
                                        <span>Fecha Inicio</span>
                                        <strong>{new Date(simulationResult.startDate).toLocaleDateString('es-CO')}</strong>
                                    </div>
                                    <div className="result-item">
                                        <span>Fecha Vencimiento</span>
                                        <strong>{new Date(simulationResult.endDate).toLocaleDateString('es-CO')}</strong>
                                    </div>
                                    <div className="result-item">
                                        <span>Intereses Ganados</span>
                                        <strong className="interest">{formatCurrency(simulationResult.interestAmount)}</strong>
                                    </div>
                                    <div className="result-item total">
                                        <span>Monto Final</span>
                                        <strong>{formatCurrency(simulationResult.finalAmount)}</strong>
                                    </div>
                                    <div className="result-item">
                                        <span>Rentabilidad Mensual Aprox.</span>
                                        <strong>{formatCurrency(simulationResult.monthlyReturn)}</strong>
                                    </div>
                                </div>
                            ) : (
                                <div className="simulation-placeholder">
                                    <div className="placeholder-icon">���</div>
                                    <p>Ingresa el monto para ver la simulación</p>
                                </div>
                            )}
                        </div>
                        <div className="benefits-card">
                            <h3>Beneficios de nuestros CDTs</h3>
                            <ul>
                                <li>✅ Rentabilidad garantizada</li>
                                <li>✅ Respaldado por Fogafín</li>
                                <li>✅ Sin comisiones</li>
                                <li>✅ Renovación automática opcional</li>
                                <li>✅ Liquidez al vencimiento</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
            {showConfirmModal && simulationResult && (
                <ConfirmSubmitModal isOpen={showConfirmModal}
                    onClose={() => setShowConfirmModal(false)}
                    onConfirm={confirmSubmit}
                    cdtData={simulationResult} />
            )}
        </div>
    );
};

export default CreateCDT;
