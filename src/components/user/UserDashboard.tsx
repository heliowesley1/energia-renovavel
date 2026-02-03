/**
 * ARQUIVO: src/components/user/UserDashboard.tsx
 * ATUALIZAÇÕES:
 * 1. Suporte a 3 Arquivos: Documento, Conta de Luz e Adicional.
 * 2. Persistência: Envio das 3 URLs de imagem para o backend.
 */

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import DashboardLayout from '@/components/layout/DashboardLayout';
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
  ExternalLink,
  Mail,
  Phone,
  Hash,
  Copy,
  FileCheck,
  CalendarDays
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { isSameDay, isSameMonth, subDays, isAfter, startOfDay, endOfDay, isWithinInterval, isBefore, format } from 'date-fns';

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const api = useApi();

  const [clients, setClients] = useState<Client[]>([]);

  // OTIMIZAÇÃO: Carrega a lista (espera-se que a API retorne dados leves aqui)
  const loadData = async () => {
    try {
      const data = await api.get('/clientes.php');
      const myClients = (data || []).filter((c: any) => Number(c.userId) === Number(user?.id));
      setClients(myClients);
    } catch (error) {
      toast({ title: "Erro de Conexão", description: "Falha ao carregar dados do banco.", variant: "destructive" });
    }
  };

  useEffect(() => {
    if (user?.id) loadData();
  }, [user?.id]);

  // OTIMIZAÇÃO: Função para buscar dados completos (com imagens) apenas quando necessário
  const fetchFullClient = async (id: number) => {
    try {
      const fullData = await api.get(`/clientes.php?id=${id}`);
      return fullData;
    } catch (error) {
      toast({ title: "Erro", description: "Não foi possível carregar os detalhes completos.", variant: "destructive" });
      return null;
    }
  };

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [periodFilter, setPeriodFilter] = useState('all');
  const [customDate, setCustomDate] = useState<{ from: string; to: string }>({ from: '', to: '' });

  const filteredClients = useMemo(() => {
    const filtered = clients.filter(client => {
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
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [clients, searchTerm, statusFilter, periodFilter, customDate]);

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
    setPeriodFilter('all');
    setCustomDate({ from: '', to: '' });
  };

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;
  const totalPages = Math.ceil(filteredClients.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (currentPage > 3) pages.push('...');
      let start = Math.max(2, currentPage - 1);
      let end = Math.min(totalPages - 1, currentPage + 1);
      if (currentPage <= 3) end = 4;
      if (currentPage >= totalPages - 2) start = totalPages - 3;
      for (let i = start; i <= end; i++) { if (i > 1 && i < totalPages) pages.push(i); }
      if (currentPage < totalPages - 2) pages.push('...');
      pages.push(totalPages);
    }
    return pages;
  };

  useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, periodFilter, customDate]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [viewingClientDetails, setViewingClientDetails] = useState<Client | null>(null);
  const [viewingFile, setViewingFile] = useState<string | null>(null);
  const [zoomScale, setZoomScale] = useState(1);

  const [formData, setFormData] = useState({
    name: '', email: '', cpf: '', phone: '', observations: '',
    status: 'pending' as 'pending' | 'formalized' | 'waiting_formalization',
    createdAt: '',
    imageUrl: '',
    imageUrl2: '',
    imageUrl3: '',
  });

  const fileInputDocRef = useRef<HTMLInputElement>(null);
  const fileInputLuzRef = useRef<HTMLInputElement>(null);
  const fileInputExtraRef = useRef<HTMLInputElement>(null);

  const isFinalized = false;

  useEffect(() => { if (!viewingFile) setZoomScale(1); }, [viewingFile]);

  const formatCPF = (value: string) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
  const formatPhone = (value: string) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');

  const copyToClipboard = (text: string, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!", description: `${label} copiado para a área de transferência.`, duration: 2000 });
  };

  const handleDownload = () => {
    if (!viewingFile) return;
    try {
      const arr = viewingFile.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) { u8arr[n] = bstr.charCodeAt(n); }
      const blob = new Blob([u8arr], { type: mime });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `anexo-cliente-${Date.now()}.${mime.includes('pdf') ? 'pdf' : 'png'}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Download iniciado' });
    } catch (e) { console.error(e); }
  };

  const handleOpenNewTab = () => {
    if (!viewingFile) return;
    try {
      const arr = viewingFile.split(',');
      const mime = arr[0].match(/:(.*?);/)?.[1] || 'application/pdf';
      const bstr = atob(arr[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) { u8arr[n] = bstr.charCodeAt(n); }
      const blob = new Blob([u8arr], { type: mime });
      window.open(URL.createObjectURL(blob), '_blank');
    } catch (e) { console.error(e); }
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', cpf: '', phone: '', observations: '',
      status: 'pending', createdAt: '', imageUrl: '', imageUrl2: '', imageUrl3: ''
    });
    setEditingClient(null);
  };

  // OTIMIZAÇÃO: Busca dados completos antes de abrir o modal de edição
  const handleOpenDialog = async (client?: Client) => {
    if (client) {
      const fullData = await fetchFullClient(client.id);
      if (!fullData) return;

      setEditingClient(fullData);
      setFormData({
        name: fullData.name,
        email: fullData.email || '',
        cpf: fullData.cpf,
        phone: fullData.phone || '',
        observations: fullData.observations || '',
        status: fullData.status,
        createdAt: fullData.createdAt ? fullData.createdAt.split(' ')[0] : '',
        imageUrl: fullData.imageUrl || '',
        imageUrl2: (fullData as any).imageUrl2 || '',
        imageUrl3: (fullData as any).imageUrl3 || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  // OTIMIZAÇÃO: Busca dados completos antes de abrir o modal de detalhes
  const handleViewDetails = async (client: Client) => {
    const fullData = await fetchFullClient(client.id);
    if (fullData) {
      setViewingClientDetails(fullData);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, field: 'imageUrl' | 'imageUrl2' | 'imageUrl3') => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 20 * 1024 * 1024;
      if (file.size > maxSize) {
        toast({ title: "Arquivo muito grande", description: "O tamanho máximo é 20MB.", variant: "destructive" });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setFormData(prev => ({ ...prev, [field]: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const removeFile = (field: 'imageUrl' | 'imageUrl2' | 'imageUrl3') => {
    setFormData(prev => ({ ...prev, [field]: '' }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const now = new Date();
    const mysqlTime = now.toTimeString().split(' ')[0];
    const mysqlNow = now.toISOString().slice(0, 10) + ' ' + mysqlTime;

    const finalCreatedAt = formData.createdAt
      ? formData.createdAt + ' ' + (editingClient?.createdAt?.split(' ')[1] || mysqlTime)
      : mysqlNow;

    const payload = {
      ...formData,
      id: editingClient?.id,
      userId: user?.id,
      sectorId: user?.sectorId,
      createdAt: finalCreatedAt,
      updatedAt: mysqlNow
    };

    try {
      const endpoint = editingClient ? '/clientes.php?action=update' : '/clientes.php?action=create';
      const response = await api.post(endpoint, payload);

      if (response && response.success !== false) {
        toast({ title: editingClient ? 'Cliente atualizado!' : 'Cliente cadastrado com sucesso!' });
        await loadData();
        setIsDialogOpen(false);
        resetForm();
      } else {
        throw new Error(response?.message || "Erro ao processar requisição.");
      }
    } catch (err: any) {
      toast({
        title: "Erro ao salvar",
        description: err.message || "Verifique a conexão com o servidor.",
        variant: "destructive"
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'formalized': return <Badge variant="default" className="bg-emerald-600 hover:bg-emerald-700 border-none shadow-sm">Formalizado</Badge>;
      case 'waiting_formalization': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-none shadow-sm">Aguardando Formalização</Badge>;
      default: return <Badge variant="secondary" className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-none shadow-sm">Pendente</Badge>;
    }
  };

  const isPdf = (dataUrl: string) => dataUrl?.startsWith('data:application/pdf') || dataUrl?.endsWith('.pdf');

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Gerenciar Meus Clientes</h1>
            <p className="text-muted-foreground mt-1">Lista completa dos cadastros realizados no sistema.</p>
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
                <DialogDescription>Preencha os dados do cliente e anexe os documentos necessários.</DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input id="name" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required placeholder="Ex: João Silva" disabled={!!editingClient} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" value={formData.cpf} onChange={(e) => setFormData({ ...formData, cpf: formatCPF(e.target.value) })} required placeholder="000.000.000-00" maxLength={14} disabled={!!editingClient} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} placeholder="email@exemplo.com" disabled={!!editingClient} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input id="phone" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: formatPhone(e.target.value) })} placeholder="(00) 00000-0000" maxLength={15} disabled={!!editingClient} />
                  </div>
                </div>

                {editingClient && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg border border-border">
                    <div className="space-y-2">
                      <Label htmlFor="status" className="font-semibold flex items-center gap-2">Status</Label>
                      <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })} disabled={isFinalized}>
                        <SelectTrigger className="bg-background"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendente</SelectItem>
                          <SelectItem value="formalized">Formalizado</SelectItem>
                          <SelectItem value="waiting_formalization">Aguardando Formalização</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="createdAt" className="font-semibold flex items-center gap-2">Data de Registo</Label>
                      <div className="relative">
                        <CalendarDays className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="createdAt"
                          type="date"
                          className="pl-9 bg-background"
                          value={formData.createdAt}
                          onChange={(e) => setFormData({ ...formData, createdAt: e.target.value })}
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="observations">Observações do Atendimento</Label>
                  <Textarea id="observations" value={formData.observations} onChange={(e) => setFormData({ ...formData, observations: e.target.value })} placeholder="Detalhes relevantes sobre o cliente..." />
                </div>

                {/* --- SEÇÃO DE 3 ARQUIVOS --- */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-bold uppercase text-muted-foreground">Documentação (Máx. 20MB)</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      { label: "Documento", field: "imageUrl" as const, ref: fileInputDocRef },
                      { label: "Conta Luz", field: "imageUrl2" as const, ref: fileInputLuzRef },
                      { label: "Adicional", field: "imageUrl3" as const, ref: fileInputExtraRef }
                    ].map((item) => (
                      <div key={item.field} className="relative group">
                        <input type="file" ref={item.ref} className="hidden" accept="image/*,application/pdf" onChange={(e) => handleFileUpload(e, item.field)} />
                        <Button
                          type="button"
                          variant={formData[item.field] ? "default" : "outline"}
                          className={cn(
                            "w-full h-16 flex flex-col items-center justify-center gap-1 text-[10px] font-bold uppercase transition-all",
                            formData[item.field] ? "bg-emerald-600 hover:bg-emerald-700 border-none text-white shadow-sm" : "border-dashed border-2 hover:border-emerald-500 hover:bg-emerald-50/50"
                          )}
                          onClick={() => item.ref.current?.click()}
                        >
                          {formData[item.field] ? <FileCheck className="w-5 h-5" /> : <Upload className="w-5 h-5 text-muted-foreground" />}
                          <span className="truncate w-full text-center">{item.label}</span>
                        </Button>

                        {formData[item.field] && (
                          <button
                            type="button"
                            onClick={() => removeFile(item.field)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 shadow-md hover:bg-red-600 transition-colors z-10"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancelar</Button>
                  <Button type="submit" variant="hero">{editingClient ? 'Salvar Alterações' : 'Concluir Cadastro'}</Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={!!viewingClientDetails} onOpenChange={() => setViewingClientDetails(null)}>
            <DialogContent className="max-w-4xl p-0 gap-0 overflow-hidden bg-background border border-border shadow-2xl rounded-2xl [&>button]:hidden">
              {viewingClientDetails && (
                <div className="flex flex-col h-full">
                  <div className="relative bg-zinc-50/80 dark:bg-zinc-900/50 p-6 border-b border-border/60">
                    <div className="absolute top-4 right-4 z-50">
                      <Button variant="ghost" size="icon" onClick={() => setViewingClientDetails(null)} className="rounded-full bg-zinc-200/50 hover:bg-red-500 hover:text-white transition-all shadow-sm w-9 h-9" title="Fechar Detalhes"><X className="w-5 h-5" /></Button>
                    </div>
                    <div className="absolute top-5 right-16">{getStatusBadge(viewingClientDetails.status)}</div>
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5">
                      <div className="text-center sm:text-left space-y-1 mt-1">
                        <h2 className="text-2xl font-bold tracking-tight text-foreground">{viewingClientDetails.name}</h2>
                        <p className="text-sm text-muted-foreground flex items-center justify-center sm:justify-start gap-1"><span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-1.5 py-0.5 rounded text-xs">ID de Cadastro: {viewingClientDetails.id}</span></p>
                      </div>
                    </div>
                  </div>

                  <div className="p-6 space-y-8">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div className="group relative p-3 rounded-xl border bg-card hover:bg-zinc-50/80 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-zinc-300" onClick={() => copyToClipboard(viewingClientDetails.email || '', 'Email')}>
                        <div className="flex items-center gap-2 mb-1.5 text-muted-foreground group-hover:text-primary transition-colors"><Mail className="w-4 h-4" /><span className="text-xs font-medium uppercase tracking-wider">Email</span></div>
                        <p className="text-sm font-semibold text-foreground break-all">{viewingClientDetails.email || '-'}</p>
                        <Copy className="w-3 h-3 absolute top-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                      </div>
                      <div className="group relative p-3 rounded-xl border bg-card hover:bg-zinc-50/80 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-zinc-300" onClick={() => copyToClipboard(viewingClientDetails.phone || '', 'Telefone')}>
                        <div className="flex items-center gap-2 mb-1.5 text-muted-foreground group-hover:text-primary transition-colors"><Phone className="w-4 h-4" /><span className="text-xs font-medium uppercase tracking-wider">Telefone</span></div>
                        <p className="text-sm font-semibold truncate text-foreground">{viewingClientDetails.phone || '-'}</p>
                        <Copy className="w-3 h-3 absolute top-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                      </div>
                      <div className="group relative p-3 rounded-xl border bg-card hover:bg-zinc-50/80 transition-all cursor-pointer shadow-sm hover:shadow-md hover:border-zinc-300" onClick={() => copyToClipboard(viewingClientDetails.cpf, 'CPF')}>
                        <div className="flex items-center gap-2 mb-1.5 text-muted-foreground group-hover:text-primary transition-colors"><Hash className="w-4 h-4" /><span className="text-xs font-medium uppercase tracking-wider">CPF</span></div>
                        <p className="text-sm font-semibold truncate text-foreground">{viewingClientDetails.cpf}</p>
                        <Copy className="w-3 h-3 absolute top-3 right-3 opacity-0 group-hover:opacity-40 transition-opacity" />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="md:col-span-1 border-l-2 border-zinc-100 pl-4 space-y-6 ml-2">
                        <div className="relative">
                          <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-zinc-300 border-2 border-background ring-1 ring-zinc-100" />
                          <p className="text-xs text-muted-foreground mb-0.5">Criado em</p>
                          <p className="text-sm font-medium">{viewingClientDetails.createdAt ? format(new Date(viewingClientDetails.createdAt), "dd/MM/yyyy") : '-'}</p>
                          <p className="text-xs text-muted-foreground">{viewingClientDetails.createdAt ? format(new Date(viewingClientDetails.createdAt), "HH:mm") : '-'}</p>
                        </div>
                        <div className="relative">
                          <div className="absolute -left-[21px] top-1 h-2.5 w-2.5 rounded-full bg-primary border-2 border-background ring-1 ring-primary/20" />
                          <p className="text-xs text-muted-foreground mb-0.5">Última Edição</p>
                          <p className="text-sm font-medium">{viewingClientDetails.updatedAt ? format(new Date(viewingClientDetails.updatedAt), "dd/MM/yyyy") : '-'}</p>
                          <p className="text-xs text-muted-foreground">{viewingClientDetails.updatedAt ? format(new Date(viewingClientDetails.updatedAt), "HH:mm") : '-'}</p>
                        </div>
                      </div>
                      <div className="md:col-span-2 space-y-2">
                        <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><FileCheck className="w-3.5 h-3.5" /> Notas Internas</Label>
                        <div className="bg-zinc-50/50 p-4 rounded-xl border border-dashed border-zinc-200 text-sm text-foreground/80 min-h-[100px] leading-relaxed">{viewingClientDetails.observations || <span className="text-muted-foreground/50 italic">Sem observações registadas.</span>}</div>
                      </div>
                    </div>

                    {/* --- EXIBIÇÃO DOS 3 DOCUMENTOS NOS DETALHES --- */}
                    <div className="space-y-3">
                      <Label className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground"><ImageIcon className="w-3.5 h-3.5" /> Documentos Vinculados</Label>
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
                            <div key={idx} className="h-24 border border-dashed rounded-xl flex items-center justify-center bg-zinc-50/30 text-[9px] text-muted-foreground uppercase font-medium italic">Sem {doc.label}</div>
                          )
                        ))}
                      </div>
                    </div>
                  </div>
                  <div className="p-4 bg-zinc-50/50 border-t flex justify-end"><Button variant="outline" onClick={() => setViewingClientDetails(null)} className="rounded-lg px-6">Fechar Ficha</Button></div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          <Dialog open={!!viewingFile} onOpenChange={(open) => !open && setViewingFile(null)}>
            <DialogContent className="fixed !left-0 !top-0 !translate-x-0 !translate-y-0 w-screen h-screen max-w-none p-0 bg-emerald-950/90 backdrop-blur-md border-none shadow-none focus:outline-none [&>button]:hidden flex items-center justify-center pointer-events-none z-[100]">
              <DialogTitle className="sr-only">Visualização do Anexo</DialogTitle>
              <div className="relative w-full h-full flex flex-col items-center justify-center pointer-events-auto">
                <div className="fixed top-2 left-1/2 -translate-x-1/2 z-[110] flex items-center gap-2 p-2 bg-black/80 backdrop-blur-md rounded-full shadow-2xl border border-white/10">
                  {!isPdf(viewingFile || '') && (
                    <>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 rounded-full" onClick={() => setZoomScale(s => Math.max(0.5, s - 0.25))}><ZoomOut className="w-4 h-4" /></Button>
                      <span className="text-xs font-medium text-white w-12 text-center select-none">{Math.round(zoomScale * 100)}%</span>
                      <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 rounded-full" onClick={() => setZoomScale(s => Math.min(3, s + 0.25))}><ZoomIn className="w-4 h-4" /></Button>
                      <div className="w-px h-4 bg-white/20 mx-1" />
                    </>
                  )}
                  <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 rounded-full" onClick={handleDownload} title="Baixar Arquivo"><Download className="w-4 h-4" /></Button>
                  {isPdf(viewingFile || '') && <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 h-8 w-8 rounded-full" onClick={handleOpenNewTab} title="Abrir em Nova Aba"><ExternalLink className="w-4 h-4" /></Button>}
                  <div className="w-px h-4 bg-white/20 mx-1" />
                  <Button variant="ghost" size="icon" className="text-white hover:bg-red-500/80 h-8 w-8 rounded-full" onClick={() => setViewingFile(null)}><X className="w-4 h-4" /></Button>
                </div>
                <div className="w-[95vw] h-[90vh] flex items-center justify-center relative mt-8">
                  {viewingFile && (isPdf(viewingFile) ? (
                    <div className="w-full h-full bg-white rounded-lg overflow-hidden border border-border"><object data={viewingFile} type="application/pdf" className="w-full h-full" /></div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center overflow-auto p-4"><img src={viewingFile} className="rounded-lg shadow-2xl object-contain transition-transform duration-200 max-w-full max-h-full" style={{ transform: `scale(${zoomScale})` }} /></div>
                  ))}
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
                  <Input placeholder="Buscar por Nome ou CPF" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pr-10 h-7 text-xs" />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"><Search className="w-3 h-3" /></div>
                </div>
                <div className="flex items-center gap-2">
                  <Select value={periodFilter} onValueChange={setPeriodFilter}>
                    <SelectTrigger className="w-full sm:w-[150px] h-7 text-xs">
                      <div className="flex items-center gap-2 text-muted-foreground"><CalendarIcon className="w-3 h-3" /><span className="text-foreground truncate">{periodFilter === 'all' ? 'Período' : periodFilter === 'custom' ? 'Personalizado' : periodFilter === 'today' ? 'Hoje' : periodFilter === 'week' ? '7 Dias' : 'Mês'}</span></div>
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
                      <div className="relative w-[140px]"><CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" /><Input type="date" className="w-full h-7 text-xs pl-10 [&::-webkit-calendar-picker-indicator]:hidden" value={customDate.from} onChange={(e) => setCustomDate(prev => ({ ...prev, from: e.target.value }))} /></div>
                      <span className="text-xs text-muted-foreground">até</span>
                      <div className="relative w-[140px]"><CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" /><Input type="date" className="w-full h-7 text-xs pl-10 [&::-webkit-calendar-picker-indicator]:hidden" value={customDate.to} onChange={(e) => setCustomDate(prev => ({ ...prev, to: e.target.value }))} /></div>
                    </div>
                  )}
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[130px] h-7 text-xs">
                    <div className="flex items-center gap-2 text-muted-foreground"><Filter className="w-3 h-3" /><span className="text-foreground">{statusFilter === 'all' ? 'Status' : statusFilter === 'formalized' ? 'Formalizado' : statusFilter === 'waiting_formalization' ? 'Aguardando Formalização' : 'Pendente'}</span></div>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendentes</SelectItem>
                    <SelectItem value="formalized">Formalizados</SelectItem>
                    <SelectItem value="waiting_formalization">Aguardando Formalização</SelectItem>
                  </SelectContent>
                </Select>
                {(searchTerm !== '' || statusFilter !== 'all' || periodFilter !== 'all') && (<Button variant="ghost" size="icon" onClick={clearFilters} className="h-7 w-7 text-muted-foreground hover:text-destructive hover:bg-destructive/10 shrink-0" title="Limpar Filtros"><Eraser className="w-4 h-4" /></Button>)}
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader><TableRow><TableHead className="w-[80px]">ID</TableHead><TableHead>Cliente</TableHead><TableHead>CPF</TableHead><TableHead>Telefone</TableHead><TableHead>Status</TableHead><TableHead className="text-center w-[140px]">Ações</TableHead></TableRow></TableHeader>
                <TableBody>
                  {paginatedClients.length > 0 ? (paginatedClients.map((client) => (
                    <TableRow key={client.id}>
                      <TableCell className="text-xs font-semibold text-muted-foreground">#{client.id}</TableCell>
                      <TableCell><div><p className="font-medium">{client.name}</p><p className="text-sm text-muted-foreground">{client.email || '-'}</p></div></TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">{client.cpf}</TableCell>
                      <TableCell className="text-xs text-muted-foreground font-medium">{client.phone || '-'}</TableCell>
                      <TableCell>{getStatusBadge(client.status)}</TableCell>
                      <TableCell className="text-center"><div className="flex items-center justify-center gap-1"><Button variant="ghost" size="icon" onClick={() => handleViewDetails(client)} className="text-foreground hover:text-primary hover:bg-primary/10 h-8 w-8" title="Ver Detalhes"><Eye className="w-4 h-4" /></Button><Button variant="ghost" size="icon" onClick={() => handleOpenDialog(client)} className="text-muted-foreground hover:text-amber-600 hover:bg-amber-50 h-8 w-8" title="Editar"><Edit className="w-4 h-4" /></Button></div></TableCell>
                    </TableRow>
                  ))) : (<TableRow><TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Nenhum cliente encontrado.</TableCell></TableRow>)}
                </TableBody>
              </Table>
            </div>
            {totalPages > 1 && (
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-xs text-muted-foreground hidden sm:block">Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredClients.length)} de {filteredClients.length} resultados</span>
                <div className="flex items-center gap-1 mx-auto sm:mx-0">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={handlePrevPage} disabled={currentPage === 1}><ChevronLeft className="h-4 w-4" /></Button>
                  {getPageNumbers().map((page, index) => (page === '...' ? (<span key={`ellipsis-${index}`} className="px-2 text-xs text-muted-foreground">...</span>) : (<Button key={page} variant={currentPage === page ? "default" : "outline"} size="sm" className={`h-8 w-8 text-xs ${currentPage === page ? 'bg-primary text-primary-foreground' : ''}`} onClick={() => setCurrentPage(page as number)}>{page}</Button>)))}
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={handleNextPage} disabled={currentPage >= totalPages}><ChevronRight className="h-4 w-4" /></Button>
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