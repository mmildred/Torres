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

  // Función para verificar si el usuario es instructor de un curso específico
  const isCourseInstructor = (course) => {
    if (!user) return false;

    const isAdmin = user.role === 'admin';
    const isOwner = course.owner?._id.toString() === user._id.toString(); // ← user._id
    const isInstructor = course.instructors?.some(instructor =>
      instructor._id.toString() === user._id.toString() // ← user._id
    );

    return isAdmin || isOwner || isInstructor;
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

  // Cargar cursos y progreso
  // En Courses.jsx, actualiza la carga de progreso:
useEffect(() => {
  const loadCoursesAndProgress = async () => {
    if (!user) return;

    try {
      const coursesResponse = await api.get('/courses');
      const coursesData = coursesResponse.data;

      const coursesWithProgress = await Promise.all(
        coursesData.map(async (course) => {
          const isInstructor = isCourseInstructor(course);
          
          // Si es instructor, no necesita verificar progreso
          if (isInstructor) {
            return {
              ...course,
              enrolled: false, // Instructores no necesitan inscripción
              progress: 0,
              completedContents: 0,
              totalContents: course.contents?.length || 0
            };
          }
          
          // Solo estudiantes verifican progreso
          try {
            const progressResponse = await api.get(`/courses/${course._id}/progress/me`);
            const progressData = progressResponse.data;
            return {
              ...course,
              enrolled: progressData.enrolled || false,
              progress: progressData.progress || 0,
              completedContents: progressData.completedContents || 0,
              totalContents: progressData.totalContents || 0
            };
          } catch (error) {
            // Error 404 significa que no está inscrito - eso es normal
            return {
              ...course,
              enrolled: false,
              progress: 0,
              completedContents: 0,
              totalContents: 0
            };
          }
        })
      );

      setCourses(coursesWithProgress);
      setHasFetched(true);
    } catch (error) {
      console.error('Error cargando cursos:', error);
      setHasFetched(true);
    }
  };

  if (!hasFetched) {
    loadCoursesAndProgress();
  }
}, [user, hasFetched]);


  const handleViewDetails = (courseId) => {
  navigate(`/courses/${courseId}`); // ← Cambia esto
};

// En tu Courses.jsx, actualiza la función handleEnroll:
// En tu Courses.jsx, reemplaza completamente handleEnroll:
const handleEnroll = async (courseId) => {
  setLoadingStates(prev => ({ ...prev, [courseId]: true }));

  try {
    console.log('=== DEBUG INSCRIPCIÓN ===');
    console.log('Curso ID:', courseId);
    console.log('Usuario:', user);
    console.log('Token:', localStorage.getItem('token'));
    
    const token = localStorage.getItem('token');
    const response = await api.post(`/courses/${courseId}/enroll`, {}, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    console.log('Respuesta del servidor:', response.data);
    console.log('=== FIN DEBUG ===');

    // Actualizar el estado del curso
    setCourses(prevCourses =>
      prevCourses.map(course =>
        course._id === courseId
          ? {
            ...course,
            enrolled: true,
            progress: 0,
            completedContents: 0,
            totalContents: course.totalContents || 0
          }
          : course
      )
    );

    alert('¡Inscripción exitosa! Ahora puedes acceder al curso.');

  } catch (error) {
    console.log('=== ERROR INSCRIPCIÓN ===');
    console.error('Error completo:', error);
    console.error('Datos de respuesta:', error.response?.data);
    console.error('Status:', error.response?.status);
    console.error('Headers:', error.response?.headers);
    console.log('=== FIN ERROR ===');
    
    if (error.response?.status === 401) {
      alert('Debes iniciar sesión para inscribirte en cursos');
      navigate('/login');
    } else if (error.response?.status === 400) {
      alert('Ya estás inscrito en este curso');
      // Actualizar estado a inscrito
      setCourses(prevCourses =>
        prevCourses.map(course =>
          course._id === courseId
            ? { ...course, enrolled: true }
            : course
        )
      );
    } else if (error.response?.status === 404) {
      alert('Curso no encontrado');
    } else if (error.response?.status === 500) {
      alert('Error del servidor. Intenta nuevamente.');
    } else {
      alert('Error al inscribirse: ' + (error.response?.data?.message || error.message));
    }
  } finally {
    setLoadingStates(prev => ({ ...prev, [courseId]: false }));
  }
};

  const handleContinue = (courseId) => {
    navigate(`/courses/${courseId}/learn`);
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
            const isEnrolled = course.enrolled;
            const progress = course.progress || 0;
            const isLoading = loadingStates[course._id];
            const isInstructor = isCourseInstructor(course); // ← DEFINIDA AQUÍ DENTRO DEL MAP

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
                        {course.owner?.name || "Administrador"}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Duración:</span>
                      <span className="meta-text">
                        {course.duration || "Auto-guiado"}
                      </span>
                    </div>
                    <div className="meta-item">
                      <span className="meta-label">Nivel:</span>
                      <span className="meta-text">
                        {course.level || "Principiante"}
                      </span>
                    </div>
                  </div>

                  <p className="course-description">
                    {course.description || "Sin descripción disponible..."}
                  </p>

                  {/* PROGRESO - Solo mostrar si está inscrito */}
                  {isEnrolled && (
                    <div className="progress-container">
                      <div className="progress-header">
                        <span className="progress-label">Tu progreso</span>
                        <span className="progress-percent">{progress}%</span>
                      </div>
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <div className="progress-stats">
                        <span>
                          {course.completedContents || 0} de {course.totalContents || 0} lecciones completadas
                        </span>
                      </div>
                    </div>
                  )}

                  <div className="course-footer">
                    <div className="course-level">
                      <span className={`level-badge ${(course.level?.toLowerCase() || 'beginner')}`}>
                        {course.level || "Principiante"}
                      </span>
                    </div>

                    <div className="course-actions">
                      {/* BOTÓN ÚNICO - Gestionar para instructores, Ver detalles para estudiantes */}
                      {isInstructor ? (
                        <button
                          className="manage-btn"
                          onClick={() => navigate(`/courses/${course._id}/manage`)}
                        >
                          Gestionar
                        </button>
                      ) : (
                        <button
                          className="details-btn"
                          onClick={() => handleViewDetails(course._id)}
                        >
                          Ver detalles
                        </button>
                      )}

                      {/* BOTÓN DE INSCRIPCIÓN/CONTINUAR - Solo para estudiantes */}
                      {!isInstructor && (isEnrolled ? (
                        <button
                          className="continue-btn"
                          onClick={() => handleContinue(course._id)}
                          disabled={isLoading}
                        >
                          {progress === 100 ? '🎉 Certificado' : '▶️ Continuar'}
                        </button>
                      ) : (
                        <button
                          className="enroll-btn"
                          onClick={() => handleEnroll(course._id)}
                          disabled={isLoading}
                        >
                          {isLoading ? 'Inscribiendo...' : 'Inscribirse'}
                        </button>
                      ))}
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