import type { RootState } from '../store';

export const selectAnsweredKeys = (state: RootState) => state.gameUi.answeredQuestionKeys;
export const selectFailedKeys = (state: RootState) => state.gameUi.failedQuestionKeys;
export const selectAuctionedKeys = (state: RootState) => state.gameUi.auctionedQuestionKeys;
export const selectRevealedQuestionKey = (state: RootState) => state.gameUi.revealedQuestionKey;
