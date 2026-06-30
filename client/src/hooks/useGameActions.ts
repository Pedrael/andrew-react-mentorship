import { useCallback, useMemo } from 'react';
import { ApiService } from '../services/endpoints';
import { buildQuestionKey } from '../state/questionSlice';
import { useAppDispatch, useAppSelector } from '../state/hooks';
import { selectPlayers, selectCategories } from '../state/selectors';
import {
  addPlayer as addPlayerAction,
  deletePlayer as deletePlayerAction,
  addScore as addScoreAction,
  subtractScore as subtractScoreAction,
  resetScores as resetScoresAction,
  type Player,
} from '../state/playerSlice';
import {
  updateCategoryTitle as updateCategoryTitleAction,
  updateQuestion as updateQuestionAction,
  syncCategories,
  markQuestionAnswered as markQuestionAnsweredAction,
  markQuestionFailed as markQuestionFailedAction,
} from '../state/questionSlice';

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
  markQuestionFailed: (categoryTitle: string, price: number) => Promise<void>;
};

export function useGameActions(): GameActions {
  const dispatch = useAppDispatch();
  const players = useAppSelector(selectPlayers);
  const categories = useAppSelector(selectCategories);

  const findCategoryIndex = useCallback(
    (categoryTitle: string) => categories.findIndex((cat) => cat.title === categoryTitle),
    [categories],
  );

  const patchScore = useCallback(
    async (playerId: string, delta: number) => {
      const current = players.find((p) => p.id === playerId);
      if (!current) return;
      const nextScore = current.score + delta;
      await ApiService.patchPlayer(playerId, { score: nextScore });
      if (delta >= 0) {
        dispatch(addScoreAction({ playerId, points: delta }));
      } else {
        dispatch(subtractScoreAction({ playerId, points: -delta }));
      }
    },
    [players, dispatch],
  );

  return useMemo<GameActions>(
    () => ({
      addPlayer: async (name) => {
        const trimmed = name.trim();
        if (!trimmed) return null;
        const created = await ApiService.createPlayer({ name: trimmed });
        dispatch(addPlayerAction(created));
        return created;
      },

      deletePlayer: async (playerId) => {
        await ApiService.deletePlayer(playerId);
        dispatch(deletePlayerAction(playerId));
      },

      addScore: (playerId, points) => patchScore(playerId, points),

      subtractScore: (playerId, points) => patchScore(playerId, -points),

      resetScores: async () => {
        await Promise.all(players.map((p) => ApiService.patchPlayer(p.id, { score: 0 })));
        dispatch(resetScoresAction());
      },

      addCategory: async () => {
        await ApiService.createCategory();
        const cats = await ApiService.getCategories();
        dispatch(syncCategories(cats));
      },

      updateCategoryTitle: async (index, newTitle) => {
        await ApiService.patchCategory(index, { title: newTitle });
        dispatch(updateCategoryTitleAction({ index, newTitle }));
      },

      updateQuestion: async (categoryIndex, price, data) => {
        await ApiService.patchCategoryQuestion(categoryIndex, price, {
          question: data.question,
          answer: data.answer,
          image: data.image ?? null,
        });
        dispatch(updateQuestionAction({ categoryIndex, price, data }));
      },

      markQuestionAnswered: async (categoryTitle, price) => {
        const categoryIndex = findCategoryIndex(categoryTitle);
        if (categoryIndex === -1) return;
        await ApiService.patchCategoryQuestion(categoryIndex, price, {
          isAnswered: true,
          answeredCorrectly: true,
        });
        dispatch(markQuestionAnsweredAction(buildQuestionKey(categoryTitle, price)));
      },

      markQuestionFailed: async (categoryTitle, price) => {
        const categoryIndex = findCategoryIndex(categoryTitle);
        if (categoryIndex === -1) return;
        await ApiService.patchCategoryQuestion(categoryIndex, price, {
          isAnswered: true,
          answeredCorrectly: false,
        });
        dispatch(markQuestionFailedAction(buildQuestionKey(categoryTitle, price)));
      },
    }),
    [dispatch, patchScore, players, findCategoryIndex],
  );
}
