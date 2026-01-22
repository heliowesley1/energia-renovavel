import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Trash2, Factory, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
    if (!window.confirm("Deseja realmente excluir esta usina?")) return;
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
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg"><Factory className="w-6 h-6 text-primary" /></div>
          <div>
            <h1 className="text-3xl font-bold">Gestão de Usinas</h1>
            <p className="text-muted-foreground">Cadastre as usinas que serão vinculadas aos clientes</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle>Nova Usina</CardTitle></CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label>Nome da Usina</Label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Solar Central 01" />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Opcional..." />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Plus className="w-4 h-4 mr-2" />}
                  Cadastrar Usina
                </Button>
              </form>
            </CardContent>
          </Card>

          <Card className="lg:col-span-2">
            <CardHeader><CardTitle>Usinas Ativas</CardTitle></CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Descrição</TableHead>
                    <TableHead className="text-right">Ação</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usinas.map((u) => (
                    <TableRow key={u.id}>
                      <TableCell className="font-bold">{u.name}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{u.description || '-'}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(u.id)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                  {usinas.length === 0 && <TableRow><TableCell colSpan={3} className="text-center py-6 text-muted-foreground">Nenhuma usina cadastrada.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default UsinaManagement;