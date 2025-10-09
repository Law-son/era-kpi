import React, { useState, useEffect } from 'react';
import { Building2, Users, CheckSquare, TrendingUp, Award, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { kpiApi } from '../../services/api';
import toast from 'react-hot-toast';

interface OverallStats {
  totalCompanies: number;
  totalAdmins: number;
  totalExecutives: number;
  totalTasks: number;
  completedTasks: number;
  averageScore: number;
  companyPerformance: Array<{
    company: string;
    averageScore: number;
    executiveCount: number;
    tasksCompleted: number;
  }>;
  monthlyTrends: Array<{
    month: string;
    averageScore: number;
    tasksCompleted: number;
    newExecutives: number;
  }>;
  performanceDistribution: Array<{
    level: string;
    count: number;
  }>;
  topPerformingCompanies: Array<{
    company: string;
    score: number;
  }>;
}

const OverallStats: React.FC = () => {
  const [stats, setStats] = useState<OverallStats>({
    totalCompanies: 0,
    totalAdmins: 0,
    totalExecutives: 0,
    totalTasks: 0,
    completedTasks: 0,
    averageScore: 0,
    companyPerformance: [],
    monthlyTrends: [],
    performanceDistribution: [],
    topPerformingCompanies: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverallStats();
  }, []);

  const fetchOverallStats = async () => {
    try {
      const response = await kpiApi.getOverallStats();
      setStats(response.data);
    } catch (error) {
      toast.error('Failed to fetch overall statistics');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#22c55e', '#f59e0b', '#ef4444'];

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
        <h3 className="text-lg font-medium text-gray-900 mb-2">No statistics available</h3>
        <p className="text-gray-500">Statistics will appear once you have companies and users.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Overall System Statistics</h2>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="bg-primary-100 p-3 rounded-lg">
              <Building2 className="h-6 w-6 text-primary-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Companies</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalCompanies}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-success-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-success-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Executives</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalExecutives}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-warning-100 p-3 rounded-lg">
              <CheckSquare className="h-6 w-6 text-warning-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Tasks</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.completedTasks}/{stats.totalTasks}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-purple-100 p-3 rounded-lg">
              <TrendingUp className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">System Average</p>
              <p className="text-2xl font-semibold text-gray-900">{(stats.averageScore ?? 0).toFixed(1)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center">
            <div className="bg-indigo-100 p-3 rounded-lg">
              <Users className="h-6 w-6 text-indigo-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Admins</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalAdmins}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center">
            <div className="bg-green-100 p-3 rounded-lg">
              <Award className="h-6 w-6 text-green-600" />
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
            <div className="bg-orange-100 p-3 rounded-lg">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Avg Tasks/Executive</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalExecutives > 0 ? Math.round(stats.totalTasks / stats.totalExecutives) : 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Performance */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Performance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.companyPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="company" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="averageScore" fill="#0284c7" name="Average Score" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Trends */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Performance Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="averageScore" 
                stroke="#0284c7" 
                strokeWidth={2}
                name="Average Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Performance Distribution */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.performanceDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ level, count }) => `${level}: ${count}`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {(stats.performanceDistribution ?? []).map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Task Completion by Company */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Task Completion by Company</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.companyPerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="company" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="tasksCompleted" fill="#22c55e" name="Tasks Completed" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Performance Table */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Performance Details</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Executives
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Avg Score
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tasks
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {(stats.companyPerformance ?? []).map((company, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {company.company}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.executiveCount}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.averageScore.toFixed(1)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {company.tasksCompleted}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Top Performing Companies */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Performing Companies</h3>
          <div className="space-y-3">
            {(stats.topPerformingCompanies ?? []).map((company, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary-100">
                    <span className="text-sm font-bold text-primary-600">#{index + 1}</span>
                  </div>
                  <span className="font-medium text-gray-900">{company.company}</span>
                </div>
                <span className="text-lg font-bold text-primary-600">{company.score.toFixed(1)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* System Health Indicators */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health Indicators</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className={`p-4 rounded-lg mb-3 ${
              stats.averageScore >= 7.5 ? 'bg-success-100' : 
              stats.averageScore >= 6.0 ? 'bg-warning-100' : 'bg-danger-100'
            }`}>
              <div className={`text-2xl font-bold ${
                stats.averageScore >= 7.5 ? 'text-success-600' : 
                stats.averageScore >= 6.0 ? 'text-warning-600' : 'text-danger-600'
              }`}>
                {stats.averageScore >= 7.5 ? '🟢' : stats.averageScore >= 6.0 ? '🟡' : '🔴'}
              </div>
            </div>
            <h4 className="font-semibold text-gray-900">Overall Performance</h4>
            <p className="text-sm text-gray-500">
              {stats.averageScore >= 7.5 ? 'Excellent' : 
               stats.averageScore >= 6.0 ? 'Satisfactory' : 'Needs Improvement'}
            </p>
          </div>

          <div className="text-center">
            <div className={`p-4 rounded-lg mb-3 ${
              (stats.completedTasks / stats.totalTasks) >= 0.8 ? 'bg-success-100' : 
              (stats.completedTasks / stats.totalTasks) >= 0.6 ? 'bg-warning-100' : 'bg-danger-100'
            }`}>
              <div className={`text-2xl font-bold ${
                (stats.completedTasks / stats.totalTasks) >= 0.8 ? 'text-success-600' : 
                (stats.completedTasks / stats.totalTasks) >= 0.6 ? 'text-warning-600' : 'text-danger-600'
              }`}>
                {Math.round((stats.completedTasks / stats.totalTasks) * 100)}%
              </div>
            </div>
            <h4 className="font-semibold text-gray-900">Task Completion</h4>
            <p className="text-sm text-gray-500">
              {(stats.completedTasks / stats.totalTasks) >= 0.8 ? 'High' : 
               (stats.completedTasks / stats.totalTasks) >= 0.6 ? 'Moderate' : 'Low'} completion rate
            </p>
          </div>

          <div className="text-center">
            <div className={`p-4 rounded-lg mb-3 ${
              stats.totalCompanies >= 5 ? 'bg-success-100' : 
              stats.totalCompanies >= 2 ? 'bg-warning-100' : 'bg-primary-100'
            }`}>
              <div className={`text-2xl font-bold ${
                stats.totalCompanies >= 5 ? 'text-success-600' : 
                stats.totalCompanies >= 2 ? 'text-warning-600' : 'text-primary-600'
              }`}>
                {stats.totalCompanies}
              </div>
            </div>
            <h4 className="font-semibold text-gray-900">Platform Growth</h4>
            <p className="text-sm text-gray-500">
              {stats.totalCompanies >= 5 ? 'Scaling well' : 
               stats.totalCompanies >= 2 ? 'Growing' : 'Getting started'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverallStats;