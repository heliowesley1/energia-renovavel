import React, { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockClients, mockUsers, mockSectors } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { 
  Users, 
  Filter,
  TrendingUp, 
  Briefcase, 
  CheckCircle2, 
  Clock,
  AlertCircle,
  X,
  PieChart,
  BarChart3,
  UserCheck,
  Activity
} from 'lucide-react';

const AdminOverview: React.FC = () => {
  // Estados dos Filtros
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Limpar filtros
  const clearFilters = () => {
    setSelectedSector('all');
    setSelectedUser('all');
    setSelectedStatus('all');
  };

  // --- Lógica de Filtragem Unificada ---
  const filteredData = useMemo(() => {
    return mockClients.filter(client => {
      const matchSector = selectedSector === 'all' || client.sectorId === selectedSector;
      const matchUser = selectedUser === 'all' || client.userId === selectedUser;
      const matchStatus = selectedStatus === 'all' || client.status === selectedStatus;
      
      return matchSector && matchUser && matchStatus;
    });
  }, [selectedSector, selectedUser, selectedStatus]);

  // Consultores disponíveis para o filtro
  const availableConsultants = useMemo(() => {
    if (selectedSector === 'all') return mockUsers.filter(u => u.role === 'user');
    return mockUsers.filter(u => u.role === 'user' && u.sectorId === selectedSector);
  }, [selectedSector]);

  // --- Métricas Reais ---
  const total = filteredData.length;
  const approved = filteredData.filter(c => c.status === 'approved').length;
  const pending = filteredData.filter(c => c.status === 'pending').length;
  const rejected = filteredData.filter(c => c.status === 'rejected').length;

  // Porcentagens
  const approvedPerc = total > 0 ? (approved / total) * 100 : 0;
  const pendingPerc = total > 0 ? (pending / total) * 100 : 0;
  const rejectedPerc = total > 0 ? (rejected / total) * 100 : 0;

  // Consultores Ativos
  const activeConsultantIds = Array.from(new Set(filteredData.map(c => c.userId)));
  const activeConsultantsCount = activeConsultantIds.length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        
        {/* Cabeçalho */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Análise de performance com filtros avançados.
            </p>
          </div>

          {/* Barra de Filtros com Destaque Sutil (Cinza) */}
          <Card className="bg-muted/40 border-muted-foreground/20 shadow-sm">
            <CardContent className="p-4">
              <div className="flex flex-col md:flex-row gap-4 items-end md:items-center">
                <div className="flex items-center gap-2 text-sm font-bold text-foreground min-w-[60px]">
                  <Filter className="w-4 h-4" /> Filtros:
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                  {/* Filtro Setor */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-foreground ml-1 uppercase tracking-wide">Setor</span>
                    <Select value={selectedSector} onValueChange={(v) => { setSelectedSector(v); setSelectedUser('all'); }}>
                      <SelectTrigger className="bg-background border-input focus:ring-ring">
                        <SelectValue placeholder="Todos os Setores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Setores</SelectItem>
                        {mockSectors.map((s) => (
                          <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro Consultor */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-foreground ml-1 uppercase tracking-wide">Consultor</span>
                    <Select value={selectedUser} onValueChange={setSelectedUser}>
                      <SelectTrigger className="bg-background border-input focus:ring-ring">
                        <SelectValue placeholder="Todos os Consultores" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Consultores</SelectItem>
                        {availableConsultants.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Filtro Status */}
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-foreground ml-1 uppercase tracking-wide">Status</span>
                    <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                      <SelectTrigger className="bg-background border-input focus:ring-ring">
                        <SelectValue placeholder="Todos os Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Todos os Status</SelectItem>
                        <SelectItem value="approved">Aprovados</SelectItem>
                        <SelectItem value="pending">Pendentes</SelectItem>
                        <SelectItem value="rejected">Reprovados</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Botão Limpar */}
                {(selectedSector !== 'all' || selectedUser !== 'all' || selectedStatus !== 'all') && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    onClick={clearFilters}
                    className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                    title="Limpar Filtros"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Cards de Métricas (Linha 1) - Totais e Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card Total: Azul */}
          <Card className="shadow-sm border-l-4 border-l-blue-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Selecionado</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">{total}</div>
              <p className="text-xs text-muted-foreground">Clientes encontrados</p>
            </CardContent>
          </Card>

          {/* Card Aprovados: Verde */}
          <Card className="shadow-sm border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold text-emerald-600">{approved}</div>
                <div className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                  {approvedPerc.toFixed(1)}%
                </div>
              </div>
              <Progress value={approvedPerc} className="h-1 mt-3 bg-emerald-100 [&>div]:bg-emerald-500" />
            </CardContent>
          </Card>

          {/* Card Pendentes: Laranja */}
          <Card className="shadow-sm border-l-4 border-l-orange-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold text-orange-600">{pending}</div>
                <div className="text-xs font-medium bg-orange-100 text-orange-700 px-2 py-1 rounded">
                  {pendingPerc.toFixed(1)}%
                </div>
              </div>
              <Progress value={pendingPerc} className="h-1 mt-3 bg-orange-100 [&>div]:bg-orange-500" />
            </CardContent>
          </Card>

          {/* Card Reprovados: Vermelho */}
          <Card className="shadow-sm border-l-4 border-l-red-600">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Reprovados</CardTitle>
              <AlertCircle className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-end">
                <div className="text-3xl font-bold text-red-600">{rejected}</div>
                <div className="text-xs font-medium bg-red-100 text-red-700 px-2 py-1 rounded">
                  {rejectedPerc.toFixed(1)}%
                </div>
              </div>
              <Progress value={rejectedPerc} className="h-1 mt-3 bg-red-100 [&>div]:bg-red-600" />
            </CardContent>
          </Card>
        </div>

        {/* Cards de Métricas (Linha 2) - Consultores (Neutro) e Outros */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
           
           {/* Card Equipe: Neutro (Slate/Gray) */}
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

           <Card>
             <CardHeader className="pb-2">
               <CardTitle className="text-xs uppercase text-muted-foreground font-semibold tracking-wider flex items-center gap-2">
                 <Briefcase className="w-3 h-3" /> Setores Envolvidos
               </CardTitle>
             </CardHeader>
             <CardContent>
               <div className="text-2xl font-bold">
                 {selectedSector === 'all' ? mockSectors.length : 1}
               </div>
               <p className="text-xs text-muted-foreground mt-1">Áreas operando neste filtro</p>
             </CardContent>
           </Card>
        </div>

        {/* Lista de Resultados Filtrados (Resumo) */}
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
                        {mockUsers.find(u => u.id === client.userId)?.name || 'N/A'}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                       <span className="text-xs text-muted-foreground hidden sm:inline-block">
                         {mockSectors.find(s => s.id === client.sectorId)?.name}
                       </span>
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
                   const user = mockUsers.find(u => u.id === userId);
                   if (!user) return null;
                   const count = filteredData.filter(c => c.userId === userId).length;
                   const userApproved = filteredData.filter(c => c.userId === userId && c.status === 'approved').length;
                   
                   return (
                     <div key={userId} className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-xs bg-primary/10 text-primary">
                            {user.name.substring(0,2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{user.name}</p>
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