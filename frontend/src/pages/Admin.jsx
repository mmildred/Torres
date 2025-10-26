import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUser } from '../auth';
import { useNavigate } from 'react-router-dom';
import './Admin.css';

export default function Admin() {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [inviteCodes, setInviteCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  const user = getUser();
  const h = new Date().getHours();
  const saludo = h < 12 ? "Buenos días" : h < 19 ? "Buenas tardes" : "Buenas noches";

  useEffect(() => {
    const currentUser = getUser();

    if (!currentUser || currentUser.role !== 'admin') {
      navigate('/');
      return;
    }

    loadAllData();
  }, [navigate]);

  const loadAllData = async () => {
    setLoading(true);
    try {
      await Promise.all([loadDashboard(), loadUsers(), loadInviteCodes()]);
    } catch (error) {
      showSnackbar('Error cargando datos', 'error');
    } finally {
      setLoading(false);
    }
  };

  const loadDashboard = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/auth/admin/dashboard', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Error en la respuesta');
      const data = await response.json();
      setStats(data);
    } catch (error) {
      throw error;
    }
  };

  const loadUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/auth/admin/users', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Error en la respuesta');
      const data = await response.json();
      setUsers(data);
    } catch (error) {
      throw error;
    }
  };

  const loadInviteCodes = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/auth/admin/invite-codes', {
        headers: { 
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Error en la respuesta');
      const data = await response.json();
      setInviteCodes(data);
    } catch (error) {
      throw error;
    }
  };

  const generateInviteCode = async () => {
    setGenerating(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/auth/invite-codes/generate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ expiresInDays: 7 })
      });
      
      const data = await response.json();
      
      if (response.ok) {
        const inviteLink = `${window.location.origin}/register?inviteCode=${data.code}`;
        await navigator.clipboard.writeText(inviteLink);
        showSnackbar(`¡Link copiado! Código: ${data.code}`, 'success');
        loadAllData();
      } else {
        showSnackbar(data.message, 'error');
      }
    } catch (error) {
      showSnackbar('Error generando código', 'error');
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    showSnackbar('Link copiado al portapapeles', 'success');
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusConfig = (code) => {
    if (code.used) {
      return { 
        class: 'status-used',
        text: 'Usado',
        icon: '✅'
      };
    }
    if (new Date() > new Date(code.expiresAt)) {
      return { 
        class: 'status-expired',
        text: 'Expirado',
        icon: '❌'
      };
    }
    return { 
      class: 'status-active',
      text: 'Activo',
      icon: '⏳'
    };
  };

  if (loading) {
    return (
      <main className="admin">
        <section className="admin-hero">
          <div className="container">
            <div className="loading-spinner">
              <div className="spinner"></div>
              <p>Cargando datos del panel...</p>
            </div>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="admin">
      {/* Hero Section */}
      <section className="admin-hero">
        <div className="container">
          <div className="admin-hero-content">
            <div className="admin-hero-text">
              <p className="admin-greeting">{saludo}, {user?.name}</p>
              <h1 className="admin-title">
                Panel de <span className="text-gradient">Administración</span>
              </h1>
              <p className="admin-description">
                Gestiona usuarios, genera códigos de invitación para profesores 
                y supervisa el progreso de la plataforma.
              </p>
              
              <div className="admin-actions">
                <button 
                  onClick={generateInviteCode}
                  className={`btn btn-primary ${generating ? 'btn-loading' : ''}`}
                  disabled={generating}
                >
                  {generating ? 'Generando...' : 'Nueva Invitación'}
                </button>
                <button onClick={loadAllData} className="btn btn-secondary">
                  Actualizar Datos
                </button>
              </div>
            </div>

            <div className="admin-hero-visual">
              <div className="admin-floating-card card-1">
                <div className="admin-card-icon">👥</div>
                <h4>Gestión de Usuarios</h4>
              </div>
              <div className="admin-floating-card card-2">
                <div className="admin-card-icon">🔑</div>
                <h4>Códigos de Invitación</h4>
              </div>
              <div className="admin-floating-card card-3">
                <div className="admin-card-icon">📊</div>
                <h4>Estadísticas</h4>
              </div>
              <div className="admin-main-visual">
                <div className="admin-visual-content">
                  <div className="admin-screen"></div>
                  <div className="admin-progress-bar"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="admin-stats">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-info">
                <span className="stat-number">{stats.users?.total || 0}</span>
                <span className="stat-label">Total Usuarios</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">👨‍🏫</div>
              <div className="stat-info">
                <span className="stat-number">{stats.users?.teachers || 0}</span>
                <span className="stat-label">Profesores</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <div className="stat-info">
                <span className="stat-number">{stats.users?.students || 0}</span>
                <span className="stat-label">Estudiantes</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔑</div>
              <div className="stat-info">
                <span className="stat-number">{stats.inviteCodes?.active || 0}</span>
                <span className="stat-label">Códigos Activos</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Management Section */}
      <section className="admin-management">
        <div className="container">
          <div className="management-grid">
            {/* Invite Codes Card */}
            <div className="management-card">
              <div className="card-header">
                <h3>Códigos de Invitación</h3>
                <span className="card-count">{inviteCodes.length} códigos</span>
              </div>
              
              <div className="codes-list">
                {inviteCodes.map((code) => {
                  const status = getStatusConfig(code);
                  return (
                    <div key={code._id} className={`code-item ${status.class}`}>
                      <div className="code-info">
                        <span className="code-text">{code.code}</span>
                        <span className="code-expiry">
                          {formatDate(code.expiresAt)}
                        </span>
                      </div>
                      <div className="code-actions">
                        <span className={`status-badge ${status.class}`}>
                          {status.icon} {status.text}
                        </span>
                        {!code.used && new Date() < new Date(code.expiresAt) && (
                          <button
                            onClick={() => copyToClipboard(`${window.location.origin}/register?inviteCode=${code.code}`)}
                            className="btn-copy"
                            title="Copiar link de invitación"
                          >
                            📋
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Users Card */}
            <div className="management-card">
              <div className="card-header">
                <h3>Usuarios Registrados</h3>
                <span className="card-count">{users.length} usuarios</span>
              </div>
              
              <div className="users-list">
                {users.map((user) => (
                  <div key={user._id} className="user-item">
                    <div className="user-avatar">
                      {user.name?.charAt(0)?.toUpperCase() || 'U'}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                    <div className="user-meta">
                      <span className={`user-role ${user.role}`}>
                        {user.role === 'teacher' ? '👨‍🏫 Profesor' : '🎓 Estudiante'}
                      </span>
                      <span className="user-date">
                        {formatDate(user.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="admin-actions-section">
        <div className="container">
          <div className="section-header">
            <h2>Acciones Rápidas</h2>
            <p>Gestiona tu plataforma de manera eficiente</p>
          </div>

          <div className="actions-grid">
            <div className="action-card">
              <div className="action-icon">👨‍🏫</div>
              <h3>Gestionar Profesores</h3>
              <p>Genera códigos de invitación y gestiona el acceso de profesores.</p>
              <button onClick={generateInviteCode} className="btn btn-primary">
                Generar Invitación
              </button>
            </div>

            <div className="action-card">
              <div className="action-icon">📊</div>
              <h3>Ver Estadísticas</h3>
              <p>Monitorea el crecimiento y actividad de tu plataforma.</p>
              <button onClick={loadAllData} className="btn btn-secondary">
                Actualizar Datos
              </button>
            </div>

            <div className="action-card">
              <div className="action-icon">⚙️</div>
              <h3>Configuración</h3>
              <p>Configura los parámetros y opciones de tu plataforma.</p>
              <Link to="/courses" className="btn btn-secondary">
                Gestionar Cursos
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Snackbar */}
      {snackbar.open && (
        <div className={`snackbar snackbar-${snackbar.severity}`}>
          <span>{snackbar.message}</span>
          <button onClick={handleCloseSnackbar} className="snackbar-close">
            ×
          </button>
        </div>
      )}
    </main>
  );
}