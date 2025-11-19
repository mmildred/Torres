import React, { useState, useEffect } from "react";
import { Link, useSearchParams } from "react-router-dom";
import api from "../api";
import { saveAuth } from "../auth";
import "./register.css";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [inviteRole, setInviteRole] = useState(""); 
  const [msg, setMsg] = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [loading, setLoading] = useState(false);
  const [verifyingCode, setVerifyingCode] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({
    hasMinLength: false,
    hasUpperCase: false,
    hasSpecialChar: false,
    isValid: false
  });
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const code = searchParams.get('inviteCode');
    if (code) {
      setInviteCode(code);
      verifyInviteCode(code);
    }
  }, [searchParams]);

  const verifyInviteCode = async (code) => {
    setVerifyingCode(true);
    try {
      const response = await api.get(`/auth/invite-codes/verify/${code}`);
      if (response.data.valid) {
        setInviteRole(response.data.role); // 'teacher' o 'admin'
        setMsg(`✅ Código válido para ${response.data.role === 'admin' ? 'administrador' : 'profesor'}`);
      } else {
        setMsg(`❌ ${response.data.message}`);
        setInviteCode(""); 
      }
    } catch (error) {
      setMsg(" Error verificando código de invitación");
      setInviteCode("");
    } finally {
      setVerifyingCode(false);
    }
  };

  useEffect(() => {
    const hasMinLength = password.length >= 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasSpecialChar = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password);
    
    setPasswordStrength({
      hasMinLength,
      hasUpperCase,
      hasSpecialChar,
      isValid: hasMinLength && hasUpperCase && hasSpecialChar
    });
  }, [password]);

  async function submit(e) {
    e.preventDefault();
    setMsg("");

    if (!name || !email || !password) {
      setMsg("Por favor completa todos los campos.");
      return;
    }

    if (name.trim().length < 2) {
      setMsg("El nombre debe tener al menos 2 caracteres.");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setMsg("Por favor ingresa un correo electrónico válido.");
      return;
    }

    if (!passwordStrength.isValid) {
      setMsg("La contraseña no cumple con los requisitos de seguridad.");
      return;
    }

    if (inviteCode && !inviteRole) {
      setMsg("Por favor verifica que el código de invitación sea válido.");
      return;
    }

    try {
      setLoading(true);
      
      let endpoint = "/auth/register";
      let payload = { name, email, password };
      
      if (inviteCode) {
        endpoint = "/auth/register-with-invite";
        payload = { ...payload, inviteCode };
      }

      const res = await api.post(endpoint, payload);
      saveAuth(res.data.token, res.data.user);
      
      const roleMessage = inviteRole === 'admin' 
        ? "¡Bienvenido/a Administrador/a!" 
        : inviteRole === 'teacher' 
          ? "¡Bienvenido/a Profesor/a!" 
          : "¡Bienvenido/a!";
      
      setMsg(`${roleMessage} Redirigiendo...`);
      
      setTimeout(() => {
        location.href = "/courses";
      }, 1500);
      
    } catch (err) {
      setMsg(err?.response?.data?.message || "Error de registro");
    } finally {
      setLoading(false);
    }
  }

  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  const getRoleInfo = () => {
    if (inviteRole === 'admin') {
      return {
        title: "Únete como Administrador",
        description: "Completa tu registro como administrador con el código de invitación.",
        badgeText: " Registro de Administrador",
        buttonText: "Registrarme como Administrador"
      };
    } else if (inviteRole === 'teacher') {
      return {
        title: "Únete como Profesor",
        description: "Completa tu registro como profesor con el código de invitación.",
        badgeText: " Registro de Profesor", 
        buttonText: "Registrarme como Profesor"
      };
    } else {
      return {
        title: "Crea tu cuenta y aprende",
        description: "Comienza tu journey de aprendizaje con acceso offline y seguimiento de progreso.",
        badgeText: "",
        buttonText: "Crear mi cuenta"
      };
    }
  };

  const roleInfo = getRoleInfo();

  return (
    <main className="register-page">
      {/* Hero Section */}
      <section className="register-hero">
        <div className="container">
          <div className="register-hero-content">
            <div className="register-hero-text">
              <p className="register-greeting">{saludo}</p>
              <h1 className="register-title">
                {roleInfo.title.includes("Administrador") || roleInfo.title.includes("Profesor") ? (
                  <>
                    {roleInfo.title.split(" ")[0]} <span className="text-gradient">{roleInfo.title.split(" ").slice(1).join(" ")}</span>
                  </>
                ) : (
                  <>
                    Crea tu cuenta y <span className="text-gradient">aprende</span>
                  </>
                )}
              </h1>
              <p className="register-description">
                {roleInfo.description}
              </p>

              {/* Stats Mini */}
              <div className="register-stats">
                <div className="register-stat">
                  <span className="stat-number">100+</span>
                  <span className="stat-label">Cursos</span>
                </div>
                <div className="register-stat">
                  <span className="stat-number">5K+</span>
                  <span className="stat-label">Estudiantes</span>
                </div>
                <div className="register-stat">
                  <span className="stat-number">98%</span>
                  <span className="stat-label">Satisfacción</span>
                </div>
              </div>
            </div>

            {/* Form Card */}
            <div className="register-form-card">
              <div className="form-card-header">
                <h2 className="form-card-title">
                  {inviteCode ? roleInfo.badgeText : "Crear Cuenta"}
                </h2>
                <p className="form-card-subtitle">
                  {inviteCode 
                    ? "Completa tu registro con el código de invitación"
                    : "Comienza tu adventure de aprendizaje"
                  }
                </p>
                
                {/* Mostrar código de invitación si existe */}
                {inviteCode && (
                  <div className={`invite-badge ${inviteRole === 'admin' ? 'admin-badge' : 'teacher-badge'}`}>
                    <span className="badge-icon">
                      {inviteRole === 'admin' ? '👑' : '👨‍🏫'}
                    </span>
                    Código: {inviteCode}
                    {verifyingCode && " (Verificando...)"}
                  </div>
                )}
              </div>

              {msg && (
                <div className={`alert ${msg.includes('✅') ? 'success-alert' : 'error-alert'}`}>
                  <span className="alert-icon">
                    {msg.includes('✅') ? '' : '⚠️'}
                  </span>
                  {msg}
                </div>
              )}

              <form className="register-form" onSubmit={submit}>
                <div className="form-group">
                  <label htmlFor="name" className="form-label">
                    Nombre completo
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="form-input"
                    placeholder="Tu nombre completo"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    minLength="2"
                    required
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="email" className="form-label">
                    Correo electrónico
                  </label>
                  <input
                    id="email"
                    type="email"
                    className="form-input"
                    placeholder="tucorreo@ejemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    pattern="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
                    required
                  />
                  <div className="input-hint">
                    Ejemplo: usuario@gmail.com
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="password" className="form-label">
                    Contraseña segura
                  </label>
                  <div className="password-input-wrapper">
                    <input
                      id="password"
                      type={showPwd ? "text" : "password"}
                      className="form-input"
                      placeholder="Mínimo 8 caracteres con mayúscula y especial"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength="8"
                      required
                    />
                    <button
                      type="button"
                      className="password-toggle"
                      onClick={() => setShowPwd(!showPwd)}
                    >
                      {showPwd ? "🙈" : "👁️"}
                    </button>
                  </div>
                  
                  {/* ✅ Indicador de fortaleza de contraseña */}
                  <div className="password-strength">
                    <div className="strength-title">Requisitos de seguridad:</div>
                    <div className={`strength-rule ${passwordStrength.hasMinLength ? 'valid' : 'invalid'}`}>
                      <span className="rule-icon">
                        {passwordStrength.hasMinLength ? '✅' : '⭕'}
                      </span>
                      Mínimo 8 caracteres
                    </div>
                    <div className={`strength-rule ${passwordStrength.hasUpperCase ? 'valid' : 'invalid'}`}>
                      <span className="rule-icon">
                        {passwordStrength.hasUpperCase ? '✅' : '⭕'}
                      </span>
                      Al menos 1 mayúscula
                    </div>
                    <div className={`strength-rule ${passwordStrength.hasSpecialChar ? 'valid' : 'invalid'}`}>
                      <span className="rule-icon">
                        {passwordStrength.hasSpecialChar ? '✅' : '⭕'}
                      </span>
                      Al menos 1 carácter especial (!@#$%^&*)
                    </div>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className={`submit-btn ${loading ? 'loading' : ''} ${(!passwordStrength.isValid || (inviteCode && !inviteRole)) ? 'btn-disabled' : ''}`}
                  disabled={loading || !passwordStrength.isValid || (inviteCode && !inviteRole)}
                >
                  {loading 
                    ? (inviteCode 
                        ? `Registrando ${inviteRole === 'admin' ? 'administrador' : 'profesor'}...` 
                        : "Creando cuenta..."
                      ) 
                    : roleInfo.buttonText
                  }
                </button>

                <div className="form-footer">
                  <p className="login-prompt">
                    ¿Ya tienes cuenta? <Link to="/login" className="login-link">Inicia sesión aquí</Link>
                  </p>
                  <Link to="/courses" className="secondary-link">
                    Explorar cursos disponibles
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Features Mini Section */}
      <section className="register-features">
        <div className="container">
          <div className="features-grid">
            <div className="feature-mini">
              <div className="feature-icon">📱</div>
              <h4>Aprendizaje Offline</h4>
              <p>Descarga cursos y continúa aprendiendo sin conexión</p>
            </div>
            <div className="feature-mini">
              <div className="feature-icon">📊</div>
              <h4>Seguimiento de Progreso</h4>
              <p>Monitorea tu avance con métricas detalladas</p>
            </div>
            <div className="feature-mini">
              <div className="feature-icon">🎯</div>
              <h4>Enfoque Práctico</h4>
              <p>Aprende con ejercicios y proyectos reales</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}