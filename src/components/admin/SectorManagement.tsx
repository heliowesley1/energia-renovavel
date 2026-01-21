import React, { useState, useEffect } from 'react';
import { useApi } from '@/hooks/useApi';
import DashboardLayout from '@/components/layout/DashboardLayout';
import type { Sector } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { Building2, Plus, Edit, Trash2, CalendarDays, Hash, AlignLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';

const SectorManagement: React.FC = () => {
  const { toast } = useToast();
  const api = useApi();
  
  // --- ESTADOS DE DADOS REAIS ---
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [loading, setLoading] = useState(true);

  // Carregamento inicial do Banco de Dados
  useEffect(() => {
    const loadSectors = async () => {
      try {
        const data = await api.get('/setores.php');
        setSectors(data || []);
      } catch (error) {
        toast({ title: "Erro", description: "Falha ao carregar setores.", variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    loadSectors();
  }, []);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  const resetForm = () => {
    setFormData({ name: '', description: '' });
    setEditingSector(null);
  };

  const handleOpenDialog = (sector?: Sector) => {
    if (sector) {
      setEditingSector(sector);
      setFormData({
        name: sector.name,
        description: sector.description || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (editingSector) {
        await api.post('/setores.php?action=update', { ...formData, id: editingSector.id });
        toast({ title: 'Setor atualizado!', description: 'As informações foram salvas com sucesso.' });
      } else {
        await api.post('/setores.php?action=create', formData);
        toast({ title: 'Setor criado!', description: 'O novo setor foi adicionado com sucesso.' });
      }
      
      const updatedData = await api.get('/setores.php');
      setSectors(updatedData || []);
      setIsDialogOpen(false);
      resetForm();
    } catch (err) {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.post('/setores.php?action=delete', { id });
      setSectors((prev) => prev.filter((s) => s.id !== id));
      toast({ title: 'Setor removido', description: 'O setor foi excluído com sucesso.' });
    } catch (err) {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Gestão de Setores
            </h1>
            <p className="text-muted-foreground mt-1">
              Crie e gerencie os setores da empresa diretamente no banco.
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="hero" onClick={() => handleOpenDialog()} className="shadow-lg">
                <Plus className="w-4 h-4 mr-2" />
                Novo Setor
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>
                  {editingSector ? 'Editar Setor' : 'Criar Novo Setor'}
                </DialogTitle>
                <DialogDescription>
                  {editingSector ? 'Atualize as informações do setor' : 'Preencha os dados do novo setor'}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Nome do Setor *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Ex: Região Norte"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Descrição do setor..."
                    rows={3}
                  />
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit" variant="hero">
                    {editingSector ? 'Salvar Alterações' : 'Criar Setor'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <Card className="glass-card border-l-4 border-l-primary">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Building2 className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground font-medium">Setores Operacionais</p>
                <p className="text-3xl font-display font-bold text-black">{sectors.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ORGANIZAÇÃO EM GRID (INOVAÇÃO VISUAL) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sectors.map((sector) => (
            <Card key={sector.id} className="glass-card hover:shadow-md transition-all group border-t-4 border-t-transparent hover:border-t-primary">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg font-bold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-muted-foreground" />
                      {sector.name}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
                      <Hash className="w-3 h-3" /> ID: {sector.id}
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/10 hover:text-primary" onClick={() => handleOpenDialog(sector)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive" onClick={() => handleDelete(sector.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-1.5">
                   <Label className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1">
                     <AlignLeft className="w-3 h-3" /> Descrição
                   </Label>
                   <p className="text-sm text-foreground/80 line-clamp-3 min-h-[3rem]">
                     {sector.description || <span className="italic opacity-50">Sem descrição informada.</span>}
                   </p>
                </div>
                
                <div className="pt-3 border-t flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <CalendarDays className="w-3.5 h-3.5" />
                    <span>Criado em {format(new Date(sector.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {sectors.length === 0 && !loading && (
            <div className="col-span-full flex flex-col items-center justify-center py-20 bg-muted/20 rounded-2xl border-2 border-dashed">
              <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
              <p className="text-muted-foreground font-medium">Nenhum setor encontrado no banco de dados.</p>
              <Button variant="link" onClick={() => handleOpenDialog()} className="mt-2 text-primary">Clique para cadastrar o primeiro</Button>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default SectorManagement;