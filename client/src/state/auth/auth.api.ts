import { baseApi } from '../api/baseApi';
import { saveAccessToken } from '../../services/authStorage';

export type TokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

export type LoginCredentials = {
  username: string;
  password: string;
};

export const authApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    login: build.mutation<TokenResponse, LoginCredentials>({
      query: ({ username, password }) => ({
        url: '/api/oauth/token',
        method: 'POST',
        body: { grant_type: 'password', username, password },
      }),
      async onQueryStarted(_arg, { queryFulfilled }) {
        const { data } = await queryFulfilled;
        saveAccessToken(data.access_token);
      },
    }),
  }),
});

export const { useLoginMutation } = authApi;
