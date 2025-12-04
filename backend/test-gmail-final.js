import dotenv from 'dotenv';
import { resolve } from 'path';

const envPath = resolve(process.cwd(), '.env');

dotenv.config({ path: envPath });

import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  }
});

// Verificar conexión
transporter.verify(function(error, success) {
  if (error) {
    console.error(" Error de conexión:", error.message);
    
    if (error.code === 'EAUTH') {
    }
  } else {
    console.log(" ¡Conexión exitosa con Gmail!");
    
    // Enviar email de prueba
    const mailOptions = {
      from: `"Campus Digital" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: ' Test de Email - Campus Digital',
      text: '¡Hola! Este es un test del sistema de email de Campus Digital.',
      html: '<h1> Test Exitoso</h1><p>El sistema de email está funcionando correctamente.</p>'
    };
  }
});
