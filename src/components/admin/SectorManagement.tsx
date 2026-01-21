import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiFetch } from '@/hooks/useApi';
import type { Sector } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const SectorManagement: React.FC = () => {
  const { toast } = useToast();
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', description: '' });
  const [editingId, setEditingId] = useState<string | null>(null);

  const loadSectors = async () => {
    try {
      const data = await apiFetch('/setores.php');
      setSectors(data);
    } catch {
      toast({ title: "Erro ao carregar setores", variant: "destructive" });
    }
  };

  useEffect(() => { loadSectors(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/setores.php', {
        method: editingId ? 'PUT' : 'POST',
        body: JSON.stringify(editingId ? { ...formData, id: editingId } : formData)
      });
      setIsDialogOpen(false);
      loadSectors();
      toast({ title: "Salvo com sucesso!" });
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Excluir setor?")) return;
    try {
      await apiFetch(`/setores.php?id=${id}`, { method: 'DELETE' });
      loadSectors();
      toast({ title: "Removido!" });
    } catch {
      toast({ title: "Erro ao excluir", variant: "destructive" });
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestão de Setores</h1>
          <Button variant="hero" onClick={() => { setEditingId(null); setFormData({name:'', description:''}); setIsDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Novo Setor</Button>
        </div>
        <Card className="glass-card">
          <Table>
            <TableHeader><TableRow><TableHead>Nome</TableHead><TableHead>Descrição</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
            <TableBody>
              {sectors.map((sector) => (
                <TableRow key={sector.id}>
                  <TableCell className="font-medium">{sector.name}</TableCell>
                  <TableCell>{sector.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="sm" onClick={() => { setEditingId(sector.id); setFormData({name:sector.name, description:sector.description || ''}); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="sm" className="text-destructive" onClick={() => handleDelete(sector.id)}><Trash2 className="w-4 h-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      </div>
      {/* Dialog de formulário omitido para focar na lógica */}
    </DashboardLayout>
  );
};

export default SectorManagement;