import mongoose from 'mongoose';

const leaderboardEntrySchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  totalScore: {
    type: Number,
    required: true,
  },
  rank: {
    type: Number,
    required: true,
  },
  tasksCompleted: {
    type: Number,
    default: 0,
  },
  averageScore: {
    type: Number,
    default: 0,
  },
  badges: [{
    type: String,
  }],
  performanceLevel: {
    type: String,
    enum: ['excellent', 'satisfactory', 'underperforming'],
    required: true,
  },
});

const leaderboardSchema = new mongoose.Schema({
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  type: {
    type: String,
    enum: ['monthly', 'yearly'],
    required: true,
  },
  period: {
    year: {
      type: Number,
      required: true,
    },
    month: {
      type: Number,
      required: function() {
        return this.type === 'monthly';
      },
    },
  },
  entries: [leaderboardEntrySchema],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Index for efficient queries
leaderboardSchema.index({ company: 1, type: 1, 'period.year': 1, 'period.month': 1 });

export default mongoose.model('Leaderboard', leaderboardSchema);