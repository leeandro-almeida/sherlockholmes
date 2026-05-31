import axios, { type AxiosError } from 'axios';
import { session } from './session';

const baseURL = import.meta.env.VITE_API_URL ?? 'http://localhost:3333';

export const api = axios.create({ baseURL });

// Anexa automaticamente o token adequado a cada requisicao.
api.interceptors.request.use((config) => {
  const url = config.url ?? '';
  const isAdminRoute = url.includes('/admin') || url.includes('/auth/admin');
  const token = isAdminRoute ? session.getAdminToken() : session.getPlayerToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Extrai uma mensagem de erro legivel da resposta da API.
export function errorMessage(err: unknown): string {
  const axiosErr = err as AxiosError<{ error?: string }>;
  return axiosErr.response?.data?.error ?? axiosErr.message ?? 'Erro inesperado';
}
