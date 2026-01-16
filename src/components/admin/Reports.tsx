import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { mockClients, mockSectors } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Download, FileBarChart, PieChart as PieChartIcon, Building2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Reports: React.FC = () => {
  const { toast } = useToast();

  // Dados Agregados
  const totalClients = mockClients.length;
  const clientsByStatus = {
    approved: mockClients.filter(c => c.status === 'approved').length,
    pending: mockClients.filter(c => c.status === 'pending').length,
    rejected: mockClients.filter(c => c.status === 'rejected').length,
  };

  const clientsBySector = mockSectors.map(sector => ({
    name: sector.name,
    count: mockClients.filter(c => c.sectorId === sector.id).length
  }));

  const handleExport = (type: 'csv' | 'pdf') => {
    toast({
      title: "Exportando Relatório",
      description: `O relatório em formato ${type.toUpperCase()} está sendo gerado.`,
    });
    // Simulação de exportação
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Relatórios Gerenciais</h1>
            <p className="text-muted-foreground mt-1">Extração e análise detalhada de dados</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => handleExport('csv')}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV
            </Button>
            <Button variant="hero" onClick={() => handleExport('pdf')}>
              <FileBarChart className="w-4 h-4 mr-2" />
              Gerar PDF
            </Button>
          </div>
        </div>

        {/* Resumo Geral */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Eficiência de Aprovação</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {totalClients > 0 ? ((clientsByStatus.approved / totalClients) * 100).toFixed(1) : 0}%
              </div>
              <p className="text-xs text-muted-foreground">Taxa de conversão total</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Setor Mais Ativo</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {clientsBySector.sort((a, b) => b.count - a.count)[0]?.name || 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Maior volume de clientes</p>
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
        </div>

        {/* Tabelas de Dados */}
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
                    <TableHead className="text-right">Quantidade</TableHead>
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
                  {clientsBySector.map((item) => (
                    <TableRow key={item.name}>
                      <TableCell>{item.name}</TableCell>
                      <TableCell className="text-right">{item.count}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Reports;