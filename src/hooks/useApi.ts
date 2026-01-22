const API_URL = "https://energiarenovavel.credinowe.com.br/api";

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
        // Propaga o erro para o catch do componente que chamou a API
        throw new Error(data.error || data.message || 'Erro na requisição');
      }
      return data;
    } catch (error) {
      console.error("Erro na API:", error);
      // Lança o erro novamente para ser capturado pelo try-catch do componente
      throw error; 
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