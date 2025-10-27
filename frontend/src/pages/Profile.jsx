import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getUser } from '../auth';
import './Profile.css';

// Lista de intereses predefinidos
const PREDEFINED_INTERESTS = [
  'Programación', 'Diseño UX/UI', 'Matemáticas', 'Ciencias', 'Literatura',
  'Arte', 'Música', 'Deportes', 'Tecnología', 'Emprendimiento',
  'Idiomas', 'Historia', 'Fotografía', 'Videojuegos', 'Cocina',
  'Viajes', 'Meditación', 'Robótica', 'Inteligencia Artificial', 'Datos'
];

const PREDEFINED_SPECIALTIES = [
  'Frontend Development', 'Backend Development', 'Full Stack',
  'Mobile Development', 'Data Science', 'Machine Learning',
  'Cybersecurity', 'Cloud Computing', 'DevOps', 'UI/UX Design',
  'Game Development', 'Blockchain', 'IoT', 'AR/VR'
];

export default function Profile() {
  const [user, setUser] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [avatarLoading, setAvatarLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    interests: [],
    specialties: []
  });
  const [newInterest, setNewInterest] = useState('');
  const [newSpecialty, setNewSpecialty] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = getUser();
    if (!currentUser) {
      navigate('/login');
      return;
    }
    loadProfile();
  }, [navigate]);

  const loadProfile = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/auth/profile/me', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setFormData({
          name: userData.name || '',
          bio: userData.bio || '',
          interests: userData.interests || [],
          specialties: userData.specialties || []
        });
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:4000/auth/profile/me', {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        setEditMode(false);
        setMessage('Perfil actualizado correctamente');
        
        const currentUser = getUser();
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          name: data.user.name
        }));
      } else {
        setMessage(data.message || 'Error actualizando perfil');
      }
    } catch (error) {
      setMessage('Error de conexión');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMessage('Por favor selecciona una imagen válida');
      return;
    }

    if (file.size > 500 * 1024) { 
      setMessage('La imagen debe ser menor a 500KB');
      return;
    }

    setAvatarLoading(true);
    setMessage('');

    try {
      const token = localStorage.getItem('token');
      const uploadFormData = new FormData();
      uploadFormData.append('avatar', file);

      const response = await fetch('http://localhost:4000/auth/profile/avatar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: uploadFormData
      });

      const data = await response.json();

      if (response.ok) {
        setUser(prevUser => ({
          ...prevUser,
          avatar: data.user.avatar,
          avatarTimestamp: Date.now()
        }));
        
        setMessage('Foto de perfil actualizada correctamente');
        
        const currentUser = getUser();
        localStorage.setItem('user', JSON.stringify({
          ...currentUser,
          avatar: data.user.avatar
        }));
        
        setTimeout(() => {
          loadProfile();
        }, 1000);
        
      } else {
        setMessage(data.message || 'Error subiendo imagen');
      }
    } catch (error) {
      setMessage('Error subiendo imagen');
    } finally {
      setAvatarLoading(false);
      event.target.value = '';
    }
  };

  const addInterest = (interest) => {
    const trimmedInterest = interest.trim();
    if (trimmedInterest && !formData.interests.includes(trimmedInterest)) {
      setFormData({
        ...formData,
        interests: [...formData.interests, trimmedInterest]
      });
    }
    setNewInterest('');
  };

  const removeInterest = (interestToRemove) => {
    setFormData({
      ...formData,
      interests: formData.interests.filter(interest => interest !== interestToRemove)
    });
  };

  const addSpecialty = (specialty) => {
    const trimmedSpecialty = specialty.trim();
    if (trimmedSpecialty && !formData.specialties.includes(trimmedSpecialty)) {
      setFormData({
        ...formData,
        specialties: [...formData.specialties, trimmedSpecialty]
      });
    }
    setNewSpecialty('');
  };

  const removeSpecialty = (specialtyToRemove) => {
    setFormData({
      ...formData,
      specialties: formData.specialties.filter(specialty => specialty !== specialtyToRemove)
    });
  };

  const getAvatarUrl = (avatar) => {
    if (!avatar) return null;
    if (avatar.startsWith('http')) return avatar;
    if (avatar.startsWith('/uploads')) {
      const timestamp = Date.now();
      return `http://localhost:4000${avatar}?t=${timestamp}`;
    }
    return null;
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : 'U';
  };

  if (!user) {
    return (
      <div className="profile-loading">
        <div className="spinner"></div>
        <p>Cargando perfil...</p>
      </div>
    );
  }

  const avatarUrl = getAvatarUrl(user.avatar);

  return (
    <main className="profile-page">
      <div className="profile-container">
        {/* Header con gradiente moderno */}
        <div className="profile-header-modern">
          <div className="header-content">
            <h1 className="profile-title-modern">Mi Perfil</h1>
            <p className="profile-subtitle-modern">Comparte tus intereses y conecta con otros</p>
          </div>
          <div className="header-gradient"></div>
        </div>

        {message && (
          <div className={`profile-message ${message.includes('correctamente') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <div className="profile-layout">
          {/* Sidebar con avatar */}
          <div className="profile-sidebar">
            <div className="avatar-card">
              <div className="avatar-wrapper">
                {user.avatar ? (
                  <img 
                    src={avatarUrl} 
                    alt="Tu foto de perfil" 
                    className="avatar-image-modern"
                    crossOrigin="anonymous"
                  />
                ) : (
                  <div className="avatar-placeholder-modern">
                    {getInitials(user.name)}
                  </div>
                )}
                <div className="avatar-overlay">
                  <label htmlFor="avatar-upload" className="avatar-upload-trigger">
                    <span className="upload-icon">📷</span>
                    <span>Cambiar foto</span>
                  </label>
                </div>
              </div>
              
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={avatarLoading}
                style={{ display: 'none' }}
              />
              
              <div className="avatar-info">
                <h3 className="user-name">{user.name}</h3>
                <p className="user-role">{user.role}</p>
                <p className="avatar-hint">Recomendado: imágenes menores a 500KB</p>
              </div>
              
              {avatarLoading && (
                <div className="upload-progress">
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                  <span>Subiendo...</span>
                </div>
              )}
            </div>

            {/* Stats rápidas */}
            <div className="profile-stats">
              <div className="stat-item">
                <span className="stat-number">{user.interests?.length || 0}</span>
                <span className="stat-label">Intereses</span>
              </div>
              <div className="stat-item">
                <span className="stat-number">{user.specialties?.length || 0}</span>
                <span className="stat-label">Especialidades</span>
              </div>
            </div>
          </div>

          {/* Contenido principal */}
          <div className="profile-main">
            <div className="profile-card">
              {!editMode ? (
                // Vista de lectura
                <div className="profile-view">
                  <div className="section-header">
                    <h2>Información Personal</h2>
                    <button 
                      onClick={() => setEditMode(true)}
                      className="edit-btn-modern"
                    >
                      ✏️ Editar Perfil
                    </button>
                  </div>

                  <div className="info-grid">
                    <div className="info-item">
                      <label>Nombre completo</label>
                      <p className="info-value-modern">{user.name}</p>
                    </div>
                    
                    <div className="info-item">
                      <label>Correo electrónico</label>
                      <p className="info-value-modern">{user.email}</p>
                    </div>
                    
                    <div className="info-item">
                      <label>Rol en la plataforma</label>
                      <p className="info-value-modern role-badge-modern">{user.role}</p>
                    </div>
                  </div>

                  {user.bio && (
                    <div className="bio-section">
                      <label>Biografía</label>
                      <p className="bio-text-modern">{user.bio}</p>
                    </div>
                  )}

                  {/* Intereses */}
                  {(user.interests && user.interests.length > 0) && (
                    <div className="interests-section-modern">
                      <h3>Mis Intereses</h3>
                      <p className="section-description">
                        Estos intereses son visibles para otros usuarios
                      </p>
                      <div className="tags-container-modern">
                        {user.interests.map((interest, index) => (
                          <span key={index} className="tag-modern interest-tag-modern">
                            {interest}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Especialidades */}
                  {user.specialties && user.specialties.length > 0 && (
                    <div className="specialties-section-modern">
                      <h3>Mis Especialidades</h3>
                      <p className="section-description">
                        Estas especialidades son visibles para otros usuarios
                      </p>
                      <div className="tags-container-modern">
                        {user.specialties.map((specialty, index) => (
                          <span key={index} className="tag-modern specialty-tag-modern">
                            {specialty}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Modo edición
                <form className="profile-edit" onSubmit={handleUpdateProfile}>
                  <div className="section-header">
                    <h2>Editar Perfil</h2>
                    <div className="edit-actions">
                      <button 
                        type="submit" 
                        className="save-btn-modern"
                        disabled={loading}
                      >
                        {loading ? '⏳ Guardando...' : '💾 Guardar Cambios'}
                      </button>
                      <button 
                        type="button" 
                        className="cancel-btn-modern"
                        onClick={() => {
                          setEditMode(false);
                          setFormData({
                            name: user.name || '',
                            bio: user.bio || '',
                            interests: user.interests || [],
                            specialties: user.specialties || []
                          });
                        }}
                      >
                        ❌ Cancelar
                      </button>
                    </div>
                  </div>

                  <div className="form-grid">
                    <div className="form-group-modern">
                      <label htmlFor="name">Nombre completo</label>
                      <input
                        id="name"
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                        minLength="2"
                        className="input-modern"
                      />
                    </div>

                    <div className="form-group-modern full-width">
                      <label htmlFor="bio">Biografía</label>
                      <textarea
                        id="bio"
                        value={formData.bio}
                        onChange={(e) => setFormData({...formData, bio: e.target.value})}
                        placeholder="Cuéntanos algo sobre ti..."
                        rows="4"
                        maxLength="500"
                        className="textarea-modern"
                      />
                      <div className="char-count">{formData.bio.length}/500</div>
                    </div>
                  </div>

                  {/* Editor de intereses */}
                  <div className="tags-editor-modern">
                    <h3>Mis Intereses</h3>
                    <p className="section-description">
                      Agrega intereses que describan tus áreas de interés
                    </p>
                    
                    <div className="current-tags">
                      {formData.interests.map((interest, index) => (
                        <span key={index} className="tag-modern editable interest-tag-modern">
                          {interest}
                          <button 
                            type="button"
                            onClick={() => removeInterest(interest)}
                            className="tag-remove-modern"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                      {formData.interests.length === 0 && (
                        <p className="no-tags">Aún no has agregado intereses</p>
                      )}
                    </div>

                    <div className="add-tags-section">
                      <div className="add-tags-row">
                        <input
                          type="text"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          placeholder="Escribe un interés..."
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addInterest(newInterest);
                            }
                          }}
                          className="tag-input-modern"
                        />
                        <button 
                          type="button"
                          onClick={() => addInterest(newInterest)}
                          className="add-tag-btn"
                        >
                          + Agregar
                        </button>
                      </div>

                      <div className="suggested-tags">
                        <p className="suggested-title">Sugerencias:</p>
                        <div className="suggested-tags-grid">
                          {PREDEFINED_INTERESTS.filter(interest => 
                            !formData.interests.includes(interest)
                          ).slice(0, 6).map(interest => (
                            <button
                              key={interest}
                              type="button"
                              onClick={() => addInterest(interest)}
                              className="suggested-tag-modern"
                            >
                              {interest}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Editor de especialidades */}
                  {(user.role === 'teacher' || user.role === 'admin') && (
                    <div className="tags-editor-modern">
                      <h3>Mis Especialidades</h3>
                      <p className="section-description">
                        Agrega tus áreas de especialización profesional
                      </p>
                      
                      <div className="current-tags">
                        {formData.specialties.map((specialty, index) => (
                          <span key={index} className="tag-modern editable specialty-tag-modern">
                            {specialty}
                            <button 
                              type="button"
                              onClick={() => removeSpecialty(specialty)}
                              className="tag-remove-modern"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                        {formData.specialties.length === 0 && (
                          <p className="no-tags">Aún no has agregado especialidades</p>
                        )}
                      </div>

                      <div className="add-tags-section">
                        <div className="add-tags-row">
                          <input
                            type="text"
                            value={newSpecialty}
                            onChange={(e) => setNewSpecialty(e.target.value)}
                            placeholder="Escribe una especialidad..."
                            onKeyPress={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addSpecialty(newSpecialty);
                              }
                            }}
                            className="tag-input-modern"
                          />
                          <button 
                            type="button"
                            onClick={() => addSpecialty(newSpecialty)}
                            className="add-tag-btn specialty"
                          >
                            + Agregar
                          </button>
                        </div>

                        <div className="suggested-tags">
                          <p className="suggested-title">Sugerencias:</p>
                          <div className="suggested-tags-grid">
                            {PREDEFINED_SPECIALTIES.filter(specialty => 
                              !formData.specialties.includes(specialty)
                            ).slice(0, 6).map(specialty => (
                              <button
                                key={specialty}
                                type="button"
                                onClick={() => addSpecialty(specialty)}
                                className="suggested-tag-modern specialty"
                              >
                                {specialty}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}