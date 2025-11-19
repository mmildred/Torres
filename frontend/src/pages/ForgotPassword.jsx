  import React, { useState } from 'react';
  import { Link } from 'react-router-dom';
  import './ForgotPassword.css';

  export default function ForgotPassword() {
    console.log('🔍 ForgotPassword component is rendering');
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setLoading(true);
      setMessage('');

      try {
        const response = await fetch('http://localhost:4000/auth/password-reset/forgot-password', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ email })
        });

        const data = await response.json();

        if (response.ok) {
          setMessage('Si el email existe, recibirás un código de recuperación en tu correo.');
        } else {
          setMessage(data.message || 'Error al enviar el código');
        }
      } catch (error) {
        setMessage('Error de conexión. Intenta nuevamente.');
      } finally {
        setLoading(false);
      }
    };

    return (
      <main className="forgot-password">
        {/* Hero Section Mejorada */}
        <section className="forgot-hero">
          <div className="container">
            <div className="forgot-hero-content">
              <div className="forgot-hero-text">
                <h1 className="forgot-title">
                  Recupera tu <span className="text-gradient">Contraseña</span>
                </h1>
                <p className="forgot-description">
                  Te enviaremos un código de recuperación a tu correo electrónico 
                  para que puedas restablecer tu contraseña de forma segura.
                </p>
              </div>

              <div className="forgot-hero-visual">
                <div className="forgot-floating-card card-1">
                  <div className="forgot-card-icon">🔐</div>
                  <h4>Seguro</h4>
                </div>
                <div className="forgot-floating-card card-2">
                  <div className="forgot-card-icon">📧</div>
                  <h4>Rápido</h4>
                </div>
                <div className="forgot-floating-card card-3">
                  <div className="forgot-card-icon">⚡</div>
                  <h4>Fácil</h4>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Form Section Mejorada */}
        <section className="forgot-form-section">
          <div className="container">
            <div className="forgot-form-container">
              <div className="forgot-form-card">
                {/* Header del Formulario */}
                <div className="forgot-form-header">
                  <h2>Ingresa tu Email</h2>
                  <p>Recibirás un código de recuperación en tu correo</p>
                </div>

                {/* Mensaje de información */}
                <div className="forgot-info-message">
                  <p>Si el email existe, recibirás un código de recuperación en tu correo.</p>
                </div>

                {message && (
                  <div className={`forgot-message ${message.includes('éxito') || message.includes('existe') ? 'success' : 'error'}`}>
                    {message}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="forgot-form">
                  <div className="form-group">
                    <label htmlFor="email">Correo Electrónico</label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="tu@email.com"
                      className="form-input"
                    />
                  </div>

                  <button 
                    type="submit" 
                    className="btn btn-primary forgot-btn"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="loading-spinner"></span>
                        Enviando Código...
                      </>
                    ) : (
                      'Enviar Código de Recuperación'
                    )}
                  </button>
                </form>

                {/* Links de navegación mejorados */}
                <div className="forgot-footer">
                  <div className="forgot-link-item">
                    <span>¿Recordaste tu contraseña?</span>
                    <Link to="/login" className="forgot-link">Iniciar Sesión</Link>
                  </div>
                  <div className="forgot-link-item">
                    <span>¿No tienes cuenta?</span>
                    <Link to="/register" className="forgot-link">Regístrate</Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    );
  }