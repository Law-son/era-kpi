import React, { useState, useEffect } from 'react';
import { CheckSquare, Clock, FileText, Send, Calendar, Link as LinkIcon } from 'lucide-react';
import { tasksApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Task {
  _id: string;
  title: string;
  description: string;
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
  reportLink?: string;
}

const MyTasks: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [submissionContent, setSubmissionContent] = useState('');
  const [submittingTaskId, setSubmittingTaskId] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      if (user?.id) {
        // Use the user-specific endpoint for executives
        const response = await tasksApi.getByUser(user.id);
        console.log('Fetched tasks for executive:', response.data);
        setTasks(response.data);
      }
    } catch (error) {
      toast.error('Failed to fetch tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitTask = async (taskId: string) => {
    if (!submissionContent.trim()) {
      toast.error('Please provide submission content');
      return;
    }

    try {
      await tasksApi.submit(taskId, { content: submissionContent });
      toast.success('Task submitted successfully');
      setSubmissionContent('');
      setSubmittingTaskId(null);
      fetchTasks();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to submit task');
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

  const isOverdue = (deadline: string) => {
    return new Date(deadline) < new Date() && !['completed', 'submitted'].includes(tasks.find(t => t.deadline === deadline)?.status || '');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Tasks</h2>

      {/* Task Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 p-2 rounded-lg">
              <CheckSquare className="h-5 w-5 text-blue-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Tasks</p>
              <p className="text-xl font-semibold text-gray-900">{tasks.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-green-100 p-2 rounded-lg">
              <CheckSquare className="h-5 w-5 text-green-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Completed</p>
              <p className="text-xl font-semibold text-gray-900">
                {tasks.filter(t => t.status === 'completed').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-yellow-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Pending</p>
              <p className="text-xl font-semibold text-gray-900">
                {tasks.filter(t => ['pending', 'in-progress'].includes(t.status)).length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="bg-red-100 p-2 rounded-lg">
              <Clock className="h-5 w-5 text-red-600" />
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Overdue</p>
              <p className="text-xl font-semibold text-gray-900">
                {tasks.filter(t => isOverdue(t.deadline)).length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="space-y-4">
        {tasks.map((task) => (
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
                  {isOverdue(task.deadline) && (
                    <span className="text-xs px-2 py-1 rounded-full bg-danger-100 text-danger-800">
                      OVERDUE
                    </span>
                  )}
                </div>
                
                <p className="text-gray-600 mb-3">{task.description}</p>

                {task.reportLink && (
                  <div className="mb-3 flex items-center space-x-2">
                    <LinkIcon className="h-4 w-4 text-blue-600" />
                    <a href={task.reportLink} target="_blank" rel="noreferrer" className="text-blue-600 underline">Open Report Link</a>
                  </div>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-gray-500 mb-3">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-4 w-4" />
                    <span>Due: {new Date(task.deadline).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Clock className="h-4 w-4" />
                    <span>Created: {new Date(task.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Submission Section */}
                {task.submission ? (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-1">My Submission</h4>
                    <p className="text-sm text-gray-600">{task.submission.content}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      Submitted: {new Date(task.submission.submittedAt).toLocaleString()}
                    </p>
                  </div>
                ) : (
                  ['pending', 'in-progress'].includes(task.status) && (
                    <div className="mt-3">
                      {submittingTaskId === task._id ? (
                        <div className="space-y-3">
                          <textarea
                            value={submissionContent}
                            onChange={(e) => setSubmissionContent(e.target.value)}
                            placeholder="Enter your task submission..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            rows={4}
                          />
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleSubmitTask(task._id)}
                              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                            >
                              <Send className="h-4 w-4" />
                              <span>Submit Task</span>
                            </button>
                            <button
                              onClick={() => {
                                setSubmittingTaskId(null);
                                setSubmissionContent('');
                              }}
                              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setSubmittingTaskId(task._id)}
                          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                        >
                          <FileText className="h-4 w-4" />
                          <span>Submit Task</span>
                        </button>
                      )}
                    </div>
                  )
                )}

                {/* Scoring Section */}
                {task.scoring && (
                  <div className="mt-3 p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-gray-900 mb-3">Performance Score</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
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
              </div>
            </div>
          </div>
        ))}
      </div>

      {tasks.length === 0 && (
        <div className="text-center py-12">
          <CheckSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No tasks assigned</h3>
          <p className="text-gray-500">Tasks will appear here when assigned by your admin.</p>
        </div>
      )}
    </div>
  );
};

export default MyTasks;