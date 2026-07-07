import { createSelector } from '@reduxjs/toolkit';
import { selectCategories } from '../categories/categories.selectors';
import { selectPlayersData } from '../players/players.selectors';
import type { Player } from '../players/players.types';

export const selectGameWinner = createSelector(
  [selectPlayersData, selectCategories],
  (players, categories): Player | null => {
    if (categories.some((category) => category.questions.some((question) => !question.isAnswered))) {
      return null;
    }
    if (players.length === 0) return null;
    return players.reduce(
      (max, player) => (player.score > max.score ? player : max),
      players[0],
    );
  },
);
