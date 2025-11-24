import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { isAuthenticated, getUser } from "../auth";
import "./MyCourses.css";

export default function MyCourses() {
  const [courses, setCourses] = useState([]);
  const [instructorStats, setInstructorStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const user = getUser();

  const isTeacher = user?.role === 'teacher' || user?.role === 'admin';

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }

    loadCourses();
  }, [navigate]);

  const loadCourses = async () => {
    try {
      setLoading(true);

      if (isTeacher) {
        // Solo cargar estadísticas de profesor
        console.log("👨‍🏫 Cargando estadísticas de instructor...");
        const statsRes = await api.get("/courses/instructor/stats");
        setInstructorStats(statsRes.data);
        setCourses(statsRes.data.courses || []);
      } else {
        // Para estudiantes, cargar cursos inscritos
        console.log("🎓 Cargando cursos como estudiante...");
        const myCoursesRes = await api.get("/courses/my-courses");
        setCourses(myCoursesRes.data);
      }
      
    } catch (error) {
      console.error("Error cargando cursos:", error);
      
      // Fallback para estudiantes
      if (!isTeacher) {
        await loadCoursesWithFallback();
      }
    } finally {
      setLoading(false);
    }
  };

  const loadCoursesWithFallback = async () => {
    try {
      const allCoursesRes = await api.get("/courses");
      const allCourses = allCoursesRes.data;
      
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
            return null;
          }
        })
      );
      
      const enrolledCourses = coursesWithProgress.filter(course => course !== null);
      setCourses(enrolledCourses);
    } catch (fallbackError) {
      console.error("Error en fallback:", fallbackError);
    }
  };

  const handleViewCourse = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleManageCourse = (courseId) => {
    navigate(`/courses/${courseId}/manage`);
  };

  const handleImageError = (e) => {
    e.target.src = "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80";
  };

  if (loading) {
    return (
      <div className="my-courses-loading">
        <div className="loading-spinner"></div>
        <p>
          {isTeacher ? "Cargando tus cursos como instructor..." : "Cargando tus cursos..."}
        </p>
      </div>
    );
  }

  return (
    <div className="my-courses">
      <div className="my-courses-header">
        <h1>
          {isTeacher ? "Mis Cursos como Instructor" : "Mis Cursos"}
        </h1>
        <p>
          {isTeacher 
            ? "Gestiona tus cursos y revisa el progreso de tus estudiantes" 
            : "Continúa tu aprendizaje y revisa tu progreso"
          }
        </p>
        
        {/* Estadísticas */}
        <div className="courses-stats">
          {isTeacher && instructorStats ? (
            // Estadísticas para Profesor
            <>
              <div className="stat-card teacher-stat">
                <span className="stat-number">{instructorStats.totalCourses}</span>
                <span className="stat-label">Cursos Creados</span>
              </div>
              <div className="stat-card teacher-stat">
                <span className="stat-number">{instructorStats.totalStudents}</span>
                <span className="stat-label">Estudiantes Únicos</span>
              </div>
              <div className="stat-card teacher-stat">
                <span className="stat-number">{instructorStats.totalEnrollments}</span>
                <span className="stat-label">Total Inscripciones</span>
              </div>
              <div className="stat-card teacher-stat">
                <span className="stat-number">
                  {instructorStats.courses.reduce((acc, course) => acc + (course.studentCount || 0), 0)}
                </span>
                <span className="stat-label">Estudiantes Activos</span>
              </div>
            </>
          ) : (
            // Estadísticas para Estudiante
            <>
              <div className="stat-card">
                <span className="stat-number">{courses.length}</span>
                <span className="stat-label">Total Cursos</span>
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
              <div className="stat-card">
                <span className="stat-number">
                  {Math.round(courses.reduce((acc, course) => acc + (course.progress?.progress || 0), 0) / (courses.length || 1))}%
                </span>
                <span className="stat-label">Progreso Promedio</span>
              </div>
            </>
          )}
        </div>
      </div>

      <div className="my-courses-content">
        {courses.length === 0 ? (
          <div className="empty-courses">
            <div className="empty-icon">
              {isTeacher ? "👨‍🏫" : "📚"}
            </div>
            <h3>
              {isTeacher 
                ? "Aún no has creado cursos" 
                : "No estás inscrito en ningún curso"
              }
            </h3>
            <p>
              {isTeacher 
                ? "Crea tu primer curso y comienza a compartir tu conocimiento con estudiantes"
                : "Explora nuestro catálogo y encuentra cursos que te interesen"
              }
            </p>
            {isTeacher ? (
              <button 
                className="create-course-btn"
                onClick={() => navigate("/instructor/courses/create")}
              >
                Crear Mi Primer Curso
              </button>
            ) : (
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
            {courses.map((course) => (
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
                  
                  {/* Badges para profesor */}
                  {isTeacher && course.studentCount > 0 && (
                    <div className="students-badge">
                      👥 {course.studentCount} estudiantes
                    </div>
                  )}
                  
                  {/* Badge para estudiante */}
                  {!isTeacher && course.progress?.progress === 100 && (
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
                    
                    {/* Información adicional para profesor */}
                    {isTeacher && (
                      <div className="meta-item">
                        <span className="meta-label">Estudiantes:</span>
                        <span className="meta-text highlight">
                          {course.studentCount || 0} inscritos
                        </span>
                      </div>
                    )}
                    
                    {/* Progreso para estudiantes */}
                    {!isTeacher && (
                      <div className="meta-item">
                        <span className="meta-label">Progreso:</span>
                        <span className="meta-text highlight">
                          {course.progress?.progress || 0}%
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Barra de progreso solo para estudiantes */}
                  {!isTeacher && (
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
                  )}

<div className="course-actions">
  {isTeacher ? (
    // Acciones para Profesor - Solo 2 botones
    <>
      <button
        className="btn-primary"
        onClick={() => navigate(`/courses/${course._id}/manage`)}
      >
        ⚙️ Gestionar Curso
      </button>
      <button
        className="btn-analytics"
        onClick={() => navigate(`/courses/${course._id}/analytics`)}
      >
        📊 Analytics
      </button>
    </>
  ) : (
    // Acciones para Estudiante - Se mantienen igual
    <>
      <button
        className="btn-secondary"
        onClick={() => handleViewCourse(course._id)}
      >
        👁️ Detalles
      </button>
      
      {course.progress?.progress === 100 ? (
        <button
          className="btn-success"
          onClick={() => navigate(`/courses/${course._id}/review`)}
        >
          🎉 Revisar
        </button>
      ) : (
        <button
          className="btn-primary"
          onClick={() => navigate(`/courses/${course._id}/learn`)}
        >
          {course.progress?.progress === 0 ? '🚀 Comenzar' : '➡️ Continuar'}
        </button>
      )}
    </>
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