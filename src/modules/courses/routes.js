import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Course from './course.model.js';
import { auth } from '../../middleware/auth.js';

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

r.post('/', auth('teacher'), async (req, res) => {
  const { title, description } = req.body;
  if (!title) return res.status(400).json({ message: 'title requerido' });
  const course = await Course.create({ title, description, ownerId: req.user.id, contents: [] });
  res.json(course.toJSON());
});

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