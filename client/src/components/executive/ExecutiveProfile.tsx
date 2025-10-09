import React, { useState, useEffect } from 'react';
import { User, Mail, Phone, Building, Calendar, Award, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { authApi, badgesApi } from '../../services/api';
import toast from 'react-hot-toast';

interface UserBadge {
  _id: string;
  badge: {
    name: string;
    description: string;
    icon: string;
  };
  awardedAt: string;
  reason?: string;
}

const ExecutiveProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [badges, setBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user?.id) {
      fetchUserBadges();
    }
  }, [user?.id]);

  const fetchUserBadges = async () => {
    try {
      if (user?.id) {
        const response = await badgesApi.getUserBadges(user.id);
        setBadges(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch badges');
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    if (passwordData.newPassword.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }

    try {
      setLoading(true);
      await authApi.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      
      toast.success('Password changed successfully');
      setShowPasswordForm(false);
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      updateUser({ mustChangePassword: false });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">My Profile</h2>

      {user.mustChangePassword && (
        <div className="bg-warning-50 border border-warning-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Edit className="h-5 w-5 text-warning-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-warning-800">
                Password Change Required
              </h3>
              <div className="mt-2 text-sm text-warning-700">
                <p>You must change your password before continuing to use the system.</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => setShowPasswordForm(true)}
                  className="btn-warning text-sm"
                >
                  Change Password Now
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="card">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Profile Information</h3>
              <button
                onClick={() => setShowPasswordForm(true)}
                className="btn-secondary flex items-center space-x-2"
              >
                <Edit className="h-4 w-4" />
                <span>Change Password</span>
              </button>
            </div>

            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Full Name</p>
                  <p className="font-medium text-gray-900">{user.name}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <Mail className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Email Address</p>
                  <p className="font-medium text-gray-900">{user.email}</p>
                </div>
              </div>

              {user.phoneNumber && (
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <Phone className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone Number</p>
                    <p className="font-medium text-gray-900">{user.phoneNumber}</p>
                  </div>
                </div>
              )}

              {user.department && (
                <div className="flex items-center space-x-3">
                  <div className="bg-primary-100 p-2 rounded-lg">
                    <Building className="h-5 w-5 text-primary-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Department</p>
                    <p className="font-medium text-gray-900">{user.department}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <Building className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Company</p>
                  <p className="font-medium text-gray-900">{user.company}</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <Calendar className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Role</p>
                  <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-primary-100 text-primary-800">
                    {user.role}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">My Badges</h3>
          
          {badges.length > 0 ? (
            <div className="space-y-3">
              {badges.map((userBadge) => (
                <div key={userBadge._id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                  <div className="text-2xl">{userBadge.badge.icon}</div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{userBadge.badge.name}</h4>
                    <p className="text-sm text-gray-500">{userBadge.badge.description}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Earned: {new Date(userBadge.awardedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">No badges earned yet</p>
              <p className="text-sm text-gray-400">Complete tasks to earn badges!</p>
            </div>
          )}
        </div>
      </div>

      {/* Password Change Modal */}
      {showPasswordForm && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
              
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="form-label">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="form-input"
                    required
                  />
                </div>

                <div>
                  <label className="form-label">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="form-input"
                    minLength={8}
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="form-input"
                    minLength={8}
                    required
                  />
                </div>

                <div className="flex space-x-2 pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn-primary disabled:opacity-50"
                  >
                    {loading ? 'Changing...' : 'Change Password'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
                    }}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ExecutiveProfile;