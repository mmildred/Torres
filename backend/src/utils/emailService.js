import nodemailer from 'nodemailer';

const createTransporter = () => {
  // Verificar que tenemos las variables de entorno
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new Error('❌ Faltan configuraciones de email en .env');
  }

  console.log('📧 Configurando Gmail transporter...');
  console.log('   Usuario:', process.env.EMAIL_USER);
  
  return nodemailer.createTransport({
    service: 'gmail',
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, 
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

export const sendPasswordResetEmail = async (email, resetToken) => {
  const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
  
  const mailOptions = {
    from: {
      name: 'Campus Digital',
      address: process.env.EMAIL_USER
    },
    to: email,
    subject: 'Recuperación de Contraseña - Campus Digital',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Recuperación de Contraseña</h2>
        <p>Hola,</p>
        <p>Hemos recibido una solicitud para restablecer tu contraseña.</p>
        
        <div style="background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #007bff;">
          <h3 style="margin: 0; color: #333;">Tu código de recuperación:</h3>
          <p style="font-size: 20px; font-weight: bold; letter-spacing: 2px; margin: 10px 0; color: #d63384;">
            ${resetToken}
          </p>
        </div>

        <p>También puedes hacer clic en el siguiente enlace:</p>
        <a href="${resetLink}" 
           style="background: #007bff; color: white; padding: 12px 24px; 
                  text-decoration: none; border-radius: 5px; display: inline-block; margin: 10px 0;">
          Restablecer Contraseña
        </a>

        <p style="margin-top: 20px; color: #666; font-size: 12px;">
          Si no solicitaste este cambio, ignora este mensaje. Este enlace expirará en 15 minutos.
        </p>
        
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
        <p style="color: #999; font-size: 11px;">
          Equipo de Classroom Platform
        </p>
      </div>
    `
  };

  try {
    const transporter = createTransporter();
   
    await transporter.verify();
    console.log('✅ Conexión con Gmail establecida');
    
    const info = await transporter.sendMail(mailOptions);
    
    console.log('✅ Email de recuperación ENVIADO a:', email);
    console.log('📧 Message ID:', info.messageId);
    console.log('🔐 Token:', resetToken);
    
    return true;
  } catch (error) {
    console.error('❌ Error con Gmail:', error.message);
    
    if (error.code === 'EAUTH') {
      console.log('🔐 Problema de autenticación. Verifica:');
      console.log('   - Verificación en 2 pasos ACTIVADA');
      console.log('   - Contraseña de aplicación correcta');
      console.log('   - Sin espacios en la contraseña');
    }
    
    console.log('📋 Token para desarrollo:', resetToken);
    console.log('🔗 Enlace:', resetLink);
    
    return true;
  }
};