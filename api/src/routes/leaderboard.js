import express from 'express';
import Leaderboard from '../models/Leaderboard.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get top 10 executives with current user position
router.get('/top10/:companyId', authenticate, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { userId } = req.query;
    const { year, month } = req.query;
    
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    // Get all executives in the company
    const executives = await User.find({ 
      company: companyId, 
      role: 'executive',
      isActive: true 
    }).select('name email department');

    // Calculate performance for each executive
    const executiveStats = [];
    for (const exec of executives) {
      const tasks = await Task.find({
        assignedTo: exec._id,
        status: 'completed',
        'scoring.totalScore': { $exists: true },
        createdAt: { 
          $gte: new Date(currentYear, currentMonth - 1, 1),
          $lte: new Date(currentYear, currentMonth, 0, 23, 59, 59)
        }
      });

      const avgScore = tasks.length > 0 
        ? tasks.reduce((sum, task) => sum + task.scoring.totalScore, 0) / tasks.length
        : 0;

      const totalScore = tasks.reduce((sum, task) => sum + task.scoring.totalScore, 0);

      executiveStats.push({
        user: {
          _id: exec._id,
          name: exec.name,
          email: exec.email,
          department: exec.department
        },
        totalScore: Math.round(totalScore * 10) / 10,
        averageScore: Math.round(avgScore * 10) / 10,
        tasksCompleted: tasks.length,
        badges: [], // Placeholder for badges
        performanceLevel: avgScore >= 8 ? 'excellent' : avgScore >= 6 ? 'satisfactory' : 'underperforming'
      });
    }

    // Sort by total score (descending)
    executiveStats.sort((a, b) => b.totalScore - a.totalScore);
    
    // Add ranks
    executiveStats.forEach((stat, index) => {
      stat.rank = index + 1;
    });

    // Get top 10
    const top10 = executiveStats.slice(0, 10);
    
    // Find current user's position
    let currentUserPosition = null;
    if (userId) {
      const userIndex = executiveStats.findIndex(stat => stat.user._id.toString() === userId);
      if (userIndex >= 0) {
        currentUserPosition = {
          ...executiveStats[userIndex],
          isCurrentUser: true
        };
      }
    }

    const result = {
      top10,
      currentUserPosition,
      totalExecutives: executives.length,
      period: {
        year: currentYear,
        month: currentMonth
      }
    };

    res.json(result);
  } catch (error) {
    console.error('Error fetching top 10 leaderboard:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get leaderboard by ID
router.get('/:id', authenticate, async (req, res) => {
  try {
    const leaderboard = await Leaderboard.findById(req.params.id)
      .populate('company', 'name')
      .populate('entries.user', 'name email');
    
    if (!leaderboard) {
      return res.status(404).json({ message: 'Leaderboard not found' });
    }
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create new leaderboard
router.post('/', authenticate, async (req, res) => {
  try {
    console.log('Leaderboard POST req.body:', req.body); // Debug log
    const { company, period, year, month, entries } = req.body;
    
    const leaderboard = new Leaderboard({
      company,
      period,
      year,
      month,
      entries
    });
    
    const savedLeaderboard = await leaderboard.save();
    const populatedLeaderboard = await Leaderboard.findById(savedLeaderboard._id)
      .populate('company', 'name')
      .populate('entries.user', 'name email');
    
    res.status(201).json(populatedLeaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update leaderboard
router.put('/:id', authenticate, async (req, res) => {
  try {
    const { entries } = req.body;
    
    const leaderboard = await Leaderboard.findByIdAndUpdate(
      req.params.id,
      { entries },
      { new: true }
    ).populate('company', 'name').populate('entries.user', 'name email');
    
    if (!leaderboard) {
      return res.status(404).json({ message: 'Leaderboard not found' });
    }
    res.json(leaderboard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete leaderboard
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const leaderboard = await Leaderboard.findByIdAndDelete(req.params.id);
    if (!leaderboard) {
      return res.status(404).json({ message: 'Leaderboard not found' });
    }
    res.json({ message: 'Leaderboard deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get monthly leaderboard
router.get('/monthly/:year/:month', authenticate, async (req, res) => {
  try {
    const { year, month } = req.params;
    console.log(`[LEADERBOARD] Fetching monthly leaderboard for ${year}-${month}`);
    
    // Find leaderboard for the user's company
    const leaderboard = await Leaderboard.findOne({ 
      company: req.user.company._id,
      type: 'monthly',
      'period.year': parseInt(year), 
      'period.month': parseInt(month) 
    })
      .populate('entries.user', 'name email department');
    
    if (!leaderboard) {
      console.log(`[LEADERBOARD] No leaderboard found for company ${req.user.company._id}, year ${year}, month ${month}`);
      return res.json({
        _id: null,
        type: 'monthly',
        period: { year: parseInt(year), month: parseInt(month) },
        entries: [],
        createdAt: new Date()
      });
    }
    
    console.log(`[LEADERBOARD] Found leaderboard with ${leaderboard.entries.length} entries`);
    res.json(leaderboard);
  } catch (error) {
    console.error('[LEADERBOARD] Error fetching monthly leaderboard:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get yearly leaderboard
router.get('/yearly/:year', authenticate, async (req, res) => {
  try {
    const { year } = req.params;
    console.log(`[LEADERBOARD] Fetching yearly leaderboard for ${year}`);
    
    // Find leaderboard for the user's company
    const leaderboard = await Leaderboard.findOne({ 
      company: req.user.company._id,
      type: 'yearly',
      'period.year': parseInt(year)
    })
      .populate('entries.user', 'name email department');
    
    if (!leaderboard) {
      console.log(`[LEADERBOARD] No yearly leaderboard found for company ${req.user.company._id}, year ${year}`);
      return res.json({
        _id: null,
        type: 'yearly',
        period: { year: parseInt(year) },
        entries: [],
        createdAt: new Date()
      });
    }
    
    console.log(`[LEADERBOARD] Found yearly leaderboard with ${leaderboard.entries.length} entries`);
    res.json(leaderboard);
  } catch (error) {
    console.error('[LEADERBOARD] Error fetching yearly leaderboard:', error);
    res.status(500).json({ message: error.message });
  }
});

// Generate leaderboard
router.post('/generate', authenticate, async (req, res) => {
  try {
    const { type, year, month } = req.body;
    console.log(`[LEADERBOARD] Generating ${type} leaderboard for ${year}${month ? `-${month}` : ''}`);
    
    const companyId = req.user.company._id || req.user.company;
    const currentYear = year || new Date().getFullYear();
    const currentMonth = month || new Date().getMonth() + 1;
    
    // Get all executives in the company
    const executives = await User.find({ 
      company: companyId, 
      role: 'executive',
      isActive: true 
    }).select('name email department');
    
    console.log(`[LEADERBOARD] Found ${executives.length} executives in company ${companyId}`);
    
    if (executives.length === 0) {
      return res.json({ 
        message: 'No executives found in your company',
        entries: [],
        totalExecutives: 0
      });
    }
    
    // Calculate performance for each executive
    const leaderboardEntries = [];
    
    for (const exec of executives) {
      console.log(`[LEADERBOARD] Calculating performance for executive: ${exec.name}`);
      
      // Build date filter based on type
      let dateFilter = {};
      if (type === 'monthly') {
        dateFilter = {
          $gte: new Date(currentYear, currentMonth - 1, 1),
          $lte: new Date(currentYear, currentMonth, 0, 23, 59, 59)
        };
      } else if (type === 'yearly') {
        dateFilter = {
          $gte: new Date(currentYear, 0, 1),
          $lte: new Date(currentYear, 11, 31, 23, 59, 59)
        };
      }
      
      // Get completed tasks with scoring for this executive
      const tasks = await Task.find({
        assignedTo: exec._id,
        status: 'completed',
        'scoring.totalScore': { $exists: true, $ne: null },
        createdAt: dateFilter
      });
      
      console.log(`[LEADERBOARD] Found ${tasks.length} completed tasks for ${exec.name}`);
      
      if (tasks.length > 0) {
        const totalScore = tasks.reduce((sum, task) => sum + (task.scoring.totalScore || 0), 0);
        const averageScore = totalScore / tasks.length;
        
        leaderboardEntries.push({
          user: exec._id,
          company: companyId,
          totalScore: Math.round(totalScore * 10) / 10,
          averageScore: Math.round(averageScore * 10) / 10,
          tasksCompleted: tasks.length,
          badges: [], // TODO: Implement badge system
          performanceLevel: averageScore >= 8 ? 'excellent' : averageScore >= 6 ? 'satisfactory' : 'underperforming'
        });
      }
    }
    
    // Sort by total score (descending)
    leaderboardEntries.sort((a, b) => b.totalScore - a.totalScore);
    
    // Add ranks
    leaderboardEntries.forEach((entry, index) => {
      entry.rank = index + 1;
    });
    
    console.log(`[LEADERBOARD] Generated ${leaderboardEntries.length} leaderboard entries`);
    
    // Check if leaderboard already exists
    const existingLeaderboard = await Leaderboard.findOne({
      company: companyId,
      type: type,
      'period.year': currentYear,
      ...(type === 'monthly' && { 'period.month': currentMonth })
    });
    
    if (existingLeaderboard) {
      // Update existing leaderboard
      existingLeaderboard.entries = leaderboardEntries;
      await existingLeaderboard.save();
      console.log(`[LEADERBOARD] Updated existing leaderboard`);
    } else {
      // Create new leaderboard
      const newLeaderboard = new Leaderboard({
        company: companyId,
        type: type,
        period: {
          year: currentYear,
          ...(type === 'monthly' && { month: currentMonth })
        },
        entries: leaderboardEntries
      });
      
      await newLeaderboard.save();
      console.log(`[LEADERBOARD] Created new leaderboard`);
    }
    
    res.json({
      message: `${type} leaderboard generated successfully`,
      entries: leaderboardEntries,
      totalExecutives: executives.length,
      period: {
        year: currentYear,
        ...(type === 'monthly' && { month: currentMonth })
      }
    });
    
  } catch (error) {
    console.error('[LEADERBOARD] Error generating leaderboard:', error);
    res.status(500).json({ message: error.message });
  }
});

export default router; 