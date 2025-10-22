import React, { useEffect, useMemo, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { getUser, logout } from "./auth";
import './AppHeader.css';

export default function App() {
  const navigate = useNavigate();
  const user = getUser();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Tema según hora
  const theme = useMemo(() => {
    const h = new Date().getHours();
    return h >= 6 && h < 18 ? "light" : "dark";
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  // Efecto para detectar scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="app-container">
      <header 
        className={`header ${scrolled ? 'scrolled' : ''}`}
        role="banner"
      >
        <div className="header-content">
          <NavLink
  to={user ? "/courses" : "/"}
  className="logo-link"
  aria-label="Ir al inicio"
>
  <div className="logo">
    <div className="logo-icon" aria-hidden>
  <svg
    viewBox="0 0 24 24"
    width="20"
    height="20"
    aria-hidden="true"
    className="logo-plane"
  >
    <path d="M22 2L11 13" />
    <path d="M22 2l-7 20-4-9-9-4 20-7z" />
  </svg>
</div>

    <span className="logo-text">Campus Digital</span>
  </div>
</NavLink>


          <nav className="nav" aria-label="Principal">
            <div className="nav-links">
              <NavLink to="/courses" className="nav-link">
                Cursos
              </NavLink>

              {!user && (
                <>
                  <NavLink to="/login" className="nav-link">
                    Login
                  </NavLink>
                  <NavLink to="/register" className="nav-link register-link">
                    Registro
                  </NavLink>
                </>
              )}
            </div>

            {user && (
              <div className="user-menu-container">
                <button
                  onClick={() => setMenuOpen((v) => !v)}
                  className="user-button"
                  aria-haspopup="menu"
                  aria-expanded={menuOpen}
                >
                  <span className="user-name">{user.name ?? "Usuario"}</span>
                  <div className="user-avatar">
                    {user.name?.charAt(0)?.toUpperCase() || "U"}
                  </div>
                </button>

                {menuOpen && (
                  <div className="dropdown-menu" role="menu">
                    <div className="user-info">
                      <div className="user-welcome">Hola, {user.name}</div>
                      <div className="user-role">{user.role}</div>
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
            )}
          </nav>
        </div>
      </header>

      <main role="main">
        <Outlet />
      </main>

      <style>{`
        :root[data-theme="light"] {
          --primary: #000000;
          --primary-hover: #333333;
          --text: #1a1a1a;
          --text-light: #666666;
          --bg: #ffffff;
          --bg-secondary: #f8f8f8;
          --border: #e0e0e0;
          --shadow: rgba(0, 0, 0, 0.08);
          --header-bg: rgba(255, 255, 255, 0.95);
        }
        
        :root[data-theme="dark"] {
          --primary: #ffffff;
          --primary-hover: #e0e0e0;
          --text: #ffffff;
          --text-light: #a0a0a0;
          --bg: #000000;
          --bg-secondary: #1a1a1a;
          --border: #333333;
          --shadow: rgba(0, 0, 0, 0.3);
          --header-bg: rgba(0, 0, 0, 0.95);
        }
      `}</style>
    </div>
  );
}