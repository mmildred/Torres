import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api";
import { isAuthenticated } from "../auth";
import InsightsPanel from "../pages/InsightsPanel";
import { enhanceAnalyticsWithAI } from "./analytics-decorator";
import "./Analytics.css";

// 1. Clase Base de Analytics
class AnalyticsBase {
  constructor(data = {}) {
    this.data = data;
    this.insights = [];
    this.metrics = {};
    this.charts = [];
    this.recommendations = [];
  }

  getInsights() {
    return this.insights;
  }

  getMetrics() {
    return this.metrics;
  }

  getCharts() {
    return this.charts;
  }

  getRecommendations() {
    return this.recommendations;
  }

  getAllData() {
    return {
      insights: this.getInsights(),
      metrics: this.getMetrics(),
      charts: this.getCharts(),
      recommendations: this.getRecommendations(),
      rawData: this.data
    };
  }

  addInsight(insight) {
    this.insights.push(insight);
  }

  addMetric(key, value) {
    this.metrics[key] = value;
  }

  addChart(chart) {
    this.charts.push(chart);
  }

  addRecommendation(recommendation) {
    this.recommendations.push(recommendation);
  }
}

// 2. Decorator Base
class AnalyticsDecorator {
  constructor(wrapped) {
    this.wrapped = wrapped;
    this.data = wrapped.data;
  }

  getInsights() {
    return this.wrapped.getInsights();
  }

  getMetrics() {
    return this.wrapped.getMetrics();
  }

  getCharts() {
    return this.wrapped.getCharts();
  }

  getRecommendations() {
    return this.wrapped.getRecommendations();
  }

  getAllData() {
    return this.wrapped.getAllData();
  }

  addInsight(insight) {
    this.wrapped.addInsight(insight);
  }

  addMetric(key, value) {
    this.wrapped.addMetric(key, value);
  }

  addChart(chart) {
    this.wrapped.addChart(chart);
  }

  addRecommendation(recommendation) {
    this.wrapped.addRecommendation(recommendation);
  }
}

// 3. Decorator Predictivo
class PredictiveAnalyticsDecorator extends AnalyticsDecorator {
  constructor(wrapped, options = {}) {
    super(wrapped);
    this.options = options;
    this.applyPredictiveAnalysis();
  }

  applyPredictiveAnalysis() {
    const { students = [], summary } = this.data;
    
    if (students.length > 0) {
      const predictedCompletion = this.predictCompletionRate(students, summary);
      const atRiskStudents = this.identifyAtRiskStudents(students);
      
      this.addInsight({
        id: 'prediction-1',
        type: 'predictive',
        title: '📈 Proyección de finalización',
        value: `${predictedCompletion}%`,
        description: `Basado en el progreso actual, se espera que el ${predictedCompletion}% de estudiantes complete el curso`,
        severity: predictedCompletion > 70 ? 'success' : predictedCompletion > 50 ? 'warning' : 'danger',
        icon: '📈'
      });

      if (atRiskStudents > 0) {
        this.addInsight({
          id: 'prediction-2',
          type: 'predictive',
          title: '⚠️ Estudiantes en riesgo',
          value: `${atRiskStudents} estudiante(s)`,
          description: `${atRiskStudents} estudiante(s) podrían no completar el curso sin intervención`,
          severity: 'warning',
          icon: '⚠️'
        });

        this.addRecommendation({
          id: 'rec-risk-students',
          type: 'intervention',
          message: `Contacta a ${atRiskStudents} estudiante(s) en riesgo para ofrecer apoyo adicional`,
          action: 'contactStudents',
          priority: 'high'
        });
      }

      this.addMetric('predictedCompletion', predictedCompletion);
      this.addMetric('atRiskStudents', atRiskStudents);
    }
  }

  predictCompletionRate(students, summary) {
    const currentRate = summary?.completionRate || 0;
    const avgProgress = summary?.avgProgress || 0;
    
    let prediction;
    if (avgProgress > 80) {
      prediction = Math.min(100, currentRate * 1.3);
    } else if (avgProgress > 50) {
      prediction = Math.min(100, currentRate * 1.15);
    } else {
      prediction = Math.min(100, currentRate * 0.9);
    }
    
    return Math.round(prediction);
  }

  identifyAtRiskStudents(students) {
    return students.filter(student => {
      const progress = student.progress || 0;
      const lastActivity = student.lastActivity;
      
      let isInactive = false;
      if (lastActivity) {
        const daysSinceActivity = Math.floor(
          (new Date() - new Date(lastActivity)) / (1000 * 60 * 60 * 24)
        );
        isInactive = daysSinceActivity > 7;
      }
      
      return progress < 30 && (isInactive || !lastActivity);
    }).length;
  }
}

// 4. Decorator Comparativo
class ComparativeAnalyticsDecorator extends AnalyticsDecorator {
  constructor(wrapped, options = {}) {
    super(wrapped);
    this.options = options;
    this.applyComparativeAnalysis();
  }

  applyComparativeAnalysis() {
    const { students = [], summary } = this.data;
    
    if (students.length > 1) {
      const progressValues = students.map(s => s.progress || 0).sort((a, b) => a - b);
      const medianProgress = this.calculateMedian(progressValues);
      const top25Percent = this.calculatePercentile(progressValues, 75);
      
      this.addInsight({
        id: 'comparative-1',
        type: 'comparative',
        title: '📊 Distribución del progreso',
        value: `Mediana: ${medianProgress}%`,
        description: `El 50% de los estudiantes tiene progreso mayor a ${medianProgress}%`,
        severity: medianProgress > 60 ? 'success' : 'info',
        icon: '📊'
      });

      this.addMetric('medianProgress', medianProgress);
      this.addMetric('top25Threshold', top25Percent);
    }
  }

  calculateMedian(values) {
    const mid = Math.floor(values.length / 2);
    return values.length % 2 !== 0 
      ? values[mid] 
      : (values[mid - 1] + values[mid]) / 2;
  }

  calculatePercentile(values, percentile) {
    const index = Math.ceil((percentile / 100) * values.length) - 1;
    return values[Math.max(0, index)];
  }
}

// 5. Decorator AI (compatible con tu función existente)
class AIEnhancementDecorator extends AnalyticsDecorator {
  constructor(wrapped) {
    super(wrapped);
    this.enhanceWithAI();
  }

  enhanceWithAI() {
    const { summary, students = [], course } = this.data;
    
    if (!summary || students.length === 0) return;

    const aiInsights = this.generateAIInsights(summary, students, course);
    const recommendations = this.generateRecommendations(summary, students);
    
    aiInsights.forEach(insight => this.addInsight(insight));
    recommendations.forEach(rec => this.addRecommendation(rec));
  }

  generateAIInsights(summary, students, course) {
    const insights = [];
    
    // Mantén la misma lógica que tu función original
    if (summary.completionRate > 70) {
      insights.push({
        id: 'ai-high-completion',
        type: 'success',
        title: '🎯 Alta tasa de finalización',
        description: `El ${summary.completionRate}% de los estudiantes han completado el curso. Excelente trabajo!`,
        severity: 'success',
        icon: '🎯'
      });
    } else if (summary.completionRate < 30) {
      insights.push({
        id: 'ai-low-completion',
        type: 'warning',
        title: '📉 Tasa de finalización baja',
        description: `Solo el ${summary.completionRate}% ha completado el curso. Considera revisar la dificultad o estructura.`,
        severity: 'warning',
        icon: '📉'
      });
    }

    if (summary.notStartedStudents > students.length * 0.3) {
      insights.push({
        id: 'ai-many-not-started',
        type: 'warning',
        title: '⏸️ Muchos estudiantes sin iniciar',
        description: `${summary.notStartedStudents} estudiantes (${Math.round((summary.notStartedStudents / students.length) * 100)}%) aún no han comenzado.`,
        severity: 'warning',
        icon: '⏸️'
      });
    }

    if (summary.avgProgress > 80) {
      insights.push({
        id: 'ai-high-engagement',
        type: 'success',
        title: '🚀 Alto compromiso',
        description: `Progreso promedio del ${summary.avgProgress}%. Los estudiantes están muy comprometidos.`,
        severity: 'success',
        icon: '🚀'
      });
    }

    const strugglingStudents = students.filter(s => s.progress < 30 && s.progress > 0);
    if (strugglingStudents.length > 0) {
      insights.push({
        id: 'ai-struggling-students',
        type: 'warning',
        title: '🆘 Estudiantes necesitan ayuda',
        description: `${strugglingStudents.length} estudiantes tienen menos del 30% de progreso.`,
        severity: 'warning',
        icon: '🆘',
        students: strugglingStudents.map(s => s.name)
      });
    }

    return insights;
  }

  generateRecommendations(summary, students) {
    const recommendations = [];
    
    if (summary.notStartedStudents > 0) {
      recommendations.push({
        id: 'rec-engagement',
        type: 'engagement',
        message: `Envía recordatorios a los ${summary.notStartedStudents} estudiantes que no han iniciado`,
        action: 'sendReminders',
        priority: 'medium'
      });
    }

    if (summary.avgProgress < 50) {
      recommendations.push({
        id: 'rec-content',
        type: 'content',
        message: 'Considera revisar la dificultad del contenido o agregar materiales adicionales',
        action: 'reviewContent',
        priority: 'high'
      });
    }

    return recommendations;
  }
}

// 6. Factory Simple - CAMBIA ESTE NOMBRE
class AnalyticsFactory {
  static createAnalytics(analyticsData, options = {}) {
    const {
      includePredictive = true,
      includeComparative = true,
      includeAI = true
    } = options;
    
    let analytics = new AnalyticsBase(analyticsData);
    
    // Primero aplicamos el AI enhancement
    if (includeAI) {
      analytics = new AIEnhancementDecorator(analytics);
    }
    
    // Luego los otros decorators
    if (includePredictive) {
      analytics = new PredictiveAnalyticsDecorator(analytics, options);
    }
    
    if (includeComparative && analyticsData.students?.length > 5) {
      analytics = new ComparativeAnalyticsDecorator(analytics, options);
    }
    
    return analytics;
  }
}

// 7. Función puente para compatibilidad - USA UN NOMBRE DIFERENTE
const createEnhancedAnalytics = (analyticsData, options = {}) => {
  return AnalyticsFactory.createAnalytics(analyticsData, options);
};

// Exportar para usar si es necesario
window.AnalyticsFactory = AnalyticsFactory;
window.createEnhancedAnalytics = createEnhancedAnalytics;

// ====== FIN DEL CÓDIGO A AÑADIR ======

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
      console.log("🔍 Analytics procesados:", processedAnalytics);
      
      // ====== DEBUG DETALLADO ======
      console.log("=== DEBUG COMIENZA ===");
      
      // 1. Verifica datos básicos
      console.log("📋 Datos disponibles:");
      console.log("- Estudiantes:", processedAnalytics.students?.length || 0);
      console.log("- Summary:", processedAnalytics.summary);
      
      // 2. Prueba tu función original
      console.log("🧪 Probando enhanceAnalyticsWithAI...");
      try {
        const aiResult = enhanceAnalyticsWithAI(processedAnalytics);
        console.log("✅ Resultado AI:", aiResult);
        console.log("📊 Insights de AI:", aiResult.insights || aiResult.getInsights?.() || []);
        console.log("🔢 Cantidad de insights AI:", (aiResult.insights || aiResult.getInsights?.() || []).length);
      } catch (aiError) {
        console.error("❌ Error en enhanceAnalyticsWithAI:", aiError);
      }
      
      // 3. Prueba la factory
      console.log("🏭 Probando createEnhancedAnalytics...");
      try {
        const factoryResult = createEnhancedAnalytics(processedAnalytics, {
          includePredictive: true,
          includeComparative: true
        });
        console.log("✅ Resultado Factory:", factoryResult);
        console.log("📊 Insights de Factory:", factoryResult.getInsights?.() || []);
        console.log("🔢 Cantidad de insights Factory:", (factoryResult.getInsights?.() || []).length);
      } catch (factoryError) {
        console.error("❌ Error en createEnhancedAnalytics:", factoryError);
      }
      
      console.log("=== DEBUG TERMINA ===");
      // ====== FIN DEBUG ======
      
      // 1. Tu AI original
      const withAI = enhanceAnalyticsWithAI(processedAnalytics);
      const aiInsights = withAI.insights || withAI.getInsights?.() || [];
      
      // 2. Factory para extras
      const withFactory = createEnhancedAnalytics(processedAnalytics, {
        includePredictive: true,
        includeComparative: true
      });
      const factoryInsights = withFactory.getInsights?.() || [];
      
      // 3. Combinar
      const allInsights = [...aiInsights, ...factoryInsights];
      const allRecommendations = withFactory.getRecommendations?.() || [];
      const allMetrics = withFactory.getMetrics?.() || {};
      
      console.log("🎯 INSIGHTS FINALES:");
      console.log("- AI Insights:", aiInsights.length);
      console.log("- Factory Insights:", factoryInsights.length);
      console.log("- Total:", allInsights.length);
      console.log("- Contenido:", allInsights);
      
      setAnalytics({
        ...processedAnalytics,
        insights: allInsights,
        recommendations: allRecommendations,
        metrics: {
          ...processedAnalytics.summary,
          ...allMetrics
        }
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
    
    // ====== USA LA NUEVA FUNCIÓN ======
    const enhancedAnalytics = createEnhancedAnalytics(processedAnalytics, {
      includePredictive: true,
      includeComparative: enrollments.length > 5,
      includeAI: true
    });
    
    console.log("📈 Analytics construidos:", enhancedAnalytics.getAllData());
    
    setAnalytics({
      ...processedAnalytics,
      insights: enhancedAnalytics.getInsights(),
      recommendations: enhancedAnalytics.getRecommendations(),
      metrics: {
        ...processedAnalytics.summary,
        ...enhancedAnalytics.getMetrics()
      }
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
      {/* Controles de Analytics */}
<div className="analytics-controls">
  <div className="control-group">
    <label>
      <input 
        type="checkbox" 
        checked={true}
        readOnly
      /> Análisis Predictivo
    </label>
    <label>
      <input 
        type="checkbox" 
        checked={analytics?.students?.length > 5}
        readOnly
      /> Análisis Comparativo {analytics?.students?.length > 5 ? '(Disponible)' : '(Necesita 6+ estudiantes)'}
    </label>
    <label>
      <input type="checkbox" checked={true} readOnly /> Insights AI
    </label>
  </div>
  
  {analytics?.metrics?.predictedCompletion && (
    <div className="prediction-badge">
      <span className="badge-label">Proyección:</span>
      <span className="badge-value">{analytics.metrics.predictedCompletion}% finalización</span>
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
      {/* Métricas Predictivas */}
{analytics?.metrics?.predictedCompletion && (
  <div className="additional-metrics">
    <div className="metric-card">
      <div className="metric-value">{analytics.metrics.predictedCompletion}%</div>
      <div className="metric-label">Proyección Finalización</div>
    </div>
    
    {analytics.metrics.atRiskStudents > 0 && (
      <div className="metric-card">
        <div className="metric-value" style={{color: '#ef4444'}}>
          {analytics.metrics.atRiskStudents}
        </div>
        <div className="metric-label">En Riesgo</div>
      </div>
    )}
    
    {analytics.metrics.medianProgress && (
      <div className="metric-card">
        <div className="metric-value">{analytics.metrics.medianProgress}%</div>
        <div className="metric-label">Progreso Mediano</div>
      </div>
    )}
  </div>
)}


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
