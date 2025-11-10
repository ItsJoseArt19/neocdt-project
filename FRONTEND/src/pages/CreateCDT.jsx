import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {getAvailableFunds, updateAvailableFunds} from "../utils/localStorageUtils"

const CreateCDT = () => {
    // ===== ESTADOS DEL FORMULARIO =====
    const [currentUser, setCurrentUser] = useState(null); // Usuario actual
    const [availableFunds, setAvailableFunds] = useState(0);
    const [formData, setFormData] = useState({
        amount: "",
        term: "90", // Plazo por defecto
        renovationOption: "capital" // Opción de renovación
    });
    const [simulationResult, setSimulationResult] = useState(null); // Resultado de simulación
    const [isLoading, setIsLoading] = useState(false); // Estado de carga
    const [error, setError] = useState(""); // Mensajes de error
    const navigate = useNavigate();

    // ===== CONFIGURACIÓN DE TASAS DE INTERÉS =====
    // Tasas según el plazo (simulando tasas reales del mercado)
    const rates = {
        30: 7.5,   // 30 días - 7.5% EA
        60: 8.0,   // 60 días - 8.0% EA
        90: 8.5,   // 90 días - 8.5% EA
        180: 9.0,  // 180 días - 9.0% EA
        360: 9.5
    };

    useEffect(() => {
        const user = localStorage.getItem("currentUser");
        if (!user) {
            navigate("/");
            return;
        }

        const userData = JSON.parse(user);
        setCurrentUser(userData);

        const funds = getAvailableFunds(userData.documentNumber);
        setAvailableFunds(funds);

    }, [navigate]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setError("");
        
        // Auto-calcular cuando cambien monto o plazo
        if (field === 'amount' || field === 'term') {
            calculateSimulation({
                ...formData,
                [field]: value
            });
        }
    };

    const calculateSimulation = (data = formData) => {
        const amount = parseFloat(data.amount);
        const term = parseInt(data.term);
        
        if (!amount || amount < 500000) {
            setSimulationResult(null);
            setError("");
            return;
        }

        if (amount > availableFunds) {
            setSimulationResult(null);
            setError(`No tienes fondos suficientes. Tu monto disponible es ${formatCurrency(availableFunds)}`);
            return;
        } else {
            setError("");
        }

        const rate = rates[term] || 8.5;
        const interestAmount = (amount * rate * term) / (100 * 360);
        const finalAmount = amount + interestAmount;

        setSimulationResult({
            initialAmount: amount,
            rate: rate,
            term: term,
            interestAmount: interestAmount,
            finalAmount: finalAmount,
            monthlyReturn: interestAmount / (term / 30)
        });
    };

    const handleCreateCDT = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        const amount = parseFloat(formData.amount);
        
        if (amount < 500000) {
            setError("El monto mínimo para un CDT es $500,000");
            setIsLoading(false);
            return;
        }

        if (amount > availableFunds) {
            setError(`Fondos insuficientes. Tu monto disponible es ${formatCurrency(availableFunds)}`);
            setIsLoading(false);
            return;
        }

        if (!simulationResult) {
            setError("Error en la simulación. Por favor, verifica los datos.");
            setIsLoading(false);
            return;
        }

        // Simular creación del CDT
        await new Promise(resolve => setTimeout(resolve, 1500));

        const newCDT = {
            id: Date.now().toString(),
            userId: currentUser.documentNumber,
            amount: simulationResult.initialAmount,
            rate: simulationResult.rate,
            term: simulationResult.term,
            interestAmount: simulationResult.interestAmount,
            finalAmount: simulationResult.finalAmount,
            renovationOption: formData.renovationOption,
            createdDate: new Date().toLocaleDateString('es-CO'),
            maturityDate: new Date(Date.now() + (simulationResult.term * 24 * 60 * 60 * 1000)).toLocaleDateString('es-CO'),
            status: 'active'
        };

        // Guardar en localStorage
        const existingCDTs = JSON.parse(localStorage.getItem("userCDTs") || "[]");
        existingCDTs.push(newCDT);
        localStorage.setItem("userCDTs", JSON.stringify(existingCDTs));

        const newAvailableFunds = availableFunds - amount;
        updateAvailableFunds(currentUser.documentNumber, newAvailableFunds);

        setIsLoading(false);
        navigate("/dashboard");
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    if (!currentUser) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="create-cdt">
            <div className="create-cdt-container">
                <div className="create-cdt-header">
                    <h1>Crear Nuevo CDT</h1>
                    <p>Invierte con rentabilidad garantizada y seguridad total</p>
                </div>

                <div className="create-cdt-content">
                    <div className="cdt-form-section">
                        <form onSubmit={handleCreateCDT} className="cdt-form">
                            <div className="form-group">
                                <label htmlFor="amount">Monto a Invertir</label>
                                <div className="input-wrapper">
                                    <span className="currency-symbol">$</span>
                                    <input
                                        id="amount"
                                        type="number"
                                        placeholder="500,000"
                                        value={formData.amount}
                                        onChange={(e) => handleInputChange('amount', e.target.value)}
                                        min="500000"
                                        max={availableFunds}
                                        step="100000"
                                        required
                                    />
                                </div>
                                <small>Monto mínimo: $500,000 COP * <span className="available-amount">Disponible: {formatCurrency(availableFunds)}</span></small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="term">Plazo de Inversión</label>
                                <select
                                    id="term"
                                    value={formData.term}
                                    onChange={(e) => handleInputChange('term', e.target.value)}
                                    required
                                >
                                    <option value="30">30 días - {rates[30]}% EA</option>
                                    <option value="60">60 días - {rates[60]}% EA</option>
                                    <option value="90">90 días - {rates[90]}% EA</option>
                                    <option value="180">180 días - {rates[180]}% EA</option>
                                    <option value="360">360 días - {rates[360]}% EA</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label htmlFor="renovation">Opción de Renovación</label>
                                <select
                                    id="renovation"
                                    value={formData.renovationOption}
                                    onChange={(e) => handleInputChange('renovationOption', e.target.value)}
                                    required
                                >
                                    <option value="capital">Renovar solo capital</option>
                                    <option value="capitalInterest">Renovar capital + intereses</option>
                                    <option value="noRenovation">No renovar automáticamente</option>
                                </select>
                            </div>

                            {error && <div className={`form-error ${error.includes('fondos insuficientes') ? 'insufficient-funds' : ''}`}>{error}</div>}

                            <button 
                                type="submit" 
                                className={`create-cdt-btn ${isLoading ? 'loading' : ''}`}
                                disabled={isLoading || !simulationResult}
                            >
                                {isLoading ? 'Creando CDT...' : 'Crear CDT'}
                            </button>
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
                                        <strong>{simulationResult.term} días</strong>
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
                                    <div className="placeholder-icon">🧮</div>
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
        </div>
    );
};

export default CreateCDT;