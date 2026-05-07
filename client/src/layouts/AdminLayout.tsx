import { useCallback, useEffect } from 'react';
import JeopardyTable from '../components/jeopardy-table/JeopardyTable';
import PlayerManagementForm from '../components/player-management-form/PlayerManagementForm';
import type { QuestionDialogData } from '../components/question-dialog/QuestionDialog';
import { useWebSocket } from '../lib/websocket/useWebSocket';
import {
  OPEN_QUESTION_EVENT,
  CLOSE_QUESTION_EVENT,
  REVEAL_ANSWER_EVENT,
  PLAYERS_UPDATE_EVENT,
  type RevealAnswerPayload,
  type PlayersUpdatePayload,
} from '../lib/websocket/messages';
import { useGame } from '../hooks/useGame';

const WS_URL = import.meta.env.VITE_WS_URL ?? 'ws://localhost:8080';

export default function AdminLayout() {
  const { players } = useGame();
  const { send, status } = useWebSocket({ url: WS_URL, role: 'admin' });

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
    (questionKey: string) => {
      send<RevealAnswerPayload>(REVEAL_ANSWER_EVENT, { questionKey });
    },
    [send],
  );

  return (
    <section style={{ padding: 16 }}>
      <JeopardyTable
        isAdmin={true}
        onQuestionOpen={handleQuestionOpen}
        onQuestionClose={handleQuestionClose}
        onAnswerReveal={handleAnswerReveal}
      />
      <PlayerManagementForm />
    </section>
  );
}
