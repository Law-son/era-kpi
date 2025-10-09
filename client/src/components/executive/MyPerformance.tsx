import React, { useState, useEffect } from 'react';
import { TrendingUp, Award, Target, Calendar } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { kpiApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface PerformanceStats {
  totalTasks: number;
  completedTasks: number;
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

const MyPerformance: React.FC = () => {
  const [stats, setStats] = useState<PerformanceStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchPerformanceStats();
  }, []);

  const fetchPerformanceStats = async () => {
    try {
      if (user?.id) {
        const response = await kpiApi.getExecutiveStats(user.id);
        setStats(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch performance statistics');
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

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No performance data available</h3>
        <p className="text-gray-500">Complete some tasks to see your performance statistics.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Performance</h2>

      {/* Performance Overview */}
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

      {/* Performance Level */}
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

      {/* Charts */}
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

      {/* Detailed Metrics */}
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

      {/* Monthly Tasks Completion */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Task Completion</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={stats.monthlyScores}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="tasksCompleted" fill="#22c55e" name="Tasks Completed" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default MyPerformance;