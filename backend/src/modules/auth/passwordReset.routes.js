import express from 'express';
import crypto from 'crypto';
import User from './user.model.js';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../../utils/emailService.js'; 
import bcrypt from 'bcrypt';

const router = express.Router();

router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'El email es requerido' });
    }

    
    const user = await User.findOne({ email });
    if (!user) {
      return res.json({ 
        message: 'Si el email existe, recibirás un código de recuperación' 
      });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = Date.now() + 15 * 60 * 1000; // 15 minutos

    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = resetTokenExpiry;
    await user.save();

    // 🔥 USAR EL NUEVO SERVICIO
    await sendPasswordResetEmail(user.email, resetToken);

    res.json({ 
      message: 'Si el email existe, recibirás un código de recuperación',
      token: resetToken 
    });

  } catch (error) {
    console.error('Error en forgot-password:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

router.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ 
        message: 'Token y nueva contraseña son requeridos' 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: 'La contraseña debe tener al menos 6 caracteres' 
      });
    }

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({ 
        message: 'Token inválido o expirado' 
      });
    }

    // Encriptar nueva contraseña
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    user.password = hashedPassword;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // 🔥 ENVIAR EMAIL DE CONFIRMACIÓN
    try {
      await sendPasswordChangedEmail(user.email);
      console.log("📧 Email de cambio de contraseña enviado a:", user.email);
    } catch (emailError) {
      console.error("⚠️ Error enviando email de confirmación:", emailError.message);
    }

    res.json({ message: 'Contraseña restablecida exitosamente' });

  } catch (error) {
    console.error('Error en reset-password:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
});

export default router;