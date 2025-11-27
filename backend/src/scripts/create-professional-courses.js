// backend/src/scripts/create-professional-courses.js
import mongoose from 'mongoose';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

// Configurar dotenv
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../../.env') });

// Conexión directa a MongoDB
const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/classroom';

// Schema temporal para el curso (usa el mismo que tu aplicación)
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

// Cursos profesionales por categoría
const professionalCourses = [
  // 🎨 DISEÑO Y CREATIVIDAD
  {
    title: "Diseño UX/UI Profesional",
    description: "Aprende a crear interfaces de usuario increíbles y experiencias digitales memorables. Domina Figma, investigación de usuarios y diseño centrado en el humano.",
    category: "Diseño UX/UI",
    level: "intermediate",
    duration: "8 semanas",
    thumbnail: "https://images.unsplash.com/photo-1561070791-2526d30994b5?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    isPublished: true
  },
  {
    title: "Adobe Illustrator Avanzado",
    description: "Domina las herramientas profesionales de ilustración vectorial. Crea logos, ilustraciones y gráficos de calidad profesional.",
    category: "Diseño Gráfico",
    level: "advanced",
    duration: "6 semanas",
    thumbnail: "https://images.unsplash.com/photo-1634942537034-2531766767d1?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    isPublished: true
  },
  {
    title: "Fotografía Digital Profesional",
    description: "Domina tu cámara DSLR, composición, iluminación y edición en Lightroom. Conviértete en fotógrafo profesional.",
    category: "Fotografía",
    level: "intermediate",
    duration: "10 semanas",
    thumbnail: "https://images.unsplash.com/photo-1516035069371-29a1b244cc32?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    isPublished: true
  },

  // 💻 DESARROLLO Y PROGRAMACIÓN
  {
    title: "JavaScript Moderno ES6+",
    description: "Domina JavaScript moderno con ES6+, async/await, modules y las mejores prácticas de desarrollo web profesional.",
    category: "Programación",
    level: "intermediate",
    duration: "12 semanas",
    thumbnail: "https://images.unsplash.com/photo-1627398242454-45a1465c2479?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    isPublished: true
  },
  {
    title: "React.js y Next.js Avanzado",
    description: "Construye aplicaciones web modernas con React, Next.js, hooks avanzados, estado global y mejores prácticas.",
    category: "Desarrollo Web",
    level: "advanced",
    duration: "10 semanas",
    thumbnail: "https://images.unsplash.com/photo-1633356122544-f134324a6cee?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    isPublished: true
  },
  {
    title: "Python para Ciencia de Datos",
    description: "Aprende Python, pandas, numpy, matplotlib y scikit-learn para análisis de datos y machine learning.",
    category: "Ciencia de Datos",
    level: "intermediate",
    duration: "14 semanas",
    thumbnail: "https://images.unsplash.com/photo-1526379879527-8559ecfcaec0?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    isPublished: true
  },

  // 📊 NEGOCIOS Y MARKETING
  {
    title: "Marketing Digital Completo",
    description: "Estrategias de SEO, SEM, redes sociales, email marketing y analytics para hacer crecer cualquier negocio.",
    category: "Marketing Digital",
    level: "intermediate",
    duration: "8 semanas",
    thumbnail: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    isPublished: true
  },
  {
    title: "Finanzas Personales y Inversiones",
    description: "Aprende a gestionar tu dinero, crear presupuestos, invertir en bolsa y planificar tu libertad financiera.",
    category: "Finanzas",
    level: "beginner",
    duration: "6 semanas",
    thumbnail: "https://images.unsplash.com/photo-1554224155-6726b3ff858f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    isPublished: true
  },
  {
    title: "Emprendimiento Digital",
    description: "De la idea al negocio exitoso. Validación, MVP, crecimiento y escalamiento de startups digitales.",
    category: "Emprendimiento",
    level: "intermediate",
    duration: "10 semanas",
    thumbnail: "https://images.unsplash.com/photo-1556761175-b413da4baf72?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    isPublished: true
  },

  // 🎬 MULTIMEDIA Y PRODUCCIÓN
  {
    title: "Edición de Video con Adobe Premiere",
    description: "Domina Premiere Pro para crear videos profesionales. Edición, efectos, colorización y exportación.",
    category: "Producción de Video",
    level: "intermediate",
    duration: "8 semanas",
    thumbnail: "https://images.unsplash.com/photo-1611224923853-80b023f02d71?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    isPublished: true
  },
  {
    title: "Producción Musical con Ableton",
    description: "Aprende producción musical profesional, mezcla, masterización y sound design con Ableton Live.",
    category: "Producción Musical",
    level: "advanced",
    duration: "12 semanas",
    thumbnail: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    isPublished: true
  },

  // 🌐 IDIOMAS Y HABILIDADES BLANDAS
  {
    title: "Inglés Profesional para Negocios",
    description: "Desarrolla fluidez en inglés para reuniones, presentaciones, negociaciones y comunicación corporativa.",
    category: "Idiomas",
    level: "intermediate",
    duration: "16 semanas",
    thumbnail: "https://images.unsplash.com/photo-1523580494863-6f3031224c94?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    isPublished: true
  },
  {
    title: "Liderazgo y Gestión de Equipos",
    description: "Desarrolla habilidades de liderazgo, gestión de equipos remotos, comunicación efectiva y resolución de conflictos.",
    category: "Desarrollo Personal",
    level: "intermediate",
    duration: "6 semanas",
    thumbnail: "https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80",
    isPublished: true
  }
];

async function createProfessionalCourses() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    console.log('URI:', MONGODB_URI);
    
    // Conectar directamente
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // Datos del instructor/admin por defecto (usa tu ID real)
    const defaultInstructor = {
      _id: new mongoose.Types.ObjectId('69014ba5403a4daab5f93468'), // Tu ID de admin
      name: "Gerardo Manzano",
      role: "admin"
    };

    console.log('\n🎓 CREANDO CURSOS PROFESIONALES...');
    let createdCount = 0;
    let skippedCount = 0;

    for (const courseData of professionalCourses) {
      try {
        // Verificar si el curso ya existe
        const existingCourse = await Course.findOne({ 
          title: courseData.title 
        });

        if (existingCourse) {
          console.log(`⏭️  Ya existe: "${courseData.title}"`);
          skippedCount++;
          continue;
        }

        // Crear curso completo
        const fullCourseData = {
          ...courseData,
          owner: defaultInstructor,
          instructors: [defaultInstructor],
          contents: [],
          createdAt: new Date(),
          updatedAt: new Date()
        };

        const course = new Course(fullCourseData);
        await course.save();
        
        createdCount++;
        console.log(`✅ Creado: "${courseData.title}" - ${courseData.category}`);
        
      } catch (error) {
        console.error(`❌ Error creando "${courseData.title}":`, error.message);
      }
    }

    // Estadísticas finales
    console.log('\n📊 RESUMEN DE CREACIÓN:');
    console.log(`   Total de cursos en el script: ${professionalCourses.length}`);
    console.log(`   ✅ Cursos creados exitosamente: ${createdCount}`);
    console.log(`   ⏭️  Cursos que ya existían: ${skippedCount}`);
    console.log(`   ❌ Cursos con error: ${professionalCourses.length - createdCount - skippedCount}`);

    // Mostrar cursos por categoría
    const categories = [...new Set(professionalCourses.map(course => course.category))];
    console.log('\n📂 CURSOS POR CATEGORÍA:');
    categories.forEach(category => {
      const count = professionalCourses.filter(course => course.category === category).length;
      console.log(`   ${category}: ${count} cursos`);
    });

  } catch (error) {
    console.error('❌ ERROR GENERAL:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Conexión a MongoDB cerrada');
    console.log('🎉 Proceso completado! Visita http://localhost:5173 para ver los nuevos cursos.');
  }
}

// Ejecutar el script
createProfessionalCourses().catch(console.error);