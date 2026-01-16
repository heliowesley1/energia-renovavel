import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';
import AdminDashboard from '@/components/admin/AdminDashboard'; // Funciona como Lista de Clientes
import AdminOverview from '@/components/admin/AdminOverview'; // Novo Dashboard
import SectorManagement from '@/components/admin/SectorManagement';
import UserManagement from '@/components/admin/UserManagement';
import UserDashboard from '@/components/user/UserDashboard';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // Rotas de Admin
  if (user.role === 'admin') {
    // Rota Principal -> Novo Dashboard Visual
    if (location.pathname === '/dashboard') {
      return <AdminOverview />;
    }
    // Rota Clientes -> Antigo AdminDashboard (Lista)
    if (location.pathname === '/dashboard/clients') {
      return <AdminDashboard />;
    }
    if (location.pathname === '/dashboard/sectors') {
      return <SectorManagement />;
    }
    if (location.pathname === '/dashboard/users') {
      return <UserManagement />;
    }
    return <AdminOverview />;
  }

  // Rotas de Usuário Comum
  return <UserDashboard />;
};

export default Dashboard;