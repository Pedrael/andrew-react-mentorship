import { getAccessToken, removeAccessToken } from './authStorage';
export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
export type ApiError = {
  success: false;
  status: number;
  message: string;
};
type ApiRequestOptions = {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  skipAuth?: boolean;
};
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';
function buildUrl(path: string): string {
  const normalizedBase = API_BASE_URL.replace(/\/$/, '');
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}
export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };
  if (!options.skipAuth && token) {
    headers.Authorization = `Bearer ${token}`;
  }
  const response = await fetch(buildUrl(path), {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (response.status === 401) {
    removeAccessToken();
    throw {
      success: false,
      status: 401,
      message: 'Unauthorized',
    } satisfies ApiError;
  }
  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;
    try {
      const errorBody = (await response.json()) as { message?: string };
      if (errorBody.message) {
        message = errorBody.message;
      }
    } catch {
      // Response was not JSON.
    }
    throw {
      success: false,
      status: response.status,
      message,
    } satisfies ApiError;
  }
  if (response.status === 204) {
    return undefined as T;
  }
  return response.json() as Promise<T>;
}
