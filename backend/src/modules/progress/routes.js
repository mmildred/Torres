import { Router } from 'express';
import Progress from './progress.model.js';
import { auth } from '../../middleware/auth.js';

const r = Router();


r.post('/', auth, async (req, res) => { 
  const { courseId, item, progress } = req.body;
  if (!courseId || !item) return res.status(400).json({ message: 'courseId e item requeridos' });
  
  const existing = await Progress.findOne({ userId: req.user.id, courseId, item });
  if (existing) {
    existing.progress = progress;
    await existing.save();
    res.json(existing.toJSON());
  } else {
    const p = await Progress.create({ userId: req.user.id, courseId, item, progress });
    res.json(p.toJSON());
  }
});

r.get('/:courseId', auth, async (req, res) => {
  const list = await Progress.find({ userId: req.user.id, courseId: req.params.courseId });
  res.json(list.map(x => x.toJSON()));
});

export default r;