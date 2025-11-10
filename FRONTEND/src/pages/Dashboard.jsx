import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {getAvailableFunds} from "../utils/localStorageUtils"

const Dashboard = () => {
    
    const [currentUser, setCurrentUser] = useState(null); // Usuario logueado
    const [userCDTs, setUserCDTs] = useState([]); // CDTs del usuario
    const [availableFunds, setAvailableFunds] = useState(0); //Monto Dispoinible
    
    useEffect(() => {
        // Obtener usuario actual desde localStorage
        const user = localStorage.getItem("currentUser");
        if (user) {
            const userData = JSON.parse(user);
            setCurrentUser(userData);
            
            // Obtener CDTs específicos del usuario
            const cdts = JSON.parse(localStorage.getItem("userCDTs") || "[]");
            const userSpecificCDTs = cdts.filter(cdt => cdt.userId === userData.documentNumber);
            setUserCDTs(userSpecificCDTs);

            const funds = getAvailableFunds(userData.documentNumber);
            setAvailableFunds(funds);
        }
    }, []);

    
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const calculateTotalInvestment = () => {
        return userCDTs.reduce((total, cdt) => total + cdt.amount, 0);
    };

    if (!currentUser) {
        return null; // El header se encargará de redirigir
    }

    return (
        <div className="dashboard">
            {/* Seccion principal */}
            <div className="dashboard-hero">
                <div className="dashboard-container">
                    <div className="dashboard-welcome">
                        <h1>¡Hola, {currentUser.name.split(' ')[0]}!</h1>
                        <p>Bienvenido a tu banca digital. Gestiona tus inversiones y productos financieros.</p>
                    </div>
                    <div className="dashboard-summary">
                        <div className="summary-card available-funds">
                            <h3>Disponible</h3>
                            <p className="amount">{formatCurrency(availableFunds)}</p>
                        </div>
                        <div className="summary-card">
                            <h3>Total Invertido</h3>
                            <p className="amount">{formatCurrency(calculateTotalInvestment())}</p>
                        </div>
                        <div className="summary-card">
                            <h3>CDTs Activos</h3>
                            <p className="count">{userCDTs.length}</p>
                        </div>
                        <div className="summary-card">
                            <h3>Rentabilidad Promedio</h3>
                            <p className="percentage">8.5% EA</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Seccion de productos */}
            <div className="dashboard-products">
                <div className="dashboard-container">
                    <h2>Tus Productos Financieros</h2>
                    
                    <div className="products-grid">
                        {/* CDT Product */}
                        <div className="product-card active">
                            <div className="product-icon">💰</div>
                            <h3>CDTs</h3>
                            <p>Invierte con rentabilidad garantizada</p>
                            <div className="product-stats">
                                <span>{userCDTs.length} activos</span>
                                <span>{formatCurrency(calculateTotalInvestment())}</span>
                            </div>
                            <div className="product-actions">
                                <Link to="/crear-cdt" className="btn btn-primary">Crear CDT</Link>
                                <Link to="/simular-cdt" className="btn btn-secondary">Simular</Link>
                            </div>
                        </div>

                        {/* Visual Products - No funcionales pero estéticos */}
                        <div className="product-card visual">
                            <div className="product-icon">🏦</div>
                            <h3>Cuenta de Ahorros</h3>
                            <p>Costo $0</p>
                            <div className="product-stats">
                                <span>Sin cuota de manejo, transferencias gratis a otros bancos</span>
                            </div>
                            <div className="product-actions">
                                <button className="btn btn-secondary">Solicitar</button>
                            </div>
                        </div>

                        <div className="product-card visual">
                            <div className="product-icon">💳</div>
                            <h3>Pagos</h3>
                            <p>Paga servicios y tarjetas</p>
                            <div className="product-stats">
                                <span>Realiza tus pagos Aqui</span>
                            </div>
                            <div className="product-actions">
                                <button className="btn btn-secondary">Configurar</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* CDTs Section */}
            <div className="dashboard-cdts">
                <div className="dashboard-container">
                    <div className="section-header">
                        <h2>Mis CDTs</h2>
                        <Link to="/crear-cdt" className="btn btn-primary">+ Crear CDT</Link>
                    </div>

                    {userCDTs.length > 0 ? (
                        <div className="cdts-grid">
                            {userCDTs.map((cdt, index) => (
                                <Link key={cdt.id || `cdt-${index}-${cdt.amount}`} 
                                      to={`/cdt/${cdt.id}`} 
                                      className="cdt-card clickable">
                                    <div className="cdt-header">
                                        <h3>CDT #{cdt.id || (index + 1)}</h3>
                                        <span className={`cdt-status ${cdt.status || 'active'}`}>
                                            {cdt.status === 'active' ? 'Activo' : 'Vencido'}
                                        </span>
                                    </div>
                                    <div className="cdt-details">
                                        <div className="cdt-amount">
                                            <span>Monto Invertido: </span>
                                            <strong>{formatCurrency(cdt.amount)}</strong>
                                        </div>
                                        <div className="cdt-rate">
                                            <span>Rentabilidad: </span>
                                            <strong>{cdt.rate}% EA</strong>
                                        </div>
                                        <div className="cdt-term">
                                            <span>Plazo: </span>
                                            <strong>{cdt.term} días</strong>
                                        </div>
                                        <div className="cdt-maturity">
                                            <span>Vencimiento: </span>
                                            <strong>{cdt.maturityDate}</strong>
                                        </div>
                                    </div>
                                    <div className="cdt-actions">
                                        <span className="view-details">Presiona Para ver Detalles</span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    ) : (
                        <div className="empty-state">
                            <div className="empty-icon">📊</div>
                            <h3>Aún no tienes CDTs</h3>
                            <p>Comienza a invertir con nuestros Certificados de Depósito a Término</p>
                            <Link to="/crear-cdt" className="btn btn-primary">Crear mi primer CDT</Link>
                        </div>
                    )}
                </div>
            </div>

            {/* Acciones Rapidas */}
            <div className="dashboard-actions">
                <div className="dashboard-container">
                    <h2>Acciones Rápidas</h2>
                    <div className="actions-grid">
                        <Link to="/simular-cdt" className="action-card">
                            <div className="action-icon">🧮</div>
                            <h3>Simular CDT</h3>
                            <p>Calcula la rentabilidad de tu inversión</p>
                        </Link>
                        
                        <Link to="/crear-cdt" className="action-card">
                            <div className="action-icon">➕</div>
                            <h3>Crear CDT</h3>
                            <p>Invierte con rentabilidad garantizada</p>
                        </Link>
                        
                        <Link to="/estado-cuenta" className="action-card">
                            <div className="action-icon">📜</div>
                            <h3>Estado de Cuenta</h3>
                            <p>Consulta tus movimientos</p>
                        </Link>
                        
                        <button className="action-card">
                            <div className="action-icon">📱</div>
                            <h3>Descargar App</h3>
                            <p>Descarga Nuestra App en Android e IOS y gestiona desde tu Movil</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;