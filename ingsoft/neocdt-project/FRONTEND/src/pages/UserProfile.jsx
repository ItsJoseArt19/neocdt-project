import React, { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { getUserCDTs } from "../utils/api";

const UserProfile = () => {

    const [currentUser, setCurrentUser] = useState(null); // Usuario actual
    const [userCDTs, setUserCDTs] = useState([]); // CDTs del usuario
    const [editMode, setEditMode] = useState(false); // Modo de edición
    const [formData, setFormData] = useState({}); // Datos del formulario
    const [showSuccessMessage, setShowSuccessMessage] = useState(false); // Mensaje de éxito
    const [profileCompletion, setProfileCompletion] = useState(0); // Porcentaje de completitud
    const [missingFields, setMissingFields] = useState([]); // Campos faltantes
    const [showCompletionAlert, setShowCompletionAlert] = useState(false); // Alerta de completitud
    const navigate = useNavigate();


    const requiredFields = [
        { key: 'name', label: 'Nombre Completo' },
        { key: 'email', label: 'Correo Electrónico' },
        { key: 'phone', label: 'Teléfono' },
        { key: 'address', label: 'Dirección' },
        { key: 'city', label: 'Ciudad' },
        { key: 'occupation', label: 'Ocupación' }
    ];


    const calculateProfileCompletion = (userData) => {
        // Calcular campos completados vs requeridos
        const filledFields = requiredFields.filter(field => 
            userData[field.key] && userData[field.key].trim() !== ''
        );
        const missing = requiredFields.filter(field => 
            !userData[field.key] || userData[field.key].trim() === ''
        );
        
        setMissingFields(missing);
        const completion = Math.round((filledFields.length / requiredFields.length) * 100);
        
        if (completion < 100) {
            setShowCompletionAlert(true);
        }
        
        return completion;
    };

    useEffect(() => {
        loadProfileData();
    }, [navigate]);

    const loadProfileData = async () => {
        const user = localStorage.getItem("currentUser");
        if (!user) {
            navigate("/");
            return;
        }
        
        const userData = JSON.parse(user);
        setCurrentUser(userData);
        
        const initialFormData = {
            name: userData.name || '',
            email: userData.email || '',
            phone: userData.phone || '',
            address: userData.address || '',
            city: userData.city || '',
            occupation: userData.occupation || ''
        };
        setFormData(initialFormData);

        const completion = calculateProfileCompletion(initialFormData);
        setProfileCompletion(completion);

        // Obtener CDTs desde el backend
        try {
            const response = await getUserCDTs();
            setUserCDTs(response.cdts || []);
        } catch (error) {
            console.error('Error al cargar CDTs:', error);
            setUserCDTs([]);
        }
    };

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const validateForm = () => {
        const errors = [];
        if (!formData.name.trim()) errors.push('Nombre Completo');
        if (!formData.email.trim()) errors.push('Correo Electrónico');
        if (!formData.phone.trim()) errors.push('Teléfono');
        
        return errors;
    };

    const handleSaveChanges = () => {
        const errors = validateForm();
        if (errors.length > 0) {
            alert(`Por favor completa los campos obligatorios: ${errors.join(', ')}`);
            return;
        }

        const updatedUser = { ...currentUser, ...formData };
        localStorage.setItem("currentUser", JSON.stringify(updatedUser));
        setCurrentUser(updatedUser);
        setEditMode(false);
        
        const completion = calculateProfileCompletion(formData);
        setProfileCompletion(completion);
        
        setShowSuccessMessage(true);
        setTimeout(() => setShowSuccessMessage(false), 3000);
        
        if (completion === 100) {
            setShowCompletionAlert(false);
        }
    };

    const getTotalInvestment = () => {
        return userCDTs.reduce((total, cdt) => total + cdt.amount, 0);
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('es-CO', {
            style: 'currency',
            currency: 'COP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(amount);
    };

    const getAccountAge = () => {
        const openDate = new Date('2023-01-15');
        const today = new Date();
        const diffMonths = (today.getFullYear() - openDate.getFullYear()) * 12 + (today.getMonth() - openDate.getMonth());
        return diffMonths;
    };

    if (!currentUser) {
        return <div className="loading-profile">Cargando perfil...</div>;
    }

    return (
        <div className="user-profile-page">
            <div className="profile-container">
                <div className="profile-header">
                    <Link to="/" className="back-button">
                        ← Regresar
                    </Link>
                    <h1>Mi Perfil</h1>
                    <p>Gestiona tu información personal y configuraciones</p>
                </div>

                {showSuccessMessage && (
                    <div className="success-alert">
                        <div className="alert-content">
                            <span className="alert-icon">✅</span>
                            <span>¡Perfil actualizado correctamente!</span>
                        </div>
                    </div>
                )}

                {showCompletionAlert && profileCompletion < 100 && (
                    <div className="completion-alert">
                        <div className="alert-content">
                            <span className="alert-icon">⚠️</span>
                            <div className="alert-text">
                                <strong>¡Completa tu perfil!</strong>
                                <p>Tu perfil está {profileCompletion}% completo. Completa la información faltante para acceder a todas las funciones.</p>
                                <button 
                                    className="btn-complete-profile"
                                    onClick={() => setEditMode(true)}
                                >
                                    Completar ahora
                                </button>
                            </div>
                            <button 
                                className="alert-close"
                                onClick={() => setShowCompletionAlert(false)}
                            >
                                ×
                            </button>
                        </div>
                    </div>
                )}

                <div className="profile-content">
                    <div className="profile-main">
                        <div className="profile-progress-card">
                            <div className="progress-header">
                                <h3>Completitud del Perfil</h3>
                                <span className="progress-percentage">{profileCompletion}%</span>
                            </div>
                            <div className="progress-bar-container">
                                <div 
                                    className="progress-bar-fill"
                                    style={{ width: `${profileCompletion}%` }}
                                ></div>
                            </div>
                            {missingFields.length > 0 && (
                                <div className="missing-fields">
                                    <p>Campos faltantes:</p>
                                    <ul>
                                        {missingFields.map(field => (
                                            <li key={field.key}>{field.label}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                        </div>

                        <div className="profile-card">
                            <div className="card-header">
                                <h2>Información Personal</h2>
                                <button 
                                    className={`edit-btn ${editMode ? 'save' : 'edit'}`}
                                    onClick={editMode ? handleSaveChanges : () => setEditMode(true)}
                                >
                                    {editMode ? '💾 Guardar' : '✏️ Editar'}
                                </button>
                            </div>
                            
                            <div className="profile-info-grid">
                                <div className="info-group">
                                    <label>Nombre Completo *</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            className={!formData.name ? 'required-field' : ''}
                                            value={formData.name || ''}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            placeholder="Ingresa tu nombre completo"
                                        />
                                    ) : (
                                        <span className={!currentUser.name ? 'missing-data' : ''}>
                                            {currentUser.name || 'No especificado'}
                                        </span>
                                    )}
                                </div>

                                <div className="info-group">
                                    <label>Número de Documento</label>
                                    <span className="readonly-field">{currentUser.documentNumber}</span>
                                    <small>No se puede modificar</small>
                                </div>

                                <div className="info-group">
                                    <label>Correo Electrónico *</label>
                                    {editMode ? (
                                        <input
                                            type="email"
                                            className={!formData.email ? 'required-field' : ''}
                                            value={formData.email || ''}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            placeholder="tu@email.com"
                                        />
                                    ) : (
                                        <span className={!currentUser.email ? 'missing-data' : ''}>
                                            {currentUser.email || 'No especificado'}
                                        </span>
                                    )}
                                </div>

                                <div className="info-group">
                                    <label>Teléfono *</label>
                                    {editMode ? (
                                        <input
                                            type="tel"
                                            className={!formData.phone ? 'required-field' : ''}
                                            value={formData.phone || ''}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            placeholder="+57 300 123 4567"
                                        />
                                    ) : (
                                        <span className={!currentUser.phone ? 'missing-data' : ''}>
                                            {currentUser.phone || 'No especificado'}
                                        </span>
                                    )}
                                </div>

                                <div className="info-group">
                                    <label>Dirección</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={formData.address || ''}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            placeholder="Calle 123 #45-67"
                                        />
                                    ) : (
                                        <span className={!currentUser.address ? 'missing-data' : ''}>
                                            {currentUser.address || 'No especificado'}
                                        </span>
                                    )}
                                </div>

                                <div className="info-group">
                                    <label>Ciudad</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={formData.city || ''}
                                            onChange={(e) => handleInputChange('city', e.target.value)}
                                            placeholder="Bogotá, Medellín, Cali..."
                                        />
                                    ) : (
                                        <span className={!currentUser.city ? 'missing-data' : ''}>
                                            {currentUser.city || 'No especificado'}
                                        </span>
                                    )}
                                </div>

                                <div className="info-group">
                                    <label>Ocupación</label>
                                    {editMode ? (
                                        <input
                                            type="text"
                                            value={formData.occupation || ''}
                                            onChange={(e) => handleInputChange('occupation', e.target.value)}
                                            placeholder="Ingeniero, Médico, Estudiante..."
                                        />
                                    ) : (
                                        <span className={!currentUser.occupation ? 'missing-data' : ''}>
                                            {currentUser.occupation || 'No especificado'}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="profile-card">
                            <h2>Resumen de Cuenta</h2>
                            <div className="account-summary-grid">
                                <div className="summary-item">
                                    <div className="summary-icon">💰</div>
                                    <div className="summary-content">
                                        <span>Total Invertido en CDTs</span>
                                        <strong>{formatCurrency(getTotalInvestment())}</strong>
                                    </div>
                                </div>

                                <div className="summary-item">
                                    <div className="summary-icon">📊</div>
                                    <div className="summary-content">
                                        <span>CDTs Activos</span>
                                        <strong>{userCDTs.length}</strong>
                                    </div>
                                </div>

                                <div className="summary-item">
                                    <div className="summary-icon">🏛️</div>
                                    <div className="summary-content">
                                        <span>Cliente desde</span>
                                        <strong>{getAccountAge()} meses</strong>
                                    </div>
                                </div>

                                <div className="summary-item">
                                    <div className="summary-icon">⭐</div>
                                    <div className="summary-content">
                                        <span>Categoría</span>
                                        <strong>Premium</strong>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="profile-card">
                            <h2>Configuraciones</h2>
                            <div className="settings-list">
                                <div className="setting-item">
                                    <div className="setting-info">
                                        <span>Notificaciones por Email</span>
                                        <small>Recibe updates sobre tus CDTs</small>
                                    </div>
                                    <label className="toggle">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="setting-item">
                                    <div className="setting-info">
                                        <span>SMS de Seguridad</span>
                                        <small>Verificación en dos pasos</small>
                                    </div>
                                    <label className="toggle">
                                        <input type="checkbox" defaultChecked />
                                        <span className="slider"></span>
                                    </label>
                                </div>

                                <div className="setting-item">
                                    <div className="setting-info">
                                        <span>Renovación Automática</span>
                                        <small>Para todos los CDTs nuevos</small>
                                    </div>
                                    <label className="toggle">
                                        <input type="checkbox" />
                                        <span className="slider"></span>
                                    </label>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="profile-sidebar">
                        <div className="profile-card user-avatar-card">
                            <div className="user-avatar">
                                <div className="avatar-circle">
                                    {currentUser.name ? currentUser.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <h3>{currentUser.name || 'Usuario'}</h3>
                                <p>Cliente Premium</p>
                                <div className="completion-badge">
                                    <span className={`badge ${profileCompletion === 100 ? 'complete' : 'incomplete'}`}>
                                        {profileCompletion === 100 ? '✓ Perfil Completo' : `${profileCompletion}% Completo`}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="profile-card">
                            <h3>CDTs Recientes</h3>
                            {userCDTs.length > 0 ? (
                                <div className="recent-cdts">
                                    {userCDTs.slice(0, 3).map(cdt => (
                                        <Link key={cdt.id} to={`/cdt/${cdt.id}`} className="cdt-mini">
                                            <div className="cdt-mini-info">
                                                <span>CDT #{cdt.id}</span>
                                                <strong>{formatCurrency(cdt.amount)}</strong>
                                            </div>
                                            <div className="cdt-mini-status">
                                                {cdt.status === 'active' ? '🟢' : '🔴'}
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="no-cdts">
                                    <p>No tienes CDTs activos</p>
                                    <Link to="/crear-cdt" className="btn-small">Crear CDT</Link>
                                </div>
                            )}
                        </div>

                        <div className="profile-card">
                            <h3>Acciones Rápidas</h3>
                            <div className="quick-actions-list">
                                <Link to="/crear-cdt" className="quick-action">
                                    ➕ Nuevo CDT
                                </Link>
                                <Link to="/simular-cdt" className="quick-action">
                                    🧮 Simular CDT
                                </Link>
                                <Link to="/estado-cuenta" className="quick-action">
                                    📋 Estado de Cuenta
                                </Link>
                                <Link to="/dashboard" className="quick-action">
                                    🏠 Dashboard
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default UserProfile;