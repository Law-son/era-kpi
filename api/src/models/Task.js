import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  deadline: {
    type: Date,
    required: true,
  },
  reportLink: {
    type: String,
    trim: true,
    required: true,
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'submitted', 'completed', 'overdue'],
    default: 'pending',
  },
  submission: {
    content: String,
    submittedAt: Date,
  },
  scoring: {
    qualityScore: {
      type: Number,
      min: 0,
      max: 10,
    },
    timeScore: {
      type: Number,
      min: 0,
      max: 10,
    },
    initiativeScore: {
      type: Number,
      min: 0,
      max: 10,
    },
    totalScore: {
      type: Number,
      min: 0,
      max: 10,
    },
    feedback: String,
    scoredBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    scoredAt: Date,
  },
  comments: [
    {
      author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: { type: String, enum: ['admin', 'executive', 'superadmin'] },
      text: { type: String, trim: true },
      createdAt: { type: Date, default: Date.now },
    }
  ],
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Calculate time score based on submission time
taskSchema.methods.calculateTimeScore = function() {
  if (!this.submission.submittedAt) return 0;
  
  const baseScore = 10;
  const submissionTime = new Date(this.submission.submittedAt);
  const deadline = new Date(this.deadline);
  
  if (submissionTime <= deadline) {
    return baseScore;
  } else {
    // Late submission penalty
    return Math.max(0, baseScore - 2);
  }
};

// Calculate total score
taskSchema.methods.calculateTotalScore = function() {
  const qualityWeight = 0.4;
  const timeWeight = 0.4;
  const initiativeWeight = 0.2;
  
  const qualityScore = this.scoring.qualityScore || 0;
  const timeScore = this.scoring.timeScore || 0;
  const initiativeScore = this.scoring.initiativeScore || 0;
  
  return (qualityScore * qualityWeight) + (timeScore * timeWeight) + (initiativeScore * initiativeWeight);
};

export default mongoose.model('Task', taskSchema);