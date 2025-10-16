import mongoose from 'mongoose';
import { toJSON } from '../../utils/toJSON.js';

const contentSchema = new mongoose.Schema({
  name: String,
  path: String,
  size: Number
}, { _id: true });

const courseSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, default: '' },
  ownerId: { type: String, index: true },
  contents: [contentSchema]
}, { timestamps: true, toJSON });

export default mongoose.model('Course', courseSchema);
