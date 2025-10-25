import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import User from './user.model.js';
import InviteCode from './InviteCode.model.js'; 

// FUNCIÓN REGISTER ORIGINAL (para estudiantes)
export async function register(req, res) {
  try {
    const { name, email, password, role } = req.body;
    
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
      role: role || 'student' // Siempre student por defecto
    });
    
    const token = jwt.sign({ 
      id: user.id, 
      role: user.role 
    }, process.env.JWT_SECRET, { 
      expiresIn: '1d' 
    });
    
    res.json({ 
      token, 
      user: user.toJSON() 
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(500).json({ message: 'Error en el registro' });
  }
}

// FUNCIÓN LOGIN ORIGINAL
export async function login(req, res) {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    
    if (!user) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ message: 'Credenciales inválidas' });
    }
    
    const token = jwt.sign({ 
      id: user.id, 
      role: user.role 
    }, process.env.JWT_SECRET, { 
      expiresIn: '1d' 
    });
    
    res.json({ 
      token, 
      user: user.toJSON() 
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ message: 'Error en el login' });
  }
}

// FUNCIÓN NUEVA: Registro con código de invitación (para maestros)
export async function registerWithInvite(req, res) {
  try {
    const { name, email, password, inviteCode } = req.body;

    if (!name || !email || !password || !inviteCode) {
      return res.status(400).json({ message: 'Todos los campos son requeridos' });
    }

    // Verificar código de invitación
    const codeDoc = await InviteCode.findOne({ 
      code: inviteCode.toUpperCase() 
    });
    
    if (!codeDoc) return res.status(400).json({ message: 'Código inválido' });
    if (codeDoc.used) return res.status(400).json({ message: 'Código ya utilizado' });
    if (new Date() > codeDoc.expiresAt) return res.status(400).json({ message: 'Código expirado' });

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ message: 'El usuario ya existe' });

    // Crear usuario como teacher
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({
      name,
      email,
      password: hash,
      role: codeDoc.role // 'teacher'
    });

    // Marcar código como usado
    codeDoc.used = true;
    codeDoc.usedBy = user.id;
    codeDoc.usedAt = new Date();
    await codeDoc.save();

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '1d' });
    
    res.json({
      message: 'Registro exitoso',
      token,
      user: user.toJSON()
    });
  } catch (error) {
    console.error('Error en registro con invitación:', error);
    res.status(500).json({ message: 'Error en el registro' });
  }
}