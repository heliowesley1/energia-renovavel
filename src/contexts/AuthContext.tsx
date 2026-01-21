import React, { createContext, useContext, useState, ReactNode } from 'react';
import type { User, AuthContextType } from '@/types';
import { useApi } from '@/hooks/useApi'; // Importação corrigida para usar o hook

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { post } = useApi(); // Instancia a função post da API através do hook
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('user');
    return saved ? JSON.parse(saved) : null;
  });

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Substituído apiFetch pela função post do hook useApi
      const result = await post('/login.php', { email, password });

      if (result && result.user) {
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
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