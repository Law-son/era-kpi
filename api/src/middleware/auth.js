import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      console.warn('[AUTH] Missing Authorization token');
      return res.status(401).json({ message: 'No token provided' });
    }

    if (!process.env.JWT_SECRET) {
      console.error('[AUTH] JWT_SECRET is not set in environment');
      return res.status(500).json({ message: 'Server error' });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).populate('company');

    if (!user) {
      console.warn('[AUTH] Token user not found:', decoded.userId);
      return res.status(401).json({ message: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('[AUTH] Authentication error:', error?.message || error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

export const authorize = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
};

export const authorizeCompany = async (req, res, next) => {
  try {
    // Super admin can access everything
    if (req.user.role === 'superadmin') {
      return next();
    }

    // For other roles, check if they belong to the same company
    const companyId = req.params.companyId || req.body.company || req.query.company;
    const userCompanyId = req.user.company._id?.toString?.() || req.user.company.id?.toString?.();
    if (companyId && userCompanyId !== companyId) {
      return res.status(403).json({ message: 'Access denied to this company' });
    }

    next();
  } catch (error) {
    console.error('Company authorization error:', error);
    res.status(500).json({ message: 'Authorization check failed' });
  }
};