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
  fileUrl: {
    type: String,
    default: ''
  },
  fileName: {
    type: String,
    default: ''
  },
  filePath: {
    type: String,
    default: ''
  },
  comments: {
    type: String,
    default: ''
  },
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
  feedback: {
    type: String,
    default: ''
  }
});

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
  submissions: [submissionSchema],
  lastAccessAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

enrollmentSchema.index({ courseId: 1, userId: 1 }, { unique: true });

export default mongoose.model('Enrollment', enrollmentSchema);