import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Plus, Trash2, Factory, Loader2, Hash, AlignLeft, Info, Banknote, Edit2, Eraser } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const UsinaManagement: React.FC = () => {
  const { toast } = useToast();
  const api = useApi();
  const [usinas, setUsinas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [editingId, setEditingId] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [comission, setComission] = useState('');

  const formatCurrency = (value: string) => {
    const digits = value.replace(/\D/g, "");
    return (Number(digits) / 100).toLocaleString("pt-BR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const loadUsinas = async () => {
    try {
      const data = await api.get('/usinas.php');
      setUsinas(data || []);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar usinas.", variant: "destructive" });
    }
  };

  useEffect(() => { loadUsinas(); }, []);

  const clearForm = () => {
    setEditingId(null);
    setName('');
    setDescription('');
    setComission('');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);

    const cleanComission = comission
      ? parseFloat(comission.replace(/\./g, "").replace(",", "."))
      : null;

    const payload = { 
      name, 
      description, 
      comission: cleanComission 
    };

    try {
      let res;
      if (editingId) {
        // CORREÇÃO: Enviando o ID explicitamente para evitar duplicação
        res = await api.post(`/usinas.php?action=update`, { ...payload, id: editingId });
      } else {
        res = await api.post('/usinas.php?action=create', payload);
      }

      if (res?.success) {
        toast({ title: "Sucesso", description: editingId ? "Usina atualizada!" : "Usina cadastrada!" });
        clearForm();
        loadUsinas();
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao salvar usina.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (u: any) => {
    setEditingId(u.id);
    setName(u.name);
    setDescription(u.description || '');
    const val = u.comission ? (parseFloat(u.comission) * 100).toString() : "0";
    setComission(formatCurrency(val));
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await api.delete(`/usinas.php?id=${id}`);
      if (res?.success) {
        toast({ title: "Excluído", description: "Usina removida com sucesso." });
        if (editingId === id) clearForm();
        loadUsinas();
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in pb-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <Factory className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestão de Usinas</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4" /> {usinas.length} unidades cadastradas
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <Card className={cn(
            "lg:col-span-4 h-fit sticky top-6 border-2 shadow-md transition-all duration-300 overflow-hidden",
            editingId ? "border-amber-500/50" : "border-emerald-600/50"
          )}>
            <div className={cn("h-1.5 w-full", editingId ? "bg-amber-500" : "bg-emerald-600")} />
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {editingId ? <Edit2 className="w-5 h-5 text-amber-500" /> : <Plus className="w-5 h-5 text-emerald-600" />}
                  {editingId ? 'Editar Usina' : 'Nova Unidade'}
                </div>
                {editingId && (
                  <Button variant="ghost" size="icon" onClick={clearForm} title="Cancelar edição">
                    <Eraser className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSave} className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-muted-foreground">Nome da Usina</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Solar Central Norte" className="h-11 bg-muted/30 border-muted-foreground/20 focus:border-emerald-500" />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-muted-foreground text-emerald-600">Comissão fixa (R$)</Label>
                  <div className="relative">
                    <Input type="text" value={comission} onChange={e => setComission(formatCurrency(e.target.value))} placeholder="0,00" className="h-11 pl-9 bg-muted/30 border-muted-foreground/20 focus:border-emerald-500 font-mono" />
                    <Banknote className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-muted-foreground">Descrição / Notas</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes técnicos..." className="min-h-[100px] bg-muted/30 border-muted-foreground/20 focus:border-primary resize-none" />
                </div>
                <Button type="submit" className={cn("w-full h-11 text-base font-bold shadow-lg", editingId ? "bg-amber-600 hover:bg-amber-700" : "bg-emerald-600 hover:bg-emerald-700 text-white")} disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : editingId ? "Atualizar Dados" : "Cadastrar Unidade"}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div className="lg:col-span-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {usinas.map((u) => (
                <Card 
                  key={u.id} 
                  onClick={() => handleEdit(u)}
                  className={cn(
                    "group cursor-pointer transition-all duration-300 shadow-sm hover:shadow-xl relative overflow-hidden bg-gradient-to-br from-card to-muted/20 border-2",
                    editingId === u.id ? "border-amber-500 shadow-amber-500/10" : "hover:border-primary/50"
                  )}
                >
                  <div className="absolute top-0 right-0 p-4 flex flex-col items-end gap-2">
                    <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full uppercase border">
                      <Hash className="w-3 h-3" /> {u.id}
                    </span>
                    {u.comission && (
                      <span className="flex items-center gap-1 text-[10px] font-mono font-bold text-emerald-700 bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-full uppercase">
                        <Banknote className="w-3 h-3" /> R$ {parseFloat(u.comission).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                    )}
                  </div>
                  <CardHeader className="pb-3">
                    <div className={cn("p-2 w-fit rounded-lg", editingId === u.id ? "bg-amber-500 text-white" : "bg-emerald-500/5 group-hover:bg-emerald-600 group-hover:text-white")}>
                      <Factory className="w-5 h-5" />
                    </div>
                    <CardTitle className="text-xl mt-3 break-all">{u.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">{u.description || 'Sem descrição.'}</p>
                  </CardContent>
                  <CardFooter className="pt-1 pb-2 flex justify-end">
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        {/* CORREÇÃO: e.stopPropagation() evita disparar o handleEdit do Card pai */}
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-red-600 hover:bg-red-50" onClick={(e) => e.stopPropagation()}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent onClick={(e) => e.stopPropagation()}>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                          <AlertDialogDescription>Deseja excluir a usina <strong>{u.name}</strong>?</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction className="bg-red-600" onClick={() => handleDelete(u.id)}>Excluir</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </CardFooter>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UsinaManagement;