import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import Box from '@mui/material/Box';
import JeopardyTable from '../components/jeopardy-table/JeopardyTable';
import QuestionDialog from '../components/question-dialog/QuestionDialog';
import type { QuestionDialogData } from '../components/question-dialog/QuestionDialog';
import { logout } from '../services/authStorage';
import { useWebSocket } from '../lib/websocket/useWebSocket';
import {
  OPEN_QUESTION_EVENT,
  CLOSE_QUESTION_EVENT,
  REVEAL_ANSWER_EVENT,
  MARK_AUCTIONED_EVENT,
  AUCTION_UPDATE_EVENT,
  PLAYERS_UPDATE_EVENT,
  UPDATE_QUESTION_EVENT,
  SYNC_CATEGORIES_EVENT,
  type OpenQuestionPayload,
  type RevealAnswerPayload,
  type MarkAuctionedPayload,
  type AuctionUpdateMessage,
  type PlayersUpdatePayload,
} from '../lib/websocket/messages';
import PlayerScoreboard from '../components/player-scoreboard/PlayerScoreboard';
import { useAppDispatch } from '../state/hooks';
import { categoriesApi } from '../state/categories/categories.api';
import type { Category } from '../state/categories/categories.types';
import { useGetCategoriesQuery } from '../state/categories/categories.api';
import { playersApi, useGetPlayersQuery } from '../state/players/players.api';
import {
  markQuestionAnswered,
  markQuestionFailed,
  markQuestionAuctioned,
  setAuctionState,
  clearAuctionState,
} from '../state/game/gameUi.slice';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080';

function isUnauthorized(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as FetchBaseQueryError).status === 401
  );
}

export default function PlayerLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [openedQuestion, setOpenedQuestion] = useState<QuestionDialogData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  const { error: playersError } = useGetPlayersQuery(undefined, { skip: true });
  const { error: categoriesError } = useGetCategoriesQuery(undefined, { skip: true });

  useEffect(() => {
    if (isUnauthorized(playersError) || isUnauthorized(categoriesError)) {
      logout();
      navigate('/login', { replace: true });
    }
  }, [playersError, categoriesError, navigate]);

  const closeDialog = useCallback(() => {
    setIsDialogOpen(false);
    setShowAnswer(false);
  }, []);

  const handleEvent = useCallback(
    (event: string, payload: unknown) => {
      if (event === OPEN_QUESTION_EVENT) {
        setOpenedQuestion(payload as OpenQuestionPayload);
        setShowAnswer(false);
        setIsDialogOpen(true);
      } else if (event === CLOSE_QUESTION_EVENT) {
        closeDialog();
        dispatch(clearAuctionState());
      } else if (event === REVEAL_ANSWER_EVENT) {
        const { questionKey, outcome = 'correct' } = payload as RevealAnswerPayload;
        if (outcome === 'failed') {
          dispatch(markQuestionFailed(questionKey));
        } else {
          dispatch(markQuestionAnswered(questionKey));
        }
        setShowAnswer(true);
        dispatch(clearAuctionState());
      } else if (event === UPDATE_QUESTION_EVENT) {
        setOpenedQuestion(payload as QuestionDialogData);
      } else if (event === SYNC_CATEGORIES_EVENT) {
        dispatch(
          categoriesApi.util.upsertQueryData('getCategories', undefined, payload as Category[]),
        );
      } else if (event === MARK_AUCTIONED_EVENT) {
        const { questionKey } = payload as MarkAuctionedPayload;
        dispatch(markQuestionAuctioned(questionKey));
      } else if (event === AUCTION_UPDATE_EVENT) {
        const auction = payload as AuctionUpdateMessage;
        if (auction) {
          dispatch(setAuctionState(auction));
        } else {
          dispatch(clearAuctionState());
        }
      } else if (event === PLAYERS_UPDATE_EVENT) {
        const players = payload as PlayersUpdatePayload;
        dispatch(
          playersApi.util.upsertQueryData(
            'getPlayers',
            undefined,
            players.map(({ id, name, score }) => ({ id, name, score })),
          ),
        );
      }
    },
    [closeDialog, dispatch],
  );

  useWebSocket({ url: WS_URL, role: 'player', onEvent: handleEvent });

  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', p: 2 }}>
      <Box sx={{ flex: 1, minWidth: 0 }}>
        <JeopardyTable isAdmin={false} />
      </Box>
      <Box sx={{ width: 'fit-content', flexShrink: 0 }}>
        <PlayerScoreboard />
      </Box>
      <QuestionDialog
        question={openedQuestion}
        isAdmin={false}
        isOpen={isDialogOpen}
        onClose={closeDialog}
        showAnswer={showAnswer}
        disableBackdropClose
      />
    </Box>
  );
}
