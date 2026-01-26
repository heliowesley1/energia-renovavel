import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Zap,
  LayoutDashboard,
  Users,
  Building2,
  UserCog,
  LogOut,
  Menu,
  X,
  PieChart,
  ClipboardList,
  Factory,
  DollarSign
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Definição de todos os links disponíveis no sistema
  const menuItems = {
    dashboard: { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    comissoes: { href: '/dashboard/comissoes', icon: DollarSign, label: 'Comissões' },
    reports: { href: '/dashboard/reports', icon: PieChart, label: 'Relatórios' },
    clients: { href: '/dashboard/clients', icon: Users, label: 'Clientes' },
    myClients: { href: '/dashboard/my-clients', icon: ClipboardList, label: 'Meus Clientes' },
    sectors: { href: '/dashboard/sectors', icon: Building2, label: 'Setores' },
    usinas: { href: '/dashboard/usinas', icon: Factory, label: 'Usinas' },
    users: { href: '/dashboard/users', icon: UserCog, label: 'Usuários' },
  };

  // Lógica de filtragem baseada no cargo (role)
  const getLinks = () => {
    const role = user?.role;

    if (role === 'admin') {
      return [menuItems.dashboard, menuItems.comissoes, menuItems.reports, menuItems.clients, menuItems.sectors, menuItems.usinas, menuItems.users];
    }

    if (role === 'supervisor') {
      return [menuItems.dashboard,menuItems.reports, menuItems.clients];
    }

    if (role === 'gestao') {
      // Ajustado para os requisitos: vê setores mas não as páginas de config
      return [menuItems.dashboard, menuItems.clients, menuItems.reports];
    }

    if (role === 'diretores') {
      // Ajustado para os requisitos: vê clientes, relatórios e comissões
      return [menuItems.dashboard, menuItems.clients, menuItems.reports, menuItems.comissoes];
    }

    // Padrão para 'user' (Consultor) ou qualquer outro cargo
    return [menuItems.dashboard, menuItems.myClients];
  };

  // Garante que links sempre seja um array para evitar erro no .map()
  const links = getLinks() || [];

  const getRoleDisplay = (role?: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'supervisor': return 'Supervisor';
      case 'gestao': return 'Gestão';
      case 'diretores': return 'Diretor';
      case 'user': return 'Consultor(a)';
      default: return role || 'Usuário';
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 lg:hidden",
          !isOpen && "hidden"
        )}
        onClick={() => setIsOpen(false)}
      />

      <Button
        variant="ghost"
        size="icon"
        className="fixed top-4 left-4 z-50 lg:hidden"
        onClick={() => setIsOpen(!isOpen)}
      >
        {isOpen ? <X /> : <Menu />}
      </Button>

      <aside
        className={cn(
          'fixed left-0 top-0 z-40 h-screen w-64 bg-sidebar transition-transform duration-300 lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center gap-3 px-6 py-6 border-b border-sidebar-border">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-glow">
              <Zap className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-display font-bold text-sidebar-foreground">
                Energia
              </h2>
              <p className="text-xs text-sidebar-foreground/60">Renovável</p>
            </div>
          </div>

          <div className="px-6 py-4 border-b border-sidebar-border">
            <p className="text-sm font-medium text-sidebar-foreground truncate">
              {user?.name}
            </p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {getRoleDisplay(user?.role)}
            </p>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {links.map((link) => {
              const isActive = location.pathname === link.href;
              return (
                <button
                  key={link.href}
                  onClick={() => {
                    navigate(link.href);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200',
                    isActive
                      ? 'bg-sidebar-primary text-sidebar-primary-foreground shadow-md'
                      : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                  )}
                >
                  <link.icon className="w-5 h-5" />
                  {link.label}
                </button>
              );
            })}
          </nav>

          <div className="px-4 py-4 border-t border-sidebar-border">
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-5 h-5" />
              Sair
            </Button>
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;