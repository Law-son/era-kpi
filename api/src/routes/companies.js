import express from 'express';
import { body, validationResult } from 'express-validator';
import Company from '../models/Company.js';
import User from '../models/User.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = express.Router();

// Get all companies (Super admin only)
router.get('/', authenticate, authorize(['superadmin']), async (req, res) => {
  try {
    const companies = await Company.find()
      .populate('adminCount')
      .populate('executiveCount')
      .sort({ createdAt: -1 });

    res.json(companies);
  } catch (error) {
    console.error('Get companies error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create company (Super admin only)
router.post('/', authenticate, authorize(['superadmin']), [
  body('name').trim().isLength({ min: 1 }),
  body('industry').trim().isLength({ min: 1 }),
  body('description').trim().isLength({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, industry, description } = req.body;

    // Check if company already exists
    const existingCompany = await Company.findOne({ name });
    if (existingCompany) {
      return res.status(400).json({ message: 'Company already exists' });
    }

    const company = new Company({
      name,
      industry,
      description,
    });

    await company.save();
    res.status(201).json(company);
  } catch (error) {
    console.error('Create company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update company (Super admin only)
router.put('/:id', authenticate, authorize(['superadmin']), [
  body('name').trim().isLength({ min: 1 }),
  body('industry').trim().isLength({ min: 1 }),
  body('description').trim().isLength({ min: 1 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, industry, description } = req.body;
    const { id } = req.params;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if name is taken by another company
    if (name !== company.name) {
      const existingCompany = await Company.findOne({ name });
      if (existingCompany) {
        return res.status(400).json({ message: 'Company name already exists' });
      }
    }

    company.name = name;
    company.industry = industry;
    company.description = description;
    company.updatedAt = Date.now();

    await company.save();
    res.json(company);
  } catch (error) {
    console.error('Update company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete company (Super admin only)
router.delete('/:id', authenticate, authorize(['superadmin']), async (req, res) => {
  try {
    const { id } = req.params;

    const company = await Company.findById(id);
    if (!company) {
      return res.status(404).json({ message: 'Company not found' });
    }

    // Check if company has users
    const userCount = await User.countDocuments({ company: id });
    if (userCount > 0) {
      return res.status(400).json({ 
        message: 'Cannot delete company with existing users. Please remove all users first.' 
      });
    }

    await Company.findByIdAndDelete(id);
    res.json({ message: 'Company deleted successfully' });
  } catch (error) {
    console.error('Delete company error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;