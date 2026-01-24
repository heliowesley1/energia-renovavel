import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import type { User, AuthContextType } from '@/types';
import { useApi } from '@/hooks/useApi';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { post } = useApi();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true); // Estado de carregamento para evitar redirecionamento precoce

  // Efeito para carregar o usuário do localStorage ao iniciar
  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Erro ao parsear usuário do storage", error);
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const result = await post('/login.php', { email, password });

      // Certifique-se de que a API retorna o campo 'user' e que ele contém o 'role'
      if (result && result.user) {
        const userData = result.user;
        setUser(userData);
        localStorage.setItem('user', JSON.stringify(userData));
        return true;
      }
      return false;
    } catch (error) {
      console.error("Erro no login:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  // Enquanto estiver carregando o localStorage, não renderiza as rotas protegidas
  if (loading) {
    return null; // Ou um componente de Spinner/Loading
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};