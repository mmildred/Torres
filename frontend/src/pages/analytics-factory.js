/**
 * Factory Pattern para crear Analytics con diferentes decorators
 * Permite configurar dinámicamente qué análisis mostrar
 */

const decoratorRegistry = {
  predictive: {
    name: 'PredictiveAnalyticsDecorator',
    description: 'Análisis predictivo y proyecciones',
    requires: ['students', 'summary'],
    decoratorClass: PredictiveAnalyticsDecorator
  },
  comparative: {
    name: 'ComparativeAnalyticsDecorator',
    description: 'Análisis comparativo y segmentación',
    requires: ['students'],
    decoratorClass: ComparativeAnalyticsDecorator
  },
  recommendations: {
    name: 'RecommendationDecorator',
    description: 'Recomendaciones inteligentes',
    requires: ['students', 'summary', 'course'],
    decoratorClass: RecommendationDecorator
  },
  sentiment: {
    name: 'SentimentAnalysisDecorator',
    description: 'Análisis de sentimientos',
    requires: ['students'],
    decoratorClass: SentimentAnalysisDecorator
  }
};

/**
 * Factory principal para crear analytics configurados
 */
class AnalyticsFactory {
  /**
   * Crea analytics con decorators específicos
   * @param {Object} analyticsData - Datos del curso
   * @param {Array|string} decorators - Lista de decorators a aplicar
   * @param {Object} options - Opciones adicionales
   */
  static createAnalytics(analyticsData, decorators = 'all', options = {}) {
    // Validar datos mínimos
    if (!analyticsData || !analyticsData.course) {
      throw new Error('Datos de analytics inválidos');
    }

    // Crear instancia base
    let analytics = new AnalyticsBase(analyticsData);

    // Determinar qué decorators aplicar
    const decoratorsToApply = this.resolveDecorators(decorators, analyticsData);

    // Aplicar cada decorator
    decoratorsToApply.forEach(decoratorType => {
      const decoratorConfig = decoratorRegistry[decoratorType];
      if (decoratorConfig) {
        // Verificar requisitos
        const hasRequirements = this.checkRequirements(decoratorConfig.requires, analyticsData);
        if (hasRequirements) {
          analytics = new decoratorConfig.decoratorClass(analytics, options);
        } else {
          console.warn(`Decorator ${decoratorType} no aplicado: faltan datos requeridos`);
        }
      }
    });

    return analytics;
  }

  /**
   * Crea analytics basado en el rol del usuario
   */
  static createAnalyticsForRole(analyticsData, userRole, options = {}) {
    const roleConfigs = {
      admin: ['predictive', 'comparative', 'recommendations', 'sentiment'],
      teacher: ['predictive', 'comparative', 'recommendations'],
      student: ['predictive', 'sentiment'],
      guest: ['predictive']
    };

    const decorators = roleConfigs[userRole] || roleConfigs.guest;
    return this.createAnalytics(analyticsData, decorators, options);
  }

  /**
   * Crea analytics para un objetivo específico
   */
  static createAnalyticsForPurpose(analyticsData, purpose, options = {}) {
    const purposeConfigs = {
      retention: ['predictive', 'recommendations'], // Para retención de estudiantes
      engagement: ['sentiment', 'comparative'],     // Para compromiso
      performance: ['predictive', 'comparative'],   // Para rendimiento
      quick: ['predictive'],                        // Vista rápida
      full: 'all'                                   // Todos los análisis
    };

    const decorators = purposeConfigs[purpose] || purposeConfigs.quick;
    return this.createAnalytics(analyticsData, decorators, options);
  }

  /**
   * Obtiene la lista de decorators disponibles
   */
  static getAvailableDecorators() {
    return Object.entries(decoratorRegistry).map(([key, config]) => ({
      id: key,
      name: config.name,
      description: config.description,
      requires: config.requirements || []
    }));
  }

  /**
   * Valida si se pueden aplicar ciertos decorators a los datos
   */
  static validateDecorators(decorators, analyticsData) {
    const validationResults = {};
    
    decorators.forEach(decoratorType => {
      const config = decoratorRegistry[decoratorType];
      if (config) {
        validationResults[decoratorType] = {
          canApply: this.checkRequirements(config.requires, analyticsData),
          missingData: this.getMissingRequirements(config.requires, analyticsData)
        };
      }
    });

    return validationResults;
  }

  // Métodos privados auxiliares
  static resolveDecorators(decorators, analyticsData) {
    if (decorators === 'all') {
      return Object.keys(decoratorRegistry);
    }
    
    if (typeof decorators === 'string') {
      return [decorators];
    }
    
    if (Array.isArray(decorators)) {
      return decorators;
    }
    
    return ['predictive']; // Por defecto
  }

  static checkRequirements(requirements, analyticsData) {
    if (!requirements || requirements.length === 0) return true;
    
    return requirements.every(req => {
      if (req === 'students') return analyticsData.students && analyticsData.students.length > 0;
      if (req === 'summary') return analyticsData.summary;
      if (req === 'course') return analyticsData.course;
      return true;
    });
  }

  static getMissingRequirements(requirements, analyticsData) {
    if (!requirements) return [];
    
    return requirements.filter(req => {
      if (req === 'students') return !analyticsData.students || analyticsData.students.length === 0;
      if (req === 'summary') return !analyticsData.summary;
      if (req === 'course') return !analyticsData.course;
      return false;
    });
  }
}

/**
 * Decorator Builder - Para construcción programática
 */
class AnalyticsBuilder {
  constructor(analyticsData) {
    this.analytics = new AnalyticsBase(analyticsData);
    this.appliedDecorators = [];
  }

  addPredictive(options = {}) {
    this.analytics = new PredictiveAnalyticsDecorator(this.analytics, options);
    this.appliedDecorators.push('predictive');
    return this;
  }

  addComparative(options = {}) {
    this.analytics = new ComparativeAnalyticsDecorator(this.analytics, options);
    this.appliedDecorators.push('comparative');
    return this;
  }

  addRecommendations(options = {}) {
    this.analytics = new RecommendationDecorator(this.analytics, options);
    this.appliedDecorators.push('recommendations');
    return this;
  }

  addSentiment(options = {}) {
    this.analytics = new SentimentAnalysisDecorator(this.analytics, options);
    this.appliedDecorators.push('sentiment');
    return this;
  }

  build() {
    return {
      analytics: this.analytics,
      appliedDecorators: this.appliedDecorators
    };
  }
}

/**
 * Decorator personalizado - Ejemplo de cómo extender
 */
class CustomAnalyticsDecorator extends AnalyticsDecorator {
  constructor(wrapped, options = {}) {
    super(wrapped);
    this.options = options;
  }

  getInsights() {
    const baseInsights = super.getInsights();
    const customInsights = this.generateCustomInsights();
    return [...baseInsights, ...customInsights];
  }

  generateCustomInsights() {
    // Lógica personalizada aquí
    return [{
      type: 'custom',
      title: 'Análisis Personalizado',
      message: 'Este es un análisis personalizado creado dinámicamente',
      customData: this.options.customData || {}
    }];
  }
}

// Registrar decorator personalizado
decoratorRegistry.custom = {
  name: 'CustomAnalyticsDecorator',
  description: 'Decorator personalizado para análisis específicos',
  requires: [],
  decoratorClass: CustomAnalyticsDecorator
};

// Exportar todo
export {
  AnalyticsFactory,
  AnalyticsBuilder,
  CustomAnalyticsDecorator,
  decoratorRegistry
};