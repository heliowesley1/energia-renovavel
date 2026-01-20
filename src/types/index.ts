export interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user' | 'supervisor'; // Added 'supervisor'
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

export interface Client {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  imageUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  observations?: string;
  sectorId: string;
  userId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  isAuthenticated: boolean;
}