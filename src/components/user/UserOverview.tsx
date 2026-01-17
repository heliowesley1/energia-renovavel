/**
 * ARQUIVO: src/components/user/UserOverview.tsx
 * * ATUALIZAÇÕES:
 * 1. Título "Dashboard".
 * 2. Adicionados cards extras (Reprovados, Hoje, Este Mês, Último).
 * 3. Lista "Últimas Atualizações" com paginação (Limite 15).
 */

import React, { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { mockClients } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Users, CheckCircle, Clock, TrendingUp, XCircle, Calendar, Zap, ChevronLeft, ChevronRight, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { format, isSameDay, isSameMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const UserOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // -- ESTADOS --
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  // -- DADOS --
  // Filtra apenas os clientes deste usuário e ordena por data (mais recente primeiro)
  const myClients = mockClients
    .filter(c => c.userId === user?.id)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  
  // -- CÁLCULOS ESTATÍSTICOS --
  const total = myClients.length;
  const approved = myClients.filter(c => c.status === 'approved').length;
  const pending = myClients.filter(c => c.status === 'pending').length;
  const rejected = myClients.filter(c => c.status === 'rejected').length;
  const efficiency = total > 0 ? ((approved / total) * 100).toFixed(0) : 0;
  
  const today = new Date();
  const createdToday = myClients.filter(c => isSameDay(new Date(c.createdAt), today)).length;
  const createdThisMonth = myClients.filter(c => isSameMonth(new Date(c.createdAt), today)).length;
  const lastClientDate = myClients.length > 0 ? format(new Date(myClients[0].createdAt), "dd/MM 'às' HH:mm") : '-';

  // -- PAGINAÇÃO DA LISTA --
  const totalPages = Math.ceil(total / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = myClients.slice(startIndex, startIndex + itemsPerPage);

  const handleNextPage = () => { if (currentPage < totalPages) setCurrentPage(prev => prev + 1); };
  const handlePrevPage = () => { if (currentPage > 1) setCurrentPage(prev => prev - 1); };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        
        {/* Cabeçalho */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Dashboard</h1>
            <p className="text-muted-foreground mt-1">Bem-vindo(a), {user?.name}. Acompanhe suas métricas.</p>
          </div>
          <Button onClick={() => navigate('/dashboard/my-clients')} variant="hero" className="shadow-lg hover:shadow-xl transition-all">
            <Users className="w-4 h-4 mr-2" />
            Meus Clientes
          </Button>
        </div>

        {/* --- GRID DE CARDS (8 CARDS) --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Card 1: Total */}
          <Card className="border-l-4 border-l-primary shadow-sm hover:translate-y-[-2px] transition-all">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Users className="w-4 h-4" /> Total Cadastrado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{total}</div>
              <p className="text-xs text-muted-foreground mt-1">Base completa</p>
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

          {/* Card 4: Reprovados (NOVO) */}
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

          {/* Card 5: Hoje (NOVO) */}
          <Card className="shadow-sm hover:bg-muted/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Zap className="w-4 h-4 text-yellow-500" /> Cadastros Hoje
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{createdToday}</div>
            </CardContent>
          </Card>

          {/* Card 6: Este Mês (NOVO) */}
          <Card className="shadow-sm hover:bg-muted/30 transition-colors">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2 text-muted-foreground">
                <Calendar className="w-4 h-4 text-blue-500" /> Este Mês
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">{createdThisMonth}</div>
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
            </CardContent>
          </Card>

          {/* Card 8: Última Atividade (NOVO) */}
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
                  Últimas Atualizações
                </CardTitle>
                <CardDescription>
                  Histórico recente de seus clientes. Mostrando {startIndex + 1}-{Math.min(startIndex + itemsPerPage, total)} de {total}.
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {myClients.length > 0 ? (
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
                <p>Nenhum registro encontrado.</p>
                <Button variant="link" onClick={() => navigate('/dashboard/my-clients')} className="mt-2">
                  Começar agora
                </Button>
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