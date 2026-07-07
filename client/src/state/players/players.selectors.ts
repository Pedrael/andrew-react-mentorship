import { createSelector } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { playersApi } from './players.api';
import type { Player } from './players.types';

const selectPlayersResult = playersApi.endpoints.getPlayers.select();
const EMPTY_PLAYERS: Player[] = [];

export const selectPlayersData = createSelector(
  selectPlayersResult,
  (result) => result?.data ?? EMPTY_PLAYERS,
);

export const selectSelectedPlayerId = (state: RootState) => state.gameUi.selectedPlayerId;

export const selectPlayers = createSelector(
  [selectPlayersData, selectSelectedPlayerId],
  (players, selectedPlayerId): Player[] =>
    players.map((player) => ({
      ...player,
      isSelected: player.id === selectedPlayerId,
    })),
);

export const selectPlayerById = (playerId: string) =>
  createSelector(selectPlayers, (players) => players.find((player) => player.id === playerId));

export const selectSelectedPlayer = createSelector(selectPlayers, (players) =>
  players.find((player) => player.isSelected) ?? null,
);

export const selectPlayerIds = createSelector(selectPlayersData, (players) =>
  players.map((player) => player.id),
);
