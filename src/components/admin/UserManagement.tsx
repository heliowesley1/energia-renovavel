/**
 * ARQUIVO: src/components/admin/UserManagement.tsx
 * * ATUALIZAÇÕES:
 * 1. Layout: Implementado Accordion para agrupar por "Administradores" e por "Setores".
 * 2. Filtro: Busca por texto agora aceita "Administrador" e "Consultor".
 * 3. Form: Retirados asteriscos visuais e validação obrigatória de setor.
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
  Trash2, 
  Shield, 
  KeyRound,
  Power,
  Ban,
  Briefcase,
  Users
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(mockUsers);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Dialog
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'user' as 'admin' | 'user',
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

    // REMOVIDO: Validação de setor obrigatório conforme solicitado

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
      toast({ title: 'Usuário atualizado!' });
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
      toast({ title: 'Usuário criado!' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const handleDelete = (id: string) => {
    setUsers((prev) => prev.filter((u) => u.id !== id));
    toast({ title: 'Usuário excluído permanentemente' });
  };

  const handleToggleStatus = (user: User) => {
    const newStatus = !user.active;
    setUsers((prev) => 
      prev.map((u) => u.id === user.id ? { ...u, active: newStatus } : u)
    );
    toast({
      title: newStatus ? 'Usuário Ativado' : 'Usuário Inativado',
      description: `O acesso de ${user.name} foi ${newStatus ? 'liberado' : 'bloqueado'}.`,
      variant: newStatus ? 'default' : 'destructive',
    });
  };

  const getSectorName = (sectorId?: string) => {
    if (!sectorId) return '-';
    return mockSectors.find((s) => s.id === sectorId)?.name || 'N/A';
  };

  // --- Lógica de Filtragem Aprimorada ---
  const filteredUsers = users.filter((user) => {
    const term = searchTerm.toLowerCase();
    
    // Busca por Nome, Email E pelos termos de cargo
    const matchesSearch = 
      user.name.toLowerCase().includes(term) || 
      user.email.toLowerCase().includes(term) ||
      (term.includes('admin') && user.role === 'admin') ||
      (term.includes('consult') && user.role === 'user'); // "Consult" pega Consultor/Consultores

    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'active' ? user.active 
      : !user.active;
    
    return matchesSearch && matchesStatus;
  });

  const activeCount = users.filter(u => u.active).length;
  const inactiveCount = users.filter(u => !u.active).length;

  // --- Renderização da Tabela (Helper para evitar repetição) ---
  const renderUserTable = (usersList: User[]) => {
    if (usersList.length === 0) {
      return <div className="text-center py-4 text-muted-foreground text-sm">Nenhum usuário neste grupo.</div>;
    }
    return (
      <div className="rounded-md border bg-background/50">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Usuário</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {usersList.map((user) => (
              <TableRow key={user.id} className={cn(!user.active && "opacity-60 bg-muted/50")}>
                <TableCell className="font-medium">{user.name}</TableCell>
                <TableCell>
                  <Badge variant={user.active ? "success" : "secondary"} className={cn("h-5 text-[10px]", !user.active && "bg-muted-foreground text-white")}>
                    {user.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">{user.email}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleToggleStatus(user)}
                      title={user.active ? "Inativar" : "Ativar"}
                      className={cn("h-7 w-7", user.active ? "text-destructive hover:bg-destructive/10" : "text-success hover:bg-success/10")}
                    >
                      <Power className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleOpenDialog(user)}
                      className="h-7 w-7"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => handleDelete(user.id)}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
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
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Gestão de Usuários
            </h1>
            <p className="text-muted-foreground mt-1">
              Controle de acesso hierárquico por setor
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" onClick={() => handleOpenDialog()}>
                <Plus className="w-4 h-4" />
                Novo Usuário
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</DialogTitle>
                <DialogDescription>
                  Preencha os dados de acesso. O setor não é obrigatório.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  {/* Removido asterisco visual */}
                  <Label htmlFor="name">Nome</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{editingUser ? 'Nova Senha' : 'Senha'}</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" className="pl-9" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingUser} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Tipo</Label>
                    <Select value={formData.role} onValueChange={(v: any) => setFormData({ ...formData, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="user">Consultor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sector">Setor (Opcional)</Label>
                    <Select value={formData.sectorId} onValueChange={(v) => setFormData({ ...formData, sectorId: v })}>
                      <SelectTrigger><SelectValue placeholder="Selecione" /></SelectTrigger>
                      <SelectContent>
                        {mockSectors.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" variant="hero">Salvar</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats Rápidos */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg"><UserCog className="w-5 h-5 text-primary"/></div>
              <span className="text-sm font-medium">Total</span>
            </div>
            <span className="text-2xl font-bold">{users.length}</span>
          </Card>
          <Card className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg"><Shield className="w-5 h-5 text-emerald-600"/></div>
              <span className="text-sm font-medium">Ativos</span>
            </div>
            <span className="text-2xl font-bold text-emerald-600">{activeCount}</span>
          </Card>
          <Card className="glass-card p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg"><Ban className="w-5 h-5 text-red-600"/></div>
              <span className="text-sm font-medium">Inativos</span>
            </div>
            <span className="text-2xl font-bold text-red-600">{inactiveCount}</span>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle className="text-xl">Organograma</CardTitle>
              
              {/* Filtros */}
              <div className="flex flex-wrap gap-2">
                <div className="relative w-full sm:w-[250px]">
                  <Input 
                    placeholder="Buscar (Nome, Email, 'Admin', 'Consultor')..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="pl-8"
                  />
                  <Users className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                  <SelectTrigger className="w-[120px]"><SelectValue placeholder="Status" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="active">Ativos</SelectItem>
                    <SelectItem value="inactive">Inativos</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            
            {/* GRUPO 1: ADMINISTRADORES */}
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                <Shield className="w-4 h-4" /> Administração
              </h3>
              <Accordion type="single" collapsible defaultValue="admins" className="w-full">
                <AccordionItem value="admins" className="border-b-0">
                  <AccordionTrigger className="hover:no-underline bg-muted/30 px-4 rounded-lg mb-2">
                    <span className="flex items-center gap-2 font-semibold">
                      Administradores 
                      <Badge variant="secondary" className="ml-2">{filteredUsers.filter(u => u.role === 'admin').length}</Badge>
                    </span>
                  </AccordionTrigger>
                  <AccordionContent className="pt-2 px-1">
                    {renderUserTable(filteredUsers.filter(u => u.role === 'admin'))}
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>

            {/* GRUPO 2: SETORES (CONSULTORES) */}
            <div>
              <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wider flex items-center gap-2">
                <Briefcase className="w-4 h-4" /> Equipes por Setor
              </h3>
              
              <Accordion type="multiple" className="w-full space-y-2">
                {mockSectors.map((sector) => {
                  const sectorUsers = filteredUsers.filter(u => u.role === 'user' && u.sectorId === sector.id);
                  // Oculta setor se não tiver usuários E se houver busca ativa (pra limpar a tela)
                  // Se não tiver busca, mostra o setor mesmo vazio.
                  if (searchTerm && sectorUsers.length === 0) return null;

                  return (
                    <AccordionItem key={sector.id} value={sector.id} className="border-none">
                      <AccordionTrigger className="hover:no-underline bg-muted/30 px-4 rounded-lg data-[state=open]:bg-muted/50 transition-colors">
                        <span className="flex items-center gap-2 font-semibold">
                          {sector.name}
                          <Badge variant="outline" className="ml-2 bg-background">{sectorUsers.length}</Badge>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 px-1">
                        {renderUserTable(sectorUsers)}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}

                {/* GRUPO 3: SEM SETOR */}
                {(() => {
                  const noSectorUsers = filteredUsers.filter(u => u.role === 'user' && !u.sectorId);
                  if (noSectorUsers.length === 0) return null;
                  
                  return (
                    <AccordionItem value="no-sector" className="border-none">
                      <AccordionTrigger className="hover:no-underline bg-orange-50/50 px-4 rounded-lg data-[state=open]:bg-orange-50 transition-colors">
                        <span className="flex items-center gap-2 font-semibold text-orange-800">
                          Sem Setor Definido
                          <Badge variant="outline" className="ml-2 bg-white border-orange-200 text-orange-700">{noSectorUsers.length}</Badge>
                        </span>
                      </AccordionTrigger>
                      <AccordionContent className="pt-2 px-1">
                        {renderUserTable(noSectorUsers)}
                      </AccordionContent>
                    </AccordionItem>
                  );
                })()}
              </Accordion>
            </div>

          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;