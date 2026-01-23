import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  Plus,
  Search,
  Filter,
  Eye,
  X,
  Mail,
  Phone,
  Hash,
  FileCheck,
  ImageIcon,
  FileText,
  ExternalLink,
  Copy,
  ZoomIn, 
  ZoomOut, 
  Download,
  ShieldCheck,
  Upload,
  Edit,
  Eraser,
  CalendarDays,
  RefreshCw,
  Trash2,
  FileSignature, 
  Calculator,
  Factory
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const AdminDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const api = useApi();
  const isSupervisor = user?.role === 'supervisor';
  const isAdmin = user?.role === 'admin';

  // --- ESTADOS DE DADOS REAIS ---
  const [clients, setClients] = useState<Client[]>([]);
  const [dbSectors, setDbSectors] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbUsinas, setDbUsinas] = useState<any[]>([]); 
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>(
    isSupervisor && user?.sectorId ? user.sectorId.toString() : 'all'
  );
  const [userFilter, setUserFilter] = useState<string>('all');
  const [usinaFilter, setUsinaFilter] = useState<string>('all');

  const loadAllData = async () => {
    try {
      const [clientsData, sectorsData, usersData, usinasData] = await Promise.all([
        api.get('/clientes.php'),
        api.get('/setores.php'),
        api.get('/usuarios.php'),
        api.get('/usinas.php')
      ]);
      setClients(clientsData || []);
      setDbSectors(sectorsData || []);
      setDbUsers(usersData || []);
      setDbUsinas(usinasData || []);
    } catch (error) {
      toast({ title: "Erro de Conexão", description: "Não foi possível carregar os dados.", variant: "destructive" });
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    if (!isSupervisor) setSectorFilter('all');
    setUserFilter('all');
    setUsinaFilter('all');
  };

  const [viewingClientDetails, setViewingClientDetails] = useState<Client | null>(null);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  const fileInputDocRef = useRef<HTMLInputElement>(null);
  const fileInputLuzRef = useRef<HTMLInputElement>(null);
  const fileInputExtraRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    sectorId: '',
    usinaId: '', 
    userId: '',
    observations: '',
    status: 'pending' as any,
    createdAt: '',
    updatedAt: '',
    imageUrl: '', 
    imageUrl2: '', 
    imageUrl3: '', 
  });

  useEffect(() => {
    if (!editingClient && isFormOpen) {
        setFormData(prev => ({
            ...prev,
            sectorId: isSupervisor ? user?.sectorId || '' : prev.sectorId
        }));
    }
  }, [isSupervisor, user, isFormOpen, editingClient]);

  const formatCPF = (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  const formatPhone = (value: string) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');

  const toInputDate = (dateStr: string) => {
    if (!dateStr) return '';
    try {
      const date = new Date(dateStr.replace(' ', 'T'));
      return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
    } catch (e) {
      return '';
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'imageUrl2' | 'imageUrl3') => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({ title: "Arquivo muito grande", description: "O tamanho máximo permitido é de 20MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const isPdf = (dataUrl: string) => dataUrl?.startsWith('data:application/pdf') || dataUrl?.endsWith('.pdf');

  const handleOpenForm = (client?: Client) => {
    if (client) {
        setEditingClient(client);
        setFormData({
            name: client.name,
            email: client.email || '',
            cpf: client.cpf,
            phone: client.phone || '',
            sectorId: client.sectorId || '',
            usinaId: (client as any).usinaId || '', 
            userId: client.userId || '',
            observations: client.observations || '',
            status: client.status,
            createdAt: toInputDate(client.createdAt),
            updatedAt: client.updatedAt || '',
            imageUrl: client.imageUrl || '',
            imageUrl2: (client as any).imageUrl2 || '',
            imageUrl3: (client as any).imageUrl3 || '',
        });
    } else {
        setEditingClient(null);
        setFormData({
            name: '',
            email: '',
            cpf: '',
            phone: '',
            sectorId: isSupervisor ? user?.sectorId || '' : '',
            usinaId: '',
            userId: isAdmin ? user?.id || '' : '', 
            observations: '',
            status: 'pending',
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: '',
            imageUrl: '',
            imageUrl2: '',
            imageUrl3: '',
        });
    }
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const mysqlTime = now.toLocaleTimeString('pt-BR', { hour12: false }); 
    const mysqlDate = now.toISOString().split('T')[0];
    const mysqlNow = `${mysqlDate} ${mysqlTime}`;

    let finalUserId = formData.userId || user?.id;
    const originalTime = editingClient?.createdAt?.split(' ')[1] || mysqlTime;
    const finalCreatedAt = formData.createdAt ? `${formData.createdAt} ${originalTime}` : mysqlNow;

    const payload = {
        ...formData,
        id: editingClient?.id,
        userId: finalUserId,
        createdAt: finalCreatedAt,
        updatedAt: mysqlNow,
        sectorId: (formData.sectorId === '' || formData.sectorId === 'all') ? null : formData.sectorId,
        usinaId: (formData.usinaId === '' || formData.usinaId === 'all') ? null : formData.usinaId
    };

    try {
        const endpoint = editingClient ? '/clientes.php?action=update' : '/clientes.php?action=create';
        const response = await api.post(endpoint, payload);
        
        if (response && response.success !== false) {
            toast({ title: 'Sucesso', description: 'Dados gravados com sucesso.' });
            loadAllData();
            setIsFormOpen(false);
        }
    } catch (err) {
        toast({ title: "Erro ao salvar", description: "Verifique a API e o banco de dados.", variant: "destructive" });
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (!isAdmin) {
      toast({ title: "Acesso Negado", description: "Apenas administradores podem excluir registros.", variant: "destructive" });
      return;
    }
    try {
      const response = await api.delete(`/clientes.php?id=${id}`, { id: id });
      
      if (response && (response.success === true || response.message)) {
        toast({ title: "Excluído", description: "Cliente removido com sucesso." });
        loadAllData();
      } else {
        toast({ title: "Erro", description: response.error || "Erro no servidor ao excluir.", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Erro de Conexão", description: "Verifique se o arquivo clientes.php está atualizado no servidor.", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if(!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `${label} copiado.` });
  };

  // --- LÓGICA DE FILTRAGEM ---
  const filteredClients = useMemo(() => {
    return clients.filter((client) => {
      if (isSupervisor && client.sectorId?.toString() !== user?.sectorId?.toString()) return false;

      let matchesSearch = true;
      if (searchTerm) {
        const termLower = searchTerm.toLowerCase();
        if (termLower.startsWith('#')) {
          matchesSearch = client.id.toString() === termLower.replace('#', '');
        } else {
          const cleanCPF = client.cpf.replace(/\D/g, '');
          const cleanSearch = termLower.replace(/\D/g, '');
          const cpfMatch = cleanCPF.includes(cleanSearch) && cleanSearch !== '';
          const nameMatch = client.name.toLowerCase().includes(termLower);
          matchesSearch = nameMatch || cpfMatch;
        }
      }

      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
      const matchesSector = sectorFilter === 'all' || client.sectorId?.toString() === sectorFilter.toString();
      const matchesUser = userFilter === 'all' || client.userId?.toString() === userFilter.toString();
      const matchesUsina = usinaFilter === 'all' || (client as any).usinaId?.toString() === usinaFilter.toString();

      return matchesSearch && matchesStatus && matchesSector && matchesUser && matchesUsina;
    });
  }, [clients, searchTerm, statusFilter, sectorFilter, userFilter, usinaFilter, isSupervisor, user]);

  const availableConsultants = useMemo(() => {
    if (isSupervisor) return dbUsers.filter(u => u.sectorId?.toString() === user?.sectorId?.toString());
    if (sectorFilter === 'all') return dbUsers.filter(u => u.role === 'user');
    return dbUsers.filter(u => u.sectorId?.toString() === sectorFilter.toString());
  }, [dbUsers, sectorFilter, isSupervisor, user]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sectorFilter, userFilter, usinaFilter]);

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, '...', totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, '...', totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages);
      }
    }
    return pages;
  };

  const stats = useMemo(() => [
    { title: 'Total', value: filteredClients.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10', borderClass: 'border-l-primary' },
    { title: 'Formalizados', value: filteredClients.filter((c) => c.status === 'formalized').length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100', borderClass: 'border-l-emerald-500' },
    { title: 'Pendentes', value: filteredClients.filter((c) => c.status === 'pending').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', borderClass: 'border-l-orange-500' },
    { title: 'Ag. Formalização', value: filteredClients.filter((c) => c.status === 'waiting_formalization').length, icon: FileSignature, color: 'text-blue-600', bg: 'bg-blue-100', borderClass: 'border-l-blue-500' },
  ], [filteredClients]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'formalized': return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 border-none shadow-sm">Formalizado</Badge>;
      case 'waiting_formalization': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 border-none shadow-sm">Ag. Formalização</Badge>;
      default: return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none shadow-sm">Pendente</Badge>;
    }
  };

  const getSectorName = (id: any) => {
    if (!id || id === '0' || id === null) return '-'; 
    return dbSectors.find(s => s.id.toString() === id.toString())?.name || '-';
  };

  const getUsinaName = (id: any) => {
    if (!id || id === '0' || id === null) return '-'; 
    return dbUsinas.find(u => u.id.toString() === id.toString())?.name || '-';
  };

  const getUserName = (id: any) => dbUsers.find(u => u.id.toString() === id?.toString())?.name || 'N/A';

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              {isSupervisor ? `Gestão - ${getSectorName(user?.sectorId)}` : 'Clientes cadastrados'}
            </h1>
            <p className="text-muted-foreground mt-1">Gerencie clientes do sistema</p>
          </div>

          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" className="shadow-lg h-10" onClick={() => handleOpenForm()}>
                <Plus className="w-4 h-4 mr-2" /> Novo Cliente
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle>{editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</DialogTitle>
                <DialogDescription>Preencha as informações do cliente.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {isAdmin && (
                     <div className="space-y-2 p-3 bg-muted/40 rounded-lg border border-dashed">
                       <Label htmlFor="createdAt" className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                         <CalendarDays className="w-3.5 h-3.5" /> Cadastro
                       </Label>
                       <Input id="createdAt" type="date" className="h-8 text-sm" value={formData.createdAt} onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })} />
                     </div>
                   )}

                   {editingClient && isAdmin && (
                     <div className="space-y-2 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800">
                       <Label className="flex items-center gap-2 text-xs font-bold uppercase text-blue-600 dark:text-blue-400">
                         <RefreshCw className="w-3.5 h-3.5" /> Última Atualização
                       </Label>
                       <div className="h-8 flex items-center text-xs font-semibold text-blue-700 dark:text-blue-300">
                         {formData.updatedAt ? format(new Date(formData.updatedAt.replace(' ', 'T')), "dd/MM/yy 'às' HH:mm") : 'Sem registros'}
                       </div>
                     </div>
                   )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Nome completo" disabled={!!editingClient && isSupervisor} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })} required maxLength={14} placeholder="000.000.000-00" disabled={!!editingClient && isSupervisor} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" disabled={!!editingClient && isSupervisor} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })} maxLength={15} placeholder="(00) 00000-0000" disabled={!!editingClient && isSupervisor} />
                  </div>
                </div>

                {editingClient && (
                  <div className="space-y-2 bg-muted/50 p-4 rounded-lg border border-border shadow-sm">
                    <Label htmlFor="status" className="flex items-center gap-2 font-semibold text-sm">Alterar Status</Label>
                    <Select value={formData.status} onValueChange={(val: any) => setFormData({ ...formData, status: val })}>
                      <SelectTrigger className="bg-background h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="waiting_formalization">Aguardando Formalização</SelectItem>
                        <SelectItem value="formalized">Formalizado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {!isSupervisor && (
                    <div className="space-y-2">
                        <Label htmlFor="sector">Setor</Label>
                        <Select value={formData.sectorId?.toString() || ""} onValueChange={(val) => setFormData({ ...formData, sectorId: val, userId: '' })}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Selecione o setor" /></SelectTrigger>
                        <SelectContent>{dbSectors.map((sector) => (<SelectItem key={sector.id} value={sector.id.toString()}>{sector.name}</SelectItem>))}</SelectContent>
                        </Select>
                    </div>
                  )}

                  <div className={cn("space-y-2", isSupervisor && "sm:col-span-2")}>
                    <Label htmlFor="user">Consultor Responsável</Label>
                    <Select value={formData.userId?.toString() || ""} onValueChange={(val) => setFormData({ ...formData, userId: val })} disabled={!formData.sectorId || (isSupervisor && !!editingClient)}>
                      <SelectTrigger className="h-9"><SelectValue placeholder={formData.sectorId ? "Escolha o consultor" : "Defina o setor"} /></SelectTrigger>
                      <SelectContent>
                        {dbUsers.filter(u => u.sectorId?.toString() === formData.sectorId?.toString() && (u.role === 'user' || u.role === 'supervisor'))
                            .map((user) => (<SelectItem key={user.id} value={user.id.toString()}>{user.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label htmlFor="usina">Usina Vinculada</Label>
                    <Select value={formData.usinaId?.toString() || ""} onValueChange={(val) => setFormData({ ...formData, usinaId: val })}>
                      <SelectTrigger className="h-9"><SelectValue placeholder="Selecione a usina" /></SelectTrigger>
                      <SelectContent>
                        {dbUsinas.map((usina) => (<SelectItem key={usina.id} value={usina.id.toString()}>{usina.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="obs">Observações</Label>
                  <Textarea id="obs" value={formData.observations} onChange={(e) => setFormData({ ...formData, observations: e.target.value })} placeholder="Informações adicionais..." className="min-h-[80px]" />
                </div>

                <div className="space-y-3">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Documentação (Máx. 20MB)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Documento Cliente", field: "imageUrl" as const, ref: fileInputDocRef },
                      { label: "Conta de Luz", field: "imageUrl2" as const, ref: fileInputLuzRef },
                      { label: "Arquivo Adicional", field: "imageUrl3" as const, ref: fileInputExtraRef }
                    ].map((item) => (
                      <div key={item.field} className="relative group">
                        <input type="file" ref={item.ref} className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, item.field)} />
                        <Button 
                          type="button" 
                          variant={formData[item.field] ? "hero" : "outline"} 
                          className={cn(
                            "w-full h-12 text-[9px] flex flex-col items-center justify-center gap-1 uppercase font-bold transition-all px-1",
                            formData[item.field] && "border-emerald-500 text-white"
                          )}
                          onClick={() => item.ref.current?.click()}
                        >
                          {formData[item.field] ? <FileCheck className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                          <span className="truncate w-full text-center">{item.label}</span>
                        </Button>
                        
                        {formData[item.field] && (
                          <button 
                            type="button" 
                            onClick={() => setFormData(prev => ({ ...prev, [item.field]: '' }))}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <DialogFooter className="pt-2">
                  <Button type="button" variant="outline" onClick={() => setIsFormOpen(false)}>Cancelar</Button>
                  <Button type="submit" variant="hero" className="min-w-[100px]">{editingClient ? 'Salvar Alterações' : 'Cadastrar'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className={cn("glass-card hover:shadow-lg transition-shadow border-l-4", stat.borderClass)}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-3xl font-display font-bold mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.bg}`}><stat.icon className={`w-6 h-6 ${stat.color}`} /></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-muted/40 border-muted-foreground/20 shadow-sm w-full">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-bold shrink-0"><Filter className="w-4 h-4" /> Filtros:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-1 gap-3 w-full">
                {!isSupervisor && (
                  <div className="w-full lg:flex-1">
                    <Select value={sectorFilter} onValueChange={(v) => { setSectorFilter(v); setUserFilter('all'); }}>
                      <SelectTrigger className="bg-background h-10"><SelectValue placeholder="Setor" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Todos Setores</SelectItem>{dbSectors.map((s) => (<SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                )}
                
                {/* BOTÃO CONDICIONAL: APARECE AO SELECIONAR UM SETOR OU SE FOR SUPERVISOR */}
                {(sectorFilter !== 'all' || isSupervisor) && (
                  <div className="w-full lg:flex-1 animate-in fade-in zoom-in duration-200">
                    <Select value={userFilter} onValueChange={setUserFilter}>
                      <SelectTrigger className="bg-background h-10"><SelectValue placeholder="Consultor" /></SelectTrigger>
                      <SelectContent><SelectItem value="all">Todos Consultores</SelectItem>{availableConsultants.map((u) => (<SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>))}</SelectContent>
                    </Select>
                  </div>
                )}

                <div className="w-full lg:flex-1">
                  <Select value={usinaFilter} onValueChange={setUsinaFilter}>
                    <SelectTrigger className="bg-background h-10"><SelectValue placeholder="Todas Usinas" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">Todas Usinas</SelectItem>{dbUsinas.map((u) => (<SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>))}</SelectContent>
                  </Select>
                </div>

                <div className="w-full lg:flex-1">
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="bg-background h-10"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent><SelectItem value="all">Todos Status</SelectItem><SelectItem value="pending">Pendente</SelectItem><SelectItem value="waiting_formalization">Ag. Formalização</SelectItem><SelectItem value="formalized">Formalizado</SelectItem></SelectContent>
                  </Select>
                </div>
                <div className="w-full lg:flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Nome, CPF ou #ID" className="pl-9 h-10" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                </div>
                <Button variant="ghost" size="icon" onClick={clearFilters} className="h-10 w-10 shrink-0 border hover:bg-destructive/10 hover:text-destructive"><Eraser className="w-5 h-5" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Consultor(a)</TableHead>
                    <TableHead>Usina</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observação</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="text-[11px] font-semibold truncate text-muted-foreground">#{client.id}</TableCell>
                      <TableCell className="text-xs font-medium">{client.createdAt ? format(new Date(client.createdAt.replace(' ', 'T')), "dd/MM/yyyy") : '-'}</TableCell>
                      <TableCell>
                        <div className="flex flex-col min-w-[150px]">
                          <span className="font-medium text-sm truncate">{client.name}</span>
                          <span className="text-[10px] text-muted-foreground truncate">{client.email || 'Sem email'}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-[11px] font-semibold truncate text-muted-foreground">{client.cpf}</TableCell>
                      <TableCell className="text-[11px] font-semibold truncate text-muted-foreground">{client.phone || '-'}</TableCell>
                      <TableCell className="text-xs font-medium">{getUserName(client.userId)}</TableCell>
                      <TableCell className="text-xs font-bold text-muted-foreground">{getUsinaName((client as any).usinaId)}</TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell>
                        <div className="max-w-[150px] truncate text-[10px] text-muted-foreground" title={client.observations}>
                          {client.observations || '-'}
                        </div>
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewingClientDetails(client)} title="Ver Detalhes"><Eye className="w-4 h-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenForm(client)} title="Editar" className="text-muted-foreground hover:text-amber-600"><Edit className="w-4 h-4" /></Button>
                            {isAdmin && (
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" title="Excluir" className="text-muted-foreground hover:text-red-600 hover:bg-red-50">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>Excluir Cliente?</AlertDialogTitle>
                                    <AlertDialogDescription>Esta ação não pode ser desfeita.</AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteClient(client.id)} className="bg-red-600">Confirmar</AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              {filteredClients.length === 0 && (<div className="text-center py-12 text-muted-foreground"><Users className="w-12 h-12 mx-auto mb-4 opacity-50" /><p>Nenhum cliente encontrado</p></div>)}
            </div>
            {filteredClients.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem><PaginationPrevious onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>
                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>{page === '...' ? (<PaginationEllipsis />) : (<PaginationLink isActive={currentPage === page} onClick={() => typeof page === 'number' && setCurrentPage(page)} className="cursor-pointer">{page}</PaginationLink>)}</PaginationItem>
                    ))}
                    <PaginationItem><PaginationNext onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* --- CARD DETALHES --- */}
        <Dialog open={!!viewingClientDetails} onOpenChange={() => setViewingClientDetails(null)}>
            <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-background border border-border shadow-2xl rounded-2xl [&>button]:hidden">
              <DialogHeader className="sr-only"><DialogTitle>Detalhes</DialogTitle></DialogHeader>
              {viewingClientDetails && (
                <div className="flex flex-col h-full">
                    <div className="relative bg-zinc-50/80 dark:bg-zinc-900/50 p-6 border-b border-border/60">
                         <div className="absolute top-4 right-4 z-50">
                            <Button variant="ghost" size="icon" onClick={() => setViewingClientDetails(null)} className="rounded-full bg-zinc-200/50 hover:bg-emerald-500 hover:text-white transition-all w-9 h-9"><X className="w-5 h-5" /></Button>
                         </div>
                         <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                            <div className="text-center sm:text-left space-y-1 mt-1">
                                <h2 className="text-2xl font-bold tracking-tight text-foreground">{viewingClientDetails.name}</h2>
                                <div className="text-sm text-muted-foreground flex flex-wrap items-center justify-center sm:justify-start gap-1">
                                    <span className="text-sm font-semibold truncate text-foreground">ID: {viewingClientDetails.id}</span>
                                    <span className="mx-1">•</span>
                                    <span>{getSectorName(viewingClientDetails.sectorId)}</span>
                                    <span className="mx-1">•</span>
                                    <span className="font-bold text-primary">Usina: {getUsinaName((viewingClientDetails as any).usinaId)}</span>
                                </div>
                            </div>
                         </div>
                    </div>
                    <div className="p-6 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="group relative p-3 rounded-xl border bg-card cursor-pointer shadow-sm" onClick={() => copyToClipboard(viewingClientDetails.email || '', 'Email')}>
                                <div className="flex items-center gap-2 mb-1.5 text-muted-foreground"><Mail className="w-4 h-4" /> <span className="text-xs font-medium uppercase">Email</span></div>
                                <p className="text-sm font-semibold text-foreground break-all">{viewingClientDetails.email || '-'}</p>
                                <Copy className="w-3 h-3 absolute top-3 right-3 opacity-0 group-hover:opacity-40" />
                            </div>
                            <div className="group relative p-3 rounded-xl border bg-card cursor-pointer shadow-sm" onClick={() => copyToClipboard(viewingClientDetails.phone || '', 'Telefone')}>
                                <div className="flex items-center gap-2 mb-1.5 text-muted-foreground"><Phone className="w-4 h-4" /> <span className="text-xs font-medium uppercase">Telefone</span></div>
                                <p className="text-sm font-semibold truncate text-foreground">{viewingClientDetails.phone || '-'}</p>
                                <Copy className="w-3 h-3 absolute top-3 right-3 opacity-0 group-hover:opacity-40" />
                            </div>
                            <div className="group relative p-3 rounded-xl border bg-card cursor-pointer shadow-sm" onClick={() => copyToClipboard(viewingClientDetails.cpf, 'CPF')}>
                                <div className="flex items-center gap-2 mb-1.5 text-muted-foreground"><Hash className="w-4 h-4" /> <span className="text-xs font-medium uppercase">CPF</span></div>
                                <p className="text-sm font-semibold truncate text-foreground">{viewingClientDetails.cpf}</p>
                                <Copy className="w-3 h-3 absolute top-3 right-3 opacity-0 group-hover:opacity-40" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-3">
                                <div className="flex items-center gap-3">
                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary"><ShieldCheck className="w-5 h-5" /></div>
                                    <div><p className="text-[10px] font-bold text-primary/80 uppercase">Consultor Resp.</p><p className="text-sm font-bold text-foreground">{getUserName(viewingClientDetails.userId)}</p></div>
                                </div>
                                <div className="text-xs text-muted-foreground pt-2 border-t border-primary/10 flex items-center gap-2"><Clock className="w-3 h-3" /> Cadastrado em {viewingClientDetails.createdAt}</div>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><FileCheck className="w-3.5 h-3.5" /> Observações Internas</Label>
                                <div className="bg-zinc-50/50 p-4 rounded-xl border border-dashed text-sm text-foreground/80 min-h-[100px] leading-relaxed">{viewingClientDetails.observations || <span className="text-muted-foreground/50 italic">Sem observações registradas.</span>}</div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <Label className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground"><ImageIcon className="w-3.5 h-3.5" /> Documentos Vinculados</Label>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                              {[
                                { label: "Documento", url: viewingClientDetails.imageUrl },
                                { label: "Conta Luz", url: (viewingClientDetails as any).imageUrl2 },
                                { label: "Adicional", url: (viewingClientDetails as any).imageUrl3 }
                              ].map((doc, idx) => (
                                doc.url ? (
                                  <div 
                                    key={idx} 
                                    className="group relative h-24 bg-zinc-50 rounded-xl border flex flex-col items-center justify-center cursor-pointer hover:border-emerald-500 hover:bg-emerald-50/30 transition-all shadow-sm" 
                                    onClick={() => setViewingFile(doc.url!)}
                                  >
                                    <div className="text-zinc-400 group-hover:text-emerald-600 transition-colors">
                                      {isPdf(doc.url) ? <FileText className="w-8 h-8" /> : <ImageIcon className="w-8 h-8" />}
                                    </div>
                                    <span className="text-[10px] font-bold mt-1 uppercase text-zinc-500">{doc.label}</span>
                                    <ExternalLink className="w-3 h-3 absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-emerald-600 transition-opacity" />
                                  </div>
                                ) : (
                                  <div key={idx} className="h-24 border border-dashed rounded-xl flex items-center justify-center bg-zinc-50/30 text-[9px] text-muted-foreground uppercase font-medium">Sem {doc.label}</div>
                                )
                              ))}
                            </div>
                        </div>
                    </div>
                    <div className="p-4 bg-zinc-50/50 border-t flex justify-end"><Button variant="outline" onClick={() => setViewingClientDetails(null)} className="px-6 rounded-lg">Fechar Ficha</Button></div>
                </div>
              )}
            </DialogContent>
        </Dialog>

        <Dialog open={!!viewingFile} onOpenChange={(open) => !open && setViewingFile(null)}>
            <DialogContent className="fixed !left-0 !top-0 !translate-x-0 !translate-y-0 w-screen h-screen max-w-none p-0 bg-black/90 backdrop-blur-md border-none z-[100] flex items-center justify-center">
                <div className="relative w-full h-full flex flex-col items-center justify-center">
                  <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 p-2 bg-black/80 backdrop-blur-md rounded-full border border-white/10">
                    {!isPdf(viewingFile || '') && (
                      <><Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 rounded-full" onClick={() => setZoomScale(s => Math.max(0.5, s - 0.25))}><ZoomOut className="w-4 h-4" /></Button>
                      <span className="text-xs font-medium text-white w-12 text-center select-none">{Math.round(zoomScale * 100)}%</span>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 rounded-full" onClick={() => setZoomScale(s => Math.min(3, s + 0.25))}><ZoomIn className="w-4 h-4" /></Button>
                      <div className="w-px h-4 bg-white/20 mx-1" /></>
                    )}
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 rounded-full" onClick={() => { const l = document.createElement('a'); l.href = viewingFile || ''; l.download = `doc-${Date.now()}`; l.click(); }}><Download className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-emerald-500 h-8 w-8 rounded-full" onClick={() => setViewingFile(null)}><X className="w-4 h-4" /></Button>
                  </div>
                  {viewingFile && (isPdf(viewingFile) ? (<div className="w-[90%] h-[90%] bg-white rounded-lg overflow-hidden"><object data={viewingFile} type="application/pdf" className="w-full h-full" /></div>) : (<img src={viewingFile} alt="Preview" className="max-w-full max-h-full transition-transform" style={{ transform: `scale(${zoomScale})` }} />))}
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;