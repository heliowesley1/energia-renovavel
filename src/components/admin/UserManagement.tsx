import React, { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { apiFetch } from '@/hooks/useApi';
import type { User, Sector } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { UserCog, Plus, Edit, Shield, KeyRound, Power, Ban, Briefcase, Search, Filter, X, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

const UserManagement: React.FC = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [sectors, setSectors] = useState<Sector[]>([]);
  const [globalNameSearch, setGlobalNameSearch] = useState('');
  const [globalSectorFilter, setGlobalSectorFilter] = useState('all');
  const [globalRoleFilter, setGlobalRoleFilter] = useState('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'user' as 'admin' | 'user' | 'supervisor', sectorId: '', password: '' });

  const loadData = async () => {
    try {
      const [userData, sectorData] = await Promise.all([
        apiFetch('/usuarios.php'),
        apiFetch('/setores.php')
      ]);
      setUsers(userData);
      setSectors(sectorData);
    } catch (error) {
      toast({ title: "Erro ao carregar dados", variant: "destructive" });
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiFetch('/usuarios.php', {
        method: editingUser ? 'PUT' : 'POST',
        body: JSON.stringify(editingUser ? { ...formData, id: editingUser.id, active: editingUser.active } : { ...formData, active: true })
      });
      toast({ title: editingUser ? 'Usuário atualizado!' : 'Criado com sucesso!' });
      setIsDialogOpen(false);
      loadData();
    } catch {
      toast({ title: "Erro ao salvar", variant: "destructive" });
    }
  };

  const handleToggleStatus = async (user: User) => {
    try {
      const newStatus = !user.active;
      await apiFetch('/usuarios.php', { method: 'PUT', body: JSON.stringify({ ...user, active: newStatus }) });
      toast({ title: newStatus ? 'Acesso Liberado' : 'Acesso Inativado' });
      loadData();
    } catch {
      toast({ title: "Erro na operação", variant: "destructive" });
    }
  };

  const globalFilteredUsers = users.filter(u => {
    const matchName = u.name.toLowerCase().includes(globalNameSearch.toLowerCase());
    const matchSector = globalSectorFilter === 'all' ? true : u.sectorId === globalSectorFilter;
    const matchRole = globalRoleFilter === 'all' ? true : u.role === globalRoleFilter;
    return matchName && matchSector && matchRole;
  });

  const renderUserTable = (usersList: User[]) => (
    <div className="rounded-md border bg-background/50 overflow-hidden">
      <Table>
        <TableHeader><TableRow className="bg-muted/40"><TableHead>Colaborador</TableHead><TableHead>Cargo</TableHead><TableHead>Status</TableHead><TableHead className="text-right">Ações</TableHead></TableRow></TableHeader>
        <TableBody>
          {usersList.map((user) => (
            <TableRow key={user.id} className={cn(!user.active && "opacity-60 bg-muted/30")}>
              <TableCell><div className="flex flex-col"><span className="font-medium">{user.name}</span><span className="text-xs text-muted-foreground">{user.email}</span></div></TableCell>
              <TableCell><Badge variant="outline">{user.role}</Badge></TableCell>
              <TableCell><div className="flex items-center gap-2"><div className={cn("w-2 h-2 rounded-full", user.active ? "bg-emerald-500" : "bg-amber-500")} />{user.active ? 'Ativo' : 'Inativo'}</div></TableCell>
              <TableCell className="text-right">
                <Button variant="ghost" size="icon" onClick={() => handleToggleStatus(user)}>{user.active ? <Ban className="w-4 h-4" /> : <Power className="w-4 h-4" />}</Button>
                <Button variant="ghost" size="icon" onClick={() => { setEditingUser(user); setFormData({name:user.name, email:user.email, role:user.role, sectorId:user.sectorId || '', password:''}); setIsDialogOpen(true); }}><Edit className="w-4 h-4" /></Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in pb-10">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <Button variant="hero" onClick={() => { setEditingUser(null); setFormData({name:'', email:'', role:'user', sectorId:'', password:''}); setIsDialogOpen(true); }}><Plus className="w-4 h-4 mr-2" /> Novo Usuário</Button>
        </div>

        {/* Stats omitidos para brevidade, mas use globalFilteredUsers.length */}
        
        <Accordion type="multiple" className="w-full space-y-3">
          {sectors.map((sector) => {
            const sectorUsers = globalFilteredUsers.filter(u => u.sectorId === sector.id);
            if (sectorUsers.length === 0) return null;
            return (
              <AccordionItem key={sector.id} value={sector.id} className="bg-card border rounded-xl shadow-sm">
                <AccordionTrigger className="px-4 py-3 hover:no-underline">
                  <span className="flex items-center gap-3 font-semibold text-lg">{sector.name} <Badge variant="outline">{sectorUsers.length} membros</Badge></span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4">{renderUserTable(sectorUsers)}</AccordionContent>
              </AccordionItem>
            );
          })}
        </Accordion>
      </div>
      {/* Dialog omitido, mantenha o seu JSX original conectando os inputs ao setFormData */}
    </DashboardLayout>
  );
};

export default UserManagement;