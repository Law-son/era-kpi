import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Megaphone, Pin, Calendar } from 'lucide-react';
import { announcementsApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Announcement {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    name: string;
  };
  priority: string;
  isPinned: boolean;
  isActive: boolean;
  expiresAt?: string;
  createdAt: string;
}

const Announcements: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAnnouncement, setEditingAnnouncement] = useState<Announcement | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    priority: 'medium',
    isPinned: false,
    expiresAt: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      // For admin users, get all announcements for their company
      const response = await announcementsApi.getAll(user?.company);
      setAnnouncements(response.data);
    } catch (error) {
      toast.error('Failed to fetch announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const announcementData = {
        ...formData,
        company: user?.company,
        author: user?.id,
        expiresAt: formData.expiresAt || undefined,
      };
      console.log('announcementData:', announcementData); // Debug log

      if (editingAnnouncement) {
        await announcementsApi.update(editingAnnouncement._id, announcementData);
        toast.success('Announcement updated successfully');
      } else {
        await announcementsApi.create(announcementData);
        toast.success('Announcement created successfully');
      }
      
      setShowForm(false);
      setEditingAnnouncement(null);
      setFormData({ title: '', content: '', priority: 'medium', isPinned: false, expiresAt: '' });
      fetchAnnouncements();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingAnnouncement(announcement);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      priority: announcement.priority,
      isPinned: announcement.isPinned,
      expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this announcement?')) {
      try {
        await announcementsApi.delete(id);
        toast.success('Announcement deleted successfully');
        fetchAnnouncements();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete announcement');
      }
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-danger-100 text-danger-800 border-danger-200';
      case 'high': return 'bg-warning-100 text-warning-800 border-warning-200';
      case 'medium': return 'bg-primary-100 text-primary-800 border-primary-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

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
        <h2 className="text-2xl font-bold text-gray-900">Announcements</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Create Announcement</span>
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingAnnouncement ? 'Edit Announcement' : 'Create New Announcement'}
            </h3>
            
            <div>
              <label className="form-label">Title</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="form-input"
                required
              />
            </div>

            <div>
              <label className="form-label">Content</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="form-input"
                rows={4}
                required
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="form-label">Priority</label>
                <select
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  className="form-input"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              <div>
                <label className="form-label">Expires On (Optional)</label>
                <input
                  type="date"
                  value={formData.expiresAt}
                  onChange={(e) => setFormData({ ...formData, expiresAt: e.target.value })}
                  className="form-input"
                />
              </div>

              <div className="flex items-center space-x-2 pt-6">
                <input
                  type="checkbox"
                  id="isPinned"
                  checked={formData.isPinned}
                  onChange={(e) => setFormData({ ...formData, isPinned: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <label htmlFor="isPinned" className="text-sm font-medium text-gray-700">
                  Pin announcement
                </label>
              </div>
            </div>

            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">
                {editingAnnouncement ? 'Update' : 'Create'} Announcement
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAnnouncement(null);
                  setFormData({ title: '', content: '', priority: 'medium', isPinned: false, expiresAt: '' });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="space-y-4">
        {announcements
          .sort((a, b) => {
            if (a.isPinned && !b.isPinned) return -1;
            if (!a.isPinned && b.isPinned) return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          })
          .map((announcement) => (
            <div
              key={announcement._id}
              className={`card ${announcement.isPinned ? 'border-l-4 border-l-primary-500' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <Megaphone className="h-5 w-5 text-primary-600" />
                    <h3 className="font-semibold text-gray-900">{announcement.title}</h3>
                    {announcement.isPinned && (
                      <Pin className="h-4 w-4 text-primary-600" />
                    )}
                    <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(announcement.priority)}`}>
                      {announcement.priority}
                    </span>
                  </div>
                  
                  <p className="text-gray-600 mb-3">{announcement.content}</p>
                  
                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <div className="flex items-center space-x-1">
                      <Calendar className="h-4 w-4" />
                      <span>Created: {new Date(announcement.createdAt).toLocaleDateString()}</span>
                    </div>
                    {announcement.expiresAt && (
                      <div className="flex items-center space-x-1">
                        <Calendar className="h-4 w-4" />
                        <span>Expires: {new Date(announcement.expiresAt).toLocaleDateString()}</span>
                      </div>
                    )}
                    <span>By: {announcement.author.name}</span>
                  </div>
                </div>
                
                <div className="flex space-x-2 ml-4">
                  <button
                    onClick={() => handleEdit(announcement)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(announcement._id)}
                    className="text-gray-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
      </div>

      {announcements.length === 0 && (
        <div className="text-center py-12">
          <Megaphone className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No announcements found</h3>
          <p className="text-gray-500">Create your first announcement to get started.</p>
        </div>
      )}
    </div>
  );
};

export default Announcements;