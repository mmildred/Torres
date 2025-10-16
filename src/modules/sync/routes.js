import { Router } from 'express';
import Course from '../courses/course.model.js';
import Progress from '../progress/progress.model.js';
import { auth } from '../../middleware/auth.js';

const r = Router();
const applied = new Set();

r.post('/', auth(), async (req, res) => {
  const ops = Array.isArray(req.body?.ops) ? req.body.ops : [];
  const appliedRes = [];
  const errors = [];

  for (const op of ops) {
    try {
      if (!op || !op.opId || applied.has(op.opId)) {
        appliedRes.push({ opId: op?.opId, status: 'skip' });
        continue;
      }
      if (op.type === 'create-course') {
        const { tempId, title, description } = op.payload || {};
        const course = await Course.create({ title, description, ownerId: req.user.id, contents: [] });
        applied.add(op.opId);
        appliedRes.push({ opId: op.opId, status: 'ok', map: tempId ? { [tempId]: course.id } : undefined });
      } else if (op.type === 'progress') {
        const { courseId, unitId, status, updatedAt } = op.payload || {};
        await Progress.findOneAndUpdate(
          { userId: req.user.id, courseId, unitId },
          { status: status || 'done', updatedAtClient: updatedAt ? new Date(updatedAt) : undefined },
          { upsert: true, new: true, setDefaultsOnInsert: true }
        );
        applied.add(op.opId);
        appliedRes.push({ opId: op.opId, status: 'ok' });
      } else if (op.type === 'upload') {
        applied.add(op.opId);
        appliedRes.push({ opId: op.opId, status: 'ok' });
      } else {
        appliedRes.push({ opId: op.opId, status: 'ignored' });
      }
    } catch (e) {
      errors.push({ opId: op?.opId, error: String(e) });
    }
  }

  res.json({ applied: appliedRes, errors });
});

export default r;
