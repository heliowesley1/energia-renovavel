import { User, Sector, Client } from '@/types';

export const mockSectors: Sector[] = [
  { id: '1', name: 'Região Norte', description: 'Clientes da região norte', createdAt: new Date('2024-01-01') },
  { id: '2', name: 'Região Sul', description: 'Clientes da região sul', createdAt: new Date('2024-01-15') },
  { id: '3', name: 'Região Leste', description: 'Clientes da região leste', createdAt: new Date('2024-02-01') },
];

export const mockUsers: User[] = [
  { id: '1', name: 'Admin Master', email: 'admin@energia.com', role: 'admin' },
  { id: '2', name: 'João Silva', email: 'joao@energia.com', role: 'user', sectorId: '1' },
  { id: '3', name: 'Maria Santos', email: 'maria@energia.com', role: 'user', sectorId: '2' },
  { id: '4', name: 'Pedro Costa', email: 'pedro@energia.com', role: 'user', sectorId: '3' },
];

export const mockClients: Client[] = [
  {
    id: '1',
    name: 'Carlos Oliveira',
    email: 'carlos@email.com',
    cpf: '123.456.789-00',
    phone: '(11) 99999-0001',
    status: 'approved',
    observations: 'Cliente interessado em painel solar residencial',
    sectorId: '1',
    userId: '2',
    createdAt: new Date('2024-01-10'),
    updatedAt: new Date('2024-01-15'),
  },
  {
    id: '2',
    name: 'Ana Paula Lima',
    email: 'ana@email.com',
    cpf: '987.654.321-00',
    phone: '(11) 99999-0002',
    status: 'pending',
    observations: 'Aguardando documentação',
    sectorId: '1',
    userId: '2',
    createdAt: new Date('2024-01-20'),
    updatedAt: new Date('2024-01-20'),
  },
  {
    id: '3',
    name: 'Roberto Ferreira',
    email: 'roberto@email.com',
    cpf: '456.789.123-00',
    phone: '(11) 99999-0003',
    status: 'rejected',
    observations: 'Documentação incompleta',
    sectorId: '2',
    userId: '3',
    createdAt: new Date('2024-02-01'),
    updatedAt: new Date('2024-02-05'),
  },
  {
    id: '4',
    name: 'Fernanda Souza',
    email: 'fernanda@email.com',
    cpf: '789.123.456-00',
    phone: '(11) 99999-0004',
    status: 'approved',
    observations: 'Instalação agendada para março',
    sectorId: '3',
    userId: '4',
    createdAt: new Date('2024-02-10'),
    updatedAt: new Date('2024-02-15'),
  },
];
