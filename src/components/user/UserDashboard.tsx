/**
 * ARQUIVO: src/components/user/UserDashboard.tsx
 * * ATUALIZAÇÕES:
 * 1. Paginação Numérica: Adicionada lógica para mostrar botões de página (1, 2, 3...) permitindo navegação direta.
 * 2. Lógica Inteligente: Usa "..." quando há muitas páginas para manter o layout limpo.
 * 3. Mantido: Todas as funcionalidades anteriores (PDF Blob, Upload 20MB, Filtros, Visualizadores, Estilos).
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
  Eraser,
  ZoomIn,
  ZoomOut,
  Download,
  ExternalLink
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

      // Lógica de Data
      let matchesPeriod = true;
      const clientDate = new Date(client.createdAt);
      const today = new Date();

      if (periodFilter === 'today') {
        matchesPeriod = isSameDay(clientDate, today);
      } else if (periodFilter === 'week') {
        const weekAgo = startOfDay(subDays(today, 7));
        matchesPeriod = isAfter(clientDate, weekAgo);
      } else if (periodFilter === 'month') {
        matchesPeriod = isSameMonth(clientDate, today);
      } else if (periodFilter === 'custom') {
        if (customDate.from || customDate.to) {
            const startDate = customDate.from ? startOfDay(new Date(customDate.from + 'T00:00:00')) : null;
            const endDate = customDate.to ? endOfDay(new Date(customDate.to + 'T00:00:00')) : null;

            if (startDate && endDate) {
                matchesPeriod = isWithinInterval(clientDate, { start: startDate, end: endDate });
            } else if (startDate) {
                matchesPeriod = isAfter(clientDate, startDate) || isSameDay(clientDate, startDate);
            } else if (endDate) {
                matchesPeriod = isBefore(clientDate, endDate) || isSameDay(clientDate, endDate);
            }
        }
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

  // --- PAGINAÇÃO ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };
  
  // Função para gerar os números das páginas
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;

    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      pages.push(1); // Sempre mostra a primeira
      if (currentPage > 3) pages.push('...');

      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);

      if (currentPage <= 3) end = 4;
      if (currentPage >= totalPages - 2) start = totalPages - 3;

      for (let i = start; i <= end; i++) {
        if (i > 1 && i < totalPages) pages.push(i);
      }

      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages); // Sempre mostra a última
    }
    return pages;
  };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, periodFilter, customDate]);

  // --- ESTADOS DE EDIÇÃO/VISUALIZAÇÃO ---
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  
  // Viewer States
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

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

  const isFinalized = editingClient?.status === 'approved' || editingClient?.status === 'rejected';

  // Reset Viewer
  useEffect(() => {
    if (!viewingFile) {
        setZoomScale(1);
    }
  }, [viewingFile]);

  // Funções Auxiliares
  const formatCPF = (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  const formatPhone = (value: string) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');

  // --- FUNÇÃO DOWNLOAD (BLOB) ---
  const handleDownload = () => {
    if (!viewingFile) return;
    
    try {
        const arr = viewingFile.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const url = URL.createObjectURL(blob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `anexo-cliente-${Date.now()}.${mime.includes('pdf') ? 'pdf' : 'png'}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        toast({ title: 'Download iniciado', description: 'Seu arquivo está sendo baixado.' });
    } catch (e) {
        console.error("Erro ao baixar:", e);
        const link = document.createElement('a');
        link.href = viewingFile;
        link.download = `anexo-cliente-${Date.now()}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
  };

  // --- FUNÇÃO ABRIR NOVA ABA (BLOB) ---
  const handleOpenNewTab = () => {
    if (!viewingFile) return;

    try {
        const arr = viewingFile.split(',');
        const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
        const bstr = atob(arr[1]);
        let n = bstr.length;
        const u8arr = new Uint8Array(n);
        while (n--) {
            u8arr[n] = bstr.charCodeAt(n);
        }
        const blob = new Blob([u8arr], { type: mime });
        const blobUrl = URL.createObjectURL(blob);
        window.open(blobUrl, '_blank');
    } catch (e) {
        console.error("Erro ao abrir blob:", e);
        toast({ title: 'Erro ao abrir', description: 'Não foi possível processar o arquivo.', variant: 'destructive' });
    }
  };

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

  // --- UPLOAD MÁX 20MB ---
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 20 * 1024 * 1024; // 20MB

      if (file.size > maxSize) {
        toast({
          title: "Arquivo muito grande",
          description: "O tamanho máximo permitido é de 20MB.",
          variant: "destructive"
        });
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

  const isPdf = (dataUrl: string) => dataUrl.startsWith('data:application/pdf') || dataUrl.endsWith('.pdf');

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Gerenciar Meus Clientes
            </h1>
            <p className="text-muted-foreground mt-1">
              Lista completa dos cadastros
            </p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" onClick={() => handleOpenDialog()} className="shadow-lg hover:shadow-xl transition-all">
                <Plus className="w-4 h-4 mr-2" /> Novo Cliente
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
                    <Label htmlFor="name">Nome</Label>
                    <Input 
                      id="name" 
                      value={formData.name} 
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
                      required 
                      placeholder="Nome completo" 
                      disabled={isFinalized} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input 
                      id="cpf" 
                      value={formData.cpf} 
                      onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })} 
                      required 
                      placeholder="000.000.000-00" 
                      maxLength={14} 
                      disabled={isFinalized} 
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
                      disabled={isFinalized} 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input 
                      id="phone" 
                      value={formData.phone} 
                      onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })} 
                      placeholder="(00) 00000-0000" 
                      maxLength={15} 
                      disabled={isFinalized} 
                    />
                  </div>
                </div>

                {editingClient && !isFinalized && (
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
                  <Label>Anexo (Máx. 20MB)</Label>
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

          {/* --- VISUALIZADOR DE ARQUIVOS --- */}
          <Dialog open={!!viewingFile} onOpenChange={(open) => !open && setViewingFile(null)}>
            <DialogContent className="fixed !left-0 !top-0 !translate-x-0 !translate-y-0 w-screen h-screen max-w-none p-0 bg-transparent border-none shadow-none focus:outline-none [&>button]:hidden flex items-center justify-center pointer-events-none">
               
               <DialogTitle className="sr-only">Visualização do Anexo</DialogTitle>

               <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-auto">
                 
                 {/* Toolbar FIXA NO TETO */}
                 <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[60] flex items-center gap-2 p-2 bg-black/80 backdrop-blur-md rounded-full shadow-2xl border border-white/10">
                   {!isPdf(viewingFile || '') && (
                     <>
                       <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 rounded-full" onClick={() => setZoomScale(s => Math.max(0.5, s - 0.25))} title="Diminuir Zoom">
                         <ZoomOut className="w-4 h-4" />
                       </Button>
                       <span className="text-xs font-medium text-white w-12 text-center select-none">
                         {Math.round(zoomScale * 100)}%
                       </span>
                       <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 rounded-full" onClick={() => setZoomScale(s => Math.min(3, s + 0.25))} title="Aumentar Zoom">
                         <ZoomIn className="w-4 h-4" />
                       </Button>
                       <div className="w-px h-4 bg-white/20 mx-1" />
                     </>
                   )}
                   
                   <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 rounded-full" onClick={handleDownload} title="Baixar Arquivo">
                     <Download className="w-4 h-4" />
                   </Button>

                   {isPdf(viewingFile || '') && (
                     <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 rounded-full" onClick={handleOpenNewTab} title="Abrir em Nova Aba">
                        <ExternalLink className="w-4 h-4" />
                     </Button>
                   )}

                   <div className="w-px h-4 bg-white/20 mx-1" />
                   
                   <Button variant="ghost" size="icon" className="text-white hover:bg-red-500/80 h-8 w-8 rounded-full" onClick={() => setViewingFile(null)} title="Fechar">
                     <X className="w-4 h-4" />
                   </Button>
                 </div>

                 {/* Área de Visualização */}
                 <div className="w-[95vw] h-[90vh] flex items-center justify-center relative mt-8">
                    
                    {viewingFile && (
                        isPdf(viewingFile) ? (
                            <div className="w-full h-full bg-white rounded-lg shadow-2xl overflow-hidden border border-border">
                                <object
                                    data={viewingFile}
                                    type="application/pdf"
                                    className="w-full h-full"
                                >
                                    <div className="flex flex-col items-center justify-center h-full bg-white text-muted-foreground p-6 text-center">
                                      <p className="mb-4">Não foi possível exibir este PDF aqui.</p>
                                      <div className="flex gap-2">
                                        <Button onClick={handleOpenNewTab} variant="default">
                                            <ExternalLink className="w-4 h-4 mr-2" /> Abrir em Nova Aba
                                        </Button>
                                        <Button onClick={handleDownload} variant="outline">
                                            <Download className="w-4 h-4 mr-2" /> Baixar
                                        </Button>
                                      </div>
                                    </div>
                                </object>
                            </div>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center overflow-auto p-4">
                                <img 
                                    src={viewingFile} 
                                    alt="Comprovante" 
                                    className="rounded-lg shadow-2xl object-contain transition-transform duration-200 ease-out max-w-full max-h-full" 
                                    style={{ 
                                        transform: `scale(${zoomScale})`, 
                                    }}
                                />
                            </div>
                        )
                    )}
                 </div>
               </div>
            </DialogContent>
          </Dialog>
        </div>

        <Card className="glass-card">
          <CardHeader>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <CardTitle className="text-xl">Lista de Clientes</CardTitle>
              
              <div className="flex flex-col sm:flex-row gap-3 items-end sm:items-center">
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

                  {periodFilter === 'custom' && (
                    <div className="flex items-center gap-3 animate-in fade-in slide-in-from-left-2">
                      <div className="relative w-[140px]">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                        <Input 
                          type="date" 
                          className="w-full h-7 text-xs pl-10 [&::-webkit-calendar-picker-indicator]:hidden" 
                          value={customDate.from}
                          onChange={(e) => setCustomDate(prev => ({ ...prev, from: e.target.value }))}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground">até</span>
                      <div className="relative w-[140px]">
                        <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                        <Input 
                          type="date" 
                          className="w-full h-7 text-xs pl-10 [&::-webkit-calendar-picker-indicator]:hidden" 
                          value={customDate.to}
                          onChange={(e) => setCustomDate(prev => ({ ...prev, to: e.target.value }))}
                        />
                      </div>
                    </div>
                  )}
                </div>

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
                        <TableCell className="text-xs font-semibold text-muted-foreground">#{client.id}</TableCell>
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
                            {/* BOTÃO OLHINHO: PRETO BASE, VERDE HOVER */}
                            {client.imageUrl && (
                              <Button variant="outline" size="icon" onClick={() => setViewingFile(client.imageUrl!)} className="border-zinc-200 text-[#111] hover:bg-emerald-50 hover:text-emerald-600 hover:border-emerald-200 shadow-sm transition-all h-7 w-7">
                                <Eye className="w-3.5 h-3.5" />
                              </Button>
                            )}
                            {/* BOTÃO LÁPIS: PRETO BASE, AMARELO HOVER */}
                            <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(client)} className="text-[#111] hover:text-amber-600 hover:bg-amber-50 h-7 w-7">
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
              <div className="flex items-center justify-between pt-4 border-t">
                 <span className="text-xs text-muted-foreground hidden sm:block">
                    Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredClients.length)} de {filteredClients.length} resultados
                 </span>
                 
                 <div className="flex items-center gap-1 mx-auto sm:mx-0">
                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevPage} disabled={currentPage === 1}>
                        <ChevronLeft className="h-4 w-4" />
                    </Button>
                    
                    {getPageNumbers().map((page, index) => (
                        page === '...' ? (
                            <span key={`ellipsis-${index}`} className="px-2 text-xs text-muted-foreground">...</span>
                        ) : (
                            <Button 
                                key={page} 
                                variant={currentPage === page ? "default" : "outline"} 
                                size="sm" 
                                className={`h-8 w-8 text-xs ${currentPage === page ? 'bg-primary text-primary-foreground' : ''}`}
                                onClick={() => setCurrentPage(page as number)}
                            >
                                {page}
                            </Button>
                        )
                    ))}

                    <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextPage} disabled={currentPage >= totalPages}>
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                 </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserDashboard;