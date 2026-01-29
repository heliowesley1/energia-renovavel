import React, { useState, useEffect, useMemo } from 'react';
import { useApi } from '@/hooks/useApi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign, Loader2, Filter, Trophy, BarChart3, Eraser, FileSpreadsheet
} from 'lucide-react';
import { format, subDays, startOfMonth, endOfMonth } from "date-fns";

const Comissao = () => {
  const { toast } = useToast();
  const api = useApi();
  const [dados, setDados] = useState<any[]>([]);
  const [usinas, setUsinas] = useState<any[]>([]);
  const [setores, setSetores] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedUsina, setSelectedUsina] = useState<string>("all");
  const [searchName, setSearchName] = useState("");
  const [periodPreset, setPeriodPreset] = useState<string>("all");
  const [dateRange, setDateRange] = useState<{ from?: string; to?: string }>({});

  const fetchData = async () => {
    setLoading(true);
    try {
      let queryParams = "";
      if (dateRange.from && dateRange.to) {
        queryParams = `?start_date=${dateRange.from}&end_date=${dateRange.to}`;
      }
      const [resUsinas, resSetores, resComissoes] = await Promise.all([
        api.get('/usinas.php'),
        api.get('/setores.php'),
        api.get(`/comissoes.php${queryParams}`)
      ]);
      setUsinas(Array.isArray(resUsinas) ? resUsinas : []);
      setSetores(Array.isArray(resSetores) ? resSetores : []);
      setDados(Array.isArray(resComissoes) ? resComissoes : []);
    } catch (error) {
      console.error("Erro ao carregar dados", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [dateRange]);

  const handlePeriodPresetChange = (value: string) => {
    setPeriodPreset(value);
    const today = new Date();
    const fmt = (d: Date) => format(d, "yyyy-MM-dd");
    switch (value) {
      case "today": setDateRange({ from: fmt(today), to: fmt(today) }); break;
      case "7days": setDateRange({ from: fmt(subDays(today, 7)), to: fmt(today) }); break;
      case "month": setDateRange({ from: fmt(startOfMonth(today)), to: fmt(endOfMonth(today)) }); break;
      case "all": setDateRange({}); break;
    }
  };

  const clearFilters = () => {
    setSelectedSector("all");
    setSelectedUser("all");
    setSelectedUsina("all");
    setSearchName("");
    setPeriodPreset("all");
    setDateRange({});
  };

  const dadosFiltrados = useMemo(() => {
    return dados.filter(item => {
      const matchSector = selectedSector === "all" || item.setor === selectedSector;
      const matchUser = selectedUser === "all" || item.userId === selectedUser;
      const matchSearch = (item.consultor || "").toLowerCase().includes(searchName.toLowerCase());
      const matchUsina = selectedUsina === "all" || (item.detalhes_usinas && item.detalhes_usinas[selectedUsina]);
      return matchSector && matchUser && matchSearch && matchUsina;
    });
  }, [dados, selectedSector, selectedUser, searchName, selectedUsina]);

  const totalComissaoGeral = useMemo(() => {
    return dadosFiltrados.reduce((acc, curr) => {
      if (selectedUsina === "all") {
        return acc + (curr.total_comissao || 0);
      }
      // Se houver uma usina selecionada, soma apenas o valor dela
      const valorUsina = curr.detalhes_usinas?.[selectedUsina]?.valor || 0;
      return acc + valorUsina;
    }, 0);
  }, [dadosFiltrados, selectedUsina]);
  const consultorDestaque = useMemo(() => {
  if (dadosFiltrados.length === 0) return null;

  return [...dadosFiltrados].sort((a, b) => {
    const qtdA = selectedUsina === "all"
      ? (a.contratos || 0)
      : (a.detalhes_usinas?.[selectedUsina]?.qtd || 0);

    const qtdB = selectedUsina === "all"
      ? (b.contratos || 0)
      : (b.detalhes_usinas?.[selectedUsina]?.qtd || 0);

    return qtdB - qtdA;
  })[0];
}, [dadosFiltrados, selectedUsina]);

  const handleExportExcel = () => {
    if (dadosFiltrados.length === 0) return;
    const headers = ["SETOR", "CONSULTOR", ...usinas.map(u => u.name), "TOTAL CONTRATOS", "COMISSÃO TOTAL (R$)"];

    // Calcular comissão por contrato de cada usina
    const sumario = usinas.map(u => {
      let totalComissao = 0;
      let totalContratos = 0;
      dadosFiltrados.forEach(item => {
        const info = item.detalhes_usinas?.[u.name];
        if (info) {
          totalComissao += info.valor || 0;
          totalContratos += info.qtd || 0;
        }
      });
      const comissaoPorContrato = totalContratos > 0 ? (totalComissao / totalContratos) : 0;
      return {
        name: u.name,
        comissaoPorContrato
      };
    });

    // Determinar o período filtrado
    let periodoTexto = "Todo o período";
    if (periodPreset === "today" && dateRange.from && dateRange.to) {
      periodoTexto = `Hoje (${format(new Date(dateRange.from), 'dd/MM/yyyy')})`;
    } else if (periodPreset === "7days" && dateRange.from && dateRange.to) {
      periodoTexto = `Últimos 7 dias (${format(new Date(dateRange.from), 'dd/MM/yyyy')} até ${format(new Date(dateRange.to), 'dd/MM/yyyy')})`;
    } else if (periodPreset === "month" && dateRange.from && dateRange.to) {
      periodoTexto = `Este mês (${format(new Date(dateRange.from), 'dd/MM/yyyy')} até ${format(new Date(dateRange.to), 'dd/MM/yyyy')})`;
    } else if (periodPreset === "custom" && dateRange.from && dateRange.to) {
      periodoTexto = `Personalizado (${format(new Date(dateRange.from), 'dd/MM/yyyy')} até ${format(new Date(dateRange.to), 'dd/MM/yyyy')})`;
    }

    // Montar título e período com destaque no título
    const tituloHtml = `
      <table style="width:100%;border-collapse:collapse;margin-bottom:0;">
        <tr>
          <td style="font-size:22px;text-align:center;margin-bottom:2px;font-family:sans-serif;padding:10px 0 2px 0;font-weight:bold;color:#111; background:#fff;" colspan="7">Relatório Comissões</td>
        </tr>
        <tr style="background:#f6fef9;">
          <td style="font-size:14px;text-align:center;margin-bottom:12px;font-family:sans-serif;padding:0 0 12px 0;" colspan="7">Período: <b>${periodoTexto}</b></td>
        </tr>
      </table>
    `;

    // Montar sumário em HTML
    const sumarioHtml = `
      <table border="1" style="margin-bottom:10px">
        <tr bgcolor="#f0fdf4">
          <th colspan="2" style="text-align:center;vertical-align:middle">Sumário: Comissão por Contrato de Cada Usina</th>
        </tr>
        <tr>
          <th style="text-align:center;vertical-align:middle">Usina</th>
          <th style="text-align:center;vertical-align:middle">Comissão por Contrato (R$)</th>
        </tr>
        ${sumario.map(s => `
          <tr>
            <td style="text-align:center;vertical-align:middle">${s.name}</td>
            <td style="text-align:center;vertical-align:middle">R$ ${s.comissaoPorContrato.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
          </tr>
        `).join("")}
      </table>
    `;

    // Espaçamento visual entre sumário e relatório (linhas vazias)
    const spacerHtml = `<table style="margin-bottom:10px"><tr><td colspan="${headers.length}">&nbsp;</td></tr><tr><td colspan="${headers.length}">&nbsp;</td></tr></table>`;

    // Montar linhas do relatório, formatando valores como moeda e centralizando todas as células
    const cellStyle = "text-align:center;vertical-align:middle";
    const rows = dadosFiltrados.map(item => `
      <tr>
        <td style="${cellStyle}">${item.setor}</td>
        <td style="${cellStyle}">${(item.consultor || "").toUpperCase()}</td>
        ${usinas.map(u => {
      const qtd = item.detalhes_usinas?.[u.name]?.qtd || 0;
      const valor = item.detalhes_usinas?.[u.name]?.valor || 0;
      return `<td style="${cellStyle}"><div>${qtd}</div><div style='font-size:10px;color:#555;'>R$ ${valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></td>`;
    }).join("")}
        <td style="${cellStyle}">${item.contratos}</td>
        <td style="${cellStyle}">R$ ${(item.total_comissao || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
      </tr>
    `).join("");

    // Centralizar também os headers
    const thStyle = "text-align:center;vertical-align:middle";
    const template = `<html><meta charset="UTF-8"><body>${tituloHtml}${sumarioHtml}${spacerHtml}<table border="1"><tr bgcolor="#f0fdf4">${headers.map(h => `<th style='${thStyle}'>${h}</th>`).join("")}</tr>${rows}</table></body></html>`;
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([template], { type: "application/vnd.ms-excel" }));
    link.download = `Comissoes_${format(new Date(), "ddMMyy")}.xls`;
    link.click();
    toast({ title: "Sucesso", description: "Relatório exportado com sucesso!" });
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h1 className="text-3xl font-bold tracking-tight">Gestão de Comissões</h1>
          <Button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 h-10">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar
          </Button>
        </div>

        <Card className="bg-muted/40 border-muted-foreground/20 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-col xl:flex-row gap-4 items-end xl:items-center xl:justify-end">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground shrink-0 pb-2 xl:pb-0">
                <Filter className="w-4 h-4" /> Filtros:
              </div>
              <div className="flex flex-wrap items-center justify-end gap-3 w-full">
                <Input placeholder="Buscar consultor..." className="h-9 text-xs bg-background w-full sm:w-[160px]" value={searchName} onChange={(e) => setSearchName(e.target.value)} />
                <Select value={selectedSector} onValueChange={(v) => { setSelectedSector(v); setSelectedUser("all"); }}>
                  <SelectTrigger className="h-9 text-xs bg-background w-full sm:w-[160px]"><SelectValue placeholder="Setor" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos Setores</SelectItem>
                    {setores.map(s => <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>)}
                  </SelectContent>
                  <Select value={selectedUsina} onValueChange={setSelectedUsina}>
                    <SelectTrigger className="h-9 text-xs bg-background w-full sm:w-[160px]">
                      <SelectValue placeholder="Usina" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todas as Usinas</SelectItem>
                      {usinas.map(u => (
                        <SelectItem key={u.id} value={u.name}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Select>
                {selectedSector !== "all" && (
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="h-9 text-xs bg-background w-full sm:w-[160px]"><SelectValue placeholder="Consultor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos do Setor</SelectItem>
                      {dados.filter(d => d.setor === selectedSector).map(u => (
                        <SelectItem key={u.userId} value={u.userId}>{u.consultor}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <Select value={periodPreset} onValueChange={handlePeriodPresetChange}>
                  <SelectTrigger className="h-9 text-xs bg-background w-full sm:w-[160px]"><SelectValue placeholder="Período" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todo o período</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="month">Este Mês</SelectItem>
                    <SelectItem value="custom">Personalizado...</SelectItem>
                  </SelectContent>
                </Select>
                {periodPreset === "custom" && (
                  <div className="flex items-center gap-2">
                    <Input type="date" className="h-9 w-[155px] text-xs bg-background px-3" value={dateRange.from || ""} onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))} />
                    <span className="text-[10px] font-bold">ATÉ</span>
                    <Input type="date" className="h-9 w-[155px] text-xs bg-background px-3" value={dateRange.to || ""} onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))} />
                  </div>
                )}
                <Button variant="ghost" size="icon" onClick={clearFilters} className="h-9 w-9 text-muted-foreground hover:text-destructive"><Eraser className="w-5 h-5" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-stretch">
          <Card className="border-l-4 border-l-emerald-500 shadow-sm flex flex-col justify-center min-h-[110px]">
            <CardHeader className="py-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase text-emerald-600">Total a Pagar</CardTitle>
              <DollarSign className="w-4 h-4 text-emerald-600" />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold text-black">R$ {totalComissaoGeral.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</div></CardContent>
          </Card>

          <Card className="border-l-4 border-l-amber-500 shadow-sm flex flex-col justify-center min-h-[110px]">
            <CardHeader className="py-2 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-bold uppercase text-amber-600">Consultor Destaque</CardTitle>
              <Trophy className="w-4 h-4 text-amber-500" />
            </CardHeader>
            <CardContent>
  <div className="text-lg font-bold text-black truncate">{consultorDestaque?.consultor || "---"}</div>
  <p className="text-xs text-muted-foreground">
    {/* AJUSTE AQUI: Verifica se há filtro de usina para exibir a contagem correta */}
    {selectedUsina === "all" 
      ? (consultorDestaque?.contratos || 0) 
      : (consultorDestaque?.detalhes_usinas?.[selectedUsina]?.qtd || 0)} contratos
  </p>
</CardContent>
          </Card>

          <Card className="md:col-span-2 shadow-sm flex flex-col min-h-[110px]">
            <CardHeader className="py-2 bg-muted/20 border-b">
              <CardTitle className="text-xs font-bold uppercase text-black flex items-center gap-2">
                <BarChart3 className="w-3 h-3" /> Contratos por Usina
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 flex-1">
              <div className="flex flex-wrap gap-2 justify-start items-center">
                {usinas
                  .filter(u => selectedUsina === "all" || u.name === selectedUsina) // Filtra a lista de usinas exibida
                  .map(u => {
                    const totalU = dadosFiltrados.reduce((acc, curr) =>
                      acc + (curr.detalhes_usinas?.[u.name]?.qtd || 0), 0
                    );
                    return (
                      <div key={u.id} className="flex-1 min-w-[100px] text-center p-2 border rounded bg-white flex flex-col justify-center shadow-sm">
                        <p className="text-[9px] uppercase font-bold text-black truncate">{u.name}</p>
                        <p className="text-lg font-bold text-black">{totalU}</p>
                        <p className="text-[8px] text-muted-foreground uppercase">Contratos</p>
                      </div>
                    );
                  })}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="shadow-sm overflow-hidden bg-white border-muted">
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-emerald-50/50">
                  <TableRow className="border-b-black/10">
                    <TableHead className="font-bold text-black uppercase text-xs text-center">Setor</TableHead>
                    <TableHead className="font-bold text-black uppercase text-xs text-center">Consultor</TableHead>
                    {usinas.map(u => (
                      <TableHead key={u.id} className="text-center font-bold text-black uppercase text-xs border-x border-black/5">{u.name}</TableHead>
                    ))}
                    <TableHead className="text-center font-bold text-black uppercase text-xs bg-amber-50/30">Total Contratos</TableHead>
                    <TableHead className="text-center font-bold bg-emerald-600 text-white uppercase text-xs">Comissão Total (R$)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow><TableCell colSpan={usinas.length + 4} className="h-24 text-center"><Loader2 className="animate-spin inline mr-2" /> Carregando...</TableCell></TableRow>
                  ) : dadosFiltrados.length === 0 ? (
                    <TableRow><TableCell colSpan={usinas.length + 4} className="h-24 text-center text-muted-foreground">Nenhum contrato encontrado.</TableCell></TableRow>
                  ) : (
                    dadosFiltrados.map((item, idx) => {
                      const isUsinaFilterActive = selectedUsina !== "all";

                      // Define o que aparece nas colunas finais de resumo
                      const totalContratosLinha = isUsinaFilterActive
                        ? (item.detalhes_usinas?.[selectedUsina]?.qtd || 0)
                        : (item.contratos || 0);

                      const totalComissaoLinha = isUsinaFilterActive
                        ? (item.detalhes_usinas?.[selectedUsina]?.valor || 0)
                        : (item.total_comissao || 0);

                      return (
                        <TableRow key={idx} className="hover:bg-muted/30 transition-colors border-b">
                          <TableCell className="text-black text-center">{item.setor || '---'}</TableCell>
                          <TableCell className="font-bold text-black text-center">{item.consultor}</TableCell>

                          {/* Mapeia todas as usinas para manter o alinhamento com o cabeçalho */}
                          {usinas.map(u => {
                            // Se houver filtro e esta não for a usina filtrada, exibe vazio ou 0
                            const mostrarDados = !isUsinaFilterActive || u.name === selectedUsina;
                            const info = mostrarDados ? (item.detalhes_usinas?.[u.name] || { qtd: 0, valor: 0 }) : { qtd: 0, valor: 0 };

                            return (
                              <TableCell key={u.id} className="text-center border-x border-muted">
                                <div className={`font-bold text-center ${!mostrarDados ? 'opacity-20' : 'text-black'}`}>
                                  {info.qtd}
                                </div>
                                <div className={`text-[10px] text-center ${!mostrarDados ? 'opacity-20' : 'text-muted-foreground'}`}>
                                  R$ {info.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                </div>
                              </TableCell>
                            );
                          })}

                          <TableCell className="text-center font-bold text-black bg-amber-50/10">
                            {totalContratosLinha}
                          </TableCell>
                          <TableCell className="text-center font-bold text-emerald-700 bg-emerald-50/30">
                            R$ {totalComissaoLinha.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Comissao;