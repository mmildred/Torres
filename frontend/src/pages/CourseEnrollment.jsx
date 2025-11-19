import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getUser } from "../auth";
import "./Courses.css";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [progressByCourse, setProgressByCourse] = useState({});
  const user = getUser();
  const navigate = useNavigate();

  const fetchCourses = useCallback(async () => {
    try {
      const res = await api.get("/courses");
      const coursesWithOwner = res.data.map(course => ({
        ...course,
        owner: course.owner || { name: "Administrador" }
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
    if (!hasFetched || !courses.length) return;

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
  }, [hasFetched, courses]);

  const handleViewDetails = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  const handleEnroll = (courseId) => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    navigate(`/courses/${courseId}/enroll`);
  };

  if (!user) {
    return null;
  }

  return (
    <div className="courses-container">
      <div className="courses-header">
        <h2 className="title">Catálogo de Cursos</h2>
        <p className="subtitle">
          Explora nuestra selección de cursos especializados
        </p>

        {(user?.role === "teacher" || user?.role === "admin") && (
          <button
            className="create-btn"
            onClick={() => navigate("/courses/new")}
            title="Crear un nuevo curso"
          >
            + Crear curso
          </button>
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
            const prog = progressByCourse[course._id] || { total: 0, completed: 0, percent: 0 };
            const hasProgress = prog.percent > 0;
            
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
                </div>

                <div className="course-info">
                  <h3 className="course-title">{course.title}</h3>

                  <div className="course-meta">
                    <div className="meta-item">
                      <span className="meta-label">Creado por:</span>
                      <span className="meta-text instructor">
                        {course.owner?.name || course.instructor || "Administrador"}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Duración:</span>
                      <span className="meta-text">
                        {course.duration || "Auto-guiado"}
                      </span>
                    </div>
                  </div>

                  <p className="course-description">
                    {course.description?.slice(0, 120) || "Sin descripción disponible..."}
                    {course.description && course.description.length > 120 ? "..." : ""}
                  </p>

                  {/* Barra de progreso - MÁS ESPACIO */}
                  {hasProgress && (
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
                        <span>{prog.completed} de {prog.total} lecciones completadas</span>
                      </div>
                    </div>
                  )}

                  <div className="course-footer">
                    <div className="course-level">
                      <span className={`level-badge ${course.level?.toLowerCase() || 'beginner'}`}>
                        {course.level === 'beginner' ? 'Principiante' : 
                         course.level === 'intermediate' ? 'Intermedio' : 'Avanzado'}
                      </span>
                    </div>

                    <div className="course-actions">
                      <button
                        className="details-btn"
                        onClick={() => handleViewDetails(course._id)}
                      >
                        Ver detalles
                      </button>
                      
                      {/* SOLO UN BOTÓN DE INSCRIPCIÓN/CONTINUAR */}
                      {hasProgress ? (
                        <button
                          className="continue-btn"
                          onClick={() => navigate(`/courses/${course._id}/learn`)}
                        >
                          {prog.percent === 100 ? '🎉 Certificado' : '▶️ Continuar'}
                        </button>
                      ) : (
                        <button
                          className="enroll-btn"
                          onClick={() => handleEnroll(course._id)}
                        >
                          Inscribirse
                        </button>
                      )}
                    </div>
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