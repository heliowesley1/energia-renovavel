import React, { useState, useMemo, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useApi } from '@/hooks/useApi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { format, subDays, startOfMonth, endOfMonth, isSameDay } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import { 
  Users, 
  Filter,
  TrendingUp, 
  Briefcase, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  Eraser,
  PieChart,
  BarChart3,
  UserCheck,
  Calendar as CalendarIcon,
  Zap,
  Trophy,
  Rocket
} from 'lucide-react';

const AdminOverview: React.FC = () => {
  const { user } = useAuth();
  const api = useApi();
  const isSupervisor = user?.role === 'supervisor';

  // --- ESTADOS DE DADOS REAIS ---
  const [dbClients, setDbClients] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbSectors, setDbSectors] = useState<any[]>([]);

  // Busca dados reais do banco (XAMPP)
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const [c, u, s] = await Promise.all([
          api.get('/clientes.php'),
          api.get('/usuarios.php'),
          api.get('/setores.php')
        ]);
        setDbClients(c || []);
        setDbUsers(u || []);
        setDbSectors(s || []);
      } catch (error) {
        console.error("Erro ao carregar dados do banco:", error);
      }
    };
    loadDashboardData();
  }, []);

  // --- Estados dos Filtros ---
  const [selectedSector, setSelectedSector] = useState<string>(
    isSupervisor && user?.sectorId ? user.sectorId : 'all'
  );
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [periodPreset, setPeriodPreset] = useState<string>('all');
  const [date, setDate] = useState<DateRange | undefined>();

  // --- Handlers ---
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

  // --- Lógica de Filtragem ---
  const filteredData = useMemo(() => {
    return dbClients.filter(client => {
      // Regra de segurança para supervisor
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
  }, [dbClients, selectedSector, selectedUser, selectedStatus, date, isSupervisor, user?.sectorId]);

  const availableConsultants = useMemo(() => {
    if (isSupervisor) {
      return dbUsers.filter(u => u.role === 'user' && u.sectorId === user?.sectorId);
    }
    if (selectedSector === 'all') return dbUsers.filter(u => u.role === 'user');
    return dbUsers.filter(u => u.role === 'user' && u.sectorId === selectedSector);
  }, [dbUsers, selectedSector, isSupervisor, user?.sectorId]);

  // --- Métricas Gerais ---
  const total = filteredData.length;
  const approved = filteredData.filter(c => c.status === 'approved').length;
  const pending = filteredData.filter(c => c.status === 'pending').length;
  const rejected = filteredData.filter(c => c.status === 'rejected').length;

  const approvedPerc = total > 0 ? (approved / total) * 100 : 0;
  const pendingPerc = total > 0 ? (pending / total) * 100 : 0;
  const rejectedPerc = total > 0 ? (rejected / total) * 100 : 0;
  
  // --- Métricas Específicas para Cards Inferiores ---
  const activeConsultantIds = Array.from(new Set(filteredData.map(c => c.userId)));
  const activeConsultantsCount = activeConsultantIds.length;

  // Lógica: Top Performer (Supervisor)
  const topPerformer = useMemo(() => {
    if (filteredData.length === 0) return null;
    const stats: Record<string, number> = {};
    filteredData.forEach(c => {
        if (c.status === 'approved') stats[c.userId] = (stats[c.userId] || 0) + 1;
    });
    const topId = Object.keys(stats).reduce((a, b) => stats[a] > stats[b] ? a : b, '');
    if (!topId) return null;
    const userData = dbUsers.find(u => u.id === topId);
    return { name: userData?.name.split(' ')[0], count: stats[topId] };
  }, [filteredData, dbUsers]);

  // Lógica: Novos Hoje (Supervisor)
  const newToday = filteredData.filter(c => isSameDay(new Date(c.createdAt), new Date())).length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        
        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              {isSupervisor ? 'Visão geral da sua equipe e resultados.' : 'Análise de performance com filtros avançados.'}
            </p>
          </div>
          
          <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/40 px-4 py-2 rounded-full border border-border/50 shadow-sm">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            <span>Bem-vindo, <strong className="text-foreground font-semibold">{user?.name}</strong></span>
          </div>
        </div>

        {/* Barra de Filtros */}
        <Card className="bg-muted/40 border-muted-foreground/20 shadow-sm w-full md:w-fit ml-auto transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex flex-col xl:flex-row gap-4 items-end xl:items-center xl:justify-end">
              
              <div className="flex items-center gap-2 text-sm font-bold text-foreground min-w-[60px] pb-2 xl:pb-0">
                <Filter className="w-4 h-4" /> Filtros:
              </div>
              
              <div className="flex flex-wrap items-center justify-end gap-3 w-full xl:w-auto">
                
                {!isSupervisor && (
                  <div className="w-full sm:w-[150px]">
                    <Select 
                      value={selectedSector} 
                      onValueChange={(v) => { setSelectedSector(v); setSelectedUser('all'); }}
                    >
                      <SelectTrigger className="bg-background border-input focus:ring-ring h-9 text-xs">
                        <SelectValue placeholder="Setor" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos Setores</SelectItem>
                        {dbSectors.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                <div className="w-full sm:w-[150px] animate-in fade-in slide-in-from-left-2 duration-300">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="bg-background border-input focus:ring-ring h-9 text-xs">
                      <SelectValue placeholder="Consultor" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Consultores</SelectItem>
                      {availableConsultants.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full sm:w-[150px]">
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

                <div className="w-full sm:w-[150px]">
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

                {periodPreset === 'custom' && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 w-full sm:w-auto">
                    <div className="relative w-full sm:w-[140px]">
                      <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                      <Input 
                        type="date" 
                        className="h-9 text-xs bg-background pl-9 w-full" 
                        value={date?.from ? format(date.from, 'yyyy-MM-dd') : ''}
                        onChange={handleFromDateChange}
                      />
                    </div>
                    <span className="text-muted-foreground text-xs font-medium">até</span>
                    <div className="relative w-full sm:w-[140px]">
                      <CalendarIcon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                      <Input 
                        type="date" 
                        className="h-9 text-xs bg-background pl-9 w-full" 
                        value={date?.to ? format(date.to, 'yyyy-MM-dd') : ''}
                        onChange={handleToDateChange}
                      />
                    </div>
                  </div>
                )}

                <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={clearFilters}
                    className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9"
                    title="Limpar Filtros"
                  >
                    <Eraser className="w-5 h-5" />
                  </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- CARDS PRINCIPAIS (Totais) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-l-4 border-l-blue-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Selecionado</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-black">{total}</div>
              <p className="text-xs text-muted-foreground">Clientes encontrados</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold text-black">{approved}</div>
                <div className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                  {approvedPerc.toFixed(1)}%
                </div>
              </div>
              <Progress value={approvedPerc} className="h-1 mt-3 bg-emerald-100 [&>div]:bg-emerald-500" />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold text-black">{pending}</div>
                <div className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  {pendingPerc.toFixed(1)}%
                </div>
              </div>
              <Progress value={pendingPerc} className="h-1 mt-3 bg-orange-100 [&>div]:bg-orange-500" />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-red-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reprovados</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold text-black">{rejected}</div>
                <div className="text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded">
                  {rejectedPerc.toFixed(1)}%
                </div>
              </div>
              <Progress value={rejectedPerc} className="h-1 mt-3 bg-red-100 [&>div]:bg-red-600" />
            </CardContent>
          </Card>
        </div>

        {/* --- CARDS SECUNDÁRIOS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
           {/* Card 1: Varia conforme o cargo */}
           {isSupervisor ? (
             <Card className="shadow-sm border-l-4 border-l-amber-500 bg-amber-50/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase text-amber-600 font-semibold tracking-wider flex items-center gap-2">
                    <Trophy className="w-3 h-3" /> Destaque
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-xl font-bold text-foreground truncate">
                    {topPerformer ? topPerformer.name : '-'}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {topPerformer ? `${topPerformer.count} aprovações no filtro` : 'Sem dados suficientes'}
                  </p>
                </CardContent>
             </Card>
           ) : (
             <Card className="shadow-sm border-l-4 border-l-slate-500">
               <CardHeader className="pb-2">
                 <CardTitle className="text-xs uppercase text-muted-foreground font-semibold tracking-wider flex items-center gap-2">
                   <UserCheck className="w-3 h-3 text-slate-600" /> Equipe em Campo
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold text-slate-700">{activeConsultantsCount}</div>
                 <p className="text-xs text-muted-foreground mt-1">Consultores ativos no filtro</p>
               </CardContent>
             </Card>
           )}

           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-xs uppercase text-muted-foreground font-semibold tracking-wider flex items-center gap-2">
                 <TrendingUp className="w-3 h-3" /> Taxa de Aprovação
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">
                 {total > 0 ? ((approved / total) * 100).toFixed(1) : 0}%
               </div>
               <p className="text-xs text-muted-foreground mt-1">Eficiência da seleção atual</p>
             </CardContent>
           </Card>

           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-xs uppercase text-muted-foreground font-semibold tracking-wider flex items-center gap-2">
                 <PieChart className="w-3 h-3" /> Share de Pendência
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">{pendingPerc.toFixed(1)}%</div>
               <p className="text-xs text-muted-foreground mt-1">Volume em funil de vendas</p>
             </CardContent>
           </Card>

           {/* Card 4: Varia conforme o cargo */}
           {isSupervisor ? (
             <Card className="shadow-sm border-l-4 border-l-amber-500 bg-amber-50/10">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs uppercase text-amber-600 font-semibold tracking-wider flex items-center gap-2">
                    <Rocket className="w-3 h-3" /> Cadastros Hoje
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-foreground">
                    {newToday}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Entrada diária do setor</p>
                </CardContent>
             </Card>
           ) : (
             <Card>
               <CardHeader className="pb-2">
                 <CardTitle className="text-xs uppercase text-muted-foreground font-semibold tracking-wider flex items-center gap-2">
                   <Briefcase className="w-3 h-3" /> Setores Envolvidos
                 </CardTitle>
               </CardHeader>
               <CardContent>
                 <div className="text-2xl font-bold">
                   {selectedSector === 'all' ? dbSectors.length : 1}
                 </div>
                 <p className="text-xs text-muted-foreground mt-1">Áreas operando neste filtro</p>
               </CardContent>
             </Card>
           )}
        </div>

        {/* Tabelas Inferiores */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 flex flex-col h-full">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" /> Distribuição de Resultados
              </CardTitle>
              <CardDescription>
                Visualização rápida dos clientes que compõem os números acima
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[400px]">
              <div className="space-y-4">
                {filteredData.slice(0, 10).map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors">
                    <div className="flex flex-col gap-1">
                      <span className="font-medium text-sm">{client.name}</span>
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Users className="w-3 h-3" /> 
                        {dbUsers.find(u => u.id === client.userId)?.name || 'N/A'}
                        <span className="mx-1">•</span>
                        {format(new Date(client.createdAt), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                        {!isSupervisor && (
                          <span className="text-xs text-muted-foreground hidden sm:inline-block">
                            {dbSectors.find(s => s.id === client.sectorId)?.name}
                          </span>
                        )}
                        <div className={`px-2 py-1 rounded text-xs font-medium capitalize border
                          ${client.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                            client.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                            'bg-orange-100 text-orange-700 border-orange-200'}`}>
                          {client.status === 'approved' ? 'Aprovado' : 
                           client.status === 'rejected' ? 'Reprovado' : 'Pendente'}
                        </div>
                    </div>
                  </div>
                ))}
                
                {filteredData.length === 0 && (
                   <div className="text-center py-12 text-muted-foreground">
                     <Filter className="w-12 h-12 mx-auto mb-3 opacity-20" />
                     <p>Nenhum dado encontrado com os filtros atuais.</p>
                   </div>
                )}
                
                {filteredData.length > 10 && (
                  <div className="text-center pt-2">
                    <p className="text-xs text-muted-foreground">
                      + {filteredData.length - 10} outros clientes ocultos. Ver lista completa em "Clientes".
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full">
            <CardHeader>
              <CardTitle>Top Consultores</CardTitle>
              <CardDescription>No filtro selecionado</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[400px]">
               <div className="space-y-4">
                 {activeConsultantIds.map(userId => {
                   const uData = dbUsers.find(u => u.id === userId);
                   if (!uData) return null;
                   const count = filteredData.filter(c => c.userId === userId).length;
                   const userApproved = filteredData.filter(c => c.userId === userId && c.status === 'approved').length;
                   
                   return (
                     <div key={userId} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {uData.name.substring(0,2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{uData.name}</p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <span>{count} Clientes</span>
                            <span className="w-1 h-1 rounded-full bg-muted-foreground/40" />
                            <span className="text-emerald-600">{userApproved} Aprov.</span>
                          </div>
                        </div>
                        <div className="text-sm font-bold">{count}</div>
                     </div>
                   );
                 })}
                 
                 {activeConsultantIds.length === 0 && (
                   <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade.</p>
                 )}
               </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminOverview;