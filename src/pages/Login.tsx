/**
 * ARQUIVO: src/pages/Login.tsx
 * * ATUALIZAÇÕES:
 * 1. Posição do Formulário: Adicionada a classe `-mt-20` (margem negativa no topo) no container <main>.
 * Isso "puxa" o conteúdo para cima, tirando do centro exato e deixando mais alto conforme solicitado.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Sun, Leaf, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { mockUsers } from '@/data/mockData';

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

    setTimeout(() => {
      const success = login(email, password);
      if (success) {
        const user = mockUsers.find(u => u.email === email);
        const userName = user ? user.name : 'Usuário';

        toast({
          title: `Seja bem vindo(a) novamente, ${userName}`,
          description: "",
          duration: 3000,
        });
        
        navigate('/dashboard');
      } else {
        toast({
          title: 'Erro no login',
          description: 'Email ou senha incorretos.',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="h-screen gradient-hero flex flex-col relative overflow-hidden">
      
      {/* --- BACKGROUND DECORATIONS --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* --- ÍCONES FLUTUANTES --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-10 right-10 text-secondary/30 animate-float" style={{ animationDelay: '0s' }}>
          <Sun size={64} />
        </div>
        <div className="absolute top-20 left-10 text-primary/20 animate-float" style={{ animationDelay: '1.5s' }}>
          <Leaf size={52} />
        </div>
        <div className="absolute top-1/3 left-20 text-secondary/20 animate-float" style={{ animationDelay: '1s' }}>
          <Zap size={40} />
        </div>
        <div className="absolute top-1/2 right-24 text-primary/20 animate-float" style={{ animationDelay: '2.5s' }}>
          <Zap size={48} />
        </div>
        <div className="absolute bottom-32 left-32 text-primary/30 animate-float" style={{ animationDelay: '2s' }}>
          <Leaf size={48} />
        </div>
        <div className="absolute bottom-20 right-40 text-secondary/25 animate-float" style={{ animationDelay: '0.5s' }}>
          <Sun size={36} />
        </div>
        <div className="absolute top-12 left-1/2 ml-40 text-primary/15 animate-float" style={{ animationDelay: '3s' }}>
          <Zap size={24} />
        </div>
        <div className="absolute bottom-40 left-1/2 -ml-60 text-secondary/15 animate-float" style={{ animationDelay: '1.2s' }}>
          <Leaf size={32} />
        </div>
      </div>

      {/* --- ÁREA CENTRAL (FORMULÁRIO) --- */}
      {/* ADICIONADO: -mt-20 para subir visualmente o bloco inteiro */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 w-full relative z-10 -mt-20">
        <div className="w-full max-w-md animate-fade-in">
          
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary shadow-glow mb-4">
              <Zap className="w-10 h-10 text-primary-foreground" />
            </div>
            <h1 className="text-3xl font-display font-bold text-primary-foreground">
              Energia Renovável
            </h1>
            <p className="text-primary-foreground/70 mt-2">
              Sistema de Gestão de Clientes
            </p>
          </div>

          <Card className="glass-card border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-display text-center">
                Bem-vindo(a)
              </CardTitle>
              <CardDescription className="text-center">
                Entre com suas credenciais para acessar
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="seu@email.com"
                      className="pl-10"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Senha</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="••••••"
                      className="pl-10"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full"
                  size="lg"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Entrando...
                    </div>
                  ) : (
                    'Entrar'
                  )}
                </Button>
              </form>

            
            </CardContent>
          </Card>
        </div>
      </main>

      {/* --- FOOTER FLUTUANTE --- */}
      <footer className="relative z-10 py-6 w-full text-center">
        <div className="flex flex-col items-center justify-center gap-2">
          {/* Logo da Empresa */}
          <img 
            src="/logo.png" 
            alt="Credinowe Logo" 
            className="h-6 w-auto object-contain opacity-90 drop-shadow-sm" 
          />
          <div className="flex flex-col text-xs text-primary-foreground/80">
            <p className="font-medium tracking-wide">
              Credinowe Soluções Financeiras
            </p>
            <p className="opacity-70 mt-0.5">
              © {currentYear} • Todos os direitos reservados
            </p>
          </div>
        </div>
      </footer>

    </div>
  );
};

export default Login;