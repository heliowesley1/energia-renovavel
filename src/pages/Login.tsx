import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Sun, Leaf, Mail, Lock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    setTimeout(() => {
      const success = login(email, password);
      if (success) {
        toast({
          title: 'Login realizado com sucesso!',
          description: 'Bem-vindo ao sistema de Energia Renovável.',
        });
        navigate('/dashboard');
      } else {
        toast({
          title: 'Erro no login',
          description: 'Email ou senha incorretos. Tente: admin@energia.com ou joao@energia.com (senha: 123456)',
          variant: 'destructive',
        });
      }
      setIsLoading(false);
    }, 800);
  };

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Floating icons */}
      <div className="absolute top-20 right-20 text-secondary/40 animate-float">
        <Sun size={64} />
      </div>
      <div className="absolute bottom-32 left-20 text-primary/30 animate-float" style={{ animationDelay: '2s' }}>
        <Leaf size={48} />
      </div>
      <div className="absolute top-1/3 left-16 text-secondary/30 animate-float" style={{ animationDelay: '1s' }}>
        <Zap size={40} />
      </div>

      <div className="w-full max-w-md relative z-10 animate-fade-in">
        {/* Logo section */}
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
              Bem-vindo de volta
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

            <div className="mt-6 p-4 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground text-center mb-2">
                <strong>Credenciais de teste:</strong>
              </p>
              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Admin:</strong> admin@energia.com</p>
                <p><strong>Usuário:</strong> joao@energia.com</p>
                <p><strong>Senha:</strong> 123456</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Login;
