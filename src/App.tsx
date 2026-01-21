import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import UserManagement from "./components/admin/UserManagement";
import SectorManagement from "./components/admin/SectorManagement";
import Reports from "./components/admin/Reports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Componente para proteger rotas privadas
const PrivateRoute = ({ children }: { children: React.ReactNode }) => {
  const { isAuthenticated } = useAuth();
  
  // Se o estado de autenticação ainda não foi carregado do localStorage, 
  // evitamos renderizar qualquer coisa para não causar redirecionamentos falsos.
  if (isAuthenticated === undefined) return null;

  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      {/* O 'basename' é a chave aqui. Ele diz ao React Router que todas 
          as rotas começam após /energia_renovavel/ 
      */}
      <BrowserRouter basename="/energia_renovavel">
        <AuthProvider>
          <Routes>
            {/* Rota raiz da subpasta */}
            <Route path="/" element={<Index />} />
            
            {/* Login */}
            <Route path="/login" element={<Login />} />
            
            {/* Rotas Protegidas */}
            <Route 
              path="/dashboard" 
              element={
                <PrivateRoute>
                  <Dashboard />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin/users" 
              element={
                <PrivateRoute>
                  <UserManagement />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin/sectors" 
              element={
                <PrivateRoute>
                  <SectorManagement />
                </PrivateRoute>
              } 
            />
            
            <Route 
              path="/admin/reports" 
              element={
                <PrivateRoute>
                  <Reports />
                </PrivateRoute>
              } 
            />

            {/* Rota 404 dentro do contexto da subpasta */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;