/**
 * ARQUIVO: src/pages/Dashboard.tsx
 * * ATUALIZAÇÕES:
 * 1. Adicionado import de UserOverview.
 * 2. Adicionado lógica de rotas para usuários comuns (Overview vs MyClients).
 */

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLocation, Navigate } from 'react-router-dom';

// Admin Components
import AdminDashboard from '@/components/admin/AdminDashboard'; 
import AdminOverview from '@/components/admin/AdminOverview'; 
import SectorManagement from '@/components/admin/SectorManagement';
import UserManagement from '@/components/admin/UserManagement';
import Reports from '@/components/admin/Reports';

// User Components
import UserDashboard from '@/components/user/UserDashboard'; // Lista/Cadastro
import UserOverview from '@/components/user/UserOverview';   // Dashboard Visual (NOVO)

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated || !user) {
    return <Navigate to="/" replace />;
  }

  // --- Rotas de ADMIN ---
  if (user.role === 'admin') {
    if (location.pathname === '/dashboard') return <AdminOverview />;
    if (location.pathname === '/dashboard/clients') return <AdminDashboard />;
    if (location.pathname === '/dashboard/sectors') return <SectorManagement />;
    if (location.pathname === '/dashboard/users') return <UserManagement />;
    if (location.pathname === '/dashboard/reports') return <Reports />;
    
    return <AdminOverview />;
  }

  // --- Rotas de USUÁRIO (Consultor) ---
  // Rota Principal: Mostra os gráficos
  if (location.pathname === '/dashboard') {
    return <UserOverview />;
  }
  
  // Rota de Gestão: Mostra a tabela e cadastro
  if (location.pathname === '/dashboard/my-clients') {
    return <UserDashboard />;
  }

  // Fallback padrão
  return <UserOverview />;
};

export default Dashboard;