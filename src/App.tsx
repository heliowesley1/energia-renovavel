import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import { Toaster } from "@/components/ui/toaster";

// Componente de proteção de rota
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated, loading } = useAuth();

  // Se estiver carregando o estado do auth, pode retornar um feedback visual
  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => (
  <AuthProvider>
    {/* O basename deve ser "/" se estiver na raiz do domínio ou o nome da pasta 
      caso esteja em um subdiretório no Apache/XAMPP (ex: "/sistema")
    */}
    <BrowserRouter basename="/energia_renovavel/">
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        
        {/* Rota pai do Dashboard: 
          O asterisco (*) permite que o componente Dashboard gerencie 
          as sub-rotas internas (reports, clients, sectors, usinas, etc.)
        */}
        <Route 
          path="/dashboard/*" 
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } 
        />

        {/* Fallback para rotas não encontradas */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      
      {/* Componente global de notificações do sistema */}
      <Toaster />
    </BrowserRouter>
  </AuthProvider>
);

export default App;