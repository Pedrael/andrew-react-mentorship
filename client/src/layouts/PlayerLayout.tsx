import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JeopardyTable from '../components/jeopardy-table/JeopardyTable';
import QuestionDialog from '../components/question-dialog/QuestionDialog';
import type { QuestionDialogData } from '../components/question-dialog/QuestionDialog';
import { useBootstrap } from '../hooks/useBootstrap';
import { logout } from '../services/auth';
import { useWebSocket } from '../lib/websocket/useWebSocket';
import {
  OPEN_QUESTION_EVENT,
  CLOSE_QUESTION_EVENT,
  REVEAL_ANSWER_EVENT,
  MARK_AUCTIONED_EVENT,
  PLAYERS_UPDATE_EVENT,
  UPDATE_QUESTION_EVENT,
  SYNC_CATEGORIES_EVENT,
  type OpenQuestionPayload,
  type RevealAnswerPayload,
  type MarkAuctionedPayload,
  type PlayersUpdatePayload,
} from '../lib/websocket/messages';
import PlayerScoreboard from '../components/player-scoreboard/PlayerScoreboard';
import { useAppDispatch } from '../state/hooks';
import {
  markQuestionAnswered,
  markQuestionFailed,
  markQuestionAuctioned,
  syncCategories,
  type Category,
} from '../state/questionSlice';
import { syncPlayers } from '../state/playerSlice';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080';

export default function PlayerLayout() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const bootstrap = useBootstrap(true);
  const [openedQuestion, setOpenedQuestion] = useState<QuestionDialogData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

  useEffect(() => {
    if (bootstrap.status === 'unauthorized') {
      logout();
      navigate('/login', { replace: true });
    }
  }, [bootstrap.status, navigate]);

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
      } else if (event === REVEAL_ANSWER_EVENT) {
        const { questionKey, outcome = 'correct' } = payload as RevealAnswerPayload;
        if (outcome === 'failed') {
          dispatch(markQuestionFailed(questionKey));
        } else {
          dispatch(markQuestionAnswered(questionKey));
        }
        setShowAnswer(true);
      } else if (event === UPDATE_QUESTION_EVENT) {
        setOpenedQuestion(payload as QuestionDialogData);
      } else if (event === SYNC_CATEGORIES_EVENT) {
        dispatch(syncCategories(payload as Category[]));
      } else if (event === MARK_AUCTIONED_EVENT) {
        const { questionKey } = payload as MarkAuctionedPayload;
        dispatch(markQuestionAuctioned(questionKey));
      } else if (event === PLAYERS_UPDATE_EVENT) {
        dispatch(syncPlayers(payload as PlayersUpdatePayload));
      }
    },
    [closeDialog, dispatch],
  );

  useWebSocket({ url: WS_URL, role: 'player', onEvent: handleEvent });

  return (
    <section style={{ padding: 16 }}>
      <JeopardyTable isAdmin={false} />
      <PlayerScoreboard />
      <QuestionDialog
        question={openedQuestion}
        isAdmin={false}
        isOpen={isDialogOpen}
        onClose={closeDialog}
        showAnswer={showAnswer}
        disableBackdropClose
      />
    </section>
  );
}
