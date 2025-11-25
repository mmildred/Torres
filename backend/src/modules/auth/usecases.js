import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './user.model.js';
import { InviteCode } from './InviteCode.model.js';

export async function register(req, res) {
  try {
    const { name, email, password } = req.body; 
    
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Campos requeridos' });
    }
    
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Email ya registrado' });
    }
    
    const hash = await bcrypt.hash(password, 10);
    
    const user = await User.create({
      name,
      email,
      password: hash,
      role: 'student'
    });
    
    // ✅ CORRECCIÓN: Usar user._id en lugar de user.id
    const token = jwt.sign({ 
      id: user._id.toString(),  // ← CAMBIAR user.id por user._id.toString()
      role: user.role 
    }, process.env.JWT_SECRET, { 
      expiresIn: '30d'  // ← Aumentar tiempo de expiración
    });
    
    // ✅ CORRECCIÓN: No usar toJSON(), enviar objeto explícito
    res.json({ 
      token, 
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Error en registro:', error); 
    res.status(500).json({ message: 'Error en el registro' });
  }
}

export async function login(req, res) {
  try {
    const { email, password } = req.body;
    
    console.log('🔐 Login attempt for:', email);
    
    const user = await User.findOne({ email });
    
    if (!user) {
      console.log('❌ User not found:', email);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    console.log('👤 User found:', user.name);
    
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      console.log('❌ Invalid password for:', email);
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    // ✅ CORRECCIÓN: Usar user._id en lugar de user.id
    const tokenPayload = {
      id: user._id.toString(),  // ← CLAVE: usar _id.toString()
      role: user.role 
    };
    
    console.log('📝 Token payload:', tokenPayload);
    
    const token = jwt.sign(
      tokenPayload, 
      process.env.JWT_SECRET, 
      { expiresIn: '30d' }  // ← Aumentar tiempo
    );
    
    console.log('✅ Login successful for:', user.name);
    
    // ✅ CORRECCIÓN: No usar toJSON(), enviar objeto explícito
    res.json({ 
      message: 'Login exitoso',  // ← Agregar mensaje
      token, 
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('💥 Error en login:', error);
    res.status(500).json({ message: 'Error en el login' });
  }
}

export async function registerWithInvite(req, res) {
  try {
    const { name, email, password, inviteCode } = req.body;

    if (!name || !email || !password || !inviteCode) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    const codeDoc = await InviteCode.findOne({ 
      code: inviteCode.toUpperCase() 
    });
    
    if (!codeDoc) return res.status(400).json({ message: 'Código inválido' });
    if (codeDoc.used) return res.status(400).json({ message: 'Código ya utilizado' });
    if (new Date() > codeDoc.expiresAt) return res.status(400).json({ message: 'Código expirado' });

    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hash,
      role: codeDoc.role 
    });

    codeDoc.used = true;
    codeDoc.usedBy = user._id;  // ← CORREGIR: usar _id
    codeDoc.usedAt = new Date();
    await codeDoc.save();

    // ✅ CORRECCIÓN: Usar user._id
    const token = jwt.sign({ 
      id: user._id.toString(),  // ← CORREGIR
      role: user.role 
    }, process.env.JWT_SECRET, { 
      expiresIn: '30d' 
    });
    
    res.json({
      message: 'Registro exitoso',
      token,
      user: {
        id: user._id,
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatar: user.avatar,
        bio: user.bio
      }
    });
  } catch (error) {
    console.error('Error en registro con invitación:', error);
    res.status(500).json({ message: 'Error en el registro' });
  }
}