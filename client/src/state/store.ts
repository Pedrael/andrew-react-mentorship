import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import playerReducer from './playerSlice';
import questionReducer from './questionSlice';

enableMapSet();

export const store = configureStore({
  reducer: {
    player: playerReducer,
    question: questionReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: [
          'question.answeredQuestionKeys',
          'question.failedQuestionKeys',
          'question.auctionedQuestionKeys',
        ],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
