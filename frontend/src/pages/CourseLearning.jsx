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
  const [updating, setUpdating] = useState(false);

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
    setUpdating(true);
    console.log('🔄 Marcando contenido como completado:', contentId);
    
    const response = await api.post(`/courses/${courseId}/contents/${contentId}/complete`);
    
    console.log('✅ Contenido marcado como completado:', response.data);
  
    setEnrollment(prev => ({
      ...prev,
      progress: response.data.progress,
      completedContents: response.data.completedContents,
      totalContents: response.data.totalContents,
      completedContentIds: [...(prev?.completedContentIds || []), contentId]
    }));
    
  } catch (error) {
    console.error('❌ Error marcando contenido como completado:', error);
    
    if (error.response?.status === 401) {
      alert('Debes iniciar sesión para completar contenidos');
      navigate('/login');
    } else {
      alert(error.response?.data?.message || 'Error al marcar como completado');
    }
  } finally {
    setUpdating(false);
  }
};

  const isContentCompleted = (contentId) => {
    if (!enrollment?.completedContentIds) return false;
    

    return enrollment.completedContentIds.some(id => 
      id.toString() === contentId.toString()
    );
  };

  const isCourseCompleted = enrollment?.progress === 100;

  const handleContentClick = (content) => {
    setActiveContent(content);
  };

  const handleShowCertificate = () => {
    alert('🎉 ¡Felicidades! Has completado el curso. Tu certificado estará disponible próximamente.');
    
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
  const completedContents = enrollment?.completedContents || enrollment?.completedContentIds?.length || 0;
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

          {/* MOSTRAR BOTÓN DE CERTIFICADO SI ESTÁ COMPLETADO */}
          {isCourseCompleted && (
            <div className="certificate-section">
              <div className="certificate-badge">🏆 Curso Completado</div>
              <button 
                className="certificate-btn"
                onClick={handleShowCertificate}
              >
                🎉 Ver Certificado
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="learning-content">
        {/* Sidebar de Contenidos */}
        <div className="contents-sidebar">
          <h3>📚 Contenidos del Curso</h3>
          <div className="contents-list">
            {visibleContents.map((content, index) => {
              const isCompleted = isContentCompleted(content._id);
              
              return (
                <div
                  key={content._id}
                  className={`content-item ${activeContent?._id === content._id ? 'active' : ''} ${isCompleted ? 'completed' : ''}`}
                  onClick={() => handleContentClick(content)}
                >
                  <div className="content-number">
                    {index + 1}
                  </div>
                  <div className="content-info">
                    <h4>{content.title}</h4>
                    <div className="content-type">
                      {content.type || 'Lección'} 
                      {isCompleted && (
                        <span className="content-status">✅ Completado</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Área Principal de Contenido */}
        <div className="content-viewer">
          {/* MOSTRAR MENSAJE DE FELICITACIONES SI EL CURSO ESTÁ COMPLETADO */}
          {isCourseCompleted ? (
            <div className="course-completed-section">
              <div className="completion-celebration">
                <div className="celebration-icon">🎉</div>
                <h2>¡Felicidades! Has completado el curso</h2>
                <p>Has terminado todas las lecciones de <strong>{course.title}</strong></p>
                <div className="completion-stats">
                  <div className="completion-stat">
                    <span className="stat-number">{completedContents}</span>
                    <span className="stat-label">Lecciones completadas</span>
                  </div>
                  <div className="completion-stat">
                    <span className="stat-number">100%</span>
                    <span className="stat-label">Progreso total</span>
                  </div>
                </div>
                <button 
                  className="certificate-btn-large"
                  onClick={handleShowCertificate}
                >
                  🏆 Obtener Certificado
                </button>
                <button 
                  className="review-course-btn"
                  onClick={() => navigate(`/courses/${courseId}`)}
                >
                  🔄 Revisar Curso
                </button>
              </div>
            </div>
          ) : (
            <>
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

              {/* Lista de Contenidos Disponibles */}
              <div className="contents-grid">
                <h3 style={{color: '#2d3748', marginBottom: '1rem'}}>
                  📋 Contenidos Disponibles ({visibleContents.length})
                </h3>
                
                {visibleContents.map((content, index) => {
                  const isCompleted = isContentCompleted(content._id);
                  
                  return (
                    <div key={content._id} className="content-card">
                      <div className="content-header">
                        <h3>
                          {index + 1}. {content.title}
                          {isCompleted && <span style={{color: '#28a745', marginLeft: '10px'}}>✅ Completado</span>}
                        </h3>
                        <span className="content-badge">
                          {content.type || 'Lección'}
                        </span>
                      </div>
                      
                      <div className="content-description">
                        {content.description || 'Descripción del contenido próximamente...'}
                      </div>
                      
                      {!isCompleted ? (
                        <button 
                          className="complete-btn"
                          onClick={() => handleMarkComplete(content._id)}
                          disabled={updating}
                        >
                          {updating ? '🔄 Procesando...' : '🎯 Marcar como Completado'}
                        </button>
                      ) : (
                        <div className="completed-message">
                          ✅ Ya completaste este contenido - <strong>¡Buen trabajo!</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}