export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'supervisor';
  sectorId?: string;
  password?: string;
  active: boolean;
}

export interface Sector {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

// Nova Interface para Usinas
export interface Usina {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
}

export interface Client {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  imageUrl?: string;
  imageUrl2?: string; // Anexo 2
  imageUrl3?: string; // Anexo 3
  // Status atualizados
  status: 'pending' | 'formalized' | 'waiting_formalization'; 
  observations?: string;
  sectorId: string;
  usinaId?: string; // Vínculo com Usina
  userId: string;
  createdAt: string; // Mudado para string para facilitar o parse das datas do PHP
  updatedAt: string;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
  loading: boolean;
}