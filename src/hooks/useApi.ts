import { useCallback, useMemo } from 'react';

const API_URL = "https://energiarenovavel.credinowe.com.br/api";

export const useApi = () => {
  const fetchApi = useCallback(async (endpoint: string, options?: RequestInit) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${cleanEndpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        mode: 'cors',
        headers: { 
          'Content-Type': 'application/json', 
          ...options?.headers 
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || data.message || 'Erro na requisição');
      }
      return data;
    } catch (error) {
      console.error("Erro na API:", error);
      throw error; 
    }
  }, []);

  // OTIMIZAÇÃO: useMemo impede que este objeto seja recriado a cada renderização
  // Isso PARA o loop infinito no Dashboard e Relatórios
  const apiMethods = useMemo(() => ({
    get: (endpoint: string) => fetchApi(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: any) => fetchApi(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(body) 
    }),
    put: (endpoint: string, body: any) => fetchApi(endpoint, { 
      method: 'PUT', 
      body: JSON.stringify(body) 
    }),
    delete: (endpoint: string) => fetchApi(endpoint, { method: 'DELETE' }),
  }), [fetchApi]);

  return apiMethods;
};