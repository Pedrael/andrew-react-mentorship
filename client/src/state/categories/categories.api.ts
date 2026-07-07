import { baseApi } from '../api/baseApi';
import type { Category, Question } from './categories.types';

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
  answeredCorrectly?: boolean;
};

export const categoriesApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    getCategories: build.query<Category[], void>({
      query: () => '/api/categories',
      providesTags: ['Categories'],
      // Player view has no active subscription (WebSocket-fed), so keep the
      // cache entry alive between live updates instead of garbage-collecting it.
      keepUnusedDataFor: Infinity,
    }),

    createCategory: build.mutation<Category, CreateCategoryPayload | void>({
      query: (body) => ({
        url: '/api/categories',
        method: 'POST',
        body: body ?? null,
      }),
      invalidatesTags: ['Categories'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          const { data } = await queryFulfilled;
          dispatch(
            categoriesApi.util.updateQueryData('getCategories', undefined, (draft) => {
              draft.push(data);
            }),
          );
        } catch {
          // invalidatesTags refetches on failure
        }
      },
    }),

    patchCategory: build.mutation<Category, { index: number; payload: PatchCategoryPayload }>({
      query: ({ index, payload }) => ({
        url: `/api/categories/${index}`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['Categories'],
      async onQueryStarted({ index, payload }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          categoriesApi.util.updateQueryData('getCategories', undefined, (draft) => {
            const category = draft[index];
            if (category) {
              Object.assign(category, payload);
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

    patchCategoryQuestion: build.mutation<
      Question,
      { index: number; price: number; payload: PatchQuestionPayload }
    >({
      query: ({ index, price, payload }) => ({
        url: `/api/categories/${index}/questions/${price}`,
        method: 'PATCH',
        body: payload,
      }),
      invalidatesTags: ['Categories'],
      async onQueryStarted({ index, price, payload }, { dispatch, queryFulfilled }) {
        const patchResult = dispatch(
          categoriesApi.util.updateQueryData('getCategories', undefined, (draft) => {
            const category = draft[index];
            if (!category) return;
            const questionIndex = category.questions.findIndex((question) => question.price === price);
            if (questionIndex === -1) {
              category.questions.push({
                price,
                question: payload.question ?? '',
                answer: payload.answer ?? '',
                image: payload.image ?? undefined,
                isAnswered: payload.isAnswered ?? false,
                answeredCorrectly: payload.answeredCorrectly,
              });
            } else {
              Object.assign(category.questions[questionIndex], payload);
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
  }),
});

export const {
  useGetCategoriesQuery,
  useCreateCategoryMutation,
  usePatchCategoryMutation,
  usePatchCategoryQuestionMutation,
} = categoriesApi;
