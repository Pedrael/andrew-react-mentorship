import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import GameHeader from '../components/game-header/GameHeader';
import JeopardyTable from '../components/jeopardy-table/JeopardyTable';
import PlayerManagementForm from '../components/player-management-form/PlayerManagementForm';
import QuestionDialogContainer from '../components/question-dialog/QuestionDialogContainer';
import type { QuestionDialogData } from '../components/question-dialog/types';
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
  type RevealAnswerPayload,
  type MarkAuctionedPayload,
  type AuctionUpdateMessage,
  type PlayersUpdatePayload,
  type UpdateQuestionPayload,
} from '../lib/websocket/messages';
import type { ServerMessage } from '../lib/websocket/messages';
import { logout } from '../services/authStorage';
import { useGetCategoriesQuery } from '../state/categories/categories.api';
import { selectCategories } from '../state/categories/categories.selectors';
import { useGetPlayersQuery, usePatchPlayerMutation } from '../state/players/players.api';
import { selectPlayers, selectPlayersData } from '../state/players/players.selectors';
import { selectAuctionState } from '../state/game/gameUi.selectors';
import { useAppSelector } from '../state/hooks';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080';

function isUnauthorized(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'status' in error &&
    (error as FetchBaseQueryError).status === 401
  );
}

export default function AdminLayout() {
  const navigate = useNavigate();
  const players = useAppSelector(selectPlayers);
  const playersData = useAppSelector(selectPlayersData);
  const categories = useAppSelector(selectCategories);
  const auctionState = useAppSelector(selectAuctionState);
  const resendStateRef = useRef<() => void>(() => {});

  const [openedQuestion, setOpenedQuestion] = useState<QuestionDialogData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const dialogCloseTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleServerMessage = useCallback((msg: ServerMessage) => {
    if (msg.type === 'system' && msg.event === 'peer_joined' && msg.role === 'player') {
      resendStateRef.current();
    }
  }, []);
  const { send, status } = useWebSocket({
    url: WS_URL,
    role: 'admin',
    onMessage: handleServerMessage,
  });
  const {
    isLoading: playersLoading,
    isUninitialized: playersUninitialized,
    error: playersError,
  } = useGetPlayersQuery();
  const {
    isLoading: categoriesLoading,
    isUninitialized: categoriesUninitialized,
    error: categoriesError,
  } = useGetCategoriesQuery();
  const [patchPlayer] = usePatchPlayerMutation();

  const isLoading =
    playersLoading || categoriesLoading || playersUninitialized || categoriesUninitialized;
  const loadError = playersError ?? categoriesError;

  useEffect(() => {
    if (isUnauthorized(playersError) || isUnauthorized(categoriesError)) {
      logout();
      navigate('/login', { replace: true });
    }
  }, [playersError, categoriesError, navigate]);

  useEffect(() => {
    resendStateRef.current = () => {
      send(SYNC_CATEGORIES_EVENT, categories);
      send(
        PLAYERS_UPDATE_EVENT,
        players.map(({ id, name, score }) => ({ id, name, score })),
      );
      send<AuctionUpdateMessage>(AUCTION_UPDATE_EVENT, auctionState);
    };
  }, [auctionState, categories, players, send]);

  useEffect(() => {
    if (status !== 'open') return;
    send(SYNC_CATEGORIES_EVENT, categories);
  }, [categories, status, send]);

  useEffect(() => {
    if (status !== 'open') return;
    const payload: PlayersUpdatePayload = {
      players: players.map(({ id, name, score }) => ({ id, name, score })),
      selectedPlayerId: players.find((p) => p.isSelected)?.id ?? null,
    };
    send(PLAYERS_UPDATE_EVENT, payload);
  }, [players, status, send]);

  useEffect(() => {
    return () => {
      if (dialogCloseTimeoutRef.current) {
        clearTimeout(dialogCloseTimeoutRef.current);
      }
    };
  }, []);

  const handleQuestionOpen = useCallback(
    (question: QuestionDialogData) => {
      if (dialogCloseTimeoutRef.current) {
        clearTimeout(dialogCloseTimeoutRef.current);
        dialogCloseTimeoutRef.current = null;
      }
      setOpenedQuestion(question);
      setIsDialogOpen(true);
      send(OPEN_QUESTION_EVENT, question);
    },
    [send],
  );

  const handleQuestionClose = useCallback(() => {
    send(CLOSE_QUESTION_EVENT, null);
    setIsDialogOpen(false);

    if (dialogCloseTimeoutRef.current) {
      clearTimeout(dialogCloseTimeoutRef.current);
    }
    // Keep the question mounted briefly so the dialog can animate out.
    dialogCloseTimeoutRef.current = setTimeout(() => {
      setOpenedQuestion(null);
      dialogCloseTimeoutRef.current = null;
    }, 100);
  }, [send]);

  const handleAnswerReveal = useCallback(
    (questionKey: string, outcome: 'correct' | 'failed') => {
      send<RevealAnswerPayload>(REVEAL_ANSWER_EVENT, { questionKey, outcome });
    },
    [send],
  );

  const handleMarkAuctioned = useCallback(
    (questionKey: string) => {
      send<MarkAuctionedPayload>(MARK_AUCTIONED_EVENT, { questionKey });
    },
    [send],
  );

  const handleAuctionUpdate = useCallback(
    (auction: AuctionUpdateMessage) => {
      send<AuctionUpdateMessage>(AUCTION_UPDATE_EVENT, auction);
    },
    [send],
  );

  const handleQuestionLiveEdit = useCallback(
    (data: QuestionDialogData) => {
      send<UpdateQuestionPayload>(UPDATE_QUESTION_EVENT, data);
    },
    [send],
  );

  const handleResetScores = async () => {
    await Promise.all(
      playersData.map((player) => patchPlayer({ id: player.id, payload: { score: 0 } })),
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (loadError && !isUnauthorized(loadError)) {
    const message =
      typeof loadError === 'object' &&
      loadError !== null &&
      'data' in loadError &&
      typeof (loadError as FetchBaseQueryError).data === 'object' &&
      (loadError as FetchBaseQueryError).data !== null &&
      'message' in ((loadError as FetchBaseQueryError).data as object)
        ? String(((loadError as FetchBaseQueryError).data as { message?: string }).message)
        : 'Failed to load game state';

    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Failed to load game state: {message}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <GameHeader status="Host view" />
      <Box sx={{ display: 'flex', gap: 2.5, alignItems: 'flex-start', p: 2.5, flex: 1 }}>
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <JeopardyTable isAdmin={true} onQuestionOpen={handleQuestionOpen} />
        </Box>
        <Box
          sx={{
            width: 'clamp(240px, 22vw, 320px)',
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
          }}
        >
          <PlayerManagementForm />
          <Box
            sx={{
              pt: 2,
              borderTop: '1px solid',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 1,
            }}
          >
            <Button color="error" size="small" onClick={() => void handleResetScores()}>
              Reset scores
            </Button>
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                logout();
                navigate('/login', { replace: true });
              }}
            >
              Sign out
            </Button>
          </Box>
        </Box>
      </Box>
      <QuestionDialogContainer
        question={openedQuestion}
        isAdmin
        isOpen={isDialogOpen}
        onClose={handleQuestionClose}
        onAnswerReveal={handleAnswerReveal}
        onMarkAuctioned={handleMarkAuctioned}
        onAuctionUpdate={handleAuctionUpdate}
        onLiveEdit={handleQuestionLiveEdit}
        disableBackdropClose
      />
    </Box>
  );
}
