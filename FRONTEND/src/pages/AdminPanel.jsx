import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getPendingCDTs, approveCDT, rejectCDT, getAllCDTsForAdmin, getAdminStats } from '../utils/api';
import { toast } from 'react-hot-toast';
import CDTStatusBadge from '../components/CDTStatusBadge';
import RejectCDTModal from '../components/RejectCDTModal';

const AdminPanel = () => {
    const [currentUser, setCurrentUser] = useState(null);
    const [stats, setStats] = useState(null);
    const [cdts, setCdts] = useState([]);
    const [filter, setFilter] = useState('pending'); // pending, all, active, rejected
    const [isLoading, setIsLoading] = useState(true);
    const [showRejectModal, setShowRejectModal] = useState(false);
    const [selectedCDT, setSelectedCDT] = useState(null);
    const navigate = useNavigate();

    const loadData = React.useCallback(async () => {
        setIsLoading(true);
        try {
            // Cargar estadísticas
            const statsData = await getAdminStats();
            setStats(statsData);

            // Cargar CDTs según filtro
            if (filter === 'pending') {
                const pendingData = await getPendingCDTs();
                setCdts(pendingData.cdts || []);
            } else {
                const filterParam = filter === 'all' ? {} : { status: filter };
                const allData = await getAllCDTsForAdmin(filterParam);
                setCdts(allData.cdts || []);
            }
        } catch (error) {
            console.error('Error al cargar datos:', error);
            toast.error('Error al cargar los datos del panel');
        } finally {
            setIsLoading(false);
        }
    }, [filter]);

    useEffect(() => {
        const user = localStorage.getItem('currentUser');
        if (!user) {
            navigate('/');
            return;
        }

        const userData = JSON.parse(user);
        if (userData.role !== 'admin') {
            toast.error('Acceso denegado. Solo administradores.');
            navigate('/dashboard');
            return;
        }

        setCurrentUser(userData);
        loadData();
    }, [navigate, filter, loadData]);

    const handleApprove = async (cdtId) => {
        if (!globalThis.confirm('¿Estás seguro de aprobar esta solicitud de CDT?')) {
            return;
        }

        try {
            await approveCDT(cdtId, `Aprobado por ${currentUser.name}`);
            toast.success('CDT aprobado exitosamente');
            loadData(); // Recargar datos
        } catch (error) {
            console.error('Error al aprobar CDT:', error);
            toast.error(error.response?.data?.message || 'Error al aprobar el CDT');
        }
    };

    const handleRejectClick = (cdt) => {
        setSelectedCDT(cdt);
        setShowRejectModal(true);
    };

    const handleRejectConfirm = async (reason) => {
        try {
            await rejectCDT(selectedCDT.id, reason);
            toast.success('CDT rechazado exitosamente');
            setShowRejectModal(false);
            loadData(); // Recargar datos
        } catch (error) {
            console.error('Error al rechazar CDT:', error);
            toast.error(error.response?.data?.message || 'Error al rechazar el CDT');
            throw error;
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

    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleDateString('es-CO');
    };

    if (!currentUser) {
        return <div>Cargando...</div>;
    }

    return (
        <div className="admin-panel">
            <div className="admin-panel-header">
                <h1>🏛️ Panel de Administración</h1>
                <p>Gestión de solicitudes de CDT</p>
            </div>

            {/* Estadísticas */}
            {stats && (
                <div className="admin-stats">
                    <div className="stat-card">
                        <div className="stat-icon">📊</div>
                        <div className="stat-content">
                            <span className="stat-label">Total CDTs</span>
                            <strong className="stat-value">{stats.total_cdts || 0}</strong>
                        </div>
                    </div>
                    <div className="stat-card pending">
                        <div className="stat-icon">⏳</div>
                        <div className="stat-content">
                            <span className="stat-label">Pendientes</span>
                            <strong className="stat-value">{stats.pending_cdts || 0}</strong>
                        </div>
                    </div>
                    <div className="stat-card active">
                        <div className="stat-icon">✅</div>
                        <div className="stat-content">
                            <span className="stat-label">Activos</span>
                            <strong className="stat-value">{stats.active_cdts || 0}</strong>
                        </div>
                    </div>
                    <div className="stat-card rejected">
                        <div className="stat-icon">❌</div>
                        <div className="stat-content">
                            <span className="stat-label">Rechazados</span>
                            <strong className="stat-value">{stats.rejected_cdts || 0}</strong>
                        </div>
                    </div>
                    <div className="stat-card financial">
                        <div className="stat-icon">💰</div>
                        <div className="stat-content">
                            <span className="stat-label">Total Invertido</span>
                            <strong className="stat-value">{formatCurrency(stats.total_amount || 0)}</strong>
                        </div>
                    </div>
                </div>
            )}

            {/* Filtros */}
            <div className="admin-filters">
                <button
                    className={`filter-btn ${filter === 'pending' ? 'active' : ''}`}
                    onClick={() => setFilter('pending')}
                >
                    ⏳ Pendientes
                </button>
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => setFilter('all')}
                >
                    📋 Todos
                </button>
                <button
                    className={`filter-btn ${filter === 'active' ? 'active' : ''}`}
                    onClick={() => setFilter('active')}
                >
                    ✅ Activos
                </button>
                <button
                    className={`filter-btn ${filter === 'rejected' ? 'active' : ''}`}
                    onClick={() => setFilter('rejected')}
                >
                    ❌ Rechazados
                </button>
            </div>

            {/* Lista de CDTs */}
            <div className="admin-cdts-section">
                <h2>
                    {filter === 'pending' && 'Solicitudes Pendientes'}
                    {filter === 'all' && 'Todos los CDTs'}
                    {filter === 'active' && 'CDTs Activos'}
                    {filter === 'rejected' && 'CDTs Rechazados'}
                </h2>

                {isLoading && (
                    <div className="loading-state">Cargando...</div>
                )}
                
                {!isLoading && cdts.length === 0 && (
                    <div className="empty-state">
                        <div className="empty-icon">📭</div>
                        <p>No hay CDTs en esta categoría</p>
                    </div>
                )}
                
                {!isLoading && cdts.length > 0 && (
                    <div className="admin-cdts-table">
                        <table>
                            <thead>
                                <tr>
                                    <th>Usuario</th>
                                    <th>Documento</th>
                                    <th>Monto</th>
                                    <th>Plazo</th>
                                    <th>Tasa</th>
                                    <th>Fecha Solicitud</th>
                                    <th>Estado</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {cdts.map((cdt) => (
                                    <tr key={cdt.id}>
                                        <td>{cdt.userName || 'N/A'}</td>
                                        <td>{cdt.userDocument || 'N/A'}</td>
                                        <td className="amount">{formatCurrency(cdt.amount)}</td>
                                        <td>{cdt.termMonths || Math.floor(cdt.termDays / 30) || 0} meses</td>
                                        <td>{cdt.interestRate || 0}% EA</td>
                                        <td>{formatDate(cdt.submittedAt || cdt.createdAt)}</td>
                                        <td>
                                            <CDTStatusBadge status={cdt.status} />
                                        </td>
                                        <td className="actions">
                                            {cdt.status === 'pending' && (
                                                <>
                                                    <button
                                                        className="btn-approve"
                                                        onClick={() => handleApprove(cdt.id)}
                                                    >
                                                        ✅ Aprobar
                                                    </button>
                                                    <button
                                                        className="btn-reject"
                                                        onClick={() => handleRejectClick(cdt)}
                                                    >
                                                        ❌ Rechazar
                                                    </button>
                                                </>
                                            )}
                                            {cdt.status !== 'pending' && (
                                                <button
                                                    className="btn-view"
                                                    onClick={() => navigate(`/cdt/${cdt.id}`)}
                                                >
                                                    👁️ Ver
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal de rechazo */}
            {showRejectModal && selectedCDT && (
                <RejectCDTModal
                    isOpen={showRejectModal}
                    onClose={() => {
                        setShowRejectModal(false);
                        setSelectedCDT(null);
                    }}
                    onReject={handleRejectConfirm}
                    cdtData={selectedCDT}
                />
            )}
        </div>
    );
};

export default AdminPanel;
