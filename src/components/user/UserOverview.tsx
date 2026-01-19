/**
 * ARQUIVO: src/components/user/UserOverview.tsx
 * * ATUALIZAÇÕES FINAIS:
 * 1. Filtro de Data: Inputs ajustados para permitir APENAS DIGITAÇÃO.
 * 2. Removido evento de click que abria o calendário.
 * 3. Ocultado indicador nativo do navegador via CSS.
 * 4. Mantido layout e ícone personalizado à esquerda.
 */

import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { mockClients } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, CheckCircle, Clock, TrendingUp, XCircle, Calendar, Zap, ChevronLeft, ChevronRight, Activity, Calendar as CalendarIcon, Eraser, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, isSameMonth, subDays, isAfter, startOfDay, endOfDay, isWithinInterval } from 'date-fns';

const UserOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // -- ESTADOS DE PAGINAÇÃO --
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // -- ESTADOS DE FILTRO --
  const [periodFilter, setPeriodFilter] = useState('all');
  const [customDate, setCustomDate] = useState<{ from: string; to: string }>({ from: '', to: '' });

  // -- DADOS E FILTRAGEM --
  // 1. Pega todos os clientes do usuário
  const allMyClients = useMemo(() => {
    return mockClients
      .filter(c => c.userId === user?.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [user?.id]);

  // 2. Aplica o filtro de período
  const filteredClients = useMemo(() => {
    return allMyClients.filter(client => {
      const clientDate = new Date(client.createdAt);
      const today = new Date();
      let matchesPeriod = true;

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

      return matchesPeriod;
    });
  }, [allMyClients, periodFilter, customDate]);

  // -- LIMPAR FILTROS --
  const clearFilters = () => {
    setPeriodFilter('all');
    setCustomDate({ from: '', to: '' });
  };
  
  // -- CÁLCULOS ESTATÍSTICOS (Baseados nos dados filtrados) --
  const total = filteredClients.length;
  const approved = filteredClients.filter(c => c.status === 'approved').length;
  const pending = filteredClients.filter(c => c.status === 'pending').length;
  const rejected = filteredClients.filter(c => c.status === 'rejected').length;
  const efficiency = total > 0 ? ((approved / total) * 100).toFixed(0) : 0;
  
  const today = new Date();
  const createdToday = filteredClients.filter(c => isSameDay(new Date(c.createdAt), today)).length;
  const createdThisMonth = filteredClients.filter(c => isSameMonth(new Date(c.createdAt), today)).length;
  const lastClientDate = filteredClients.length > 0 ? format(new Date(filteredClients[0].createdAt), "dd/MM 'às' HH:mm") : '-';

  // -- PAGINAÇÃO DA LISTA FILTRADA --
  const totalPages = Math.ceil(total / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredClients.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Cabeçalho com Filtros */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Bem-vindo(a), {user?.name}. Acompanhe suas métricas.</p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            {/* Filtro de Período */}
            <div className="flex items-center gap-2 bg-background p-1 rounded-lg border shadow-sm">
                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full sm:w-[160px] h-9 border-none shadow-none focus:ring-0"> 
                    <div className="flex items-center gap-2 text-muted-foreground">
                    <CalendarIcon className="w-4 h-4" />
                    <span className="text-foreground truncate font-medium">
                        {periodFilter === 'all' ? 'Todo o período' : 
                        periodFilter === 'custom' ? 'Personalizado' :
                        periodFilter === 'today' ? 'Hoje' : 
                        periodFilter === 'week' ? 'Últimos 7 Dias' : 'Este Mês'}
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

                {/* Inputs de Data Personalizada (APENAS DIGITAÇÃO) */}
                {periodFilter === 'custom' && (
                <div className="flex items-center gap-2 px-2 animate-in fade-in slide-in-from-left-2 border-l">
                    <div className="relative w-[140px]"> 
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                      <Input 
                          type="date" 
                          className="w-full h-8 text-xs pl-10 [&::-webkit-calendar-picker-indicator]:hidden" 
                          value={customDate.from}
                          onChange={(e) => setCustomDate(prev => ({ ...prev, from: e.target.value }))}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground">até</span>
                    <div className="relative w-[140px]"> 
                      <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10 pointer-events-none" />
                      <Input 
                          type="date" 
                          className="w-full h-8 text-xs pl-10 [&::-webkit-calendar-picker-indicator]:hidden" 
                          value={customDate.to}
                          onChange={(e) => setCustomDate(prev => ({ ...prev, to: e.target.value }))}
                      />
                    </div>
                </div>
                )}

                 {/* Botão Limpar Filtro */}
                 {periodFilter !== 'all' && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={clearFilters}
                    className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Limpar Filtros"
                  >
                    <Eraser className="w-4 h-4" />
                  </Button>
                )}
            </div>

            <Button onClick={() => navigate('/dashboard/my-clients')} variant="hero" className="shadow-lg hover:shadow-xl transition-all whitespace-nowrap">
                <Users className="w-4 h-4 mr-2" />
                Meus Clientes
            </Button>
          </div>
        </div>

        {/* --- GRID DE CARDS (8 CARDS) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total */}
          <Card className="border-l-4 border-l-primary shadow-sm hover:translate-y-[-2px] transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" /> Total {periodFilter !== 'all' ? 'no Período' : 'Cadastrado'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{total}</div>
              <p className="text-xs text-muted-foreground mt-1">Clientes listados</p>
            </CardContent>
          </Card>
          
          {/* Card 2: Aprovados */}
          <Card className="border-l-4 border-l-emerald-500 shadow-sm hover:translate-y-[-2px] transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <CheckCircle className="w-4 h-4 text-emerald-500" /> Aprovados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-600">{approved}</div>
              <p className="text-xs text-muted-foreground mt-1">Vendas concluídas</p>
            </CardContent>
          </Card>

          {/* Card 3: Pendentes */}
          <Card className="border-l-4 border-l-orange-500 shadow-sm hover:translate-y-[-2px] transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Clock className="w-4 h-4 text-orange-500" /> Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-600">{pending}</div>
              <p className="text-xs text-muted-foreground mt-1">Em análise</p>
            </CardContent>
          </Card>

          {/* Card 4: Reprovados */}
          <Card className="border-l-4 border-l-red-500 shadow-sm hover:translate-y-[-2px] transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <XCircle className="w-4 h-4 text-red-500" /> Reprovados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-600">{rejected}</div>
              <p className="text-xs text-muted-foreground mt-1">Recusados</p>
            </CardContent>
          </Card>

          {/* Card 5: Hoje */}
          <Card className="shadow-sm hover:bg-muted/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-yellow-500" /> Cadastros Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{createdToday}</div>
              <p className="text-xs text-muted-foreground mt-1">Do total filtrado</p>
            </CardContent>
          </Card>

          {/* Card 6: Este Mês */}
          <Card className="shadow-sm hover:bg-muted/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 text-blue-500" /> Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{createdThisMonth}</div>
              <p className="text-xs text-muted-foreground mt-1">Do total filtrado</p>
            </CardContent>
          </Card>

           {/* Card 7: Eficiência */}
           <Card className="shadow-sm hover:bg-muted/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <TrendingUp className="w-4 h-4 text-purple-500" /> Taxa de Aprovação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{efficiency}%</div>
              <p className="text-xs text-muted-foreground mt-1">Sobre visualizados</p>
            </CardContent>
          </Card>

          {/* Card 8: Última Atividade */}
          <Card className="shadow-sm hover:bg-muted/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Activity className="w-4 h-4 text-pink-500" /> Último Registro
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-lg font-bold text-foreground truncate">{lastClientDate}</div>
            </CardContent>
          </Card>
        </div>

        {/* --- ÚLTIMAS ATUALIZAÇÕES (PAGINADO 15 ITENS) --- */}
        <Card className="glass-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <CardTitle className="text-xl flex items-center gap-2">
                  {periodFilter !== 'all' ? 'Atualizações (Filtradas)' : 'Últimas Atualizações'}
                </CardTitle>
                <CardDescription>
                  Histórico recente de seus clientes. Mostrando {filteredClients.length > 0 ? startIndex + 1 : 0}-{Math.min(startIndex + itemsPerPage, total)} de {total}.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {filteredClients.length > 0 ? (
              <div className="space-y-0 divide-y divide-border/40">
                {paginatedClients.map(client => (
                  <div key={client.id} className="flex flex-col sm:flex-row justify-between items-start sm:items-center py-3 px-2 hover:bg-muted/30 transition-colors rounded-sm">
                    <div className="flex flex-col gap-1 mb-2 sm:mb-0">
                      <p className="font-semibold text-sm text-foreground">{client.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{format(new Date(client.createdAt), "dd/MM/yyyy HH:mm")}</span>
                        <span>•</span>
                        <span>{client.cpf}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={`text-xs font-medium px-2.5 py-0.5 rounded-full border
                        ${client.status === 'approved' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 
                          client.status === 'rejected' ? 'bg-red-100 text-red-700 border-red-200' : 
                          'bg-orange-100 text-orange-700 border-orange-200'}`}>
                        {client.status === 'approved' ? 'Aprovado' : 
                         client.status === 'rejected' ? 'Reprovado' : 'Pendente'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>Nenhum registro encontrado neste período.</p>
                {periodFilter !== 'all' && (
                    <Button variant="link" onClick={clearFilters} className="mt-2">
                        Limpar filtros
                    </Button>
                )}
              </div>
            )}

            {/* Controles de Paginação */}
            {total > itemsPerPage && (
              <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t">
                <span className="text-xs text-muted-foreground mr-2">
                  Página {currentPage} de {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                  className="h-8 w-8 p-0"
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages}
                  className="h-8 w-8 p-0"
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserOverview;