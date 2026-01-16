import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockClients, mockSectors, mockUsers } from '@/data/mockData';
import { Client } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  Users,
  Building2,
  UserCheck,
  UserX,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  Download,
  TrendingUp,
  Zap,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>(mockClients);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>('all');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  // Stats
  const totalClients = clients.length;
  const approvedClients = clients.filter((c) => c.status === 'approved').length;
  const pendingClients = clients.filter((c) => c.status === 'pending').length;
  const rejectedClients = clients.filter((c) => c.status === 'rejected').length;

  // Filter clients
  const filteredClients = clients.filter((client) => {
    const matchesSearch =
      client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      client.cpf.includes(searchTerm) ||
      client.id.includes(searchTerm);
    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesSector = sectorFilter === 'all' || client.sectorId === sectorFilter;
    const matchesUser = userFilter === 'all' || client.userId === userFilter;

    return matchesSearch && matchesStatus && matchesSector && matchesUser;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge variant="success">Aprovado</Badge>;
      case 'rejected':
        return <Badge variant="rejected">Reprovado</Badge>;
      default:
        return <Badge variant="pending">Pendente</Badge>;
    }
  };

  const getSectorName = (sectorId: string) => {
    return mockSectors.find((s) => s.id === sectorId)?.name || 'N/A';
  };

  const getUserName = (userId: string) => {
    return mockUsers.find((u) => u.id === userId)?.name || 'N/A';
  };

  const stats = [
    {
      title: 'Total de Clientes',
      value: totalClients,
      icon: Users,
      color: 'text-primary',
      bg: 'bg-primary/10',
    },
    {
      title: 'Aprovados',
      value: approvedClients,
      icon: UserCheck,
      color: 'text-success',
      bg: 'bg-success/10',
    },
    {
      title: 'Pendentes',
      value: pendingClients,
      icon: Clock,
      color: 'text-warning',
      bg: 'bg-warning/10',
    },
    {
      title: 'Reprovados',
      value: rejectedClients,
      icon: UserX,
      color: 'text-destructive',
      bg: 'bg-destructive/10',
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Dashboard Administrativo
            </h1>
            <p className="text-muted-foreground mt-1">
              Gerencie clientes, setores e usuários do sistema
            </p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Zap className="w-4 h-4 text-primary" />
            Bem-vindo, {user?.name}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="glass-card hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-display font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Filters */}
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="lg:col-span-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nome, email, CPF ou ID..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Status</SelectItem>
                  <SelectItem value="approved">Aprovado</SelectItem>
                  <SelectItem value="pending">Pendente</SelectItem>
                  <SelectItem value="rejected">Reprovado</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sectorFilter} onValueChange={setSectorFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Setor" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Setores</SelectItem>
                  {mockSectors.map((sector) => (
                    <SelectItem key={sector.id} value={sector.id}>
                      {sector.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Funcionário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Funcionários</SelectItem>
                  {mockUsers
                    .filter((u) => u.role === 'user')
                    .map((user) => (
                      <SelectItem key={user.id} value={user.id}>
                        {user.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Clients Table */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Lista de Clientes</CardTitle>
                <CardDescription>
                  {filteredClients.length} cliente(s) encontrado(s)
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Funcionário</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="font-mono text-sm">#{client.id}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{client.cpf}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{getSectorName(client.sectorId)}</Badge>
                      </TableCell>
                      <TableCell>{getUserName(client.userId)}</TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell>
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setSelectedClient(client)}
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              Ver
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-lg">
                            <DialogHeader>
                              <DialogTitle>Detalhes do Cliente</DialogTitle>
                              <DialogDescription>
                                Informações completas do cliente
                              </DialogDescription>
                            </DialogHeader>
                            {selectedClient && (
                              <div className="space-y-4 mt-4">
                                <div className="grid grid-cols-2 gap-4">
                                  <div>
                                    <Label className="text-muted-foreground">Nome</Label>
                                    <p className="font-medium">{selectedClient.name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Email</Label>
                                    <p className="font-medium">{selectedClient.email}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">CPF</Label>
                                    <p className="font-medium font-mono">{selectedClient.cpf}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Telefone</Label>
                                    <p className="font-medium">{selectedClient.phone}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Setor</Label>
                                    <p className="font-medium">{getSectorName(selectedClient.sectorId)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-muted-foreground">Funcionário</Label>
                                    <p className="font-medium">{getUserName(selectedClient.userId)}</p>
                                  </div>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Status</Label>
                                  <div className="mt-1">{getStatusBadge(selectedClient.status)}</div>
                                </div>
                                <div>
                                  <Label className="text-muted-foreground">Observações</Label>
                                  <p className="mt-1 p-3 bg-muted rounded-lg text-sm">
                                    {selectedClient.observations || 'Nenhuma observação'}
                                  </p>
                                </div>
                                {selectedClient.imageUrl && (
                                  <div>
                                    <Label className="text-muted-foreground">Anexo</Label>
                                    <div className="mt-2 p-4 border rounded-lg">
                                      <img
                                        src={selectedClient.imageUrl}
                                        alt="Anexo do cliente"
                                        className="max-w-full h-auto rounded"
                                      />
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredClients.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum cliente encontrado</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
