import React, {useState} from "react";
import {useNavigate, Link} from "react-router-dom";

const Login = () => {
    const [formData, setFormData] = useState({
        documentType: "Cédula Ciudadanía", 
        documentNumber: "",
        password: ""
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const navigate = useNavigate();

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setError("");
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        await new Promise(resolve => setTimeout(resolve, 800));
        const users = JSON.parse(localStorage.getItem("users")) || [];
        const user = users.find(
            u => u.documentNumber === formData.documentNumber &&
                 u.password === formData.password &&
                 u.documentType === formData.documentType
        );

        if (user) {
            localStorage.setItem("currentUser", JSON.stringify(user));
            navigate("/")
        } else{
            setError("Datos incorrectos. Verifica tu documento y clave.");
        }
        setIsLoading(false);
    };

    return (
        <div className="login-page">
            <div className="login-container">
                <div className="login-card">
                    <div className="login-header">
                        <h1>Ingresa a tu <span className="green-text">Banca en Línea</span></h1>
                        <p>Accede a todos tus productos financieros</p>
                    </div>

                    <form className="login-form" onSubmit={handleLogin}>
                        <div className="input-group">
                            <label htmlFor="documentType">Tipo de documento</label>
                            <select 
                                id="documentType"
                                value={formData.documentType}
                                onChange={(e) => handleInputChange('documentType', e.target.value)}
                                required
                            >
                                <option value="Cédula Ciudadanía">Cédula de ciudadanía</option>
                                <option value="Pasaporte">Pasaporte</option>
                                <option value="Cédula Extranjera">Cédula extranjera</option>
                            </select>
                        </div>

                        <div className="input-group">
                            <label htmlFor="documentNumber">Número de documento</label>
                            <input
                                id="documentNumber"
                                type="text"
                                placeholder="Ingresa tu numero de documento"
                                value={formData.documentNumber}
                                onChange={(e) => handleInputChange('documentNumber', e.target.value)}
                            />
                        </div>

                        <div className="input-group">
                            <label htmlFor="password">Clave Internet</label>
                            <input
                                id="password"
                                type="password"
                                placeholder="Ingresa tu clave"
                                value={formData.password}
                                onChange={(e) => handleInputChange('password', e.target.value)}
                                required
                            />
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
                            {isLoading ? 'Ingresando...' : 'Ingresar'}
                        </button>
                    </form>

                    <div className="login-footer">
                        <p>
                            ¿No tienes cuenta?
                            <Link to="/register" className="register-link">Créala Aquí</Link>
                        </p>
                        <a href="#" className="forgot-password">¿Olvidaste tu clave?</a>
                    </div>
                </div>

                <div className="login-info">
                    <h2>Banca digital 100% segura</h2>
                    <div className="security-features">
                        <div className="feature">
                            <div className="feature-icon">🔒</div>
                            <h3>Encriptación Avanzanda</h3>
                            <p>Tus datos están protegidos con la mejor tecnología</p>
                        </div>
                        <div className="feature">
                            <div className="feature-icon">📱</div>
                            <h3>Acceso 24/7</h3>
                            <p>Consulta y opera desde cualquier dispositivo</p>
                        </div>
                        <div className="feature">
                            <div className="feature-icon">⚡</div>
                            <h3>Operaciones instantáneas</h3>
                            <p>Transfiere y paga en tiempo real</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;