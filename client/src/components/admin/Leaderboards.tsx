import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Calendar, RefreshCw } from 'lucide-react';
import { leaderboardApi } from '../../services/api';
import toast from 'react-hot-toast';

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
}

interface Leaderboard {
  _id: string;
  type: string;
  period: {
    year: number;
    month?: number;
  };
  entries: LeaderboardEntry[];
  createdAt: string;
}

const Leaderboards: React.FC = () => {
  const [leaderboards, setLeaderboards] = useState<Leaderboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedYear, selectedMonth, viewType]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      let response;
      if (viewType === 'monthly') {
        response = await leaderboardApi.getMonthly(selectedYear, selectedMonth);
      } else {
        response = await leaderboardApi.getYearly(selectedYear);
      }
      if (Array.isArray(response.data)) {
        setLeaderboards(response.data);
      } else {
        setLeaderboards([response.data]);
      }
    } catch (error) {
      toast.error('Failed to fetch leaderboard');
      setLeaderboards([]);
    } finally {
      setLoading(false);
    }
  };

  const generateLeaderboard = async () => {
    try {
      if (viewType === 'monthly') {
        await leaderboardApi.generate('monthly', selectedYear, selectedMonth);
      } else {
        await leaderboardApi.generate('yearly', selectedYear);
      }
      toast.success('Leaderboard generated successfully');
      fetchLeaderboard();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to generate leaderboard');
    }
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'performance-excellent';
      case 'satisfactory': return 'performance-satisfactory';
      case 'underperforming': return 'performance-underperforming';
      default: return 'bg-gray-100 text-gray-800';
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

  const currentLeaderboard = leaderboards[0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">Leaderboards</h2>
        <button
          onClick={generateLeaderboard}
          className="btn-primary flex items-center space-x-2"
        >
          <RefreshCw className="h-4 w-4" />
          <span>Generate Leaderboard</span>
        </button>
      </div>

      <div className="card">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as 'monthly' | 'yearly')}
              className="form-input w-auto"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
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

          {viewType === 'monthly' && (
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
          )}
        </div>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
          </div>
        ) : currentLeaderboard ? (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {viewType === 'monthly' 
                  ? `${months[selectedMonth - 1]} ${selectedYear}` 
                  : `${selectedYear}`} Leaderboard
              </h3>
              <p className="text-gray-500">
                {currentLeaderboard.entries.length} executives ranked
              </p>
            </div>

            <div className="space-y-3">
              <div className="mb-4">
                <h4 className="text-lg font-semibold text-gray-900">🏆 Top 10 Executives</h4>
                <p className="text-sm text-gray-500">Ranked by total performance score</p>
              </div>
              {currentLeaderboard.entries.slice(0, 10).map((entry) => (
                <div
                  key={entry.user._id}
                  className={`p-4 rounded-lg border-2 transition-all ${
                    entry.rank <= 3 
                      ? 'bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200 shadow-lg' 
                      : 'bg-white border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center justify-center w-12 h-12 rounded-full bg-gray-100">
                        {getRankIcon(entry.rank)}
                      </div>
                      
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-semibold text-gray-900">{entry.user.name}</h4>
                          <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                            #{entry.rank}
                          </span>
                        </div>
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
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leaderboard data</h3>
            <p className="text-gray-500">Generate a leaderboard to see rankings.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboards;