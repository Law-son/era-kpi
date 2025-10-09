import React, { useState, useEffect } from 'react';
import { Trophy, Medal, Award, Calendar, TrendingUp } from 'lucide-react';
import { leaderboardApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
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

const CompanyLeaderboard: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<Leaderboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [viewType, setViewType] = useState<'monthly' | 'yearly'>('monthly');
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedYear, selectedMonth, viewType]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      console.log(`Fetching ${viewType} leaderboard for year ${selectedYear}${viewType === 'monthly' ? `, month ${selectedMonth}` : ''}`);
      
      let response;
      if (viewType === 'monthly') {
        response = await leaderboardApi.getMonthly(selectedYear, selectedMonth);
      } else {
        response = await leaderboardApi.getYearly(selectedYear);
      }
      
      console.log('Leaderboard response:', response.data);
      setLeaderboard(response.data);
    } catch (error: any) {
      console.error('Error fetching leaderboard:', error);
      const errorMessage = error.response?.data?.message || 'Failed to fetch leaderboard';
      toast.error(errorMessage);
      setLeaderboard(null);
    } finally {
      setLoading(false);
    }
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'excellent': return 'bg-green-100 text-green-800 border-green-200';
      case 'satisfactory': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'underperforming': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
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

  const myEntry = leaderboard?.entries.find(entry => entry.user._id === user?.id);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Company Leaderboard</h2>

      {/* My Position Card */}
      {myEntry && (
        <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-6 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                {getRankIcon(myEntry.rank)}
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">My Current Position</h3>
                <p className="text-sm text-gray-600">
                  Rank #{myEntry.rank} of {leaderboard?.entries.length} executives
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                {myEntry.totalScore.toFixed(1)}
              </div>
              <div className="text-sm text-gray-500">Total Score</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <select
              value={viewType}
              onChange={(e) => setViewType(e.target.value as 'monthly' | 'yearly')}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
          </div>

          <div>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : leaderboard ? (
          <div className="space-y-4">
            <div className="text-center mb-6">
              <h3 className="text-xl font-semibold text-gray-900">
                {viewType === 'monthly' 
                  ? `${months[selectedMonth - 1]} ${selectedYear}` 
                  : `${selectedYear}`} Leaderboard
              </h3>
              <p className="text-gray-500">
                {leaderboard.entries.length} executives ranked
              </p>
            </div>

            <div className="space-y-3">
              {/* Top 10 Executives */}
              <div className="mb-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4">🏆 Top 10 Executives</h4>
                <div className="space-y-3">
                  {leaderboard.entries.slice(0, 10).map((entry) => (
                    <div
                      key={entry.user._id}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        entry.user._id === user?.id 
                          ? 'bg-blue-50 border-blue-300 shadow-md ring-2 ring-blue-200' 
                          : entry.rank <= 3 
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
                              <h4 className={`font-semibold ${
                                entry.user._id === user?.id ? 'text-blue-900' : 'text-gray-900'
                              }`}>
                                {entry.user.name}
                                {entry.user._id === user?.id && (
                                  <span className="ml-2 text-sm text-blue-600 font-medium">(You)</span>
                                )}
                              </h4>
                              <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                                #{entry.rank}
                              </span>
                            </div>
                            <p className="text-sm text-gray-500">{entry.user.department}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-6">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">
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

              {/* Current User Position (if not in top 10) */}
              {myEntry && myEntry.rank > 10 && (
                <div className="mt-8">
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">📍 Your Position</h4>
                  <div className="p-4 rounded-lg border-2 bg-blue-50 border-blue-300 shadow-md ring-2 ring-blue-200">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center justify-center w-12 h-12 rounded-full bg-blue-100">
                          <span className="text-lg font-bold text-blue-600">#{myEntry.rank}</span>
                        </div>
                        
                        <div>
                          <div className="flex items-center space-x-2">
                            <h4 className="font-semibold text-blue-900">
                              {myEntry.user.name}
                              <span className="ml-2 text-sm text-blue-600 font-medium">(You)</span>
                            </h4>
                            <span className="px-2 py-1 bg-blue-200 text-blue-800 text-xs font-medium rounded-full">
                              #{myEntry.rank}
                            </span>
                          </div>
                          <p className="text-sm text-gray-500">{myEntry.user.department}</p>
                        </div>
                      </div>

                      <div className="flex items-center space-x-6">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {myEntry.totalScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">Total Score</div>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {myEntry.tasksCompleted}
                          </div>
                          <div className="text-xs text-gray-500">Tasks</div>
                        </div>

                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-900">
                            {myEntry.averageScore.toFixed(1)}
                          </div>
                          <div className="text-xs text-gray-500">Avg Score</div>
                        </div>

                        <div>
                          <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getPerformanceColor(myEntry.performanceLevel)}`}>
                            {myEntry.performanceLevel}
                          </span>
                        </div>
                      </div>
                    </div>

                    {myEntry.badges.length > 0 && (
                      <div className="mt-3 flex items-center space-x-2">
                        <span className="text-sm text-gray-500">Badges:</span>
                        <div className="flex space-x-1">
                          {myEntry.badges.map((badge, index) => (
                            <span key={index} className="text-lg">{badge}</span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leaderboard data</h3>
            <p className="text-gray-500">Leaderboard will be available once rankings are generated.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default CompanyLeaderboard;