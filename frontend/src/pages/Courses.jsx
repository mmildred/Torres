import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getUser } from "../auth";
import "./Courses.css";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [progressByCourse, setProgressByCourse] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const user = getUser();
  const navigate = useNavigate();
  const [deletingById, setDeletingById] = useState({});

  // ✅ CORREGIDO: Función para verificar si es instructor del curso
  const isCourseInstructor = (course) => {
    if (!user || !course) return false;
    
    const isAdmin = user.role === 'admin';
    const isOwner = course.owner?._id.toString() === user._id.toString();
    const isInstructor = course.instructors?.some(instructor => 
      instructor._id.toString() === user._id.toString()
    );
    
    return isAdmin || isOwner || isInstructor;
  };

  const handleDeleteCourse = async (courseId) => {
    if (user?.role !== "admin") return;
    const ok = window.confirm("¿Seguro que deseas borrar este curso? Esta acción no se puede deshacer.");
    if (!ok) return;

    try {
      setDeletingById(prev => ({ ...prev, [courseId]: true }));
      await api.delete(`/courses/${courseId}`);

      setCourses(prev => prev.filter(c => c._id !== courseId));
      setProgressByCourse(prev => {
        const clone = { ...prev };
        delete clone[courseId];
        return clone;
      });

      alert("Curso eliminado correctamente.");
    } catch (err) {
      console.error("Error al eliminar curso:", err);
      alert("No se pudo eliminar el curso.");
    } finally {
      setDeletingById(prev => ({ ...prev, [courseId]: false }));
    }
  };

  const fetchCourses = useCallback(async () => {
    try {
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
      setHasFetched(true);
    }
  }, []);

  useEffect(() => {
    if (!hasFetched) {
      fetchCourses();
    }
  }, [hasFetched, fetchCourses]);

  useEffect(() => {
    if (!user || !hasFetched || !courses.length) return;

    let cancelled = false;
    (async () => {
      try {
        const results = await Promise.all(
          courses.map(async (c) => {
            try {
              const { data } = await api.get(`/courses/${c._id}/progress/me`);
              return [c._id, data];
            } catch {
              return [c._id, { total: 0, completed: 0, percent: 0 }];
            }
          })
        );
        if (!cancelled) {
          setProgressByCourse(Object.fromEntries(results));
        }
      } catch (e) {
        console.error("Error cargando progreso por curso:", e);
      }
    })();

    return () => { cancelled = true; };
  }, [user, hasFetched, courses]);

  const handleViewDetails = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleEnroll = async (courseId) => {
    if (!user) {
      navigate("/login", { 
        state: { 
          message: "Necesitas una cuenta para inscribirte en este curso",
          redirectTo: `/courses/${courseId}`
        } 
      });
      return;
    }

    try {
      await api.post(`/courses/${courseId}/enroll`);
      alert("Te has inscrito exitosamente al curso");
      fetchCourses();
    } catch (err) {
      console.error("Error al inscribirse:", err);
      alert("Error al inscribirse en el curso");
    }
  };

  const handleQuickRegister = () => {
    navigate("/register", {
      state: {
        message: "Crea tu cuenta para empezar a aprender hoy mismo",
        quickRegister: true
      }
    });
  };

  return (
    <div className="courses-container">
      <div className="courses-header">
        <h2 className="title">Catálogo de Cursos</h2>
        <p className="subtitle">
          Explora nuestra selección de cursos especializados
        </p>  
        
        {/* Solo mostrar botón de crear curso si está logueado y es teacher/admin */}
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

        {/* Banner para usuarios no logueados */}
        {!user && (
          <div className="guest-banner">
            <div className="guest-banner-content">
              <h3>¿Listo para empezar a aprender?</h3>
              <p>Únete a nuestra plataforma y accede a todos los cursos</p>
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
                  Iniciar Sesión
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="courses-grid">
        {courses.length === 0 && hasFetched ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No hay cursos disponibles</h3>
            <p>Pronto agregaremos nuevos cursos a nuestro catálogo</p>
          </div>
        ) : (
          courses.map((course) => {
            // ✅ CORREGIDO: Usar progressByCourse en lugar de prog
            const prog = progressByCourse[course._id] || { total: 0, completed: 0, percent: 0 };
            const isEnrolled = course.enrolled;
            const progress = course.progress || 0;
            const isLoading = loadingStates[course._id];
            const userIsInstructor = isCourseInstructor(course);

            return (
              <div key={course._id} className="course-card">
                {/* Header de la card con imagen y categoría */}
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
                
                {/* Contenido de la card */}
                <div className="course-content">
                  <h3 className="course-title">{course.title}</h3>

                  <div className="course-meta">
                    {/* SOLO MOSTRAR INSTRUCTOR SI ESTÁ LOGUEADO */}
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
                    <div className="meta-item">
                      <span className="meta-label">Nivel:</span>
                      <span className="meta-text">
                        {course.level === 'beginner' ? 'Principiante' : 
                         course.level === 'intermediate' ? 'Intermedio' : 
                         course.level === 'advanced' ? 'Avanzado' : 'Principiante'}
                      </span>
                    </div>
                  </div>

                  <p className="course-description">
                    {course.description?.slice(0, 120) || "Sin descripción disponible..."}
                    {course.description && course.description.length > 120 ? "..." : ""}
                  </p>

                  {/* Progreso - solo para usuarios logueados */}
                  {user && prog.percent > 0 && (
                    <div className="progress-container">
                      <div className="progress-header">
                        <span className="progress-label">Tu progreso</span>
                        <span className="progress-percent">{prog.percent}%</span>
                      </div>
                      <div className="progress-bar">
                        <div 
                          className="progress-fill" 
                          style={{ width: `${prog.percent}%` }}
                        ></div>
                      </div>
                      <div className="progress-stats">
                        {prog.completed} de {prog.total} lecciones completadas
                      </div>
                    </div>
                  )}

                  {/* Mensaje para usuarios no logueados */}
                  {!user && (
                    <div className="guest-prompt">
                      <p>Inicia sesión para acceder a este curso</p>
                    </div>
                  )}

                  {/* Acciones */}
                  <div className="course-actions">
                    {/* SOLO MOSTRAR "VER DETALLES" SI ESTÁ LOGUEADO */}
                    {user && (
                      <button 
                        className="btn btn-secondary"
                        onClick={() => handleViewDetails(course._id)}
                      >
                        <span className="btn-icon">👁️</span>
                        Ver detalles
                      </button>
                    )}

                    {/* ✅ CORREGIDO: Mostrar botones según el estado */}
                    {user ? (
                      prog.percent > 0 ? (
                        // Si tiene progreso, mostrar "Continuar"
                        <button 
                          className="btn btn-primary"
                          onClick={() => navigate(`/courses/${course._id}/learn`)}
                        >
                          <span className="btn-icon">▶️</span>
                          {prog.percent === 100 ? '🎉 Certificado' : 'Continuar'}
                        </button>
                      ) : userIsInstructor ? (
                        // Si es instructor, mostrar "Gestionar"
                        <button 
                          className="btn btn-primary"
                          onClick={() => navigate(`/courses/${course._id}/manage`)}
                        >
                          <span className="btn-icon">⚙️</span>
                          Gestionar
                        </button>
                      ) : (
                        // Si no tiene progreso y no es instructor, mostrar "Inscribirse"
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
                      // Si no está logueado
                      <button 
                        className="btn btn-primary"
                        onClick={() => navigate("/login")}
                      >
                        <span className="btn-icon">🔒</span>
                        Acceder al Curso
                      </button>
                    )}

                    {/* Botón de eliminar solo para admin logueado */}
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
    </div>
  );
}