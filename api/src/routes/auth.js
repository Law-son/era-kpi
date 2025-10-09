import express from 'express';
import jwt from 'jsonwebtoken';
import { body, validationResult } from 'express-validator';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Login
router.post('/login', [
  body('email').isEmail().trim(),
  body('password').isLength({ min: 1 }),
], async (req, res) => {
  try {
    console.log('[AUTH] Login attempt for email:', req.body?.email);
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { password } = req.body;
    const originalEmail = String(req.body.email || '');
    const normalizedEmail = originalEmail.trim().toLowerCase();
    if (originalEmail !== normalizedEmail) {
      console.log('[AUTH] Email normalized:', { originalEmail, normalizedEmail });
    }

    // Find user
    let user = await User.findOne({ email: normalizedEmail }).populate('company');
    if (!user) {
      // Fallback: case-insensitive exact match in case legacy data has different casing/whitespace
      const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      user = await User.findOne({ email: { $regex: `^${escaped}$`, $options: 'i' } }).populate('company');
      if (user) {
        console.warn('[AUTH] Email matched only via case-insensitive fallback for userId:', user._id.toString());
      }
    }
    if (!user) {
      console.warn('[AUTH] Login failed: user not found for email:', normalizedEmail);
      return res.status(401).json({ message: 'Invalid credentials' });
    }
    if (user.isActive === false) {
      console.warn('[AUTH] Login blocked: user inactive for userId:', user._id.toString());
      return res.status(403).json({ message: 'Account is inactive. Contact your administrator.' });
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      console.warn('[AUTH] Login failed: password mismatch for userId:', user._id.toString());
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    // Generate token
    if (!process.env.JWT_SECRET) {
      console.error('[AUTH] JWT_SECRET is not set in environment');
      return res.status(500).json({ message: 'Server error' });
    }
    const token = jwt.sign(
      { userId: user._id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        company: user.company?._id,
        companyName: user.company?.name,
        department: user.department,
        phoneNumber: user.phoneNumber,
        mustChangePassword: user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('[AUTH] Login error:', error?.message || error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify token
router.get('/verify', authenticate, async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        company: req.user.company?._id,
        companyName: req.user.company?.name,
        department: req.user.department,
        phoneNumber: req.user.phoneNumber,
        mustChangePassword: req.user.mustChangePassword,
      },
    });
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Change password
router.put('/change-password', authenticate, [
  body('currentPassword').isLength({ min: 1 }),
  body('newPassword').isLength({ min: 8 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;

    // Verify current password
    const isCurrentPasswordValid = await req.user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({ message: 'Current password is incorrect' });
    }

    // Update password
    req.user.password = newPassword;
    req.user.mustChangePassword = false;
    await req.user.save();

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;