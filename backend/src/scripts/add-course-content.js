// backend/src/scripts/add-course-content.js
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';
import fs from 'fs';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/classroom';

// Schema para el curso
const courseSchema = new mongoose.Schema({
  title: String,
  description: String,
  category: String,
  level: String,
  duration: String,
  thumbnail: String,
  owner: Object,
  instructors: Array,
  contents: Array,
  isPublished: Boolean,
  createdAt: Date,
  updatedAt: Date
}, { collection: 'courses' });

const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);

// Contenido específico por categoría de curso
const courseContentTemplates = {
  // 🎨 DISEÑO Y CREATIVIDAD
  "Diseño UX/UI": [
    {
      title: "Fundamentos del Diseño UX",
      type: "document",
      description: "Introducción a los principios básicos del User Experience Design",
      instructions: "Lee este documento para entender los conceptos fundamentales del UX",
      duration: 45,
      order: 1,
      isPublished: true
    },
    {
      title: "Guía de Investigación de Usuarios",
      type: "document", 
      description: "Métodos y técnicas para investigar las necesidades de los usuarios",
      instructions: "Sigue esta guía para planificar tu investigación de usuarios",
      duration: 60,
      order: 2,
      isPublished: true
    },
    {
      title: "Figma: Primera Interfaz",
      type: "video",
      description: "Tutorial práctico creando tu primera interfaz en Figma",
      instructions: "Sigue el tutorial paso a paso para crear tu primer diseño",
      duration: 90,
      order: 3,
      isPublished: true
    },
    {
      title: "Patrones de Diseño Comunes",
      type: "document",
      description: "Colección de patrones de diseño UX/UI para diferentes casos de uso",
      instructions: "Estudia estos patrones para aplicarlos en tus proyectos",
      duration: 30,
      order: 4,
      isPublished: true
    },
    {
      title: "Proyecto Práctico: App Móvil",
      type: "assignment",
      description: "Diseña una aplicación móvil completa desde la investigación hasta el prototipo",
      instructions: "Completa este proyecto aplicando todo lo aprendido",
      duration: 120,
      order: 5,
      isPublished: true
    }
  ],

  "Diseño Gráfico": [
    {
      title: "Introducción a Illustrator",
      type: "document",
      description: "Primeros pasos con las herramientas básicas de Adobe Illustrator",
      instructions: "Familiarízate con la interfaz y herramientas principales",
      duration: 40,
      order: 1,
      isPublished: true
    },
    {
      title: "Creación de Logotipos",
      type: "video",
      description: "Proceso completo para diseñar logotipos profesionales",
      instructions: "Sigue el proceso creativo para diseñar un logo",
      duration: 75,
      order: 2,
      isPublished: true
    },
    {
      title: "Teoría del Color Aplicada",
      type: "document",
      description: "Guía práctica sobre combinación de colores y paletas",
      instructions: "Aprende a crear paletas de colores efectivas",
      duration: 50,
      order: 3,
      isPublished: true
    },
    {
      title: "Tipografía Profesional",
      type: "document",
      description: "Selección y combinación de tipografías para diseños",
      instructions: "Domina el uso de tipografías en tus proyectos",
      duration: 45,
      order: 4,
      isPublished: true
    },
    {
      title: "Proyecto: Branding Completo",
      type: "assignment",
      description: "Crea un sistema de identidad visual completo para una marca",
      instructions: "Desarrolla logo, colores y tipografía para una marca ficticia",
      duration: 150,
      order: 5,
      isPublished: true
    }
  ],

  "Fotografía": [
    {
      title: "Configuración de Cámara DSLR",
      type: "document",
      description: "Guía completa de configuración de cámara para principiantes",
      instructions: "Aprende a configurar tu cámara en modo manual",
      duration: 60,
      order: 1,
      isPublished: true
    },
    {
      title: "Composición Fotográfica",
      type: "video",
      description: "Reglas de composición para fotos impactantes",
      instructions: "Aplica las reglas de composición en tus fotos",
      duration: 55,
      order: 2,
      isPublished: true
    },
    {
      title: "Técnicas de Iluminación",
      type: "document",
      description: "Domina la iluminación natural y artificial",
      instructions: "Practica con diferentes tipos de iluminación",
      duration: 70,
      order: 3,
      isPublished: true
    },
    {
      title: "Edición en Lightroom",
      type: "video",
      description: "Flujo de trabajo completo en Adobe Lightroom",
      instructions: "Edita tus fotos siguiendo este flujo profesional",
      duration: 80,
      order: 4,
      isPublished: true
    },
    {
      title: "Sesión Fotográfica Práctica",
      type: "assignment",
      description: "Planifica y ejecuta una sesión fotográfica completa",
      instructions: "Desarrolla una sesión desde la planificación hasta la edición",
      duration: 180,
      order: 5,
      isPublished: true
    }
  ],

  // 💻 PROGRAMACIÓN
  "Programación": [
    {
      title: "JavaScript ES6+ Fundamentals",
      type: "document",
      description: "Nuevas características de JavaScript moderno",
      instructions: "Estudia y practica las nuevas características de ES6+",
      duration: 90,
      order: 1,
      isPublished: true
    },
    {
      title: "Async/Await y Promises",
      type: "video",
      description: "Programación asíncrona en JavaScript",
      instructions: "Domina el manejo de operaciones asíncronas",
      duration: 75,
      order: 2,
      isPublished: true
    },
    {
      title: "Manipulación del DOM",
      type: "document",
      description: "Trabajo avanzado con el Document Object Model",
      instructions: "Practica la manipulación dinámica del DOM",
      duration: 60,
      order: 3,
      isPublished: true
    },
    {
      title: "Proyecto: Aplicación Web",
      type: "assignment",
      description: "Desarrolla una aplicación web interactiva con JavaScript",
      instructions: "Crea una aplicación usando todo lo aprendido",
      duration: 120,
      order: 4,
      isPublished: true
    },
    {
      title: "Buenas Prácticas de Código",
      type: "document",
      description: "Guía de escritura de código limpio y mantenible",
      instructions: "Aplica estas buenas prácticas en tus proyectos",
      duration: 45,
      order: 5,
      isPublished: true
    }
  ],

  "Desarrollo Web": [
    {
      title: "Introducción a React.js",
      type: "document",
      description: "Conceptos fundamentales de React y componentes",
      instructions: "Comprende los conceptos básicos de React",
      duration: 65,
      order: 1,
      isPublished: true
    },
    {
      title: "Hooks en React",
      type: "video",
      description: "Uso de hooks para manejo de estado y efectos",
      instructions: "Practica con los hooks más importantes de React",
      duration: 80,
      order: 2,
      isPublished: true
    },
    {
      title: "Next.js: Renderizado Avanzado",
      type: "document",
      description: "SSR, SSG y otras características de Next.js",
      instructions: "Aprende las diferentes estrategias de renderizado",
      duration: 70,
      order: 3,
      isPublished: true
    },
    {
      title: "Ruteo y API Routes",
      type: "video",
      description: "Sistema de rutas y creación de APIs en Next.js",
      instructions: "Implementa ruteo y APIs en tu aplicación",
      duration: 85,
      order: 4,
      isPublished: true
    },
    {
      title: "Proyecto Full-Stack",
      type: "assignment",
      description: "Aplicación completa con React, Next.js y base de datos",
      instructions: "Desarrolla una aplicación full-stack completa",
      duration: 200,
      order: 5,
      isPublished: true
    }
  ],

  "Ciencia de Datos": [
    {
      title: "Python para Análisis de Datos",
      type: "document",
      description: "Fundamentos de Python aplicados a ciencia de datos",
      instructions: "Aprende Python específicamente para análisis de datos",
      duration: 80,
      order: 1,
      isPublished: true
    },
    {
      title: "Pandas: Manipulación de Datos",
      type: "video",
      description: "Uso de pandas para limpieza y transformación de datos",
      instructions: "Domina la manipulación de datos con pandas",
      duration: 90,
      order: 2,
      isPublished: true
    },
    {
      title: "Visualización con Matplotlib",
      type: "document",
      description: "Creación de gráficos y visualizaciones efectivas",
      instructions: "Aprende a crear visualizaciones impactantes",
      duration: 70,
      order: 3,
      isPublished: true
    },
    {
      title: "Introducción a Machine Learning",
      type: "video",
      description: "Conceptos básicos de machine learning con scikit-learn",
      instructions: "Implementa tus primeros modelos de ML",
      duration: 100,
      order: 4,
      isPublished: true
    },
    {
      title: "Proyecto: Análisis de Dataset",
      type: "assignment",
      description: "Análisis completo de un dataset real",
      instructions: "Aplica todo el proceso de análisis de datos",
      duration: 180,
      order: 5,
      isPublished: true
    }
  ],

  // 📊 NEGOCIOS
  "Marketing Digital": [
    {
      title: "Estrategias de SEO",
      type: "document",
      description: "Optimización para motores de búsqueda",
      instructions: "Aprende técnicas de SEO on-page y off-page",
      duration: 75,
      order: 1,
      isPublished: true
    },
    {
      title: "Publicidad en Redes Sociales",
      type: "video",
      description: "Campañas efectivas en Facebook e Instagram",
      instructions: "Crea y optimiza campañas publicitarias",
      duration: 85,
      order: 2,
      isPublished: true
    },
    {
      title: "Email Marketing Avanzado",
      type: "document",
      description: "Estrategias de email marketing para conversión",
      instructions: "Desarrolla campañas de email efectivas",
      duration: 60,
      order: 3,
      isPublished: true
    },
    {
      title: "Google Analytics",
      type: "video",
      description: "Análisis de datos y métricas digitales",
      instructions: "Interpreta datos y toma decisiones basadas en analytics",
      duration: 70,
      order: 4,
      isPublished: true
    },
    {
      title: "Plan de Marketing Digital",
      type: "assignment",
      description: "Desarrolla un plan completo de marketing digital",
      instructions: "Crea un plan estratégico para un negocio real",
      duration: 120,
      order: 5,
      isPublished: true
    }
  ],

  "Finanzas": [
    {
      title: "Presupuesto Personal",
      type: "document",
      description: "Guía para crear y mantener un presupuesto efectivo",
      instructions: "Crea tu primer presupuesto personal",
      duration: 45,
      order: 1,
      isPublished: true
    },
    {
      title: "Inversiones para Principiantes",
      type: "video",
      description: "Introducción al mundo de las inversiones",
      instructions: "Comprende los conceptos básicos de inversión",
      duration: 65,
      order: 2,
      isPublished: true
    },
    {
      title: "Mercado de Valores",
      type: "document",
      description: "Funcionamiento del mercado bursátil",
      instructions: "Aprende cómo funciona la bolsa de valores",
      duration: 55,
      order: 3,
      isPublished: true
    },
    {
      title: "Planificación de Jubilación",
      type: "video",
      description: "Estrategias para planificar tu futuro financiero",
      instructions: "Desarrolla un plan de jubilación personalizado",
      duration: 50,
      order: 4,
      isPublished: true
    },
    {
      title: "Caso Práctico: Portfolio de Inversión",
      type: "assignment",
      description: "Crea y gestiona un portfolio de inversión simulado",
      instructions: "Aplica los conocimientos en un caso práctico",
      duration: 90,
      order: 5,
      isPublished: true
    }
  ],

  "Emprendimiento": [
    {
      title: "Validación de Ideas de Negocio",
      type: "document",
      description: "Métodos para validar ideas antes de invertir",
      instructions: "Aprende a validar tus ideas de negocio",
      duration: 60,
      order: 1,
      isPublished: true
    },
    {
      title: "Modelo de Negocio Canvas",
      type: "video",
      description: "Creación de modelos de negocio con Business Model Canvas",
      instructions: "Desarrolla tu modelo de negocio",
      duration: 75,
      order: 2,
      isPublished: true
    },
    {
      title: "Pitch para Inversionistas",
      type: "document",
      description: "Guía para crear presentaciones efectivas",
      instructions: "Prepara tu pitch para inversionistas",
      duration: 55,
      order: 3,
      isPublished: true
    },
    {
      title: "Estrategias de Crecimiento",
      type: "video",
      description: "Técnicas para escalar tu negocio",
      instructions: "Planifica el crecimiento de tu startup",
      duration: 70,
      order: 4,
      isPublished: true
    },
    {
      title: "Plan de Negocio Completo",
      type: "assignment",
      description: "Desarrolla un plan de negocio ejecutable",
      instructions: "Crea un plan de negocio para tu idea",
      duration: 150,
      order: 5,
      isPublished: true
    }
  ],

  // 🎬 MULTIMEDIA
  "Producción de Video": [
    {
      title: "Interfaz de Premiere Pro",
      type: "document",
      description: "Tour completo por la interfaz de Adobe Premiere",
      instructions: "Familiarízate con la interfaz del software",
      duration: 40,
      order: 1,
      isPublished: true
    },
    {
      title: "Edición Básica",
      type: "video",
      description: "Técnicas fundamentales de edición de video",
      instructions: "Aprende las bases de la edición",
      duration: 65,
      order: 2,
      isPublished: true
    },
    {
      title: "Efectos y Transiciones",
      type: "document",
      description: "Uso de efectos visuales y transiciones",
      instructions: "Domina los efectos y transiciones profesionales",
      duration: 70,
      order: 3,
      isPublished: true
    },
    {
      title: "Corrección de Color",
      type: "video",
      description: "Técnicas profesionales de colorización",
      instructions: "Aprende corrección y gradación de color",
      duration: 80,
      order: 4,
      isPublished: true
    },
    {
      title: "Proyecto: Video Corto",
      type: "assignment",
      description: "Produce y edita un video corto completo",
      instructions: "Crea un video aplicando todas las técnicas",
      duration: 120,
      order: 5,
      isPublished: true
    }
  ],

  "Producción Musical": [
    {
      title: "Interfaz de Ableton Live",
      type: "document",
      description: "Navegación por la interfaz de Ableton",
      instructions: "Conoce la interfaz del DAW",
      duration: 50,
      order: 1,
      isPublished: true
    },
    {
      title: "Programación de Beats",
      type: "video",
      description: "Creación de ritmos y patrones de batería",
      instructions: "Aprende a programar beats profesionales",
      duration: 75,
      order: 2,
      isPublished: true
    },
    {
      title: "Síntesis y Sound Design",
      type: "document",
      description: "Creación de sonidos desde cero",
      instructions: "Domina la síntesis de sonidos",
      duration: 85,
      order: 3,
      isPublished: true
    },
    {
      title: "Mezcla y Masterización",
      type: "video",
      description: "Proceso completo de mezcla y master",
      instructions: "Aprende a mezclar y masterizar tus tracks",
      duration: 90,
      order: 4,
      isPublished: true
    },
    {
      title: "Proyecto: Track Completo",
      type: "assignment",
      description: "Produce un track musical completo",
      instructions: "Crea un track desde cero hasta la masterización",
      duration: 180,
      order: 5,
      isPublished: true
    }
  ],

  // 🌐 IDIOMAS
  "Idiomas": [
    {
      title: "Gramática Básica del Inglés",
      type: "document",
      description: "Estructuras gramaticales fundamentales",
      instructions: "Domina la gramática básica del inglés",
      duration: 60,
      order: 1,
      isPublished: true
    },
    {
      title: "Vocabulario de Negocios",
      type: "video",
      description: "Términos y expresiones para el ámbito profesional",
      instructions: "Amplía tu vocabulario profesional",
      duration: 55,
      order: 2,
      isPublished: true
    },
    {
      title: "Conversación y Fluidez",
      type: "document",
      description: "Técnicas para mejorar la fluidez al hablar",
      instructions: "Practica tu fluidez en conversaciones",
      duration: 70,
      order: 3,
      isPublished: true
    },
    {
      title: "Presentaciones en Inglés",
      type: "video",
      description: "Preparación y entrega de presentaciones profesionales",
      instructions: "Aprende a hacer presentaciones efectivas",
      duration: 65,
      order: 4,
      isPublished: true
    },
    {
      title: "Negociación Internacional",
      type: "assignment",
      description: "Simulación de negociación en inglés",
      instructions: "Practica habilidades de negociación",
      duration: 90,
      order: 5,
      isPublished: true
    }
  ],

  "Desarrollo Personal": [
    {
      title: "Estilos de Liderazgo",
      type: "document",
      description: "Diferentes enfoques y estilos de liderazgo",
      instructions: "Identifica y desarrolla tu estilo de liderazgo",
      duration: 50,
      order: 1,
      isPublished: true
    },
    {
      title: "Comunicación Efectiva",
      type: "video",
      description: "Técnicas para comunicación clara y efectiva",
      instructions: "Mejora tus habilidades de comunicación",
      duration: 60,
      order: 2,
      isPublished: true
    },
    {
      title: "Gestión de Equipos Remotos",
      type: "document",
      description: "Estrategias para liderar equipos distribuidos",
      instructions: "Aprende a gestionar equipos remotos efectivamente",
      duration: 55,
      order: 3,
      isPublished: true
    },
    {
      title: "Resolución de Conflictos",
      type: "video",
      description: "Técnicas para manejar y resolver conflictos",
      instructions: "Desarrolla habilidades de resolución de conflictos",
      duration: 65,
      order: 4,
      isPublished: true
    },
    {
      title: "Plan de Desarrollo Personal",
      type: "assignment",
      description: "Crea tu plan de desarrollo profesional",
      instructions: "Desarrolla un plan para tu crecimiento profesional",
      duration: 80,
      order: 5,
      isPublished: true
    }
  ]
};

async function addContentToCourses() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Obtener todos los cursos
    const courses = await Course.find({});
    console.log(`📚 Encontrados ${courses.length} cursos`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const course of courses) {
      try {
        // Verificar si el curso ya tiene contenido
        if (course.contents && course.contents.length > 0) {
          console.log(`⏭️  "${course.title}" ya tiene ${course.contents.length} contenidos - Saltando`);
          skippedCount++;
          continue;
        }

        // Obtener contenido específico para la categoría del curso
        const categoryContent = courseContentTemplates[course.category];
        
        if (!categoryContent) {
          console.log(`❌ No hay plantilla para categoría: "${course.category}"`);
          continue;
        }

        // Agregar IDs únicos y timestamps al contenido
        const contentWithIds = categoryContent.map((content, index) => ({
          ...content,
          _id: new mongoose.Types.ObjectId(),
          createdAt: new Date(),
          updatedAt: new Date()
        }));

        // Actualizar el curso con el nuevo contenido
        course.contents = contentWithIds;
        course.updatedAt = new Date();
        
        await course.save();
        updatedCount++;
        
        console.log(`✅ "${course.title}" - Agregados ${contentWithIds.length} contenidos`);
        
      } catch (error) {
        console.error(`❌ Error actualizando "${course.title}":`, error.message);
      }
    }

    // Estadísticas finales
    console.log('\n📊 RESUMEN DE ACTUALIZACIÓN:');
    console.log(`   Total de cursos procesados: ${courses.length}`);
    console.log(`   ✅ Cursos actualizados: ${updatedCount}`);
    console.log(`   ⏭️  Cursos que ya tenían contenido: ${skippedCount}`);
    console.log(`   ❌ Cursos con error: ${courses.length - updatedCount - skippedCount}`);

    // Resumen por categoría
    console.log('\n📂 CONTENIDO AGREGADO POR CATEGORÍA:');
    const categories = [...new Set(courses.map(course => course.category))];
    categories.forEach(category => {
      const count = courses.filter(course => course.category === category).length;
      const contentCount = courseContentTemplates[category]?.length || 0;
      console.log(`   ${category}: ${count} cursos × ${contentCount} contenidos cada uno`);
    });

  } catch (error) {
    console.error('❌ ERROR GENERAL:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Conexión a MongoDB cerrada');
    console.log('🎉 Proceso completado! Los cursos ahora tienen contenido real.');
  }
}

// Ejecutar el script
addContentToCourses().catch(console.error);