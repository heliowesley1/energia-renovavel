import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Zap, Sun, Leaf, Mail, Lock, Cloud, Wind, BatteryCharging, Globe } from 'lucide-react';
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
      const success = await login(email, password);
      if (success) {
        const userData = JSON.parse(localStorage.getItem('user') || '{}');
        const userName = userData.name || 'Usuário';

        toast({
          title: `Seja bem vindo(a) novamente, ${userName}`,
          duration: 3000,
        });

        navigate('/dashboard');
      } else {
        toast({
          title: 'Erro no login',
          description: 'Email ou senha incorretos.',
          variant: 'destructive',
          className: "bg-white text-black border-none shadow-lg",
        });
      }
    } catch (error) {
      toast({
        title: 'Erro de Conexão',
        description: 'Não foi possível conectar ao servidor.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    // min-h-screen com flex-col para o footer sempre ir para o fim
    <div className="min-h-screen gradient-hero flex flex-col relative overflow-x-hidden">

      {/* --- BACKGROUND DECORATIONS --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-0 right-[-10%] w-[50%] h-[50%] bg-secondary/10 rounded-full blur-3xl animate-pulse-slow" />
      </div>

      {/* --- ÍCONES FLUTUANTES --- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden hidden sm:block">
  {/* Ícones originais com ajustes de delay */}
  <div className="absolute top-10 right-10 text-secondary/30 animate-float" style={{ animationDelay: '0s' }}>
    <Sun size={64} />
  </div>
  <div className="absolute top-20 left-10 text-primary/20 animate-float" style={{ animationDelay: '1.5s' }}>
    <Leaf size={52} />
  </div>
  <div className="absolute top-1/4 left-1/2 text-secondary/20 animate-float" style={{ animationDelay: '1s' }}>
    <Zap size={40} />
  </div>
  <div className="absolute bottom-1/4 right-20 text-primary/20 animate-float" style={{ animationDelay: '2.5s' }}>
    <Zap size={48} />
  </div>

  {/* Novos Ícones Adicionados */}
  <div className="absolute bottom-20 left-20 text-secondary/20 animate-float" style={{ animationDelay: '3s' }}>
    <Cloud size={56} />
  </div>
  <div className="absolute top-1/3 left-[15%] text-primary/15 animate-float" style={{ animationDelay: '0.5s' }}>
    <Wind size={44} />
  </div>
  <div className="absolute bottom-10 right-1/3 text-secondary/15 animate-float" style={{ animationDelay: '2s' }}>
    <BatteryCharging size={38} />
  </div>
  <div className="absolute top-[60%] right-[10%] text-primary/10 animate-float" style={{ animationDelay: '4s' }}>
    <Globe size={60} />
  </div>
</div>

      {/* --- ÁREA CENTRAL (flex-grow faz o main ocupar o espaço e empurrar o footer) --- */}
      <main className="flex-grow flex items-center justify-center p-6 relative z-10">
        <div className="w-full max-w-md animate-fade-in space-y-6 sm:space-y-8">

          <div className="text-center">
            <div className="inline-flex items-center justify-center w-10 h-10 sm:w-14 sm:h-14 rounded-lg gradient-primary shadow-glow mb-3">
              <Zap className="w-5 h-5 sm:w-7 sm:h-7 text-primary-foreground" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-primary-foreground">
              Energia Renovável
            </h1>
            {/* <p className="text-primary-foreground/70 text-sm sm:text-base mt-1">
              Sistema de Gestão de Clientes
            </p> */}
          </div>

          <Card className="glass-card border-0 shadow-2xl backdrop-blur-md">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-xl sm:text-2xl font-display text-center">
                Bem-vindo(a)
              </CardTitle>
              <CardDescription className="text-center text-xs sm:text-sm">
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
                      className="pl-10 h-11 focus-visible:ring-primary"
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
                      className="pl-10 h-11 focus-visible:ring-primary"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  variant="hero"
                  className="w-full h-11 sm:h-12 font-bold text-base shadow-lg"
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

      {/* --- FOOTER (Posicionamento fixo na base via flexbox) --- */}
      <footer className="relative z-10 py-4 sm:py-6 w-full text-center mt-auto px-4 bg-transparent">
        <div className="flex flex-col items-center justify-center gap-2">
          {/* Logo da Empresa */}
          <img 
            src="logoBranco.png" 
            alt="Credinowe Logo" 
            className="h-5 sm:h-6 w-auto object-contain opacity-90 drop-shadow-sm" 
          />
          <div className="flex flex-col text-[10px] sm:text-xs text-primary-foreground/80">
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