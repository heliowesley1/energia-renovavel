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
import { Badge } from '@/components/ui/badge';
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval, startOfDay, endOfDay } from 'date-fns';
import { type DateRange } from 'react-day-picker';
import {
  Users,
  Filter,
  TrendingUp,
  CheckCircle2,
  Clock,
  Eraser,
  BarChart3,
  Zap,
  FileSignature
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

const AdminOverview: React.FC = () => {
  const { user } = useAuth();
  const api = useApi();
  const isSupervisor = user?.role === 'supervisor';

  // --- ESTADOS DE DADOS REAIS ---
  const [dbClients, setDbClients] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbSectors, setDbSectors] = useState<any[]>([]);
  const [dbUsinas, setDbUsinas] = useState<any[]>([]);

  // --- ESTADOS DE FILTROS ---
  // OTIMIZAÇÃO: Inicia filtrando pelo mês atual para não travar o banco
  const [periodPreset, setPeriodPreset] = useState<string>('today');
  const [date, setDate] = useState<DateRange | undefined>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date())
  });

  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedUsina, setSelectedUsina] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Envia datas para a API filtrar no servidor (Performance)
        const queryParams = new URLSearchParams({
          role: user?.role || '',
          userId: user?.id || '',
          sectors: user?.sectorId || '',
          start_date: date?.from ? format(date.from, 'yyyy-MM-dd') : '',
          end_date: date?.to ? format(date.to, 'yyyy-MM-dd') : ''
        }).toString();

        const [resClients, resUsers, resSectors, resUsinas] = await Promise.all([
          api.get(`/clientes.php?${queryParams}`),
          api.get('/usuarios.php'),
          api.get('/setores.php'),
          api.get('/usinas.php')
        ]);

        const clientsData = Array.isArray(resClients) ? resClients : (resClients?.data || []);
        const usersData = Array.isArray(resUsers) ? resUsers : (resUsers?.data || []);
        const sectorsData = Array.isArray(resSectors) ? resSectors : (resSectors?.data || []);
        const usinasData = Array.isArray(resUsinas) ? resUsinas : (resUsinas?.data || []);
        
        setDbClients(clientsData);
        setDbUsers(usersData);
        setDbSectors(sectorsData);
        setDbUsinas(usinasData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      }
    };
    if (user) loadDashboardData();
  }, [user, api, date]); // Agora 'api' é estável graças ao useMemo no useApi.ts

  // --- Lógica do Gráfico de Produção ---
  const chartData = useMemo(() => {
    if (!date?.from || !date?.to) return [];
    
    const days = eachDayOfInterval({
      start: date.from,
      end: date.to,
    });

    return days.map(day => {
      const count = dbClients.filter(c => {
        if (!c.createdAt) return false;
        const cDate = new Date(c.createdAt.replace(' ', 'T'));
        return format(cDate, 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd');
      }).length;
      return {
        date: format(day, 'dd/MM'),
        quantidade: count,
      };
    });
  }, [dbClients, date]);

  // --- Handlers ---
  const handlePeriodPresetChange = (value: string) => {
    setPeriodPreset(value);
    const today = new Date();
    switch (value) {
      case 'today': setDate({ from: startOfDay(today), to: endOfDay(today) }); break;
      case '7days': setDate({ from: subDays(today, 7), to: today }); break;
      case 'month': setDate({ from: startOfMonth(today), to: endOfMonth(today) }); break;
      case 'custom': break; 
      case 'all': setDate(undefined); break;
    }
  };

  const clearFilters = () => {
    setSelectedSector('all');
    setSelectedUsina('all');
    setSelectedUser('all');
    setSelectedStatus('all');
    setPeriodPreset('today');
    setDate({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) });
  };

  // --- LÓGICA DE FILTRAGEM LOCAL ---
  const filteredData = useMemo(() => {
    const supervisorSectors = user?.sectorId ? user.sectorId.split(',') : [];

    return dbClients.filter(client => {
      const clientSectorId = client.sectorId?.toString() || '';
      
      if (isSupervisor && !supervisorSectors.includes(clientSectorId)) return false;

      const matchSector = selectedSector === 'all' || clientSectorId === selectedSector;
      const matchUsina = selectedUsina === 'all' || client.usinaId?.toString() === selectedUsina;
      const matchUser = selectedUser === 'all' || client.userId?.toString() === selectedUser;
      const matchStatus = selectedStatus === 'all' || client.status === selectedStatus;

      // A API já filtrou por data, mas mantemos a verificação local por segurança
      let matchDate = true;
      if (date?.from && client.createdAt) {
        const clientDate = new Date(client.createdAt.replace(' ', 'T'));
        if (date.to) {
          matchDate = clientDate >= startOfDay(date.from) && clientDate <= endOfDay(date.to);
        } else {
          matchDate = clientDate >= startOfDay(date.from);
        }
      }

      return matchSector && matchUsina && matchUser && matchStatus && matchDate;
    });
  }, [dbClients, selectedSector, selectedUsina, selectedUser, selectedStatus, date, isSupervisor, user]);

  const availableConsultants = useMemo(() => {
    const supervisorSectors = user?.sectorId ? user.sectorId.split(',') : [];
    
    return dbUsers.filter(u => {
      const uSector = u.sectorId?.toString() || '';
      const isEligibleRole = u.role === 'user' || u.role === 'supervisor';
      
      if (isSupervisor) return isEligibleRole && supervisorSectors.includes(uSector);
      if (selectedSector !== 'all') return isEligibleRole && uSector === selectedSector;
      return isEligibleRole;
    });
  }, [dbUsers, selectedSector, isSupervisor, user]);

  const availableSectorsForFilter = useMemo(() => {
    const supervisorSectors = user?.sectorId ? user.sectorId.split(',') : [];
    if (isSupervisor) return dbSectors.filter(s => supervisorSectors.includes(s.id.toString()));
    return dbSectors;
  }, [dbSectors, isSupervisor, user]);

  // --- Métricas Gerais ---
  const total = filteredData.length;
  const formalized = filteredData.filter(c => c.status === 'formalized').length;
  const waiting = filteredData.filter(c => c.status === 'waiting_formalization').length;
  const pending = filteredData.filter(c => c.status === 'pending').length;

  const formalizedPerc = total > 0 ? (formalized / total) * 100 : 0;
  const waitingPerc = total > 0 ? (waiting / total) * 100 : 0;
  const pendingPerc = total > 0 ? (pending / total) * 100 : 0;

  const activeConsultantIds = Array.from(new Set(filteredData.map(c => c.userId?.toString()).filter(Boolean)));

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in pb-10">

        {/* Cabeçalho */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-display font-bold">Dashboard</h1>
            <p className="text-muted-foreground">Análise de performance com filtros avançados.</p>
          </div>
          <div className="flex items-center gap-2 text-sm bg-muted/40 px-4 py-2 rounded-full border border-border/50 shadow-sm">
            <Zap className="w-4 h-4 text-amber-500 fill-amber-500/20" />
            <span>Bem-vindo, <strong className="text-foreground font-semibold">{user?.name}</strong></span>
          </div>
        </div>

        {/* --- BARRA DE FILTROS --- */}
        <Card className="bg-muted/40 border-muted-foreground/20 shadow-sm w-full">
          <CardContent className="p-4">
            <div className="flex flex-col lg:flex-row items-center gap-4">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground shrink-0">
                <Filter className="w-4 h-4" /> Filtros:
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:flex lg:flex-1 gap-3 w-full">
                <div className="w-full lg:flex-1">
                  <Select value={selectedSector} onValueChange={(v) => { setSelectedSector(v); setSelectedUser('all'); }}>
                    <SelectTrigger className="bg-background h-10 w-full"><SelectValue placeholder="Setor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Setores</SelectItem>
                      {availableSectorsForFilter.map((s) => (<SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full lg:flex-1">
                  <Select value={selectedUsina} onValueChange={setSelectedUsina}>
                    <SelectTrigger className="bg-background h-10 w-full"><SelectValue placeholder="Todas Usinas" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas Usinas</SelectItem>
                      {dbUsinas.map((u) => (<SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full lg:flex-1 animate-in fade-in zoom-in duration-200">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="bg-background h-10 w-full"><SelectValue placeholder="Consultor/Sup." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Consultores</SelectItem>
                      {availableConsultants.map((u) => (<SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full lg:flex-1">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="bg-background h-10 w-full"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="pending">Pendente</SelectItem>
                      <SelectItem value="waiting_formalization">Ag. Formalização</SelectItem>
                      <SelectItem value="formalized">Formalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-full lg:flex-1">
                  <Select value={periodPreset} onValueChange={handlePeriodPresetChange}>
                    <SelectTrigger className="bg-background h-10 w-full"><SelectValue placeholder="Período" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o período</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="7days">Últimos 7 dias</SelectItem>
                      <SelectItem value="month">Este Mês</SelectItem>
                      <SelectItem value="custom">Período Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {periodPreset === 'custom' && (
                  <div className="flex items-center gap-2 animate-in fade-in slide-in-from-left-2 duration-300">
                    <Input
                      type="date"
                      className="h-10 bg-background w-auto"
                      onChange={(e) => {
                        const d = e.target.value ? new Date(e.target.value + 'T00:00:00') : undefined;
                        setDate(prev => ({ ...prev, from: d }));
                      }}
                    />
                    <span className="text-muted-foreground text-xs font-bold uppercase">Até</span>
                    <Input
                      type="date"
                      className="h-10 bg-background w-auto"
                      onChange={(e) => {
                        const d = e.target.value ? new Date(e.target.value + 'T23:59:59') : undefined;
                        setDate(prev => ({ ...prev, to: d }));
                      }}
                    />
                  </div>
                )}

                <Button variant="ghost" size="icon" onClick={clearFilters} className="h-10 w-10 shrink-0 border border-input hover:bg-destructive/10 hover:text-destructive">
                  <Eraser className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* --- CARDS PRINCIPAIS --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="shadow-sm border-l-4 border-l-blue-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Base de Clientes</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{total}</div>
              <p className="text-xs text-muted-foreground">Clientes encontrados</p>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Formalizados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold text-emerald-600">{formalized}</div>
                <div className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded">{formalizedPerc.toFixed(1)}%</div>
              </div>
              <Progress value={formalizedPerc} className="h-1 mt-3 bg-emerald-100 [&>div]:bg-emerald-500" />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-indigo-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ag. Formalização</CardTitle>
              <FileSignature className="h-4 w-4 text-indigo-500" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold text-indigo-600">{waiting}</div>
                <div className="text-xs font-medium bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{waitingPerc.toFixed(1)}%</div>
              </div>
              <Progress value={waitingPerc} className="h-1 mt-3 bg-indigo-100 [&>div]:bg-indigo-500" />
            </CardContent>
          </Card>

          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold text-orange-600">{pending}</div>
                <div className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded">{pendingPerc.toFixed(1)}%</div>
              </div>
              <Progress value={pendingPerc} className="h-1 mt-3 bg-orange-100 [&>div]:bg-orange-500" />
            </CardContent>
          </Card>
        </div>

        {/* Tabelas Inferiores */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 flex flex-col h-full shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-primary" /> Distribuição de Resultados</CardTitle>
              <CardDescription>Visualização rápida dos clientes no filtro aplicado</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[450px]">
              <div className="space-y-4">
                {filteredData.slice(0, 10).map((client) => (
                  <div key={client.id} className="flex items-center justify-between p-3 bg-muted/20 rounded-lg hover:bg-muted/40 transition-colors border border-transparent hover:border-border">
                    <div className="flex flex-col gap-1 min-w-0">
                      <span className="font-medium text-sm truncate">{client.name}</span>
                      <span className="text-[10px] text-muted-foreground uppercase font-bold">
                        {dbUsers.find(u => u.id.toString() === client.userId?.toString())?.name || 'N/A'} • {client.createdAt ? format(new Date(client.createdAt.replace(' ', 'T')), "dd/MM/yyyy") : 'N/A'}
                      </span>
                    </div>
                    <div className={cn("px-2 py-1 rounded text-[10px] font-bold uppercase border",
                      client.status === 'formalized' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                        client.status === 'waiting_formalization' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' :
                          'bg-orange-50 text-orange-700 border-orange-200')}>
                      {client.status === 'formalized' ? 'Formalizado' : client.status === 'waiting_formalization' ? 'Ag. Formalização' : 'Pendente'}
                    </div>
                  </div>
                ))}
                {filteredData.length === 0 && <div className="text-center py-12 text-muted-foreground"><Filter className="w-12 h-12 mx-auto mb-3 opacity-20" /><p>Nenhum dado encontrado.</p></div>}
              </div>
            </CardContent>
          </Card>

          <Card className="flex flex-col h-full shadow-sm">
            <CardHeader>
              <CardTitle>Produtividade</CardTitle>
              <CardDescription>Produção total por consultor e supervisor</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 overflow-auto max-h-[450px]">
              <div className="space-y-4">
                {activeConsultantIds.map(userId => {
                  const uData = dbUsers.find(u => u.id.toString() === userId.toString());
                  if (!uData) return null;
                  const count = filteredData.filter(c => c.userId?.toString() === userId.toString()).length;
                  const userFormalized = filteredData.filter(c => c.userId?.toString() === userId.toString() && c.status === 'formalized').length;
                  return (
                    <div key={userId} className="flex items-center gap-3">
                      <Avatar className="h-8 w-8"><AvatarFallback className="text-xs bg-primary/10 text-primary font-bold">{uData.name.substring(0, 2).toUpperCase()}</AvatarFallback></Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{uData.name}</p>
                        <div className="flex items-center gap-2 text-[10px] text-muted-foreground font-bold uppercase">
                          <span>{count} Leads</span><span className="w-1 h-1 rounded-full bg-muted-foreground/40" /><span className="text-emerald-600">{userFormalized} Form.</span>
                        </div>
                      </div>
                      <div className="text-sm font-bold text-zinc-900">{count}</div>
                    </div>
                  );
                })}
                {activeConsultantIds.length === 0 && <p className="text-sm text-muted-foreground text-center py-8">Sem atividades no filtro.</p>}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* --- CARD DE PRODUÇÃO MENSAL --- */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><TrendingUp className="w-5 h-5 text-primary" /> Produção Mensal</CardTitle>
            <CardDescription>Volume de cadastros realizados dia a dia no mês atual</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#666' }} />
                  <Tooltip cursor={{ fill: '#f8f9fa' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="quantidade" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} barSize={30}>
                    {chartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.quantidade > 0 ? 'hsl(var(--primary))' : '#e2e8f0'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminOverview;