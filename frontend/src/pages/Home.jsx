import React from "react";
import { Link } from "react-router-dom";
import "./Home.css";

export default function Home() {
  // saludo dinámico por hora
  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  return (
    <main className="home">
      <section className="hero">
        <div className="hero__content">
          <p className="hero__kicker">{saludo} 👋</p>
          <h1 className="hero__title">
            Aprende a tu ritmo, incluso <span className="accent">sin conexión</span>
          </h1>
          <p className="hero__desc">
            Descarga videos/PDFs, avanza offline y sincroniza tu progreso cuando vuelvas a tener internet.
          </p>

          <div className="hero__cta">
            <Link to="/courses" className="btn btn--primary">Ver catálogo</Link>
            <Link to="/login" className="btn btn--ghost">Iniciar sesión</Link>
          </div>
        </div>

        <div className="hero__image" aria-hidden>
          {/* Puedes cambiar por una imagen real */}
          <img src="https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=1200&auto=format&fit=crop" alt="Estudiar" />
        </div>
      </section>

      <section className="features">
        <h2>¿Por qué esta plataforma?</h2>
        <div className="features__grid">
          <article className="card">
            <h3>Offline-first</h3>
            <p>Descarga contenidos y sigue aprendiendo sin internet. La app sincroniza automáticamente tus cambios.</p>
          </article>
          <article className="card">
            <h3>Progreso y gamificación</h3>
            <p>Gana puntos e insignias por completar unidades. Lleva tu barra de progreso siempre visible.</p>
          </article>
          <article className="card">
            <h3>Profesores verificados</h3>
            <p>Flujo de verificación por correo para garantizar calidad del contenido.</p>
          </article>
          <article className="card">
            <h3>Apoyos en YouTube</h3>
            <p>Los profesores pueden añadir enlaces de apoyo y materiales integrados.</p>
          </article>
        </div>
      </section>
    </main>
  );
}
