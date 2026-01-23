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
import { Plus, Trash2, Factory, Loader2, Hash, AlignLeft, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const UsinaManagement: React.FC = () => {
  const { toast } = useToast();
  const api = useApi();
  const [usinas, setUsinas] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const loadUsinas = async () => {
    try {
      const data = await api.get('/usinas.php');
      setUsinas(data || []);
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao carregar usinas.", variant: "destructive" });
    }
  };

  useEffect(() => { loadUsinas(); }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setLoading(true);
    try {
      const res = await api.post('/usinas.php?action=create', { name, description });
      if (res?.success) {
        toast({ title: "Sucesso", description: "Usina cadastrada com sucesso!" });
        setName('');
        setDescription('');
        loadUsinas();
      }
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao cadastrar usina.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/usinas.php?id=${id}`);
      toast({ title: "Excluído", description: "Usina removida com sucesso." });
      loadUsinas();
    } catch (error) {
      toast({ title: "Erro", description: "Falha ao excluir.", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8 animate-fade-in pb-10">
        {/* Header Inovador */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-6 rounded-2xl border shadow-sm">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl border border-emerald-500/20">
              <Factory className="w-8 h-8 text-emerald-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Gestão de Usinas</h1>
              <p className="text-muted-foreground flex items-center gap-2">
                <Info className="w-4 h-4" /> {usinas.length} unidades operacionais cadastradas
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Formulário Lateral */}
          <Card className="lg:col-span-4 h-fit sticky top-6 border-2 shadow-md overflow-hidden">
            <div className="h-1.5 bg-primary w-full" />
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-primary" /> Nova Unidade
              </CardTitle>
              <CardDescription>Adicione uma nova usina à rede</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-muted-foreground">Nome da Usina</Label>
                  <Input 
                    value={name} 
                    onChange={e => setName(e.target.value)} 
                    placeholder="Ex: Solar Central Norte" 
                    className="h-11 bg-muted/30 border-muted-foreground/20 focus:border-primary transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="font-bold text-xs uppercase text-muted-foreground">Descrição / Notas</Label>
                  <Textarea 
                    value={description} 
                    onChange={e => setDescription(e.target.value)} 
                    placeholder="Detalhes técnicos ou localização..." 
                    className="min-h-[120px] bg-muted/30 border-muted-foreground/20 focus:border-primary transition-all resize-none"
                  />
                </div>
                <Button type="submit" className="w-full h-11 text-base font-bold shadow-lg" disabled={loading}>
                  {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Plus className="w-5 h-5 mr-2" />}
                  Cadastrar Unidade
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Grid de Cards das Usinas */}
          <div className="lg:col-span-8">
            {usinas.length === 0 ? (
              <div className="h-64 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center text-muted-foreground bg-muted/10">
                <Factory className="w-12 h-12 mb-4 opacity-20" />
                <p className="font-medium">Nenhuma usina encontrada no sistema.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {usinas.map((u) => (
                  <Card key={u.id} className="group hover:border-primary/50 transition-all duration-300 shadow-sm hover:shadow-xl relative overflow-hidden bg-gradient-to-br from-card to-muted/20">
                    <div className="absolute top-0 right-0 p-4">
                      <span className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-muted px-2 py-1 rounded-full uppercase">
                        <Hash className="w-3 h-3" /> ID {u.id}
                      </span>
                    </div>
                    
                    <CardHeader className="pb-3">
                      <div className="p-2 bg-primary/5 w-fit rounded-lg group-hover:bg-primary group-hover:text-white transition-colors duration-300">
                        <Factory className="w-5 h-5" />
                      </div>
                      <CardTitle className="text-xl mt-3 break-all">{u.name}</CardTitle>
                    </CardHeader>
                    
                    <CardContent className="pb-2 h-19 overflow-y-auto">
                      <div className="flex gap-2 items-start text-sm text-muted-foreground leading-relaxed">
                        <AlignLeft className="w-4 h-4 mt-1 shrink-0 opacity-50" />
                        <p>{u.description || 'Sem descrição adicional.'}</p>
                      </div>
                    </CardContent>

                    <CardFooter className="pt-1 pb-2 flex justify-end border-t border-muted-foreground/5 mt-0 bg-muted/5 group-hover:bg-muted/10">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-muted-foreground hover:text-red-600 hover:bg-red-50 gap-2 font-medium"
                          >
                            <Trash2 className="w-4 h-4" /> Excluir Usina
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle className="flex items-center gap-2">
                              <Trash2 className="w-5 h-5 text-red-500" /> Confirmar Exclusão
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              Você está prestes a excluir a usina <strong>{u.name}</strong>. 
                              Isso poderá afetar os clientes vinculados a esta unidade. Esta ação não pode ser desfeita.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => handleDelete(u.id)}
                            >
                              Confirmar Exclusão
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UsinaManagement;