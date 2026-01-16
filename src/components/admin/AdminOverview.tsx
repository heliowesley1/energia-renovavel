import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockClients, mockUsers } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { TrendingUp, Users, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { Bar, BarChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';

const AdminOverview: React.FC = () => {
  // Stats calculations
  const totalClients = mockClients.length;
  const approved = mockClients.filter(c => c.status === 'approved').length;
  const pending = mockClients.filter(c => c.status === 'pending').length;
  const rejected = mockClients.filter(c => c.status === 'rejected').length;

  // Dados para o gráfico (simulado)
  const data = [
    { name: 'Jan', total: 4 },
    { name: 'Fev', total: 3 },
    { name: 'Mar', total: 7 },
    { name: 'Abr', total: 5 },
    { name: 'Mai', total: 9 },
    { name: 'Jun', total: 12 },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Visão Geral</h1>
          <p className="text-muted-foreground mt-1">Métricas de performance em tempo real</p>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClients}</div>
              <p className="text-xs text-muted-foreground">+20.1% em relação ao mês anterior</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aprovados</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{approved}</div>
              <p className="text-xs text-muted-foreground">Clientes convertidos</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendentes</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pending}</div>
              <p className="text-xs text-muted-foreground">Necessitam atenção</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Funcionários Ativos</CardTitle>
              <TrendingUp className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mockUsers.filter(u => u.role === 'user').length}</div>
              <p className="text-xs text-muted-foreground">Em campo</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráficos */}
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Crescimento de Clientes</CardTitle>
              <CardDescription>Novos cadastros nos últimos 6 meses</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                      cursor={{fill: 'hsl(var(--muted))'}}
                    />
                    <Bar dataKey="total" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Últimas Atividades</CardTitle>
              <CardDescription>Ações recentes no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockClients.slice(0, 5).map((client) => (
                  <div key={client.id} className="flex items-center">
                    <div className="space-y-1">
                      <p className="text-sm font-medium leading-none">
                        Novo cliente: {client.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Cadastrado por {mockUsers.find(u => u.id === client.userId)?.name}
                      </p>
                    </div>
                    <div className="ml-auto font-medium text-xs text-muted-foreground">
                      Hoje
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AdminOverview;