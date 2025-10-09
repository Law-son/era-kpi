import mongoose from 'mongoose';

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  industry: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
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

companySchema.virtual('adminCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'company',
  count: true,
  match: { role: 'admin' },
});

companySchema.virtual('executiveCount', {
  ref: 'User',
  localField: '_id',
  foreignField: 'company',
  count: true,
  match: { role: 'executive' },
});

companySchema.set('toJSON', { virtuals: true });
companySchema.set('toObject', { virtuals: true });

export default mongoose.model('Company', companySchema);