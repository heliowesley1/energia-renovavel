import React from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { mockClients } from '@/data/mockData';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

const UserOverview: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const myClients = mockClients.filter(c => c.userId === user?.id);
  const approved = myClients.filter(c => c.status === 'approved').length;
  const pending = myClients.filter(c => c.status === 'pending').length;

  return (
    <DashboardLayout>
      <div className="space-y-6 animate-fade-in">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">Olá, {user?.name}</h1>
            <p className="text-muted-foreground mt-1">Aqui está o resumo das suas atividades</p>
          </div>
          <Button onClick={() => navigate('/dashboard/my-clients')} variant="hero">
            Gerenciar Clientes
          </Button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Users className="w-4 h-4" /> Meus Clientes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{myClients.length}</div>
            </CardContent>
          </Card>
          
          <Card className="border-l-4 border-l-success">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-success" /> Aprovados
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{approved}</div>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-warning">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Clock className="w-4 h-4 text-warning" /> Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-bold">{pending}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Últimos Clientes Adicionados</CardTitle>
          </CardHeader>
          <CardContent>
            {myClients.length > 0 ? (
              <div className="space-y-4">
                {myClients.slice(-3).reverse().map(client => (
                  <div key={client.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium">{client.name}</p>
                      <p className="text-sm text-muted-foreground">{client.email}</p>
                    </div>
                    <div className="text-sm capitalize px-2 py-1 rounded bg-background border">
                      {client.status === 'approved' ? 'Aprovado' : 
                       client.status === 'rejected' ? 'Reprovado' : 'Pendente'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">Você ainda não cadastrou nenhum cliente.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default UserOverview;