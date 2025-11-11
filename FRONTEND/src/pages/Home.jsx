// =========================================
// HOME.JSX - PÁGINA PRINCIPAL DE NEOBANK
// =========================================
// Esta página presenta:
// - Carrusel rotativo con servicios principales
// - Información sobre CDTs y productos bancarios
// - Call-to-actions para registro y simulación
// - Navegación automática con controles manuales

import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Home = () => {
    // ===== ESTADOS DEL CARRUSEL =====
    const [currentSlide, setCurrentSlide] = useState(0); // Slide actual
    const [isPaused, setIsPaused] = useState(false); // Control de pausa automática
    const [isLayoutReady, setIsLayoutReady] = useState(false); // Estado para controlar el layout

    // ===== FORZAR LAYOUT CORRECTO AL MONTAR =====
    useEffect(() => {
        // Forzar reflow del navegador para evitar el espacio en blanco
        const forceReflow = () => {
            // Trigger reflow
            document.body.offsetHeight;
            window.scrollTo(0, 0);
            setIsLayoutReady(true);
        };

        // Ejecutar inmediatamente y después de un pequeño delay
        forceReflow();
        const timer = setTimeout(forceReflow, 50);
        
        return () => clearTimeout(timer);
    }, []);

    // ===== CONFIGURACIÓN DE SLIDES =====
    const slides = [
        {
            id: 1,
            title: "Bienvenido a NeoBank",
            subtitle: "Tu banco 100% digital en LATAM",
            description: "NeoBank ofrece cuentas de ahorro, pagos y CDTs. El producto NeoCDT permite a los clientes abrir CDTs de forma digital, consultar su estado y gestionar renovaciones.",
            buttonText: "Comienza ahora",
            buttonLink: "/register",
            background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
            icon: "🏛️"
        },
        {
            id: 2,
            title: "CDTs con Excelente Rentabilidad",
            subtitle: "Invierte desde $500,000",
            description: "Obtén hasta 9.5% EA en nuestros CDTs. Plazo desde 30 hasta 360 días. Renovación automática opcional y sin comisiones de administración.",
            buttonText: "Simular CDT",
            buttonLink: "/simular-cdt",
            background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
            icon: "📈"
        },
        {
            id: 3,
            title: "Cuenta de Ahorros Gratuita",
            subtitle: "Sin cuota de manejo",
            description: "Abre tu cuenta de ahorros con $0 de costo. Transfiere gratis, deposita desde cualquier lugar y maneja tu dinero 100% digital.",
            buttonText: "Abrir cuenta",
            buttonLink: "/register",
            background: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
            icon: "💰"
        },
        {
            id: 4,
            title: "Paga Todo desde tu Celular",
            subtitle: "Servicios y tarjetas",
            description: "Paga tus tarjetas de crédito, servicios públicos y créditos. Todo desde la app, sin filas, sin papeles, disponible 24/7.",
            buttonText: "Conoce más",
            buttonLink: "/register",
            background: "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
            icon: "📱"
        }
    ];

    // Auto-rotate slides
    useEffect(() => {
        if (!isPaused) {
            const interval = setInterval(() => {
                setCurrentSlide((prev) => {
                    return prev === slides.length - 1 ? 0 : prev + 1;
                });
            }, 4000);

            return () => clearInterval(interval);
        }
    }, [slides.length, isPaused]);

    // ===== FUNCIONES DE NAVEGACIÓN DEL CARRUSEL =====
    const goToSlide = (index) => {
        // Ir a slide específico
        setCurrentSlide(index);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 5000); // Reanudar después de 5s
    };

    const goToPrevious = () => {
        // Slide anterior
        setCurrentSlide((prev) => prev === 0 ? slides.length - 1 : prev - 1);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 5000);
    };

    const goToNext = () => {
        // Slide siguiente
        setCurrentSlide((prev) => prev === slides.length - 1 ? 0 : prev + 1);
        setIsPaused(true);
        setTimeout(() => setIsPaused(false), 5000);
    };

    return (
        <div className={`home-container ${isLayoutReady ? 'layout-ready' : ''}`}>
            {/* ===== CARRUSEL PRINCIPAL ===== */}
            <div className="hero-carousel">
                <section 
                    className="carousel-container"
                    onMouseEnter={() => setIsPaused(true)} // Pausar al hover
                    onMouseLeave={() => setIsPaused(false)} // Reanudar al salir
                    aria-label="Carrusel de productos NeoBank"
                >
                    {slides.map((slide, index) => (
                        <div 
                            key={slide.id}
                            className={`carousel-slide ${index === currentSlide ? 'active' : ''}`}
                            style={{ background: slide.background }}
                        >
                            <div className="slide-content">
                                <div className="slide-icon">{slide.icon}</div>
                                <h1>{slide.title}</h1>
                                <h2>{slide.subtitle}</h2>
                                <p>{slide.description}</p>
                                <Link to={slide.buttonLink} className="cta-button">
                                    {slide.buttonText}
                                </Link>
                            </div>
                        </div>
                    ))}
                    
                    {/* Navigation arrows */}
                    <button className="carousel-arrow prev" onClick={goToPrevious}>
                        ‹
                    </button>
                    <button className="carousel-arrow next" onClick={goToNext}>
                        ›
                    </button>
                    
                    {/* Dots indicator */}
                    <div className="carousel-dots">
                        {slides.map((slide, index) => (
                            <button
                                key={`dot-${slide.id}`}
                                className={`dot ${index === currentSlide ? 'active' : ''}`}
                                onClick={() => goToSlide(index)}
                            />
                        ))}
                    </div>
                </section>
            </div>
            
            <div className="features">
                <div className="features-container">
                    <h2>¿Por qué elegir NeoBank?</h2>
                    <div className="features-grid">
                        <div className="feature-item">
                            <div className="feature-icon">🔒</div>
                            <h3>100% Seguro</h3>
                            <p>Respaldado por Fogafín. Tus depósitos están protegidos hasta $50 millones.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">⚡</div>
                            <h3>Rápido y Digital</h3>
                            <p>Abre productos en minutos. Todo desde tu celular, sin papeleos.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">💸</div>
                            <h3>Sin Comisiones</h3>
                            <p>Cuenta gratis, transferencias sin costo y CDTs sin comisión de administración.</p>
                        </div>
                        <div className="feature-item">
                            <div className="feature-icon">📞</div>
                            <h3>Soporte 24/7</h3>
                            <p>Atención personalizada todos los días del año. Estamos aquí para ayudarte.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="cta-section">
                <div className="cta-container">
                    <h2>¿Listo para ser parte de NeoBank?</h2>
                    <p>Únete a miles de colombianos que ya confían en nosotros</p>
                    <div className="cta-buttons">
                        <Link to="/register" className="btn btn-primary large">
                            Crear cuenta gratis
                        </Link>
                        <Link to="/simular-cdt" className="btn btn-outline large">
                            Simular CDT
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Home;