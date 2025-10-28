import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import User from './src/modules/auth/user.model.js';

async function createAdmin() {
  try {
    // Conectar a MongoDB
    await mongoose.connect('mongodb://localhost:27017/classroom');
    console.log('📡 Conectado a MongoDB...');

    // Verificar si ya existe un admin
    const existingAdmin = await User.findOne({ email: 'admin@classroom.com' });
    if (existingAdmin) {
      console.log('⚠️  El usuario admin ya existe');
      return;
    }

    // Crear usuario admin - el password se hashea automáticamente por el pre-save
    const adminUser = new User({
      name: 'Administrador',
      email: 'admin@classroom.com',
      password: 'admin123', // Se hashea automáticamente
      role: 'admin',
      isVerified: true
    });
    
    await adminUser.save();
    console.log('✅ Usuario admin creado exitosamente!');
    console.log('📧 Email: admin@classroom.com');
    console.log('🔐 Password: admin123');
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Desconectado de MongoDB');
    process.exit();
  }
}

createAdmin();