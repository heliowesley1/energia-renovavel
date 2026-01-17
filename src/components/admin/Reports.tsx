/**
 * ARQUIVO: src/components/admin/Reports.tsx
 * * CORREÇÕES:
 * 1. Card de Filtros: Adicionado `w-full md:w-fit ml-auto` para não expandir totalmente.
 * 2. Alinhamento: Uso de `items-center` e `gap` consistentes para alinhar botões e inputs.
 * 3. Paginação: Ajuste de layout para garantir botões alinhados.
 */

import React, { useState, useMemo, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockClients, mockSectors, mockUsers } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  FileSpreadsheet, 
  PieChart as PieChartIcon, 
  Building2,
  Filter,
  Eraser,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  List,
  Trophy,
  Medal
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

const Reports: React.FC = () => {
  const { toast } = useToast();

  // --- ESTADOS DOS FILTROS ---
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [periodPreset, setPeriodPreset] = useState<string>('all');
  const [date, setDate] = useState<DateRange | undefined>();

  // --- ESTADO DE PAGINAÇÃO ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- HANDLERS DOS FILTROS ---
  const handlePeriodPresetChange = (value: string) => {
    setPeriodPreset(value);
    const today = new Date();

    switch (value) {
      case 'today':
        setDate({ from: today, to: today });
        break;
      case '7days':
        setDate({ from: subDays(today, 7), to: today });
        break;
      case 'month':
        setDate({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case 'all':
        setDate(undefined);
        break;
      case 'custom':
        if (!date) setDate({ from: undefined, to: undefined }); 
        break;
    }
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const newDate = newVal ? new Date(newVal + 'T00:00:00') : undefined;
    setDate(prev => ({ ...prev, from: newDate }));
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const newDate = newVal ? new Date(newVal + 'T23:59:59') : undefined;
    setDate(prev => ({ ...prev, to: newDate }));
  };

  const clearFilters = () => {
    setSelectedSector('all');
    setSelectedUser('all');
    setSelectedStatus('all');
    setPeriodPreset('all');
    setDate(undefined);
  };

  // Resetar paginação ao filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSector, selectedUser, selectedStatus, periodPreset, date]);

  // --- LÓGICA DE FILTRAGEM ---
  const filteredData = useMemo(() => {
    return mockClients.filter(client => {
      const matchSector = selectedSector === 'all' || client.sectorId === selectedSector;
      const matchUser = selectedUser === 'all' || client.userId === selectedUser;
      const matchStatus = selectedStatus === 'all' || client.status === selectedStatus;
      
      let matchDate = true;
      if (date?.from) {
        const clientDate = new Date(client.createdAt);
        const fromDate = new Date(date.from);
        fromDate.setHours(0, 0, 0, 0);
        
        if (date.to) {
          const toDate = new Date(date.to);
          toDate.setHours(23, 59, 59, 999);
          matchDate = clientDate >= fromDate && clientDate <= toDate;
        } else {
          matchDate = clientDate >= fromDate;
        }
      }
      
      return matchSector && matchUser && matchStatus && matchDate;
    });
  }, [selectedSector, selectedUser, selectedStatus, date]);

  const availableConsultants = useMemo(() => {
    if (selectedSector === 'all') return mockUsers.filter(u => u.role === 'user');
    return mockUsers.filter(u => u.role === 'user' && u.sectorId === selectedSector);
  }, [selectedSector]);

  // --- CÁLCULOS GERAIS ---
  const totalClients = filteredData.length;
  
  const clientsByStatus = {
    approved: filteredData.filter(c => c.status === 'approved').length,
    pending: filteredData.filter(c => c.status === 'pending').length,
    rejected: filteredData.filter(c => c.status === 'rejected').length,
  };

  const clientsBySector = mockSectors.map(sector => ({
    name: sector.name,
    count: filteredData.filter(c => c.sectorId === sector.id).length
  })).filter(s => s.count > 0);

  // --- LÓGICA DO RANKING ---
  const consultantsRanking = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredData.forEach(client => {
      if (client.status === 'approved') {
        counts[client.userId] = (counts[client.userId] || 0) + 1;
      }
    });
    return Object.entries(counts)
      .map(([userId, count]) => {
        const user = mockUsers.find(u => u.id === userId);
        return { name: user?.name || 'Desconhecido', count };
      })
      .sort((a, b) => b.count - a.count)
      .slice(0, 3);
  }, [filteredData]);

  // --- PAGINAÇÃO ---
  const totalPages = Math.ceil(totalClients / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  // --- EXPORTAR ---
  const handleExportExcel = () => {
    toast({
      title: "Exportando Excel",
      description: `Gerando arquivo com ${totalClients} registros filtrados...`,
    });
  };

  const getSectorName = (id: string) => mockSectors.find(s => s.id === id)?.name || 'N/A';
  const getUserName = (id: string) => mockUsers.find(u => u.id === id)?.name || 'N/A';

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Relatórios Gerenciais</h1>
            <p className="text-muted-foreground mt-1">Extração e análise detalhada de dados</p>
          </div>
          <div>
            <Button 
              onClick={handleExportExcel}
              className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-all h-10 px-4"
            >
              <FileSpreadsheet className="w-4 h-4 mr-2" />
              Exportar Excel
            </Button>
          </div>
        </div>

        {/* --- CARD DE FILTROS (AJUSTADO) --- */}
        {/* w-full md:w-fit ml-auto: Card cresce conforme conteúdo e flutua à direita */}
        <Card className="bg-muted/40 border-muted-foreground/20 shadow-sm w-full md:w-fit ml-auto transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex flex-col xl:flex-row gap-4 items-end xl:items-center xl:justify-end">
              
              <div className="flex items-center gap-2 text-sm font-bold text-foreground min-w-[60px] pb-2 xl:pb-0 shrink-0">
                <Filter className="w-4 h-4" /> Filtros:
              </div>
              
              {/* Container de Inputs - Items alinhados ao centro */}
              <div className="flex flex-wrap items-center justify-end gap-3 w-full xl:w-auto">
                
                <div className="w-full sm:w-[160px]">
                  <Select value={selectedSector} onValueChange={(v) => { setSelectedSector(v); setSelectedUser('all'); }}>
                    <SelectTrigger className="bg-background border-input focus:ring-ring h-9 text-xs">
                      <SelectValue placeholder="Setor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Setores</SelectItem>
                      {mockSectors.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-[160px]">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="bg-background border-input focus:ring-ring h-9 text-xs">
                      <SelectValue placeholder="Consultor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Consultores</SelectItem>
                      {availableConsultants.map((u) => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-[160px]">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="bg-background border-input focus:ring-ring h-9 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="approved">Aprovados</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="rejected">Reprovados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-[160px]">
                  <Select value={periodPreset} onValueChange={handlePeriodPresetChange}>
                    <SelectTrigger className="bg-background border-input focus:ring-ring h-9 text-xs">
                      <SelectValue placeholder="Período" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o período</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="7days">Últimos 7 dias</SelectItem>
                      <SelectItem value="month">Este Mês</SelectItem>
                      <SelectItem value="custom">Personalizado...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Datas Personalizadas */}
                {periodPreset === 'custom' && (
                  <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-right-2">
                    <div className="relative w-full sm:w-[130px]">
                      <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10 pointer-events-none" />
                      <Input type="date" className="h-9 text-xs bg-background pl-8" value={date?.from ? format(date.from, 'yyyy-MM-dd') : ''} onChange={handleFromDateChange} />
                    </div>
                    <span className="text-muted-foreground text-xs font-medium">até</span>
                    <div className="relative w-full sm:w-[130px]">
                      <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground z-10 pointer-events-none" />
                      <Input type="date" className="h-9 text-xs bg-background pl-8" value={date?.to ? format(date.to, 'yyyy-MM-dd') : ''} onChange={handleToDateChange} />
                    </div>
                  </div>
                )}

                {/* Botão Limpar */}
                {(selectedSector !== 'all' || selectedUser !== 'all' || selectedStatus !== 'all' || periodPreset !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={clearFilters}
                    className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9"
                    title="Limpar Filtros"
                  >
                    <Eraser className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eficiência</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {totalClients > 0 ? ((clientsByStatus.approved / totalClients) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Taxa de aprovação total</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Setor Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold truncate">
                {clientsBySector.sort((a, b) => b.count - a.count)[0]?.name || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Maior volume (Filtro)</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pendências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">
                {clientsByStatus.pending}
              </div>
              <p className="text-xs text-muted-foreground">Aguardando análise</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 flex flex-col">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Medal className="w-5 h-5 text-emerald-500" /> Ranking
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              {consultantsRanking.length > 0 ? (
                <div className="space-y-2">
                  {consultantsRanking.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn(
                          "w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold",
                          index === 0 ? "bg-yellow-100 text-yellow-700" :
                          index === 1 ? "bg-slate-100 text-slate-700" :
                          "bg-orange-100 text-orange-700"
                        )}>
                          {index + 1}º
                        </span>
                        <span className="font-medium truncate max-w-[100px]">{item.name.split(' ')[0]}</span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {item.count}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground text-xs py-2">
                  Sem dados de aprovação
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabelas de Resumo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <PieChartIcon className="w-5 h-5 text-primary" />
                Distribuição por Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Qtd</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell className="font-medium text-success">Aprovados</TableCell>
                    <TableCell className="text-right">{clientsByStatus.approved}</TableCell>
                    <TableCell className="text-right">{totalClients > 0 ? ((clientsByStatus.approved / totalClients) * 100).toFixed(0) : 0}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-warning">Pendentes</TableCell>
                    <TableCell className="text-right">{clientsByStatus.pending}</TableCell>
                    <TableCell className="text-right">{totalClients > 0 ? ((clientsByStatus.pending / totalClients) * 100).toFixed(0) : 0}%</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="font-medium text-destructive">Reprovados</TableCell>
                    <TableCell className="text-right">{clientsByStatus.rejected}</TableCell>
                    <TableCell className="text-right">{totalClients > 0 ? ((clientsByStatus.rejected / totalClients) * 100).toFixed(0) : 0}%</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5 text-secondary" />
                Performance por Setor
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Setor</TableHead>
                    <TableHead className="text-right">Clientes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {clientsBySector.length > 0 ? (
                    clientsBySector.map((item) => (
                      <TableRow key={item.name}>
                        <TableCell>{item.name}</TableCell>
                        <TableCell className="text-right">{item.count}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={2} className="text-center text-muted-foreground py-4">
                        Nenhum dado neste filtro
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* --- RELATÓRIO DETALHADO (PAGINADO) --- */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2">
                  <List className="w-5 h-5 text-primary" /> 
                  Relatório Detalhado
                </CardTitle>
                <CardDescription>
                  Listagem completa. Página {currentPage} de {totalPages || 1}.
                </CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">
                Total: <strong>{totalClients}</strong>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead>Consultor</TableHead>
                    <TableHead>Data Cadastro</TableHead>
                    <TableHead className="text-right">Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedClients.length > 0 ? (
                    paginatedClients.map((client) => (
                      <TableRow key={client.id} className="hover:bg-muted/50">
                        <TableCell className="font-medium">{client.name}</TableCell>
                        <TableCell>{getSectorName(client.sectorId)}</TableCell>
                        <TableCell>{getUserName(client.userId)}</TableCell>
                        <TableCell>{format(new Date(client.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                        <TableCell className="text-right">
                          <Badge 
                            variant="outline" 
                            className={cn(
                              client.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                              client.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                              'bg-orange-100 text-orange-700 border-orange-200'
                            )}
                          >
                            {client.status === 'approved' ? 'Aprovado' : 
                             client.status === 'rejected' ? 'Reprovado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Nenhum cliente encontrado.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {/* Paginação Corrigida com Gap */}
            {totalClients > 0 && (
              <div className="flex items-center justify-end gap-2 py-4">
                <div className="flex-1 text-sm text-muted-foreground">
                  {startIndex + 1} - {Math.min(startIndex + itemsPerPage, totalClients)} de {totalClients}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrevPage}
                    disabled={currentPage === 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleNextPage}
                    disabled={currentPage >= totalPages}
                  >
                    Próximo
                    <ChevronRight className="h-4 w-4 ml-1" />
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

export default Reports;