/**
 * ARQUIVO: src/components/user/UserDashboard.tsx
 * * ATUALIZAÇÕES:
 * 1. Coluna ID: Fonte alterada para 'font-semibold text-muted-foreground' (mais agradável).
 * 2. Coluna ID: Adicionado prefixo '#' antes do valor.
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockClients } from '@/data/mockData';
import type { Client } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
  Plus,
  Edit,
  Upload,
  Image as ImageIcon,
  FileText,
  X,
  Eye,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  CalendarIcon,
  Eraser
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { isSameDay, isSameMonth, subDays, isAfter, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Lista completa de clientes
  const [clients, setClients] = useState<Client[]>(
    mockClients.filter((c) => c.userId === user?.id)
  );

  // --- ESTADOS DOS FILTROS ---
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  
  // Estado para datas personalizadas
  const [customDate, setCustomDate] = useState<{ from: string; to: string }>({ from: '', to: '' });

  // --- LÓGICA DE FILTRAGEM ---
  const filteredClients = useMemo(() => {
    return clients.filter(client => {
      const termLower = searchTerm.toLowerCase();
      const termClean = searchTerm.replace(/\D/g, ''); 
      const clientCpfClean = client.cpf.replace(/\D/g, '');

      const matchesName = client.name.toLowerCase().includes(termLower);
      const matchesCpf = termClean.length > 0 && clientCpfClean.includes(termClean);
      
      const matchesSearch = searchTerm === '' || matchesName || matchesCpf;
      const matchesStatus = statusFilter === 'all' || client.status === statusFilter;

      let matchesPeriod = true;
      const clientDate = new Date(client.createdAt);
      const today = new Date();

      if (periodFilter === 'today') {
        matchesPeriod = isSameDay(clientDate, today);
      } else if (periodFilter === 'week') {
        matchesPeriod = isAfter(clientDate, subDays(today, 7));
      } else if (periodFilter === 'month') {
        matchesPeriod = isSameMonth(clientDate, today);
      } else if (periodFilter === 'custom' && customDate.from && customDate.to) {
        const startDate = startOfDay(new Date(customDate.from + 'T00:00:00'));
        const endDate = endOfDay(new Date(customDate.to + 'T00:00:00'));
        matchesPeriod = isWithinInterval(clientDate, { start: startDate, end: endDate });
      }

      return matchesSearch && matchesStatus && matchesPeriod;
    });
  }, [clients, searchTerm, statusFilter, periodFilter, customDate]);

  // --- LIMPAR FILTROS ---
  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPeriodFilter('all');
    setCustomDate({ from: '', to: '' });
  };

  // --- ESTADOS DE PAGINAÇÃO ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };
  
  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, periodFilter, customDate]);

  // --- ESTADOS DE EDIÇÃO/CRIAÇÃO ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingFile, setViewingFile] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    observations: '',
    status: 'pending' as 'pending' | 'approved' | 'rejected',
  });
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- FUNÇÕES DE FORMATAÇÃO ---
  const formatCPF = (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  const formatPhone = (value: string) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');

  const resetForm = () => {
    setFormData({ name: '', email: '', cpf: '', phone: '', observations: '', status: 'pending' });
    setFilePreview(null);
    setEditingClient(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
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
      setFilePreview(client.imageUrl || null);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setFilePreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const removeFile = () => {
    setFilePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingClient) {
      setClients((prev) => prev.map((c) => c.id === editingClient.id ? { ...c, ...formData, imageUrl: filePreview || undefined, updatedAt: new Date() } : c));
      toast({ title: 'Cliente atualizado!' });
    } else {
      const newClient: Client = {
        id: String(Date.now()),
        ...formData,
        status: 'pending',
        imageUrl: filePreview || undefined,
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
      case 'approved': return <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-50">Aprovado</Badge>;
      case 'rejected': return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200 hover:bg-red-50">Reprovado</Badge>;
      default: return <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-50">Pendente</Badge>;
    }
  };

  const isPdf = (dataUrl: string) => dataUrl.startsWith('data:application/pdf');

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
              <Button variant="hero" onClick={() => handleOpenDialog()} className="h-11 px-6 text-base">
                <Plus className="w-5 h-5 mr-2" /> Novo Cliente
              </Button>
            </DialogTrigger>
            
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto" onOpenAutoFocus={(e) => e.preventDefault()}>
              <DialogHeader>
                <DialogTitle className="text-2xl">{editingClient ? 'Editar Cliente' : 'Cadastrar Novo Cliente'}</DialogTitle>
                <DialogDescription>{!editingClient && 'Preencha os dados abaixo. Nome e CPF são obrigatórios.'}</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Nome completo" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF *</Label>
                    <Input id="cpf" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })} required placeholder="000.000.000-00" maxLength={14} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} />
                  </div>
                </div>

                {editingClient && (
                  <div className="space-y-2 bg-muted/50 p-4 rounded-lg border border-border shadow-sm">
                    <Label htmlFor="status" className="flex items-center gap-2 font-semibold">Status</Label>
                    <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                      <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
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
                  <Textarea id="observations" value={formData.observations} onChange={(e) => setFormData({ ...formData, observations: e.target.value })} placeholder="Informações adicionais..." />
                </div>

                <div className="space-y-2">
                  <Label>Anexo</Label>
                  <div className="border border-dashed rounded-lg p-4 bg-muted/20 hover:bg-muted/40 transition-colors">
                    <div className="flex flex-col items-center gap-3">
                      {!filePreview ? (
                        <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()} className="w-full">
                          <Upload className="w-4 h-4 mr-2" /> Anexar Arquivo
                        </Button>
                      ) : (
                        <div className="relative group w-full">
                          <div className={cn("relative w-full rounded-lg overflow-hidden border bg-background flex items-center justify-center", isPdf(filePreview) ? "h-24" : "h-40")}>
                            {isPdf(filePreview) ? (
                              <div className="flex flex-col items-center text-red-500">
                                <FileText className="w-10 h-10" />
                                <span className="text-xs font-medium text-muted-foreground mt-2">Documento PDF</span>
                              </div>
                            ) : (
                              <img src={filePreview} alt="Preview" className="w-full h-full object-contain" />
                            )}
                          </div>
                          <div className="flex items-center justify-between mt-2">
                            <span className="text-xs text-emerald-600 font-medium flex items-center">
                              {isPdf(filePreview) ? <FileText className="w-3 h-3 mr-1" /> : <ImageIcon className="w-3 h-3 mr-1" />} Arquivo anexado
                            </span>
                            <Button type="button" variant="destructive" size="sm" className="h-7 text-xs" onClick={removeFile}><X className="w-3 h-3 mr-1" /> Remover</Button>
                          </div>
                        </div>
                      )}
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*,application/pdf" onChange={handleFileUpload} />
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" variant="hero">{editingClient ? 'Salvar' : 'Cadastrar'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={!!viewingFile} onOpenChange={(open) => !open && setViewingFile(null)}>
            <DialogContent className="max-w-4xl p-0 overflow-hidden bg-transparent border-none shadow-none [&>button]:hidden">
               <div className="relative w-full h-[85vh] flex items-center justify-center pointer-events-auto">
                 <button onClick={() => setViewingFile(null)} className="absolute top-4 right-4 z-50 p-2 bg-white text-black rounded-full shadow-lg hover:bg-zinc-200 hover:scale-105 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-white">
                   <X className="w-6 h-6" />
                 </button>
                 {viewingFile && (isPdf(viewingFile) ? <iframe src={viewingFile} className="w-full h-full rounded-lg shadow-2xl bg-white" title="Visualização" /> : <img src={viewingFile} alt="Comprovante" className="max-w-full max-h-full rounded-lg shadow-2xl object-contain bg-black/60 backdrop-blur-sm" />)}
               </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <CardTitle className="text-xl">Lista de Clientes</CardTitle>
              
              {/* --- BARRA DE FILTROS --- */}
              <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
                
                {/* 1. Busca (Nome, CPF) */}
                <div className="relative w-full sm:w-[250px]">
                  <Input 
                    placeholder="Buscar por Nome ou CPF" 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pr-10 h-7 text-xs" 
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    <Search className="w-3 h-3" />
                  </div>
                </div>

                {/* 2. Filtro de Período */}
                <div className="flex items-center gap-2">
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="w-full sm:w-[150px] h-7 text-xs"> 
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <CalendarIcon className="w-3 h-3" />
                        <span className="text-foreground truncate">
                          {periodFilter === 'all' ? 'Período' : 
                           periodFilter === 'custom' ? 'Personalizado' :
                           periodFilter === 'today' ? 'Hoje' : 
                           periodFilter === 'week' ? '7 Dias' : 'Mês'}
                        </span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o período</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="week">Últimos 7 dias</SelectItem>
                      <SelectItem value="month">Este Mês</SelectItem>
                      <SelectItem value="custom">Personalizado...</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Inputs de Data */}
                  {periodFilter === 'custom' && (
                    <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2">
                      <div className="relative w-[130px]">
                        <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground z-10 pointer-events-none" />
                        <Input 
                          type="date" 
                          className="w-full h-7 text-xs pl-7" 
                          value={customDate.from}
                          onChange={(e) => setCustomDate(prev => ({ ...prev, from: e.target.value }))}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">até</span>
                      <div className="relative w-[130px]">
                        <CalendarIcon className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground z-10 pointer-events-none" />
                        <Input 
                          type="date" 
                          className="w-full h-7 text-xs pl-7" 
                          value={customDate.to}
                          onChange={(e) => setCustomDate(prev => ({ ...prev, to: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* 3. Filtro de Status */}
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[130px] h-7 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Filter className="w-3 h-3" />
                      <span className="text-foreground">
                        {statusFilter === 'all' ? 'Status' : 
                         statusFilter === 'approved' ? 'Aprovado' : 
                         statusFilter === 'pending' ? 'Pendente' : 'Reprovado'}
                      </span>
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="approved">Aprovados</SelectItem>
                    <SelectItem value="rejected">Reprovados</SelectItem>
                  </SelectContent>
                </Select>

                {/* 4. Botão Limpar Filtros */}
                {(searchTerm !== '' || statusFilter !== 'all' || periodFilter !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={clearFilters}
                    className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0"
                    title="Limpar Filtros"
                  >
                    <Eraser className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            {/* ... tabela ... */}
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-center w-[120px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.length > 0 ? (
                    paginatedClients.map((client) => (
                      <TableRow key={client.id}>
                        {/* ID ESTILIZADO COM # */}
                        <TableCell className="text-xs font-semibold text-muted-foreground">
                          #{client.id}
                        </TableCell>
                        <TableCell>
                          <div>
                            <p className="font-medium">{client.name}</p>
                            <p className="text-sm text-muted-foreground">{client.email || '-'}</p>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">{client.cpf}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">{client.phone || '-'}</TableCell>
                        <TableCell>{getStatusBadge(client.status)}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex items-center justify-center gap-2">
                            {client.imageUrl && (
                              <Button variant="outline" size="icon" onClick={() => setViewingFile(client.imageUrl!)} className="bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100 hover:text-blue-700 hover:border-blue-300 shadow-sm transition-all h-7 w-7">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(client)} className="text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50 h-7 w-7">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                        Nenhum cliente encontrado com os filtros atuais.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            
            {totalPages > 1 && (
              <div className="flex items-center justify-end gap-2 pt-4 border-t">
                <span className="text-xs text-muted-foreground mr-2">Página {currentPage} de {totalPages}</span>
                <Button variant="outline" size="sm" onClick={handlePrevPage} disabled={currentPage === 1} className="h-8 w-8 p-0"><ChevronLeft className="h-4 w-4" /></Button>
                <Button variant="outline" size="sm" onClick={handleNextPage} disabled={currentPage >= totalPages} className="h-8 w-8 p-0"><ChevronRight className="h-4 w-4" /></Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;