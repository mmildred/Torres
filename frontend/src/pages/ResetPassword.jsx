import React, { useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import './ResetPassword.css';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    token: searchParams.get('token') || '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage('Las contraseñas no coinciden');
      return;
    }

    if (formData.newPassword.length < 6) {
      setMessage('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (!formData.token) {
      setMessage('Token de recuperación no válido');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const response = await fetch('http://localhost:4000/auth/password-reset/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: formData.token,
          newPassword: formData.newPassword
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage('✅ Contraseña restablecida exitosamente');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else {
        setMessage(data.message || 'Error al restablecer la contraseña');
      }
    } catch (error) {
      setMessage('Error de conexión. Intenta nuevamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="reset-password">
      {/* Hero Section */}
      <section className="reset-hero">
        <div className="container">
          <div className="reset-hero-content">
            <div className="reset-hero-text">
              <h1 className="reset-title">
                Nueva <span className="text-gradient">Contraseña</span>
              </h1>
              <p className="reset-description">
                Crea una nueva contraseña segura para tu cuenta. 
                Asegúrate de que sea diferente a las anteriores.
              </p>
            </div>

            <div className="reset-hero-visual">
              <div className="reset-floating-card card-1">
                <div className="reset-card-icon">🔒</div>
                <h4>Segura</h4>
              </div>
              <div className="reset-floating-card card-2">
                <div className="reset-card-icon">🔄</div>
                <h4>Actualizada</h4>
              </div>
              <div className="reset-floating-card card-3">
                <div className="reset-card-icon">✅</div>
                <h4>Confirmada</h4>
              </div>
              <div className="reset-main-visual">
                <div className="reset-visual-content">
                  <div className="reset-screen"></div>
                  <div className="reset-progress-bar"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Form Section */}
      <section className="reset-form-section">
        <div className="container">
          <div className="reset-form-container">
            <div className="reset-form-card">
              {message && (
                <div className={`reset-message ${message.includes('éxito') ? 'success' : 'error'}`}>
                  {message}
                </div>
              )}

              <form onSubmit={handleSubmit} className="reset-form">
                <div className="form-group">
                  <label htmlFor="newPassword">Nueva Contraseña</label>
                  <input
                    type="password"
                    id="newPassword"
                    value={formData.newPassword}
                    onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                    required
                    minLength="6"
                    placeholder="Mínimo 6 caracteres"
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="confirmPassword">Confirmar Contraseña</label>
                  <input
                    type="password"
                    id="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                    required
                    placeholder="Repite tu contraseña"
                    className="form-input"
                  />
                </div>

                <button 
                  type="submit" 
                  className="btn btn-primary reset-btn"
                  disabled={loading}
                >
                  {loading ? 'Restableciendo...' : 'Restablecer Contraseña'}
                </button>
              </form>

              <div className="reset-footer">
                <p>
                  <Link to="/login" className="reset-link">Volver al inicio de sesión</Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}