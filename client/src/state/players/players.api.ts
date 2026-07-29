import { baseApi } from '../api/baseApi';
import type { Player } from './players.types';

export type CreatePlayerPayload = {
  name: string;
  score?: number;
  isSelected?: boolean;
  id?: string;
};

export type PatchPlayerPayload = Partial<Pick<Player, 'name' | 'score' | 'isSelected'>>;

export const playersApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getPlayers: build.query<Player[], void>({
      query: () => '/api/players',
      providesTags: ['Players'],
      // Player view has no active subscription (WebSocket-fed), so keep the
      // cache entry alive between live updates instead of garbage-collecting it.
      keepUnusedDataFor: Infinity,
    }),

    createPlayer: build.mutation<Player, CreatePlayerPayload>({
      query: (body) => ({
        url: '/api/players',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Players'],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        const tempId = `temp-${Date.now()}`;
        const patchResult = dispatch(
          playersApi.util.updateQueryData('getPlayers', undefined, (draft) => {
            draft.push({ id: tempId, name: arg.name.trim(), score: arg.score ?? 0 });
          }),
        );
        try {
          const { data } = await queryFulfilled;
          dispatch(
            playersApi.util.updateQueryData('getPlayers', undefined, (draft) => {
              const index = draft.findIndex((player) => player.id === tempId);
              if (index !== -1) {
                draft[index] = data;
              } else {
                draft.push(data);
              }
            }),
          );
        } catch {
          patchResult.undo();
        }
      },
    }),

    patchPlayer: build.mutation<Player, { id: string; payload: PatchPlayerPayload }>({
      query: ({ id, payload }) => ({
        url: `/api/players/${id}`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['Players'],
      async onQueryStarted({ id, payload }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          playersApi.util.updateQueryData('getPlayers', undefined, (draft) => {
            const player = draft.find((entry) => entry.id === id);
            if (player) {
              Object.assign(player, payload);
            }
          }),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),

    deletePlayer: build.mutation<void, string>({
      query: (id) => ({
        url: `/api/players/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Players'],
      async onQueryStarted(id, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          playersApi.util.updateQueryData('getPlayers', undefined, (draft) =>
            draft.filter((player) => player.id !== id),
          ),
        );
        try {
          await queryFulfilled;
        } catch {
          patchResult.undo();
        }
      },
    }),
  }),
});

export const {
  useGetPlayersQuery,
  useCreatePlayerMutation,
  usePatchPlayerMutation,
  useDeletePlayerMutation,
} = playersApi;
