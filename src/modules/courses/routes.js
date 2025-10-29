import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Course from './course.model.js';
import { auth } from '../../middleware/auth.js';
import User from '../auth/user.model.js';

const r = Router();

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => cb(null, `${Date.now()}-${file.originalname}`)
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

r.get('/', async (_req, res) => {
  const list = await Course.find().sort({ createdAt: -1 });
  res.json(list.map(x => x.toJSON()));
});

// Ruta simplificada para crear curso - solo el creador como instructor
r.post('/', auth('teacher'), async (req, res) => {
  try {
    const { 
      title, 
      description, 
      category, 
      level, 
      duration, 
      thumbnail 
    } = req.body;
    
    if (!title) {
      return res.status(400).json({ message: 'Título requerido' });
    }

    // Obtener información completa del usuario creador
    const creator = await User.findById(req.user.id);
    if (!creator) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }

    const courseData = {
      title,
      description: description || "",
      category: category || "General",
      level: level || "beginner",
      duration: duration || "Auto-guiado",
      thumbnail: thumbnail || "",
      owner: {
        _id: creator._id,
        name: creator.name,
        role: creator.role
      },
      // El creador es el único instructor
      instructors: [{
        _id: creator._id,
        name: creator.name,
        role: creator.role
      }],
      contents: []
    };

    const course = await Course.create(courseData);
    res.status(201).json(course.toJSON());
    
  } catch (error) {
    console.error("Error creando curso:", error);
    res.status(500).json({ message: "Error interno del servidor" });
  }
});

// Las demás rutas se mantienen igual...
r.post('/upload/:id', auth('teacher'), upload.single('file'), async (req, res) => {
  const course = await Course.findById(req.params.id);
  if (!course) return res.status(404).json({ message: 'Curso no encontrado' });
  const f = req.file;
  course.contents.push({ name: f.originalname, path: f.filename, size: f.size });
  await course.save();
  res.json({ ok: true });
});

r.get('/:id/manifest', async (req, res) => {
  const c = await Course.findById(req.params.id);
  if (!c) return res.status(404).json({ message: 'Not found' });
  res.json({ files: c.contents.map(x => ({ name: x.name, path: x.path, size: x.size ?? null })) });
});

export default r;