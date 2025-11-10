import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { loginUser, getErrorMessage } from "../utils/api";

const HeaderNew = () => {
    // ===== ESTADOS DE LA APLICACIÓN =====
    const [showLoginFields, setShowLoginFields] = useState(false); // Control del formulario de login
    const [showUserMenu, setShowUserMenu] = useState(false); // Control del menú de usuario
    const [currentUser, setCurrentUser] = useState(null); // Usuario actualmente logueado
    const [activeDropdown, setActiveDropdown] = useState(null); // Dropdown activo en navegación
    const [dropdownTimeout, setDropdownTimeout] = useState(null); // Control de timing para dropdowns
    
    // ===== ESTADO DEL FORMULARIO DE LOGIN =====
    const [loginData, setLoginData] = useState({
        documentType: "CC",
        documentNumber: "",
        password: ""
    });
    const [loginError, setLoginError] = useState(""); // Mensajes de error
    const [fieldErrors, setFieldErrors] = useState({}); // Errores específicos por campo
    const [isLoading, setIsLoading] = useState(false); // Estado de carga
    const navigate = useNavigate();

    // ===== VERIFICACIÓN DE USUARIO AL CARGAR =====
    useEffect(() => {
        const user = localStorage.getItem("currentUser");
        if (user) {
            setCurrentUser(JSON.parse(user));
        }
    }, []);

    // ===== FUNCIONES DE VALIDACIÓN =====
    const validateField = (field, value) => {
        switch(field) {
            case 'documentNumber':
                if (loginData.documentType === "CC") {
                    return /^\d{7,10}$/.test(value) ? "" : "Debe contener entre 7 y 10 dígitos numéricos";
                } else {
                    return /^\d{6,9}$/.test(value) ? "" : "Debe contener entre 6 y 9 dígitos numéricos";
                }
            
            case 'password':
                return value.length >= 8 ? "" : "La contraseña debe tener mínimo 8 caracteres";
                
            default:
                return "";
        }
    };

    // ===== FUNCIONES DE CONTROL DE UI =====
    const toggleLoginFields = () => {
        // Alternar vista del formulario de login
        setShowLoginFields(!showLoginFields);
        setShowUserMenu(false);
        setLoginError("");
        setLoginData({
            documentType: "CC",
            documentNumber: "",
            password: ""
        });
    };

    const toggleUserMenu = () => {
        // Alternar menú de usuario logueado
        setShowUserMenu(!showUserMenu);
        setShowLoginFields(false);
    };

    // Efecto para reiniciar errores cuando cambia el tipo de documento
    useEffect(() => {
        setFieldErrors(prev => ({
            ...prev,
            documentNumber: ""
        }));
    }, [loginData.documentType]);

    // ===== FUNCIÓN DE AUTENTICACIÓN =====
    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError("");
        
        // Validar campos antes de intentar login
        const documentError = validateField('documentNumber', loginData.documentNumber);
        const passwordError = validateField('password', loginData.password);
        
        if (documentError || passwordError) {
            setFieldErrors({
                documentNumber: documentError,
                password: passwordError
            });
            setLoginError("Por favor corrige los errores antes de continuar");
            return;
        }
        
        setIsLoading(true);
        
        try {
            // Llamar al API de login con documento
            const response = await loginUser({
                documentType: loginData.documentType,
                documentNumber: loginData.documentNumber,
                password: loginData.password
            });

            // Extraer datos de la respuesta
            // Backend retorna: { status: "success", data: { user, accessToken, refreshToken } }
            const responseData = response.data;
            
            if (!responseData || !responseData.accessToken || !responseData.refreshToken || !responseData.user) {
                throw new Error('Respuesta inválida del servidor');
            }

            // Crear objeto de usuario con tokens incluidos para el interceptor
            const userWithTokens = {
                ...responseData.user,
                accessToken: responseData.accessToken,
                refreshToken: responseData.refreshToken
            };

            // Guardar usuario completo con tokens en localStorage
            localStorage.setItem("currentUser", JSON.stringify(userWithTokens));

            // Actualizar estado y cerrar formulario
            setCurrentUser(userWithTokens);
            setShowLoginFields(false);
            setLoginError("");
            setFieldErrors({});
            
            // Redirigir al home con mensaje de bienvenida
            navigate("/", { 
                state: { 
                    message: `¡Inicio de sesión exitoso! Bienvenido ${responseData.user.name}`,
                    type: 'success'
                } 
            });

        } catch (err) {
            console.error("Error en login:", err);
            const errorMsg = getErrorMessage(err);
            setLoginError(errorMsg || "Credenciales inválidas. Verifica tu documento y contraseña.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleLogout = () => {
        // Guardar el nombre del usuario antes de limpiar
        const userName = currentUser?.name || 'Usuario';
        
        // Eliminar tokens y datos del usuario
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("currentUser");
        setCurrentUser(null);
        setShowUserMenu(false);
        
        // Redirigir con mensaje de despedida
        navigate("/", {
            state: {
                message: `¡Hasta pronto ${userName}! Has cerrado sesión correctamente.`,
                type: 'info'
            }
        });
    };

    const handleDropdownEnter = (dropdown) => {
        if (dropdownTimeout) {
            clearTimeout(dropdownTimeout);
            setDropdownTimeout(null);
        }
        setActiveDropdown(dropdown);
    };

    const handleDropdownLeave = () => {
        const timeout = setTimeout(() => {
            setActiveDropdown(null);
        }, 150); // 150ms delay antes de cerrar
        setDropdownTimeout(timeout);
    };

    const handleInputChange = (field, value) => {
        // Validaciones específicas durante la entrada
        if (field === 'documentNumber') {
            if (loginData.documentType === "CC" && value.length > 10) {
                return; // No permitir más de 10 dígitos para CC
            }
            if (loginData.documentType === "CE" && value.length > 9) {
                return; // No permitir más de 9 dígitos para CE
            }
            if (!/^\d*$/.test(value)) {
                return; // Solo permitir dígitos
            }
        }
        
        // No hay restricción en la contraseña durante la entrada
        // Permitir cualquier carácter (letras, números, símbolos)
        
        // Actualizar el estado del formulario
        setLoginData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Validar el campo actualizado
        const newError = validateField(field, value);
        setFieldErrors(prev => ({
            ...prev,
            [field]: newError
        }));
        
        setLoginError(""); // Limpiar error general
    };

    // Cerrar menús al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (!event.target.closest('.header-auth')) {
                setShowLoginFields(false);
                setShowUserMenu(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            // Limpiar timeout al desmontar
            if (dropdownTimeout) {
                clearTimeout(dropdownTimeout);
            }
        };
    }, [dropdownTimeout]);

    return (
        <header className="neobank-header">
            {/* Top Header Bar */}
            <div className="header-sup">
                <div className="header-sup-content">
                    <div className="header-links-left">
                        <span>NeoBank</span>
                        <span className="separator">|</span>
                        <span>Grupo Financiero</span>
                    </div>
                    <div className="header-links-right">
                        <Link to="/transparencia">Transparencia</Link>
                        <span className="separator">|</span>
                        <Link to="/canales">Canales de Atención</Link>
                    </div>
                </div>
            </div>

            {/* Main Header */}
            <div className="header-main">
                <div className="header-container">
                    <div className="header-content">
                        {/* Logo Section */}
                        <div className="header-logo">
                            <Link to="/" className="logo-link">
                                <h1 className="logo-text">NeoBank</h1>
                            </Link>
                        </div>

                        {/* Navigation Menu */}
                        <nav className="header-nav">
                            <div className="nav-menu">
                                <div 
                                    className="nav-dropdown"
                                    onMouseEnter={() => handleDropdownEnter('cuentas')}
                                    onMouseLeave={handleDropdownLeave}
                                >
                                    <span className="nav-item">Cuentas</span>
                                    {activeDropdown === 'cuentas' && (
                                        <div className="dropdown-menu">
                                            <button className="dropdown-item" disabled>
                                                <div className="dropdown-icon">💳</div>
                                                <div className="dropdown-content">
                                                    <span>Abre tu cuenta de ahorros</span>
                                                    <small>Costo $0</small>
                                                </div>
                                            </button>
                                            <button className="dropdown-item" disabled>
                                                <div className="dropdown-icon">💰</div>
                                                <div className="dropdown-content">
                                                    <span>Cuenta de ahorros (Nómina)</span>
                                                    <small>Costo $0</small>
                                                </div>
                                            </button>
                                            <button className="dropdown-item" disabled>
                                                <div className="dropdown-icon">🏛️</div>
                                                <div className="dropdown-content">
                                                    <span>Alcancía (Cuenta PAC)</span>
                                                    <small>Ahorra automáticamente</small>
                                                </div>
                                            </button>
                                            <button className="dropdown-item" disabled>
                                                <div className="dropdown-icon">💳</div>
                                                <div className="dropdown-content">
                                                    <span>Tarjeta débito</span>
                                                    <small>Disponible próximamente</small>
                                                </div>
                                            </button>
                                            <button className="dropdown-item" disabled>
                                                <div className="dropdown-icon">🏪</div>
                                                <div className="dropdown-content">
                                                    <span>Deposita plata gratis</span>
                                                    <small>En tu cuenta aquí</small>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <span className="nav-separator">|</span>
                                
                                <div 
                                    className="nav-dropdown"
                                    onMouseEnter={() => handleDropdownEnter('pagos')}
                                    onMouseLeave={handleDropdownLeave}
                                >
                                    <span className="nav-item">Pagos</span>
                                    {activeDropdown === 'pagos' && (
                                        <div className="dropdown-menu">
                                            <button className="dropdown-item">
                                                <div className="dropdown-icon">💳</div>
                                                <div className="dropdown-content">
                                                    <span>Paga tu tarjeta</span>
                                                    <small>Próximamente</small>
                                                </div>
                                            </button>
                                            <button className="dropdown-item" disabled>
                                                <div className="dropdown-icon">💵</div>
                                                <div className="dropdown-content">
                                                    <span>Avances en efectivo</span>
                                                    <small>Próximamente</small>
                                                </div>
                                            </button>
                                            <button className="dropdown-item" disabled>
                                                <div className="dropdown-icon">💳</div>
                                                <div className="dropdown-content">
                                                    <span>Tarjetas</span>
                                                    <small>Gestión de tarjetas</small>
                                                </div>
                                            </button>
                                            <button className="dropdown-item" disabled>
                                                <div className="dropdown-icon">🏦</div>
                                                <div className="dropdown-content">
                                                    <span>Paga tu crédito</span>
                                                    <small>Próximamente</small>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                                
                                <span className="nav-separator">|</span>
                                
                                <div 
                                    className="nav-dropdown"
                                    onMouseEnter={() => handleDropdownEnter('inversion')}
                                    onMouseLeave={handleDropdownLeave}
                                >
                                    <span className="nav-item">Inversión</span>
                                    {activeDropdown === 'inversion' && (
                                        <div className="dropdown-menu">
                                            <button 
                                                className="dropdown-item"
                                                onClick={() => {
                                                    if (currentUser) {
                                                        navigate('/dashboard');
                                                    } else {
                                                        setShowLoginFields(true);
                                                    }
                                                }}
                                            >
                                                <div className="dropdown-icon">📊</div>
                                                <div className="dropdown-content">
                                                    <span>Mis CDTs</span>
                                                    <small>Ver mis inversiones</small>
                                                </div>
                                            </button>
                                            <button 
                                                className="dropdown-item"
                                                onClick={() => navigate('/simular-cdt')}
                                            >
                                                <div className="dropdown-icon">🧮</div>
                                                <div className="dropdown-content">
                                                    <span>Simular CDT</span>
                                                    <small>Calcula tu rentabilidad</small>
                                                </div>
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </nav>

                        {/* Auth Section */}
                        <div className="header-auth">
                            {!currentUser ? (
                                // Usuario no logueado - mantener diseño original
                                <>
                                    {!showLoginFields && (
                                        <div className="auth-buttons">
                                            <button 
                                                className="btn btn-primary"
                                                onClick={toggleLoginFields}
                                            >
                                                Banca en línea
                                            </button>
                                        </div>
                                    )}

                                    {showLoginFields && (
                                        <div className="auth-form-container">
                                            <div className="auth-form">
                                <button 
                                    className="auth-form-close"
                                    onClick={toggleLoginFields}
                                    aria-label="Cerrar"
                                >
                                    ×
                                </button>                                <form onSubmit={handleLogin} className="login-form-inline">
                                    <div className="form-row">
                                        <select
                                            value={loginData.documentType}
                                            onChange={(e) => handleInputChange('documentType', e.target.value)}
                                            className="form-select"
                                            required
                                        >
                                            <option value="CC">CC</option>
                                            <option value="CE">CE</option>
                                        </select>
                                        
                                        <input
                                            type="text"
                                            placeholder={`Número de documento (${loginData.documentType === "CC" ? "7-10 dígitos" : "6-9 dígitos"})`}
                                            value={loginData.documentNumber}
                                            onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                                            className={`form-input ${fieldErrors.documentNumber ? 'error-input' : ''}`}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-row">
                                        <input
                                            type="password"
                                            placeholder="Contraseña (mínimo 8 caracteres)"
                                            value={loginData.password}
                                            onChange={(e) => handleInputChange('password', e.target.value)}
                                            className={`form-input ${fieldErrors.password ? 'error-input' : ''}`}
                                            required
                                        />
                                    </div>
                                    
                                    <div className="form-row">
                                        <button 
                                            type="submit" 
                                            className={`btn-login ${isLoading ? 'loading' : ''}`}
                                            disabled={isLoading || !loginData.documentNumber || !loginData.password}
                                        >
                                            {isLoading ? '' : 'Ingresar'}
                                        </button>
                                    </div>
                                </form>                                                {fieldErrors.documentNumber && (
                                                    <div className="field-error-inline">{fieldErrors.documentNumber}</div>
                                                )}
                                                
                                                {fieldErrors.password && (
                                                    <div className="field-error-inline">{fieldErrors.password}</div>
                                                )}

                                                {loginError && (
                                                    <div className="auth-error">
                                                        {loginError}
                                                    </div>
                                                )}
                                                
                                                <div className="auth-footer">
                                                    <Link 
                                                        to="/register" 
                                                        className="auth-link"
                                                        onClick={toggleLoginFields}
                                                    >
                                                        Crea o recupera tu Clave Internet
                                                    </Link>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                // Usuario logueado - mostrar menú de usuario
                                <div className="user-menu">
                                    <button 
                                        className="user-button"
                                        onClick={toggleUserMenu}
                                    >
                                        <div className="user-icon">
                                            {currentUser.name.charAt(0).toUpperCase()}
                                        </div>
                                        <span>Hola, {currentUser.name.split(' ')[0]}</span>
                                        <span style={{ marginLeft: '4px' }}>▼</span>
                                    </button>

                                    {showUserMenu && (
                                        <div className="user-dropdown">
                                            <div className="user-info">
                                                <div className="user-name">{currentUser.name}</div>
                                                <div className="user-document">
                                                    {currentUser.documentType}: {currentUser.documentNumber}
                                                </div>
                                            </div>
                                            <div className="user-actions">
                                                <Link to="/perfil" className="user-action">Mi Perfil</Link>
                                                <button 
                                                    className="user-action"
                                                    onClick={() => navigate("/dashboard")}
                                                >
                                                    Mis Productos
                                                </button>
                                                {currentUser.role === 'admin' && (
                                                    <Link to="/admin/solicitudes" className="user-action admin-link">
                                                        🏛️ Panel Admin
                                                    </Link>
                                                )}
                                                <button className="user-action">Configuración</button>
                                                <button 
                                                    className="user-action logout"
                                                    onClick={handleLogout}
                                                >
                                                    Cerrar Sesión
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default HeaderNew;