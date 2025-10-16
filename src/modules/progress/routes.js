import { Router } from 'express';
import Progress from './progress.model.js';
import { auth } from '../../middleware/auth.js';

const r = Router();

r.post('/', auth(), async (req, res) => {
  const { courseId, unitId, status, updatedAt } = req.body;
  if (!courseId || !unitId) return res.status(400).json({ message: 'courseId y unitId requeridos' });
  const doc = await Progress.findOneAndUpdate(
    { userId: req.user.id, courseId, unitId },
    { status: status || 'done', updatedAtClient: updatedAt ? new Date(updatedAt) : undefined },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );
  res.json(doc.toJSON());
});

r.get('/', auth(), async (req, res) => {
  const list = await Progress.find({ userId: req.user.id }).sort({ updatedAt: -1 });
  res.json(list.map(x => x.toJSON()));
});

export default r;
