import React, { useEffect, useMemo, useState } from "react";
import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { getUser, logout } from "./auth";

export default function App() {
  const navigate = useNavigate();
  const user = getUser();
  const [menuOpen, setMenuOpen] = useState(false);

  // Tema según hora (claro 6–18h, oscuro fuera de ese rango)
  const theme = useMemo(() => {
    const h = new Date().getHours();
    return h >= 6 && h < 18 ? "light" : "dark";
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const linkStyle = {
    textDecoration: "none",
    padding: "6px 10px",
    borderRadius: 8,
  };

  const activeStyle = {
    background: "rgba(255, 255, 255, 0.08)",
  };

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div style={{ maxWidth: 960, margin: "20px auto", fontFamily: "system-ui, Arial" }}>
      <header
        role="banner"
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
          padding: "10px 14px",
          border: "1px solid var(--border, #e5e7eb)",
          borderRadius: 12,
          position: "sticky",
          top: 12,
          backdropFilter: "saturate(180%) blur(8px)",
        }}
      >
        <NavLink to="/" style={{ textDecoration: "none", color: "inherit" }} aria-label="Ir al inicio">
          <h1 style={{ margin: 0 }}>Campus Digital</h1>
        </NavLink>

        <nav aria-label="Principal" style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <NavLink
            to="/courses"
            style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}
          >
            Cursos
          </NavLink>

          {!user && (
            <>
              <NavLink
                to="/login"
                style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}
              >
                Login
              </NavLink>
              <NavLink
                to="/register"
                style={({ isActive }) => ({ ...linkStyle, ...(isActive ? activeStyle : {}) })}
              >
                Registro
              </NavLink>
            </>
          )}

          {user && (
            <div style={{ position: "relative" }}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                aria-haspopup="menu"
                aria-expanded={menuOpen}
                style={{
                  ...linkStyle,
                  border: "1px solid #e5e7eb",
                  background: "transparent",
                  cursor: "pointer",
                }}
                title={`Usuario: ${user.role}`}
              >
                {user.name ?? "Usuario"} ⏷
              </button>

              {menuOpen && (
                <div
                  role="menu"
                  style={{
                    position: "absolute",
                    right: 0,
                    marginTop: 8,
                    minWidth: 220,
                    background: "var(--panel, #fff)",
                    border: "1px solid #e5e7eb",
                    borderRadius: 10,
                    boxShadow: "0 10px 30px rgba(0,0,0,.08)",
                    padding: 8,
                    zIndex: 10,
                  }}
                >
                  <div style={{ padding: "8px 10px", fontSize: 12, opacity: 0.7 }}>
                    Rol: <strong>{user.role}</strong>
                  </div>

                  {user.role === "admin" && (
                    <NavLink
                      to="/admin"
                      role="menuitem"
                      style={({ isActive }) => ({
                        display: "block",
                        ...linkStyle,
                        ...(isActive ? activeStyle : {}),
                      })}
                      onClick={() => setMenuOpen(false)}
                    >
                      Panel de Admin
                    </NavLink>
                  )}

                  <NavLink
                    to="/profile"
                    role="menuitem"
                    style={({ isActive }) => ({
                      display: "block",
                      ...linkStyle,
                      ...(isActive ? activeStyle : {}),
                    })}
                    onClick={() => setMenuOpen(false)}
                  >
                    Perfil
                  </NavLink>

                  <button
                    role="menuitem"
                    onClick={handleLogout}
                    style={{
                      ...linkStyle,
                      width: "100%",
                      textAlign: "left",
                      border: "none",
                      background: "transparent",
                      cursor: "pointer",
                    }}
                  >
                    Salir
                  </button>
                </div>
              )}
            </div>
          )}
        </nav>
      </header>

      <main role="main">
        <Outlet />
      </main>

      <style>{`
        :root[data-theme="light"] {
          --border: #e5e7eb;
          --panel: #ffffff;
          color-scheme: light;
          color: #111827;
          background: #ffffff;
        }
        :root[data-theme="dark"] {
          --border: #374151;
          --panel: #111827;
          color-scheme: dark;
          color: #e5e7eb;
          background: #0b0f19;
        }
        a { color: inherit; }
        @media (max-width: 640px) {
          nav[aria-label="Principal"] { gap: 4px; }
          h1 { font-size: 1.1rem; }
        }
      `}</style>
    </div>
  );
}
