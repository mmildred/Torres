import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { getUser, isAuthenticated } from "../auth";
import "./Courses.css";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [progressByCourse, setProgressByCourse] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [error, setError] = useState(null);
  const [deletingById, setDeletingById] = useState({});
  const [offlineMode, setOfflineMode] = useState(false);

  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Cargar cursos desde cache (si existen)
  const loadCachedCourses = () => {
    try {
      const cachedCourses = localStorage.getItem("cached_courses");
      const cachedProgress = localStorage.getItem("cached_progress");

      if (cachedCourses) {
        console.log("📂 Cargando cursos desde cache");
        const parsedCourses = JSON.parse(cachedCourses);
        setCourses(parsedCourses);

        if (cachedProgress) {
          setProgressByCourse(JSON.parse(cachedProgress));
        }

        return parsedCourses.length > 0;
      }
    } catch (error) {
      console.error("Error cargando cache:", error);
    }
    return false;
  };

  const isCourseInstructor = (course) => {
    if (!user || !course) return false;

    const isAdmin = user.role === "admin";
    const isOwner = course.owner?._id?.toString() === user._id?.toString();
    const isInstructor = course.instructors?.some(
      (instructor) => instructor._id?.toString() === user._id?.toString()
    );

    return isAdmin || isOwner || isInstructor;
  };

  const fetchCourses = useCallback(async () => {
    try {
      console.log("🔄 Iniciando carga de cursos...");
      console.log("👤 Usuario actual:", user);

      setError(null);

      // Intentar cargar desde cache primero para mejor UX
      const hasCache = loadCachedCourses();

      const res = await api.get("/courses", {
        timeout: 10000,
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      console.log("✅ Respuesta del servidor - cantidad:", res.data.length);
      console.log("📋 Cursos recibidos:", res.data);

      const coursesWithOwner = res.data.map((course) => ({
        ...course,
        owner: course.owner || { name: "Administrador" },
        enrolled: false,
        progress: 0,
      }));

      console.log("📊 Cursos procesados:", coursesWithOwner.length);

      setCourses(coursesWithOwner);
      setOfflineMode(false);
      setHasFetched(true);

      // Guardar en cache
      localStorage.setItem("cached_courses", JSON.stringify(coursesWithOwner));
    } catch (err) {
      console.error("❌ Error cargando cursos:", err);

      if (err.code === "ERR_NETWORK" || err.code === "ECONNREFUSED") {
        setOfflineMode(true);
        console.log("🔌 Modo offline activado");

        if (!loadCachedCourses()) {
          setError("No se puede conectar al servidor y no hay cursos en cache");
        } else {
          setError("Modo offline: mostrando cursos en cache");
        }
      } else {
        setError(
          err.response?.data?.message || "Error al cargar los cursos"
        );
      }
      setHasFetched(true);
    }
  }, []); // ← DEPENDENCIAS VACÍAS

  const userId = user?._id;

  useEffect(() => {
    if (!hasFetched) {
      fetchCourses();
    }
  }, [hasFetched]); // ← SOLO hasFetched COMO DEPENDENCIA

  // Efecto para cargar progreso con manejo offline
  useEffect(() => {
    // Si no hay usuario, cursos o todavía no se han cargado, no hacer nada
    if (!userId || !hasFetched || !courses.length) return;

    let cancelled = false;

    (async () => {
      try {
        // Limitar a solo los primeros 8 cursos para evitar sobrecarga
        const coursesToCheck = courses.slice(0, 8);

        const results = await Promise.allSettled(
          coursesToCheck.map(async (c) => {
            try {
              const { data } = await api.get(
                `/courses/${c._id}/progress/me`,
                {
                  timeout: 5000,
                }
              );
              return [c._id, { ...data, offline: false }];
            } catch (error) {
              if (error.response?.status === 404) {
                return [
                  c._id,
                  {
                    enrolled: false,
                    progress: 0,
                    completedContents: 0,
                    totalContents: 0,
                    error: "not_enrolled",
                    offline: false,
                  },
                ];
              }

              if (
                error.code === "ERR_NETWORK" ||
                error.code === "ECONNREFUSED"
              ) {
                console.log(
                  `📴 Sin conexión para progreso del curso ${c._id}`
                );
                return [
                  c._id,
                  {
                    enrolled: false,
                    progress: 0,
                    completedContents: 0,
                    totalContents: 0,
                    error: "offline",
                    offline: true,
                  },
                ];
              }

              console.warn(
                `Error cargando progreso para curso ${c._id}:`,
                error.response?.status
              );
              return [
                c._id,
                {
                  enrolled: false,
                  progress: 0,
                  completedContents: 0,
                  totalContents: 0,
                  error: "unknown",
                  offline: false,
                },
              ];
            }
          })
        );

        if (!cancelled) {
          const successfulResults = results
            .filter((result) => result.status === "fulfilled")
            .map((result) => result.value);

          const newProgress = Object.fromEntries(successfulResults);

          setProgressByCourse((prev) => ({
            ...prev,
            ...newProgress,
          }));

          const prevCached = JSON.parse(
            localStorage.getItem("cached_progress") || "{}"
          );
          localStorage.setItem(
            "cached_progress",
            JSON.stringify({
              ...prevCached,
              ...newProgress,
            })
          );
        }
      } catch (e) {
        console.error("Error general cargando progreso:", e);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId, hasFetched, courses.length]);

  // Función para cargar progreso individual (para inscripciones nuevas)
  const loadCourseProgress = async (courseId) => {
    try {
      const { data } = await api.get(`/courses/${courseId}/progress/me`);
      const progressData = { ...data, offline: false };

      setProgressByCourse((prev) => ({
        ...prev,
        [courseId]: progressData,
      }));

      // Actualizar cache
      const cachedProgress = JSON.parse(
        localStorage.getItem("cached_progress") || "{}"
      );
      cachedProgress[courseId] = progressData;
      localStorage.setItem(
        "cached_progress",
        JSON.stringify(cachedProgress)
      );
    } catch (error) {
      console.warn(
        `Error cargando progreso individual para ${courseId}:`,
        error
      );
    }
  };

  const handleDeleteCourse = async (courseId) => {
    if (user?.role !== "admin") return;

    const ok = window.confirm(
      "¿Seguro que deseas borrar este curso? Esta acción no se puede deshacer."
    );
    if (!ok) return;

    try {
      setDeletingById((prev) => ({ ...prev, [courseId]: true }));
      await api.delete(`/courses/${courseId}`);
      setCourses((prev) => prev.filter((c) => c._id !== courseId));

      // Limpiar progreso del curso eliminado
      setProgressByCourse((prev) => {
        const newProgress = { ...prev };
        delete newProgress[courseId];
        return newProgress;
      });

      // Actualizar cache de cursos
      const cachedCourses = JSON.parse(
        localStorage.getItem("cached_courses") || "[]"
      );
      const updatedCache = cachedCourses.filter(
        (c) => c._id !== courseId
      );
      localStorage.setItem(
        "cached_courses",
        JSON.stringify(updatedCache)
      );

      // Actualizar cache de progreso
      const cachedProgress = JSON.parse(
        localStorage.getItem("cached_progress") || "{}"
      );
      delete cachedProgress[courseId];
      localStorage.setItem(
        "cached_progress",
        JSON.stringify(cachedProgress)
      );

      alert("Curso eliminado correctamente.");
    } catch (err) {
      console.error("Error al eliminar curso:", err);
      alert("No se pudo eliminar el curso.");
    } finally {
      setDeletingById((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleViewDetails = (courseId) => {
    if (!user) {
      navigate("/register", {
        state: {
          message:
            "Regístrate para ver los detalles del curso y comenzar a aprender",
          redirectTo: `/courses/${courseId}`,
        },
      });
      return;
    }
    navigate(`/courses/${courseId}`);
  };

  const handleEnroll = async (courseId) => {
    if (!user) {
      navigate("/register", {
        state: {
          message:
            "Regístrate para inscribirte en este curso y comenzar tu aprendizaje",
          redirectTo: `/courses/${courseId}`,
        },
      });
      return;
    }

    try {
      setLoadingStates((prev) => ({ ...prev, [courseId]: true }));
      await api.post(`/courses/${courseId}/enroll`);
      alert("🎉 ¡Te has inscrito exitosamente al curso!");

      // Actualizar progreso después de inscribirse
      await loadCourseProgress(courseId);
    } catch (err) {
      console.error("Error al inscribirse:", err);
      if (err.response?.status === 400) {
        alert("Ya estás inscrito en este curso");
        // Si ya está inscrito, cargar su progreso
        await loadCourseProgress(courseId);
      } else {
        alert(
          err.response?.data?.message ||
            "Error al inscribirse en el curso"
        );
      }
    } finally {
      setLoadingStates((prev) => ({ ...prev, [courseId]: false }));
    }
  };

  const handleAccessCourse = (courseId) => {
    if (!user) {
      navigate("/register", {
        state: {
          message: "Regístrate para acceder al contenido del curso",
          redirectTo: `/courses/${courseId}/learn`,
        },
      });
      return;
    }

    const prog = progressByCourse[courseId];
    if (prog?.enrolled) {
      navigate(`/courses/${courseId}/learn`);
    } else {
      navigate(`/courses/${courseId}`);
    }
  };

  const handleQuickRegister = () => {
    navigate("/register", {
      state: {
        message: "Crea tu cuenta gratis para acceder a todos los cursos",
        quickRegister: true,
      },
    });
  };

  const retryConnection = () => {
    setOfflineMode(false);
    setError(null);
    fetchCourses();
  };

  // Estado de carga
  if (!hasFetched) {
    return (
      <div className="courses-container">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Cargando cursos...</p>
        </div>
      </div>
    );
  }

  if (error && hasFetched && courses.length === 0) {
    return (
      <div className="courses-container">
        <div className="error-state">
          <div className="error-icon">⚠️</div>
          <h3>Error al cargar los cursos</h3>
          <p>{error}</p>
          <div className="error-actions">
            <button onClick={retryConnection} className="btn btn-primary">
              🔄 Reintentar conexión
            </button>
            <button
              onClick={() => window.location.reload()}
              className="btn btn-outline"
            >
              🔃 Recargar página
            </button>
          </div>
          {offlineMode && (
            <div className="troubleshooting">
              <h4>Solucionar problemas:</h4>
              <ul>
                <li>✅ Verifica que el servidor backend esté corriendo</li>
                <li>
                  ✅ Ejecuta <code>npm start</code> en la carpeta del backend
                </li>
                <li>✅ Verifica que el puerto 4000 esté disponible</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="courses-container">
      {/* Banner de modo offline */}
      {offlineMode && (
        <div className="offline-banner">
          <div className="offline-content">
            <span>⚡ Modo offline</span>
            <p>
              Mostrando versión en cache. Algunas funciones pueden estar
              limitadas.
            </p>
            <button
              className="btn btn-sm btn-outline"
              onClick={retryConnection}
            >
              🔄 Reintentar conexión
            </button>
          </div>
        </div>
      )}

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
              <p>
                Regístrate gratis y accede a todos nuestros cursos y contenido
                exclusivo
              </p>
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

      <div className="courses-grid">
        {courses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📚</div>
            <h3>No hay cursos disponibles</h3>
            <p>
              {offlineMode
                ? "No hay cursos en cache. Conéctate a internet para cargar los cursos."
                : "Pronto agregaremos nuevos cursos a nuestro catálogo"}
            </p>
            {offlineMode ? (
              <button className="btn btn-primary" onClick={retryConnection}>
                🔄 Reintentar conexión
              </button>
            ) : (
              user?.role === "teacher" && (
                <button
                  onClick={() => navigate("/courses/new")}
                  className="btn btn-primary"
                >
                  Crear Primer Curso
                </button>
              )
            )}
          </div>
        ) : (
          courses.map((course) => {
            // Manejo seguro del progreso con valores por defecto
            const prog = progressByCourse[course._id] || {
              enrolled: false,
              progress: 0,
              completedContents: 0,
              totalContents: 0,
              offline: false,
            };

            const isLoading = loadingStates[course._id];
            const userIsInstructor = isCourseInstructor(course);
            const isEnrolled = prog.enrolled;

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
                      e.target.src =
                        "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80";
                    }}
                    loading="lazy"
                  />
                  <div className="course-category">
                    {course.category || "General"}
                  </div>
                  <div className="course-level-tag">
                    <span
                      className={`level-badge ${
                        course.level?.toLowerCase() || "beginner"
                      }`}
                    >
                      {course.level === "beginner"
                        ? "Principiante"
                        : course.level === "intermediate"
                        ? "Intermedio"
                        : course.level === "advanced"
                        ? "Avanzado"
                        : "Principiante"}
                    </span>
                  </div>

                  {/* Badge de inscrito */}
                  {isEnrolled && (
                    <div className="enrolled-badge">✅ Inscrito</div>
                  )}

                  {/* Badge de offline */}
                  {prog.offline && (
                    <div className="offline-badge">📴 Offline</div>
                  )}
                </div>

                <div className="course-content">
                  <h3 className="course-title">{course.title}</h3>

                  <div className="course-meta">
                    {user && (
                      <div className="meta-item">
                        <span className="meta-icon">👤</span>
                        <span className="meta-text instructor">
                          {course.owner?.name ||
                            course.instructor ||
                            "Administrador"}
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
                    {course.description?.slice(0, 120) ||
                      "Sin descripción disponible..."}
                    {course.description &&
                    course.description.length > 120
                      ? "..."
                      : ""}
                  </p>

                  {/* Mostrar progreso solo si está inscrito */}
                  {user && isEnrolled && (
                    <div className="progress-container">
                      <div className="progress-header">
                        <span className="progress-label">
                          Tu progreso {prog.offline && "(offline)"}
                        </span>
                        <span className="progress-percent">
                          {prog.progress}%
                        </span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${prog.progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-stats">
                        {prog.completedContents} de {prog.totalContents}{" "}
                        lecciones completadas
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
                      isEnrolled ? (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleAccessCourse(course._id)}
                        >
                          <span className="btn-icon">▶️</span>
                          {prog.progress === 100
                            ? "🎉 Certificado"
                            : "Continuar"}
                        </button>
                      ) : userIsInstructor ? (
                        <button
                          className="btn btn-primary"
                          onClick={() =>
                            navigate(`/courses/${course._id}/manage`)
                          }
                        >
                          <span className="btn-icon">⚙️</span>
                          Gestionar
                        </button>
                      ) : (
                        <button
                          className="btn btn-primary"
                          onClick={() => handleEnroll(course._id)}
                          disabled={isLoading || offlineMode}
                        >
                          <span className="btn-icon">🎯</span>
                          {isLoading
                            ? "Inscribiendo..."
                            : offlineMode
                            ? "Sin conexión"
                            : "Inscribirse"}
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
                        onClick={() =>
                          handleDeleteCourse(course._id)
                        }
                        disabled={
                          !!deletingById[course._id] || offlineMode
                        }
                        title="Borrar curso"
                      >
                        <span className="btn-icon">
                          {deletingById[course._id] ? "⏳" : "🗑️"}
                        </span>
                        {deletingById[course._id]
                          ? "Eliminando..."
                          : "Eliminar"}
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