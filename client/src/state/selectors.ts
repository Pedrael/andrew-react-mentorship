import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from './store';
import type { Player } from './playerSlice';

export const selectPlayers = (state: RootState) => state.player.players;
export const selectCategories = (state: RootState) => state.question.categories;
export const selectAnsweredKeys = (state: RootState) => state.question.answeredQuestionKeys;
export const selectFailedKeys = (state: RootState) => state.question.failedQuestionKeys;
export const selectAuctionedKeys = (state: RootState) => state.question.auctionedQuestionKeys;
export const selectRevealedQuestionKey = (state: RootState) =>
  state.question.revealedQuestionKey;

export const selectGameWinner = createSelector(
  [selectPlayers, selectCategories],
  (players, categories): Player | null => {
    if (categories.some((cat) => cat.questions.some((q) => !q.isAnswered))) {
      return null;
    }
    if (players.length === 0) return null;
    return players.reduce(
      (max, player) => (player.score > max.score ? player : max),
      players[0],
    );
  },
);
