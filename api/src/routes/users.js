import express from 'express';
import User from '../models/User.js';
import mongoose from 'mongoose';
import { authenticate, authorize } from '../middleware/auth.js';
import { sendAdminAddedEmail } from '../services/emailService.js';

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const users = await User.find().select('-password').populate('company', 'name');
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get all users for a company (admin or superadmin)
router.get('/company/:companyId', authenticate, async (req, res) => {
  try {
    const { companyId } = req.params;
    if (!mongoose.Types.ObjectId.isValid(companyId)) {
      return res.status(400).json({ message: 'Invalid company id' });
    }
    console.log('[USERS] Getting users for company:', companyId);
    console.log('[USERS] Requesting user:', req.user?.email, 'Role:', req.user?.role, 'Company:', req.user?.company?._id);
    
    // Only allow access if the user is superadmin or belongs to the company
    const userCompanyId = (
      (req.user?.company && (req.user.company._id || req.user.company.id || req.user.company))
    )?.toString?.();
    console.log('[USERS] User company ID:', userCompanyId, 'Requested company ID:', companyId);
    
    if (
      req.user.role !== 'superadmin' &&
      userCompanyId !== companyId
    ) {
      console.log('[USERS] Access denied - company mismatch');
      return res.status(403).json({ message: 'Access denied to this company' });
    }
    
    const users = await User.find({ company: companyId }).select('-password').populate('company', 'name');
    console.log('[USERS] Found users:', users.length);
    users.forEach(user => {
      console.log(`[USERS] User ${user._id}: ${user.name} (${user.role})`);
    });
    
    res.json(users);
  } catch (error) {
    console.error('[USERS] Error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password').populate('company', 'name');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update user
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { name, email, role, company, department, phoneNumber, password } = req.body;
    const updateData = { name, email, role, company, department, phoneNumber };

    let user;
    if (password) {
      // Ensure password hashing via pre-save hook
      const doc = await User.findById(req.params.id);
      if (!doc) {
        return res.status(404).json({ message: 'User not found' });
      }
      if (name !== undefined) doc.name = name;
      if (email !== undefined) doc.email = email;
      if (role !== undefined) doc.role = role;
      if (company !== undefined) doc.company = company;
      if (department !== undefined) doc.department = department;
      if (phoneNumber !== undefined) doc.phoneNumber = phoneNumber;
      doc.password = password;
      await doc.save();
      user = await User.findById(doc._id).select('-password');
    } else {
      user = await User.findByIdAndUpdate(
        req.params.id,
        updateData,
        { new: true, runValidators: true, context: 'query' }
      ).select('-password');
    }
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user);
  } catch (error) {
    // Duplicate email friendly error
    if ((error?.code === 11000 || error?.code === 'E11000') && (error?.keyPattern?.email || error?.keyValue?.email)) {
      return res.status(409).json({ message: 'Email already in use by another user' });
    }
    res.status(500).json({ message: error.message || 'Failed to update user' });
  }
});

// Delete user (admin only)
router.delete('/:id', authenticate, authorize(['admin', 'superadmin']), async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // If deleting an executive, delete all their assigned tasks
    if (user.role === 'executive') {
      const Task = (await import('../models/Task.js')).default;
      const assignedTasks = await Task.find({ assignedTo: user._id });
      
      if (assignedTasks.length > 0) {
        console.log(`[USERS] Deleting ${assignedTasks.length} tasks assigned to executive ${user.name}`);
        await Task.deleteMany({ assignedTo: user._id });
        console.log(`[USERS] Successfully deleted ${assignedTasks.length} tasks`);
      }
    }

    // Delete the user
    await User.findByIdAndDelete(req.params.id);
    
    const message = user.role === 'executive' 
      ? `User and ${assignedTasks?.length || 0} assigned tasks deleted successfully`
      : 'User deleted successfully';
    
    res.json({ message });
  } catch (error) {
    console.error('[USERS] Delete user error:', error);
    res.status(500).json({ message: error.message });
  }
});

// Create new user (admin or executive)
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('Attempting to create user:', req.body);
    const { name, email, password, role, company, department, phoneNumber } = req.body;

    // Validate required fields
    if (!name || !email || !role || !company || !department || !phoneNumber) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Only superadmin can create admins
    if (role === 'admin') {
      if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Only superadmin can create admins' });
      }
    }

    // Only admin can create executives for their own company
    if (role === 'executive') {
      if (req.user.role === 'admin') {
        const userCompanyId = req.user.company._id?.toString?.() || req.user.company.id?.toString?.();
        console.log('userCompanyId:', userCompanyId, 'company from request:', company);
        if (userCompanyId !== company) {
          return res.status(403).json({ message: 'Admins can only create executives for their own company' });
        }
      } else if (req.user.role !== 'superadmin') {
        return res.status(403).json({ message: 'Only admin or superadmin can create executives' });
      }
    }

    // Prevent duplicate emails
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email already exists' });
    }

    // Use provided password or generate a temporal one
    const userPassword = password || Math.random().toString(36).slice(-8) + '@Temp1';

    const newUser = new User({
      name,
      email,
      password: userPassword,
      role,
      company,
      department,
      phoneNumber,
      mustChangePassword: true,
      isActive: true,
    });

    await newUser.save();
    console.log('User created successfully:', newUser.email, 'role:', newUser.role);

    // If a superadmin created an admin, send email notification
    if (role === 'admin' && req.user.role === 'superadmin') {
      const subject = 'You have been added as an Admin to ERA KPI Management';
      const dashboardUrl = process.env.DASHBOARD_URL || 'http://localhost:5173';
      const message = `Hello ${name},\n\n` +
        `You have been added as an Admin to your company's KPI management platform.\n` +
        `Login with the credentials below and change your password after logging in.\n\n` +
        `Email: ${email}\n` +
        `Temporary Password: ${userPassword}\n\n` +
        `Dashboard: ${dashboardUrl}\n\n` +
        `Best regards,\nERA KPI Team`;

      // Fire and forget; do not block user creation on email result
      sendAdminAddedEmail({ toEmail: email, toName: name, subject, message }).catch(() => {});
    }

    res.status(201).json({
      message: 'User created successfully',
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        company: newUser.company,
        department: newUser.department,
        phoneNumber: newUser.phoneNumber,
        mustChangePassword: newUser.mustChangePassword,
      },
      temporalPassword: userPassword,
    });
  } catch (error) {
    console.error('User creation error:', error);
    if ((error?.code === 11000 || error?.code === 'E11000') && (error?.keyPattern?.email || error?.keyValue?.email)) {
      return res.status(409).json({ message: 'Email already in use by another user' });
    }
    res.status(500).json({ message: error.message || 'Failed to create user' });
  }
});

export default router; 