import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export const buildQuestionKey = (categoryId: string, price: number) => `${categoryId}::${price}`;

export type AuctionState = {
  questionKey: string;
  selectorPlayerId: string;
  bids: Record<string, number>;
  wrongPlayerIds: string[];
};

export type GameUiState = {
  selectedPlayerId: string | null;
  answeredQuestionKeys: Set<string>;
  failedQuestionKeys: Set<string>;
  auctionedQuestionKeys: Set<string>;
  revealedQuestionKey: string | null;
  auction: AuctionState | null;
};

const initialState: GameUiState = {
  selectedPlayerId: null,
  answeredQuestionKeys: new Set<string>(),
  failedQuestionKeys: new Set<string>(),
  auctionedQuestionKeys: new Set<string>(),
  revealedQuestionKey: null,
  auction: null,
};

const gameUiSlice = createSlice({
  name: 'gameUi',
  initialState,
  reducers: {
    selectPlayer: (state, action: PayloadAction<string>) => {
      state.selectedPlayerId = action.payload;
    },
    selectNextPlayer: (state, action: PayloadAction<string[]>) => {
      const playerIds = action.payload;
      if (playerIds.length === 0) {
        state.selectedPlayerId = null;
        return;
      }
      const currentIndex = playerIds.indexOf(state.selectedPlayerId ?? '');
      const nextIndex = currentIndex === -1 ? 0 : (currentIndex + 1) % playerIds.length;
      state.selectedPlayerId = playerIds[nextIndex];
    },
    markQuestionAnswered: (state, action: PayloadAction<string>) => {
      const questionKey = action.payload;
      const alreadyAnswered = state.answeredQuestionKeys.has(questionKey);
      const wasAuctioned = state.auctionedQuestionKeys.has(questionKey);
      if (alreadyAnswered && !wasAuctioned) return;
      if (!alreadyAnswered) state.answeredQuestionKeys.add(questionKey);
      state.failedQuestionKeys.delete(questionKey);
      if (wasAuctioned) state.auctionedQuestionKeys.delete(questionKey);
      if (state.auction?.questionKey === questionKey) state.auction = null;
    },
    markQuestionFailed: (state, action: PayloadAction<string>) => {
      const questionKey = action.payload;
      if (state.failedQuestionKeys.has(questionKey)) return;
      state.failedQuestionKeys.add(questionKey);
      state.answeredQuestionKeys.delete(questionKey);
      state.auctionedQuestionKeys.delete(questionKey);
      if (state.auction?.questionKey === questionKey) state.auction = null;
    },
    markQuestionAuctioned: (state, action: PayloadAction<string>) => {
      const questionKey = action.payload;
      if (!state.auctionedQuestionKeys.has(questionKey)) {
        state.auctionedQuestionKeys.add(questionKey);
      }
    },
    revealQuestionAnswer: (state, action: PayloadAction<string>) => {
      state.revealedQuestionKey = action.payload;
    },
    clearRevealedQuestionAnswer: (state) => {
      state.revealedQuestionKey = null;
    },
    setAuctionState: (state, action: PayloadAction<AuctionState | null>) => {
      state.auction = action.payload;
    },
    clearAuctionState: (state) => {
      state.auction = null;
    },
    clearSelectedPlayerIfDeleted: (state, action: PayloadAction<string>) => {
      if (state.selectedPlayerId === action.payload) {
        state.selectedPlayerId = null;
      }
    },
  },
});

export const {
  selectPlayer,
  selectNextPlayer,
  markQuestionAnswered,
  markQuestionFailed,
  markQuestionAuctioned,
  revealQuestionAnswer,
  clearRevealedQuestionAnswer,
  clearSelectedPlayerIfDeleted,
  setAuctionState,
  clearAuctionState,
} = gameUiSlice.actions;

export default gameUiSlice.reducer;
