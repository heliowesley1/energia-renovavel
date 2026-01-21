/**
 * ARQUIVO: src/components/admin/Reports.tsx
 * ATUALIZAÇÕES:
 * 1. Integração com a API PHP (relatorios.php).
 * 2. Remoção total de MockData.
 * 3. Gráficos dinâmicos baseados nos dados reais do banco de dados.
 */

import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiFetch } from '@/hooks/useApi';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell,
  PieChart,
  Pie
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  Building2, 
  FileText,
  Loader2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ReportData {
  sectorName: string;
  totalClients: number;
}

const Reports: React.FC = () => {
  const { toast } = useToast();
  const [data, setData] = useState<ReportData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Cores para as fatias do gráfico
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  const loadReportData = async () => {
    setIsLoading(true);
    try {
      // Chama o arquivo relatorios.php que você criou no XAMPP
      const result = await apiFetch('/relatorios.php');
      setData(result);
    } catch (error) {
      toast({
        title: "Erro ao carregar relatórios",
        description: "Não foi possível buscar os dados de performance no servidor.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadReportData();
  }, []);

  const totalClients = data.reduce((acc, curr) => acc + curr.totalClients, 0);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex h-[400px] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Relatórios e Performance</h1>
          <p className="text-muted-foreground mt-1">
            Análise em tempo real de clientes por setor no banco de dados.
          </p>
        </div>

        {/* Cards de Resumo Rapido */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="glass-card border-l-4 border-l-primary">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-primary/10 rounded-xl">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total de Clientes</p>
                <p className="text-2xl font-bold">{totalClients}</p>
              </div>
            </CardContent>
          </Card>
          
          <Card className="glass-card border-l-4 border-l-emerald-500">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-xl">
                <Building2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Setores Ativos</p>
                <p className="text-2xl font-bold">{data.length}</p>
              </div>
            </CardContent>
          </Card>

          <Card className="glass-card border-l-4 border-l-violet-500">
            <CardContent className="p-6 flex items-center gap-4">
              <div className="p-3 bg-violet-100 rounded-xl">
                <TrendingUp className="w-6 h-6 text-violet-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Média por Setor</p>
                <p className="text-2xl font-bold">
                  {data.length > 0 ? (totalClients / data.length).toFixed(1) : 0}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Grafico de Barras */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary" /> Distribuição por Setor
              </CardTitle>
              <CardDescription>Quantidade absoluta de clientes por região/setor</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={data}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis dataKey="sectorName" axisLine={false} tickLine={false} />
                    <YAxis axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: '#f8fafc'}}
                      contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                    />
                    <Bar dataKey="totalClients" radius={[4, 4, 0, 0]}>
                      {data.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Grafico de Pizza */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg">Participação Percentual</CardTitle>
              <CardDescription>Impacto de cada setor no volume total</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[350px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data}
                      cx="50%"
                      cy="50%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="totalClients"
                      nameKey="sectorName"
                      label
                    >
                      {data.map((_, index) => (
                        <Cell key={`cell-pie-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;