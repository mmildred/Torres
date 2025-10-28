import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Home.css";

export default function Home() {
  const navigate = useNavigate();
  const [activeModal, setActiveModal] = useState(null);

  const openModal = (modalType) => {
    setActiveModal(modalType);
  };

  const closeModal = () => {
    setActiveModal(null);
  };

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
              Transforma tu 
              <span className="gradient-text"> aprendizaje</span>
              <br />con <span className="campus-text">Campus Digital</span>
            </h1>
            <p className="hero-subtitle">
              Descubre una plataforma educativa diseñada para impulsar 
              tu carrera. Cursos especializados, instructores expertos 
              y una experiencia de aprendizaje única.
            </p>
            <div className="hero-buttons">
              <button 
                className="btn-primary"
                onClick={() => navigate("/courses")}
              >
                Explorar Cursos
              </button>
              <button 
                className="btn-secondary"
                onClick={() => navigate("/about")}
              >
                Conocer Más
              </button>
            </div>
          </div>
          <div className="hero-visual">
            <div className="floating-card card-1">
              <div className="card-icon">🎓</div>
              <h4>Aprendizaje Continuo</h4>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">⚡</div>
              <h4>Contenido Actualizado</h4>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">👨‍💻</div>
              <h4>Proyectos Reales</h4>
            </div>
            <div className="main-visual">
              <div className="visual-gradient"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header">
            <h2>¿Por qué elegir <span className="campus-text">Campus Digital</span>?</h2>
            <p>Descubre las ventajas que nos hacen diferentes</p>
          </div>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-wrapper">
                  🎯
                </div>
              </div>
              <h3>Enfoque Práctico</h3>
              <p>Aprende haciendo con proyectos reales que fortalecen tus habilidades y preparan para el mercado laboral.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-wrapper">
                  📚
                </div>
              </div>
              <h3>Contenido Exclusivo</h3>
              <p>Accede a material actualizado constantemente, creado por profesionales líderes en la industria.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-wrapper">
                  👥
                </div>
              </div>
              <h3>Comunidad Activa</h3>
              <p>Conecta con otros estudiantes, comparte conocimientos y resuelve dudas en tiempo real.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">
                <div className="icon-wrapper">
                  🚀
                </div>
              </div>
              <h3>Aprendizaje Flexible</h3>
              <p>Estudia a tu ritmo, desde cualquier dispositivo y en el horario que mejor te convenga.</p>
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
              <div className="stat-number">200+</div>
              <div className="stat-label">Instructores</div>
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
            <h2>¿Listo para comenzar tu journey en <span className="campus-text">Campus Digital</span>?</h2>
            <p>Únete a miles de estudiantes que ya están transformando sus carreras</p>
            <button 
              className="btn-primary large"
              onClick={() => navigate("/courses")}
            >
              Comenzar Ahora
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h3>Campus Digital</h3>
              <p>Transformando la educación online con tecnología de punta y contenido de calidad.</p>
              <div className="social-links">
                <a href="#" className="social-link">📘</a>
                <a href="#" className="social-link">🐦</a>
                <a href="#" className="social-link">📷</a>
                <a href="#" className="social-link">💼</a>
              </div>
            </div>
            <div className="footer-section">
              <h4>Enlaces Rápidos</h4>
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
              <h4>Contacto</h4>
              <ul>
                <li>📧 info@campusdigital.com</li>
                <li>📞 +1 (555) 123-4567</li>
                <li>📍 Ciudad de México, MX</li>
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