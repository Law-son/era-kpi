import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Target, Calendar, Trophy, Medal, Users, BarChart3 } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { kpiApi, leaderboardApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface PerformanceStats {
  totalTasks: number;
  completedTasks: number;
  submittedTasks: number;
  averageScore: number;
  currentRank: number;
  totalExecutives: number;
  monthlyScores: Array<{
    month: string;
    score: number;
    tasksCompleted: number;
  }>;
  scoreBreakdown: {
    qualityAverage: number;
    timeAverage: number;
    initiativeAverage: number;
  };
  performanceLevel: string;
  badges: number;
}

interface LeaderboardEntry {
  user: {
    _id: string;
    name: string;
    email: string;
    department: string;
  };
  totalScore: number;
  rank: number;
  tasksCompleted: number;
  averageScore: number;
  badges: string[];
  performanceLevel: string;
  isCurrentUser?: boolean;
}

interface LeaderboardData {
  top10: LeaderboardEntry[];
  currentUserPosition: LeaderboardEntry | null;
  totalExecutives: number;
  period: {
    year: number;
    month: number;
  };
}

const Performance: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const { user } = useAuth();

  useEffect(() => {
    fetchPerformanceData();
  }, [selectedYear, selectedMonth]);

  const fetchPerformanceData = async () => {
    try {
      setLoading(true);
      
      if (user?.id && user?.company) {
        // Fetch performance stats
        const statsResponse = await kpiApi.getExecutiveStats(user.id);
        setStats(statsResponse.data);

        // Fetch leaderboard data
        const companyId = typeof (user as any).company === 'object'
          ? ((user as any).company._id || (user as any).company.id)
          : String((user as any).company);

        if (!companyId) {
          throw new Error('Missing companyId for leaderboard request');
        }

        const leaderboardResponse = await leaderboardApi.getTop10(
          companyId,
          user.id,
          selectedYear,
          selectedMonth
        );
        setLeaderboard(leaderboardResponse.data);
      }
    } catch (error) {
      toast.error('Failed to fetch performance data');
      console.error('Performance data fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'text-success-600 bg-success-100';
      case 'satisfactory': return 'text-warning-600 bg-warning-100';
      case 'underperforming': return 'text-danger-600 bg-danger-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1: return <Trophy className="h-6 w-6 text-yellow-500" />;
      case 2: return <Medal className="h-6 w-6 text-gray-400" />;
      case 3: return <Award className="h-6 w-6 text-amber-600" />;
      default: return <span className="text-lg font-bold text-gray-600">#{rank}</span>;
    }
  };

  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Performance Dashboard</h2>
        
        {/* Period Selector */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="form-input w-auto"
            >
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
          <div>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
              className="form-input w-auto"
            >
              {months.map((month, index) => (
                <option key={index + 1} value={index + 1}>{month}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Performance Overview Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="card">
            <div className="flex items-center">
              <div className="bg-primary-100 p-3 rounded-lg">
                <Target className="h-6 w-6 text-primary-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Average Score</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.averageScore.toFixed(1)}</p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="bg-success-100 p-3 rounded-lg">
                <TrendingUp className="h-6 w-6 text-success-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Current Rank</p>
                <p className="text-2xl font-semibold text-gray-900">
                  #{stats.currentRank} of {stats.totalExecutives}
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="bg-warning-100 p-3 rounded-lg">
                <Calendar className="h-6 w-6 text-warning-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Completion Rate</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0}%
                </p>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-lg">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">Badges Earned</p>
                <p className="text-2xl font-semibold text-gray-900">{stats.badges}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Level */}
      {stats && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Performance Level</h3>
              <p className="text-gray-500">Based on your overall performance metrics</p>
            </div>
            <div>
              <span className={`px-4 py-2 rounded-full text-lg font-semibold ${getPerformanceColor(stats.performanceLevel)}`}>
                {stats.performanceLevel.charAt(0).toUpperCase() + stats.performanceLevel.slice(1)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Performance Trend */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Performance Trend</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyScores}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="score" 
                  stroke="#0284c7" 
                  strokeWidth={3}
                  name="Average Score"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Score Breakdown */}
          <div className="card">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Score Breakdown</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={[
                { category: 'Quality', score: stats.scoreBreakdown.qualityAverage },
                { category: 'Time', score: stats.scoreBreakdown.timeAverage },
                { category: 'Initiative', score: stats.scoreBreakdown.initiativeAverage },
              ]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="category" />
                <YAxis domain={[0, 10]} />
                <Tooltip />
                <Bar dataKey="score" fill="#0284c7" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Leaderboard Section */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-yellow-500" />
            Company Leaderboard - Top 10
          </h3>
          <div className="text-sm text-gray-500">
            {leaderboard && `${months[selectedMonth - 1]} ${selectedYear}`}
          </div>
        </div>

        {/* Current User Position */}
        {leaderboard?.currentUserPosition && (
          <div className="mb-6 p-4 bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200 rounded-lg border-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary-100">
                  {getRankIcon(leaderboard.currentUserPosition.rank)}
                </div>
                <div>
                  <h4 className="font-semibold text-primary-900">
                    Your Position: #{leaderboard.currentUserPosition.rank}
                  </h4>
                  <p className="text-sm text-gray-600">
                    {leaderboard.currentUserPosition.user.name} • {leaderboard.currentUserPosition.user.department}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600">
                  {leaderboard.currentUserPosition.totalScore.toFixed(1)}
                </div>
                <div className="text-sm text-gray-500">Total Score</div>
              </div>
            </div>
          </div>
        )}

        {/* Top 10 Leaderboard */}
        {leaderboard ? (
          <div className="space-y-3">
            {leaderboard.top10.map((entry) => (
              <div
                key={entry.user._id}
                className={`p-4 rounded-lg border-2 transition-all ${
                  entry.user._id === user?.id 
                    ? 'bg-primary-50 border-primary-300 shadow-md' 
                    : entry.rank <= 3 
                    ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200' 
                    : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                      {getRankIcon(entry.rank)}
                    </div>
                    
                    <div>
                      <h4 className={`font-semibold ${
                        entry.user._id === user?.id ? 'text-primary-900' : 'text-gray-900'
                      }`}>
                        {entry.user.name}
                        {entry.user._id === user?.id && (
                          <span className="ml-2 text-sm text-primary-600">(You)</span>
                        )}
                      </h4>
                      <p className="text-sm text-gray-500">{entry.user.department}</p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-primary-600">
                        {entry.totalScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Total Score</div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {entry.tasksCompleted}
                      </div>
                      <div className="text-xs text-gray-500">Tasks</div>
                    </div>

                    <div className="text-center">
                      <div className="text-lg font-semibold text-gray-900">
                        {entry.averageScore.toFixed(1)}
                      </div>
                      <div className="text-xs text-gray-500">Avg Score</div>
                    </div>

                    <div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPerformanceColor(entry.performanceLevel)}`}>
                        {entry.performanceLevel}
                      </span>
                    </div>
                  </div>
                </div>

                {entry.badges.length > 0 && (
                  <div className="mt-3 flex items-center space-x-2">
                    <span className="text-sm text-gray-500">Badges:</span>
                    <div className="flex space-x-1">
                      {entry.badges.map((badge, index) => (
                        <span key={index} className="text-lg">{badge}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leaderboard data</h3>
            <p className="text-gray-500">Complete some tasks to see your ranking.</p>
          </div>
        )}
      </div>

      {/* Detailed Metrics */}
      {stats && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Performance Metrics</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-primary-100 p-4 rounded-lg mb-3">
                <div className="text-2xl font-bold text-primary-600">
                  {stats.scoreBreakdown.qualityAverage.toFixed(1)}/10
                </div>
              </div>
              <h4 className="font-semibold text-gray-900">Quality Score</h4>
              <p className="text-sm text-gray-500">Average quality of work delivered</p>
            </div>

            <div className="text-center">
              <div className="bg-success-100 p-4 rounded-lg mb-3">
                <div className="text-2xl font-bold text-success-600">
                  {stats.scoreBreakdown.timeAverage.toFixed(1)}/10
                </div>
              </div>
              <h4 className="font-semibold text-gray-900">Time Score</h4>
              <p className="text-sm text-gray-500">Timeliness of task completion</p>
            </div>

            <div className="text-center">
              <div className="bg-warning-100 p-4 rounded-lg mb-3">
                <div className="text-2xl font-bold text-warning-600">
                  {stats.scoreBreakdown.initiativeAverage.toFixed(1)}/10
                </div>
              </div>
              <h4 className="font-semibold text-gray-900">Initiative Score</h4>
              <p className="text-sm text-gray-500">Proactiveness and innovation</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Performance;
