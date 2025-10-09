import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import ExecutiveManagement from '../components/admin/ExecutiveManagement';
import TaskManagement from '../components/admin/TaskManagement';
import Leaderboards from '../components/admin/Leaderboards';
import Announcements from '../components/admin/Announcements';
import CompanyStats from '../components/admin/CompanyStats';
import Security from '../components/admin/Security';
import { Users, CheckSquare, Trophy, Megaphone, BarChart3, Shield } from 'lucide-react';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('executives');

  const navigation = [
    { name: 'Executives', href: 'executives', icon: Users, current: activeTab === 'executives' },
    { name: 'Tasks', href: 'tasks', icon: CheckSquare, current: activeTab === 'tasks' },
    { name: 'Leaderboards', href: 'leaderboards', icon: Trophy, current: activeTab === 'leaderboards' },
    { name: 'Announcements', href: 'announcements', icon: Megaphone, current: activeTab === 'announcements' },
    { name: 'Company Stats', href: 'stats', icon: BarChart3, current: activeTab === 'stats' },
    { name: 'Security', href: 'security', icon: Shield, current: activeTab === 'security' },
  ];

  return (
    <Layout title="Admin Dashboard" navigation={navigation} onTabChange={setActiveTab}>
      <Routes>
        <Route index element={<ExecutiveManagement />} />
        <Route path="executives" element={<ExecutiveManagement />} />
        <Route path="tasks" element={<TaskManagement />} />
        <Route path="leaderboards" element={<Leaderboards />} />
        <Route path="announcements" element={<Announcements />} />
        <Route path="stats" element={<CompanyStats />} />
        <Route path="security" element={<Security />} />
      </Routes>
    </Layout>
  );
};

export default AdminDashboard;