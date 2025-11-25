// enrollment.model.js - VERSIÓN MEJORADA
import mongoose from 'mongoose';

const submissionSchema = new mongoose.Schema({
  contentId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  submittedAt: {
    type: Date,
    default: Date.now
  },
  fileUrl: String,
  fileName: String,
  filePath: String,
  comments: String,
  status: {
    type: String,
    enum: ['submitted', 'graded', 'returned'],
    default: 'submitted'
  },
  grade: {
    type: Number,
    min: 0,
    max: 100
  },
  feedback: String
});

const enrollmentSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  completedContentIds: [{
    type: mongoose.Schema.Types.ObjectId
  }],
  submissions: [submissionSchema],
  lastAccessAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// ✅ ÍNDICE CORREGIDO - Con nombre explícito
enrollmentSchema.index(
  { courseId: 1, userId: 1 }, 
  { 
    unique: true, 
    name: "unique_enrollment_per_course_and_user" 
  }
);

export default mongoose.model('Enrollment', enrollmentSchema);