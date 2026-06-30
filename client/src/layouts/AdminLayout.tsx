import { useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import JeopardyTable from '../components/jeopardy-table/JeopardyTable';
import PlayerManagementForm from '../components/player-management-form/PlayerManagementForm';
import type { QuestionDialogData } from '../components/question-dialog/QuestionDialog';
import { useWebSocket } from '../lib/websocket/useWebSocket';
import {
  OPEN_QUESTION_EVENT,
  CLOSE_QUESTION_EVENT,
  REVEAL_ANSWER_EVENT,
  MARK_AUCTIONED_EVENT,
  PLAYERS_UPDATE_EVENT,
  UPDATE_QUESTION_EVENT,
  SYNC_CATEGORIES_EVENT,
  type RevealAnswerPayload,
  type MarkAuctionedPayload,
  type PlayersUpdatePayload,
  type UpdateQuestionPayload,
} from '../lib/websocket/messages';
import { useBootstrap } from '../hooks/useBootstrap';
import { useGameActions } from '../hooks/useGameActions';
import { logout } from '../services/auth';
import { useAppSelector } from '../state/hooks';
import { selectPlayers, selectCategories } from '../state/selectors';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080';

export default function AdminLayout() {
  const navigate = useNavigate();
  const players = useAppSelector(selectPlayers);
  const categories = useAppSelector(selectCategories);
  const { send, status } = useWebSocket({ url: WS_URL, role: 'admin' });
  const bootstrap = useBootstrap(true);
  const actions = useGameActions();

  useEffect(() => {
    if (bootstrap.status === 'unauthorized') {
      logout();
      navigate('/login', { replace: true });
    }
  }, [bootstrap.status, navigate]);

  useEffect(() => {
    if (status !== 'open') return;
    send(SYNC_CATEGORIES_EVENT, categories);
  }, [categories, status, send]);

  useEffect(() => {
    if (status !== 'open') return;
    const payload: PlayersUpdatePayload = players.map(({ id, name, score }) => ({
      id,
      name,
      score,
    }));
    send(PLAYERS_UPDATE_EVENT, payload);
  }, [players, status, send]);

  const handleQuestionOpen = useCallback(
    (question: QuestionDialogData) => {
      send(OPEN_QUESTION_EVENT, question);
    },
    [send],
  );

  const handleQuestionClose = useCallback(() => {
    send(CLOSE_QUESTION_EVENT, null);
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

  const handleQuestionLiveEdit = useCallback(
    (data: QuestionDialogData) => {
      send<UpdateQuestionPayload>(UPDATE_QUESTION_EVENT, data);
    },
    [send],
  );

  if (bootstrap.status === 'loading' || bootstrap.status === 'idle') {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (bootstrap.status === 'error') {
    return (
      <Box sx={{ p: 4 }}>
        <Alert severity="error">Failed to load game state: {bootstrap.error}</Alert>
      </Box>
    );
  }

  return (
    <section style={{ padding: 16 }}>
      <JeopardyTable
        actions={actions}
        isAdmin={true}
        onQuestionOpen={handleQuestionOpen}
        onQuestionClose={handleQuestionClose}
        onAnswerReveal={handleAnswerReveal}
        onMarkAuctioned={handleMarkAuctioned}
        onQuestionLiveEdit={handleQuestionLiveEdit}
      />
      <PlayerManagementForm actions={actions} />
      <Box
        sx={{
          mt: 4,
          pt: 2,
          borderTop: '1px dashed',
          borderColor: 'divider',
          display: 'flex',
          gap: 1,
        }}
      >
        <Button
          variant="outlined"
          color="warning"
          size="small"
          onClick={() => {
            void actions.resetScores();
          }}
        >
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
    </section>
  );
}
