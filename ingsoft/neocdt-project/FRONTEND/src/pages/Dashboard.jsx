import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { getUserCDTs } from "../utils/api";
import CDTStatusBadge from '../components/CDTStatusBadge';

const Dashboard = () => {
    
    const [currentUser, setCurrentUser] = useState(null); // Usuario logueado
    const [userCDTs, setUserCDTs] = useState([]); // CDTs del usuario
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            setIsLoading(true);
            setError(null);
            
            // Obtener usuario actual desde localStorage
            const userStr = localStorage.getItem("currentUser");
            if (!userStr) {
                return;
            }
            
            const userData = JSON.parse(userStr);
            setCurrentUser(userData);
            
            // Obtener CDTs del backend
            const response = await getUserCDTs();
            setUserCDTs(response.cdts || []);
            
        } catch (error) {
            console.error('Error al cargar datos del dashboard:', error);
            setError('Error al cargar tus CDTs. Por favor, recarga la página.');
        } finally {
            setIsLoading(false);
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

    const calculateTotalInvestment = () => {
        // Solo contar CDTs con estado 'active'
        return userCDTs
            .filter(cdt => cdt.status === 'active')
            .reduce((total, cdt) => total + cdt.amount, 0);
    };

    if (!currentUser) {
        return null; // El header se encargará de redirigir
    }

    if (isLoading) {
        return (
            <div className="dashboard">
                <div className="dashboard-container" style={{ textAlign: 'center', padding: '50px' }}>
                    <p>Cargando tus inversiones...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="dashboard">
            {error && (
                <div className="dashboard-error" style={{ 
                    background: '#fee', 
                    color: '#c33', 
                    padding: '15px', 
                    margin: '20px', 
                    borderRadius: '8px',
                    textAlign: 'center'
                }}>
                    {error}
                </div>
            )}
            
            {/* Seccion principal */}
            <div className="dashboard-hero">
                <div className="dashboard-container">
                    <div className="dashboard-welcome">
                        <h1>¡Hola, {currentUser.name.split(' ')[0]}!</h1>
                        <p>Bienvenido a tu banca digital. Gestiona tus inversiones y productos financieros.</p>
                    </div>
                    <div className="dashboard-summary">
                        <div className="summary-card">
                            <h3>Total Invertido</h3>
                            <p className="amount">{formatCurrency(calculateTotalInvestment())}</p>
                        </div>
                        <div className="summary-card">
                            <h3>CDTs Activos</h3>
                            <p className="count">{userCDTs.filter(cdt => cdt.status === 'active').length}</p>
                        </div>
                        <div className="summary-card">
                            <h3>Total CDTs</h3>
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
                            {userCDTs.map((cdt, index) => {
                                return (
                                    <div key={cdt.id || `cdt-${index}-${cdt.amount}`} className="cdt-card-wrapper">
                                        <Link 
                                            to={`/cdt/${cdt.id}`} 
                                            className="cdt-card clickable"
                                        >
                                            <div className="cdt-header">
                                                <h3>CDT #{cdt.id || (index + 1)}</h3>
                                                <CDTStatusBadge status={cdt.status} />
                                            </div>
                                            <div className="cdt-details">
                                                <div className="cdt-amount">
                                                    <span>Monto Invertido: </span>
                                                    <strong>{formatCurrency(cdt.amount)}</strong>
                                                </div>
                                                <div className="cdt-rate">
                                                    <span>Rentabilidad: </span>
                                                    <strong>{cdt.interestRate || 0}% EA</strong>
                                                </div>
                                                <div className="cdt-term">
                                                    <span>Plazo: </span>
                                                    <strong>{cdt.termDays || 0} días</strong>
                                                </div>
                                                <div className="cdt-maturity">
                                                    <span>Vencimiento: </span>
                                                    <strong>{cdt.endDate || 'N/A'}</strong>
                                                </div>
                                            </div>
                                            <div className="cdt-actions">
                                                <span className="view-details">Presiona Para ver Detalles</span>
                                            </div>
                                        </Link>
                                    </div>
                                );
                            })}
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