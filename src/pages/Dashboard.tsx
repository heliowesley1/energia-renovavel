import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';
import AdminDashboard from '@/components/admin/AdminDashboard';
import SectorManagement from '@/components/admin/SectorManagement';
import UserManagement from '@/components/admin/UserManagement';
import UserDashboard from '@/components/user/UserDashboard';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Admin routes
  if (user.role === 'admin') {
    if (location.pathname === '/dashboard/sectors') {
      return <SectorManagement />;
    }
    if (location.pathname === '/dashboard/users') {
      return <UserManagement />;
    }
    if (location.pathname === '/dashboard/clients') {
      return <AdminDashboard />;
    }
    return <AdminDashboard />;
  }

  // User route
  return <UserDashboard />;
};

export default Dashboard;
