import React, {useState} from "react";
import {useNavigate, Link} from "react-router-dom";
import { loginUser, getErrorMessage } from "../utils/api";

const Login = () => {
    const [formData, setFormData] = useState({
        documentType: "CC",
        documentNumber: "",
        password: ""
    });
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState({});
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const validateField = (field, value) => {
        switch(field) {
            case 'documentNumber':
                if (formData.documentType === "CC") {
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
        
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        // Validar el campo
        const newError = validateField(field, value);
        setFieldErrors(prev => ({
            ...prev,
            [field]: newError
        }));
        
        setError("");
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        
        // Validar todos los campos antes de enviar
        const documentError = validateField('documentNumber', formData.documentNumber);
        const passwordError = validateField('password', formData.password);
        
        if (documentError || passwordError) {
            setFieldErrors({
                documentNumber: documentError,
                password: passwordError
            });
            setError("Por favor corrige los errores antes de continuar");
            return;
        }

        setIsLoading(true);

        try {
            // Llamar al API de login con documento
            const response = await loginUser({
                documentType: formData.documentType,
                documentNumber: formData.documentNumber,
                password: formData.password
            });

            // Extraer datos de la respuesta
            // Backend retorna: { status: "success", data: { user, accessToken, refreshToken } }
            const loginData = response.data;
            
            if (!loginData || !loginData.accessToken || !loginData.refreshToken || !loginData.user) {
                throw new Error('Respuesta inválida del servidor');
            }

            // Crear objeto de usuario con tokens incluidos para el interceptor
            const userWithTokens = {
                ...loginData.user,
                accessToken: loginData.accessToken,
                refreshToken: loginData.refreshToken
            };

            // Guardar usuario completo con tokens en localStorage
            localStorage.setItem("currentUser", JSON.stringify(userWithTokens));

            // Redirigir al home con mensaje de bienvenida
            navigate("/", { 
                state: { 
                    message: `¡Inicio de sesión exitoso! Bienvenido ${loginData.user.name}`,
                    type: 'success'
                } 
            });

        } catch (err) {
            console.error("Error en login:", err);
            const errorMsg = getErrorMessage(err);
            setError(errorMsg || "Credenciales inválidas. Verifica tu documento y contraseña.");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-hero">
                    <h1>Bienvenido a NeoBank</h1>
                    <p className="subtitle">Tu banco digital 100% seguro y confiable</p>
                    
                    <div className="login-features">
                        <div className="login-feature-item">
                            <div className="login-feature-icon">🔒</div>
                            <div className="login-feature-text">Encriptación de nivel bancario</div>
                        </div>
                        <div className="login-feature-item">
                            <div className="login-feature-icon">📱</div>
                            <div className="login-feature-text">Acceso desde cualquier dispositivo</div>
                        </div>
                        <div className="login-feature-item">
                            <div className="login-feature-icon">⚡</div>
                            <div className="login-feature-text">Transacciones instantáneas</div>
                        </div>
                        <div className="login-feature-item">
                            <div className="login-feature-icon">💰</div>
                            <div className="login-feature-text">Sin costos de manejo</div>
                        </div>
                    </div>
                </div>

                <div className="login-card">
                    <div className="login-card-header">
                        <h1 className="login-logo">NeoBank</h1>
                        <h2>Ingresa a tu Banca en Línea</h2>
                    </div>

                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="login-form-group">
                            <label htmlFor="documentType">Tipo de documento</label>
                            <div className="login-form-row">
                                <select 
                                    id="documentType"
                                    value={formData.documentType}
                                    onChange={(e) => handleInputChange('documentType', e.target.value)}
                                    required
                                >
                                    <option value="CC">CC</option>
                                    <option value="CE">CE</option>
                                </select>
                                
                                <input
                                    id="documentNumber"
                                    type="text"
                                    placeholder={`Número de documento (${formData.documentType === "CC" ? "7-10 dígitos" : "6-9 dígitos"})`}
                                    value={formData.documentNumber}
                                    onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                                    className={fieldErrors.documentNumber ? 'error-field' : ''}
                                    required
                                />
                            </div>
                            {fieldErrors.documentNumber && (
                                <div className="field-error">{fieldErrors.documentNumber}</div>
                            )}
                        </div>

                        <div className="login-form-group">
                            <label htmlFor="password">Contraseña</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Ingresa tu contraseña (mínimo 8 caracteres)"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                className={fieldErrors.password ? 'error-field' : ''}
                                required
                            />
                            {fieldErrors.password && (
                                <div className="field-error">{fieldErrors.password}</div>
                            )}
                        </div>

                        {error && (
                            <div className="login-error" role="alert">
                                {error}
                            </div>
                        )}

                        <button className={`login-btn ${isLoading ? 'loading' : ''}`}
                            disabled={isLoading}
                            type="submit"
                        >
                            {isLoading ? '' : 'Ingresar'}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>¿No tienes cuenta?</p>
                        <Link to="/register">Créala aquí</Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;