import React, { useState, useMemo, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useApi } from "@/hooks/useApi";
import DashboardLayout from "@/components/layout/DashboardLayout";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  FileSpreadsheet,
  PieChart as PieChartIcon,
  Building2,
  Filter,
  Eraser,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  List,
  Trophy,
  Medal,
  Activity,
  Target,
  Users as UsersIcon,
  Map,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useToast } from "@/hooks/use-toast";
import { format, subDays, startOfMonth, endOfMonth, isSameDay, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { type DateRange } from "react-day-picker";
import { cn } from "@/lib/utils";

const Reports: React.FC = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const api = useApi();
  const isSupervisor = user?.role === "supervisor";

  // --- ESTADOS DE DADOS REAIS ---
  const [dbClients, setDbClients] = useState<any[]>([]);
  const [dbUsers, setDbUsers] = useState<any[]>([]);
  const [dbSectors, setDbSectors] = useState<any[]>([]);
  const [dbUsinas, setDbUsinas] = useState<any[]>([]);

  // Carregamento de dados reais do Banco de Dados (XAMPP) com parâmetros de contexto
  useEffect(() => {
    const loadReportsData = async () => {
      try {
        const queryParams = new URLSearchParams({
          role: user?.role || '',
          userId: user?.id || '',
          sectors: user?.sectorId || '' 
        }).toString();

        const [resClients, resUsers, resSectors, resUsinas] = await Promise.all([
          api.get(`clientes.php?${queryParams}`),
          api.get("usuarios.php"),
          api.get("setores.php"),
          api.get("usinas.php"),
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
        console.error("Erro ao carregar dados do banco:", error);
      }
    };
    if (user) loadReportsData();
  }, [user, api]);

  // --- ESTADOS DOS FILTROS ---
  const [selectedSector, setSelectedSector] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<string>("all");
  const [periodPreset, setPeriodPreset] = useState<string>("all");
  const [date, setDate] = useState<DateRange | undefined>();

  // --- ESTADO DE PAGINAÇÃO ---
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // --- HANDLERS DOS FILTROS ---
  const handlePeriodPresetChange = (value: string) => {
    setPeriodPreset(value);
    const today = new Date();

    switch (value) {
      case "today":
        setDate({ from: today, to: today });
        break;
      case "7days":
        setDate({ from: subDays(today, 7), to: today });
        break;
      case "month":
        setDate({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case "all":
        setDate(undefined);
        break;
      case "custom":
        if (!date) setDate({ from: undefined, to: undefined });
        break;
    }
  };

  const handleFromDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const newDate = newVal ? new Date(newVal + "T00:00:00") : undefined;
    setDate((prev) => ({ ...prev, from: newDate }));
  };

  const handleToDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVal = e.target.value;
    const newDate = newVal ? new Date(newVal + "T23:59:59") : undefined;
    setDate((prev) => ({ ...prev, to: newDate }));
  };

  const clearFilters = () => {
    setSelectedSector("all");
    setSelectedUser("all");
    setSelectedStatus("all");
    setPeriodPreset("all");
    setDate(undefined);
  };

  // Resetar paginação ao filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [selectedSector, selectedUser, selectedStatus, periodPreset, date]);

  // --- LÓGICA DE FILTRAGEM CORRIGIDA PARA MÚLTIPLOS SETORES ---
  const filteredData = useMemo(() => {
    const supervisorSectors = user?.sectorId ? user.sectorId.split(',') : [];

    const data = dbClients.filter((client) => {
      const clientSectorId = client.sectorId?.toString() || '';
      
      // AJUSTE: Se for supervisor, valida se o cliente pertence a qualquer um dos seus setores
      if (isSupervisor && !supervisorSectors.includes(clientSectorId)) return false;

      const matchSector = selectedSector === "all" || clientSectorId === selectedSector;
      const matchUser = selectedUser === "all" || client.userId?.toString() === selectedUser;
      const matchStatus = selectedStatus === "all" || client.status === selectedStatus;

      let matchDate = true;
      if (date?.from && client.createdAt) {
        const clientDate = new Date(client.createdAt.replace(' ', 'T'));
        const fromDate = startOfDay(date.from);
        const toDate = date.to ? endOfDay(date.to) : endOfDay(date.from);
        matchDate = clientDate >= fromDate && clientDate <= toDate;
      }

      return matchSector && matchUser && matchStatus && matchDate;
    });

    return data.sort(
      (a, b) => new Date(b.createdAt.replace(' ', 'T')).getTime() - new Date(a.createdAt.replace(' ', 'T')).getTime()
    );
  }, [dbClients, selectedSector, selectedUser, selectedStatus, date, isSupervisor, user]);

  const availableConsultants = useMemo(() => {
    const supervisorSectors = user?.sectorId ? user.sectorId.split(',') : [];
    
    return dbUsers.filter(u => {
      const uSector = u.sectorId?.toString() || '';
      const isEligibleRole = u.role === "user" || u.role === "supervisor"; // INCLUI SUPERVISOR NO FILTRO
      
      if (isSupervisor) return isEligibleRole && supervisorSectors.includes(uSector);
      if (selectedSector !== "all") return isEligibleRole && uSector === selectedSector;
      return isEligibleRole;
    });
  }, [dbUsers, selectedSector, isSupervisor, user]);

  // --- CÁLCULOS GERAIS ---
  const totalClients = filteredData.length;

  const clientsByStatus = {
    formalized: filteredData.filter((c) => c.status === "formalized").length,
    pending: filteredData.filter((c) => c.status === "pending").length,
    waiting: filteredData.filter((c) => c.status === "waiting_formalization").length,
  };

  const efficiencyRate = totalClients > 0
    ? ((clientsByStatus.formalized / totalClients) * 100).toFixed(1)
    : "0.0";

  const newClientsToday = useMemo(() => {
    return filteredData.filter((c) =>
      c.createdAt && isSameDay(new Date(c.createdAt.replace(' ', 'T')), new Date()),
    ).length;
  }, [filteredData]);

  const teamPerformance = useMemo(() => {
    const stats: Record<string, { name: string; total: number; approved: number }> = {};
    availableConsultants.forEach((u) => {
      stats[u.id] = { name: u.name, total: 0, approved: 0 };
    });
    filteredData.forEach((client) => {
      if (stats[client.userId]) {
        stats[client.userId].total += 1;
        if (client.status === "formalized") stats[client.userId].approved += 1;
      }
    });
    return Object.values(stats).sort((a, b) => b.approved - a.approved);
  }, [filteredData, availableConsultants]);

  const sectorPerformance = useMemo(() => {
    const stats: Record<string, { name: string; total: number; approved: number }> = {};
    dbSectors.forEach((s) => {
      stats[s.id] = { name: s.name, total: 0, approved: 0 };
    });
    filteredData.forEach((client) => {
      if (stats[client.sectorId]) {
        stats[client.sectorId].total += 1;
        if (client.status === "formalized") stats[client.sectorId].approved += 1;
      }
    });
    return Object.values(stats).sort((a, b) => b.total - a.total).slice(0, 5);
  }, [filteredData, dbSectors]);

  // --- PAGINAÇÃO ---
  const totalPages = Math.ceil(totalClients / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedClients = filteredData.slice(startIndex, startIndex + itemsPerPage);

  const getSectorName = (id: any) => dbSectors.find((s) => s.id.toString() === id?.toString())?.name || "N/A";
  const getUserName = (id: any) => dbUsers.find((u) => u.id.toString() === id?.toString())?.name || "N/A";
  const getUsinaName = (id: any) => dbUsinas.find((u) => u.id.toString() === id?.toString())?.name || "-";

  // --- EXPORTAÇÃO EXCEL ---
  const handleExportExcel = () => {
    if (filteredData.length === 0) {
      toast({ title: "Atenção", description: "Não há dados para exportar.", variant: "destructive" });
      return;
    }
    try {
      const today = new Date();
      let periodDesc = "Todo o Período";
      if (periodPreset === "today") periodDesc = "Hoje";
      else if (periodPreset === "7days") periodDesc = "Últimos 7 dias";
      else if (periodPreset === "month") periodDesc = "Este Mês";
      else if (periodPreset === "custom" && date?.from) {
        periodDesc = `${format(date.from, "dd/MM/yy")} até ${date.to ? format(date.to, "dd/MM/yy") : format(today, "dd/MM/yy")}`;
      }
      const tableHeaders = ["DATA", "CLIENTE", "CPF", "TELEFONE", "EMAIL", "USINA", "SETOR", "RESPONSÁVEL", "STATUS", "OBSERVAÇÕES"];
      const tableRows = filteredData.map((client) => `
        <tr style="height: 18pt;">
          <td style="border: 0.5pt solid #000000; text-align: center; font-size: 8.5pt;">${client.createdAt ? format(new Date(client.createdAt.replace(' ', 'T')), "dd/MM/yyyy HH:mm") : '-'}</td>
          <td style="border: 0.5pt solid #000000; text-align: left; font-size: 8.5pt; padding-left: 5px;">${client.name.toUpperCase()}</td>
          <td style="border: 0.5pt solid #000000; text-align: center; mso-number-format:'@'; font-size: 8.5pt;">${client.cpf}</td>
          <td style="border: 0.5pt solid #000000; text-align: center; font-size: 8.5pt;">${client.phone || "-"}</td>
          <td style="border: 0.5pt solid #000000; text-align: left; font-size: 8.5pt;">${client.email || "-"}</td>
          <td style="border: 0.5pt solid #000000; text-align: center; font-size: 8.5pt; font-weight: bold; color: #10b981;">${getUsinaName(client.usinaId)}</td>
          <td style="border: 0.5pt solid #000000; text-align: center; font-size: 8.5pt;">${getSectorName(client.sectorId)}</td>
          <td style="border: 0.5pt solid #000000; text-align: center; font-size: 8.5pt;">${getUserName(client.userId)}</td>
          <td style="border: 0.5pt solid #000000; text-align: center; font-size: 8.5pt; font-weight: bold;">${client.status.toUpperCase()}</td>
          <td style="border: 0.5pt solid #000000; text-align: left; font-size: 8.5pt;">${client.observations || "-"}</td>
        </tr>`).join("");
      const excelTemplate = `<html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40"><head><meta charset="UTF-8"></head><body><table><tr><td colspan="10" style="font-size: 16pt; font-weight: bold; text-align: center; padding: 20px;">RELATÓRIO DE CLIENTES</td></tr><tr><td colspan="10" style="font-size: 9pt; text-align: center; color: #64748b;">Período: ${periodDesc}</td></tr><tr style="height: 25pt;">${tableHeaders.map((h) => `<th bgcolor="#C6EFCE" style="border: 0.5pt solid #000000; font-weight: bold;">${h}</th>`).join("")}</tr>${tableRows}</table></body></html>`;
      const blob = new Blob([excelTemplate], { type: "application/vnd.ms-excel" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `Relatorio_Clientes_${format(today, "ddMMyy")}.xls`;
      link.click();
      URL.revokeObjectURL(url);
      toast({ title: "Sucesso", description: "Exportação concluída" });
    } catch (e) {
      console.error(e);
      toast({ title: "Erro", description: "Falha na exportação.", variant: "destructive" });
    }
  };

  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) pages.push(1, 2, 3, 4, "...", totalPages);
      else if (currentPage >= totalPages - 2) pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      else pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
    }
    return pages;
  };

  const availableSectorsForFilter = useMemo(() => {
    const supervisorSectors = user?.sectorId ? user.sectorId.split(',') : [];
    if (isSupervisor) return dbSectors.filter(s => supervisorSectors.includes(s.id.toString()));
    return dbSectors;
  }, [dbSectors, isSupervisor, user]);

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Relatórios {isSupervisor ? ` - Equipe` : "Gerenciais"}
            </h1>
            <p className="text-muted-foreground mt-1">Extração e análise detalhada de dados por consultor e supervisor</p>
          </div>
          <div>
            <Button onClick={handleExportExcel} className="bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm h-10 px-6 active:scale-95">
              <FileSpreadsheet className="w-4 h-4 mr-2" /> Exportar
            </Button>
          </div>
        </div>

        <Card className="bg-muted/40 border-muted-foreground/20 shadow-sm w-full md:w-fit ml-auto transition-all duration-300">
          <CardContent className="p-4">
            <div className="flex flex-col xl:flex-row gap-4 items-end xl:items-center xl:justify-end">
              <div className="flex items-center gap-2 text-sm font-bold text-foreground shrink-0"><Filter className="w-4 h-4" /> Filtros:</div>
              <div className="flex flex-wrap items-center justify-end gap-3 w-full xl:w-auto">
                <div className="w-full sm:w-[160px]">
                  <Select value={selectedSector} onValueChange={(v) => { setSelectedSector(v); setSelectedUser("all"); }}>
                    <SelectTrigger className="bg-background border-input focus:ring-ring h-9 text-xs"><SelectValue placeholder="Setor" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Setores</SelectItem>
                      {availableSectorsForFilter.map((s) => <SelectItem key={s.id} value={s.id.toString()}>{s.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-[160px]">
                  <Select value={selectedUser} onValueChange={setSelectedUser}>
                    <SelectTrigger className="bg-background border-input focus:ring-ring h-9 text-xs"><SelectValue placeholder="Consultor/Sup." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Consultores</SelectItem>
                      {availableConsultants.map((u) => <SelectItem key={u.id} value={u.id.toString()}>{u.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-[160px]">
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="bg-background border-input focus:ring-ring h-9 text-xs"><SelectValue placeholder="Status" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos Status</SelectItem>
                      <SelectItem value="pending">Pendentes</SelectItem>
                      <SelectItem value="formalized">Formalizados</SelectItem>
                      <SelectItem value="waiting_formalization">Aguardando Formalização</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="w-full sm:w-[160px]">
                  <Select value={periodPreset} onValueChange={handlePeriodPresetChange}>
                    <SelectTrigger className="bg-background border-input focus:ring-ring h-9 text-xs"><SelectValue placeholder="Período" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todo o período</SelectItem>
                      <SelectItem value="today">Hoje</SelectItem>
                      <SelectItem value="7days">Últimos 7 dias</SelectItem>
                      <SelectItem value="month">Este Mês</SelectItem>
                      <SelectItem value="custom">Personalizado...</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {periodPreset === "custom" && (
                  <div className="flex items-center gap-2 w-full sm:w-auto animate-in fade-in slide-in-from-right-2 pr-4">
                    <Input type="date" className="h-9 text-[11px] sm:text-xs bg-background w-[125px] pl-2 pr-1" value={date?.from ? format(date.from, "yyyy-MM-dd") : ""} onChange={handleFromDateChange} />
                    <span className="text-muted-foreground text-[10px] font-bold">ATÉ</span>
                    <Input type="date" className="h-9 text-[11px] sm:text-xs bg-background w-[125px] pl-2 pr-1" value={date?.to ? format(date.to, "yyyy-MM-dd") : ""} onChange={handleToDateChange} />
                  </div>
                )}
                <Button variant="ghost" size="icon" onClick={clearFilters} className="shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 h-9 w-9"><Eraser className="w-5 h-5" /></Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Target className="w-5 h-5 text-emerald-500" /> Eficiência Geral</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-foreground">{efficiencyRate}%</div><p className="text-xs text-muted-foreground mt-1">Taxa de formalização total</p></CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2"><CardTitle className="text-lg flex items-center gap-2"><Activity className="w-5 h-5 text-yellow-500" /> Entrada Recente</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-foreground">{newClientsToday}</div><p className="text-xs font-medium text-muted-foreground mt-1">Cadastros hoje</p></CardContent>
          </Card>
          <Card className="hover:shadow-md transition-shadow border-l-4 border-l-orange-500">
            <CardHeader className="pb-2"><CardTitle className="text-lg">Pendências</CardTitle></CardHeader>
            <CardContent><div className="text-3xl font-bold text-black">{clientsByStatus.pending}</div><p className="text-xs text-muted-foreground">Aguardando análise</p></CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500 flex flex-col hover:shadow-md min-h-0">
            <CardHeader className="pb-2 shrink-0"><CardTitle className="text-lg flex items-center gap-2"><Trophy className="w-5 h-5 text-emerald-500" /> Consultor Destaque</CardTitle></CardHeader>
            <CardContent className="flex-1 flex flex-col justify-center min-h-0">
              {teamPerformance.length > 0 ? (
                <div className="flex items-center justify-between bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-12 h-12 bg-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-xl">{teamPerformance[0].name.charAt(0).toUpperCase()}</div>
                    <p className="font-bold text-emerald-900 truncate text-sm">{teamPerformance[0].name.split(" ")[0]}</p>
                  </div>
                  <div className="text-right shrink-0"><p className="text-2xl font-black text-emerald-600">{teamPerformance[0].approved}</p><p className="text-[9px] uppercase font-bold text-zinc-500">Form.</p></div>
                </div>
              ) : <div className="text-center text-muted-foreground text-xs py-2">Sem dados</div>}
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="glass-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><PieChartIcon className="w-5 h-5 text-primary" /> Distribuição por Status</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader><TableRow><TableHead>Status</TableHead><TableHead className="text-right">Qtd</TableHead><TableHead className="text-right">%</TableHead></TableRow></TableHeader>
                <TableBody>
                  <TableRow><TableCell className="font-medium text-black">Formalizados</TableCell><TableCell className="text-right">{clientsByStatus.formalized}</TableCell><TableCell className="text-right">{totalClients > 0 ? ((clientsByStatus.formalized / totalClients) * 100).toFixed(0) : 0}%</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium text-black">Pendentes</TableCell><TableCell className="text-right">{clientsByStatus.pending}</TableCell><TableCell className="text-right">{totalClients > 0 ? ((clientsByStatus.pending / totalClients) * 100).toFixed(0) : 0}%</TableCell></TableRow>
                  <TableRow><TableCell className="font-medium text-black">Aguardando Formalização</TableCell><TableCell className="text-right">{clientsByStatus.waiting}</TableCell><TableCell className="text-right">{totalClients > 0 ? ((clientsByStatus.waiting / totalClients) * 100).toFixed(0) : 0}%</TableCell></TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card className="glass-card">
            <CardHeader><CardTitle className="flex items-center gap-2"><UsersIcon className="w-5 h-5 text-yellow-500" /> Performance da Equipe</CardTitle></CardHeader>
            <CardContent>
              <div className="max-h-[300px] overflow-auto">
                <Table>
                  <TableHeader><TableRow><TableHead>Consultor/Gestor</TableHead><TableHead className="text-right">Total</TableHead><TableHead className="text-right">Form.</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {teamPerformance.map((stat) => (
                      <TableRow key={stat.name}><TableCell className="font-medium truncate max-w-[120px]">{stat.name}</TableCell><TableCell className="text-right">{stat.total}</TableCell><TableCell className="text-right text-emerald-600 font-bold">{stat.approved}</TableCell></TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="space-y-1"><CardTitle className="flex items-center gap-2"><List className="w-5 h-5 text-primary" /> Relatório Detalhado</CardTitle><CardDescription>Listagem completa. Página {currentPage} de {totalPages || 1}.</CardDescription></div>
              <div className="text-sm font-bold text-zinc-950">Total: {totalClients} registros</div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border mb-4">
              <Table>
                <TableHeader><TableRow><TableHead>Cliente</TableHead><TableHead>CPF</TableHead><TableHead>Setor</TableHead><TableHead>Data Cadastro</TableHead><TableHead className="text-right">Status</TableHead></TableRow></TableHeader>
                <TableBody>
                  {paginatedClients.length > 0 ? paginatedClients.map((client) => (
                    <TableRow key={client.id} className="hover:bg-muted/50">
                      <TableCell className="font-medium">{client.name}</TableCell>
                      <TableCell className="text-xs font-mono">{client.cpf}</TableCell>
                      <TableCell className="text-xs">{getSectorName(client.sectorId)}</TableCell>
                      <TableCell className="text-xs">{client.createdAt ? format(new Date(client.createdAt.replace(' ', 'T')), "dd/MM/yyyy HH:mm") : '-'}</TableCell>
                      <TableCell className="text-right">
                        <Badge variant="outline" className={cn(client.status === "formalized" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : client.status === "waiting_formalization" ? "bg-blue-50 text-blue-700 border-blue-200" : "bg-orange-50 text-orange-700 border-orange-200")}>
                          {client.status === "formalized" ? "Formalizado" : client.status === "waiting_formalization" ? "Ag. Formalização" : "Pendente"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) : <TableRow><TableCell colSpan={5} className="h-24 text-center">Nenhum cliente encontrado.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
            {totalClients > 0 && (
              <div className="mt-4 border-t pt-4">
                <Pagination><PaginationContent>
                  <PaginationItem><PaginationPrevious onClick={() => currentPage > 1 && setCurrentPage(currentPage - 1)} className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                  {getPageNumbers().map((page, index) => (
                    <PaginationItem key={index}>{page === "..." ? <PaginationEllipsis /> : <PaginationLink isActive={currentPage === page} onClick={() => typeof page === "number" && setCurrentPage(page)} className="cursor-pointer">{page}</PaginationLink>}</PaginationItem>
                  ))}
                  <PaginationItem><PaginationNext onClick={() => currentPage < totalPages && setCurrentPage(currentPage + 1)} className={currentPage >= totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"} /></PaginationItem>
                </PaginationContent></Pagination>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default Reports;