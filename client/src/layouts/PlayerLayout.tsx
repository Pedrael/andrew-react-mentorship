import { useCallback, useState } from 'react';
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
import { useGame } from '../hooks/useGame';
import type { Category } from '../context/GameContext';
import PlayerScoreboard from '../components/player-scoreboard/PlayerScoreboard';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080';

export default function PlayerLayout() {
  const { markQuestionAnswered, markQuestionAuctioned, syncPlayers, syncCategories } = useGame();
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
        markQuestionAnswered(questionKey);
        setShowAnswer(true);
      } else if (event === UPDATE_QUESTION_EVENT) {
        setOpenedQuestion(payload as UpdateQuestionPayload);
      } else if (event === SYNC_CATEGORIES_EVENT) {
        syncCategories(payload as Category[]);
      } else if (event === MARK_AUCTIONED_EVENT) {
        const { questionKey } = payload as MarkAuctionedPayload;
        markQuestionAuctioned(questionKey);
      } else if (event === PLAYERS_UPDATE_EVENT) {
        syncPlayers(payload as PlayersUpdatePayload);
      }
    },
    [closeDialog, markQuestionAnswered, markQuestionAuctioned, syncPlayers, syncCategories],
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
