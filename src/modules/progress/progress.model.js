import mongoose from 'mongoose';
import { toJSON } from '../../utils/toJSON.js';

const schema = new mongoose.Schema({
  userId: { type: String, index: true },
  courseId: { type: String, index: true },
  unitId: { type: String, index: true },
  status: { type: String, enum: ['todo','doing','done'], default: 'done' },
  updatedAtClient: { type: Date }
}, { timestamps: true, toJSON });

schema.index({ userId: 1, courseId: 1, unitId: 1 }, { unique: true });

export default mongoose.model('Progress', schema);
