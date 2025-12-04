// modules/auth/routes.js
export default function authRoutes(router) {
  router.post('/register', async (req, res) => {
    try {
      const { sendWelcomeEmail } = await import('../../utils/emailService.js');
      const { email, name, password } = req.body;
      
      // Aquí iría la lógica de registro en la base de datos
      console.log(`📝 Registrando usuario: ${name} (${email})`);
      
      // Enviar email de bienvenida
      await sendWelcomeEmail(email, name);
      
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        user: { email, name }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  });
  
  return router;
}
