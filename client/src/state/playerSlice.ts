import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type Player = {
  id: string;
  name: string;
  score: number;
  isSelected: boolean;
};

export type PlayerState = {
  players: Player[];
};

const initialState: PlayerState = {
  players: [],
};

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    addPlayer: (state, action: PayloadAction<Player>) => {
      state.players.push(action.payload);
    },
    deletePlayer: (state, action: PayloadAction<string>) => {
      state.players = state.players.filter((p) => p.id !== action.payload);
    },
    addScore: (state, action: PayloadAction<{ playerId: string; points: number }>) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player) player.score += action.payload.points;
    },
    subtractScore: (state, action: PayloadAction<{ playerId: string; points: number }>) => {
      const player = state.players.find((p) => p.id === action.payload.playerId);
      if (player) player.score -= action.payload.points;
    },
    resetScores: (state) => {
      state.players.forEach((p) => (p.score = 0));
    },
    selectPlayer: (state, action: PayloadAction<string>) => {
      state.players.forEach((p) => (p.isSelected = p.id === action.payload));
    },
    selectNextPlayer: (state) => {
      if (state.players.length === 0) return;
      const currentIndex = state.players.findIndex((p) => p.isSelected);
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % state.players.length;
      state.players.forEach((p, index) => (p.isSelected = index === nextIndex));
    },
    syncPlayers: (
      state,
      action: PayloadAction<Array<{ id: string; name: string; score: number }>>,
    ) => {
      state.players = action.payload.map((p) => ({
        id: p.id,
        name: p.name,
        score: p.score,
        isSelected: state.players.find((ep) => ep.id === p.id)?.isSelected ?? false,
      }));
    },
  },
});

export const {
  addPlayer,
  deletePlayer,
  addScore,
  subtractScore,
  resetScores,
  selectPlayer,
  selectNextPlayer,
  syncPlayers,
} = playerSlice.actions;

export default playerSlice.reducer;
