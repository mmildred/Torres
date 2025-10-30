// pages/MyCourses.jsx - VERSIÓN CORREGIDA
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { isAuthenticated, getUser } from "../auth";
import "./MyCourses.css";

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();
  const user = getUser();

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    const loadMyCourses = async () => {
      try {
        setLoading(true);
        
        // ✅ OBTENER SOLO LOS CURSOS DEL USUARIO - NUEVA RUTA ESPECÍFICA
        const myCoursesRes = await api.get("/courses/my-courses");
        setCourses(myCoursesRes.data);
        
      } catch (error) {
        console.error("Error cargando mis cursos:", error);
        
        // ✅ FALLBACK: CARGAR TODOS LOS CURSOS Y FILTRAR LOCALMENTE
        if (error.response?.status === 404) {
          try {
            console.log("Ruta /my-courses no existe, usando fallback...");
            const allCoursesRes = await api.get("/courses");
            const allCourses = allCoursesRes.data;
            
            // Obtener progreso solo para cursos inscritos
            const coursesWithProgress = await Promise.all(
              allCourses.map(async (course) => {
                try {
                  const progressRes = await api.get(`/courses/${course._id}/progress/me`);
                  if (progressRes.data.enrolled) {
                    return {
                      ...course,
                      progress: progressRes.data,
                      isEnrolled: true
                    };
                  }
                  return null;
                } catch (error) {
                  return null; // No está inscrito
                }
              })
            );
            
            const enrolledCourses = coursesWithProgress.filter(course => course !== null);
            setCourses(enrolledCourses);
          } catch (fallbackError) {
            console.error("Error en fallback:", fallbackError);
          }
        }
      } finally {
        setLoading(false);
      }
    };

    loadMyCourses();
  }, [navigate]);

  // ... resto del componente igual
  const getFilteredCourses = () => {
    switch (filter) {
      case "in-progress":
        return courses.filter(course => 
          course.progress?.progress > 0 && course.progress?.progress < 100
        );
      case "completed":
        return courses.filter(course => course.progress?.progress === 100);
      default:
        return courses;
    }
  };

  const handleContinueLearning = (courseId) => {
    navigate(`/courses/${courseId}/learn`);
  };

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleImageError = (e) => {
    e.target.src = "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
  };

  if (loading) {
    return (
      <div className="my-courses-loading">
        <div className="loading-spinner"></div>
        <p>Cargando tus cursos...</p>
      </div>
    );
  }

  const filteredCourses = getFilteredCourses();

  return (
    <div className="my-courses">
      <div className="my-courses-header">
        <h1>Mis Cursos</h1>
        <p>Gestiona y continúa tu aprendizaje</p>
        
        <div className="courses-stats">
          <div className="stat-card">
            <span className="stat-number">{courses.length}</span>
            <span className="stat-label">Total</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {courses.filter(c => c.progress?.progress > 0 && c.progress?.progress < 100).length}
            </span>
            <span className="stat-label">En Progreso</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {courses.filter(c => c.progress?.progress === 100).length}
            </span>
            <span className="stat-label">Completados</span>
          </div>
        </div>

        <div className="filter-tabs">
          <button 
            className={`filter-tab ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Todos ({courses.length})
          </button>
          <button 
            className={`filter-tab ${filter === "in-progress" ? "active" : ""}`}
            onClick={() => setFilter("in-progress")}
          >
            En Progreso ({courses.filter(c => c.progress?.progress > 0 && c.progress?.progress < 100).length})
          </button>
          <button 
            className={`filter-tab ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completados ({courses.filter(c => c.progress?.progress === 100).length})
          </button>
        </div>
      </div>

      <div className="my-courses-content">
        {filteredCourses.length === 0 ? (
          <div className="empty-courses">
            <div className="empty-icon">📚</div>
            <h3>
              {filter === "all" 
                ? "No estás inscrito en ningún curso" 
                : filter === "in-progress" 
                ? "No tienes cursos en progreso"
                : "No tienes cursos completados"
              }
            </h3>
            <p>
              {filter === "all" 
                ? "Explora nuestro catálogo y encuentra cursos que te interesen"
                : filter === "in-progress"
                ? "Comienza a aprender en alguno de tus cursos inscritos"
                : "¡Continúa aprendiendo para completar tus cursos!"
              }
            </p>
            {filter === "all" && (
              <button 
                className="browse-courses-btn"
                onClick={() => navigate("/courses")}
              >
                Explorar Cursos
              </button>
            )}
          </div>
        ) : (
          <div className="courses-grid">
            {filteredCourses.map((course) => (
              <div key={course._id} className="course-card">
                <div className="course-image">
                  <img
                    src={course.thumbnail || "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80"}
                    alt={course.title}
                    onError={handleImageError}
                    loading="lazy"
                  />
                  <div className="course-category">
                    {course.category || "General"}
                  </div>
                  {course.progress?.progress === 100 && (
                    <div className="completed-badge">
                      ✅ Completado
                    </div>
                  )}
                </div>

                <div className="course-content">
                  <h3 className="course-title">{course.title}</h3>
                  
                  <div className="course-meta">
                    <div className="meta-item">
                      <span className="meta-label">Instructor:</span>
                      <span className="meta-text">{course.owner?.name || "Administrador"}</span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Nivel:</span>
                      <span className="meta-text">
                        {course.level === 'beginner' ? 'Principiante' : 
                         course.level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                      </span>
                    </div>
                  </div>

                  <div className="progress-section">
                    <div className="progress-header">
                      <span className="progress-label">Tu progreso</span>
                      <span className="progress-percent">{course.progress?.progress || 0}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${course.progress?.progress || 0}%` }}
                      ></div>
                    </div>
                    <div className="progress-stats">
                      {course.progress?.completedContents || 0} de {course.progress?.totalContents || 0} lecciones
                    </div>
                  </div>

                  <div className="course-actions">
                    <button
                      className="view-details-btn"
                      onClick={() => handleViewCourse(course._id)}
                    >
                      Ver Detalles
                    </button>
                    
                    {course.progress?.progress === 100 ? (
                      <button
                        className="review-course-btn"
                        onClick={() => handleViewCourse(course._id)}
                      >
                        🎉 Revisar
                      </button>
                    ) : (
                      <button
                        className="continue-btn"
                        onClick={() => handleContinueLearning(course._id)}
                      >
                        {course.progress?.progress === 0 ? 'Comenzar' : 'Continuar'}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}