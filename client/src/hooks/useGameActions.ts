import { useCallback, useMemo, type Dispatch } from 'react';
import { ApiService } from '../services/endpoints';
import { buildQuestionKey } from '../state/QuestionReducer';
import type { GameAction, GameState, Player } from '../state/RootReducer';

type ScoreOp = (playerId: string, points: number) => Promise<void>;

export type GameActions = {
  addPlayer: (name: string) => Promise<Player | null>;
  deletePlayer: (playerId: string) => Promise<void>;
  addScore: ScoreOp;
  subtractScore: ScoreOp;
  resetScores: () => Promise<void>;
  addCategory: () => Promise<void>;
  updateCategoryTitle: (index: number, newTitle: string) => Promise<void>;
  updateQuestion: (
    categoryIndex: number,
    price: number,
    data: { question: string; answer: string; image?: string },
  ) => Promise<void>;
  markQuestionAnswered: (categoryTitle: string, price: number) => Promise<void>;
};

export function useGameActions(
  state: GameState,
  dispatch: Dispatch<GameAction>,
): GameActions {
  const findCategoryIndex = useCallback(
    (categoryTitle: string) =>
      state.categories.findIndex((cat) => cat.title === categoryTitle),
    [state.categories],
  );

  const patchScore = useCallback(
    async (playerId: string, delta: number) => {
      const current = state.players.find((p) => p.id === playerId);
      if (!current) return;
      const nextScore = current.score + delta;
      await ApiService.patchPlayer(playerId, { score: nextScore });
      const action: GameAction =
        delta >= 0
          ? { type: 'addScore', payload: { playerId, points: delta } }
          : { type: 'subtractScore', payload: { playerId, points: -delta } };
      dispatch(action);
    },
    [state.players, dispatch],
  );

  return useMemo<GameActions>(
    () => ({
      addPlayer: async (name) => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const created = await ApiService.createPlayer({ name: trimmed });
        dispatch({ type: 'addPlayer', payload: created });
        return created;
      },

      deletePlayer: async (playerId) => {
        await ApiService.deletePlayer(playerId);
        dispatch({ type: 'deletePlayer', payload: playerId });
      },

      addScore: (playerId, points) => patchScore(playerId, points),

      subtractScore: (playerId, points) => patchScore(playerId, -points),

      resetScores: async () => {
        await Promise.all(
          state.players.map((p) => ApiService.patchPlayer(p.id, { score: 0 })),
        );
        dispatch({ type: 'resetScores' });
      },

      addCategory: async () => {
        await ApiService.createCategory();
        const categories = await ApiService.getCategories();
        dispatch({ type: 'syncCategories', payload: categories });
      },

      updateCategoryTitle: async (index, newTitle) => {
        await ApiService.patchCategory(index, { title: newTitle });
        dispatch({
          type: 'updateCategoryTitle',
          payload: { index, newTitle },
        });
      },

      updateQuestion: async (categoryIndex, price, data) => {
        await ApiService.patchCategoryQuestion(categoryIndex, price, {
          question: data.question,
          answer: data.answer,
          image: data.image ?? null,
        });
        dispatch({
          type: 'updateQuestion',
          payload: { categoryIndex, price, data },
        });
      },

      markQuestionAnswered: async (categoryTitle, price) => {
        const categoryIndex = findCategoryIndex(categoryTitle);
        if (categoryIndex === -1) return;
        await ApiService.patchCategoryQuestion(categoryIndex, price, {
          isAnswered: true,
        });
        dispatch({
          type: 'markQuestionAnswered',
          payload: buildQuestionKey(categoryTitle, price),
        });
      },
    }),
    [dispatch, patchScore, state.players, findCategoryIndex],
  );
}
