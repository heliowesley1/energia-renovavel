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
  DollarSign // Adicionado apenas este ícone
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

  const adminLinks = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/comissoes', icon: DollarSign, label: 'Comissões' }, // Adicionado
    { href: '/dashboard/reports', icon: PieChart, label: 'Relatórios' },
    { href: '/dashboard/clients', icon: Users, label: 'Clientes' },
    { href: '/dashboard/sectors', icon: Building2, label: 'Setores' },
    { href: '/dashboard/usinas', icon: Factory, label: 'Usinas' },
    { href: '/dashboard/users', icon: UserCog, label: 'Usuários' },
  ];

  const supervisorLinks = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/comissoes', icon: DollarSign, label: 'Comissões' }, // Adicionado
    { href: '/dashboard/reports', icon: PieChart, label: 'Relatórios' },
    { href: '/dashboard/clients', icon: Users, label: 'Clientes' },
  ];

  const userLinks = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/dashboard/my-clients', icon: ClipboardList, label: 'Meus Clientes' },
  ];

  let links = userLinks;
  if (user?.role === 'admin') links = adminLinks;
  else if (user?.role === 'supervisor') links = supervisorLinks;

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
            <p className="text-sm font-medium text-sidebar-foreground">
              {user?.name}
            </p>
            <p className="text-xs text-sidebar-foreground/60 capitalize">
              {user?.role === 'user' ? 'Consultor(a)' : user?.role === 'supervisor' ? 'Supervisor' : 'Administrador'}
            </p>
          </div>

          <nav className="flex-1 px-4 py-4 space-y-1">
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