import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/classroom';

// Schemas
const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
const courseSchema = new mongoose.Schema({}, { collection: 'courses', strict: false });
const enrollmentSchema = new mongoose.Schema({}, { collection: 'enrollments', strict: false });

const User = mongoose.models.User || mongoose.model('User', userSchema);
const Course = mongoose.models.Course || mongoose.model('Course', courseSchema);
const Enrollment = mongoose.models.Enrollment || mongoose.model('Enrollment', enrollmentSchema);

// Datos de usuarios de prueba
const TEST_USERS = [
  {
    name: 'Ana García',
    email: 'ana.garcia@test.com',
    password: 'password123',
    role: 'student',
    interests: ['liderazgo', 'management'],
    avatar: '/uploads/avatars/student1.png'
  },
  {
    name: 'Carlos López',
    email: 'carlos.lopez@test.com', 
    password: 'password123',
    role: 'student',
    interests: ['liderazgo', 'team-building'],
    avatar: '/uploads/avatars/student2.png'
  },
  {
    name: 'María Rodríguez',
    email: 'maria.rodriguez@test.com',
    password: 'password123', 
    role: 'student',
    interests: ['gestión', 'comunicación'],
    avatar: '/uploads/avatars/student3.png'
  },
  {
    name: 'Juan Martínez',
    email: 'juan.martinez@test.com',
    password: 'password123',
    role: 'student', 
    interests: ['liderazgo', 'desarrollo-personal'],
    avatar: '/uploads/avatars/student4.png'
  },
  {
    name: 'Laura Hernández',
    email: 'laura.hernandez@test.com',
    password: 'password123',
    role: 'student',
    interests: ['gestión-equipos', 'motivación'],
    avatar: '/uploads/avatars/student5.png'
  },
  {
    name: 'Diego Silva',
    email: 'diego.silva@test.com',
    password: 'password123',
    role: 'student',
    interests: ['liderazgo', 'toma-decisiones'], 
    avatar: '/uploads/avatars/student6.png'
  },
  {
    name: 'Sofía Castro',
    email: 'sofia.castro@test.com',
    password: 'password123',
    role: 'student',
    interests: ['comunicación-efectiva', 'gestión'],
    avatar: '/uploads/avatars/student7.png'
  },
  {
    name: 'Roberto Morales',
    email: 'roberto.morales@test.com', 
    password: 'password123',
    role: 'student',
    interests: ['liderazgo', 'resolución-conflictos'],
    avatar: '/uploads/avatars/student8.png'
  },
  {
    name: 'Elena Vargas',
    email: 'elena.vargas@test.com',
    password: 'password123',
    role: 'student',
    interests: ['gestión-proyectos', 'liderazgo'],
    avatar: '/uploads/avatars/student9.png'
  },
  {
    name: 'Miguel Torres',
    email: 'miguel.torres@test.com',
    password: 'password123',
    role: 'student',
    interests: ['liderazgo-equipos', 'coaching'],
    avatar: '/uploads/avatars/student10.png'
  }
];

// Simular diferentes estados de progreso para el curso de liderazgo
const LEADERSHIP_PROGRESS_STATES = [
  // Estudiantes muy avanzados (ejecutivos)
  { progress: 85, lastActivity: 1, status: 'advanced', role: 'Gerente Senior' },
  { progress: 92, lastActivity: 2, status: 'advanced', role: 'Director' },
  
  // Estudiantes consistentes (mandos medios)
  { progress: 65, lastActivity: 3, status: 'consistent', role: 'Team Lead' },
  { progress: 58, lastActivity: 5, status: 'consistent', role: 'Supervisor' },
  { progress: 72, lastActivity: 2, status: 'consistent', role: 'Coordinador' },
  
  // Estudiantes con progreso lento (nuevos managers)
  { progress: 35, lastActivity: 7, status: 'beginner', role: 'Nuevo Manager' },
  { progress: 28, lastActivity: 10, status: 'beginner', role: 'Líder Junior' },
  
  // Estudiantes en riesgo (poco comprometidos)
  { progress: 45, lastActivity: 15, status: 'at-risk', role: 'Especialista' },
  { progress: 22, lastActivity: 20, status: 'at-risk', role: 'Analista' },
  
  // Estudiante que ya completó
  { progress: 100, lastActivity: 1, status: 'completed', role: 'Consultor' }
];

async function seedUsersLeadershipCourse() {
  try {
    console.log('🔗 Conectando a MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Conectado a MongoDB');

    // 1. BUSCAR ESPECÍFICAMENTE EL CURSO DE LIDERAZGO
    const leadershipCourse = await Course.findOne({
      $or: [
        { title: /liderazgo/i },
        { title: /liderazgo y gestión de equipo/i },
        { title: /gestión de equipo/i },
        { category: /liderazgo/i },
        { category: /desarrollo personal/i }
      ]
    });

    if (!leadershipCourse) {
      console.log('❌ No se encontró el curso de Liderazgo y Gestión de Equipo');
      console.log('📋 Cursos disponibles:');
      const allCourses = await Course.find({}, { title: 1, category: 1 });
      allCourses.forEach(course => {
        console.log(`   - "${course.title}" (${course.category})`);
      });
      return;
    }

    console.log(`✅ Curso encontrado: "${leadershipCourse.title}"`);

    // 2. CREAR USUARIOS DE PRUEBA
    console.log('\n👥 Creando usuarios de prueba...');
    const createdUsers = [];

    for (const userData of TEST_USERS) {
      try {
        // Verificar si el usuario ya existe
        const existingUser = await User.findOne({ email: userData.email });
        
        if (existingUser) {
          console.log(`⏭️  Usuario ${userData.email} ya existe`);
          createdUsers.push(existingUser);
          continue;
        }

        // Crear nuevo usuario
        const hashedPassword = await bcrypt.hash(userData.password, 10);
        
        const newUser = new User({
          ...userData,
          password: hashedPassword,
          createdAt: new Date(),
          updatedAt: new Date()
        });

        await newUser.save();
        createdUsers.push(newUser);
        console.log(`✅ Creado usuario: ${userData.name}`);

      } catch (error) {
        console.error(`❌ Error creando usuario ${userData.email}:`, error.message);
      }
    }

    console.log(`\n✅ ${createdUsers.length} usuarios creados para el curso de liderazgo`);

    // 3. INSCRIBIR TODOS LOS USUARIOS AL CURSO DE LIDERAZGO
    console.log('\n🎯 Inscribiendo usuarios al curso de Liderazgo...');
    let enrollmentsCreated = 0;

    for (let i = 0; i < createdUsers.length; i++) {
      const user = createdUsers[i];
      const progressState = LEADERSHIP_PROGRESS_STATES[i];
      
      try {
        // Verificar si ya está inscrito
        const existingEnrollment = await Enrollment.findOne({
          user: user._id,
          course: leadershipCourse._id
        });

        if (existingEnrollment) {
          console.log(`⏭️  ${user.name} ya inscrito en el curso`);
          continue;
        }

        // Calcular fecha de última actividad
        const lastActivity = progressState.lastActivity 
          ? new Date(Date.now() - progressState.lastActivity * 24 * 60 * 60 * 1000)
          : null;

        // Calcular contenidos completados (asumiendo 10 contenidos en el curso)
        const totalContents = leadershipCourse.contents?.length || 10;
        const completedContents = Math.floor((progressState.progress / 100) * totalContents);

        // Crear inscripción
        const enrollment = new Enrollment({
          user: user._id,
          course: leadershipCourse._id,
          progress: progressState.progress,
          completedContents: completedContents,
          totalContents: totalContents,
          lastActivity: lastActivity,
          enrolledAt: new Date(Date.now() - Math.floor(Math.random() * 60) * 24 * 60 * 60 * 1000), // Inscrito hace 1-60 días
          status: 'active',
          metadata: {
            progressState: progressState.status,
            role: progressState.role,
            simulated: true,
            lastUpdated: new Date(),
            courseCategory: leadershipCourse.category,
            interests: user.interests
          }
        });

        await enrollment.save();
        enrollmentsCreated++;
        
        console.log(`✅ ${user.name} (${progressState.role}) - Progreso: ${progressState.progress}% - Actividad: hace ${progressState.lastActivity} días`);

      } catch (error) {
        console.error(`❌ Error inscripción ${user.name}:`, error.message);
      }
    }

    // 4. ESTADÍSTICAS FINALES
    console.log('\n📊 RESUMEN DE INSCRIPCIONES AL CURSO DE LIDERAZGO:');
    console.log(`   👥 Usuarios creados: ${createdUsers.length}`);
    console.log(`   🎯 Inscripciones creadas: ${enrollmentsCreated}`);
    console.log(`   📚 Curso: "${leadershipCourse.title}"`);
    
    // Mostrar distribución detallada de progresos
    const enrollments = await Enrollment.find({ 
      course: leadershipCourse._id,
      'metadata.simulated': true 
    });
    
    const progressStats = {
      '0-25% (Principiantes)': enrollments.filter(e => e.progress <= 25).length,
      '26-50% (Intermedios)': enrollments.filter(e => e.progress > 25 && e.progress <= 50).length,
      '51-75% (Avanzados)': enrollments.filter(e => e.progress > 50 && e.progress <= 75).length,
      '76-99% (Expertos)': enrollments.filter(e => e.progress > 75 && e.progress < 100).length,
      '100% (Completados)': enrollments.filter(e => e.progress === 100).length
    };

    console.log('\n📈 Distribución de progresos en liderazgo:');
    Object.entries(progressStats).forEach(([range, count]) => {
      console.log(`   ${range}: ${count} estudiantes`);
    });

    // Calcular métricas para los decorators
    const totalProgress = enrollments.reduce((sum, e) => sum + e.progress, 0);
    const averageProgress = enrollments.length > 0 ? totalProgress / enrollments.length : 0;
    const completionRate = (enrollments.filter(e => e.progress === 100).length / enrollments.length) * 100;
    
    console.log('\n🎯 Métricas clave para analytics:');
    console.log(`   📊 Progreso promedio: ${averageProgress.toFixed(1)}%`);
    console.log(`   🏆 Tasa de finalización: ${completionRate.toFixed(1)}%`);
    console.log(`   👥 Total de estudiantes: ${enrollments.length}`);

    console.log('\n🎉 ¡Simulación completada! El curso de Liderazgo ahora tiene datos reales.');
    console.log('\n🔐 Credenciales para probar:');
    console.log('   Email: ana.garcia@test.com');
    console.log('   Password: password123');
    console.log('   (Usa cualquier email de la lista con "password123")');
    
    console.log('\n📋 Perfiles creados:');
    createdUsers.forEach((user, index) => {
      const progress = LEADERSHIP_PROGRESS_STATES[index];
      console.log(`   👤 ${user.name} - ${progress.role} - ${progress.progress}% progreso`);
    });

  } catch (error) {
    console.error('❌ ERROR GENERAL:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔒 Conexión a MongoDB cerrada');
  }
}

seedUsersLeadershipCourse().catch(console.error);