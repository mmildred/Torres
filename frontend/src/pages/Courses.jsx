import React, { useEffect, useState, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api";
import { getUser, isAuthenticated } from "../auth";
import "./Courses.css";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [progressByCourse, setProgressByCourse] = useState({});
  const [loadingStates, setLoadingStates] = useState({});
  const [error, setError] = useState(null);
  const [deletingById, setDeletingById] = useState({});
  const [offlineMode, setOfflineMode] = useState(false);

  // Estados para los filtros
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedLevel, setSelectedLevel] = useState("all");
  const [categories, setCategories] = useState([]);

  const user = getUser();
  const navigate = useNavigate();
  const location = useLocation();

  // Función para verificar si el curso está abierto para inscripción
  const isCourseOpenForEnrollment = (course) => {
    if (!course.hasEndDate) return true; // Sin fecha límite, siempre abierto
    
    const now = new Date();
    const enrollmentEnd = new Date(course.enrollmentEndDate);
    
    return now <= enrollmentEnd && !course.isClosed;
  };

  // Función para verificar si el curso está cerrado
  const isCourseClosed = (course) => {
    if (course.isClosed) return true;
    if (!course.hasEndDate) return false;
    
    const now = new Date();
    const courseEnd = new Date(course.courseEndDate);
    
    return now > courseEnd;
  };

  // Función para formatear la fecha
  const formatDate = (dateString) => {
    if (!dateString) return "No definida";
    return new Date(dateString).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Componente para mostrar el badge de estado del curso
  const CourseStatusBadge = ({ course }) => {
    // Si el curso no tiene fechas, mostrar "Disponible"
    if (!course.hasEndDate) {
      return <div className="course-status-badge available">🟢 Disponible</div>;
    }
    
    if (isCourseClosed(course)) {
      return <div className="course-status-badge closed">🔒 Cerrado</div>;
    }
    
    if (!isCourseOpenForEnrollment(course)) {
      return <div className="course-status-badge enrollment-closed">⏰ Inscripciones Cerradas</div>;
    }
    
    return <div className="course-status-badge open">✅ Abierto</div>;
  };

  // Componente para mostrar información de fechas
  const CourseDateInfo = ({ course }) => {
    // Si el curso no tiene fechas definidas, mostrar duración normal
    if (!course.hasEndDate) {
      return (
        <div className="course-duration-info">
          <div className="duration-item">
            <span className="duration-icon">⏱️</span>
            <span className="duration-text">{course.duration || "Duración flexible"}</span>
          </div>
          <div className="duration-note">
            Curso disponible permanentemente
          </div>
        </div>
      );
    }
    
    const now = new Date();
    const enrollmentEnd = new Date(course.enrollmentEndDate);
    const courseEnd = new Date(course.courseEndDate);
    
    return (
      <div className="course-dates-info">
        <div className="date-item">
          <span className="date-label">Inscripciones hasta:</span>
          <span className="date-value">{formatDate(course.enrollmentEndDate)}</span>
        </div>
        <div className="date-item">
          <span className="date-label">Cierra el:</span>
          <span className="date-value">{formatDate(course.courseEndDate)}</span>
        </div>
        
        {/* Contador regresivo */}
        {now < enrollmentEnd && (
          <div className="countdown">
            <span className="countdown-text">
              {Math.ceil((enrollmentEnd - now) / (1000 * 60 * 60 * 24))} días para inscribirse
            </span>
          </div>
        )}
      </div>
    );
  };



  // Cargar cursos desde cache (si existen)
  const loadCachedCourses = () => {
    try {
      const cachedCourses = localStorage.getItem("cached_courses");
      const cachedProgress = localStorage.getItem("cached_progress");

      if (cachedCourses) {
        console.log("📂 Cargando cursos desde cache");
        const parsedCourses = JSON.parse(cachedCourses);
        setCourses(parsedCourses);
        setFilteredCourses(parsedCourses);

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

  // Extraer categorías únicas de los cursos
  const extractCategories = (coursesList) => {
    const uniqueCategories = [...new Set(coursesList
      .map(course => course.category)
      .filter(category => category && category.trim() !== "")
    )].sort();
    
    setCategories(uniqueCategories);
  };

  // Aplicar filtros
  const applyFilters = useCallback(() => {
    let filtered = courses;

    // Filtro por término de búsqueda (título o descripción)
    if (searchTerm) {
      filtered = filtered.filter(course =>
        course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        course.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtro por categoría
    if (selectedCategory !== "all") {
      filtered = filtered.filter(course => 
        course.category === selectedCategory
      );
    }

    // Filtro por nivel
    if (selectedLevel !== "all") {
      filtered = filtered.filter(course => 
        course.level?.toLowerCase() === selectedLevel.toLowerCase()
      );
    }

    setFilteredCourses(filtered);
  }, [courses, searchTerm, selectedCategory, selectedLevel]);

  // Efecto para aplicar filtros cuando cambian los criterios
  useEffect(() => {
    if (courses.length > 0) {
      applyFilters();
    }
  }, [courses, applyFilters]);

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
      console.log("📋 Cursos recibidos (primer curso):", res.data[0]);

      // Agregar datos de prueba para demostrar la funcionalidad
      const enhancedCourses = enhanceCoursesWithDates(res.data);

      const coursesWithOwner = enhancedCourses.map((course) => ({
        ...course,
        owner: course.owner || { name: "Administrador" },
        enrolled: false,
        progress: 0,
      }));

      console.log("📊 Cursos procesados:", coursesWithOwner.length);
      console.log("📅 Ejemplo de curso con fechas:", coursesWithOwner[0]);

      setCourses(coursesWithOwner);
      setFilteredCourses(coursesWithOwner);
      extractCategories(coursesWithOwner);
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
  }, []);

  const userId = user?._id;

  useEffect(() => {
    if (!hasFetched) {
      fetchCourses();
    }
  }, [hasFetched]);

  // Efecto para cargar progreso con manejo offline
  useEffect(() => {
    if (!userId || !hasFetched || !courses.length) return;

    let cancelled = false;

    (async () => {
      try {
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

      setProgressByCourse((prev) => {
        const newProgress = { ...prev };
        delete newProgress[courseId];
        return newProgress;
      });

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

      await loadCourseProgress(courseId);
    } catch (err) {
      console.error("Error al inscribirse:", err);
      if (err.response?.status === 400) {
        alert("Ya estás inscrito en este curso");
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

  // Limpiar filtros
  const clearFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setSelectedLevel("all");
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

      {/* Sistema de Filtros */}
      <div className="filters-section">
        <div className="filters-header">
          <h3>Filtrar Cursos</h3>
          {(searchTerm || selectedCategory !== "all" || selectedLevel !== "all") && (
            <button className="clear-filters-btn" onClick={clearFilters}>
              Limpiar filtros
            </button>
          )}
        </div>
        
        <div className="filters-grid">
          {/* Búsqueda por texto */}
          <div className="filter-group">
            <label htmlFor="search-input" className="filter-label">
              🔍 Buscar cursos
            </label>
            <input
              id="search-input"
              type="text"
              placeholder="Buscar por título o descripción..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          {/* Filtro por categoría */}
          <div className="filter-group">
            <label htmlFor="category-select" className="filter-label">
              📂 Categoría
            </label>
            <select
              id="category-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todas las categorías</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {/* Filtro por nivel */}
          <div className="filter-group">
            <label htmlFor="level-select" className="filter-label">
              🎯 Nivel de dificultad
            </label>
            <select
              id="level-select"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="filter-select"
            >
              <option value="all">Todos los niveles</option>
              <option value="beginner">Principiante</option>
              <option value="intermediate">Intermedio</option>
              <option value="advanced">Avanzado</option>
            </select>
          </div>
        </div>

        {/* Contador de resultados */}
        <div className="results-info">
          <span className="results-count">
            Mostrando {filteredCourses.length} de {courses.length} cursos
          </span>
          {(searchTerm || selectedCategory !== "all" || selectedLevel !== "all") && (
            <span className="active-filters">
              Filtros activos: 
              {searchTerm && ` "${searchTerm}"`}
              {selectedCategory !== "all" && ` • ${selectedCategory}`}
              {selectedLevel !== "all" && ` • ${
                selectedLevel === "beginner" ? "Principiante" :
                selectedLevel === "intermediate" ? "Intermedio" : "Avanzado"
              }`}
            </span>
          )}
        </div>
      </div>

      <div className="courses-grid">
        {filteredCourses.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No se encontraron cursos</h3>
            <p>
              {searchTerm || selectedCategory !== "all" || selectedLevel !== "all"
                ? "No hay cursos que coincidan con los filtros aplicados. Intenta con otros criterios."
                : "No hay cursos disponibles en este momento."}
            </p>
            {(searchTerm || selectedCategory !== "all" || selectedLevel !== "all") && (
              <button className="btn btn-primary" onClick={clearFilters}>
                🔄 Mostrar todos los cursos
              </button>
            )}
          </div>
        ) : (
          filteredCourses.map((course) => {
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
            const isOpenForEnrollment = isCourseOpenForEnrollment(course);
            const isClosed = isCourseClosed(course);

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

                  {/* Badge de estado del curso */}
                  <CourseStatusBadge course={course} />

                  {isEnrolled && (
                    <div className="enrolled-badge">✅ Inscrito</div>
                  )}

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
                      <span className="meta-icon">📊</span>
                      <span className="meta-text">
                        {course.hasEndDate ? "Curso con fechas" : "Acceso permanente"}
                      </span>
                    </div>
                  </div>

                  {/* Información de duración y fechas */}
                  <CourseDateInfo course={course} />

                  <p className="course-description">
                    {course.description?.slice(0, 120) ||
                      "Sin descripción disponible..."}
                    {course.description &&
                    course.description.length > 120
                      ? "..."
                      : ""}
                  </p>

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
                          disabled={isClosed}
                          title={isClosed ? "Este curso ha cerrado" : ""}
                        >
                          <span className="btn-icon">▶️</span>
                          {isClosed ? "Curso Cerrado" : 
                           prog.progress === 100 ? "🎉 Certificado" : "Continuar"}
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
                          disabled={isLoading || offlineMode || !isOpenForEnrollment || isClosed}
                          title={!isOpenForEnrollment ? 
                            "Las inscripciones para este curso han cerrado" : 
                            isClosed ? "Este curso ha cerrado" : ""}
                        >
                          <span className="btn-icon">🎯</span>
                          {isClosed ? "Curso Cerrado" :
                           !isOpenForEnrollment ? "Inscripciones Cerradas" :
                           isLoading ? "Inscribiendo..." :
                           offlineMode ? "Sin conexión" : "Inscribirse"}
                        </button>
                      )
                    ) : (
                      <button
                        className="btn btn-primary"
                        onClick={() => navigate("/register")}
                        disabled={!isOpenForEnrollment || isClosed}
                        title={!isOpenForEnrollment ? 
                          "Las inscripciones para este curso han cerrado" : 
                          isClosed ? "Este curso ha cerrado" : ""}
                      >
                        <span className="btn-icon">🔒</span>
                        {isClosed ? "Curso Cerrado" :
                         !isOpenForEnrollment ? "Inscripciones Cerradas" : "Acceder al Curso"}
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