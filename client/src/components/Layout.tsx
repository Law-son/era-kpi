import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Building2, LogOut, Settings, User } from 'lucide-react';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<any>;
  current: boolean;
}

interface LayoutProps {
  title: string;
  navigation: NavigationItem[];
  onTabChange: (tab: string) => void;
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ title, navigation, onTabChange, children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleTabClick = (href: string) => {
    onTabChange(href);
    const basePath = location.pathname.split('/').slice(0, 2).join('/');
    navigate(`${basePath}/${href}`);
  };

  return (
    <div className="h-screen bg-gray-50 flex flex-col">
      {/* Fixed Header */}
      <div className="bg-white shadow-sm border-b border-gray-200 flex-shrink-0">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <div className="bg-primary-600 p-2 rounded-lg">
                <Building2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">{title}</h1>
                <p className="text-sm text-gray-500">{user?.companyName || 'ERA AXIS'}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <User className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-700">{user?.name}</span>
                <span className="text-xs bg-primary-100 text-primary-800 px-2 py-1 rounded-full">
                  {user?.role}
                </span>
              </div>
              <button
                onClick={logout}
                className="flex items-center space-x-2 text-gray-500 hover:text-gray-700"
              >
                <LogOut className="h-4 w-4" />
                <span className="text-sm">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Area with Fixed Sidebar */}
      <div className="flex-1 flex overflow-hidden">
        {/* Fixed Sidebar */}
        <div className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <nav className="p-4 space-y-2">
            {navigation.map((item) => (
              <button
                key={item.name}
                onClick={() => handleTabClick(item.href)}
                className={`w-full flex items-center space-x-3 px-4 py-2 rounded-lg text-left transition-colors ${
                  item.current
                    ? 'bg-primary-100 text-primary-800 border border-primary-200'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Scrollable Main Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Layout;