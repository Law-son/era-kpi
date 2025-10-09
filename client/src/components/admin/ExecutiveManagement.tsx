import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Mail, Phone, Building } from 'lucide-react';
import { usersApi, companiesApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Executive {
  _id: string;
  name: string;
  email: string;
  department: string;
  phoneNumber: string;
  company: {
    _id: string;
    name: string;
  };
  createdAt: string;
  isActive: boolean;
}

const ExecutiveManagement: React.FC = () => {
  const [executives, setExecutives] = useState<Executive[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingExecutive, setEditingExecutive] = useState<Executive | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    phoneNumber: '',
    password: '',
  });
  const { user } = useAuth();

  useEffect(() => {
    fetchExecutives();
  }, [user?.company]);

  const fetchExecutives = async () => {
    try {
      if (user?.role === 'admin' && user.company) {
        const response = await usersApi.getByCompany(String(user.company));
        setExecutives(response.data.filter((u: any) => u.role === 'executive'));
      }
    } catch (error) {
      toast.error('Failed to fetch executives');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const executiveData = {
        ...formData,
        role: 'executive',
        company: user?.company,
      };

      if (editingExecutive) {
        await usersApi.update(editingExecutive._id, executiveData);
        toast.success('Executive updated successfully');
      } else {
        await usersApi.create(executiveData);
        toast.success('Executive created successfully');
      }
      
      setShowForm(false);
      setEditingExecutive(null);
      setFormData({ name: '', email: '', department: '', phoneNumber: '', password: '' });
      fetchExecutives();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (executive: Executive) => {
    setEditingExecutive(executive);
    setFormData({
      name: executive.name,
      email: executive.email,
      department: executive.department,
      phoneNumber: executive.phoneNumber,
      password: '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this executive?')) {
      try {
        await usersApi.delete(id);
        toast.success('Executive deleted successfully');
        fetchExecutives();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete executive');
      }
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
        <h2 className="text-2xl font-bold text-gray-900">Executive Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Executive</span>
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingExecutive ? 'Edit Executive' : 'Add New Executive'}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="form-label">Full Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Department</label>
                <input
                  type="text"
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              <div>
                <label className="form-label">Phone Number</label>
                <input
                  type="tel"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  className="form-input"
                  required
                />
              </div>

              {!editingExecutive && (
                <div className="md:col-span-2">
                  <label className="form-label">Temporary Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="form-input"
                    placeholder="Executive will be required to change this"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">
                {editingExecutive ? 'Update' : 'Create'} Executive
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingExecutive(null);
                  setFormData({ name: '', email: '', department: '', phoneNumber: '', password: '' });
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {executives.map((executive) => (
          <div key={executive._id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{executive.name}</h3>
                  <p className="text-sm text-gray-500">{executive.department}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(executive)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(executive._id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{executive.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{executive.phoneNumber}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Building className="h-4 w-4" />
                <span>{executive.company.name}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <span className={`text-xs px-2 py-1 rounded-full ${
                executive.isActive 
                  ? 'bg-success-100 text-success-800' 
                  : 'bg-danger-100 text-danger-800'
              }`}>
                {executive.isActive ? 'Active' : 'Inactive'}
              </span>
              <div className="text-xs text-gray-400">
                {new Date(executive.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {executives.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No executives found</h3>
          <p className="text-gray-500">Get started by adding your first executive.</p>
        </div>
      )}
    </div>
  );
};

export default ExecutiveManagement;