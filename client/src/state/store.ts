import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import { baseApi } from './api/baseApi';
import gameUiReducer from './game/gameUi.slice';
import './players/players.api';
import './categories/categories.api';

enableMapSet();

export const store = configureStore({
  reducer: {
    [baseApi.reducerPath]: baseApi.reducer,
    gameUi: gameUiReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredPaths: [
          'gameUi.answeredQuestionKeys',
          'gameUi.failedQuestionKeys',
          'gameUi.auctionedQuestionKeys',
        ],
      },
    }).concat(baseApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
