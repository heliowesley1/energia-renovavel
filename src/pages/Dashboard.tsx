import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';

// Admin Components (Reused for Supervisor)
import AdminDashboard from '@/components/admin/AdminDashboard'; 
import AdminOverview from '@/components/admin/AdminOverview'; 
import SectorManagement from '@/components/admin/SectorManagement';
import UserManagement from '@/components/admin/UserManagement';
import Reports from '@/components/admin/Reports';

// User Components
import UserDashboard from '@/components/user/UserDashboard'; 
import UserOverview from '@/components/user/UserOverview';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // --- Rotas de ADMIN e SUPERVISOR ---
  // Supervisor reuses admin components but components themselves handle the filtering
  if (user.role === 'admin' || user.role === 'supervisor') {
    if (location.pathname === '/dashboard') return <AdminOverview />;
    if (location.pathname === '/dashboard/clients') return <AdminDashboard />;
    if (location.pathname === '/dashboard/reports') return <Reports />;
    
    // Admin only routes
    if (user.role === 'admin') {
        if (location.pathname === '/dashboard/sectors') return <SectorManagement />;
        if (location.pathname === '/dashboard/users') return <UserManagement />;
    }
    
    return <AdminOverview />;
  }

  // --- Rotas de USUÁRIO (Consultor) ---
  if (location.pathname === '/dashboard') {
    return <UserOverview />;
  }
  
  if (location.pathname === '/dashboard/my-clients') {
    return <UserDashboard />;
  }

  return <UserOverview />;
};

export default Dashboard;