// useApi.ts
const API_URL = "http://localhost/energia_renovavel/api"; // Remova a barra do final

export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  // Garante que não haja barras duplas
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  const url = `${API_URL}${cleanEndpoint}`;
  
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Erro na requisição');
  return data;
};