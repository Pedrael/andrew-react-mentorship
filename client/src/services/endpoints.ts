import { apiRequest, type HttpMethod } from './apiClient';
import type { Player } from '../state/PlayerReducer';
import type { Category, Question } from '../state/QuestionReducer';

const apiServiceRequest = async <T>(
  endpoint: string,
  method: HttpMethod,
  body?: Record<string, unknown> | null,
): Promise<T> => {
  return apiRequest<T>(endpoint, {
    method,
    body: body ?? undefined,
  });
};

export type CreatePlayerPayload = {
  name: string;
  score?: number;
  isSelected?: boolean;
  id?: string;
};

export type ReplacePlayerPayload = Player;

export type PatchPlayerPayload = Partial<Pick<Player, 'name' | 'score' | 'isSelected'>>;

export type CreateCategoryPayload = {
  title?: string;
  questions?: Question[];
};

export type PatchCategoryPayload = Partial<Pick<Category, 'title' | 'questions'>>;

export type PatchQuestionPayload = {
  question?: string;
  answer?: string;
  image?: string | null;
  isAnswered?: boolean;
};

export type HealthResponse = {
  ok: boolean;
};

export const ApiService = {
  // Health
  getHealth: () => apiServiceRequest<HealthResponse>('/api/health', 'GET'),

  // Players
  getPlayers: () => apiServiceRequest<Player[]>('/api/players', 'GET'),

  getPlayer: (id: string) => apiServiceRequest<Player>(`/api/players/${id}`, 'GET'),

  createPlayer: (payload: CreatePlayerPayload) =>
    apiServiceRequest<Player>('/api/players', 'POST', payload),

  replacePlayer: (id: string, payload: ReplacePlayerPayload) =>
    apiServiceRequest<Player>(`/api/players/${id}`, 'PUT', { ...payload, id }),

  patchPlayer: (id: string, payload: PatchPlayerPayload) =>
    apiServiceRequest<Player>(`/api/players/${id}`, 'PATCH', payload),

  deletePlayer: (id: string) => apiServiceRequest<void>(`/api/players/${id}`, 'DELETE'),

  // Categories
  getCategories: () => apiServiceRequest<Category[]>('/api/categories', 'GET'),

  getCategory: (index: number) =>
    apiServiceRequest<Category>(`/api/categories/${index}`, 'GET'),

  createCategory: (payload?: CreateCategoryPayload) =>
    apiServiceRequest<Category>('/api/categories', 'POST', payload ?? null),

  replaceCategory: (index: number, payload: Category) =>
    apiServiceRequest<Category>(`/api/categories/${index}`, 'PUT', payload),

  patchCategory: (index: number, payload: PatchCategoryPayload) =>
    apiServiceRequest<Category>(`/api/categories/${index}`, 'PATCH', payload),

  deleteCategory: (index: number) =>
    apiServiceRequest<Category>(`/api/categories/${index}`, 'DELETE'),

  patchCategoryQuestion: (index: number, price: number, payload: PatchQuestionPayload) =>
    apiServiceRequest<Question>(
      `/api/categories/${index}/questions/${price}`,
      'PATCH',
      payload,
    ),
};
