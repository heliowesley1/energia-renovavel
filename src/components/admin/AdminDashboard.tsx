import React, { useState, useRef, useEffect } from 'react';
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
  const isCommonUser = user?.role === 'user';

  // --- ESTADOS DE DADOS REAIS ---
  const [clients, setClients] = useState<Client[]>([]);
  const [dbSectors, setDbSectors] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [sectorFilter, setSectorFilter] = useState<string>(
    isSupervisor && user?.sectorId ? user.sectorId : 'all'
  );
  const [userFilter, setUserFilter] = useState<string>('all');

  const loadAllData = async () => {
    try {
      const [clientsData, sectorsData, usersData] = await Promise.all([
        api.get('/clientes.php'),
        api.get('/setores.php'),
        api.get('/usuarios.php')
      ]);
      setClients(clientsData || []);
      setDbSectors(sectorsData || []);
      setDbUsers(usersData || []);
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
    if (!isSupervisor) {
      setSectorFilter('all');
    }
    setUserFilter('all');
    toast({ 
      title: "Filtros limpos", 
      description: "A listagem foi resetada para o padrão.",
    });
  };

  const [viewingClientDetails, setViewingClientDetails] = useState<Client | null>(null);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    sectorId: '',
    userId: '',
    observations: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected',
    createdAt: '',
    updatedAt: '',
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

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({ title: "Arquivo muito grande", description: "O tamanho máximo permitido é de 20MB.", variant: "destructive" });
        if (fileInputRef.current) fileInputRef.current.value = '';
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isPdf = (dataUrl: string) => dataUrl.startsWith('data:application/pdf') || dataUrl.endsWith('.pdf');

  const handleOpenForm = (client?: Client) => {
    if (client) {
        setEditingClient(client);
        setFormData({
            name: client.name,
            email: client.email || '',
            cpf: client.cpf,
            phone: client.phone || '',
            sectorId: client.sectorId || '',
            userId: client.userId || '',
            observations: client.observations || '',
            status: client.status,
            createdAt: toInputDate(client.createdAt),
            updatedAt: client.updatedAt || '',
        });
        setFilePreview(client.imageUrl || null);
    } else {
        setEditingClient(null);
        setFormData({
            name: '',
            email: '',
            cpf: '',
            phone: '',
            sectorId: isSupervisor ? user?.sectorId || '' : '',
            userId: isAdmin ? user?.id || '' : '', 
            observations: '',
            status: 'pending',
            createdAt: new Date().toISOString().split('T')[0],
            updatedAt: '',
        });
        setFilePreview(null);
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
        imageUrl: filePreview,
        createdAt: finalCreatedAt,
        updatedAt: mysqlNow,
        sectorId: (formData.sectorId === '' || formData.sectorId === 'all') ? null : formData.sectorId
    };

    try {
        const endpoint = editingClient ? '/clientes.php?action=update' : '/clientes.php?action=create';
        const response = await api.post(endpoint, payload);
        
        if (response && response.success !== false) {
            toast({ title: 'Sucesso', description: 'Dados gravados com sucesso.' });
            loadAllData();
            setIsFormOpen(false);
            setFilePreview(null);
        }
    } catch (err) {
        toast({ title: "Erro ao salvar", description: "Verifique a API e o banco de dados.", variant: "destructive" });
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    if(!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `${label} copiado.` });
  };

  const filteredClients = clients.filter((client) => {
    if (isSupervisor && client.sectorId !== user?.sectorId) return false;

    let matchesSearch = true;
    if (searchTerm) {
      const termLower = searchTerm.toLowerCase();
      const nameMatch = client.name.toLowerCase().includes(termLower);
      const cpfMatch = client.cpf.replace(/\D/g, '').includes(termLower.replace(/\D/g, ''));
      const idMatch = client.id.toString().includes(termLower.replace('#', ''));
      matchesSearch = nameMatch || cpfMatch || idMatch;
    }

    const matchesStatus = statusFilter === 'all' || client.status === statusFilter;
    const matchesSector = sectorFilter === 'all' || client.sectorId?.toString() === sectorFilter.toString();
    const matchesUser = userFilter === 'all' || client.userId?.toString() === userFilter.toString();

    return matchesSearch && matchesStatus && matchesSector && matchesUser;
  });

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, sectorFilter, userFilter]);

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

  const statsSource = isSupervisor ? clients.filter(c => c.sectorId === user?.sectorId) : clients;

  const stats = [
    { title: 'Total', value: statsSource.length, icon: Users, color: 'text-primary', bg: 'bg-primary/10', borderClass: 'border-l-primary' },
    { title: 'Aprovados', value: statsSource.filter((c) => c.status === 'approved').length, icon: UserCheck, color: 'text-emerald-600', bg: 'bg-emerald-100', borderClass: 'border-l-emerald-500' },
    { title: 'Pendentes', value: statsSource.filter((c) => c.status === 'pending').length, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-100', borderClass: 'border-l-orange-500' },
    { title: 'Reprovados', value: statsSource.filter((c) => c.status === 'rejected').length, icon: UserX, color: 'text-red-600', bg: 'bg-red-100', borderClass: 'border-l-red-500' },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 border-none shadow-sm">Aprovado</Badge>;
      case 'rejected': return <Badge variant="destructive" className="bg-red-600 hover:bg-red-700 border-none shadow-sm">Reprovado</Badge>;
      default: return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none shadow-sm">Pendente</Badge>;
    }
  };

  const getSectorName = (id: any) => {
    if (!id || id === '0' || id === null) return '-'; 
    return dbSectors.find(s => s.id.toString() === id.toString())?.name || '-';
  };

  const getUserName = (id: any) => dbUsers.find(u => u.id.toString() === id?.toString())?.name || 'N/A';

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              {isSupervisor ? `Gestão - ${getSectorName(user?.sectorId)}` : 'Clientes cadastrados'}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isSupervisor ? 'Visualize os clientes do seu setor' : 'Gerencie clientes, setores e usuários do sistema'}
            </p>
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
                <DialogDescription>
                  Preencha as informações do cliente e defina o consultor responsável.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">

                {/* BLOCO DE DATAS - APENAS ADMIN ENXERGA O CAMPO DE REGISTRO */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                   {isAdmin && (
                     <div className="space-y-2 p-3 bg-muted/40 rounded-lg border border-dashed">
                       <Label htmlFor="createdAt" className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                         <CalendarDays className="w-3.5 h-3.5" /> Cadastro
                       </Label>
                       <Input 
                         id="createdAt" 
                         type="date"
                         className="h-8 text-sm"
                         value={formData.createdAt} 
                         onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })} 
                       />
                     </div>
                   )}

                   {editingClient && (
                     <div className={cn("space-y-2 p-3 bg-blue-50/50 dark:bg-blue-900/10 rounded-lg border border-blue-100 dark:border-blue-800", !isAdmin && "sm:col-span-2")}>
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
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      required 
                      placeholder="Nome completo"
                      disabled={!!editingClient && isSupervisor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input 
                      id="cpf" 
                      value={formData.cpf} 
                      onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })} 
                      required 
                      maxLength={14}
                      placeholder="000.000.000-00"
                      disabled={!!editingClient && isSupervisor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input 
                      id="email" 
                      type="email"
                      value={formData.email} 
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })} 
                      placeholder="email@exemplo.com"
                      disabled={!!editingClient && isSupervisor}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })} 
                      maxLength={15}
                      placeholder="(00) 00000-0000"
                      disabled={!!editingClient && isSupervisor}
                    />
                  </div>
                </div>

                {editingClient && (
                  <div className="space-y-2 bg-muted/50 p-4 rounded-lg border border-border shadow-sm">
                    <Label htmlFor="status" className="flex items-center gap-2 font-semibold text-sm">Alterar Status</Label>
                    <Select 
                      value={formData.status} 
                      onValueChange={(val: any) => setFormData({ ...formData, status: val })}
                    >
                      <SelectTrigger className="bg-background h-9"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pending">Pendente</SelectItem>
                        <SelectItem value="approved">Aprovado</SelectItem>
                        <SelectItem value="rejected">Reprovado</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {!isSupervisor && (
                    <div className="space-y-2">
                        <Label htmlFor="sector">Setor</Label>
                        <Select 
                          value={formData.sectorId?.toString() || ""}
                          onValueChange={(val) => setFormData({ ...formData, sectorId: val, userId: '' })}
                        >
                        <SelectTrigger className="h-9">
                            <SelectValue placeholder="Selecione o setor" />
                        </SelectTrigger>
                        <SelectContent>
                            {dbSectors.map((sector) => (
                            <SelectItem key={sector.id} value={sector.id.toString()}>{sector.name}</SelectItem>
                            ))}
                        </SelectContent>
                        </Select>
                    </div>
                  )}

                  <div className={cn("space-y-2", isSupervisor && "sm:col-span-2")}>
                    <Label htmlFor="user">Consultor Responsável</Label>
                    <Select 
                      value={formData.userId?.toString() || ""}
                      onValueChange={(val) => setFormData({ ...formData, userId: val })}
                      disabled={!formData.sectorId}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder={formData.sectorId ? "Escolha o consultor" : "Defina o setor"} />
                      </SelectTrigger>
                      <SelectContent>
                        {dbUsers
                            .filter(u => 
                              u.sectorId?.toString() === formData.sectorId?.toString() && 
                              (u.role === 'user' || u.role === 'supervisor')
                            )
                            .map((user) => (
                          <SelectItem key={user.id} value={user.id.toString()}>{user.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="obs">Observações</Label>
                  <Textarea 
                    id="obs"
                    value={formData.observations}
                    onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
                    placeholder="Informações adicionais..."
                    disabled={!!editingClient && isSupervisor}
                    className="min-h-[80px]"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase text-muted-foreground">Anexo (Máx. 20MB)</Label>
                  <div className="border border-dashed rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex flex-col items-center gap-3">
                      {!filePreview ? (
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full h-8 text-xs" disabled={!!editingClient && isSupervisor}>
                            <Upload className="w-3 h-3 mr-2" /> {editingClient ? "Substituir Arquivo" : "Anexar Arquivo"}
                        </Button>
                      ) : (
                        <div className="relative group w-full">
                          <div className={cn("relative w-full rounded-lg overflow-hidden border bg-background flex items-center justify-center", isPdf(filePreview) ? "h-20" : "h-32")}>
                            {isPdf(filePreview) ? (
                              <div className="flex flex-col items-center text-red-500">
                                <FileText className="w-8 h-8" />
                                <span className="text-[10px] font-medium text-muted-foreground mt-1">PDF</span>
                              </div>
                            ) : (
                              <img src={filePreview} alt="Preview" className="w-full h-full object-contain" />
                            )}
                          </div>
                          {!isSupervisor && (
                              <div className="flex items-center justify-between mt-2">
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center">
                                {isPdf(filePreview) ? <FileText className="w-3 h-3 mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />} ARQUIVO ATUAL
                                </span>
                                <Button type="button" variant="destructive" size="sm" className="h-6 px-2 text-[10px]" onClick={removeFile}>REMOVER</Button>
                            </div>
                          )}
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} disabled={!!editingClient && isSupervisor} />
                    </div>
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

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat) => (
            <Card key={stat.title} className={cn("glass-card hover:shadow-lg transition-shadow border-l-4", stat.borderClass)}>
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

        {/* Filters Section */}
        <Card className="glass-card">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="w-5 h-5" /> Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col lg:flex-row items-center gap-3 w-full">
              <div className="relative w-full lg:flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input 
                  placeholder="Nome, CPF ou ID." 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm pl-9 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" 
                  value={searchTerm} 
                  onChange={(e) => setSearchTerm(e.target.value)} 
                />
              </div>

              <div className="w-full lg:flex-1">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="approved">Aprovado</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="rejected">Reprovado</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {!isSupervisor && (
                <div className="w-full lg:flex-1">
                  <Select value={sectorFilter} onValueChange={setSectorFilter}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Setores</SelectItem>
                      {dbSectors.map((sector) => (
                        <SelectItem key={sector.id} value={sector.id.toString()}>{sector.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="w-full lg:flex-1">
                <Select value={userFilter} onValueChange={setUserFilter}>
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Funcionário" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Funcionários</SelectItem>
                    {dbUsers
                      .filter((u) => u.role === 'user' && (!isSupervisor || u.sectorId?.toString() === user?.sectorId?.toString()))
                      .map((u) => (
                        <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                variant="ghost" 
                size="icon" 
                onClick={clearFilters}
                className="text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-10 w-10 rounded-lg border border-input shadow-sm shrink-0"
                title="Limpar Filtros"
              >
                <Eraser className="w-5 h-5" />
              </Button>
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
                  Mostrando {filteredClients.length > 0 ? startIndex + 1 : 0} - {Math.min(startIndex + itemsPerPage, filteredClients.length)} de {filteredClients.length} cliente(s)
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
                    <TableHead>Cadastro</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Consultor</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="text-xs font-semibold text-muted-foreground">#{client.id}</TableCell>
                      <TableCell className="text-xs font-medium">
                        {client.createdAt ? format(new Date(client.createdAt.replace(' ', 'T')), "dd/MM/yyyy") : '-'}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[180px] truncate">
                          <p className="font-medium truncate">{client.name}</p>
                          <p className="text-[10px] text-muted-foreground truncate">{client.email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">{client.cpf}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">{client.phone}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-bold">
                        {getSectorName(client.sectorId)}
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">
                        {getUserName(client.userId)}
                      </TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell className="text-center">
                        <div className="flex items-center justify-center gap-1">
                            <Button variant="ghost" size="icon" onClick={() => setViewingClientDetails(client)} title="Ver Detalhes">
                                <Eye className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => handleOpenForm(client)} title="Editar" className="text-muted-foreground hover:text-amber-600">
                                <Edit className="w-4 h-4" />
                            </Button>
                        </div>
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

            {/* Paginação */}
            {filteredClients.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} 
                        className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>

                    {getPageNumbers().map((page, index) => (
                      <PaginationItem key={index}>
                        {page === '...' ? (
                          <PaginationEllipsis />
                        ) : (
                          <PaginationLink 
                            isActive={currentPage === page} 
                            onClick={() => setCurrentPage(page as number)}
                            className={cn("cursor-pointer font-mono font-medium", currentPage === page && "bg-primary text-primary-foreground")}
                          >
                            {page}
                          </PaginationLink>
                        )}
                      </PaginationItem>
                    ))}

                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} 
                        className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal Detalhes */}
        <Dialog open={!!viewingClientDetails} onOpenChange={() => setViewingClientDetails(null)}>
            <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-background border border-border shadow-2xl rounded-2xl [&>button]:hidden">
              <DialogHeader className="sr-only">
                <DialogTitle>Detalhes do Cliente</DialogTitle>
                <DialogDescription>Visualização completa dos dados</DialogDescription>
              </DialogHeader>
              {viewingClientDetails && (
                <div className="flex flex-col h-full">
                    <div className="relative bg-zinc-50/80 dark:bg-zinc-900/50 p-6 border-b border-border/60">
                         <div className="absolute top-4 right-4 z-50">
                            <Button variant="ghost" size="icon" onClick={() => setViewingClientDetails(null)} className="rounded-full bg-zinc-200/50 hover:bg-emerald-500 hover:text-white transition-all shadow-sm w-9 h-9">
                                <X className="w-5 h-5" />
                            </Button>
                         </div>
                         <div className="absolute top-5 right-16">{getStatusBadge(viewingClientDetails.status)}</div>
                         <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                            <div className="text-center sm:text-left space-y-1 mt-1">
                                <h2 className="text-2xl font-bold tracking-tight text-foreground">{viewingClientDetails.name}</h2>
                                <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1">
                                    <span className="font-mono bg-zinc-100 dark:bg-zinc-900 px-1.5 py-0.5 rounded text-xs">ID: {viewingClientDetails.id}</span>
                                    <span className="mx-1">•</span>
                                    <span className="mx-1">{getSectorName(viewingClientDetails.sectorId)}</span>
                                </p>
                            </div>
                         </div>
                    </div>
                    <div className="p-6 space-y-8">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <div className="group relative p-3 rounded-xl border bg-card hover:bg-zinc-50/80 transition-all cursor-pointer shadow-sm" onClick={() => copyToClipboard(viewingClientDetails.email || '', 'Email')}>
                                <div className="flex items-center gap-2 mb-1.5 text-muted-foreground group-hover:text-primary transition-colors">
                                    <Mail className="w-4 h-4" /> <span className="text-xs font-medium uppercase tracking-wider">Email</span>
                                </div>
                                <p className="text-sm font-semibold text-foreground break-all">{viewingClientDetails.email || '-'}</p>
                                <Copy className="w-3 h-3 absolute top-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                            </div>
                            <div className="group relative p-3 rounded-xl border bg-card hover:bg-zinc-50/80 transition-all cursor-pointer shadow-sm" onClick={() => copyToClipboard(viewingClientDetails.phone || '', 'Telefone')}>
                                <div className="flex items-center gap-2 mb-1.5 text-muted-foreground group-hover:text-primary transition-colors">
                                    <Phone className="w-4 h-4" /> <span className="text-xs font-medium uppercase tracking-wider">Telefone</span>
                                </div>
                                <p className="text-sm font-semibold truncate text-foreground">{viewingClientDetails.phone || '-'}</p>
                                <Copy className="w-3 h-3 absolute top-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                            </div>
                            <div className="group relative p-3 rounded-xl border bg-card hover:bg-zinc-50/80 transition-all cursor-pointer shadow-sm" onClick={() => copyToClipboard(viewingClientDetails.cpf, 'CPF')}>
                                <div className="flex items-center gap-2 mb-1.5 text-muted-foreground group-hover:text-primary transition-colors">
                                    <Hash className="w-4 h-4" /> <span className="text-xs font-medium uppercase tracking-wider">CPF</span>
                                </div>
                                <p className="text-sm font-semibold truncate text-foreground">{viewingClientDetails.cpf}</p>
                                <Copy className="w-3 h-3 absolute top-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                            </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-4">
                                <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 flex flex-col gap-3 relative overflow-hidden group">
                                    <div className="flex items-center gap-3 relative z-10">
                                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shadow-sm">
                                            <ShieldCheck className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-primary/80 uppercase tracking-widest">Consultor Resp.</p>
                                            <p className="text-sm font-bold text-foreground">{getUserName(viewingClientDetails.userId)}</p>
                                        </div>
                                    </div>
                                    <div className="text-xs text-muted-foreground pt-2 border-t border-primary/10 relative z-10 flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        Cadastrado em {format(new Date(viewingClientDetails.createdAt.replace(' ', 'T')), "dd/MM/yyyy 'às' HH:mm")}
                                    </div>
                                </div>

                                <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-200/50 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                                            <RefreshCw className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-bold text-blue-700 uppercase tracking-widest">Sincronização</p>
                                            <p className="text-xs font-semibold text-blue-900">
                                              Última modificação: {viewingClientDetails.updatedAt ? format(new Date(viewingClientDetails.updatedAt.replace(' ', 'T')), "dd/MM/yy 'às' HH:mm") : 'Sem registros'}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><FileCheck className="w-3.5 h-3.5" /> Observações Internas</Label>
                                <div className="bg-zinc-50/50 p-4 rounded-xl border border-dashed border-zinc-200 text-sm text-foreground/80 min-h-[120px] leading-relaxed">
                                    {viewingClientDetails.observations || <span className="text-muted-foreground/50 italic">Sem observações registradas.</span>}
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                             <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><ImageIcon className="w-3.5 h-3.5" /> Documento Vinculado</Label>
                            {viewingClientDetails.imageUrl ? (
                                <div className="group relative w-full h-24 bg-zinc-50 rounded-xl border flex items-center justify-between px-6 cursor-pointer" onClick={() => setViewingFile(viewingClientDetails.imageUrl!)}>
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center text-zinc-400">
                                            {isPdf(viewingClientDetails.imageUrl) ? <FileText className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
                                        </div>
                                        <div><p className="font-semibold text-sm">Visualizar Anexo</p><p className="text-xs text-muted-foreground">Clique para expandir</p></div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="rounded-full bg-white/50 hover:bg-white shadow-sm"><ExternalLink className="w-4 h-4" /></Button>
                                </div>
                            ) : (
                                <div className="w-full h-16 border border-dashed rounded-xl flex items-center justify-center text-xs text-muted-foreground bg-zinc-50/50">Nenhum documento anexado.</div>
                            )}
                        </div>
                    </div>
                    <div className="p-4 bg-zinc-50/50 border-t flex justify-end"><Button variant="outline" onClick={() => setViewingClientDetails(null)} className="rounded-lg px-6">Fechar Ficha</Button></div>
                </div>
              )}
            </DialogContent>
        </Dialog>

        {/* Viewer de Arquivo */}
        <Dialog open={!!viewingFile} onOpenChange={(open) => !open && setViewingFile(null)}>
            <DialogContent className="fixed !left-0 !top-0 !translate-x-0 !translate-y-0 w-screen h-screen max-w-none p-0 bg-black/90 backdrop-blur-md border-none shadow-none focus:outline-none [&>button]:hidden flex items-center justify-center pointer-events-none z-[100]">
                <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-auto">
                  <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 p-2 bg-black/80 backdrop-blur-md rounded-full shadow-2xl border border-white/10">
                    {!isPdf(viewingFile || '') && (
                      <><Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 rounded-full" onClick={() => setZoomScale(s => Math.max(0.5, s - 0.25))}><ZoomOut className="w-4 h-4" /></Button>
                      <span className="text-xs font-medium text-white w-12 text-center select-none">{Math.round(zoomScale * 100)}%</span>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 rounded-full" onClick={() => setZoomScale(s => Math.min(3, s + 0.25))}><ZoomIn className="w-4 h-4" /></Button>
                      <div className="w-px h-4 bg-white/20 mx-1" /></>
                    )}
                    <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 rounded-full" onClick={() => {
                        const link = document.createElement('a');
                        link.href = viewingFile || '';
                        link.download = `documento-${Date.now()}`;
                        link.click();
                    }}><Download className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-white hover:bg-emerald-500/80 h-8 w-8 rounded-full" onClick={() => setViewingFile(null)}><X className="w-4 h-4" /></Button>
                  </div>
                  <div className="w-full h-full flex items-center justify-center relative">
                    {viewingFile && (isPdf(viewingFile) ? (<div className="w-[90%] h-[90%] bg-white rounded-lg shadow-2xl overflow-hidden"><object data={viewingFile} type="application/pdf" className="w-full h-full" /></div>) : (<div className="w-full h-full flex items-center justify-center overflow-auto p-4"><img src={viewingFile} alt="Preview" className="rounded-lg shadow-2xl object-contain max-w-full max-h-full transition-transform" style={{ transform: `scale(${zoomScale})` }} /></div>))}
                  </div>
                </div>
            </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;