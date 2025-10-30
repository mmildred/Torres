// pages/MyCourses.jsx - VERSIÓN CORREGIDA
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { isAuthenticated } from "../auth"; // ✅ Importar la nueva función
import "./MyCourses.css";

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const navigate = useNavigate();

  // ✅ useEffect simplificado y seguro
  useEffect(() => {
    // Verificar autenticación inmediatamente
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    // Función para cargar cursos
    const loadCourses = async () => {
      try {
        setLoading(true);
        
        // Obtener todos los cursos
        const allCoursesRes = await api.get("/courses");
        const allCourses = allCoursesRes.data;

        // Obtener progreso de cada curso
        const coursesWithProgress = await Promise.all(
          allCourses.map(async (course) => {
            try {
              const progressRes = await api.get(`/courses/${course._id}/progress/me`);
              return {
                ...course,
                progress: progressRes.data,
                isEnrolled: progressRes.data.enrolled
              };
            } catch (error) {
              // Si hay error 404, no está inscrito
              return {
                ...course,
                progress: { 
                  enrolled: false, 
                  progress: 0, 
                  completedContents: 0, 
                  totalContents: course.contents?.length || 0 
                },
                isEnrolled: false
              };
            }
          })
        );

        // Filtrar solo los cursos en los que está inscrito
        const enrolledCourses = coursesWithProgress.filter(course => course.isEnrolled);
        setCourses(enrolledCourses);
        
      } catch (error) {
        console.error("Error cargando mis cursos:", error);
        if (error.response?.status === 401) {
          navigate("/login");
        }
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [navigate]); // ✅ Solo depende de navigate

  // ... el resto de tu componente permanece igual
  const getFilteredCourses = () => {
    switch (filter) {
      case "in-progress":
        return courses.filter(course => 
          course.progress.progress > 0 && course.progress.progress < 100
        );
      case "completed":
        return courses.filter(course => course.progress.progress === 100);
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
      {/* ... el resto de tu JSX */}
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
              {courses.filter(c => c.progress.progress > 0 && c.progress.progress < 100).length}
            </span>
            <span className="stat-label">En Progreso</span>
          </div>
          <div className="stat-card">
            <span className="stat-number">
              {courses.filter(c => c.progress.progress === 100).length}
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
            En Progreso ({courses.filter(c => c.progress.progress > 0 && c.progress.progress < 100).length})
          </button>
          <button 
            className={`filter-tab ${filter === "completed" ? "active" : ""}`}
            onClick={() => setFilter("completed")}
          >
            Completados ({courses.filter(c => c.progress.progress === 100).length})
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
                  {course.progress.progress === 100 && (
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
                      <span className="progress-percent">{course.progress.progress}%</span>
                    </div>
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${course.progress.progress}%` }}
                      ></div>
                    </div>
                    <div className="progress-stats">
                      {course.progress.completedContents} de {course.progress.totalContents} lecciones
                    </div>
                  </div>

                  <div className="course-actions">
                    <button
                      className="view-details-btn"
                      onClick={() => handleViewCourse(course._id)}
                    >
                      Ver Detalles
                    </button>
                    
                    {course.progress.progress === 100 ? (
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
                        {course.progress.progress === 0 ? 'Comenzar' : 'Continuar'}
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