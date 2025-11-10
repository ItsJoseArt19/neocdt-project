// =========================================
// CDTSIMULATOR.JSX - SIMULADOR DE RENTABILIDAD DE CDTs
// =========================================
// Esta página permite simular y comparar CDTs:
// - Calculadora de rentabilidad en tiempo real
// - Comparación entre diferentes plazos
// - Visualización de ganancias proyectadas
// - Navegación directa a creación de CDT

import React, { useState } from "react";
import { Link } from "react-router-dom";

const CDTSimulator = () => {
    // ===== ESTADOS DEL SIMULADOR =====
    const [simulationData, setSimulationData] = useState({
        amount: "",      // Monto a invertir
        term: "90"       // Plazo en días (por defecto 90)
    });
    const [results, setResults] = useState(null); // Resultados de simulación
    const [comparisonResults, setComparisonResults] = useState([]); // Comparación de plazos

    // ===== CONFIGURACIÓN DE TASAS DE INTERÉS =====
    // Tasas Efectivas Anuales según plazo (simulando mercado real)
    const rates = {
        30: 7.5,   // 30 días - 7.5% EA
        60: 8.0,   // 60 días - 8.0% EA  
        90: 8.5,   // 90 días - 8.5% EA
        180: 9.0,  // 180 días - 9.0% EA
        360: 9.5   // 360 días - 9.5% EA
    };

    // ===== FUNCIÓN PRINCIPAL DE CÁLCULO =====
    const calculateSimulation = (amount, term) => {
        const rate = rates[term] || 8.5;
        const interestAmount = (amount * rate * term) / (100 * 360);
        const finalAmount = amount + interestAmount;

        return {
            amount: amount,
            term: parseInt(term),
            rate: rate,
            interestAmount: interestAmount,
            finalAmount: finalAmount,
            monthlyReturn: interestAmount / (term / 30),
            dailyReturn: interestAmount / term
        };
    };

    const handleInputChange = (field, value) => {
        const newData = { ...simulationData, [field]: value };
        setSimulationData(newData);

        if (newData.amount && parseFloat(newData.amount) >= 500000) {
            const result = calculateSimulation(parseFloat(newData.amount), newData.term);
            setResults(result);
            
            // Generar comparación con otros plazos
            const comparison = Object.keys(rates).map(termOption => {
                if (termOption !== newData.term) {
                    return calculateSimulation(parseFloat(newData.amount), termOption);
                }
                return null;
            }).filter(Boolean);
            
            setComparisonResults(comparison);
        } else {
            setResults(null);
            setComparisonResults([]);
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

    const formatPercentage = (rate) => {
        return `${rate}%`;
    };

    return (
        <div className="cdt-simulator">
            <div className="simulator-container">
                <div className="simulator-header">
                    <h1>Simulador de CDT</h1>
                    <p>Calcula la rentabilidad de tu inversión antes de decidir</p>
                </div>

                <div className="simulator-content">
                    <div className="simulator-form-section">
                        <div className="simulator-card">
                            <h3>Simula tu Inversión</h3>
                            
                            <div className="form-group">
                                <label htmlFor="sim-amount">¿Cuánto quieres invertir?</label>
                                <div className="input-wrapper">
                                    <span className="currency-symbol">$</span>
                                    <input
                                        id="sim-amount"
                                        type="number"
                                        placeholder="500,000"
                                        value={simulationData.amount}
                                        onChange={(e) => handleInputChange('amount', e.target.value)}
                                        min="500000"
                                        step="100000"
                                    />
                                </div>
                                <small>Monto mínimo: $500,000 COP</small>
                            </div>

                            <div className="form-group">
                                <label htmlFor="sim-term">¿Por cuánto tiempo?</label>
                                <select
                                    id="sim-term"
                                    value={simulationData.term}
                                    onChange={(e) => handleInputChange('term', e.target.value)}
                                >
                                    <option value="30">30 días - {formatPercentage(rates[30])} EA</option>
                                    <option value="60">60 días - {formatPercentage(rates[60])} EA</option>
                                    <option value="90">90 días - {formatPercentage(rates[90])} EA</option>
                                    <option value="180">180 días - {formatPercentage(rates[180])} EA</option>
                                    <option value="360">360 días - {formatPercentage(rates[360])} EA</option>
                                </select>
                            </div>

                            {results && (
                                <div className="simulation-summary">
                                    <h4>Resumen de tu inversión</h4>
                                    <div className="summary-grid">
                                        <div className="summary-item">
                                            <span>Inviertes</span>
                                            <strong>{formatCurrency(results.amount)}</strong>
                                        </div>
                                        <div className="summary-item">
                                            <span>Recibes</span>
                                            <strong className="highlight">{formatCurrency(results.finalAmount)}</strong>
                                        </div>
                                        <div className="summary-item">
                                            <span>Ganas</span>
                                            <strong className="success">{formatCurrency(results.interestAmount)}</strong>
                                        </div>
                                    </div>
                                    
                                    <Link to="/crear-cdt" className="btn btn-primary full-width">
                                        Crear este CDT
                                    </Link>
                                </div>
                            )}
                        </div>

                        <div className="benefits-card">
                            <h3>¿Por qué invertir en CDT?</h3>
                            <ul className="benefits-list">
                                <li>
                                    <div className="benefit-icon">🛡️</div>
                                    <div>
                                        <strong>100% Seguro</strong>
                                        <p>Respaldado por Fogafín hasta $50 millones</p>
                                    </div>
                                </li>
                                <li>
                                    <div className="benefit-icon">📈</div>
                                    <div>
                                        <strong>Rentabilidad Garantizada</strong>
                                        <p>Tasa fija desde el día uno</p>
                                    </div>
                                </li>
                                <li>
                                    <div className="benefit-icon">💰</div>
                                    <div>
                                        <strong>Sin Comisiones</strong>
                                        <p>No cobramos por administración</p>
                                    </div>
                                </li>
                                <li>
                                    <div className="benefit-icon">🔄</div>
                                    <div>
                                        <strong>Renovación Automática</strong>
                                        <p>Elige cómo renovar tu inversión</p>
                                    </div>
                                </li>
                            </ul>
                        </div>
                    </div>

                    <div className="comparison-section">
                        {results && (
                            <div className="main-result-card">
                                <h3>Tu Simulación</h3>
                                <div className="result-highlight">
                                    <div className="amount-display">
                                        {formatCurrency(results.finalAmount)}
                                    </div>
                                    <div className="gain-display">
                                        +{formatCurrency(results.interestAmount)} en {results.term} días
                                    </div>
                                </div>
                                
                                <div className="result-details">
                                    <div className="detail-item">
                                        <span>Tasa de interés</span>
                                        <strong>{formatPercentage(results.rate)} EA</strong>
                                    </div>
                                    <div className="detail-item">
                                        <span>Rentabilidad mensual</span>
                                        <strong>{formatCurrency(results.monthlyReturn)}</strong>
                                    </div>
                                    <div className="detail-item">
                                        <span>Rentabilidad diaria</span>
                                        <strong>{formatCurrency(results.dailyReturn)}</strong>
                                    </div>
                                </div>
                            </div>
                        )}

                        {comparisonResults.length > 0 && (
                            <div className="comparison-card">
                                <h3>Compara con otros plazos</h3>
                                <div className="comparison-grid">
                                    {comparisonResults.map((comparison) => (
                                        <div key={comparison.term} className="comparison-item">
                                            <div className="comparison-term">
                                                {comparison.term} días
                                            </div>
                                            <div className="comparison-rate">
                                                {formatPercentage(comparison.rate)} EA
                                            </div>
                                            <div className="comparison-final">
                                                {formatCurrency(comparison.finalAmount)}
                                            </div>
                                            <div className="comparison-gain">
                                                +{formatCurrency(comparison.interestAmount)}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {!results && (
                            <div className="placeholder-card">
                                <div className="placeholder-icon">🧮</div>
                                <h3>¡Simula tu inversión!</h3>
                                <p>Ingresa el monto y plazo para ver cuánto puedes ganar con un CDT</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CDTSimulator;