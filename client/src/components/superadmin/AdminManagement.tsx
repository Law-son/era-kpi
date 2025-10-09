import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, User, Mail, Phone, Building } from 'lucide-react';
import { usersApi, companiesApi } from '../../services/api';
import toast from 'react-hot-toast';

interface Admin {
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

interface Company {
  _id: string;
  name: string;
}

const AdminManagement: React.FC = () => {
  const [admins, setAdmins] = useState<Admin[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<Admin | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    department: '',
    phoneNumber: '',
    company: '',
    password: '',
  });

  useEffect(() => {
    fetchAdmins();
    fetchCompanies();
  }, []);

  const fetchAdmins = async () => {
    try {
      const response = await usersApi.getAll();
      setAdmins(response.data.filter((user: any) => user.role === 'admin'));
    } catch (error) {
      toast.error('Failed to fetch admins');
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await companiesApi.getAll();
      setCompanies(response.data);
    } catch (error) {
      toast.error('Failed to fetch companies');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const adminData = {
        ...formData,
        role: 'admin',
      };

      if (editingAdmin) {
        await usersApi.update(editingAdmin._id, adminData);
        toast.success('Admin updated successfully');
      } else {
        await usersApi.create(adminData);
        toast.success('Admin created successfully');
      }
      
      setShowForm(false);
      setEditingAdmin(null);
      setFormData({ name: '', email: '', department: '', phoneNumber: '', company: '', password: '' });
      fetchAdmins();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Operation failed');
    }
  };

  const handleEdit = (admin: Admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      department: admin.department,
      phoneNumber: admin.phoneNumber,
      company: admin.company._id,
      password: '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this admin?')) {
      try {
        await usersApi.delete(id);
        toast.success('Admin deleted successfully');
        fetchAdmins();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Failed to delete admin');
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
        <h2 className="text-2xl font-bold text-gray-900">Admin Management</h2>
        <button
          onClick={() => setShowForm(true)}
          className="btn-primary flex items-center space-x-2"
        >
          <Plus className="h-4 w-4" />
          <span>Add Admin</span>
        </button>
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit} className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              {editingAdmin ? 'Edit Admin' : 'Add New Admin'}
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

              <div>
                <label className="form-label">Company</label>
                <select
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="form-input"
                  required
                >
                  <option value="">Select Company</option>
                  {companies.map((company) => (
                    <option key={company._id} value={company._id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>

              {!editingAdmin && (
                <div>
                  <label className="form-label">Temporary Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="form-input"
                    placeholder="Admin will be required to change this"
                    required
                  />
                </div>
              )}
            </div>

            <div className="flex space-x-2">
              <button type="submit" className="btn-primary">
                {editingAdmin ? 'Update' : 'Create'} Admin
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingAdmin(null);
                  setFormData({ name: '', email: '', department: '', phoneNumber: '', company: '', password: '' });
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
        {admins.map((admin) => (
          <div key={admin._id} className="card">
            <div className="flex items-start justify-between">
              <div className="flex items-center space-x-3">
                <div className="bg-primary-100 p-2 rounded-lg">
                  <User className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{admin.name}</h3>
                  <p className="text-sm text-gray-500">{admin.department}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(admin)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(admin._id)}
                  className="text-gray-400 hover:text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Mail className="h-4 w-4" />
                <span>{admin.email}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Phone className="h-4 w-4" />
                <span>{admin.phoneNumber}</span>
              </div>
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Building className="h-4 w-4" />
                <span>{admin.company.name}</span>
              </div>
            </div>
            
            <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-200">
              <span className={`text-xs px-2 py-1 rounded-full ${
                admin.isActive 
                  ? 'bg-success-100 text-success-800' 
                  : 'bg-danger-100 text-danger-800'
              }`}>
                {admin.isActive ? 'Active' : 'Inactive'}
              </span>
              <div className="text-xs text-gray-400">
                {new Date(admin.createdAt).toLocaleDateString()}
              </div>
            </div>
          </div>
        ))}
      </div>

      {admins.length === 0 && (
        <div className="text-center py-12">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No admins found</h3>
          <p className="text-gray-500">Get started by adding your first admin.</p>
        </div>
      )}
    </div>
  );
};

export default AdminManagement;