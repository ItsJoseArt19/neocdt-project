import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

const AccountStatement = () => {
    const [currentUser, setCurrentUser] = useState(null); // Usuario actual
    const [transactions, setTransactions] = useState([]); // Lista de transacciones
    const [filter, setFilter] = useState('all'); // Filtro por tipo de movimiento
    const [dateRange, setDateRange] = useState('30'); // Período de consulta
    const navigate = useNavigate();

    // Validar inicio de sesion
    useEffect(() => {
        const user = localStorage.getItem("currentUser");
        if (!user) {
            navigate("/"); // Redirigir si no hay sesión
            return;
        }
        
        const userData = JSON.parse(user);
        setCurrentUser(userData);
        generateMockTransactions(); // Generar datos de prueba
    }, [navigate]);

    // Simulacion de transacciones
    const generateMockTransactions = () => {
        // Datos simulados que representan un historial bancario real
        const mockTransactions = [
            {
                id: '1',
                date: '2024-09-25',
                type: 'cdt_creation',
                description: 'Apertura CDT #001',
                amount: -5000000, 
                balance: 5000000,
                reference: 'CDT001'
            },
            {
                id: '2',
                date: '2024-09-20',
                type: 'transfer_in',
                description: 'Transferencia recibida - Juan Pérez',
                amount: 2500000, 
                balance: 10000000,
                reference: 'TRF20240920001'
            },
            {
                id: '3',
                date: '2024-09-18',
                type: 'cdt_interest',
                description: 'Intereses CDT #002',
                amount: 125000, 
                balance: 7500000,
                reference: 'INT20240918'
            },
            {
                id: '4',
                date: '2024-09-15',
                type: 'service_payment',
                description: 'Pago servicios públicos - EPM',
                amount: -350000, 
                balance: 7375000,
                reference: 'PAY20240915001'
            },
            {
                id: '5',
                date: '2024-09-12',
                type: 'transfer_out',
                description: 'Transferencia enviada - María García',
                amount: -1500000, 
                balance: 7725000,
                reference: 'TRF20240912002'
            },
            {
                id: '6',
                date: '2024-09-10',
                type: 'deposit',
                description: 'Depósito en efectivo - Sucursal Centro',
                amount: 3000000, 
                balance: 9225000,
                reference: 'DEP20240910001'
            },
            {
                id: '7',
                date: '2024-09-08',
                type: 'cdt_creation',
                description: 'Apertura CDT #002',
                amount: -2000000, 
                balance: 6225000,
                reference: 'CDT002'
            },
            {
                id: '8',
                date: '2024-09-05',
                type: 'salary',
                description: 'Nómina - Empresa ABC S.A.S',
                amount: 4500000, 
                balance: 8225000,
                reference: 'NOM20240905'
            }
        ];
        
        setTransactions(mockTransactions);
    };

    // Formato
    const formatCurrency = (amount) => {
        // Formatear números como moneda colombiana
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(Math.abs(amount));
    };

    const getTransactionIcon = (type) => {
        // Íconos según el tipo de transacción
        const icons = {
            'cdt_creation': '📊', // Apertura de CDT
            'cdt_interest': '💰', // Intereses ganados
            'transfer_in': '⬇️', // Transferencia recibida
            'transfer_out': '⬆️', // Transferencia enviada
            'service_payment': '💡', // Pago de servicios
            'deposit': '🏦', // Depósito en sucursal
            'salary': '💼', // Nómina
            'withdrawal': '💸' // Retiro de efectivo
        };
        return icons[type] || '💳'; // Ícono por defecto
    };

    const getTransactionColor = (amount) => {
        // Color según si es ingreso (positivo) o gasto (negativo)
        return amount > 0 ? 'positive' : 'negative';
    };

    // Logica de filtrado
    const filteredTransactions = transactions.filter(transaction => {
        // Filtrar transacciones según criterio seleccionado
        if (filter === 'all') return true;
        if (filter === 'income') return transaction.amount > 0;
        if (filter === 'expenses') return transaction.amount < 0;
        if (filter === 'cdt') return transaction.type.includes('cdt');
        return true;
    });

    // Calculo ingreso y gastos (resumen financiero)
    const calculateSummary = () => {
        // Calcular totales de ingresos y gastos
        const income = transactions
            .filter(t => t.amount > 0)
            .reduce((sum, t) => sum + t.amount, 0);
        
        const expenses = transactions
            .filter(t => t.amount < 0)
            .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        return { income, expenses, balance: income - expenses };
    };

    const summary = calculateSummary();

    if (!currentUser) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="account-statement">
            <div className="statement-container">
                <div className="statement-header">
                    <Link to="/dashboard" className="back-button">
                        ← Volver
                    </Link>
                    <h1>Estado de Cuenta</h1>
                    <p>Consulta todos tus Movimientos y Transacciones</p>
                </div>

                <div className="account-summary">
                    <div className="summary-grid">
                        <div className="summary-card income">
                            <div className="summary-icon">📈</div>
                            <div className="summary-content">
                                <span>Ingresos del Período</span>
                                <strong>{formatCurrency(summary.income)}</strong>
                            </div>
                        </div>
                        
                        <div className="summary-card expenses">
                            <div className="summary-icon">📉</div>
                            <div className="summary-content">
                                <span>Gastos del Período</span>
                                <strong>{formatCurrency(summary.expenses)}</strong>
                            </div>
                        </div>
                        
                        <div className="summary-card balance">
                            <div className="summary-icon">💰</div>
                            <div className="summary-content">
                                <span>Saldo Actual</span>
                                <strong>{formatCurrency(transactions[0]?.balance || 0)}</strong>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="filters-section">
                    <div className="filters-row">
                        <div className="filter-group">
                            <label htmlFor="movement-filter">Tipo de movimiento:</label>
                            <select 
                                id="movement-filter"
                                value={filter} 
                                onChange={(e) => setFilter(e.target.value)}
                                className="filter-select"
                            >
                                <option value="all">Todos los Movimientos</option>
                                <option value="income">Solo Ingresos</option>
                                <option value="expenses">Solo Gastos</option>
                                <option value="cdt">Movimientos CDT</option>
                            </select>
                        </div>
                        
                        <div className="filter-group">
                            <label htmlFor="period-filter">Período:</label>
                            <select 
                                id="period-filter"
                                value={dateRange} 
                                onChange={(e) => setDateRange(e.target.value)}
                                className="filter-select"
                            >
                                <option value="7">Últimos 7 días</option>
                                <option value="30">Últimos 30 días</option>
                                <option value="90">Últimos 3 meses</option>
                                <option value="365">Último año</option>
                            </select>
                        </div>
                        
                        <button className="btn btn-outline" disabled>
                            📄 Descargar PDF
                        </button>
                    </div>
                </div>

                <div className="transactions-section">
                    <h2>Movimientos</h2>
                    <div className="transactions-list">
                        {filteredTransactions.map((transaction) => (
                            <div key={transaction.id} className="transaction-item">
                                <div className="transaction-icon">
                                    {getTransactionIcon(transaction.type)}
                                </div>
                                
                                <div className="transaction-details">
                                    <div className="transaction-description">
                                        {transaction.description}
                                    </div>
                                    <div className="transaction-meta">
                                        <span>{transaction.date}</span>
                                        <span>•</span>
                                        <span>Ref: {transaction.reference}</span>
                                    </div>
                                </div>
                                
                                <div className="transaction-amounts">
                                    <div className={`transaction-amount ${getTransactionColor(transaction.amount)}`}>
                                        {transaction.amount > 0 ? '+' : '-'}{formatCurrency(transaction.amount)}
                                    </div>
                                    <div className="transaction-balance">
                                        Saldo: {formatCurrency(transaction.balance)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {filteredTransactions.length === 0 && (
                        <div className="empty-transactions">
                            <div className="empty-icon">📋</div>
                            <h3>No hay movimientos</h3>
                            <p>No se encontraron transacciones para los filtros seleccionados</p>
                        </div>
                    )}
                </div>

                <div className="statement-actions">
                    <div className="actions-grid">
                        <Link to="/transferencias" className="action-item">
                            <div className="action-icon">💸</div>
                            <h3>Transferir</h3>
                            <p>Envía dinero a otras cuentas</p>
                        </Link>
                        
                        <Link to="/pagar-servicios" className="action-item">
                            <div className="action-icon">💡</div>
                            <h3>Pagar Servicios</h3>
                            <p>Paga tus facturas fácilmente</p>
                        </Link>
                        
                        <Link to="/crear-cdt" className="action-item">
                            <div className="action-icon">📊</div>
                            <h3>Invertir</h3>
                            <p>Crea nuevos CDTs</p>
                        </Link>
                        
                        <button className="action-item" disabled>
                            <div className="action-icon">📞</div>
                            <h3>Contactar</h3>
                            <p>Soporte al cliente</p>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AccountStatement;