import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DollarSign, Users, FileCheck, Loader2 } from 'lucide-react';

const Comissao = () => {
  const api = useApi();
  const [dados, setDados] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadComissoes = async () => {
    try {
      const res = await api.get('/comissoes.php');
      setDados(res || []);
    } catch (error) {
      console.error("Erro ao carregar comissões");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadComissoes(); }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Gestão de Comissões</h1>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total a Pagar</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                R$ {dados.reduce((acc, curr) => acc + parseFloat(curr.total_comissao || 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="w-5 h-5" /> Relatório por Consultor
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Consultor</TableHead>
                    <TableHead className="text-center">Contratos (Formalizados)</TableHead>
                    <TableHead className="text-right">Valor Total Comissão</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {dados.map((item) => (
                    <TableRow key={item.userId}>
                      <TableCell className="font-medium">{item.consultor}</TableCell>
                      <TableCell className="text-center">
                        <Badge variant="secondary" className="gap-1">
                          <FileCheck className="w-3 h-3" /> {item.contratos}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-bold text-emerald-600">
                        R$ {parseFloat(item.total_comissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </TableCell>
                      <TableCell className="text-right">
                        <button className="text-xs bg-primary text-white px-3 py-1 rounded-md hover:opacity-80">
                          Pagar
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Comissao;