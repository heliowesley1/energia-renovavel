/**
 * ARQUIVO: src/components/admin/UserManagement.tsx
 * * ATUALIZAÇÕES:
 * 1. Adicionado cargo "Supervisor" no cadastro.
 * 2. Removida a opção de excluir (Lixeira).
 * 3. Lupa Geral: Busca apenas por Nome.
 * 4. Novos Filtros Gerais: Botões para Setor e Cargo.
 * 5. Inovação: Cada Setor (Accordion) tem sua própria busca interna (Lupa expansível).
 * 6. "Sem Setor Definido" REMOVIDO.
 * 7. "Bloqueados" renomeado para "Inativos" (Cor Amarela).
 * 8. Ação renomeada para "Inativar Acesso".
 */

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockUsers, mockSectors } from '@/data/mockData';
import type { User } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { 
  UserCog, 
  Plus, 
  Edit, 
  Shield, 
  KeyRound,
  Power,
  Ban,
  Briefcase,
  Search,
  Filter,
  X,
  UserCheck,
  Building2,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(mockUsers);
  
  // --- FILTROS GERAIS ---
  const [globalNameSearch, setGlobalNameSearch] = useState('');
  const [globalSectorFilter, setGlobalSectorFilter] = useState('all');
  const [globalRoleFilter, setGlobalRoleFilter] = useState('all');

  // --- BUSCA LOCAL POR SETOR (Estado Independente) ---
  const [sectorSearchOpen, setSectorSearchOpen] = useState<Record<string, boolean>>({});
  const [sectorSearchTerms, setSectorSearchTerms] = useState<Record<string, string>>({});

  // Dialog & Form
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user' | 'supervisor',
    sectorId: '',
    password: '', 
  });

  const resetForm = () => {
    setFormData({ name: '', email: '', role: 'user', sectorId: '', password: '' });
    setEditingUser(null);
  };

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        role: user.role,
        sectorId: user.sectorId || '',
        password: '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id
            ? { 
                ...u, 
                ...formData,
                password: formData.password ? formData.password : u.password 
              }
            : u
        )
      );
      toast({ title: 'Usuário atualizado com sucesso!' });
    } else {
      const newUser: User = {
        id: String(Date.now()),
        name: formData.name,
        email: formData.email,
        role: formData.role,
        sectorId: formData.sectorId || undefined,
        password: formData.password,
        active: true,
      };
      setUsers((prev) => [...prev, newUser]);
      toast({ title: 'Novo colaborador criado!' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = !user.active;
    setUsers((prev) => 
      prev.map((u) => u.id === user.id ? { ...u, active: newStatus } : u)
    );
    toast({
      title: newStatus ? 'Acesso Liberado' : 'Acesso Inativado',
      description: `O usuário ${user.name} foi ${newStatus ? 'ativado' : 'inativado'}.`,
      // Se inativou (newStatus false), usa cor amarela/laranja no toast para combinar
      className: !newStatus ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-emerald-50 border-emerald-200 text-emerald-800",
    });
  };

  // --- LÓGICA DE FILTRAGEM GLOBAL ---
  const getFilteredUsers = () => {
    return users.filter((user) => {
      // 1. Filtro por Nome (Lupa Geral)
      const matchName = user.name.toLowerCase().includes(globalNameSearch.toLowerCase());
      
      // 2. Filtro por Setor (Select Geral)
      const matchSector = globalSectorFilter === 'all' 
        ? true 
        : globalSectorFilter === 'no-sector' ? !user.sectorId 
        : user.sectorId === globalSectorFilter;

      // 3. Filtro por Tipo (Select Geral)
      const matchRole = globalRoleFilter === 'all' 
        ? true 
        : user.role === globalRoleFilter;

      return matchName && matchSector && matchRole;
    });
  };

  // Dados filtrados globalmente
  const globalFilteredUsers = getFilteredUsers();
  
  // Stats baseados no filtro atual
  const activeCount = globalFilteredUsers.filter(u => u.active).length;
  const inactiveCount = globalFilteredUsers.filter(u => !u.active).length;

  // --- MANIPULAÇÃO DA BUSCA INTERNA DO SETOR ---
  const toggleSectorSearch = (sectorId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSectorSearchOpen(prev => ({
        ...prev,
        [sectorId]: !prev[sectorId]
    }));
    if (sectorSearchOpen[sectorId]) {
        setSectorSearchTerms(prev => ({ ...prev, [sectorId]: '' }));
    }
  };

  // --- RENDERIZAÇÃO DA TABELA ---
  const renderUserTable = (usersList: User[], localSearchTerm: string = '') => {
    const displayUsers = usersList.filter(u => 
        u.name.toLowerCase().includes(localSearchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(localSearchTerm.toLowerCase())
    );

    if (displayUsers.length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-8 text-muted-foreground bg-muted/20 rounded-md border border-dashed">
            <p className="text-sm">Nenhum usuário encontrado neste grupo.</p>
        </div>
      );
    }

    return (
      <div className="rounded-md border bg-background/50 overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-transparent bg-muted/40">
              <TableHead>Colaborador</TableHead>
              <TableHead>Cargo</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {displayUsers.map((user) => (
              <TableRow key={user.id} className={cn("transition-colors", !user.active && "opacity-60 bg-muted/30")}>
                <TableCell>
                    <div className="flex flex-col">
                        <span className="font-medium">{user.name}</span>
                        <span className="text-xs text-muted-foreground">{user.email}</span>
                    </div>
                </TableCell>
                <TableCell>
                    <Badge variant="outline" className={cn(
                        "text-[10px] uppercase tracking-wide border-0 font-bold",
                        user.role === 'admin' ? "bg-primary/10 text-primary" : 
                        user.role === 'supervisor' ? "bg-violet-100 text-violet-700" : 
                        "bg-slate-100 text-slate-700"
                    )}>
                        {user.role === 'admin' ? 'Administrador' : user.role === 'supervisor' ? 'Supervisor' : 'Consultor'}
                    </Badge>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                      {/* ALTERAÇÃO: Bolinha de status inativo agora é AMBER (amarelo/laranja) */}
                      <div className={cn("w-2 h-2 rounded-full", user.active ? "bg-emerald-500" : "bg-amber-500 animate-pulse")} />
                      <span className="text-xs font-medium text-muted-foreground">{user.active ? 'Ativo' : 'Inativo'}</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(user)}
                      /* ALTERAÇÃO: Texto do tooltip modificado */
                      title={user.active ? "Inativar Acesso" : "Liberar Acesso"}
                      /* ALTERAÇÃO: Hover agora é AMBER/AMARELO para inativar */
                      className={cn("h-8 w-8 rounded-full", user.active ? "text-muted-foreground hover:text-amber-600 hover:bg-amber-50" : "text-emerald-600 hover:bg-emerald-50")}
                    >
                      {user.active ? <Ban className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(user)}
                      className="h-8 w-8 rounded-full text-muted-foreground hover:text-primary hover:bg-primary/10"
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Header & Ação Principal */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Gestão de Usuários
            </h1>
            <p className="text-muted-foreground mt-1">
              Administre hierarquias, supervisores e consultores.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" onClick={() => handleOpenDialog()} className="shadow-lg h-10">
                <Plus className="w-4 h-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Editar Acesso' : 'Criar Novo Acesso'}</DialogTitle>
                <DialogDescription>
                  Configure as permissões e dados de acesso do colaborador.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome Completo</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Ex: Ana Silva" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Corporativo</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required placeholder="nome@empresa.com" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{editingUser ? 'Nova Senha (Opcional)' : 'Senha Inicial'}</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" className="pl-9" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingUser} placeholder={editingUser ? "Manter atual" : "******"} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Função</Label>
                    <Select value={formData.role} onValueChange={(v: any) => setFormData({ ...formData, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="supervisor">Supervisor</SelectItem>
                        <SelectItem value="user">Consultor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sector">Setor Vinculado</Label>
                    <Select value={formData.sectorId} onValueChange={(v) => setFormData({ ...formData, sectorId: v })}>
                      <SelectTrigger><SelectValue placeholder="Opcional" /></SelectTrigger>
                      <SelectContent>
                        {mockSectors.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" variant="hero">Salvar Dados</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-card p-4 flex items-center justify-between border-l-4 border-l-primary">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><UserCog className="w-5 h-5 text-primary"/></div>
              <span className="text-sm font-medium">Total Usuários</span>
            </div>
            <span className="text-2xl font-bold">{globalFilteredUsers.length}</span>
          </Card>
          <Card className="glass-card p-4 flex items-center justify-between border-l-4 border-l-emerald-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg"><UserCheck className="w-5 h-5 text-emerald-600"/></div>
              <span className="text-sm font-medium">Ativos</span>
            </div>
            <span className="text-2xl font-bold text-emerald-600">{activeCount}</span>
          </Card>
          
          {/* ALTERAÇÃO: CARD "BLOQUEADOS" AGORA É "INATIVOS" (AMARELO) */}
          <Card className="glass-card p-4 flex items-center justify-between border-l-4 border-l-amber-500">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg"><Ban className="w-5 h-5 text-amber-600"/></div>
              <span className="text-sm font-medium">Inativos</span>
            </div>
            <span className="text-2xl font-bold text-amber-600">{inactiveCount}</span>
          </Card>
        </div>

        {/* ÁREA DE FILTROS GERAIS */}
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="w-5 h-5 text-muted-foreground" /> Filtros Gerais
              </CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <div className="relative w-full sm:w-[280px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Buscar apenas por nome..." 
                    value={globalNameSearch} 
                    onChange={(e) => setGlobalNameSearch(e.target.value)} 
                    className="pl-9 h-10"
                  />
                </div>

                <div className="w-full sm:w-[180px]">
                    <Select value={globalSectorFilter} onValueChange={setGlobalSectorFilter}>
                        <SelectTrigger className="h-10">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Building2 className="w-4 h-4" />
                                <span className="text-foreground truncate">
                                    {globalSectorFilter === 'all' ? 'Todos Setores' : 
                                     globalSectorFilter === 'no-sector' ? 'Sem Setor' : 
                                     mockSectors.find(s => s.id === globalSectorFilter)?.name}
                                </span>
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Setores</SelectItem>
                            {mockSectors.map(s => <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>)}
                            <SelectItem value="no-sector">Sem Setor Definido</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="w-full sm:w-[180px]">
                    <Select value={globalRoleFilter} onValueChange={setGlobalRoleFilter}>
                        <SelectTrigger className="h-10">
                            <div className="flex items-center gap-2 text-muted-foreground">
                                <Shield className="w-4 h-4" />
                                <span className="text-foreground">
                                    {globalRoleFilter === 'all' ? 'Todos Cargos' : 
                                     globalRoleFilter === 'admin' ? 'Admins' : 
                                     globalRoleFilter === 'supervisor' ? 'Supervisores' : 'Consultores'}
                                </span>
                            </div>
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos Cargos</SelectItem>
                            <SelectItem value="admin">Administradores</SelectItem>
                            <SelectItem value="supervisor">Supervisores</SelectItem>
                            <SelectItem value="user">Consultores</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* LISTAGEM POR GRUPOS */}
        <Card className="glass-card border-none shadow-none bg-transparent">
          <CardContent className="p-0 space-y-6">
            
            {/* GRUPO 1: ADMINISTRADORES */}
            {globalFilteredUsers.some(u => u.role === 'admin') && (
                <div className="bg-card border rounded-xl shadow-sm overflow-hidden">
                    <div className="bg-muted/30 px-6 py-4 border-b flex items-center justify-between">
                        <h3 className="font-bold flex items-center gap-2 text-foreground">
                            <Shield className="w-5 h-5 text-primary" /> 
                            Administração
                        </h3>
                        <Badge variant="secondary">{globalFilteredUsers.filter(u => u.role === 'admin').length}</Badge>
                    </div>
                    <div className="p-4">
                        {renderUserTable(globalFilteredUsers.filter(u => u.role === 'admin'))}
                    </div>
                </div>
            )}

            {/* GRUPO 2: SETORES */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-wider pl-1 flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Equipes por Setor
              </h3>
              
              <Accordion type="multiple" className="w-full space-y-3">
                {mockSectors.map((sector) => {
                  const sectorUsersGlobal = globalFilteredUsers.filter(u => u.role !== 'admin' && u.sectorId === sector.id);
                  
                  if (sectorUsersGlobal.length === 0) return null;

                  const isSearching = sectorSearchOpen[sector.id];
                  const localTerm = sectorSearchTerms[sector.id] || '';

                  return (
                    <AccordionItem key={sector.id} value={sector.id} className="bg-card border rounded-xl shadow-sm px-0">
                      <div className="flex items-center px-4 py-3 hover:bg-muted/50 transition-colors rounded-t-xl">
                        
                        <AccordionTrigger className="hover:no-underline py-0 flex-1">
                            <span className="flex items-center gap-3 font-semibold text-lg">
                                {sector.name}
                                <Badge variant="outline" className="text-xs font-normal bg-background">
                                    {sectorUsersGlobal.length} membros
                                </Badge>
                            </span>
                        </AccordionTrigger>

                        <div className="flex items-center gap-2 ml-4">
                            {isSearching && (
                                <div className="animate-in fade-in slide-in-from-right-5 duration-300">
                                    <Input 
                                        autoFocus
                                        className="h-8 w-[200px] text-xs bg-background"
                                        placeholder={`Buscar em ${sector.name}...`}
                                        value={localTerm}
                                        onChange={(e) => setSectorSearchTerms(prev => ({ ...prev, [sector.id]: e.target.value }))}
                                        onClick={(e) => e.stopPropagation()}
                                    />
                                </div>
                            )}
                            <Button 
                                variant={isSearching ? "secondary" : "ghost"} 
                                size="icon" 
                                className="h-8 w-8 shrink-0 rounded-full"
                                onClick={(e) => toggleSectorSearch(sector.id, e)}
                                title="Buscar neste setor"
                            >
                                {isSearching ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                            </Button>
                        </div>

                      </div>
                      
                      <AccordionContent className="px-4 pb-4 pt-0 border-t">
                        <div className="pt-4">
                            {renderUserTable(sectorUsersGlobal, localTerm)}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}

                {/* ALTERAÇÃO: GRUPO "SEM SETOR" REMOVIDO DAQUI
                   O bloco que renderizava usuários sem setor foi excluído conforme solicitado.
                */}
              </Accordion>
            </div>

          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;