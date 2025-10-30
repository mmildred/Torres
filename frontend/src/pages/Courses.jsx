import React, { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api";
import { getUser } from "../auth";
import "./Courses.css";

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [filteredCourses, setFilteredCourses] = useState([]);
  const [hasFetched, setHasFetched] = useState(false);
  const [progressByCourse, setProgressByCourse] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [categories, setCategories] = useState([]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const user = getUser();
  const navigate = useNavigate();
  const [deletingById, setDeletingById] = useState({});
  
  // Referencias para controlar las peticiones
  const progressRequestsRef = useRef(new Set());
  const isFetchingProgressRef = useRef(false);

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
        owner: course.owner || { name: "Administrador" }
      }));
      setCourses(coursesWithOwner);
      setFilteredCourses(coursesWithOwner);
      setHasFetched(true);
      
      // Extraer categorías únicas
      const uniqueCategories = [...new Set(coursesWithOwner.map(course => course.category || "General"))];
      setCategories(["all", ...uniqueCategories]);
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

  // Filtrar cursos por categoría
  useEffect(() => {
    if (selectedCategory === "all") {
      setFilteredCourses(courses);
    } else {
      const filtered = courses.filter(course => 
        course.category === selectedCategory || 
        (!course.category && selectedCategory === "General")
      );
      setFilteredCourses(filtered);
    }
  }, [selectedCategory, courses]);

  // SOLUCIÓN DEFINITIVA: Cargar progreso solo una vez y manejar correctamente
  useEffect(() => {
    // Si no hay usuario o no hay cursos, no hacer nada
    if (!user || courses.length === 0 || isFetchingProgressRef.current) {
      return;
    }

    isFetchingProgressRef.current = true;
    console.log("🔄 Iniciando carga de progreso para", courses.length, "cursos");

    const fetchProgressForCourses = async () => {
      const courseIds = courses.map(c => c._id);
      
      // Verificar qué cursos ya tienen progreso cargado
      const existingProgressIds = Object.keys(progressByCourse);
      const coursesToFetch = courseIds.filter(id => !existingProgressIds.includes(id));
      
      if (coursesToFetch.length === 0) {
        console.log("✅ Todos los cursos ya tienen progreso cargado");
        isFetchingProgressRef.current = false;
        return;
      }

      console.log("📥 Cargando progreso para cursos:", coursesToFetch);

      try {
        const progressPromises = coursesToFetch.map(async (courseId) => {
          // Evitar peticiones duplicadas
          if (progressRequestsRef.current.has(courseId)) {
            return null;
          }
          
          progressRequestsRef.current.add(courseId);
          
          try {
            const { data } = await api.get(`/courses/${courseId}/progress/me`);
            return [courseId, data];
          } catch (error) {
            // Si hay error 404, significa que no hay progreso para este curso
            if (error.response?.status === 404) {
              console.log(`📭 No hay progreso para el curso ${courseId}`);
              return [courseId, { total: 0, completed: 0, percent: 0 }];
            }
            console.warn(`⚠️ Error cargando progreso para ${courseId}:`, error.message);
            return [courseId, { total: 0, completed: 0, percent: 0 }];
          } finally {
            progressRequestsRef.current.delete(courseId);
          }
        });

        const results = await Promise.all(progressPromises);
        const validResults = results.filter(result => result !== null);
        
        if (validResults.length > 0) {
          setProgressByCourse(prev => ({
            ...prev,
            ...Object.fromEntries(validResults)
          }));
          console.log("✅ Progreso actualizado para", validResults.length, "cursos");
        }
        
      } catch (error) {
        console.error("❌ Error general cargando progreso:", error);
      } finally {
        isFetchingProgressRef.current = false;
      }
    };

    fetchProgressForCourses();

    // Cleanup
    return () => {
      isFetchingProgressRef.current = false;
    };
  }, [user, courses.length]); // Solo dependemos de courses.length, no del array completo

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
          Explora nuestra selección de cursos especializados organizados por categorías
        </p>  
        
        {(user?.role === "teacher" || user?.role === "admin") && (
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

      {/* Filtros de categorías - Toggle Desplegable */}
      <div className="categories-filter-toggle">
        <button 
          className="filter-toggle-btn"
          onClick={() => setIsFilterOpen(!isFilterOpen)}
        >
          <span className="filter-icon">⚙️</span>
          Filtrar por categoría
          <span className={`toggle-arrow ${isFilterOpen ? 'open' : ''}`}>
            ▼
          </span>
        </button>
        
        {isFilterOpen && (
          <div className="filter-dropdown">
            <div className="filter-header">
              <h4>Selecciona una categoría</h4>
              <button 
                className="close-filter"
                onClick={() => setIsFilterOpen(false)}
              >
                ×
              </button>
            </div>
            <div className="filter-options">
              {categories.map(category => (
                <button
                  key={category}
                  className={`filter-option ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => {
                    setSelectedCategory(category);
                    setIsFilterOpen(false);
                  }}
                >
                  <span className="option-name">
                    {category === "all" ? "Todos los cursos" : category}
                  </span>
                  <span className="option-count">
                    {category === "all" 
                      ? courses.length 
                      : courses.filter(c => c.category === category || (!c.category && category === "General")).length
                    }
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Información de la categoría seleccionada */}
      {selectedCategory !== "all" && (
        <div className="category-info">
          <div className="category-header">
            <div>
              <h3>{selectedCategory}</h3>
              <p>
                {filteredCourses.length} curso{filteredCourses.length !== 1 ? 's' : ''} disponible{filteredCourses.length !== 1 ? 's' : ''} en esta categoría
              </p>
            </div>
            <button 
              className="clear-filter"
              onClick={() => setSelectedCategory("all")}
            >
              Ver todos
            </button>
          </div>
        </div>
      )}

      <div className="courses-grid">
        {filteredCourses.length === 0 && hasFetched ? (
          <div className="empty-state">
            <div className="empty-icon">🔍</div>
            <h3>No hay cursos en esta categoría</h3>
            <p>Pronto agregaremos nuevos cursos a {selectedCategory !== "all" ? "esta categoría" : "nuestro catálogo"}</p>
            {selectedCategory !== "all" && (
              <button 
                className="btn-primary"
                onClick={() => setSelectedCategory("all")}
              >
                Ver todos los cursos
              </button>
            )}
          </div>
        ) : (
          filteredCourses.map((course) => {
            const prog = progressByCourse[course._id] || { total: 0, completed: 0, percent: 0 };
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
                      {course.level || "Principiante"}
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
                        {prog.completed}/{prog.total} lecciones completadas
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

                    <button 
                      className="btn btn-primary"
                      onClick={() => handleEnroll(course._id)}
                    >
                      <span className="btn-icon">
                        {user ? "🎯" : "🔒"}
                      </span>
                      {user ? "Inscribirse" : "Acceder al Curso"}
                    </button>

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