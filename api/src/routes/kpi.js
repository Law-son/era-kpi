import express from 'express';
import Task from '../models/Task.js';
import User from '../models/User.js';
import Leaderboard from '../models/Leaderboard.js';
import { authenticate } from '../middleware/auth.js';

const router = express.Router();

// Get KPI metrics for a company (used by Admin dashboard CompanyStats)
router.get('/company/:companyId', authenticate, async (req, res) => {
  try {
    const { companyId } = req.params;
    const { period, year, month } = req.query;

    // Access control: superadmin can view any; others must belong to company
    const requester = req.user;
    if (
      requester.role !== 'superadmin' &&
      requester?.company?._id?.toString?.() !== companyId &&
      requester?.company?.toString?.() !== companyId
    ) {
      return res.status(403).json({ message: 'Access denied to this company' });
    }

    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;

    // Totals
    const [totalExecutives, totalTasks, completedTasks] = await Promise.all([
      User.countDocuments({ company: companyId, role: 'executive' }),
      Task.countDocuments({ company: companyId }),
      Task.countDocuments({ company: companyId, status: 'completed' })
    ]);

    // Average score across completed tasks with a score
    const scoredTasks = await Task.find({
      company: companyId,
      status: 'completed',
      'scoring.totalScore': { $exists: true }
    }).select('scoring.totalScore');

    const averageScore = scoredTasks.length > 0
      ? Math.round((scoredTasks.reduce((sum, t) => sum + (t.scoring?.totalScore || 0), 0) / scoredTasks.length) * 10) / 10
      : 0;

    // Monthly performance for last 6 months
    const monthlyPerformance = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentYear, currentMonth - 1 - i, 1);
      const monthEnd = new Date(currentYear, currentMonth - i, 0, 23, 59, 59);

      const monthTasks = await Task.find({
        company: companyId,
        createdAt: { $gte: monthStart, $lte: monthEnd }
      }).select('status scoring.totalScore');

      const monthCompletedWithScore = monthTasks.filter(t => t.status === 'completed' && t.scoring?.totalScore !== undefined);
      const monthAvg = monthCompletedWithScore.length > 0
        ? monthCompletedWithScore.reduce((sum, t) => sum + (t.scoring?.totalScore || 0), 0) / monthCompletedWithScore.length
        : 0;

      monthlyPerformance.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        averageScore: Math.round(monthAvg * 10) / 10,
        tasksCompleted: monthTasks.filter(t => t.status === 'completed').length
      });
    }

    // Department stats: number of executives per department and avg score
    const executives = await User.find({ company: companyId, role: 'executive', isActive: true }).select('_id department');
    const departmentMap = new Map();
    for (const exec of executives) {
      const dept = exec.department || 'Unassigned';
      if (!departmentMap.has(dept)) {
        departmentMap.set(dept, { executiveIds: [], executiveCount: 0, totalScore: 0, scoredTasks: 0 });
      }
      const entry = departmentMap.get(dept);
      entry.executiveIds.push(exec._id);
      entry.executiveCount += 1;
    }

    // Compute department average scores
    for (const [dept, entry] of departmentMap.entries()) {
      if (entry.executiveIds.length > 0) {
        const deptTasks = await Task.find({
          company: companyId,
          assignedTo: { $in: entry.executiveIds },
          status: 'completed',
          'scoring.totalScore': { $exists: true }
        }).select('scoring.totalScore');
        entry.totalScore = deptTasks.reduce((sum, t) => sum + (t.scoring?.totalScore || 0), 0);
        entry.scoredTasks = deptTasks.length;
      }
    }

    const departmentStats = Array.from(departmentMap.entries()).map(([department, entry]) => ({
      department,
      executiveCount: entry.executiveCount,
      averageScore: entry.scoredTasks > 0 ? Math.round((entry.totalScore / entry.scoredTasks) * 10) / 10 : 0
    }));

    // Performance distribution among executives by their average scored task
    let excellent = 0, satisfactory = 0, underperforming = 0;
    for (const exec of executives) {
      const execTasks = await Task.find({
        company: companyId,
        assignedTo: exec._id,
        status: 'completed',
        'scoring.totalScore': { $exists: true }
      }).select('scoring.totalScore');
      const execAvg = execTasks.length > 0
        ? execTasks.reduce((sum, t) => sum + (t.scoring?.totalScore || 0), 0) / execTasks.length
        : 0;
      if (execAvg >= 8) excellent += 1;
      else if (execAvg >= 6) satisfactory += 1;
      else underperforming += 1;
    }

    const performanceDistribution = [
      { level: 'excellent', count: excellent },
      { level: 'satisfactory', count: satisfactory },
      { level: 'underperforming', count: underperforming }
    ];

    // Response matching CompanyStats interface
    const response = {
      totalExecutives,
      totalTasks,
      completedTasks,
      averageScore,
      monthlyPerformance,
      departmentStats,
      performanceDistribution
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching company stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get executive KPI metrics
router.get('/executive/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period, year, month } = req.query;
    
    // Get user info
    const user = await User.findById(userId).populate('company', 'name');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Calculate date range
    const currentYear = year ? parseInt(year) : new Date().getFullYear();
    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    
    let startDate, endDate;
    if (period === 'yearly') {
      startDate = new Date(currentYear, 0, 1);
      endDate = new Date(currentYear, 11, 31, 23, 59, 59);
    } else {
      startDate = new Date(currentYear, currentMonth - 1, 1);
      endDate = new Date(currentYear, currentMonth, 0, 23, 59, 59);
    }

    // Get user's tasks
    const tasks = await Task.find({
      assignedTo: userId,
      createdAt: { $gte: startDate, $lte: endDate }
    });

    // Calculate metrics
    const totalTasks = tasks.length;
    const completedTasks = tasks.filter(task => task.status === 'completed').length;
    const submittedTasks = tasks.filter(task => task.status === 'submitted').length;
    
    // Calculate average scores
    const completedTasksWithScores = tasks.filter(task => 
      task.status === 'completed' && task.scoring?.totalScore !== undefined
    );
    
    const averageScore = completedTasksWithScores.length > 0 
      ? completedTasksWithScores.reduce((sum, task) => sum + task.scoring.totalScore, 0) / completedTasksWithScores.length
      : 0;

    const qualityScores = completedTasksWithScores.map(task => task.scoring?.qualityScore || 0);
    const timeScores = completedTasksWithScores.map(task => task.scoring?.timeScore || 0);
    const initiativeScores = completedTasksWithScores.map(task => task.scoring?.initiativeScore || 0);

    const qualityAverage = qualityScores.length > 0 ? qualityScores.reduce((sum, score) => sum + score, 0) / qualityScores.length : 0;
    const timeAverage = timeScores.length > 0 ? timeScores.reduce((sum, score) => sum + score, 0) / timeScores.length : 0;
    const initiativeAverage = initiativeScores.length > 0 ? initiativeScores.reduce((sum, score) => sum + score, 0) / initiativeScores.length : 0;

    // Get monthly performance data for the last 6 months
    const monthlyScores = [];
    for (let i = 5; i >= 0; i--) {
      const monthStart = new Date(currentYear, currentMonth - 1 - i, 1);
      const monthEnd = new Date(currentYear, currentMonth - i, 0, 23, 59, 59);
      
      const monthTasks = await Task.find({
        assignedTo: userId,
        createdAt: { $gte: monthStart, $lte: monthEnd }
      });

      const monthCompletedTasks = monthTasks.filter(task => 
        task.status === 'completed' && task.scoring?.totalScore !== undefined
      );

      const monthScore = monthCompletedTasks.length > 0 
        ? monthCompletedTasks.reduce((sum, task) => sum + task.scoring.totalScore, 0) / monthCompletedTasks.length
        : 0;

      monthlyScores.push({
        month: monthStart.toLocaleDateString('en-US', { month: 'short' }),
        score: monthScore,
        tasksCompleted: monthCompletedTasks.length
      });
    }

    // Get current rank from leaderboard
    const currentRank = await getCurrentRank(userId, user.company._id, currentYear, currentMonth);
    
    // Get total executives in company
    const totalExecutives = await User.countDocuments({ 
      company: user.company._id, 
      role: 'executive',
      isActive: true 
    });

    // Determine performance level
    let performanceLevel = 'underperforming';
    if (averageScore >= 8) performanceLevel = 'excellent';
    else if (averageScore >= 6) performanceLevel = 'satisfactory';

    // Count badges (placeholder - would need to implement badge system)
    const badges = 0;

    const executiveStats = {
      totalTasks,
      completedTasks,
      submittedTasks,
      averageScore: Math.round(averageScore * 10) / 10,
      currentRank,
      totalExecutives,
      monthlyScores,
      scoreBreakdown: {
        qualityAverage: Math.round(qualityAverage * 10) / 10,
        timeAverage: Math.round(timeAverage * 10) / 10,
        initiativeAverage: Math.round(initiativeAverage * 10) / 10,
      },
      performanceLevel,
      badges,
      period: period || 'monthly',
      year: currentYear,
      month: currentMonth
    };
    
    res.json(executiveStats);
  } catch (error) {
    console.error('Error fetching executive stats:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get user KPI metrics (legacy endpoint)
router.get('/user/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params;
    const { period, year, month } = req.query;
    
    // This would typically aggregate user-specific data
    const userKpiData = {
      userId,
      period: period || 'monthly',
      year: year || new Date().getFullYear(),
      month: month || new Date().getMonth() + 1,
      metrics: {
        tasksCompleted: 0,
        tasksPending: 0,
        averageCompletionTime: 0,
        performanceScore: 0,
        rank: 0
      }
    };
    
    res.json(userKpiData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get overall system KPI metrics (superadmin only)
router.get('/overall', authenticate, async (req, res) => {
  try {
    // This would typically aggregate system-wide data
    const overallKpiData = {
      totalCompanies: 0,
      totalUsers: 0,
      totalTasks: 0,
      systemHealth: 'good',
      lastUpdated: new Date()
    };
    
    res.json(overallKpiData);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Helper function to get current rank
async function getCurrentRank(userId, companyId, year, month) {
  try {
    // Try to find existing leaderboard
    const leaderboard = await Leaderboard.findOne({
      company: companyId,
      type: 'monthly',
      'period.year': year,
      'period.month': month
    }).populate('entries.user', 'name');

    if (leaderboard) {
      const userEntry = leaderboard.entries.find(entry => entry.user._id.toString() === userId);
      return userEntry ? userEntry.rank : 0;
    }

    // If no leaderboard exists, calculate rank from tasks
    const executives = await User.find({ 
      company: companyId, 
      role: 'executive',
      isActive: true 
    });

    const executiveStats = [];
    for (const exec of executives) {
      const tasks = await Task.find({
        assignedTo: exec._id,
        status: 'completed',
        'scoring.totalScore': { $exists: true }
      });

      const avgScore = tasks.length > 0 
        ? tasks.reduce((sum, task) => sum + task.scoring.totalScore, 0) / tasks.length
        : 0;

      executiveStats.push({
        userId: exec._id,
        averageScore: avgScore,
        tasksCompleted: tasks.length
      });
    }

    // Sort by average score (descending)
    executiveStats.sort((a, b) => b.averageScore - a.averageScore);
    
    const userIndex = executiveStats.findIndex(stat => stat.userId.toString() === userId);
    return userIndex >= 0 ? userIndex + 1 : executives.length;
  } catch (error) {
    console.error('Error calculating rank:', error);
    return 0;
  }
}

export default router; 