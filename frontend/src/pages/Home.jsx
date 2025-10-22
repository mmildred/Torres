import React from "react";
import { Link } from "react-router-dom";
import { getUser } from "../auth";
import "./Home.css";

export default function Home() {
  const user = getUser();
  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <main className="home">
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-text">
            <p className="hero-greeting">{saludo}</p>
            <h1 className="hero-title">
              Educación que se adapta a <span className="text-gradient">tu ritmo</span>
            </h1>
            <p className="hero-description">
              Accede a cursos especializados, descarga contenido para aprender sin conexión 
              y sincroniza tu progreso cuando vuelvas a tener internet.
            </p>
            
            <div className="hero-actions">
              {user ? (
                <Link to="/courses" className="btn btn-primary">
                  Explorar Cursos
                </Link>
              ) : (
                <>
                  <Link to="/register" className="btn btn-primary">
                    Comenzar Ahora
                  </Link>
                  <Link to="/login" className="btn btn-secondary">
                    Iniciar Sesión
                  </Link>
                </>
              )}
            </div>

            <div className="hero-stats">
              <div className="stat">
                <span className="stat-number">100+</span>
                <span className="stat-label">Cursos</span>
              </div>
              <div className="stat">
                <span className="stat-number">5K+</span>
                <span className="stat-label">Estudiantes</span>
              </div>
              <div className="stat">
                <span className="stat-number">98%</span>
                <span className="stat-label">Satisfacción</span>
              </div>
            </div>
          </div>

          <div className="hero-visual">
            <div className="floating-card card-1">
              <div className="card-icon">📚</div>
              <h4>Aprendizaje Continuo</h4>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">⚡</div>
              <h4>Acceso Offline</h4>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">🎯</div>
              <h4>Enfoque Práctico</h4>
            </div>
            <div className="main-visual">
              <div className="visual-content">
                <div className="screen"></div>
                <div className="progress-bar"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features">
        <div className="container">
          <div className="section-header">
            <h2>Desarrolla tus habilidades con nosotros</h2>
            <p>Una plataforma diseñada para el aprendizaje moderno</p>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">📱</div>
              <h3>Aprendizaje Offline</h3>
              <p>Descarga cursos completos y continúa aprendiendo sin importar tu conexión a internet.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🎮</div>
              <h3>Gamificación</h3>
              <p>Gana puntos, insignias y sube de nivel mientras completas tus objetivos de aprendizaje.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">👨‍🏫</div>
              <h3>Instructores Verificados</h3>
              <p>Aprende de profesionales certificados con experiencia comprobada en su campo.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🔗</div>
              <h3>Recursos Integrados</h3>
              <p>Accede a materiales complementarios y enlaces de apoyo directamente en cada curso.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Seguimiento de Progreso</h3>
              <p>Monitorea tu avance con métricas detalladas y recomendaciones personalizadas.</p>
            </div>

            <div className="feature-card">
              <div className="feature-icon">🤝</div>
              <h3>Comunidad Activa</h3>
              <p>Conecta con otros estudiantes y comparte conocimientos en foros especializados.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>¿Listo para comenzar tu viaje de aprendizaje?</h2>
            <p>Únete a miles de estudiantes que ya están desarrollando sus habilidades con nosotros.</p>
            {!user && (
              <div className="cta-actions">
                <Link to="/register" className="btn btn-primary btn-large">
                  Crear Cuenta Gratis
                </Link>
                <Link to="/courses" className="btn btn-secondary btn-large">
                  Explorar Cursos
                </Link>
              </div>
            )}
            {user && (
              <div className="cta-actions">
                <Link to="/courses" className="btn btn-primary btn-large">
                  Continuar Aprendiendo
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}