import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockClients, mockSectors } from '@/data/mockData';
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
  Users,
  UserCheck,
  UserX,
  Clock,
  Plus,
  Edit,
  Sun,
  Zap,
  Upload,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>(
    mockClients.filter((c) => c.userId === user?.id)
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    observations: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected',
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const sectorName = mockSectors.find((s) => s.id === user?.sectorId)?.name || 'Não atribuído';

  // Stats
  const totalClients = clients.length;
  const approvedClients = clients.filter((c) => c.status === 'approved').length;
  const pendingClients = clients.filter((c) => c.status === 'pending').length;
  const rejectedClients = clients.filter((c) => c.status === 'rejected').length;

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      cpf: '',
      phone: '',
      observations: '',
      status: 'pending',
    });
    setImageFile(null);
    setImagePreview(null);
    setEditingClient(null);
  };

  const handleOpenDialog = (client?: Client) => {
    if (client) {
      setEditingClient(client);
      setFormData({
        name: client.name,
        email: client.email,
        cpf: client.cpf,
        phone: client.phone,
        observations: client.observations || '',
        status: client.status,
      });
      setImagePreview(client.imageUrl || null);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingClient) {
      setClients((prev) =>
        prev.map((c) =>
          c.id === editingClient.id
            ? {
                ...c,
                ...formData,
                imageUrl: imagePreview || c.imageUrl,
                updatedAt: new Date(),
              }
            : c
        )
      );
      toast({
        title: 'Cliente atualizado!',
        description: 'As informações foram salvas com sucesso.',
      });
    } else {
      const newClient: Client = {
        id: String(Date.now()),
        ...formData,
        imageUrl: imagePreview || undefined,
        sectorId: user?.sectorId || '1',
        userId: user?.id || '2',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setClients((prev) => [...prev, newClient]);
      toast({
        title: 'Cliente cadastrado!',
        description: 'O novo cliente foi adicionado com sucesso.',
      });
    }

    setIsDialogOpen(false);
    resetForm();
  };

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

  const stats = [
    {
      title: 'Meus Clientes',
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
              Meus Clientes
            </h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-2">
              <Sun className="w-4 h-4 text-secondary" />
              Setor: <span className="font-medium text-foreground">{sectorName}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Zap className="w-4 h-4 text-primary" />
              {user?.name}
            </div>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="hero" onClick={() => handleOpenDialog()}>
                  <Plus className="w-4 h-4" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}
                  </DialogTitle>
                  <DialogDescription>
                    {editingClient
                      ? 'Atualize as informações do cliente'
                      : 'Preencha os dados do novo cliente'}
                  </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Nome *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Nome completo"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        placeholder="email@exemplo.com"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cpf">CPF *</Label>
                      <Input
                        id="cpf"
                        value={formData.cpf}
                        onChange={(e) =>
                          setFormData({ ...formData, cpf: e.target.value })
                        }
                        placeholder="000.000.000-00"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="phone">Telefone *</Label>
                      <Input
                        id="phone"
                        value={formData.phone}
                        onChange={(e) =>
                          setFormData({ ...formData, phone: e.target.value })
                        }
                        placeholder="(00) 00000-0000"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="status">Status</Label>
                    <Select
                      value={formData.status}
                      onValueChange={(value: 'pending' | 'approved' | 'rejected') =>
                        setFormData({ ...formData, status: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="rejected">Reprovado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="observations">Observações</Label>
                    <Textarea
                      id="observations"
                      value={formData.observations}
                      onChange={(e) =>
                        setFormData({ ...formData, observations: e.target.value })
                      }
                      placeholder="Anotações sobre o cliente..."
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Anexo (Imagem)</Label>
                    <div className="border-2 border-dashed rounded-lg p-4 text-center hover:border-primary/50 transition-colors">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        className="hidden"
                        id="image-upload"
                      />
                      <label
                        htmlFor="image-upload"
                        className="cursor-pointer flex flex-col items-center gap-2"
                      >
                        {imagePreview ? (
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="max-w-full h-32 object-cover rounded"
                          />
                        ) : (
                          <>
                            <Upload className="w-8 h-8 text-muted-foreground" />
                            <span className="text-sm text-muted-foreground">
                              Clique para fazer upload
                            </span>
                          </>
                        )}
                      </label>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" variant="hero">
                      {editingClient ? 'Salvar Alterações' : 'Cadastrar'}
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className="glass-card hover:shadow-lg transition-shadow">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl sm:text-3xl font-display font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-2 sm:p-3 rounded-xl ${stat.bg}`}>
                    <stat.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Clients Table */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl">Lista de Clientes</CardTitle>
            <CardDescription>
              Gerencie os clientes cadastrados por você
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead>Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">{client.name}</p>
                          <p className="text-sm text-muted-foreground">{client.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{client.cpf}</TableCell>
                      <TableCell>{client.phone}</TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <p className="text-sm text-muted-foreground truncate">
                          {client.observations || '-'}
                        </p>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(client)}
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Editar
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {clients.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhum cliente cadastrado</p>
                  <p className="text-sm mt-1">Clique em "Novo Cliente" para começar</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;
