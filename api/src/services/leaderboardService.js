import Leaderboard from '../models/Leaderboard.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Company from '../models/Company.js';

export const generateMonthlyLeaderboard = async (year, month) => {
  try {
    console.log(`Generating monthly leaderboard for ${year}-${month}`);
    
    // Get all companies
    const companies = await Company.find({});
    console.log(`Found ${companies.length} companies`);
    
    for (const company of companies) {
      console.log(`Processing company: ${company.name}`);
      
      // Get all executives in this company
      const executives = await User.find({ 
        company: company._id, 
        role: 'executive',
        isActive: true 
      });
      
      if (executives.length === 0) {
        console.log(`No executives found in company ${company.name}`);
        continue;
      }
      
      const leaderboardEntries = [];
      
      for (const exec of executives) {
        // Get completed tasks for this executive in the specified month
        const startDate = new Date(year, month - 1, 1);
        const endDate = new Date(year, month, 0, 23, 59, 59);
        
        const tasks = await Task.find({
          assignedTo: exec._id,
          status: 'completed',
          'scoring.totalScore': { $exists: true, $ne: null },
          createdAt: { 
            $gte: startDate,
            $lte: endDate
          }
        });
        
        if (tasks.length > 0) {
          const totalScore = tasks.reduce((sum, task) => sum + (task.scoring.totalScore || 0), 0);
          const averageScore = totalScore / tasks.length;
          
          leaderboardEntries.push({
            user: exec._id,
            company: company._id,
            totalScore: Math.round(totalScore * 10) / 10,
            averageScore: Math.round(averageScore * 10) / 10,
            tasksCompleted: tasks.length,
            badges: [],
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
      
      // Check if leaderboard already exists
      const existingLeaderboard = await Leaderboard.findOne({
        company: company._id,
        type: 'monthly',
        'period.year': year,
        'period.month': month
      });
      
      if (existingLeaderboard) {
        // Update existing leaderboard
        existingLeaderboard.entries = leaderboardEntries;
        await existingLeaderboard.save();
        console.log(`Updated monthly leaderboard for company ${company.name}`);
      } else {
        // Create new leaderboard
        const newLeaderboard = new Leaderboard({
          company: company._id,
          type: 'monthly',
          period: { year, month },
          entries: leaderboardEntries
        });
        
        await newLeaderboard.save();
        console.log(`Created monthly leaderboard for company ${company.name} with ${leaderboardEntries.length} entries`);
      }
    }
    
    const leaderboardData = {
      year,
      month,
      period: 'monthly',
      generatedAt: new Date(),
      status: 'completed',
      message: 'Monthly leaderboard generated successfully'
    };
    
    console.log('Monthly leaderboard generated:', leaderboardData);
    return leaderboardData;
  } catch (error) {
    console.error('Error generating monthly leaderboard:', error);
    throw error;
  }
};

export const calculateUserPerformance = async (userId, year, month) => {
  try {
    // This would calculate performance metrics for a specific user
    // based on completed tasks, time taken, etc.
    
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);
    
    // Placeholder implementation
    const performance = {
      userId,
      year,
      month,
      tasksCompleted: 0,
      tasksPending: 0,
      averageCompletionTime: 0,
      performanceScore: 0,
      rank: 0
    };
    
    return performance;
  } catch (error) {
    console.error('Error calculating user performance:', error);
    throw error;
  }
};

export const updateLeaderboard = async (companyId, period, year, month) => {
  try {
    // This would update an existing leaderboard with new data
    console.log(`Updating leaderboard for company ${companyId}, period ${period}, ${year}-${month}`);
    
    // Placeholder implementation
    const updateData = {
      companyId,
      period,
      year,
      month,
      updatedAt: new Date(),
      status: 'updated'
    };
    
    return updateData;
  } catch (error) {
    console.error('Error updating leaderboard:', error);
    throw error;
  }
};

export const getTopPerformers = async (companyId, limit = 10) => {
  try {
    // This would return the top performers for a company
    console.log(`Getting top ${limit} performers for company ${companyId}`);
    
    // Placeholder implementation
    const topPerformers = [];
    
    return topPerformers;
  } catch (error) {
    console.error('Error getting top performers:', error);
    throw error;
  }
}; 