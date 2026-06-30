import { apiRequest } from './apiClient';
import { removeAccessToken, saveAccessToken } from './authStorage';

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export async function login(username: string, password: string): Promise<TokenResponse> {
  const response = await apiRequest<TokenResponse>('/api/oauth/token', {
    method: 'POST',
    body: { grant_type: 'password', username, password },
    skipAuth: true,
  });
  saveAccessToken(response.access_token);
  return response;
}

export function logout(): void {
  removeAccessToken();
}
