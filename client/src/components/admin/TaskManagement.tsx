import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, CheckSquare, Clock, User } from 'lucide-react';
import { tasksApi, usersApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Task {
  _id: string;
  title: string;
  description: string;
  assignedTo?: {
    _id: string;
    name: string;
    email: string;
  };
  deadline: string;
  status: string;
  priority: string;
  createdAt: string;
  submission?: {
    content: string;
    submittedAt: string;
  };
  scoring?: {
    qualityScore: number;
    timeScore: number;
    initiativeScore: number;
    totalScore: number;
    feedback: string;
  };
  comments?: Array<{
    author: { _id: string; name: string; role: string };
    role: string;
    text: string;
    createdAt: string;
  }>;
  reportLink?: string;
}

interface Executive {
  _id: string;
  name: string;
  email: string;
}

const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    assignedTo: '',
    deadline: '',
    priority: 'medium',
    reportLink: '',
  });
  const [grading, setGrading] = useState<Record<string, { quality: number; initiative: number; feedback: string; comment: string }>>({});
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
    fetchExecutives();
  }, [user?.company]);

  const fetchTasks = async () => {
    try {
      const response = await tasksApi.getAll(user?.role === 'admin' && user?.company ? String(user.company) : undefined);
      setTasks(response.data || []);
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutives = async () => {
    try {
      if (user?.company) {
        const response = await usersApi.getByCompany(String(user.company));
        const executiveUsers = response.data?.filter((u: any) => u.role === 'executive') || [];
        setExecutives(executiveUsers);
      } else {
        setExecutives([]);
      }
    } catch (error) {
      toast.error('Failed to fetch executives');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (!formData.reportLink.trim()) {
        toast.error('Report link is required');
        return;
      }
      const taskData = {
        ...formData,
        company: user?.company,
        // assignedBy will be set by the backend from the authenticated user
      };

      if (editingTask) {
        await tasksApi.update(editingTask._id, taskData);
        toast.success('Task updated successfully');
      } else {
        await tasksApi.create(taskData);
        toast.success('Task created successfully');
      }
      
      setShowForm(false);
      setEditingTask(null);
      setFormData({ title: '', description: '', assignedTo: '', deadline: '', priority: 'medium', reportLink: '' });
      fetchTasks();
    } catch (error: any) {
      console.error('Task creation/update error:', error);
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setFormData({
      title: task.title,
      description: task.description,
      assignedTo: task.assignedTo?._id || '',
      deadline: new Date(task.deadline).toISOString().split('T')[0],
      priority: task.priority,
      reportLink: task.reportLink || '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await tasksApi.delete(id);
        toast.success('Task deleted successfully');
        fetchTasks();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete task');
      }
    }
  };

  const gradeAndScore = async (task: Task) => {
    const entry = grading[task._id];
    if (!entry) {
      toast.error('Please enter scores and feedback');
      return;
    }
    const { quality, initiative, feedback, comment } = entry;
    if (quality == null || initiative == null || feedback.trim().length === 0) {
      toast.error('Quality, initiative, and feedback are required');
      return;
    }
    try {
      await tasksApi.score(task._id, {
        qualityScore: Number(quality),
        initiativeScore: Number(initiative),
        feedback,
        comment,
      });
      toast.success('Task scored successfully');
      setGrading((prev) => ({ ...prev, [task._id]: { quality: 0, initiative: 0, feedback: '', comment: '' } }));
      fetchTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to score task');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'submitted': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in-progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const pendingTasks = tasks.filter(task => task.status === 'submitted' && !task.scoring);
  const completedTasks = tasks.filter(task => task.status === 'completed' && task.scoring);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Task Management</h2>
          <div className="flex space-x-4 mt-2 text-sm text-gray-600">
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
              <span>{pendingTasks.length} Pending Review</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>{completedTasks.length} Completed</span>
            </span>
            <span className="flex items-center space-x-1">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>{tasks.length} Total Tasks</span>
            </span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Task</span>
        </button>
      </div>

      {pendingTasks.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
            <h3 className="font-semibold text-orange-800">📋 {pendingTasks.length} Task{pendingTasks.length > 1 ? 's' : ''} Awaiting Review</h3>
          </div>
          <p className="text-sm text-orange-700 mt-1">
            Review and score submitted tasks to complete the evaluation process.
          </p>
        </div>
      )}

      

      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingTask ? 'Edit Task' : 'Create New Task'}
            </h3>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                rows={3}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Report Link (Google Form or any link)</label>
              <input
                type="url"
                value={formData.reportLink}
                onChange={(e) => setFormData({ ...formData, reportLink: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://..."
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Assign To</label>
                <select
                  value={formData.assignedTo}
                  onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                >
                  <option value="">Select Executive</option>
                  {executives.length === 0 ? (
                    <option value="" disabled>No executives found in your company</option>
                  ) : (
                    executives.map((exec) => (
                      <option key={exec._id} value={exec._id}>
                        {exec.name}
                      </option>
                    ))
                  )}
                </select>
                {executives.length === 0 && (
                  <p className="text-sm text-red-600 mt-1">
                    No executives found. Make sure executives are added to your company.
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-2">
              <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                {editingTask ? 'Update' : 'Create'} Task
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingTask(null);
                  setFormData({ title: '', description: '', assignedTo: '', deadline: '', priority: 'medium', reportLink: '' });
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {tasks.map((task) => {
          return (
          <div key={task._id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <CheckSquare className="h-5 w-5 text-blue-600" />
                  <h3 className="font-semibold text-gray-900">{task.title}</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(task.status)}`}>
                    {task.status}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getPriorityColor(task.priority)}`}>
                    {task.priority}
                  </span>
                </div>
                
                <p className="text-gray-600 mb-3">{task.description}</p>

                {task.reportLink && (
                  <div className="mb-3">
                    <a href={task.reportLink} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open Report Link</a>
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <User className="h-4 w-4" />
                    <span>{task.assignedTo?.name || 'Unknown User'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                  </div>
                </div>

                {task.submission && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">Submission</h4>
                    <p className="text-sm text-gray-600">{task.submission.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {new Date(task.submission.submittedAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {task.scoring && (
                  <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-3">Performance Score</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div className="text-center p-2 bg-white rounded border">
                        <div className="text-gray-500">Quality</div>
                        <div className="font-bold text-lg text-blue-600">{task.scoring.qualityScore}/10</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded border">
                        <div className="text-gray-500">Time</div>
                        <div className="font-bold text-lg text-green-600">{task.scoring.timeScore}/10</div>
                      </div>
                      <div className="text-center p-2 bg-white rounded border">
                        <div className="text-gray-500">Initiative</div>
                        <div className="font-bold text-lg text-purple-600">{task.scoring.initiativeScore}/10</div>
                      </div>
                      <div className="text-center p-2 bg-blue-100 rounded border border-blue-300">
                        <div className="text-gray-500">Total</div>
                        <div className="font-bold text-xl text-blue-800">{task.scoring.totalScore}/10</div>
                      </div>
                    </div>
                    {task.scoring.feedback && (
                      <div className="mt-3">
                        <div className="text-sm font-medium text-gray-700">Feedback:</div>
                        <p className="text-sm text-gray-600 mt-1 p-2 bg-white rounded border">{task.scoring.feedback}</p>
                      </div>
                    )}
                  </div>
                )}

                {task.status === 'submitted' && !task.scoring && (
                  <div className="mt-4 p-6 border-2 border-orange-200 bg-orange-50 rounded-lg shadow-lg">
                    <div className="flex items-center space-x-2 mb-4">
                      <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                      <h4 className="font-semibold text-gray-900 text-lg">🎯 Ready for Scoring</h4>
                      <span className="px-3 py-1 bg-orange-200 text-orange-800 text-sm font-medium rounded-full animate-pulse">Pending Review</span>
                    </div>
                    <div className="mb-4 p-3 bg-white rounded-lg border border-orange-200">
                      <p className="text-sm text-gray-700">
                        <strong>Task submitted by {task.assignedTo?.name || 'Unknown User'}</strong> - Please review the submission and provide scores based on the established criteria.
                      </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Quality Score (0-10)
                            <span className="text-gray-500 ml-1">- Work quality and accuracy</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={grading[task._id]?.quality ?? ''}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              if (value >= 0 && value <= 10) {
                                setGrading({
                                  ...grading,
                                  [task._id]: {
                                    quality: value,
                                    initiative: grading[task._id]?.initiative ?? 0,
                                    feedback: grading[task._id]?.feedback ?? '',
                                    comment: grading[task._id]?.comment ?? '',
                                  },
                                });
                              } else if (e.target.value !== '') {
                                toast.error('Quality score must be between 0 and 10');
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="8.5"
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Initiative Score (0-10)
                            <span className="text-gray-500 ml-1">- Proactivity and innovation</span>
                          </label>
                          <input
                            type="number"
                            min={0}
                            max={10}
                            step={0.1}
                            value={grading[task._id]?.initiative ?? ''}
                            onChange={(e) => {
                              const value = Number(e.target.value);
                              if (value >= 0 && value <= 10) {
                                setGrading({
                                  ...grading,
                                  [task._id]: {
                                    quality: grading[task._id]?.quality ?? 0,
                                    initiative: value,
                                    feedback: grading[task._id]?.feedback ?? '',
                                    comment: grading[task._id]?.comment ?? '',
                                  },
                                });
                              } else if (e.target.value !== '') {
                                toast.error('Initiative score must be between 0 and 10');
                              }
                            }}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="7.0"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Detailed Feedback
                            <span className="text-gray-500 ml-1">- Specific performance feedback</span>
                          </label>
                          <textarea
                            rows={4}
                            value={grading[task._id]?.feedback ?? ''}
                            onChange={(e) => setGrading({
                              ...grading,
                              [task._id]: {
                                quality: grading[task._id]?.quality ?? 0,
                                initiative: grading[task._id]?.initiative ?? 0,
                                feedback: e.target.value,
                                comment: grading[task._id]?.comment ?? '',
                              },
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Provide specific feedback on the task completion..."
                          />
                        </div>
                        
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Additional Comments
                            <span className="text-gray-500 ml-1">- Broader project insights</span>
                          </label>
                          <textarea
                            rows={3}
                            value={grading[task._id]?.comment ?? ''}
                            onChange={(e) => setGrading({
                              ...grading,
                              [task._id]: {
                                quality: grading[task._id]?.quality ?? 0,
                                initiative: grading[task._id]?.initiative ?? 0,
                                feedback: grading[task._id]?.feedback ?? '',
                                comment: e.target.value,
                              },
                            })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="Add any broader-scope remarks or insights..."
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-6 flex items-center justify-between p-4 bg-white rounded-lg border">
                      <div className="text-sm text-gray-600">
                        <div>Time Score will be calculated automatically based on submission timing</div>
                        <div className="font-medium mt-1">Current Total: {
                          (grading[task._id]?.quality || 0) * 0.4 + 
                          (grading[task._id]?.initiative || 0) * 0.2 + 
                          (task.submission ? (new Date(task.submission.submittedAt) <= new Date(task.deadline) ? 10 : 8) : 0) * 0.4
                        }/10</div>
                      </div>
                      <button 
                        className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                        onClick={() => gradeAndScore(task)}
                      >
                        Submit Score
                      </button>
                    </div>
                  </div>
                )}

                {task.comments && task.comments.length > 0 && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">Comments</h4>
                    <div className="space-y-2">
                      {task.comments.map((c, idx) => (
                        <div key={idx} className="text-sm">
                          <span className="font-medium text-gray-800">{c.author?.name || 'Unknown'} ({c.role})</span>
                          <span className="text-gray-500 ml-2">{new Date(c.createdAt).toLocaleString()}</span>
                          <p className="text-gray-700">{c.text}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              <div className="flex space-x-2 ml-4">
                <button
                  onClick={() => handleEdit(task)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(task._id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
          );
        })}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks found</h3>
          <p className="text-gray-500">Create your first task to get started.</p>
        </div>
      )}
    </div>
  );
};

export default TaskManagement;