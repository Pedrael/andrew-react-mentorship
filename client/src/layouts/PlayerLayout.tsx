import { useCallback, useState, type Dispatch } from 'react';
import JeopardyTable from '../components/jeopardy-table/JeopardyTable';
import QuestionDialog from '../components/question-dialog/QuestionDialog';
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
  type OpenQuestionPayload,
  type RevealAnswerPayload,
  type MarkAuctionedPayload,
  type PlayersUpdatePayload,
  type UpdateQuestionPayload,
} from '../lib/websocket/messages';
import type { Category, GameAction, GameState } from '../state/RootReducer';
import PlayerScoreboard from '../components/player-scoreboard/PlayerScoreboard';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080';

type PlayerLayoutProps = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
};

export default function PlayerLayout({ state, dispatch }: PlayerLayoutProps) {
  const [openedQuestion, setOpenedQuestion] = useState<QuestionDialogData | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [showAnswer, setShowAnswer] = useState(false);

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
        const { questionKey } = payload as RevealAnswerPayload;
        dispatch({ type: 'markQuestionAnswered', payload: questionKey });
        setShowAnswer(true);
      } else if (event === UPDATE_QUESTION_EVENT) {
        setOpenedQuestion(payload as UpdateQuestionPayload);
      } else if (event === SYNC_CATEGORIES_EVENT) {
        dispatch({ type: 'syncCategories', payload: payload as Category[] });
      } else if (event === MARK_AUCTIONED_EVENT) {
        const { questionKey } = payload as MarkAuctionedPayload;
        dispatch({ type: 'markQuestionAuctioned', payload: questionKey });
      } else if (event === PLAYERS_UPDATE_EVENT) {
        dispatch({ type: 'syncPlayers', payload: payload as PlayersUpdatePayload });
      }
    },
    [closeDialog, dispatch],
  );

  useWebSocket({ url: WS_URL, role: 'player', onEvent: handleEvent });

  return (
    <section style={{ padding: 16 }}>
      <JeopardyTable state={state} dispatch={dispatch} isAdmin={false} />
      <PlayerScoreboard state={state} />
      <QuestionDialog
        state={state}
        dispatch={dispatch}
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
