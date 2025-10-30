// Courses.jsx - VERSIÓN CON MEJOR MANEJO DE ERRORES 404
import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getUser, isAuthenticated } from "../auth";
import "./Courses.css";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [progressByCourse, setProgressByCourse] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [error, setError] = useState(null);
  const user = getUser();
  const navigate = useNavigate();
  const [deletingById, setDeletingById] = useState({});

  const isCourseInstructor = (course) => {
    if (!user || !course) return false;
    
    const isAdmin = user.role === 'admin';
    const isOwner = course.owner?._id?.toString() === user._id?.toString();
    const isInstructor = course.instructors?.some(instructor => 
      instructor._id?.toString() === user._id?.toString()
    );
    
    return isAdmin || isOwner || isInstructor;
  };

  const fetchCourses = useCallback(async () => {
    try {
      setError(null);
      const res = await api.get("/courses");
      const coursesWithOwner = res.data.map(course => ({
        ...course,
        owner: course.owner || { name: "Administrador" },
        enrolled: false,
        progress: 0
      }));
      setCourses(coursesWithOwner);
      setHasFetched(true);
    } catch (err) {
      console.error("Error cargando cursos:", err);
      setError(err.response?.data?.message || "Error al cargar los cursos");
      setHasFetched(true);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched) {
      fetchCourses();
    }
  }, [hasFetched, fetchCourses]);

  // ✅ MEJOR MANEJO DE ERRORES 404 EN PROGRESO
  useEffect(() => {
    if (!user || !hasFetched || !courses.length) return;

    let cancelled = false;
    
    (async () => {
      try {
        const results = await Promise.allSettled(
          courses.map(async (c) => {
            try {
              const { data } = await api.get(`/courses/${c._id}/progress/me`);
              return [c._id, data];
            } catch (error) {
              // ✅ ERROR 404 ES NORMAL - NO ESTÁ INSCRITO
              if (error.response?.status === 404) {
                return [c._id, { 
                  enrolled: false, 
                  progress: 0, 
                  completedContents: 0, 
                  totalContents: 0,
                  error: 'not_enrolled'
                }];
              }
              // ✅ OTRO ERROR - REGRESAR VALORES POR DEFECTO
              console.warn(`Error cargando progreso para curso ${c._id}:`, error.response?.status);
              return [c._id, { 
                enrolled: false, 
                progress: 0, 
                completedContents: 0, 
                totalContents: 0,
                error: 'unknown'
              }];
            }
          })
        );

        if (!cancelled) {
          const successfulResults = results
            .filter(result => result.status === 'fulfilled')
            .map(result => result.value);
          
          setProgressByCourse(Object.fromEntries(successfulResults));
        }
      } catch (e) {
        console.error("Error general cargando progreso:", e);
      }
    })();

    return () => { cancelled = true; };
  }, [user, hasFetched, courses]);

  const handleDeleteCourse = async (courseId) => {
    if (user?.role !== "admin") return;
    const ok = window.confirm("¿Seguro que deseas borrar este curso? Esta acción no se puede deshacer.");
    if (!ok) return;

    try {
      setDeletingById(prev => ({ ...prev, [courseId]: true }));
      await api.delete(`/courses/${courseId}`);
      setCourses(prev => prev.filter(c => c._id !== courseId));
      alert("Curso eliminado correctamente.");
    } catch (err) {
      console.error("Error al eliminar curso:", err);
      alert("No se pudo eliminar el curso.");
    } finally {
      setDeletingById(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleViewDetails = (courseId) => {
    if (!user) {
      navigate("/register", {
        state: {
          message: "Regístrate para ver los detalles del curso y comenzar a aprender",
          redirectTo: `/courses/${courseId}`
        }
      });
      return;
    }
    navigate(`/courses/${courseId}`);
  };

  const handleEnroll = async (courseId) => {
    if (!user) {
      navigate("/register", {
        state: {
          message: "Regístrate para inscribirte en este curso y comenzar tu aprendizaje",
          redirectTo: `/courses/${courseId}`
        }
      });
      return;
    }

    try {
      setLoadingStates(prev => ({ ...prev, [courseId]: true }));
      await api.post(`/courses/${courseId}/enroll`);
      alert("🎉 ¡Te has inscrito exitosamente al curso!");
      
      // ✅ ACTUALIZAR PROGRESO DESPUÉS DE INSCRIBIRSE
      try {
        const { data } = await api.get(`/courses/${courseId}/progress/me`);
        setProgressByCourse(prev => ({
          ...prev,
          [courseId]: data
        }));
      } catch (error) {
        console.warn("Error actualizando progreso después de inscripción:", error);
      }
      
    } catch (err) {
      console.error("Error al inscribirse:", err);
      if (err.response?.status === 400) {
        alert('Ya estás inscrito en este curso');
      } else {
        alert(err.response?.data?.message || 'Error al inscribirse en el curso');
      }
    } finally {
      setLoadingStates(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const handleAccessCourse = (courseId) => {
    if (!user) {
      navigate("/register", {
        state: {
          message: "Regístrate para acceder al contenido del curso",
          redirectTo: `/courses/${courseId}/learn`
        }
      });
      return;
    }
    
    const prog = progressByCourse[courseId];
    if (prog?.progress > 0) {
      navigate(`/courses/${courseId}/learn`);
    } else {
      navigate(`/courses/${courseId}`);
    }
  };

  const handleQuickRegister = () => {
    navigate("/register", {
      state: {
        message: "Crea tu cuenta gratis para acceder a todos los cursos",
        quickRegister: true
      }
    });
  };

  if (error && hasFetched) {
    return (
      <div className="courses-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error al cargar los cursos</h3>
          <p>{error}</p>
          <button onClick={fetchCourses} className="btn btn-primary">
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="courses-container">
      <div className="courses-header">
        <h2 className="title">Catálogo de Cursos</h2>
        <p className="subtitle">
          Explora nuestra selección de cursos especializados
        </p>  
        
        {user && (user?.role === "teacher" || user?.role === "admin") && (
          <button
            className="create-btn"
            onClick={() => navigate("/courses/new")}
            title="Crear un nuevo curso"
          >
            <span className="btn-icon">+</span>
            Crear curso
          </button>
        )}

        {!user && (
          <div className="guest-banner">
            <div className="guest-banner-content">
              <h3>🎓 ¿Listo para empezar a aprender?</h3>
              <p>Regístrate gratis y accede a todos nuestros cursos y contenido exclusivo</p>
              <div className="guest-actions">
                <button 
                  onClick={handleQuickRegister}
                  className="guest-btn primary"
                >
                  Crear Cuenta Gratis
                </button>
                <button 
                  onClick={() => navigate("/login")}
                  className="guest-btn secondary"
                >
                  Ya tengo cuenta
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {!hasFetched ? (
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando cursos...</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No hay cursos disponibles</h3>
              <p>Pronto agregaremos nuevos cursos a nuestro catálogo</p>
              {user?.role === "teacher" && (
                <button 
                  onClick={() => navigate("/courses/new")}
                  className="btn btn-primary"
                >
                  Crear Primer Curso
                </button>
              )}
            </div>
          ) : (
            courses.map((course) => {
              // ✅ MANEJO SEGURO DEL PROGRESO
              const prog = progressByCourse[course._id] || { 
                enrolled: false, 
                progress: 0, 
                completedContents: 0, 
                totalContents: 0 
              };
              
              const isLoading = loadingStates[course._id];
              const userIsInstructor = isCourseInstructor(course);

              return (
                <div key={course._id} className="course-card">
                  <div className="course-image">
                    <img
                      src={
                        course.thumbnail ||
                        "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"
                      }
                      alt={course.title}
                      onError={(e) => {
                        e.target.src = "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80";
                      }}
                    />
                    <div className="course-category">
                      {course.category || "General"}
                    </div>
                    <div className="course-level-tag">
                      <span className={`level-badge ${course.level?.toLowerCase() || 'beginner'}`}>
                        {course.level === 'beginner' ? 'Principiante' : 
                         course.level === 'intermediate' ? 'Intermedio' : 
                         course.level === 'advanced' ? 'Avanzado' : 'Principiante'}
                      </span>
                    </div>
                  </div>
                  
                  <div className="course-content">
                    <h3 className="course-title">{course.title}</h3>

                    <div className="course-meta">
                      {user && (
                        <div className="meta-item">
                          <span className="meta-icon">👤</span>
                          <span className="meta-text instructor">
                            {course.owner?.name || course.instructor || "Administrador"}
                          </span>
                        </div>
                      )}
                      <div className="meta-item">
                        <span className="meta-icon">⏱️</span>
                        <span className="meta-text">
                          {course.duration || "Auto-guiado"}
                        </span>
                      </div>
                    </div>

                    <p className="course-description">
                      {course.description?.slice(0, 120) || "Sin descripción disponible..."}
                      {course.description && course.description.length > 120 ? "..." : ""}
                    </p>

                    {/* ✅ MOSTRAR PROGRESO SOLO SI ESTÁ INSCRITO Y TIENE PROGRESO */}
                    {user && prog.enrolled && prog.progress > 0 && (
                      <div className="progress-container">
                        <div className="progress-header">
                          <span className="progress-label">Tu progreso</span>
                          <span className="progress-percent">{prog.progress}%</span>
                        </div>
                        <div className="progress-bar">
                          <div 
                            className="progress-fill" 
                            style={{ width: `${prog.progress}%` }}
                          ></div>
                        </div>
                        <div className="progress-stats">
                          {prog.completedContents} de {prog.totalContents} lecciones completadas
                        </div>
                      </div>
                    )}

                    {!user && (
                      <div className="guest-prompt">
                        <p>Inicia sesión para acceder a este curso</p>
                      </div>
                    )}

                    <div className="course-actions">
                      {user && (
                        <button 
                          className="btn btn-secondary"
                          onClick={() => handleViewDetails(course._id)}
                        >
                          <span className="btn-icon">👁️</span>
                          Ver detalles
                        </button>
                      )}

                      {user ? (
                        prog.enrolled && prog.progress > 0 ? (
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleAccessCourse(course._id)}
                          >
                            <span className="btn-icon">▶️</span>
                            {prog.progress === 100 ? '🎉 Certificado' : 'Continuar'}
                          </button>
                        ) : userIsInstructor ? (
                          <button 
                            className="btn btn-primary"
                            onClick={() => navigate(`/courses/${course._id}/manage`)}
                          >
                            <span className="btn-icon">⚙️</span>
                            Gestionar
                          </button>
                        ) : (
                          <button 
                            className="btn btn-primary"
                            onClick={() => handleEnroll(course._id)}
                            disabled={isLoading}
                          >
                            <span className="btn-icon">🎯</span>
                            {isLoading ? "Inscribiendo..." : "Inscribirse"}
                          </button>
                        )
                      ) : (
                        <button 
                          className="btn btn-primary"
                          onClick={() => navigate("/register")}
                        >
                          <span className="btn-icon">🔒</span>
                          Acceder al Curso
                        </button>
                      )}

                      {user?.role === "admin" && (
                        <button
                          className="btn btn-danger"
                          onClick={() => handleDeleteCourse(course._id)}
                          disabled={!!deletingById[course._id]}
                          title="Borrar curso"
                        >
                          <span className="btn-icon">
                            {deletingById[course._id] ? "⏳" : "🗑️"}
                          </span>
                          {deletingById[course._id] ? "Eliminando..." : "Eliminar"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}