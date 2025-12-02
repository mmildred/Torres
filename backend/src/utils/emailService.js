import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'gerardo8.manzano@gmail.com',
    pass: process.env.EMAIL_PASSWORD || 'jbjurboustnegwux'
  }
});

// Verificar conexión
export const verifyEmailConnection = async () => {
  try {
    await transporter.verify();
    return true;
  } catch (error) {
    return false;
  }
};

// Enviar email de bienvenida
export const sendWelcomeEmail = async (userEmail, userName) => {
  try {
    console.log(`📤 Enviando email de bienvenida a: ${userEmail}`);
    
    const currentYear = new Date().getFullYear();
    const loginLink = process.env.FRONTEND_URL || 'http://localhost:5173';
    
    const mailOptions = {
      from: `"Campus Digital" <${process.env.EMAIL_USER || 'gerardo8.manzano@gmail.com'}>`,
      to: userEmail,
      subject: ` ¡Bienvenido/a ${userName}! Tu registro en Campus Digital fue exitoso`,
      html: `
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a Campus Digital</title>
    <style>
        /* Estilos principales */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        
        body {
            background-color: #f5f7fa;
            margin: 0;
            padding: 20px;
        }
        
        .email-container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            border-radius: 16px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.08);
        }
        
        /* Header con gradiente */
        .email-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            padding: 40px 30px;
            text-align: center;
            color: white;
        }
        
        .logo {
            font-size: 28px;
            font-weight: 700;
            margin-bottom: 15px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 10px;
        }
        
        .logo-icon {
            font-size: 32px;
        }
        
        .welcome-title {
            font-size: 32px;
            font-weight: 700;
            margin: 10px 0;
            text-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        
        .user-name {
            color: #FFD700;
            font-weight: 800;
        }
        
        .subtitle {
            font-size: 18px;
            opacity: 0.9;
            margin-top: 10px;
        }
        
        /* Contenido principal */
        .email-content {
            padding: 40px 30px;
        }
        
        .greeting {
            font-size: 20px;
            color: #333;
            margin-bottom: 25px;
            line-height: 1.6;
        }
        
        .highlight {
            color: #667eea;
            font-weight: 600;
        }
        
        /* Tarjetas de características */
        .features-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .feature-card {
            background: #f8f9ff;
            border-radius: 12px;
            padding: 20px;
            border-left: 4px solid #667eea;
            transition: transform 0.3s ease;
        }
        
        .feature-card:hover {
            transform: translateY(-5px);
        }
        
        .feature-icon {
            font-size: 24px;
            margin-bottom: 15px;
            color: #667eea;
        }
        
        .feature-title {
            font-weight: 600;
            color: #333;
            margin-bottom: 10px;
            font-size: 16px;
        }
        
        .feature-desc {
            color: #666;
            font-size: 14px;
            line-height: 1.5;
        }
        
        /* Botón de acción */
        .cta-button {
            display: inline-block;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 50px;
            font-weight: 600;
            font-size: 16px;
            margin: 30px 0;
            text-align: center;
            box-shadow: 0 4px 15px rgba(102, 126, 234, 0.3);
            transition: all 0.3s ease;
        }
        
        .cta-button:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(102, 126, 234, 0.4);
        }
        
        /* Sección de seguridad */
        .security-notice {
            background: #e8f4ff;
            border-radius: 12px;
            padding: 20px;
            margin: 30px 0;
            border-left: 4px solid #4dabf7;
        }
        
        .security-title {
            color: #1864ab;
            font-weight: 600;
            margin-bottom: 10px;
            display: flex;
            align-items: center;
            gap: 10px;
        }
        
        /* Footer */
        .email-footer {
            background: #f8f9fa;
            padding: 30px;
            text-align: center;
            border-top: 1px solid #e9ecef;
        }
        
        .social-links {
            display: flex;
            justify-content: center;
            gap: 20px;
            margin: 20px 0;
        }
        
        .social-icon {
            width: 40px;
            height: 40px;
            background: #667eea;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            text-decoration: none;
            transition: all 0.3s ease;
        }
        
        .social-icon:hover {
            background: #764ba2;
            transform: scale(1.1);
        }
        
        .footer-text {
            color: #666;
            font-size: 14px;
            line-height: 1.6;
            margin-top: 20px;
        }
        
        .copyright {
            color: #999;
            font-size: 12px;
            margin-top: 20px;
        }
        
        /* Responsive */
        @media (max-width: 600px) {
            .email-container {
                border-radius: 0;
            }
            
            .email-header, .email-content {
                padding: 30px 20px;
            }
            
            .welcome-title {
                font-size: 26px;
            }
            
            .features-grid {
                grid-template-columns: 1fr;
            }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <!-- Header -->
        <div class="email-header">
            <div class="logo">
                <span class="logo-icon">🎓</span>
                CAMPUS DIGITAL
            </div>
            <h1 class="welcome-title">
                ¡Bienvenido/a <span class="user-name">${userName}</span>!
            </h1>
            <p class="subtitle">Tu registro ha sido exitoso ✅</p>
        </div>
        
        <!-- Contenido -->
        <div class="email-content">
            <p class="greeting">
                Hola <span class="highlight">${userName}</span>,<br><br>
                Estamos emocionados de darte la bienvenida a <strong>Campus Digital</strong>, 
                tu nueva plataforma educativa donde el aprendizaje nunca termina. 
                Tu cuenta ha sido creada exitosamente y ya tienes acceso a todas nuestras funciones.
            </p>
            
            <!-- Características -->
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">📚</div>
                    <h3 class="feature-title">Explora Cursos</h3>
                    <p class="feature-desc">Accede a cientos de cursos en diferentes categorías y niveles.</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">🎬</div>
                    <h3 class="feature-title">Aprendizaje Interactivo</h3>
                    <p class="feature-desc">Videos, quizzes y proyectos prácticos para un aprendizaje efectivo.</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">👥</div>
                    <h3 class="feature-title">Comunidad</h3>
                    <p class="feature-desc">Conéctate con otros estudiantes y profesores en foros especializados.</p>
                </div>
                
                <div class="feature-card">
                    <div class="feature-icon">📊</div>
                    <h3 class="feature-title">Seguimiento</h3>
                    <p class="feature-desc">Monitorea tu progreso y obtén certificados de completación.</p>
                </div>
            </div>
            
            <!-- Botón de acción -->
            <div style="text-align: center;">
                <a href="${loginLink}/login" class="cta-button">
                     Comenzar mi Aprendizaje
                </a>
            </div>
            
            <!-- Nota de seguridad -->
            <div class="security-notice">
                <h3 class="security-title"> Tu seguridad es importante</h3>
                <p>
                    • Tu cuenta está protegida con encriptación de grado bancario<br>
                    • Nunca compartiremos tu información personal<br>
                    • Puedes actualizar tus preferencias en cualquier momento
                </p>
            </div>
            
            <p style="color: #666; font-size: 15px; line-height: 1.6; margin-top: 30px;">
                <strong>¿Necesitas ayuda?</strong><br>
                Nuestro equipo de soporte está disponible 24/7 en 
                <a href="mailto:soporte@campusdigital.com" style="color: #667eea; text-decoration: none;">
                    soporte@campusdigital.com
                </a>
            </p>
        </div>
        
        <!-- Footer -->
        <div class="email-footer">
            <div class="social-links">
                <a href="#" class="social-icon">f</a>
                <a href="#" class="social-icon">in</a>
                <a href="#" class="social-icon">t</a>
                <a href="#" class="social-icon">ig</a>
                <a href="#" class="social-icon">yt</a>
            </div>
            
            <p class="footer-text">
                <strong>Campus Digital</strong><br>
                Transformando la educación a través de la tecnología<br>
                Av. Universidad 123, Ciudad Educativa
            </p>
            
            <p class="copyright">
                © ${currentYear} Campus Digital. Todos los derechos reservados.<br>
                Este es un correo automático, por favor no respondas a este mensaje.
            </p>
        </div>
    </div>
</body>
</html>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email de bienvenida enviado a: ${userEmail}`);
    console.log(`📫 Message ID: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error(`❌ Error enviando email de bienvenida:`, error.message);
    throw error;
  }
};

// Enviar email de recuperación
export const sendPasswordResetEmail = async (userEmail, resetToken) => {
  try {
    const mailOptions = {
      from: `"Campus Digital" <${process.env.EMAIL_USER}>`,
      to: userEmail,
      subject: 'Recupera tu contraseña',
      html: `<p>Usa este token: ${resetToken}</p>`
    };

    return await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error(`Error recuperación: ${error.message}`);
    throw error;
  }
};
