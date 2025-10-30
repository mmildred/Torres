// CourseLearning.jsx - DISEÑO MEJORADO
import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { getUser } from "../auth";
import "./CourseLearning.css";

export default function CourseLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const user = getUser();
  
  const [course, setCourse] = useState(null);
  const [enrollment, setEnrollment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeContent, setActiveContent] = useState(null);

  useEffect(() => {
    console.log('🔄 CourseLearning iniciado para curso:', courseId);
    fetchCourseData();
  }, [courseId]);

  const fetchCourseData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('📥 Cargando datos del curso...');
      
      const [courseRes, progressRes] = await Promise.all([
        api.get(`/courses/${courseId}`),
        api.get(`/courses/${courseId}/progress/me`)
      ]);
      
      console.log('✅ Datos cargados:', {
        course: courseRes.data.title,
        enrollment: progressRes.data
      });
      
      setCourse(courseRes.data);
      setEnrollment(progressRes.data);
      
      // Establecer el primer contenido como activo
      const publishedContents = courseRes.data.contents?.filter(content => content.isPublished) || [];
      if (publishedContents.length > 0) {
        setActiveContent(publishedContents[0]);
      }
      
    } catch (error) {
      console.error('❌ Error cargando datos:', error);
      setError(error.response?.data?.message || error.message);
      
      if (error.response?.status === 403 || error.response?.status === 404) {
        alert("No estás inscrito en este curso o no tienes acceso");
        navigate(`/courses/${courseId}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleMarkComplete = async (contentId) => {
    try {
      console.log('🔄 Marcando contenido como completado:', contentId);
      
      // Simulación temporal de completado
      const updatedEnrollment = {
        ...enrollment,
        completedContents: (enrollment.completedContents || 0) + 1,
        progress: Math.min(100, ((enrollment.completedContents || 0) + 1) / (enrollment.totalContents || 1) * 100)
      };
      
      setEnrollment(updatedEnrollment);
      
      alert('🎉 Contenido marcado como completado (Demo)');
      
    } catch (error) {
      console.error('Error:', error);
      alert('Funcionalidad en desarrollo');
    }
  };

  const handleContentClick = (content) => {
    setActiveContent(content);
  };

  if (loading) {
    return (
      <div className="course-learning">
        <div className="loading">
          <div style={{fontSize: '2rem', marginBottom: '1rem'}}>📚</div>
          <div>Cargando contenido del curso...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-learning">
        <div className="error-message">
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>⚠️</div>
          <h2>Error al cargar el curso</h2>
          <p style={{marginBottom: '2rem', color: '#718096'}}>{error}</p>
          <button 
            className="back-btn" 
            onClick={() => navigate(`/courses/${courseId}`)}
            style={{background: '#667eea', color: 'white'}}
          >
            Volver al curso
          </button>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-learning">
        <div className="error-message">
          <div style={{fontSize: '3rem', marginBottom: '1rem'}}>❌</div>
          <h2>Curso no encontrado</h2>
          <p style={{marginBottom: '2rem', color: '#718096'}}>El curso que buscas no existe o no tienes acceso.</p>
          <button 
            className="back-btn" 
            onClick={() => navigate('/courses')}
            style={{background: '#667eea', color: 'white'}}
          >
            Volver a cursos
          </button>
        </div>
      </div>
    );
  }

  const visibleContents = course.contents?.filter(content => content.isPublished === true) || [];
  const progress = enrollment?.progress || 0;
  const completedContents = enrollment?.completedContents || 0;
  const totalContents = enrollment?.totalContents || visibleContents.length;

  return (
    <div className="course-learning">
      {/* Header Mejorado */}
      <div className="learning-header">
        <button className="back-btn" onClick={() => navigate(`/courses/${courseId}`)}>
          ← Volver al curso
        </button>
        
        <h1>{course.title}</h1>
        <p style={{opacity: 0.9, marginBottom: '1.5rem'}}>{course.description || 'Aprende a tu propio ritmo'}</p>
        
        <div className="progress-section">
          <div className="progress-info">
            <div className="progress-stats">
              <span>Progreso: <strong>{progress}%</strong></span>
              <span>Completados: <strong>{completedContents} de {totalContents}</strong></span>
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar">
                <div 
                  className="progress-fill" 
                  style={{width: `${progress}%`}}
                ></div>
              </div>
              <small>Tu progreso en el curso</small>
            </div>
          </div>
        </div>
      </div>

      <div className="learning-content">
        {/* Sidebar de Contenidos */}
        <div className="contents-sidebar">
          <h3>📚 Contenidos del Curso</h3>
          <div className="contents-list">
            {visibleContents.map((content, index) => (
              <div
                key={content._id}
                className={`content-item ${activeContent?._id === content._id ? 'active' : ''} ${completedContents > index ? 'completed' : ''}`}
                onClick={() => handleContentClick(content)}
              >
                <div className="content-number">
                  {index + 1}
                </div>
                <div className="content-info">
                  <h4>{content.title}</h4>
                  <div className="content-type">
                    {content.type || 'Lección'} 
                    {completedContents > index && (
                      <span className="content-status">✅ Completado</span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Área Principal de Contenido */}
        <div className="content-viewer">
          <div className="welcome-section">
            <h2>🎓 ¡Bienvenido al Modo de Aprendizaje!</h2>
            <p style={{color: '#718096', fontSize: '1.1rem'}}>
              Estás a punto de comenzar tu viaje de aprendizaje en <strong>{course.title}</strong>
            </p>
            
            <div className="course-stats">
              <div className="stat-card">
                <span className="stat-value">{progress}%</span>
                <span className="stat-label">Progreso Total</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">{completedContents}/{totalContents}</span>
                <span className="stat-label">Lecciones</span>
              </div>
              <div className="stat-card">
                <span className="stat-value">
                  {totalContents > 0 ? Math.ceil(totalContents * 0.5) : 0}h
                </span>
                <span className="stat-label">Duración estimada</span>
              </div>
            </div>
          </div>

          {/* Próximas Funcionalidades */}
          <div>
            <h3 style={{marginBottom: '1.5rem', color: '#2d3748'}}>🚀 Próximas Funcionalidades</h3>
            <div className="features-grid">
              <div className="feature-card">
                <h4>📖 Contenidos Interactivos</h4>
                <p>Lecciones multimedia con videos, textos y ejercicios prácticos</p>
              </div>
              <div className="feature-card">
                <h4>✅ Seguimiento de Progreso</h4>
                <p>Monitorea tu avance en tiempo real con métricas detalladas</p>
              </div>
              <div className="feature-card">
                <h4>🏆 Sistema de Logros</h4>
                <p>Desbloquea insignias y certificados por tus logros</p>
              </div>
              <div className="feature-card">
                <h4>💬 Comunidad</h4>
                <p>Interactúa con otros estudiantes y instructores</p>
              </div>
            </div>
          </div>

          {/* Lista de Contenidos Disponibles */}
          <div className="contents-grid">
            <h3 style={{color: '#2d3748', marginBottom: '1rem'}}>
              📋 Contenidos Disponibles ({visibleContents.length})
            </h3>
            
            {visibleContents.map((content, index) => (
              <div key={content._id} className="content-card">
                <div className="content-header">
                  <h3>{index + 1}. {content.title}</h3>
                  <span className="content-badge">
                    {content.type || 'Lección'}
                  </span>
                </div>
                
                <div className="content-description">
                  {content.description || 'Descripción del contenido próximamente...'}
                </div>
                
                <button 
                  className="demo-btn"
                  onClick={() => handleMarkComplete(content._id)}
                >
                  🎯 Marcar como Completado (Demo)
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}