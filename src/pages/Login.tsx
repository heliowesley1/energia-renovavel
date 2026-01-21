import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Sun, Leaf, Mail, Lock, ShieldCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const currentYear = new Date().getFullYear();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Chama o login que faz o fetch para o PHP
      const success = await login(email, password);
      
      if (success) {
        // O nome agora vem do banco de dados através do AuthContext
        toast({
          title: `Login realizado com sucesso!`,
          description: "Seja bem-vindo ao sistema de Energia Renovável.",
          duration: 3000,
        });

        navigate('/dashboard');
      } else {
        toast({
          title: 'Erro no login',
          description: 'E-mail ou senha incorretos.',
          variant: 'destructive',
          className: "bg-white text-black border-none shadow-lg",
        });
      }
    } catch (error: any) {
      toast({
        title: 'Erro de conexão',
        description: 'Não foi possível conectar ao servidor XAMPP.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-screen gradient-hero flex flex-col relative overflow-hidden">
      {/* Background Decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* Ícones Flutuantes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 text-secondary/30 animate-float"><Sun size={64} /></div>
        <div className="absolute top-20 left-10 text-primary/20 animate-float" style={{ animationDelay: '1.5s' }}><Leaf size={52} /></div>
        <div className="absolute bottom-32 left-32 text-primary/30 animate-float" style={{ animationDelay: '2s' }}><Leaf size={48} /></div>
        <div className="absolute top-1/2 right-24 text-primary/20 animate-float" style={{ animationDelay: '2.5s' }}><Zap size={48} /></div>
      </div>

      <main className="flex-1 flex flex-col items-center justify-center p-4 w-full relative z-10 -mt-20">
        <div className="w-full max-w-md animate-fade-in">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary shadow-glow mb-4">
              <Zap className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold text-primary-foreground text-white">Energia Renovável</h1>
            <p className="text-primary-foreground/70 mt-2 text-white/70">Sistema de Gestão de Clientes</p>
          </div>

          <Card className="glass-card border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-display text-center">Bem-vindo(a)</CardTitle>
              <CardDescription className="text-center">Entre com suas credenciais para acessar</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="email" type="email" placeholder="seu@email.com" className="pl-10" value={email} onChange={(e) => setEmail(e.target.value)} required />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="password" type="password" placeholder="••••••" className="pl-10" value={password} onChange={(e) => setPassword(e.target.value)} required />
                  </div>
                </div>

                <Button type="submit" variant="hero" className="w-full h-12" disabled={isLoading}>
                  {isLoading ? "Autenticando..." : "Entrar no Painel"}
                  {!isLoading && <ShieldCheck className="ml-2 w-4 h-4" />}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="relative z-10 py-6 w-full text-center">
        <div className="flex flex-col items-center gap-1 text-white/80">
          <p className="font-medium text-xs">Credinowe Soluções Financeiras</p>
          <p className="text-[10px] opacity-70">© {currentYear} • Todos os direitos reservados</p>
        </div>
      </footer>
    </div>
  );
};

export default Login;