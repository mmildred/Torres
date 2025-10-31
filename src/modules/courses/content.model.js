import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['pdf', 'video', 'image', 'document', 'presentation'],
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, 
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  educationalLevel: {
    type: String,
    enum: ['primaria', 'secundaria', 'preparatoria', 'universidad'],
    required: true
  },
  accessLevel: {
    type: String,
    enum: ['public', 'registered', 'enrolled'],
    default: 'registered'
  },
  enrolledUsers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  downloadedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    downloadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  downloadCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

export default mongoose.model('File', contentSchema);