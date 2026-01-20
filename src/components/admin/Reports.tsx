import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
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
  Filter,
  Eraser,
  Calendar as CalendarIcon,
  List,
  Medal,
  Activity,
  Target, 
  Users as UsersIcon,
  Map // Ícone para Setores
} from 'lucide-react';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from '@/hooks/use-toast';
import { format, subDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { type DateRange } from 'react-day-picker';
import { cn } from '@/lib/utils';

const Reports: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isSupervisor = user?.role === 'supervisor';

  // --- ESTADOS DOS FILTROS ---
  const [selectedSector, setSelectedSector] = useState<string>(
    isSupervisor && user?.sectorId ? user.sectorId : 'all'
  );
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
    if (!isSupervisor) {
      setSelectedSector('all');
    }
    setSelectedUser('all');
    setSelectedStatus('all');
    setPeriodPreset('all');
    setDate(undefined);
  };

  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSector, selectedUser, selectedStatus, periodPreset, date]);

  // --- LÓGICA DE FILTRAGEM ---
  const filteredData = useMemo(() => {
    const data = mockClients.filter(client => {
      const matchSector = isSupervisor 
        ? client.sectorId === user?.sectorId
        : (selectedSector === 'all' || client.sectorId === selectedSector);

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

    return data.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [selectedSector, selectedUser, selectedStatus, date, isSupervisor, user?.sectorId]);

  const availableConsultants = useMemo(() => {
    if (isSupervisor) {
      return mockUsers.filter(u => u.role === 'user' && u.sectorId === user?.sectorId);
    }
    if (selectedSector === 'all') return mockUsers.filter(u => u.role === 'user');
    return mockUsers.filter(u => u.role === 'user' && u.sectorId === selectedSector);
  }, [selectedSector, isSupervisor, user?.sectorId]);

  // --- CÁLCULOS GERAIS ---
  const totalClients = filteredData.length;
  
  const clientsByStatus = {
    approved: filteredData.filter(c => c.status === 'approved').length,
    pending: filteredData.filter(c => c.status === 'pending').length,
    rejected: filteredData.filter(c => c.status === 'rejected').length,
  };

  // 1. Eficiência Geral
  const efficiencyRate = totalClients > 0 
    ? ((clientsByStatus.approved / totalClients) * 100).toFixed(1) 
    : '0.0';

  // 2. Novos Clientes Hoje
  const newClientsToday = useMemo(() => {
    return filteredData.filter(c => isSameDay(new Date(c.createdAt), new Date())).length;
  }, [filteredData]);

  // 3. Desempenho da Equipe (Para Supervisor)
  const teamPerformance = useMemo(() => {
    const stats: Record<string, { name: string, total: number, approved: number }> = {};
    availableConsultants.forEach(u => {
        stats[u.id] = { name: u.name, total: 0, approved: 0 };
    });
    filteredData.forEach(client => {
      if (stats[client.userId]) {
        stats[client.userId].total += 1;
        if (client.status === 'approved') stats[client.userId].approved += 1;
      }
    });
    return Object.values(stats).sort((a, b) => b.approved - a.approved).slice(0, 5); 
  }, [filteredData, availableConsultants]);

  // 4. Performance dos Setores (Para Admin - NOVA LÓGICA)
  const sectorPerformance = useMemo(() => {
    const stats: Record<string, { name: string, total: number, approved: number }> = {};
    mockSectors.forEach(s => {
        stats[s.id] = { name: s.name, total: 0, approved: 0 };
    });
    filteredData.forEach(client => {
        if (stats[client.sectorId]) {
            stats[client.sectorId].total += 1;
            if (client.status === 'approved') stats[client.sectorId].approved += 1;
        }
    });
    return Object.values(stats).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [filteredData]);

  // --- LÓGICA DO RANKING (Card Lateral - Usa Team Performance sempre) ---
  const consultantsRanking = useMemo(() => {
    return teamPerformance.map(stat => ({ name: stat.name, count: stat.approved }));
  }, [teamPerformance]);

  // --- PAGINAÇÃO ---
  const totalPages = Math.ceil(totalClients / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredData.slice(startIndex, startIndex + itemsPerPage);

  // --- EXPORTAR EXCEL ---
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast({ title: "Atenção", description: "Não há dados para exportar.", variant: "destructive" });
      return;
    }
    try {
      const tableHeaders = ["ID", "Cliente", "Email", "Telefone", "CPF", "Setor", "Consultor", "Status", "Data Cadastro", "Observações"];
      const tableRows = filteredData.map(client => `
        <tr>
          <td style="mso-number-format:'@'">${client.id}</td>
          <td>${client.name}</td>
          <td>${client.email}</td>
          <td style="mso-number-format:'@'">${client.phone}</td>
          <td style="mso-number-format:'@'">${client.cpf}</td>
          <td>${getSectorName(client.sectorId)}</td>
          <td>${getUserName(client.userId)}</td>
          <td>${client.status === 'approved' ? 'Aprovado' : client.status === 'rejected' ? 'Reprovado' : 'Pendente'}</td>
          <td>${format(new Date(client.createdAt), "dd/MM/yyyy HH:mm")}</td>
          <td>${client.observations || '-'}</td>
        </tr>
      `).join('');
      const excelTemplate = `
        <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
        <head><meta charset="UTF-8"><style>th{background-color:#059669;color:#fff;border:1px solid #047857;}td{border:1px solid #e5e7eb;}</style></head>
        <body><table><thead><tr>${tableHeaders.map(h => `<th>${h}</th>`).join('')}</tr></thead><tbody>${tableRows}</tbody></table></body></html>
      `;
      const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Relatorio_Clientes_${format(new Date(), 'dd-MM-yyyy_HH-mm')}.xls`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: "Sucesso", description: "Planilha gerada com sucesso!", className: "bg-emerald-50 border-emerald-200 text-emerald-800" });
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao gerar o arquivo Excel.", variant: "destructive" });
    }
  };

  const getSectorName = (id: string) => mockSectors.find(s => s.id === id)?.name || 'N/A';
  const getUserName = (id: string) => mockUsers.find(u => u.id === id)?.name || 'N/A';

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

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Relatórios {isSupervisor ? ` - ${getSectorName(user?.sectorId || '')}` : 'Gerenciais'}
            </h1>
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

        {/* --- CARD DE FILTROS --- */}
        <Card className="bg-muted/40 border-muted-foreground/20 shadow-sm w-full md:w-fit ml-auto transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex flex-col xl:flex-row gap-4 items-end xl:items-center xl:justify-end">
              
              <div className="flex items-center gap-2 text-sm font-bold text-foreground min-w-[60px] pb-2 xl:pb-0 shrink-0">
                <Filter className="w-4 h-4" /> Filtros:
              </div>
              
              <div className="flex flex-wrap items-center justify-end gap-3 w-full xl:w-auto">
                {!isSupervisor && (
                  <div className="w-full sm:w-[160px]">
                    <Select value={selectedSector} onValueChange={(v) => { setSelectedSector(v); setSelectedUser('all'); }}>
                      <SelectTrigger className="bg-background border-input focus:ring-ring h-9 text-xs"><SelectValue placeholder="Setor" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos Setores</SelectItem>
                        {mockSectors.map((s) => (<SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>))}
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div className="w-full sm:w-[160px]">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="bg-background border-input focus:ring-ring h-9 text-xs"><SelectValue placeholder="Consultor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Consultores</SelectItem>
                      {availableConsultants.map((u) => (<SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-[160px]">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="bg-background border-input focus:ring-ring h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
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
                    <SelectTrigger className="bg-background border-input focus:ring-ring h-9 text-xs"><SelectValue placeholder="Período" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o período</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="7days">Últimos 7 dias</SelectItem>
                      <SelectItem value="month">Este Mês</SelectItem>
                      <SelectItem value="custom">Personalizado...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {periodPreset === 'custom' && (
                  <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-right-2">
                    <Input type="date" className="h-9 text-xs bg-background w-[130px]" value={date?.from ? format(date.from, 'yyyy-MM-dd') : ''} onChange={handleFromDateChange} />
                    <span className="text-muted-foreground text-xs">até</span>
                    <Input type="date" className="h-9 text-xs bg-background w-[130px]" value={date?.to ? format(date.to, 'yyyy-MM-dd') : ''} onChange={handleToDateChange} />
                  </div>
                )}
                <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9"><Eraser className="w-5 h-5" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" /> Eficiência Geral
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{efficiencyRate}%</div>
              <p className="text-xs text-muted-foreground mt-1">Taxa de aprovação total</p>
            </CardContent>
          </Card>
          
          {/* Card Entrada Recente (VOLTOU AO ORIGINAL) */}
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-500" /> Entrada Recente
              </CardTitle>
              <CardDescription className="text-sm font-medium text-foreground">
                {newClientsToday} novos clientes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-2 w-full bg-purple-100 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-purple-500 transition-all duration-1000 ease-out" style={{ width: `${Math.min((newClientsToday / (totalClients || 1)) * 100, 100)}%` }} />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Cadastrados hoje</p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-warning">
            <CardHeader>
              <CardTitle className="text-lg">Pendências</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-warning">{clientsByStatus.pending}</div>
              <p className="text-xs text-muted-foreground">Aguardando análise</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-emerald-500 flex flex-col hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Medal className="w-5 h-5 text-emerald-500" /> Ranking Top 5
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center">
              {consultantsRanking.length > 0 ? (
                <div className="space-y-2">
                  {consultantsRanking.map((item, index) => (
                    <div key={index} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <span className={cn("w-5 h-5 flex items-center justify-center rounded-full text-[10px] font-bold", index === 0 ? "bg-yellow-100 text-yellow-700" : index === 1 ? "bg-slate-100 text-slate-700" : index === 2 ? "bg-orange-100 text-orange-700" : "bg-muted text-muted-foreground")}>{index + 1}º</span>
                        <span className="font-medium truncate max-w-[100px]">{item.name.split(' ')[0]}</span>
                      </div>
                      <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{item.count}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-muted-foreground text-xs py-2">Sem dados de aprovação</div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabelas de Resumo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-primary" /> Distribuição por Status</CardTitle>
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

          {/* CARD HÍBRIDO (Muda conteúdo baseado no Role) */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {/* Se for Admin mostra Mapa (Setores), se não Usuários (Equipe) */}
                {!isSupervisor ? <Map className="w-5 h-5 text-indigo-500" /> : <UsersIcon className="w-5 h-5 text-secondary" />}
                {!isSupervisor ? 'Performance dos Setores' : 'Desempenho da Equipe'}
              </CardTitle>
              <CardDescription>
                {!isSupervisor ? 'Comparativo de produtividade por região' : 'Produção individual no período'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{!isSupervisor ? 'Setor' : 'Consultor'}</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Aprov.</TableHead>
                      <TableHead className="text-right text-xs">Conv.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {(!isSupervisor ? sectorPerformance : teamPerformance).length > 0 ? (
                      (!isSupervisor ? sectorPerformance : teamPerformance).map((stat) => (
                        <TableRow key={stat.name}>
                          <TableCell className="font-medium truncate max-w-[120px]">
                            {stat.name.length > 20 ? stat.name.substring(0, 20) + '...' : stat.name}
                          </TableCell>
                          <TableCell className="text-right">{stat.total}</TableCell>
                          <TableCell className="text-right text-emerald-600 font-medium">{stat.approved}</TableCell>
                          <TableCell className="text-right text-xs text-muted-foreground">
                            {stat.total > 0 ? ((stat.approved / stat.total) * 100).toFixed(0) : 0}%
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground py-4">
                          Nenhum dado neste filtro
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- RELATÓRIO DETALHADO --- */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2"><List className="w-5 h-5 text-primary" /> Relatório Detalhado</CardTitle>
                <CardDescription>Listagem completa.</CardDescription>
              </div>
              <div className="text-sm text-muted-foreground">Total: <strong>{totalClients}</strong></div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border mb-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Cliente</TableHead>
                    <TableHead>CPF</TableHead>
                    <TableHead>Telefone</TableHead>
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
                        <TableCell className="text-xs text-muted-foreground font-medium">{client.cpf}</TableCell>
                        <TableCell className="text-xs text-muted-foreground font-medium">{client.phone}</TableCell>
                        <TableCell>{getSectorName(client.sectorId)}</TableCell>
                        <TableCell>{getUserName(client.userId)}</TableCell>
                        <TableCell>{format(new Date(client.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}</TableCell>
                        <TableCell className="text-right">
                          <Badge variant="outline" className={cn(client.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : client.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 'bg-orange-100 text-orange-700 border-orange-200')}>
                            {client.status === 'approved' ? 'Aprovado' : client.status === 'rejected' ? 'Reprovado' : 'Pendente'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={7} className="h-24 text-center text-muted-foreground">Nenhum cliente encontrado.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
            {totalClients > 0 && (
              <Pagination>
                <PaginationContent>
                  <PaginationItem><PaginationPrevious onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} className={currentPage === 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>
                  {getPageNumbers().map((page, index) => (
                    <PaginationItem key={index}>{page === '...' ? (<PaginationEllipsis />) : (<PaginationLink isActive={currentPage === page} onClick={() => setCurrentPage(page as number)} className="cursor-pointer">{page}</PaginationLink>)}</PaginationItem>
                  ))}
                  <PaginationItem><PaginationNext onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} className={currentPage >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'} /></PaginationItem>
                </PaginationContent>
              </Pagination>
            )}
          </CardContent>
        </Card>

      </div>
    </DashboardLayout>
  );
};

export default Reports;