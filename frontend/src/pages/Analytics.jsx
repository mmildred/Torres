import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { isAuthenticated } from "../auth";
import InsightsPanel from "../pages/InsightsPanel";
import { enhanceAnalyticsWithAI } from "./analytics-decorator";
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

      try {
        console.log("🔄 Llamando a endpoint /analytics...");
        const analyticsRes = await api.get(`/courses/${courseId}/analytics`);
        console.log("✅ Respuesta de analytics:", analyticsRes.data);
        
        const processedAnalytics = processApiAnalytics(analyticsRes.data);
        const enhancedAnalytics = enhanceAnalyticsWithAI(processedAnalytics);
        
        console.log("🤖 Insights generados:", enhancedAnalytics.getInsights());
        
        setAnalytics({
          ...processedAnalytics,
          insights: enhancedAnalytics.getInsights()
        });
        
      } catch (analyticsError) {
        console.error("❌ Error con endpoint analytics:", analyticsError);
        await loadAnalyticsFallback();
      }

    } catch (error) {
      console.error("❌ Error cargando analytics:", error);
      handleError(error);
    } finally {
      setLoading(false);
    }
  };

  const loadAnalyticsFallback = async () => {
    try {
      console.log("🔄 Usando método alternativo...");
      
      const courseRes = await api.get(`/courses/${courseId}`);
      const course = courseRes.data;
      
      console.log("✅ Curso cargado:", course.title);

      let enrollments = [];
      try {
        const enrollmentsRes = await api.get(`/courses/${courseId}/enrollments`);
        enrollments = enrollmentsRes.data;
        console.log("✅ Enrollments cargados:", enrollments.length);
      } catch (enrollError) {
        console.warn("❌ No se pudieron cargar enrollments:", enrollError.message);
        enrollments = [];
      }

      const processedAnalytics = buildAnalyticsFromData(course, enrollments);
      const enhancedAnalytics = enhanceAnalyticsWithAI(processedAnalytics);
      
      console.log("📈 Analytics construidos manualmente:", processedAnalytics.summary);
      
      setAnalytics({
        ...processedAnalytics,
        insights: enhancedAnalytics.getInsights()
      });

    } catch (fallbackError) {
      console.error("❌ Error en método alternativo:", fallbackError);
      throw fallbackError;
    }
  };

  const processApiAnalytics = (data) => {
    console.log("🔍 Datos crudos del backend:", data);
    
    return {
      course: {
        _id: data.courseId || data.course?._id || courseId,
        title: data.courseTitle || data.course?.title || "Curso",
        description: data.courseDescription || data.course?.description || "",
        totalContents: data.totalContents || data.course?.totalContents || 0
      },
      summary: {
        totalStudents: data.totalStudents || data.summary?.totalStudents || 0,
        avgProgress: Math.round(data.averageProgress || data.summary?.averageProgress || 0),
        completedStudents: data.completedStudents || data.summary?.completedStudents || 0,
        activeStudents: data.activeStudents || data.summary?.activeStudents || 0,
        notStartedStudents: data.notStartedStudents || data.summary?.notStartedStudents || 0,
        completionRate: Math.round(data.completionRate || data.summary?.completionRate || 0)
      },
      students: (data.students || []).map((student, index) => ({
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
      const student = enrollment.student || enrollment.user || enrollment;
      const progress = enrollment.progress || enrollment.completionPercentage || 0;
      const completed = enrollment.completedContents || enrollment.completedModules || 
                       Math.round((progress / 100) * totalContents);

      return {
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
    if (course.totalContents) return course.totalContents;
    if (course.modules && Array.isArray(course.modules)) return course.modules.length;
    if (course.lessons && Array.isArray(course.lessons)) return course.lessons.length;
    if (course.contents && Array.isArray(course.contents)) return course.contents.length;
    if (course.sections && Array.isArray(course.sections)) {
      return course.sections.reduce((total, section) => {
        return total + (section.lessons?.length || 0);
      }, 0);
    }
    return 10; 
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
    console.log(" Analytics es NULL o UNDEFINED");
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
      {/* Header SIN fondo morado, limpio tipo tarjeta */}
      <div className="analytics-header">
        <div className="header-top-row">
          <button className="btn-back" onClick={() => navigate("/my-courses")}>
            <span className="back-arrow">←</span>
            <span>Volver a Mis Cursos</span>
          </button>
          <span className="course-id-pill">ID: {courseId}</span>
        </div>

        <div className="header-text-block">
          <h1 className="analytics-title">Analytics del Curso</h1>
          <h2 className="course-title">{analytics.course.title}</h2>
          {analytics.course.description && (
            <p className="course-description">{analytics.course.description}</p>
          )}
        </div>

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
          <div className="section-header-row">

        <h2 className="section-title">
          👥 Progreso de Estudiantes
        </h2>
            <span className="section-counter-pill">{analytics.students.length} estudiantes</span>
          </div>
        
        {analytics.students.length > 0 ? (
          <div className="students-list">
            {analytics.students.map((student, index) => {
              const statusConfig = getStatusConfig(student.status);
              const uniqueKey = student.studentId || student._id || `student-${index}`;
              
              return (
                <div key={uniqueKey} className="student-card">
                  <div className="student-info">
                    <h4>{student.name || "Estudiante"}</h4>
                    <p className="student-email">{student.email || "Sin email"}</p>
                    <p className="student-activity">
                      Última actividad: {formatDate(student.lastActivity)}
                    </p>
                    <p className="student-completed">
                      {student.completedContents || 0} de {analytics.course.totalContents} contenidos completados
                    </p>
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

      {/* Insights Inteligentes */}
      <InsightsPanel insights={analytics.insights || []} />

      {/* Acciones */}
      <div className="actions-section">
        <button className="btn-primary" onClick={loadAnalytics}>
          🔄 Actualizar Datos
        </button>
        <button className="btn-secondary" onClick={() => navigate(`/courses/${courseId}`)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122"/>
          </svg>
          Ver Curso
        </button>
      </div>
      
    </div>
  );
}
