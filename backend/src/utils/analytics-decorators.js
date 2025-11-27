//Interface base
class AnalyticsBase {
  constructor(analyticsData) {
    this.analyticsData = analyticsData;
  }

  getData() {
    return this.analyticsData;
  }

  getInsights() {
    return [];
  }
}

//Decorator Base
class AnalyticsDecorator extends AnalyticsBase {
  constructor(wrapped) {
    super(wrapped.analyticsData);
    this.wrapped = wrapped;
  }

  getData() {
    return this.wrapped.getData();
  }

  getInsights() {
    return this.wrapped.getInsights();
  }
}

// 1. Decorator de Análisis Predictivo
class PredictiveAnalyticsDecorator extends AnalyticsDecorator {
  getInsights() {
    const baseInsights = super.getInsights();
    const data = this.getData();
    
    const predictiveInsights = this.generatePredictiveInsights(data);
    return [...baseInsights, ...predictiveInsights];
  }

  generatePredictiveInsights(data) {
    const insights = [];
    const { students, summary, course } = data;

    //Predicción de tasa de finalización
    if (students.length >= 3) {
      const completionTrend = this.calculateCompletionTrend(students);
      const predictedCompletion = Math.max(0, Math.min(100, summary.completionRate + completionTrend));
      
      insights.push({
        type: 'prediction',
        title: 'Proyección de Finalización',
        message: `Basado en el progreso actual, se proyecta una tasa de finalización del ${predictedCompletion}%`,
        confidence: this.calculateConfidence(students),
        trend: completionTrend > 0 ? 'up' : 'down',
        predictedValue: predictedCompletion
      });
    }

    const atRiskStudents = this.identifyAtRiskStudents(students);
    if (atRiskStudents.length > 0) {
      insights.push({
        type: 'risk',
        title: 'Estudiantes en Riesgo',
        message: `${atRiskStudents.length} estudiante(s) muestran signos de abandono`,
        students: atRiskStudents,
        recommendation: 'Considera contactarlos con recursos adicionales',
        priority: 'high'
      });
    }

    const problematicContent = this.identifyProblematicContent(students);
    if (problematicContent.length > 0) {
      insights.push({
        type: 'content-risk',
        title: 'Contenido Problemático',
        message: `Se detectaron puntos de dificultad en el curso`,
        problematicAreas: problematicContent,
        priority: 'medium'
      });
    }

    return insights;
  }

  calculateCompletionTrend(students) {
    const activeStudents = students.filter(s => s.progress > 0 && s.progress < 100);
    if (activeStudents.length === 0) return 0;

    const recentProgress = activeStudents.reduce((sum, student) => {
      const activityScore = this.getActivityScore(student.lastActivity);
      return sum + (student.progress * activityScore);
    }, 0) / activeStudents.length;

    return recentProgress * 0.1;
  }

  identifyAtRiskStudents(students) {
    return students.filter(student => {
      const daysSinceLastActivity = this.getDaysSinceLastActivity(student.lastActivity);
      return (student.progress < 30 && daysSinceLastActivity > 7) || 
             (student.progress > 0 && daysSinceLastActivity > 21);
    }).slice(0, 5).map(s => ({ name: s.name, email: s.email, progress: s.progress }));
  }

  identifyProblematicContent(students) {
    if (students.length < 5) return [];
    
    const stuckStudents = students.filter(s => s.progress > 0 && s.progress < 40);
    if (stuckStudents.length > students.length * 0.3) {
      return ['Los estudiantes tienden a estancarse en el progreso inicial'];
    }
    return [];
  }

  getDaysSinceLastActivity(lastActivity) {
    if (!lastActivity) return 999;
    try {
      const lastDate = new Date(lastActivity);
      const today = new Date();
      return Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  }

  getActivityScore(lastActivity) {
    const days = this.getDaysSinceLastActivity(lastActivity);
    if (days <= 1) return 1.0;
    if (days <= 3) return 0.7;
    if (days <= 7) return 0.4;
    return 0.1;
  }

  calculateConfidence(students) {
    const activeCount = students.filter(s => s.progress > 0 && s.progress < 100).length;
    return Math.min(95, Math.max(30, (activeCount / students.length) * 100));
  }
}

//2. Decorator de Análisis Comparativo
class ComparativeAnalyticsDecorator extends AnalyticsDecorator {
  getInsights() {
    const baseInsights = super.getInsights();
    const data = this.getData();
    
    const comparativeInsights = this.generateComparativeInsights(data);
    return [...baseInsights, ...comparativeInsights];
  }

  generateComparativeInsights(data) {
    const insights = [];
    const { students, summary, course } = data;

    if (students.length === 0) return insights;

    //Benchmark contra estándares
    const industryBenchmark = 65;
    const completionDiff = summary.completionRate - industryBenchmark;
    
    if (completionDiff > 15) {
      insights.push({
        type: 'achievement',
        title: '¡Excelente Rendimiento!',
        message: `Tu tasa de finalización (${summary.completionRate}%) supera por ${completionDiff}% el promedio de la industria`,
        benchmark: industryBenchmark,
        difference: completionDiff
      });
    } else if (completionDiff < -10) {
      insights.push({
        type: 'opportunity',
        title: 'Oportunidad de Mejora',
        message: `Tu tasa de finalización está ${Math.abs(completionDiff)}% por debajo del promedio de la industria`,
        benchmark: industryBenchmark,
        priority: 'medium'
      });
    }

    //Análisis de segmentación
    const segments = this.analyzeStudentSegments(students);
    insights.push({
      type: 'segmentation',
      title: 'Perfil de la Audiencia',
      message: this.generateSegmentationMessage(segments, students.length),
      segments: segments
    });

    //Análisis de ritmo de aprendizaje
    const paceAnalysis = this.analyzeLearningPace(students);
    if (paceAnalysis) {
      insights.push(paceAnalysis);
    }

    return insights;
  }

  analyzeStudentSegments(students) {
    const segments = { 
      advanced: 0, 
      intermediate: 0, 
      beginner: 0, 
      notStarted: 0 
    };
    
    students.forEach(student => {
      if (student.progress === 0) segments.notStarted++;
      else if (student.progress >= 80) segments.advanced++;
      else if (student.progress >= 40) segments.intermediate++;
      else segments.beginner++;
    });

    return segments;
  }

  generateSegmentationMessage(segments, total) {
    const percentages = {
      advanced: Math.round((segments.advanced / total) * 100),
      intermediate: Math.round((segments.intermediate / total) * 100),
      beginner: Math.round((segments.beginner / total) * 100),
      notStarted: Math.round((segments.notStarted / total) * 100)
    };

    if (percentages.advanced > 50) {
      return `Mayoría de estudiantes avanzados (${percentages.advanced}%) - ¡Excelente engagement!`;
    } else if (percentages.intermediate > 40) {
      return `Grupo balanceado con ${percentages.intermediate}% en nivel intermedio`;
    } else if (percentages.notStarted > 30) {
      return `Alto porcentaje de no iniciados (${percentages.notStarted}%) - Oportunidad de activación`;
    }

    return `Distribución: ${percentages.advanced}% avanzados, ${percentages.intermediate}% intermedios, ${percentages.beginner}% principiantes`;
  }

  analyzeLearningPace(students) {
    const activeStudents = students.filter(s => s.progress > 0);
    if (activeStudents.length < 3) return null;

    const avgProgress = activeStudents.reduce((sum, s) => sum + s.progress, 0) / activeStudents.length;
    
    if (avgProgress < 25) {
      return {
        type: 'pace',
        title: 'Ritmo de Aprendizaje Lento',
        message: 'El progreso promedio es bajo. Considera revisar la dificultad del contenido',
        averageProgress: Math.round(avgProgress),
        priority: 'medium'
      };
    } else if (avgProgress > 75) {
      return {
        type: 'pace',
        title: 'Ritmo Acelerado',
        message: 'Los estudiantes avanzan rápidamente. ¡Buen trabajo!',
        averageProgress: Math.round(avgProgress)
      };
    }

    return null;
  }
}

//3. Decorator de Recomendaciones Inteligentes
class RecommendationDecorator extends AnalyticsDecorator {
  getInsights() {
    const baseInsights = super.getInsights();
    const data = this.getData();
    
    const recommendations = this.generateRecommendations(data);
    return [...baseInsights, ...recommendations];
  }

  generateRecommendations(data) {
    const recommendations = [];
    const { students, summary, course } = data;

    //Recomendación basada en tasa de finalización
    if (summary.completionRate < 40 && students.length > 5) {
      recommendations.push({
        type: 'recommendation',
        title: 'Estrategia de Retención',
        message: 'La tasa de finalización sugiere oportunidades para mejorar la retención',
        actions: [
          'Implementar recordatorios automáticos semanales',
          'Crear sesiones de Q&A en vivo',
          'Ofrecer certificados de finalización'
        ],
        priority: 'high',
        category: 'retention'
      });
    }

    //Recomendación basada en estudiantes inactivos
    const inactiveStudents = students.filter(s => {
      const daysInactive = this.getDaysSinceLastActivity(s.lastActivity);
      return daysInactive > 14 && s.progress < 100;
    });
    
    if (inactiveStudents.length > 0) {
      recommendations.push({
        type: 'recommendation',
        title: 'Campaña de Reactivación',
        message: `${inactiveStudents.length} estudiante(s) inactivo(s) detectados`,
        actions: [
          'Enviar email personalizado de reactivación',
          'Ofrecer tutoría individual',
          'Revisar puntos de dificultad específicos'
        ],
        students: inactiveStudents.slice(0, 3).map(s => s.name),
        priority: inactiveStudents.length > 2 ? 'high' : 'medium',
        category: 'reactivation'
      });
    }

    //Recomendación basada en distribución de progreso
    const segments = this.analyzeStudentSegments(students);
    if (segments.notStarted > students.length * 0.4) {
      recommendations.push({
        type: 'recommendation',
        title: 'Estrategia de Onboarding',
        message: 'Muchos estudiantes no han comenzado. Mejora el proceso de inicio',
        actions: [
          'Crear un tour guiado del curso',
          'Establecer una meta de primera semana',
          'Enviar recordatorio de bienvenida'
        ],
        priority: 'medium',
        category: 'onboarding'
      });
    }

    //Recomendación de contenido
    if (course.totalContents < 8) {
      recommendations.push({
        type: 'recommendation',
        title: 'Expansión de Contenido',
        message: 'El curso tiene pocos módulos. Considera expandir el contenido',
        actions: [
          'Agregar estudios de caso prácticos',
          'Incluir recursos descargables',
          'Crear contenido avanzado opcional'
        ],
        priority: 'low',
        category: 'content'
      });
    }

    return recommendations;
  }

  analyzeStudentSegments(students) {
    const segments = { notStarted: 0 };
    students.forEach(student => {
      if (student.progress === 0) segments.notStarted++;
    });
    return segments;
  }

  getDaysSinceLastActivity(lastActivity) {
    if (!lastActivity) return 999;
    try {
      const lastDate = new Date(lastActivity);
      const today = new Date();
      return Math.floor((today - lastDate) / (1000 * 60 * 60 * 24));
    } catch {
      return 999;
    }
  }
}

// Función para aplicar todos los decorators
const enhanceAnalyticsWithAI = (analyticsData) => {
  let analytics = new AnalyticsBase(analyticsData);
  
  // Aplicar decorators en cascada
  analytics = new PredictiveAnalyticsDecorator(analytics);
  analytics = new ComparativeAnalyticsDecorator(analytics);
  analytics = new RecommendationDecorator(analytics);
  
  return analytics;
};

export {
  AnalyticsBase,
  AnalyticsDecorator,
  PredictiveAnalyticsDecorator,
  ComparativeAnalyticsDecorator,
  RecommendationDecorator,
  enhanceAnalyticsWithAI
};