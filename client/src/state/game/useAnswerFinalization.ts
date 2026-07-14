import { useCallback, useState } from 'react';
import {
  clearRevealedQuestionAnswer,
  markQuestionAnswered,
  markQuestionFailed,
  revealQuestionAnswer,
  selectNextPlayer,
  setAuctionState,
} from './gameUi.slice';
import { selectRevealedQuestionKey } from './gameUi.selectors';
import { selectGameWinner } from './game.selectors';
import { useAppDispatch, useAppSelector } from '../hooks';
import { selectPlayerIds } from '../players/players.selectors';
import { usePatchPlayerMutation } from '../players/players.api';
import type { Player } from '../players/players.types';
import { usePatchCategoryQuestionMutation } from '../categories/categories.api';
import { selectCategories } from '../categories/categories.selectors';

type UseAnswerFinalizationArgs = {
  questionKey: string | null;
  categoryId: string | null;
  price: number | null;
  isAdmin: boolean;
  onAnswerReveal?: (questionKey: string, outcome: 'correct' | 'failed') => void;
  onAuctionUpdate?: (auction: null) => void;
};

export function useAnswerFinalization({
  questionKey,
  categoryId,
  price,
  isAdmin,
  onAnswerReveal,
  onAuctionUpdate,
}: UseAnswerFinalizationArgs) {
  const dispatch = useAppDispatch();
  const playerIds = useAppSelector(selectPlayerIds);
  const categories = useAppSelector(selectCategories);
  const revealedQuestionKey = useAppSelector(selectRevealedQuestionKey);
  const gameWinner = useAppSelector(selectGameWinner);
  const [patchPlayer] = usePatchPlayerMutation();
  const [patchCategoryQuestion] = usePatchCategoryQuestionMutation();

  const [winner, setWinner] = useState<Player | null>(null);

  const isRevealingAnswer = Boolean(questionKey && revealedQuestionKey === questionKey);

  const findCategoryIndex = useCallback(
    (id: string) => categories.findIndex((category) => category.id === id),
    [categories],
  );

  const finalize = useCallback(
    async (pointsWinner?: Player, points?: number) => {
      if (!questionKey || !categoryId || price === null) return;

      const outcome = pointsWinner && points && points > 0 ? 'correct' : 'failed';
      dispatch(revealQuestionAnswer(questionKey));
      const categoryIndex = findCategoryIndex(categoryId);

      if (outcome === 'correct') {
        if (isAdmin) {
          await patchPlayer({
            id: pointsWinner!.id,
            payload: { score: pointsWinner!.score + points! },
          });
          if (categoryIndex !== -1) {
            await patchCategoryQuestion({
              index: categoryIndex,
              price,
              payload: { isAnswered: true, answeredCorrectly: true },
            });
          }
        }
        dispatch(markQuestionAnswered(questionKey));
      } else if (isAdmin) {
        if (categoryIndex !== -1) {
          await patchCategoryQuestion({
            index: categoryIndex,
            price,
            payload: { isAnswered: true, answeredCorrectly: false },
          });
        }
        dispatch(markQuestionFailed(questionKey));
      } else {
        dispatch(markQuestionFailed(questionKey));
      }

      dispatch(selectNextPlayer(playerIds));
      onAnswerReveal?.(questionKey, outcome);
      setWinner(gameWinner);
      if (isAdmin) {
        dispatch(setAuctionState(null));
        onAuctionUpdate?.(null);
      }
    },
    [
      questionKey,
      categoryId,
      price,
      isAdmin,
      dispatch,
      findCategoryIndex,
      patchPlayer,
      patchCategoryQuestion,
      playerIds,
      onAnswerReveal,
      gameWinner,
      onAuctionUpdate,
    ],
  );

  const clearWinner = useCallback(() => setWinner(null), []);

  const clearReveal = useCallback(() => {
    dispatch(clearRevealedQuestionAnswer());
  }, [dispatch]);

  return {
    finalize,
    isRevealingAnswer,
    winner,
    clearWinner,
    clearReveal,
  };
}
