import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef(null);

  const openModal = (modalType) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

  // Datos del carrusel
  const features = [
    {
      id: 1,
      title: "Aprendizaje Sin Límites",
      description: "Descarga los cursos y aprende sin necesidad de internet. Perfecto para zonas con conexión limitada.",
      badge: "📱 Offline",
      image: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: 2,
      title: "Contenido Descargable",
      description: "Videos, PDFs y materiales disponibles para descargar. Estudia cuando y donde quieras.",
      badge: "💾 Descargas",
      image: "https://images.unsplash.com/photo-1553877522-43269d4ea984?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: 3,
      title: "Comunidad de Apoyo",
      description: "Conecta con otros estudiantes y comparte recursos incluso cuando estés offline.",
      badge: "👥 Comunidad",
      image: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: 4,
      title: "Progreso Sincronizado",
      description: "Tu avance se guarda localmente y se sincroniza cuando tengas conexión.",
      badge: "🔄 Sincronización",
      image: "https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    },
    {
      id: 5,
      title: "Recursos Gratuitos",
      description: "Accede a biblioteca de recursos, plantillas y herramientas sin costo adicional.",
      badge: "🎓 Gratuito",
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
    }
  ];

  // Navegación del carrusel
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === features.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? features.length - 1 : prev - 1));
  };

  const goToSlide = (index) => {
    setCurrentSlide(index);
  };

  // Auto-play del carrusel
  useEffect(() => {
    const timer = setInterval(() => {
      nextSlide();
    }, 5000);

    return () => clearInterval(timer);
  }, [currentSlide]);

  // Contenido de los modales
  const modalContent = {
    privacidad: {
      title: "Política de Privacidad",
      content: `
        <h3>Respetamos tu privacidad</h3>
        <p>En Campus Digital, nos comprometemos a proteger la privacidad de nuestros usuarios. Esta política explica cómo recopilamos, usamos y protegemos tu información personal.</p>
        
        <h4>Información que recopilamos</h4>
        <ul>
          <li>Datos de registro y perfil</li>
          <li>Información de progreso en cursos</li>
          <li>Datos de interacción con la plataforma</li>
          <li>Información técnica del dispositivo</li>
        </ul>

        <h4>Cómo usamos tu información</h4>
        <ul>
          <li>Personalizar tu experiencia de aprendizaje</li>
          <li>Mejorar nuestros servicios</li>
          <li>Comunicarnos contigo sobre cursos y actualizaciones</li>
          <li>Garantizar la seguridad de la plataforma</li>
        </ul>

        <p><strong>Última actualización:</strong> Enero 2024</p>
      `
    },
    terminos: {
      title: "Términos de Servicio",
      content: `
        <h3>Bienvenido a Campus Digital</h3>
        <p>Al utilizar nuestra plataforma, aceptas cumplir con estos términos de servicio. Por favor, léelos detenidamente.</p>
        
        <h4>Uso de la Plataforma</h4>
        <ul>
          <li>Debes tener al menos 13 años para usar nuestros servicios</li>
          <li>Eres responsable de mantener la confidencialidad de tu cuenta</li>
          <li>No puedes compartir tu cuenta con otras personas</li>
          <li>Debes proporcionar información veraz y actualizada</li>
        </ul>

        <h4>Contenido y Propiedad Intelectual</h4>
        <ul>
          <li>Todo el contenido educativo es propiedad de Campus Digital o sus socios</li>
          <li>No puedes redistribuir, copiar o modificar el contenido sin autorización</li>
          <li>Puedes usar el contenido solo para tu aprendizaje personal</li>
        </ul>

        <h4>Conducta del Usuario</h4>
        <ul>
          <li>Respetar a otros estudiantes e instructores</li>
          <li>No realizar actividades fraudulentas o malintencionadas</li>
          <li>No intentar acceder a áreas restringidas del sistema</li>
        </ul>
      `
    },
    cookies: {
      title: "Política de Cookies",
      content: `
        <h3>Uso de Cookies en Campus Digital</h3>
        <p>Utilizamos cookies y tecnologías similares para mejorar tu experiencia en nuestra plataforma.</p>
        
        <h4>¿Qué son las cookies?</h4>
        <p>Las cookies son pequeños archivos de texto que se almacenan en tu dispositivo cuando visitas nuestro sitio web.</p>

        <h4>Tipos de cookies que utilizamos</h4>
        <ul>
          <li><strong>Cookies esenciales:</strong> Necesarias para el funcionamiento básico del sitio</li>
          <li><strong>Cookies de rendimiento:</strong> Nos ayudan a entender cómo usas la plataforma</li>
          <li><strong>Cookies de funcionalidad:</strong> Recuerdan tus preferencias y configuraciones</li>
          <li><strong>Cookies de marketing:</strong> Para mostrarte contenido relevante</li>
        </ul>

        <h4>Control de cookies</h4>
        <p>Puedes gestionar tus preferencias de cookies en cualquier momento desde la configuración de tu navegador. Sin embargo, algunas funciones pueden no estar disponibles si desactivas las cookies esenciales.</p>

        <p><strong>Al continuar usando nuestra plataforma, aceptas nuestro uso de cookies.</strong></p>
      `
    }
  };

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="hero-gradient"></div>
        </div>
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Educación sin 
              <span className="gradient-text"> límites</span>
              <br />con <span className="campus-text">Campus Digital</span>
            </h1>
            <p className="hero-subtitle">
              Aprende sin depender de internet. Descarga cursos completos, accede a herramientas integradas 
              y continúa tu educación desde cualquier lugar, incluso sin conexión.
            </p>
            <div className="hero-buttons">
              <button 
                className="btn-primary"
                onClick={() => navigate("/courses")}
              >
                Explorar Cursos
                <span className="btn-arrow">→</span>
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate("/register")}
              >
                Crear Cuenta
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card card-1">
              <div className="card-icon">📚</div>
              <h4>Cursos Descargables</h4>
              <p>Estudia sin internet</p>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">🌍</div>
              <h4>Accesible</h4>
              <p>Para todas las regiones</p>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">🎓</div>
              <h4>Gratuito</h4>
              <p>Sin costo adicional</p>
            </div>
            <div className="main-visual">
              <div className="visual-element"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section - Carrusel funcional */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>Educación <span className="campus-text">Accesible</span> para Todos</h2>
            <p>Diseñado pensando en estudiantes con acceso limitado a internet</p>
          </div>
          
          <div className="features-carousel">
            <div className="carousel-container">
              <div 
                className="carousel-track" 
                ref={carouselRef}
                style={{ transform: `translateX(-${currentSlide * 100}%)` }}
              >
                {features.map((feature, index) => (
                  <div key={feature.id} className="feature-slide">
                    <div className="slide-image">
                      <img 
                        src={feature.image} 
                        alt={feature.title}
                        loading="lazy"
                      />
                      <div className="image-overlay"></div>
                    </div>
                    <div className="slide-content">
                      <h3>{feature.title}</h3>
                      <p>{feature.description}</p>
                      <div className="feature-badge">{feature.badge}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            {/* Controles del carrusel */}
            <div className="carousel-controls">
              <button 
                className="carousel-prev" 
                onClick={prevSlide}
                aria-label="Slide anterior"
              >
                ‹
              </button>
              <div className="carousel-dots">
                {features.map((_, index) => (
                  <button
                    key={index}
                    className={`dot ${index === currentSlide ? 'active' : ''}`}
                    onClick={() => goToSlide(index)}
                    aria-label={`Ir al slide ${index + 1}`}
                  />
                ))}
              </div>
              <button 
                className="carousel-next" 
                onClick={nextSlide}
                aria-label="Siguiente slide"
              >
                ›
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <div className="stat-number">10,000+</div>
              <div className="stat-label">Estudiantes</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">500+</div>
              <div className="stat-label">Cursos</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">85%</div>
              <div className="stat-label">Contenido Offline</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">98%</div>
              <div className="stat-label">Satisfacción</div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Comienza tu Aprendizaje Sin Límites</h2>
            <p>Únete a miles de estudiantes que están transformando su educación con Campus Digital</p>
            <div className="cta-buttons">
              <button 
                className="btn-primary large"
                onClick={() => navigate("/register")}
              >
                Crear Cuenta Gratis
              </button>
              <button 
                className="btn-primary large"
                onClick={() => navigate("/courses")}
              >
                Ver Cursos
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Campus Digital</h3>
              <p>Transformando la educación online con tecnología innovadora y contenido accesible para todos.</p>
              <div className="social-links">
                <a href="#" className="social-link">📘</a>
                <a href="#" className="social-link">🐦</a>
                <a href="#" className="social-link">📷</a>
                <a href="#" className="social-link">💼</a>
              </div>
            </div>
            <div className="footer-section">
              <h4>Plataforma</h4>
              <ul>
                <li><a href="/courses">Cursos</a></li>
                <li><a href="/about">Nosotros</a></li>
                <li><a href="/contact">Contacto</a></li>
                <li><a href="/blog">Blog</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Categorías</h4>
              <ul>
                <li><a href="#">Desarrollo Web</a></li>
                <li><a href="#">Data Science</a></li>
                <li><a href="#">Marketing Digital</a></li>
                <li><a href="#">Diseño UX/UI</a></li>
              </ul>
            </div>
            <div className="footer-section">
              <h4>Soporte</h4>
              <ul>
                <li><a href="/help">Centro de Ayuda</a></li>
                <li><a href="/faq">Preguntas Frecuentes</a></li>
                <li><a href="/community">Comunidad</a></li>
                <li><a href="/download">Descargar App</a></li>
              </ul>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Campus Digital. Todos los derechos reservados.</p>
            <div className="footer-links">
              <button 
                className="footer-link-btn"
                onClick={() => openModal('privacidad')}
              >
                Privacidad
              </button>
              <button 
                className="footer-link-btn"
                onClick={() => openModal('terminos')}
              >
                Términos
              </button>
              <button 
                className="footer-link-btn"
                onClick={() => openModal('cookies')}
              >
                Cookies
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Modal */}
      {activeModal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{modalContent[activeModal].title}</h2>
              <button className="modal-close" onClick={closeModal}>×</button>
            </div>
            <div 
              className="modal-body"
              dangerouslySetInnerHTML={{ __html: modalContent[activeModal].content }}
            />
            <div className="modal-footer">
              <button className="btn-primary" onClick={closeModal}>
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}