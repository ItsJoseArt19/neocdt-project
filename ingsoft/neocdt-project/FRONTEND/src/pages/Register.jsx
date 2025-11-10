import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { registerUser, getErrorMessage } from "../utils/api";

const Register = () => {
    // ===== ESTADOS DEL FORMULARIO DE REGISTRO =====
    const [formData, setFormData] = useState({
        documentType: "CC",    // Tipo de documento por defecto
        documentNumber: "",    // Número de documento único
        name: "",              // Nombre y primer apellido
        email: "",             // Correo electrónico
        phone: "",             // Teléfono celular (sin el +57)
        nationality: "",       // Solo para CE
        residenceDate: "",     // Solo para CE
        password: "",          // Contraseña (8+ caracteres)
        confirmPassword: ""    // Confirmación de contraseña
    });
    
    const [error, setError] = useState("");           // Mensajes de error
    const [fieldErrors, setFieldErrors] = useState({}); // Errores por campo
    const [isLoading, setIsLoading] = useState(false); // Estado de carga
    const navigate = useNavigate();

    // Lista de países para el selector de nacionalidad
    const countries = [
        "Venezuela", "Estados Unidos", "Argentina", "Brasil", "Chile", 
        "Ecuador", "Perú", "México", "Panamá", "España", "Italia",
        "Francia", "Alemania", "Reino Unido", "Canadá", "China", 
        "Japón", "Corea del Sur", "Australia"
    ];

    // ===== FUNCIONES DE VALIDACIÓN =====
    const validateField = (field, value) => {
        switch(field) {
            case 'documentNumber':
                if (formData.documentType === "CC") {
                    return /^\d{7,10}$/.test(value) ? "" : "Debe contener entre 7 y 10 dígitos numéricos";
                } else {
                    return /^\d{6,9}$/.test(value) ? "" : "Debe contener entre 6 y 9 dígitos numéricos";
                }
            
            case 'name':
                return /^[A-Za-zÁáÉéÍíÓóÚúÑñ\s]+$/.test(value) ? "" : "Solo se permiten letras y espacios";
                
            case 'password':
                if (value.length < 8) return "La contraseña debe tener mínimo 8 caracteres";
                if (!/[a-z]/.test(value)) return "Debe contener al menos una letra minúscula";
                if (!/[A-Z]/.test(value)) return "Debe contener al menos una letra mayúscula";
                if (!/\d/.test(value)) return "Debe contener al menos un número";
                return "";
            
            case 'confirmPassword':
                if (!value) return "Confirme su contraseña";
                if (value !== formData.password) return "Las contraseñas no coinciden";
                return "";
                
            case 'email':
                return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Ingrese un correo electrónico válido";
                
            case 'phone':
                return /^3\d{9}$/.test(value) ? "" : "Ingrese un número celular válido de 10 dígitos que inicie con 3";
                
            case 'nationality':
                if (formData.documentType === "CE") {
                    return value ? "" : "Seleccione su nacionalidad";
                }
                return "";
                
            case 'residenceDate':
                if (formData.documentType === "CE") {
                    return value ? "" : "Seleccione la fecha de residencia";
                }
                return "";
                
            default:
                return "";
        }
    };

    // ===== MANEJO DE CAMBIOS EN INPUTS =====
    const handleInputChange = (field, value) => {
        // Validaciones específicas durante la entrada
        if (field === 'documentNumber') {
            if (formData.documentType === "CC" && value.length > 10) {
                return; // No permitir más de 10 dígitos para CC
            }
            if (formData.documentType === "CE" && value.length > 9) {
                return; // No permitir más de 9 dígitos para CE
            }
            if (!/^\d*$/.test(value)) {
                return; // Solo permitir dígitos
            }
        }
        
        if (field === 'phone') {
            if (!/^\d*$/.test(value) || (value.length > 0 && value[0] !== '3')) {
                return; // Solo permitir dígitos y que empiece con 3
            }
            if (value.length > 10) {
                return; // No permitir más de 10 dígitos
            }
        }
        
        // Actualizar el estado del formulario
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Validar el campo actualizado
        const newError = validateField(field, value);
        setFieldErrors(prev => ({
            ...prev,
            [field]: newError
        }));
        
        setError(""); // Limpiar error general
    };

    // Efecto para reiniciar campos condicionales cuando cambia el tipo de documento
    useEffect(() => {
        if (formData.documentType === "CC") {
            setFormData(prev => ({
                ...prev,
                nationality: "",
                residenceDate: ""
            }));
        }
        
        // Reiniciar error de documento al cambiar el tipo
        setFieldErrors(prev => ({
            ...prev,
            documentNumber: ""
        }));
    }, [formData.documentType]);

    const handleRegister = async (e) => {
        e.preventDefault();
        
        // Validar todos los campos antes de enviar
        let hasErrors = false;
        let newErrors = {};
        
        // Campos obligatorios para todos
        const requiredFields = ['documentNumber', 'name', 'email', 'phone', 'password', 'confirmPassword'];
        
        // Campos adicionales según tipo de documento
        if (formData.documentType === "CE") {
            requiredFields.push('nationality', 'residenceDate');
        }
        
        // Validar cada campo
        requiredFields.forEach(field => {
            const error = validateField(field, formData[field]);
            if (error) {
                newErrors[field] = error;
                hasErrors = true;
            }
        });
        
        if (hasErrors) {
            setFieldErrors(newErrors);
            setError("Por favor corrija los errores en el formulario");
            return;
        }
        
        setIsLoading(true);
        setError("");
        
        try {
            // Llamar al backend para registrar el usuario
            await registerUser(formData);
            
            // Registro exitoso - redirigir al home con mensaje de éxito
            navigate("/", { 
                state: { 
                    message: `¡Registro exitoso! Bienvenido ${formData.name}. Ya puedes iniciar sesión.`,
                    type: 'success'
                } 
            });
        } catch (err) {
            // Extraer mensaje de error del backend
            const errorMsg = getErrorMessage(err);
            setError(errorMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="register-page">
            <div className="register-container">
                <div className="register-header-section">
                    <h1>Únete a NeoBank</h1>
                    <p>Crea tu cuenta en minutos y disfruta de la banca digital</p>
                </div>
                
                <div className="register-content-grid">
                    {/* LEFT SIDE - FEATURES */}
                    <div className="register-features-left">
                        <div className="register-info">
                            <h3>Seguridad Garantizada</h3>
                            <div className="security-features">
                                <div className="feature">
                                    <div className="feature-icon">🔒</div>
                                    <div>
                                        <h3>Encriptación avanzada</h3>
                                        <p>Protección de nivel bancario</p>
                                    </div>
                                </div>
                                <div className="feature">
                                    <div className="feature-icon">📱</div>
                                    <div>
                                        <h3>Acceso 24/7</h3>
                                        <p>Desde cualquier dispositivo</p>
                                    </div>
                                </div>
                                <div className="feature">
                                    <div className="feature-icon">⚡</div>
                                    <div>
                                        <h3>Operaciones instantáneas</h3>
                                        <p>Transferencias en tiempo real</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CENTER - FORM */}
                    <div className="register-card">
                        <h2 className="register-title">
                            <span className="green">Crea tu cuenta</span> en NeoBank
                        </h2>
                        <form className="register-form" onSubmit={handleRegister}>
                                <label htmlFor="documentType">Tipo de documento</label>
                            <select
                                id="documentType"
                                value={formData.documentType}
                                onChange={(e) => handleInputChange('documentType', e.target.value)}
                                required
                            >
                                <option value="CC">Cédula de ciudadanía</option>
                                <option value="CE">Cédula de extranjería</option>
                            </select>
                            
                            <label htmlFor="documentNumber">Número de documento</label>
                            <input
                                id="documentNumber"
                                type="text"
                                placeholder={`Escribe el número de documento (${formData.documentType === "CC" ? "7-10 dígitos" : "6-9 dígitos"})`}
                                value={formData.documentNumber}
                                onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                                required
                                className={fieldErrors.documentNumber ? "error-field" : ""}
                            />
                            {fieldErrors.documentNumber && (
                                <div className="field-error">{fieldErrors.documentNumber}</div>
                            )}
                            
                            {formData.documentType === "CE" && (
                                <>
                                    <label htmlFor="nationality">Nacionalidad</label>
                                    <select
                                        id="nationality"
                                        value={formData.nationality}
                                        onChange={(e) => handleInputChange('nationality', e.target.value)}
                                        required
                                        className={fieldErrors.nationality ? "error-field" : ""}
                                    >
                                        <option value="">Selecciona un país</option>
                                        {countries.map(country => (
                                            <option key={country} value={country}>{country}</option>
                                        ))}
                                    </select>
                                    {fieldErrors.nationality && (
                                        <div className="field-error">{fieldErrors.nationality}</div>
                                    )}
                                    
                                    <label htmlFor="residenceDate">Fecha de residencia en Colombia</label>
                                    <input
                                        id="residenceDate"
                                        type="date"
                                        value={formData.residenceDate}
                                        onChange={(e) => handleInputChange('residenceDate', e.target.value)}
                                        max={new Date().toISOString().split('T')[0]}
                                        required
                                        className={fieldErrors.residenceDate ? "error-field" : ""}
                                    />
                                    {fieldErrors.residenceDate && (
                                        <div className="field-error">{fieldErrors.residenceDate}</div>
                                    )}
                                </>
                            )}
                            
                            <label htmlFor="name">Nombre y primer apellido</label>
                            <input
                                id="name"
                                type="text"
                                placeholder="Ej: Juan López"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                required
                                className={fieldErrors.name ? "error-field" : ""}
                            />
                            {fieldErrors.name && (
                                <div className="field-error">{fieldErrors.name}</div>
                            )}
                            
                            <label htmlFor="email">Correo electrónico</label>
                            <input
                                id="email"
                                type="email"
                                placeholder="ejemplo@correo.com"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                required
                                className={fieldErrors.email ? "error-field" : ""}
                            />
                            {fieldErrors.email && (
                                <div className="field-error">{fieldErrors.email}</div>
                            )}
                            
                            <label htmlFor="phone">Número celular</label>
                            <div className="phone-input-container">
                                <div className="phone-prefix">+57</div>
                                <input
                                    id="phone"
                                    type="text"
                                    placeholder="3001234567"
                                    value={formData.phone}
                                    onChange={(e) => handleInputChange('phone', e.target.value)}
                                    required
                                    className={fieldErrors.phone ? "error-field phone-input" : "phone-input"}
                                />
                            </div>
                            {fieldErrors.phone && (
                                <div className="field-error">{fieldErrors.phone}</div>
                            )}
                            
                            <label htmlFor="password">Crea una clave (mínimo 8 caracteres)</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Ej: MiClave123"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                required
                                className={fieldErrors.password ? "error-field" : ""}
                            />
                            <small className="password-hint">
                                Debe contener: mayúsculas, minúsculas y números
                            </small>
                            {fieldErrors.password && (
                                <div className="field-error">{fieldErrors.password}</div>
                            )}
                            
                            <label htmlFor="confirmPassword">Confirma tu clave</label>
                            <input
                                id="confirmPassword"
                                type="password"
                                placeholder=""
                                value={formData.confirmPassword}
                                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                                required
                                className={fieldErrors.confirmPassword ? "error-field" : ""}
                            />
                            {fieldErrors.confirmPassword && (
                                <div className="field-error">{fieldErrors.confirmPassword}</div>
                            )}
                            
                            {error && <div className="register-error">{error}</div>}
                            
                            <button 
                                className={`register-btn ${isLoading ? 'loading' : ''}`} 
                                type="submit"
                                disabled={isLoading}
                            >
                                {isLoading ? 'Registrando...' : 'Registrar'}
                            </button>
                        </form>
                    </div>

                    {/* RIGHT SIDE - BENEFITS */}
                    <div className="register-benefits">
                        <h3>¿Por qué elegir NeoBank?</h3>
                        <ul>
                            <li>✅ Cuenta de ahorros costo $0</li>
                            <li>✅ CDTs con rentabilidad competitiva</li>
                            <li>✅ Transferencias gratuitas</li>
                            <li>✅ Soporte 24/7</li>
                            <li>✅ Sin costos de manejo</li>
                            <li>✅ Apertura 100% digital</li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;