// Interface base
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

// Decorator Base
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

    if (students.length >= 3) {
      const completionTrend = this.calculateCompletionTrend(students);
      const predictedCompletion = Math.max(0, Math.min(100, summary.completionRate + completionTrend));
      
      insights.push({
        type: 'prediction',
        title: ' Proyección de Finalización',
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
        title: ' Estudiantes en Riesgo',
        message: `${atRiskStudents.length} estudiante(s) muestran signos de posible abandono`,
        students: atRiskStudents,
        recommendation: 'Considera contactarlos para ofrecer apoyo adicional',
        priority: 'high'
      });
    }

    const problematicContent = this.identifyProblematicContent(students);
    if (problematicContent.length > 0) {
      insights.push({
        type: 'content-risk',
        title: ' Contenido que Requiere Atención',
        message: `Se detectaron posibles puntos de dificultad en el curso`,
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
      return ['Los estudiantes tienden a estancarse en las primeras etapas del curso'];
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

// 2. Decorator de Análisis Comparativo (SIMPLIFICADO - sin benchmark de industria)
class ComparativeAnalyticsDecorator extends AnalyticsDecorator {
  getInsights() {
    const baseInsights = super.getInsights();
    const data = this.getData();
    
    const comparativeInsights = this.generateComparativeInsights(data);
    return [...baseInsights, ...comparativeInsights];
  }

  generateComparativeInsights(data) {
    const insights = [];
    const { students, summary } = data;

    if (students.length === 0) return insights;

    // Análisis de segmentación
    const segments = this.analyzeStudentSegments(students);
    insights.push({
      type: 'segmentation',
      title: ' Perfil de Estudiantes',
      message: this.generateSegmentationMessage(segments, students.length),
      segments: segments
    });

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
      return `Mayoría de estudiantes avanzados (${percentages.advanced}%) - ¡Excelente compromiso!`;
    } else if (percentages.intermediate > 40) {
      return `Grupo balanceado con ${percentages.intermediate}% en nivel intermedio`;
    } else if (percentages.notStarted > 30) {
      return `Alto porcentaje de no iniciados (${percentages.notStarted}%) - Oportunidad de motivación`;
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
        title: '🐌 Ritmo de Aprendizaje Lento',
        message: 'El progreso promedio es bajo. Considera revisar la dificultad del contenido',
        averageProgress: Math.round(avgProgress),
        priority: 'medium'
      };
    } else if (avgProgress > 75) {
      return {
        type: 'pace',
        title: '⚡ Ritmo Acelerado',
        message: 'Los estudiantes avanzan rápidamente. ¡Excelente trabajo!',
        averageProgress: Math.round(avgProgress)
      };
    }

    return null;
  }
}

// 3. Decorator de Recomendaciones Inteligentes
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

    // Recomendación basada en tasa de finalización
    if (summary.completionRate < 40 && students.length > 5) {
      recommendations.push({
        type: 'recommendation',
        title: ' Estrategia de Retención',
        message: 'La tasa de finalización sugiere oportunidades para mejorar la retención',
        actions: [
          'Implementar recordatorios automáticos semanales',
          'Crear sesiones de preguntas y respuestas en vivo',
          'Ofrecer certificados de finalización'
        ],
        priority: 'high',
        category: 'retention'
      });
    }

    // Recomendación basada en estudiantes inactivos
    const inactiveStudents = students.filter(s => {
      const daysInactive = this.getDaysSinceLastActivity(s.lastActivity);
      return daysInactive > 14 && s.progress < 100;
    });
    
    if (inactiveStudents.length > 0) {
      recommendations.push({
        type: 'recommendation',
        title: ' Campaña de Reactivación',
        message: `${inactiveStudents.length} estudiante(s) inactivo(s) detectados`,
        actions: [
          'Enviar correo personalizado de reactivación',
          'Ofrecer tutoría individual',
          'Revisar puntos de dificultad específicos'
        ],
        students: inactiveStudents.slice(0, 3).map(s => s.name),
        priority: inactiveStudents.length > 2 ? 'high' : 'medium',
        category: 'reactivation'
      });
    }

    // Recomendación basada en distribución de progreso
    const segments = this.analyzeStudentSegments(students);
    if (segments.notStarted > students.length * 0.4) {
      recommendations.push({
        type: 'recommendation',
        title: 'Estrategia de Inicio',
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

    // Recomendación de contenido
    if (course.totalContents < 8) {
      recommendations.push({
        type: 'recommendation',
        title: ' Expansión de Contenido',
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

// 4. Decorator de Análisis de Sentimientos
class SentimentAnalysisDecorator extends AnalyticsDecorator {
  getInsights() {
    const baseInsights = super.getInsights();
    const data = this.getData();
    
    const sentimentInsights = this.generateSentimentInsights(data);
    return [...baseInsights, ...sentimentInsights];
  }

  generateSentimentInsights(data) {
    const insights = [];
    const { students, summary } = data;

    if (students.length === 0) return insights;

    // Simular análisis de sentimientos basado en patrones de progreso
    const sentimentScore = this.calculateOverallSentiment(students);
    
    if (sentimentScore >= 80) {
      insights.push({
        type: 'sentiment',
        title: ' Ambiente Positivo',
        message: 'Los estudiantes muestran alto compromiso y motivación',
        emoji: '😊',
        score: sentimentScore,
        details: 'El progreso constante indica satisfacción con el contenido',
        recommendations: [
          'Mantener el ritmo actual de contenido',
          'Celebrar los logros del grupo'
        ]
      });
    } else if (sentimentScore >= 60) {
      insights.push({
        type: 'sentiment',
        title: ' Progreso Estable',
        message: 'Los estudiantes avanzan a buen ritmo',
        emoji: '👍',
        score: sentimentScore,
        details: 'Progreso constante con pocas señales de frustración',
        recommendations: [
          'Monitorear estudiantes con progreso lento',
          'Ofrecer sesiones de refuerzo opcionales'
        ]
      });
    } else if (sentimentScore >= 40) {
      insights.push({
        type: 'sentiment',
        title: ' Necesita Atención',
        message: 'Algunos estudiantes muestran signos de desmotivación',
        emoji: '😐',
        score: sentimentScore,
        details: 'Progreso irregular y posibles puntos de dificultad',
        recommendations: [
          'Identificar contenidos problemáticos',
          'Enviar encuesta de satisfacción',
          'Ofrecer tutorías personalizadas'
        ],
        priority: 'medium'
      });
    } else {
      insights.push({
        type: 'sentiment',
        title: ' Intervención Requerida',
        message: 'Baja motivación general detectada',
        emoji: '😟',
        score: sentimentScore,
        details: 'Progreso estancado y alta inactividad',
        recommendations: [
          'Revisar estructura del curso',
          'Contactar estudiantes individualmente',
          'Considerar rediseño de contenido'
        ],
        priority: 'high'
      });
    }

    // Detectar estudiantes específicos con baja motivación
    const lowMotivationStudents = this.identifyLowMotivationStudents(students);
    if (lowMotivationStudents.length > 0) {
      insights.push({
        type: 'sentiment-detail',
        title: ' Estudiantes Desmotivados',
        message: `${lowMotivationStudents.length} estudiante(s) necesitan apoyo adicional`,
        students: lowMotivationStudents,
        action: 'Contactar con mensaje de apoyo y ofrecer ayuda'
      });
    }

    return insights;
  }

  calculateOverallSentiment(students) {
    if (students.length === 0) return 50;

    let totalScore = 0;
    
    students.forEach(student => {
      let studentScore = 50; 
      
      studentScore += (student.progress / 100) * 20;
      
      const consistency = this.calculateConsistency(student);
      studentScore += consistency * 15;
      
      const activityScore = this.getActivitySentimentScore(student.lastActivity);
      studentScore += activityScore;
      
      totalScore += Math.max(0, Math.min(100, studentScore));
    });

    return Math.round(totalScore / students.length);
  }

  calculateConsistency(student) {
    
    if (student.progress === 0) return 0.3;
    if (student.progress === 100) return 0.9;
    
    const daysSinceActivity = this.getDaysSinceLastActivity(student.lastActivity);
    if (daysSinceActivity > 30) return 0.2;
    if (daysSinceActivity > 14) return 0.4;
    if (daysSinceActivity > 7) return 0.6;
    return 0.8;
  }

  getActivitySentimentScore(lastActivity) {
    const days = this.getDaysSinceLastActivity(lastActivity);
    if (days <= 1) return 15;
    if (days <= 3) return 10;
    if (days <= 7) return 5;
    if (days <= 14) return 0;
    return -10;
  }

  identifyLowMotivationStudents(students) {
    return students.filter(student => {
      const sentimentScore = this.calculateStudentSentiment(student);
      return sentimentScore < 40;
    }).slice(0, 5).map(s => ({
      name: s.name,
      email: s.email,
      progress: s.progress,
      lastActivity: s.lastActivity,
      sentiment: this.getSentimentLabel(this.calculateStudentSentiment(s))
    }));
  }

  calculateStudentSentiment(student) {
    let score = student.progress; 

    const daysInactive = this.getDaysSinceLastActivity(student.lastActivity);
    if (daysInactive > 21) score -= 30;
    else if (daysInactive > 14) score -= 20;
    else if (daysInactive > 7) score -= 10;
    if (student.progress > 80) score += 10;
    
    return Math.max(0, Math.min(100, score));
  }

  getSentimentLabel(score) {
    if (score >= 80) return 'Muy positivo';
    if (score >= 60) return 'Positivo';
    if (score >= 40) return 'Neutral';
    if (score >= 20) return 'Negativo';
    return 'Muy negativo';
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

// Función para aplicar solo los decorators que quieres mantener
const enhanceAnalyticsWithAI = (analyticsData) => {
  let analytics = new AnalyticsBase(analyticsData);
  analytics = new PredictiveAnalyticsDecorator(analytics);
  analytics = new ComparativeAnalyticsDecorator(analytics);
  analytics = new RecommendationDecorator(analytics);
  analytics = new SentimentAnalysisDecorator(analytics);
  
  return analytics;
};

export {
  AnalyticsBase,
  AnalyticsDecorator,
  PredictiveAnalyticsDecorator,
  ComparativeAnalyticsDecorator,
  RecommendationDecorator,
  SentimentAnalysisDecorator,
  enhanceAnalyticsWithAI
};