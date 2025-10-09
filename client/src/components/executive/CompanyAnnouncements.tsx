import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { announcementsApi } from '../../services/api';
import { Megaphone, Calendar, AlertCircle, Pin, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  isPinned: boolean;
  createdAt: string;
  author: {
    name: string;
  };
  company: {
    _id: string;
    name: string;
  };
}

const CompanyAnnouncements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching announcements for user:', user);
      
      if (user?.company) {
        // Pass the company ID directly to the API
        console.log('Fetching announcements for company:', user.company);
        const response = await announcementsApi.getAll(user.company);
        console.log('Announcements response:', response.data);
        setAnnouncements(response.data);
      } else {
        const errorMsg = 'No company assigned to user';
        setError(errorMsg);
        toast.error(errorMsg);
        console.error('User has no company assigned:', user);
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch announcements';
      setError(errorMessage);
      toast.error(errorMessage);
      console.error('Error fetching announcements:', err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const announcementDate = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - announcementDate.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    
    return announcementDate.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Megaphone className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Company Announcements</h2>
        </div>
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center space-x-3 mb-6">
          <Megaphone className="h-6 w-6 text-blue-600" />
          <h2 className="text-xl font-semibold text-gray-900">Company Announcements</h2>
        </div>
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <p className="text-gray-600">{error}</p>
            <button
              onClick={fetchAnnouncements}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <Megaphone className="h-6 w-6 text-blue-600" />
        <h2 className="text-xl font-semibold text-gray-900">Company Announcements</h2>
      </div>

      {announcements.length === 0 ? (
        <div className="text-center py-8">
          <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">No announcements available</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Pinned Announcements Section */}
          {announcements.filter(ann => ann.isPinned).length > 0 && (
            <div className="mb-6">
              <div className="flex items-center space-x-2 mb-4">
                <Pin className="h-5 w-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Pinned Announcements</h3>
              </div>
              <div className="space-y-4">
                {announcements
                  .filter(ann => ann.isPinned)
                  .map((announcement) => (
                    <div
                      key={announcement._id}
                      className="border-2 border-blue-200 bg-blue-50 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <Pin className="h-4 w-4 text-blue-600" />
                          <h3 className="text-lg font-medium text-gray-900">
                            {announcement.title}
                          </h3>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-100 text-blue-800 border border-blue-200">
                            PINNED
                          </span>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
                              announcement.priority
                            )}`}
                          >
                            {announcement.priority.toUpperCase()}
                          </span>
                        </div>
                      </div>
                      
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {announcement.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{getTimeAgo(announcement.createdAt)}</span>
                        </div>
                        <span>By {announcement.author.name}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Regular Announcements Section */}
          {announcements.filter(ann => !ann.isPinned).length > 0 && (
            <div>
              {announcements.filter(ann => ann.isPinned).length > 0 && (
                <div className="flex items-center space-x-2 mb-4">
                  <Megaphone className="h-5 w-5 text-gray-600" />
                  <h3 className="text-lg font-semibold text-gray-900">Recent Announcements</h3>
                </div>
              )}
              <div className="space-y-4">
                {announcements
                  .filter(ann => !ann.isPinned)
                  .map((announcement) => (
                    <div
                      key={announcement._id}
                      className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-lg font-medium text-gray-900">
                          {announcement.title}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full border ${getPriorityColor(
                            announcement.priority
                          )}`}
                        >
                          {announcement.priority.toUpperCase()}
                        </span>
                      </div>
                      
                      <p className="text-gray-700 mb-4 leading-relaxed">
                        {announcement.content}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm text-gray-500">
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4" />
                          <span>{getTimeAgo(announcement.createdAt)}</span>
                        </div>
                        <span>By {announcement.author.name}</span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyAnnouncements;