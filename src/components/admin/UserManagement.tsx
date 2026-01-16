import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockUsers, mockSectors } from '@/data/mockData';
import type { User } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
  UserCog, 
  Plus, 
  Edit, 
  Trash2, 
  Shield, 
  User as UserIcon, 
  Search, 
  KeyRound,
  Power,
  Ban
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>(mockUsers);
  
  // Filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'admin' | 'user'>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
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

    if (!formData.sectorId) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, selecione um setor para o usuário.",
        variant: "destructive"
      });
      return;
    }

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
        sectorId: formData.sectorId,
        password: formData.password,
        active: true, // Usuários novos nascem ativos
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

  // Nova função para alternar status
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
    if (!sectorId) return 'N/A';
    return mockSectors.find((s) => s.id === sectorId)?.name || 'N/A';
  };

  // Filtragem
  const filteredUsers = users.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesSector = sectorFilter === 'all' || user.sectorId === sectorFilter;
    const matchesStatus = statusFilter === 'all' 
      ? true 
      : statusFilter === 'active' ? user.active 
      : !user.active;
    
    return matchesSearch && matchesRole && matchesSector && matchesStatus;
  });

  const activeCount = users.filter(u => u.active).length;
  const inactiveCount = users.filter(u => !u.active).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Gestão de Usuários
            </h1>
            <p className="text-muted-foreground mt-1">
              Controle de acesso, setores e status
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
                  Preencha os dados de acesso e alocação.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome *</Label>
                  <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">{editingUser ? 'Nova Senha' : 'Senha *'}</Label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" className="pl-9" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} required={!editingUser} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="role">Tipo *</Label>
                    <Select value={formData.role} onValueChange={(v: any) => setFormData({ ...formData, role: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrador</SelectItem>
                        <SelectItem value="user">Consultor</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="sector">Setor *</Label>
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-primary/10"><UserCog className="w-6 h-6 text-primary" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Total de Usuários</p>
                  <p className="text-3xl font-display font-bold">{users.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-success/10"><Shield className="w-6 h-6 text-success" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Ativos</p>
                  <p className="text-3xl font-display font-bold">{activeCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-xl bg-destructive/10"><Ban className="w-6 h-6 text-destructive" /></div>
                <div>
                  <p className="text-sm text-muted-foreground">Inativos</p>
                  <p className="text-3xl font-display font-bold">{inactiveCount}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <CardTitle className="text-xl">Lista de Usuários</CardTitle>
                
                {/* Filtros */}
                <div className="flex flex-wrap gap-2">
                  <Input 
                    placeholder="Buscar..." 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    className="w-full sm:w-[150px]" 
                  />
                  <Select value={roleFilter} onValueChange={(v: any) => setRoleFilter(v)}>
                    <SelectTrigger className="w-[110px]"><SelectValue placeholder="Tipo" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={statusFilter} onValueChange={(v: any) => setStatusFilter(v)}>
                    <SelectTrigger className="w-[110px]"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={sectorFilter} onValueChange={setSectorFilter}>
                    <SelectTrigger className="w-[140px]"><SelectValue placeholder="Setor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Setores</SelectItem>
                      {mockSectors.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className={cn(!user.active && "opacity-60 bg-muted/50")}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{user.name}</span>
                          <span className="text-xs text-muted-foreground">{user.email}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.active ? "success" : "secondary"} className={cn(!user.active && "bg-muted-foreground text-white")}>
                          {user.active ? 'Ativo' : 'Inativo'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{user.role === 'admin' ? 'Admin' : 'Consultor'}</Badge>
                      </TableCell>
                      <TableCell>{getSectorName(user.sectorId)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleToggleStatus(user)}
                            title={user.active ? "Inativar Usuário" : "Ativar Usuário"}
                            className={cn("h-8 w-8", user.active ? "text-destructive hover:text-destructive hover:bg-destructive/10" : "text-success hover:text-success hover:bg-success/10")}
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(user)}
                            className="h-8 w-8"
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-muted-foreground hover:text-destructive"
                            onClick={() => handleDelete(user.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserManagement;