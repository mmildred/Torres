// src/App.jsx
import React, { useEffect, useState, useRef } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { getUser, logout } from "./auth";
import "./AppHeader.css";

export default function App() {
  const navigate = useNavigate();
  const user = getUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
    setMenuOpen(false);
  };

  return (
    <div className="app-container">
      <header className={`header ${scrolled ? "scrolled" : ""}`} role="banner">
        <div className="header-content">
          {/* Logo */}
          <NavLink to={user ? "/courses" : "/"} className="logo-link" aria-label="Ir al inicio">
            <div className="logo">
              <img 
                src="/logo.png" 
                alt="Campus Digital" 
                className="logo-image"
              />
            </div>
          </NavLink>

          {/* Navegación */}
          <nav className="nav" aria-label="Navegación principal">
            {/* Controles del usuario */}
            <div className="nav-controls">
              {/* Botón de cursos siempre visible */}
              <NavLink 
                to="/courses" 
                className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
              >
                Cursos
              </NavLink>

              {user ? (
                // Usuario logueado
                <div className="user-menu-container" ref={menuRef}>
                  <button 
                    onClick={() => setMenuOpen(!menuOpen)} 
                    className={`user-button ${menuOpen ? "open" : ""}`}
                    aria-haspopup="menu" 
                    aria-expanded={menuOpen}
                  >
                    <div className="user-avatar">
                      {user.name?.charAt(0)?.toUpperCase() || "U"}
                    </div>
                    <span className="user-name">{user.name ?? "Usuario"}</span>
                    <span className="dropdown-arrow">▼</span>
                  </button>

                  {menuOpen && (
                    <div className="dropdown-menu" role="menu">
                      <div className="user-info">
                        <div className="user-welcome">Hola, {user.name}</div>
                        <div className="user-role">
                          <span className={`role-badge ${user.role}`}>
                            {user.role === "admin" ? "Administrador" : "Estudiante"}
                          </span>
                        </div>
                      </div>
                      
                      <div className="menu-divider"></div>
                      
                      {user.role === "admin" && (
                        <NavLink 
                          to="/admin" 
                          role="menuitem" 
                          className="menu-item"
                          onClick={() => setMenuOpen(false)}
                        >
                          Panel de Admin
                        </NavLink>
                      )}
                      
                      <NavLink 
                        to="/profile" 
                        role="menuitem" 
                        className="menu-item"
                        onClick={() => setMenuOpen(false)}
                      >
                        Mi Perfil
                      </NavLink>
                      
                      <NavLink 
                        to="/my-courses" 
                        role="menuitem" 
                        className="menu-item"
                        onClick={() => setMenuOpen(false)}
                      >
                        Mis Cursos
                      </NavLink>
                      
                      <div className="menu-divider"></div>
                      
                      <button 
                        role="menuitem" 
                        onClick={handleLogout} 
                        className="menu-item logout-button"
                      >
                        Cerrar Sesión
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                // Usuario no logueado
                <div className="auth-buttons">
                  <NavLink to="/login" className="auth-link login-link">
                    Iniciar Sesión
                  </NavLink>
                  <NavLink to="/register" className="auth-link register-link">
                    Registrarse
                  </NavLink>
                </div>
              )}
            </div>
          </nav>
        </div>
      </header>

      {/* Espacio para que el contenido no quede tapado por el navbar */}
      <div className="header-spacer"></div>

      <main role="main">
        <Outlet />
      </main>
    </div>
  );
}