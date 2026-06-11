import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import { useEffect, useMemo, useRef, useState, type Dispatch } from 'react';
import { buildQuestionKey } from '../../state/QuestionReducer';
import {
  selectWinnerIfGameEnded,
  type GameAction,
  type GameState,
  type Player,
} from '../../state/RootReducer';
import type { GameActions } from '../../hooks/useGameActions';

export type QuestionDialogData = {
  category: string;
  question: string;
  price: number;
  answer: string;
  image?: string;
};

type QuestionDialogProps = {
  state: GameState;
  dispatch: Dispatch<GameAction>;
  actions?: GameActions;
  question: QuestionDialogData | null;
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
  disableBackdropClose?: boolean;
  showAnswer?: boolean;
  onAnswerReveal?: (questionKey: string, outcome: 'correct' | 'failed') => void;
  onMarkAuctioned?: (questionKey: string) => void;
  onQuestionSave?: (data: { question: string; answer: string; image?: string }) => void;
  onLiveEdit?: (data: { question: string; answer: string; image?: string }) => void;
};

export default function QuestionDialog({
  state,
  dispatch,
  actions,
  question,
  isAdmin = false,
  isOpen,
  onClose,
  disableBackdropClose = false,
  showAnswer = false,
  onAnswerReveal,
  onMarkAuctioned,
  onQuestionSave,
  onLiveEdit,
}: QuestionDialogProps) {
  const { players, revealedQuestionKey } = state;
  const [winner, setWinner] = useState<Player | null>(null);
  const [auctionActive, setAuctionActive] = useState(false);
  const [selectorPlayerId, setSelectorPlayerId] = useState<string | null>(null);
  const [bids, setBids] = useState<Record<string, number>>({});
  const [auctionWrongIds, setAuctionWrongIds] = useState<Set<string>>(() => new Set());
  // Local editable state — initialised from props, saved to context on close
  const [editQuestion, setEditQuestion] = useState('');
  const [editAnswer, setEditAnswer] = useState('');
  const [editImage, setEditImage] = useState('');

  const selectedPlayer = players.find((p) => p.isSelected);
  const scoreDelta = question?.price ?? 0;
  const questionKey = question ? buildQuestionKey(question.category, question.price) : null;
  const isRevealingAnswer = Boolean(questionKey && revealedQuestionKey === questionKey);
  const previousQuestionKeyRef = useRef<string | null>(null);

  const selectorPlayer = selectorPlayerId
    ? players.find((p) => p.id === selectorPlayerId)
    : null;
  const auctionPlayers = selectorPlayerId
    ? players.filter((p) => p.id !== selectorPlayerId)
    : [];

  const activeBidders = useMemo(
    () =>
      auctionPlayers
        .filter((p) => (bids[p.id] ?? 0) > 0)
        .sort((a, b) => (bids[b.id] ?? 0) - (bids[a.id] ?? 0)),
    [auctionPlayers, bids],
  );

  const currentBidder =
    activeBidders.find((p) => !auctionWrongIds.has(p.id)) ?? null;

  const closeDialog = () => {
    if (isAdmin && onQuestionSave) {
      onQuestionSave({
        question: editQuestion,
        answer: editAnswer,
        image: editImage.trim() || undefined,
      });
    }
    dispatch({ type: 'clearRevealedQuestionAnswer' });
    onClose();
  };

  const handleClose = (_event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (disableBackdropClose && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }
    closeDialog();
  };

  const resetAuctionState = () => {
    setAuctionActive(false);
    setSelectorPlayerId(null);
    setBids({});
    setAuctionWrongIds(new Set());
  };

  const finalizeQuestionAnswered = async (pointsWinner?: Player, points?: number) => {
    if (!question || !questionKey) return;
    const outcome = pointsWinner && points && points > 0 ? 'correct' : 'failed';
    dispatch({ type: 'revealQuestionAnswer', payload: questionKey });
    if (outcome === 'correct') {
      if (actions) {
        await actions.addScore(pointsWinner!.id, points!);
        await actions.markQuestionAnswered(question.category, question.price);
      } else {
        dispatch({ type: 'addScore', payload: { playerId: pointsWinner!.id, points: points! } });
        dispatch({ type: 'markQuestionAnswered', payload: questionKey });
      }
    } else if (actions) {
      await actions.markQuestionFailed(question.category, question.price);
    } else {
      dispatch({ type: 'markQuestionFailed', payload: questionKey });
    }
    dispatch({ type: 'selectNextPlayer' });
    onAnswerReveal?.(questionKey, outcome);
    setWinner(selectWinnerIfGameEnded(state));
  };

  // Stage 1 — selected player answered correctly (full question value)
  const handleCorrectAnswerStage1 = () => {
    if (!selectedPlayer) return;
    void finalizeQuestionAnswered(selectedPlayer, scoreDelta);
  };

  // Stage 1 — selected player failed; start auction (selector keeps their score)
  const handleFailQuestion = () => {
    if (!selectedPlayer || !questionKey) return;
    setAuctionActive(true);
    setSelectorPlayerId(selectedPlayer.id);
    dispatch({ type: 'markQuestionAuctioned', payload: questionKey });
    onMarkAuctioned?.(questionKey);
  };

  const handleBidChange = (playerId: string, raw: string) => {
    if (raw === '') {
      setBids((prev) => {
        const next = { ...prev };
        delete next[playerId];
        return next;
      });
      return;
    }
    const parsed = Number.parseInt(raw, 10);
    if (Number.isNaN(parsed)) return;
    const clamped = Math.max(0, Math.min(scoreDelta, parsed));
    setBids((prev) => ({ ...prev, [playerId]: clamped }));
  };

  const handleAuctionCorrect = (player: Player) => {
    const bid = bids[player.id] ?? 0;
    if (bid <= 0) return;
    void finalizeQuestionAnswered(player, bid);
  };

  const handleAuctionWrong = (player: Player) => {
    const bid = bids[player.id] ?? 0;
    if (!questionKey || bid <= 0) return;
    if (actions) {
      void actions.subtractScore(player.id, bid);
    } else {
      dispatch({
        type: 'subtractScore',
        payload: { playerId: player.id, points: bid },
      });
    }
    const nextWrongIds = new Set(auctionWrongIds).add(player.id);
    setAuctionWrongIds(nextWrongIds);
    const stillCanAnswer = activeBidders.filter((p) => !nextWrongIds.has(p.id));
    if (stillCanAnswer.length === 0) {
      void finalizeQuestionAnswered();
    }
  };

  const handleEndAuctionWithoutBids = () => {
    void finalizeQuestionAnswered();
  };

  // Sync editable fields when a new question is opened
  useEffect(() => {
    setEditQuestion(question?.question ?? '');
    setEditAnswer(question?.answer ?? '');
    setEditImage(question?.image ?? '');
  }, [question]);

  // Keep a stable ref so the broadcast effect doesn't need onLiveEdit as a dep
  const onLiveEditRef = useRef(onLiveEdit);
  useEffect(() => {
    onLiveEditRef.current = onLiveEdit;
  });

  // Broadcast every field edit to the player page
  useEffect(() => {
    if (!isAdmin || !question) return;
    onLiveEditRef.current?.({
      question: editQuestion,
      answer: editAnswer,
      image: editImage.trim() || undefined,
    });
  }, [editQuestion, editAnswer, editImage, isAdmin, question]);

  useEffect(() => {
    if (!isOpen || !questionKey) {
      dispatch({ type: 'clearRevealedQuestionAnswer' });
      resetAuctionState();
      setWinner(null);
      previousQuestionKeyRef.current = questionKey;
      return;
    }

    if (previousQuestionKeyRef.current && previousQuestionKeyRef.current !== questionKey) {
      dispatch({ type: 'clearRevealedQuestionAnswer' });
      resetAuctionState();
      setWinner(null);
    }

    previousQuestionKeyRef.current = questionKey;
  }, [isOpen, questionKey, dispatch]);

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        {question?.category}
        {question && (
          <Typography component="span" variant="body2" sx={{ ml: 1, color: 'text.secondary' }}>
            ${question.price}
          </Typography>
        )}
      </DialogTitle>

      <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
        {/* Question text */}
        {isAdmin ? (
          <TextField
            label="Question"
            multiline
            minRows={2}
            fullWidth
            value={editQuestion}
            onChange={(e) => setEditQuestion(e.target.value)}
          />
        ) : (
          <Typography variant="body1">{question?.question}</Typography>
        )}

        {/* Image URL */}
        {isAdmin && (
          <TextField
            label="Image URL (optional)"
            fullWidth
            value={editImage}
            onChange={(e) => setEditImage(e.target.value)}
          />
        )}

        {/* Image preview */}
        {(editImage || question?.image) && (
          <img
            src={isAdmin ? editImage : question?.image}
            alt={`${question?.category} question`}
            loading="lazy"
            style={{ maxWidth: '100%', borderRadius: 8 }}
          />
        )}

        {/* Answer */}
        {isAdmin ? (
          <TextField
            label="Answer"
            fullWidth
            value={editAnswer}
            onChange={(e) => setEditAnswer(e.target.value)}
          />
        ) : (
          (isRevealingAnswer || showAnswer) && (
            <Typography variant="subtitle2">Answer: {question?.answer}</Typography>
          )
        )}

        {winner && (
          <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 700 }}>
            Winner: {winner.name}
          </Typography>
        )}

        {/* Auction phase — selector failed, other players bid and answer in bid order */}
        {isAdmin && auctionActive && (
          <Box>
            <Typography variant="caption" color="warning.main" sx={{ display: 'block', mb: 1 }}>
              ✗&nbsp;{selectorPlayer?.name ?? 'Player'} failed — auction open (max bid ${scoreDelta})
            </Typography>

            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Enter bids for participating players (highest bid answers first).
            </Typography>

            {auctionPlayers.map((player) => {
              const bid = bids[player.id] ?? '';
              const answeredWrong = auctionWrongIds.has(player.id);
              return (
                <Box
                  key={player.id}
                  sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 1 }}
                >
                  <Typography variant="body2" sx={{ minWidth: 120 }}>
                    {player.name}
                    {answeredWrong ? ' (wrong)' : ''}
                  </Typography>
                  <TextField
                    type="number"
                    size="small"
                    label="Bid"
                    value={bid}
                    onChange={(e) => handleBidChange(player.id, e.target.value)}
                    disabled={answeredWrong || isRevealingAnswer}
                    slotProps={{
                      htmlInput: { min: 0, max: scoreDelta, step: 1 },
                    }}
                    sx={{ width: 100 }}
                  />
                </Box>
              );
            })}

            {activeBidders.length > 0 && (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Answer order (highest bid first)
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1 }}>
                  {activeBidders.map((player, index) => (
                    <Typography
                      key={player.id}
                      variant="caption"
                      sx={{
                        color: auctionWrongIds.has(player.id)
                          ? 'error.main'
                          : player.id === currentBidder?.id
                            ? 'primary.main'
                            : 'text.secondary',
                        fontWeight: player.id === currentBidder?.id ? 700 : 400,
                      }}
                    >
                      {index + 1}. {player.name} (${bids[player.id]})
                      {auctionWrongIds.has(player.id) ? ' ✗' : ''}
                    </Typography>
                  ))}
                </Box>
              </>
            )}

            {currentBidder && !isRevealingAnswer && (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleAuctionWrong(currentBidder)}
                  disabled={!question}
                  sx={{ minWidth: 0 }}
                >
                  ✗&nbsp;{currentBidder.name}&nbsp;wrong&nbsp;(−{bids[currentBidder.id]})
                </Button>
                <Button
                  variant="contained"
                  color="success"
                  onClick={() => handleAuctionCorrect(currentBidder)}
                  disabled={!question}
                  sx={{ minWidth: 0 }}
                >
                  ✓&nbsp;{currentBidder.name}&nbsp;correct&nbsp;+{bids[currentBidder.id]}
                </Button>
              </Box>
            )}

            {activeBidders.length === 0 && !isRevealingAnswer && (
              <Box sx={{ mt: 1 }}>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  No bids yet.
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={handleEndAuctionWithoutBids}
                  disabled={!question}
                >
                  End question (no bids)
                </Button>
              </Box>
            )}
          </Box>
        )}
      </DialogContent>

      {isAdmin && (
        <DialogActions>
          {/* Stage 1 controls — hidden once auction starts */}
          {!auctionActive && (
            <>
              {!selectedPlayer && (
                <Typography variant="caption" color="error" sx={{ flex: 1, textAlign: 'left', px: 1 }}>
                  Select a player first.
                </Typography>
              )}
              <Button
                onClick={handleFailQuestion}
                variant="outlined"
                color="error"
                disabled={!selectedPlayer || !question || isRevealingAnswer}
              >
                ✗&nbsp;Failed&nbsp;(start auction)
              </Button>
              <Button
                onClick={handleCorrectAnswerStage1}
                variant="contained"
                color="success"
                disabled={!selectedPlayer || !question || isRevealingAnswer}
              >
                ✓&nbsp;Correct&nbsp;+{scoreDelta}
              </Button>
            </>
          )}
          <Button onClick={closeDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
