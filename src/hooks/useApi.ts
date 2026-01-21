const API_URL = "http://localhost/energia_renovavel/api/";

export const apiFetch = async (endpoint: string, options?: RequestInit) => {
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  return response.json();
};