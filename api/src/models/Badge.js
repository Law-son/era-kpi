import mongoose from 'mongoose';

const badgeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  icon: {
    type: String,
    required: true,
  },
  criteria: {
    type: String,
    required: true,
    trim: true,
  },
  type: {
    type: String,
    enum: ['auto', 'manual'],
    default: 'auto',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const userBadgeSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  badge: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Badge',
    required: true,
  },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Company',
    required: true,
  },
  awardedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  awardedAt: {
    type: Date,
    default: Date.now,
  },
  reason: {
    type: String,
    trim: true,
  },
});

export default mongoose.model('Badge', badgeSchema);
export const UserBadge = mongoose.model('UserBadge', userBadgeSchema);