// test-email.js
import dotenv from 'dotenv';
dotenv.config();

import { sendWelcomeEmail, sendPasswordResetEmail, sendPasswordChangedEmail } from './src/utils/emailService.js';

async function testEmails() {
  try {
    console.log(' Probando servicio de emails...');
    console.log('EMAIL_USER:', process.env.EMAIL_USER);
    console.log('FRONTEND_URL:', process.env.FRONTEND_URL);
    
    // Test 1: Email de bienvenida
    console.log('\n1.  Probando email de bienvenida...');
    await sendWelcomeEmail('gerardo8.manzano@gmail.com', 'Gerardo Manzano');
    
    // Test 2: Email de recuperación
    console.log('\n2.  Probando email de recuperación...');
    const testToken = 'test-token-12345';
    await sendPasswordResetEmail('gerardo8.manzano@gmail.com', testToken);
    
    // Test 3: Email de cambio exitoso
    console.log('\n3.  Probando email de cambio de contraseña...');
    await sendPasswordChangedEmail('gerardo8.manzano@gmail.com');
    
    console.log('\n ¡Todos los emails enviados exitosamente!');
    
  } catch (error) {
    console.error(' Error en prueba de emails:', error.message);
    console.error('Detalles:', error);
  }
}

testEmails();
