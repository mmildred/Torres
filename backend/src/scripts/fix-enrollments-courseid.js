// backend/src/scripts/fix-enrollments-courseid.js
import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGODB_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/classroom';

async function fixEnrollmentsCourseId() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('🔧 CORRIGIENDO INSCRIPCIONES...');

    // 1. Verificar todas las inscripciones
    const allEnrollments = await mongoose.connection.collection('enrollments').find({}).toArray();
    console.log(`📋 Total inscripciones en la BD: ${allEnrollments.length}`);

    // 2. Verificar inscripciones del curso de liderazgo
    const leadershipEnrollments = await mongoose.connection.collection('enrollments').find({
      $or: [
        { courseId: '69282449084a101795f3e0b7' },
        { courseId: new mongoose.Types.ObjectId('69282449084a101795f3e0b7') }
      ]
    }).toArray();

    console.log(`🎯 Inscripciones encontradas para liderazgo: ${leadershipEnrollments.length}`);

    // 3. Mostrar detalles de las inscripciones encontradas
    leadershipEnrollments.forEach((enrollment, index) => {
      console.log(`   ${index + 1}. Enrollment ID: ${enrollment._id}`);
      console.log(`      courseId: ${enrollment.courseId} (tipo: ${typeof enrollment.courseId})`);
      console.log(`      userId: ${enrollment.userId}`);
      console.log(`      studentId: ${enrollment.studentId}`);
      console.log(`      progress: ${enrollment.progress}%`);
    });

    // 4. Buscar por diferentes campos
    console.log('\n🔍 BUSCANDO POR DIFERENTES CAMPOS:');
    
    // Buscar por string
    const byString = await mongoose.connection.collection('enrollments').find({
      courseId: '69282449084a101795f3e0b7'
    }).toArray();
    console.log(`   Por string: ${byString.length}`);

    // Buscar por ObjectId
    const byObjectId = await mongoose.connection.collection('enrollments').find({
      courseId: new mongoose.Types.ObjectId('69282449084a101795f3e0b7')
    }).toArray();
    console.log(`   Por ObjectId: ${byObjectId.length}`);

    // Buscar por campo "course" (posible nombre alternativo)
    const byCourseField = await mongoose.connection.collection('enrollments').find({
      course: new mongoose.Types.ObjectId('69282449084a101795f3e0b7')
    }).toArray();
    console.log(`   Por campo "course": ${byCourseField.length}`);

    // 5. Si no encuentra las 10, mostrar todas las inscripciones para debug
    if (leadershipEnrollments.length < 10) {
      console.log('\n⚠️  NO SE ENCONTRARON LAS 10 INSCRIPCIONES');
      console.log('📋 Mostrando todas las inscripciones disponibles:');
      
      const all = await mongoose.connection.collection('enrollments').find({}).toArray();
      all.forEach((enrollment, index) => {
        console.log(`   ${index + 1}. ID: ${enrollment._id}`);
        console.log(`      courseId: ${enrollment.courseId}`);
        console.log(`      userId: ${enrollment.userId}`);
        console.log(`      progress: ${enrollment.progress}%`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔒 Conexión cerrada');
  }
}

fixEnrollmentsCourseId();