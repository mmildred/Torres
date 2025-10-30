import React, { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { getUser } from "../auth";
import "./CourseDetail.css";
import CourseContents from "./CourseContents"; // Asegúrate de que el nombre del archivo sea correcto

export default function CourseDetail() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const user = useMemo(() => getUser(), []);

  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState(null);
  const [enrolled, setEnrolled] = useState(false);
  const [progress, setProgress] = useState({
    enrolled: false,
    progress: 0,
    completedContents: 0,
    totalContents: 0
  });
  const [enrolling, setEnrolling] = useState(false);

  useEffect(() => {
    console.log('🔄 useEffect ejecutado, courseId:', courseId);
    
    if (!user) {
      console.log('❌ No hay usuario, redirigiendo a login');
      navigate("/login");
      return;
    }

    let isMounted = true;

    const fetchCourseData = async () => {
      try {
        setLoading(true);
        
        console.log('📥 Fetching course data for:', courseId);
        
        // 1) Obtener información del curso
        const courseRes = await api.get(`/courses/${courseId}`);
        if (!isMounted) return;
        
        setCourse(courseRes.data);
        
        // 2) Verificar progreso e inscripción
        try {
          const progressRes = await api.get(`/courses/${courseId}/progress/me`);
          if (!isMounted) return;
          
          setProgress(progressRes.data);
          setEnrolled(progressRes.data.enrolled);
          console.log('✅ Datos cargados correctamente');
        } catch (error) {
          if (!isMounted) return;
          // Error 404 significa que no está inscrito - normal
          setEnrolled(false);
          setProgress({
            enrolled: false,
            progress: 0,
            completedContents: 0,
            totalContents: courseRes.data.contents?.length || 0
          });
        }
        
      } catch (error) {
        if (!isMounted) return;
        console.error('❌ Error cargando curso:', error);
        
        if (error.response?.status === 404) {
          console.log('📭 Curso no encontrado, redirigiendo');
          navigate('/courses');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchCourseData();

    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, [courseId, user, navigate]);

  // ✅ FUNCIÓN PARA OBTENER CONTENIDOS VISIBLES
  const getVisibleContents = () => {
    if (!course || !course.contents) return [];
    
    const isInstructor = user && course && (
      user.role === 'admin' || 
      course.owner?._id.toString() === user._id.toString() ||
      course.instructors?.some(instructor => 
        instructor._id.toString() === user._id.toString()
      )
    );

    // ✅ Instructores ven TODOS los contenidos
    if (isInstructor) {
      return course.contents;
    }
    
    // ✅ Estudiantes solo ven contenidos PUBLICADOS
    return course.contents.filter(content => 
      content.isPublished === true
    );
  };

  const handleEnroll = async () => {
    setEnrolling(true);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setEnrolled(true);
      // Recargar progreso después de inscribirse
      const progressRes = await api.get(`/courses/${courseId}/progress/me`);
      setProgress(progressRes.data);
      alert("¡Inscripción exitosa! Ahora puedes comenzar el curso.");
    } catch (error) {
      console.error('Error inscribiéndose:', error);
      if (error.response?.status === 400) {
        alert('Ya estás inscrito en este curso');
      } else {
        alert('Error al inscribirse en el curso');
      }
    } finally {
      setEnrolling(false);
    }
  };

const handleContinue = () => {
  navigate(`/courses/${courseId}/learn`);
};

  const isInstructor = user && course && (
    user.role === 'admin' || 
    course.owner?._id.toString() === user._id.toString() ||
    course.instructors?.some(instructor => 
      instructor._id.toString() === user._id.toString()
    )
  );

  // ✅ Obtener contenidos visibles según el rol
  const visibleContents = getVisibleContents();

  if (loading) {
    return (
      <div className="course-detail-loading">
        <div className="loading-spinner"></div>
        <p>Cargando curso...</p>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="course-detail-error">
        <h2>Curso no encontrado</h2>
        <p>El curso que buscas no existe o no tienes acceso.</p>
        <button onClick={() => navigate('/courses')}>Volver a cursos</button>
      </div>
    );
  }

  return (
    <div className="course-detail">
      {/* Header del curso */}
      <div className="course-detail-header">
        <button 
          className="back-button"
          onClick={() => navigate('/courses')}
        >
          ← Volver a cursos
        </button>
        
        <div className="course-hero">
          <div className="course-hero-image">
            <img
              src={course.thumbnail || "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80"}
              alt={course.title}
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1501504905252-473c47e087f8?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80";
              }}
              loading="lazy"
            />
          </div>
          
          <div className="course-hero-content">
            <div className="course-category-badge">
              {course.category || "General"}
            </div>
            <h1 className="course-title">{course.title}</h1>
            <p className="course-description">
              {course.description || "Sin descripción disponible."}
            </p>
            
            <div className="course-meta-grid">
              <div className="meta-item">
                <span className="meta-label">Creado por:</span>
                <span className="meta-value">{course.owner?.name || "Administrador"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Nivel:</span>
                <span className="meta-value">{course.level || "Principiante"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Duración:</span>
                <span className="meta-value">{course.duration || "Auto-guiado"}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">Contenidos:</span>
                {/* ✅ Mostrar cantidad correcta según rol */}
                <span className="meta-value">
                  {isInstructor 
                    ? `${course.contents?.length || 0} lecciones` 
                    : `${visibleContents.length} lecciones disponibles`
                  }
                </span>
              </div>
            </div>

            {/* Acciones */}
            <div className="course-actions">
              {isInstructor ? (
                <button
                  className="manage-course-btn"
                  onClick={() => navigate(`/courses/${courseId}/manage`)}
                >
                  Gestionar Curso
                </button>
              ) : enrolled ? (
                <button
                  className="continue-course-btn"
                  onClick={handleContinue}
                >
                  {progress.progress === 100 ? '🎉 Ver Certificado' : '▶️ Continuar Curso'}
                </button>
              ) : (
                <button
                  className="enroll-course-btn"
                  onClick={handleEnroll}
                  disabled={enrolling}
                >
                  {enrolling ? 'Inscribiendo...' : 'Inscribirse en el Curso'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progreso (solo para estudiantes inscritos) */}
      {enrolled && (
        <div className="progress-section">
          <div className="progress-header">
            <h3>Tu Progreso</h3>
            <span className="progress-percent">{progress.progress}%</span>
          </div>
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress.progress}%` }}
            ></div>
          </div>
          <div className="progress-stats">
            {progress.completedContents} de {progress.totalContents} lecciones completadas
          </div>
        </div>
      )}

      {/* ✅ COMPONENTE COURSE CONTENTS INTEGRADO */}
      <CourseContents 
        course={course} 
        userRole={user?.role}
        isEnrolled={enrolled}
        isInstructor={isInstructor}
      />

      {/* Información para no inscritos */}
      {!enrolled && !isInstructor && visibleContents.length > 0 && (
        <div className="enrollment-cta">
          <div className="cta-content">
            <h3>¿Listo para comenzar?</h3>
            <p>Inscríbete en este curso para acceder a {visibleContents.length} lecciones y comenzar tu aprendizaje.</p>
            <button
              className="cta-enroll-btn"
              onClick={handleEnroll}
              disabled={enrolling}
            >
              {enrolling ? 'Inscribiendo...' : 'Inscribirse Ahora'}
            </button>
          </div>
        </div>
      )}

      {/* Información para instructores sobre contenidos no publicados */}
      {isInstructor && course.contents?.length > visibleContents.length && (
        <div className="instructor-notice">
          <div className="notice-content">
            <h3>📝 Nota para instructores</h3>
            <p>
              Tienes {course.contents.length - visibleContents.length} contenido(s) en estado de borrador. 
              Los estudiantes no pueden ver estos contenidos hasta que los publiques.
            </p>
            <button
              className="manage-contents-btn"
              onClick={() => navigate(`/courses/${courseId}/manage`)}
            >
              Gestionar Contenidos
            </button>
          </div>
        </div>
      )}
    </div>
  );
}