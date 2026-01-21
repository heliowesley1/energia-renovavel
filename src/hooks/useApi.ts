// src/hooks/useApi.ts
const API_URL = "http://localhost/energia_renovavel/api"; // URL base do backend

export const useApi = () => {
  const fetchApi = async (endpoint: string, options?: RequestInit) => {
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
    const url = `${API_URL}${cleanEndpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        headers: { 
          'Content-Type': 'application/json', 
          ...options?.headers 
        },
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Erro na requisição');
      }
      
      // Garante que retorne um array se a resposta for nula para evitar erros no frontend
      return data || [];
    } catch (error) {
      console.error("Erro na API:", error);
      return []; // Retorna array vazio em caso de falha
    }
  };

  return {
    get: (endpoint: string) => fetchApi(endpoint, { method: 'GET' }),
    post: (endpoint: string, body: any) => fetchApi(endpoint, { 
      method: 'POST', 
      body: JSON.stringify(body) 
    }),
  };
};