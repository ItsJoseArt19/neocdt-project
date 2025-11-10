import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HeaderFixed from "./components/HeaderFixed";
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

import "./styles/main-new.css";

function App() {
    return (
        <Router>
            <HeaderFixed />
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
                
                <Route path="/estado-cuenta" element={<AccountStatement />} />
                <Route path="/canales" element={<CanalesAtencion />} />
                <Route path="/transparencia" element={<Transparencia />} />
            </Routes>
        </Router>
    );
}

export default App;