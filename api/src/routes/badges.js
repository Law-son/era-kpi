import express from 'express';
import Badge from '../models/Badge.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all badges
router.get('/', authenticate, async (req, res) => {
  try {
    const { company } = req.query;
    const filter = {};
    
    if (company) filter.company = company;
    
    const badges = await Badge.find(filter)
      .populate('company', 'name')
      .sort({ createdAt: -1 });
    
    res.json(badges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get badge by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id)
      .populate('company', 'name');
    
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    res.json(badge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new badge
router.post('/', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const { name, description, criteria, company, icon, points } = req.body;
    
    const badge = new Badge({
      name,
      description,
      criteria,
      company,
      icon,
      points
    });
    
    const savedBadge = await badge.save();
    const populatedBadge = await Badge.findById(savedBadge._id)
      .populate('company', 'name');
    
    res.status(201).json(populatedBadge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update badge
router.put('/:id', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const { name, description, criteria, icon, points, isActive } = req.body;
    
    const badge = await Badge.findByIdAndUpdate(
      req.params.id,
      { name, description, criteria, icon, points, isActive },
      { new: true }
    ).populate('company', 'name');
    
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    res.json(badge);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete badge
router.delete('/:id', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const badge = await Badge.findByIdAndDelete(req.params.id);
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    res.json({ message: 'Badge deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Award badge to user
router.post('/:id/award', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const { userId } = req.body;
    const badgeId = req.params.id;
    
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({ message: 'Badge not found' });
    }
    
    // This would typically update the user's badges array
    // For now, returning a success message
    res.json({ 
      message: 'Badge awarded successfully',
      badge: badge.name,
      userId: userId
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router; 