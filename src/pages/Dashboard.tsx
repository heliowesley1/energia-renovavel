import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';
import AdminDashboard from '@/components/admin/AdminDashboard';
import SectorManagement from '@/components/admin/SectorManagement';
import UserManagement from '@/components/admin/UserManagement';
import AdminOverview from '@/components/admin/AdminOverview';
import Reports from '@/components/admin/Reports'; // Certifique-se de que este arquivo existe
import UserDashboard from '@/components/user/UserDashboard';
import UserOverview from '@/components/user/UserOverview';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Admin routes
  if (user.role === 'admin') {
    if (location.pathname === '/dashboard') {
      return <AdminOverview />;
    }
    if (location.pathname === '/dashboard/sectors') {
      return <SectorManagement />;
    }
    if (location.pathname === '/dashboard/users') {
      return <UserManagement />;
    }
    if (location.pathname === '/dashboard/clients') {
      return <AdminDashboard />;
    }
    // ADICIONE ESTA VERIFICAÇÃO:
    if (location.pathname === '/dashboard/reports') {
      return <Reports />;
    }
    
    return <AdminOverview />;
  }

  // User route
  if (location.pathname === '/dashboard') {
    return <UserOverview />;
  }
  if (location.pathname === '/dashboard/my-clients') {
    return <UserDashboard />;
  }

  return <UserOverview />;
};

export default Dashboard;