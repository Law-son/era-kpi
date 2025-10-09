import React, { useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from '../components/Layout';
import ExecutiveProfile from '../components/executive/ExecutiveProfile';
import MyTasks from '../components/executive/MyTasks';
import Performance from '../components/executive/Performance';
import CompanyLeaderboard from '../components/executive/CompanyLeaderboard';
import CompanyAnnouncements from '../components/executive/CompanyAnnouncements';
import { User, CheckSquare, TrendingUp, Trophy, Megaphone } from 'lucide-react';

const ExecutiveDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('profile');

  const navigation = [
    { name: 'Profile', href: 'profile', icon: User, current: activeTab === 'profile' },
    { name: 'My Tasks', href: 'tasks', icon: CheckSquare, current: activeTab === 'tasks' },
    { name: 'Performance', href: 'performance', icon: TrendingUp, current: activeTab === 'performance' },
    { name: 'Leaderboard', href: 'leaderboard', icon: Trophy, current: activeTab === 'leaderboard' },
    { name: 'Announcements', href: 'announcements', icon: Megaphone, current: activeTab === 'announcements' },
  ];

  return (
    <Layout title="Executive Dashboard" navigation={navigation} onTabChange={setActiveTab}>
      <Routes>
        <Route index element={<ExecutiveProfile />} />
        <Route path="profile" element={<ExecutiveProfile />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="performance" element={<Performance />} />
        <Route path="leaderboard" element={<CompanyLeaderboard />} />
        <Route path="announcements" element={<CompanyAnnouncements />} />
      </Routes>
    </Layout>
  );
};

export default ExecutiveDashboard;