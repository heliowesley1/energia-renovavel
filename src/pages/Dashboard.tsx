import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';

// Admin Components
import AdminDashboard from '@/components/admin/AdminDashboard'; 
import AdminOverview from '@/components/admin/AdminOverview'; 
import SectorManagement from '@/components/admin/SectorManagement';
import UserManagement from '@/components/admin/UserManagement';
import Reports from '@/components/admin/Reports';
import UsinaManagement from '@/components/admin/UsinaManagement'; // Nova Importação

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
  if (user.role === 'admin' || user.role === 'supervisor') {
    if (location.pathname === '/dashboard') return <AdminOverview />;
    if (location.pathname === '/dashboard/clients') return <AdminDashboard />;
    if (location.pathname === '/dashboard/reports') return <Reports />;
    
    // Rotas exclusivas de ADMIN
    if (user.role === 'admin') {
        if (location.pathname === '/dashboard/sectors') return <SectorManagement />;
        if (location.pathname === '/dashboard/users') return <UserManagement />;
        if (location.pathname === '/dashboard/usinas') return <UsinaManagement />; // Nova Rota
    }
    
    // Se a rota não existir para o Supervisor (ex: ele tentar acessar /usinas), volta pro overview
    if (location.pathname.startsWith('/dashboard/')) {
       return <AdminOverview />;
    }
  }

  // --- Rotas de USUÁRIO (Consultor) ---
  if (user.role === 'user') {
    if (location.pathname === '/dashboard') {
      return <UserOverview />;
    }
    
    if (location.pathname === '/dashboard/my-clients') {
      return <UserDashboard />;
    }
  }

  // Fallback padrão
  return <Navigate to="/dashboard" replace />;
};

export default Dashboard;