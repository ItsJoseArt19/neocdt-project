import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { Toaster } from 'react-hot-toast';
import HeaderFixed from "./components/HeaderFixed";
import Toast from "./components/Toast";
import Home from './pages/Home.jsx';
import Login from './pages/Login.jsx';
import Register from './pages/Register.jsx';
import Dashboard from './pages/Dashboard.jsx';
import CreateCDT from './pages/CreateCDT.jsx';
import CDTSimulator from './pages/CDTSimulator.jsx';
import UserProfile from './pages/UserProfile.jsx';
import CDTDetails from './pages/CDTDetails.jsx';
import AccountStatement from './pages/AccountStatement.jsx';
import CanalesAtencion from './pages/CanalesAtencion.jsx';
import Transparencia from './pages/Transparencia.jsx';
import AdminPanel from './pages/AdminPanel.jsx';

function AppContent() {
    const location = useLocation();
    const [toast, setToast] = useState(null);

    useEffect(() => {
        // Verificar si hay un mensaje en el estado de navegación
        if (location.state?.message) {
            setToast({
                message: location.state.message,
                type: location.state.type || 'success'
            });

            // Limpiar el estado de navegación
            window.history.replaceState({}, document.title);
        }
    }, [location]);

    return (
        <>
            <HeaderFixed />
            <Toaster 
                position="top-right"
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: '#363636',
                        color: '#fff',
                    },
                    success: {
                        duration: 3000,
                        iconTheme: {
                            primary: '#27ae60',
                            secondary: '#fff',
                        },
                    },
                    error: {
                        duration: 4000,
                        iconTheme: {
                            primary: '#e74c3c',
                            secondary: '#fff',
                        },
                    },
                }}
            />
            {toast && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    onClose={() => setToast(null)}
                />
            )}
            <Routes>
                {/* Pagina principal */}
                <Route path="/" element={<Home />} />
                
                {/* Autenticación */}
                <Route path="/login" element={<Login />} />
                <Route path="/register" element={<Register />} />
                
                {/* Área de Usuario */}
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/perfil" element={<UserProfile />} />
                
                {/* Gestion de CDTs */}
                <Route path="/crear-cdt" element={<CreateCDT />} />
                <Route path="/simular-cdt" element={<CDTSimulator />} />
                <Route path="/cdt/:id" element={<CDTDetails />} />
                
                {/* Panel de Administración */}
                <Route path="/admin/solicitudes" element={<AdminPanel />} />
                
                <Route path="/estado-cuenta" element={<AccountStatement />} />
                <Route path="/canales" element={<CanalesAtencion />} />
                <Route path="/transparencia" element={<Transparencia />} />
            </Routes>
        </>
    );
}

function App() {
    return (
        <Router>
            <AppContent />
        </Router>
    );
}

export default App;