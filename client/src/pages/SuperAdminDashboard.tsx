import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import CompanyManagement from '../components/superadmin/CompanyManagement';
import AdminManagement from '../components/superadmin/AdminManagement';
import OverallStats from '../components/superadmin/OverallStats';
import { Building2, Users, BarChart3 } from 'lucide-react';

const SuperAdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('companies');

  const navigation = [
    { name: 'Companies', href: 'companies', icon: Building2, current: activeTab === 'companies' },
    { name: 'Admins', href: 'admins', icon: Users, current: activeTab === 'admins' },
    { name: 'Overall Stats', href: 'stats', icon: BarChart3, current: activeTab === 'stats' },
  ];

  return (
    <Layout title="Super Admin Dashboard" navigation={navigation} onTabChange={setActiveTab}>
      <Routes>
        <Route index element={<CompanyManagement />} />
        <Route path="companies" element={<CompanyManagement />} />
        <Route path="admins" element={<AdminManagement />} />
        <Route path="stats" element={<OverallStats />} />
      </Routes>
    </Layout>
  );
};

export default SuperAdminDashboard;