import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { isAuthenticated } from "../auth";
import "./Analytics.css";

export default function Analytics() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    loadAnalytics();
  }, [courseId, navigate]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log("📊 Cargando analytics para curso:", courseId);

      // Opción 1: Si tienes un endpoint específico de analytics
      try {
        const analyticsResponse = await api.get(`courses/${courseId}/analytics`);
        const processedData = processApiAnalytics(analyticsResponse.data);
        
        // ✅ DEBUG EN POSICIÓN CORRECTA
        console.log("✅ Analytics cargados desde endpoint específico");
        console.log("🐛 DEBUG - Estructura completa de analytics:", processedData);
        console.log("🐛 DEBUG - Students array:", processedData?.students);
        console.log("🐛 DEBUG - Primer student:", processedData?.students?.[0]);
        console.log("🐛 DEBUG - Keys disponibles:", processedData?.students?.map(s => s ? Object.keys(s) : 'null'));
        
        setAnalytics(processedData);
        return;
      } catch (err) {
        console.log("⚠️ Endpoint de analytics falló, usando método alternativo:", err.message);
      }

      // Opción 2: Cargar solo el curso (sin enrollments si fallan)
      try {
        const courseRes = await api.get(`courses/${courseId}`);
        const course = courseRes.data;

        console.log("📚 Curso cargado:", course.title);

        // Intentar cargar enrollments, pero si falla, usar array vacío
        let enrollments = [];
        try {
          const enrollmentsRes = await api.get(`courses/${courseId}/enrollments`);
          enrollments = enrollmentsRes.data;
          console.log("👥 Inscripciones cargadas:", enrollments.length);
        } catch (enrollError) {
          console.warn("⚠️ No se pudieron cargar las inscripciones:", enrollError.message);
          enrollments = [];
        }

        // Procesar datos para analytics
        const processedAnalytics = buildAnalyticsFromData(course, enrollments);
        
        // ✅ DEBUG PARA MÉTODO ALTERNATIVO
        console.log("🐛 DEBUG - Analytics método alternativo:", processedAnalytics);
        
        setAnalytics(processedAnalytics);

      } catch (courseError) {
        console.error("❌ Error cargando curso:", courseError);
        throw courseError;
      }

    } catch (error) {
      console.error("❌ Error cargando analytics:", error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const processApiAnalytics = (data) => {
    console.log("🔍 Datos crudos del backend:", data);
    
    // Si el backend ya devuelve analytics procesados
    return {
      course: {
        _id: data.courseId || courseId,
        title: data.courseTitle || "Curso",
        description: data.courseDescription || "",
        totalContents: data.totalContents || 0
      },
      summary: {
        totalStudents: data.totalStudents || 0,
        avgProgress: Math.round(data.averageProgress || 0),
        completedStudents: data.completedStudents || 0,
        activeStudents: data.activeStudents || 0,
        notStartedStudents: data.notStartedStudents || 0,
        completionRate: Math.round(data.completionRate || 0)
      },
      students: (data.students || []).map((student, index) => ({
        // ✅ KEY MEJORADA con múltiples fallbacks
        studentId: student.studentId || student._id || `student-${index}`,
        name: student.name || student.fullName || "Sin nombre",
        email: student.email || "Sin email",
        progress: Math.round(student.progress || 0),
        completedContents: student.completedContents || 0,
        lastActivity: student.lastActivity || student.updatedAt,
        status: getProgressStatus(student.progress || 0)
      }))
    };
  };

  const buildAnalyticsFromData = (course, enrollments) => {
    // Construir analytics desde datos del curso y enrollments
    const students = processEnrollments(enrollments, course);
    const summary = calculateSummary(students);

    return {
      course: {
        _id: course._id || courseId,
        title: course.title || course.name || "Curso",
        description: course.description || "",
        totalContents: getTotalContents(course)
      },
      summary,
      students
    };
  };

  const processEnrollments = (enrollments, course) => {
    if (!Array.isArray(enrollments) || enrollments.length === 0) {
      return [];
    }

    const totalContents = getTotalContents(course);

    return enrollments.map((enrollment, index) => {
      // Manejar diferentes estructuras de enrollment
      const student = enrollment.student || enrollment.user || enrollment;
      const progress = enrollment.progress || enrollment.completionPercentage || 0;
      const completed = enrollment.completedContents || enrollment.completedModules || 
                       Math.round((progress / 100) * totalContents);

      return {
        // ✅ KEY MEJORADA con múltiples fallbacks
        studentId: student._id || student.id || enrollment._id || `enrollment-${index}`,
        name: student.name || student.fullName || student.username || "Estudiante",
        email: student.email || "Sin email",
        progress: Math.round(progress),
        completedContents: completed,
        lastActivity: enrollment.lastAccess || enrollment.updatedAt || enrollment.createdAt,
        status: getProgressStatus(progress)
      };
    });
  };

  const getTotalContents = (course) => {
    // Intentar obtener el total de contenidos del curso
    if (course.totalContents) return course.totalContents;
    if (course.modules && Array.isArray(course.modules)) return course.modules.length;
    if (course.lessons && Array.isArray(course.lessons)) return course.lessons.length;
    if (course.contents && Array.isArray(course.contents)) return course.contents.length;
    if (course.sections && Array.isArray(course.sections)) {
      return course.sections.reduce((total, section) => {
        return total + (section.lessons?.length || 0);
      }, 0);
    }
    return 10; // Valor por defecto
  };

  const calculateSummary = (students) => {
    const totalStudents = students.length;
    
    if (totalStudents === 0) {
      return {
        totalStudents: 0,
        avgProgress: 0,
        completedStudents: 0,
        activeStudents: 0,
        notStartedStudents: 0,
        completionRate: 0
      };
    }

    const totalProgress = students.reduce((sum, s) => sum + s.progress, 0);
    const avgProgress = Math.round(totalProgress / totalStudents);
    
    const completedStudents = students.filter(s => s.progress === 100).length;
    const activeStudents = students.filter(s => s.progress > 0 && s.progress < 100).length;
    const notStartedStudents = students.filter(s => s.progress === 0).length;
    
    const completionRate = Math.round((completedStudents / totalStudents) * 100);

    return {
      totalStudents,
      avgProgress,
      completedStudents,
      activeStudents,
      notStartedStudents,
      completionRate
    };
  };

  const getProgressStatus = (progress) => {
    if (progress === 0) return 'not-started';
    if (progress >= 80) return 'advanced';
    if (progress >= 40) return 'intermediate';
    return 'beginner';
  };

  const handleError = (error) => {
    let errorMessage = "Error al cargar los datos del curso";
    
    if (error.response?.status === 404) {
      errorMessage = "Curso no encontrado";
    } else if (error.response?.status === 403) {
      errorMessage = "No tienes permisos para ver este curso";
    } else if (error.response?.status === 401) {
      errorMessage = "Sesión expirada. Por favor, inicia sesión nuevamente";
      setTimeout(() => navigate("/login"), 2000);
    }
    
    setError(errorMessage);
  };

  const getStatusConfig = (status) => {
    const configs = {
      'not-started': { text: '⏸️ Sin iniciar', class: 'status-not-started' },
      'beginner': { text: '🌱 Principiante', class: 'status-beginner' },
      'intermediate': { text: '📚 Intermedio', class: 'status-intermediate' },
      'advanced': { text: '🎓 Avanzado', class: 'status-advanced' }
    };
    return configs[status] || configs.beginner;
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Sin actividad";
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('es-MX', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
    } catch (error) {
      return "Fecha inválida";
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Cargando estadísticas del curso...</p>
        <p>Curso ID: {courseId}</p>
      </div>
    );
  }

  if (!analytics) {
    console.log("❌ Analytics es NULL o UNDEFINED");
    return (
      <div className="error-container">
        <h2>Error al cargar los datos</h2>
        <p>{error || "No se pudieron cargar los datos del curso"}</p>
        <button className="btn-primary" onClick={loadAnalytics}>
          Reintentar
        </button>
      </div>
    );
  }

  // ✅ VERIFICACIÓN MEJORADA de la estructura de datos
  if (!analytics.students || !Array.isArray(analytics.students)) {
    console.log("❌ PROBLEMA: students no es un array:", analytics.students);
    return (
      <div className="error-container">
        <h2>Error en la estructura de datos</h2>
        <p>Los datos de estudiantes no tienen el formato correcto</p>
        <button className="btn-primary" onClick={loadAnalytics}>
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="analytics-page">
      {/* Header */}
      <div className="analytics-header">
        <button className="btn-back" onClick={() => navigate("/my-courses")}>
          ← Volver a Mis Cursos
        </button>
        <h1>Analytics del Curso</h1>
        <h2>{analytics.course.title}</h2>
        {analytics.course.description && (
          <p className="course-description">{analytics.course.description}</p>
        )}
        
        {error && (
          <div className="banner banner-error">
            ⚠️ {error}
          </div>
        )}
      </div>

      {/* Estadísticas Generales */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-number">{analytics.summary.totalStudents}</div>
          <div className="stat-label">Total Estudiantes</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{analytics.summary.completedStudents}</div>
          <div className="stat-label">Completaron</div>
        </div>
        <div className="stat-card">
          <div className="stat-number">{analytics.summary.notStartedStudents}</div>
          <div className="stat-label">Sin Iniciar</div>
        </div>
        <div className="stat-card stat-card-highlight">
          <div className="stat-number">{analytics.summary.completionRate}%</div>
          <div className="stat-label">Tasa de Finalización</div>
        </div>
      </div>

      {/* Lista de Estudiantes */}
      <div className="section">
        <h2>👥 Progreso de Estudiantes ({analytics.students.length})</h2>
        
        {analytics.students.length > 0 ? (
          <div className="students-list">
            {analytics.students.map((student, index) => {
              const statusConfig = getStatusConfig(student.status);
              
              // ✅ KEY MEJORADA - Múltiples fallbacks para evitar el error
              const uniqueKey = student.studentId || student._id || `student-${index}`;
              
              return (
                <div key={uniqueKey} className="student-card">
                  <div className="student-info">
                    <h4>{student.name || "Estudiante"}</h4>
                    <p className="student-email">{student.email || "Sin email"}</p>
                    <small className="student-activity">
                      Última actividad: {formatDate(student.lastActivity)}
                    </small>
                    <small className="student-completed">
                      {student.completedContents || 0} de {analytics.course.totalContents} contenidos completados
                    </small>
                  </div>
                  <div className="student-progress">
                    <span className="progress-percentage">{student.progress || 0}%</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill" 
                        style={{ width: `${student.progress || 0}%` }}
                      ></div>
                    </div>
                  </div>
                  <div className={`student-status ${statusConfig.class}`}>
                    {statusConfig.text}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="empty-state">
            <p>📭 No hay estudiantes inscritos en este curso todavía.</p>
            <p>Los estudiantes aparecerán aquí cuando se inscriban al curso.</p>
          </div>
        )}
      </div>

      {/* Acciones */}
      <div className="actions-section">
        <button className="btn-primary" onClick={loadAnalytics}>
          🔄 Actualizar Datos
        </button>
      </div>
    </div>
  );
}