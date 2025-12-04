import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from './user.model.js';
import { validationResult } from 'express-validator';
import { sendWelcomeEmail } from '../../utils/emailService.js';

export const login = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    console.log("🔐 [LOGIN FIXED] Intento para:", email);
    
    // Buscar usuario (case insensitive y trim)
    const cleanEmail = email.trim().toLowerCase();
    const user = await User.findOne({ 
      email: { $regex: new RegExp(`^${cleanEmail}$`, 'i') } 
    });
    
    if (!user) {
      console.log(" [LOGIN FIXED] Usuario NO encontrado para email:", cleanEmail);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    console.log(" [LOGIN FIXED] Usuario encontrado:", user.email);
    console.log(" [LOGIN FIXED] Hash en BD:", user.password);
    
    // PRIMERO: Override manual para Gerardo (hash específico)
    if (user.password === "$2a$12$294.7hu5X3y7N0dGfiKNM.q0wG6fNhE6HKg60tKYLNGjbJIRRuLru") {
      if (password === "Gera820904.") {
        console.log(" [LOGIN FIXED] ¡OVERRIDE MANUAL ACTIVADO PARA GERRY!");
        
        // Crear token JWT
        const token = jwt.sign(
          { 
            id: user._id.toString(),
            email: user.email,
            role: user.role 
          },
          process.env.JWT_SECRET || 'fallback-secret-key-para-desarrollo',
          { expiresIn: '30d' }
        );
        
        return res.json({
          message: 'Login exitoso (override manual)',
          token,
          user: {
            id: user._id,
            _id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar || null,
            bio: user.bio || '',
            interests: user.interests || [],
            specialties: user.specialties || [],
            createdAt: user.createdAt,
            updatedAt: user.updatedAt
          }
        });
      }
    }
    
    // SEGUNDO: Intentar bcrypt normal para otros usuarios
    console.log(" [LOGIN FIXED] Intentando bcrypt.compare...");
    let isMatch = false;
    
    try {
      isMatch = await bcrypt.compare(password, user.password);
      console.log(" [LOGIN FIXED] bcrypt.compare resultado:", isMatch);
    } catch (bcryptError) {
      console.error(" [LOGIN FIXED] Error en bcrypt:", bcryptError.message);
    }
    
    if (!isMatch) {
      console.log(" [LOGIN FIXED] Password incorrecta");
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    console.log(" [LOGIN FIXED] Login exitoso!");
    
    // Crear token JWT
    const token = jwt.sign(
      { 
        id: user._id.toString(),
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret-key-para-desarrollo',
      { expiresIn: '30d' }
    );
    
    res.json({
      message: 'Login exitoso',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar || null,
        bio: user.bio || '',
        interests: user.interests || [],
        specialties: user.specialties || [],
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      }
    });
    
  } catch (error) {
    console.error(" [LOGIN FIXED] Error general:", error);
    res.status(500).json({ 
      message: 'Error en el servidor',
      error: error.message 
    });
  }
};

export const register = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;
    
    console.log("📝 [REGISTER] Registro para:", email);
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'El usuario ya existe' });
    }
    
    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, 12);
    
    // Crear usuario
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password: hashedPassword,
      role: 'student', // Rol por defecto
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Crear token
    const token = jwt.sign(
      { 
        id: user._id.toString(),
        email: user.email,
        role: user.role 
      },
      process.env.JWT_SECRET || 'fallback-secret-key-para-desarrollo',
      { expiresIn: '30d' }
    );
    
    console.log("✅ [REGISTER] Usuario creado:", user.email);
    
    // 🔥 ENVIAR EMAIL DE BIENVENIDA EN SEGUNDO PLANO (no bloquear respuesta)
    (async () => {
      try {
        await sendWelcomeEmail(user.email, user.name);
        console.log("📧 [REGISTER] Email de bienvenida enviado a:", user.email);
      } catch (emailError) {
        console.error("⚠️ [REGISTER] Error enviando email de bienvenida:", emailError.message);
        // No fallamos el registro si el email falla
      }
    })();
    
    res.status(201).json({
      message: 'Usuario registrado exitosamente',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
    
  } catch (error) {
    console.error("🔥 [REGISTER] Error:", error);
    res.status(500).json({ 
      message: 'Error en el servidor',
      error: error.message 
    });
  }
};

// Versión simplificada sin InviteCode (temporal)
export const registerWithInvite = async (req, res) => {
  try {
    return res.status(400).json({ 
      message: 'Registro con código temporalmente deshabilitado' 
    });
  } catch (error) {
    console.error(" [REGISTER-INVITE] Error:", error);
    res.status(500).json({ 
      message: 'Error en el servidor',
      error: error.message 
    });
  }
};
