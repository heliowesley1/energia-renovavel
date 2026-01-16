import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockClients, mockSectors } from '@/data/mockData';
import type { Client } from '@/types';
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
  Plus,
  Edit,
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
    status: 'pending' as 'pending' | 'approved' | 'rejected', // Default value, but managed by logic
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      cpf: '',
      phone: '',
      observations: '',
      status: 'pending',
    });
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
      // Edição: Permite alterar status
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
      toast({ title: 'Cliente atualizado!' });
    } else {
      // Criação: Força status 'pending'
      const newClient: Client = {
        id: String(Date.now()),
        ...formData,
        status: 'pending', // FORÇA PENDENTE NO CADASTRO
        imageUrl: imagePreview || undefined,
        sectorId: user?.sectorId || '1',
        userId: user?.id || '2',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      setClients((prev) => [...prev, newClient]);
      toast({ title: 'Cliente cadastrado!', description: 'Enviado para análise (Status Pendente).' });
    }

    setIsDialogOpen(false);
    resetForm();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="success">Aprovado</Badge>;
      case 'rejected': return <Badge variant="rejected">Reprovado</Badge>;
      default: return <Badge variant="pending">Pendente</Badge>;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Gerenciar Meus Clientes
            </h1>
            <p className="text-muted-foreground mt-1">
              Lista completa dos seus cadastros
            </p>
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
                  {editingClient ? 'Atualize as informações.' : 'Preencha os dados. O status será definido como Pendente.'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input id="cpf" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: e.target.value })} required />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone *</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
                  </div>
                </div>

                {/* SÓ MOSTRA O SELETOR DE STATUS SE ESTIVER EDITANDO */}
                {editingClient && (
                  <div className="space-y-2 bg-muted/30 p-3 rounded-lg border border-dashed">
                    <Label htmlFor="status" className="flex items-center gap-2">
                      Status <span className="text-xs text-muted-foreground font-normal">(Disponível apenas em edição)</span>
                    </Label>
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
                )}

                <div className="space-y-2">
                  <Label htmlFor="observations">Observações</Label>
                  <Textarea id="observations" value={formData.observations} onChange={(e) => setFormData({ ...formData, observations: e.target.value })} />
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" variant="hero">{editingClient ? 'Salvar' : 'Cadastrar'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="text-xl">Lista de Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Status</TableHead>
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
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleOpenDialog(client)}>
                          <Edit className="w-4 h-4 mr-1" /> Editar
                        </Button>
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

export default UserDashboard;