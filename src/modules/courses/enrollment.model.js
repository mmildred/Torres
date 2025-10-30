// models/enrollment.model.js
import mongoose from 'mongoose';

const enrollmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  completedContentIds: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  lastAccessAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Índice compuesto para evitar duplicados
enrollmentSchema.index({ courseId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);