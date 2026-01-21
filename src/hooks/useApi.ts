const API_URL = "http://localhost/energia_renovavel/api";

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
      return data;
    } catch (error) {
      console.error("Erro na API:", error);
      return null;
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