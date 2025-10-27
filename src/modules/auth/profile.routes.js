import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { auth } from '../../middleware/auth.js';
import User from '../auth/user.model.js';

const router = express.Router();

// Asegurar que la carpeta de avatars existe
const avatarsDir = 'uploads/avatars';
if (!fs.existsSync(avatarsDir)) {
  fs.mkdirSync(avatarsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, avatarsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Solo se permiten imágenes'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 500 * 1024 // 500KB
  }
});

// Middleware para manejar errores de multer
const handleUploadError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ 
        message: 'La imagen debe ser menor a 500KB' 
      });
    }
    if (error.code === 'LIMIT_UNEXPECTED_FILE') {
      return res.status(400).json({ 
        message: 'Campo de archivo incorrecto' 
      });
    }
  } else if (error) {
    return res.status(400).json({ 
      message: error.message 
    });
  }
  next(error);
};

router.get('/me', auth(), async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ message: 'Error obteniendo perfil' });
  }
});

router.put('/me', auth(), async (req, res) => {
  try {
    const { name, bio, interests, specialties} = req.body;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { 
        name: name?.trim(),
        bio: bio?.trim(),
        interests: Array.isArray(interests) ? interests : [],
        specialties: Array.isArray(specialties) ? specialties : []
      },
      { new: true, runValidators: true }
    ).select('-password');

    res.json({
      message: 'Perfil actualizado correctamente',
      user
    });
  } catch (error) {
    console.error('Error actualizando perfil:', error);
    res.status(500).json({ message: 'Error actualizando perfil' });
  }
});

router.post('/avatar', auth(), upload.single('avatar'), handleUploadError, async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No se subió ninguna imagen' });
    }

    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: avatarUrl },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Avatar actualizado correctamente',
      user,
      avatarUrl
    });
  } catch (error) {
    console.error('Error subiendo avatar:', error);
    res.status(500).json({ message: 'Error subiendo avatar' });
  }
});

router.delete('/avatar', auth(), async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { avatar: null },
      { new: true }
    ).select('-password');

    res.json({
      message: 'Avatar eliminado correctamente',
      user
    });
  } catch (error) {
    console.error('Error eliminando avatar:', error);
    res.status(500).json({ message: 'Error eliminando avatar' });
  }
});

export default router;