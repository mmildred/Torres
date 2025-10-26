import mongoose from 'mongoose';
import { toJSON } from '../../utils/toJSON.js';

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true, index: true },
  password: { type: String, required: true },
  role: { 
    type: String, 
    enum: ['student','teacher','admin'], 
    default: 'student' 
  }
}, { timestamps: true, toJSON });

export default mongoose.model('User', userSchema);