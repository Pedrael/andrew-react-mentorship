import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Divider from '@mui/material/Divider';
import Typography from '@mui/material/Typography';
import { useContext, useEffect, useRef, useState } from 'react';
import { GameContext, buildQuestionKey, type Player } from '../../context/GameContext';

export type QuestionDialogData = {
  category: string;
  question: string;
  price: number;
  answer: string;
  image?: string;
};

type QuestionDialogProps = {
  question: QuestionDialogData | null;
  isAdmin: boolean;
  isOpen: boolean;
  onClose: () => void;
  disableBackdropClose?: boolean;
  showAnswer?: boolean;
  onAnswerReveal?: (questionKey: string) => void;
};

export default function QuestionDialog({
  question,
  isAdmin = false,
  isOpen,
  onClose,
  disableBackdropClose = false,
  showAnswer = false,
  onAnswerReveal,
}: QuestionDialogProps) {
  const game = useContext(GameContext);
  const [winner, setWinner] = useState<Player | null>(null);
  // null = Stage 1 (first player to answer); non-null = Stage 2 (remaining players)
  const [wrongPlayerId, setWrongPlayerId] = useState<string | null>(null);

  if (!game) {
    throw new Error('QuestionDialog must be used inside GameProvider');
  }

  const {
    players,
    addScore,
    subtractScore,
    selectNextPlayer,
    markQuestionAnswered,
    revealedQuestionKey,
    revealQuestionAnswer,
    clearRevealedQuestionAnswer,
    revealWinnerOnGameEnd,
  } = game;

  const selectedPlayer = players.find((p) => p.isSelected);
  const scoreDelta = question?.price ?? 0;
  const wrongAnswerPenalty = 100;
  const questionKey = question ? buildQuestionKey(question.category, question.price) : null;
  const isRevealingAnswer = Boolean(questionKey && revealedQuestionKey === questionKey);
  const previousQuestionKeyRef = useRef<string | null>(null);

  // Players eligible to answer in Stage 2 (everyone except the player who already got it wrong)
  const remainingPlayers = wrongPlayerId ? players.filter((p) => p.id !== wrongPlayerId) : [];

  const closeDialog = () => {
    clearRevealedQuestionAnswer();
    onClose();
  };

  const handleClose = (_event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (disableBackdropClose && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }
    closeDialog();
  };

  // Stage 1 — selected player answered correctly
  const handleCorrectAnswerStage1 = () => {
    if (!selectedPlayer || !question || !questionKey) return;
    revealQuestionAnswer(questionKey);
    addScore(selectedPlayer.id, scoreDelta);
    markQuestionAnswered(questionKey);
    selectNextPlayer();
    onAnswerReveal?.(questionKey);
    setWinner(revealWinnerOnGameEnd());
  };

  // Stage 1 — selected player answered wrong
  const handleWrongAnswer = () => {
    if (!selectedPlayer || !question) return;
    subtractScore(selectedPlayer.id, wrongAnswerPenalty);
    setWrongPlayerId(selectedPlayer.id);
  };

  // Stage 2 — one of the remaining players answered correctly
  const handleCorrectAnswerStage2 = (player: Player) => {
    if (!question || !questionKey) return;
    revealQuestionAnswer(questionKey);
    addScore(player.id, scoreDelta);
    markQuestionAnswered(questionKey);
    selectNextPlayer();
    onAnswerReveal?.(questionKey);
    setWinner(revealWinnerOnGameEnd());
  };

  useEffect(() => {
    if (!isOpen || !questionKey) {
      clearRevealedQuestionAnswer();
      setWrongPlayerId(null);
      setWinner(null);
      previousQuestionKeyRef.current = questionKey;
      return;
    }

    if (previousQuestionKeyRef.current && previousQuestionKeyRef.current !== questionKey) {
      clearRevealedQuestionAnswer();
      setWrongPlayerId(null);
      setWinner(null);
    }

    previousQuestionKeyRef.current = questionKey;
  }, [isOpen, questionKey, clearRevealedQuestionAnswer]);

  const wrongPlayer = wrongPlayerId ? players.find((p) => p.id === wrongPlayerId) : null;

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

      <DialogContent>
        <Typography variant="body1">{question?.question}</Typography>

        {question?.image && (
          <img
            src={question.image}
            alt={`${question.category} question`}
            loading="lazy"
            style={{ maxWidth: '100%', marginTop: 12, borderRadius: 8 }}
          />
        )}

        {(isAdmin || isRevealingAnswer || showAnswer) && (
          <Typography variant="subtitle2" sx={{ mt: 1.5 }}>
            Answer: {question?.answer}
          </Typography>
        )}

        {winner && (
          <Typography variant="body1" sx={{ mt: 1.5, color: 'success.main', fontWeight: 700 }}>
            Winner: {winner.name}
          </Typography>
        )}

        {/* Stage 2: show who got it wrong, then per-player correct-answer buttons */}
        {isAdmin && wrongPlayerId && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="caption" color="error.main" sx={{ display: 'block', mb: 1 }}>
              ✗&nbsp;{wrongPlayer?.name ?? 'Player'} answered wrong (−{wrongAnswerPenalty} pts)
            </Typography>

            {remainingPlayers.length > 0 ? (
              <>
                <Divider sx={{ my: 1 }} />
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                  Who answered correctly?
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                  {remainingPlayers.map((player) => (
                    <Button
                      key={player.id}
                      variant="outlined"
                      color="success"
                      onClick={() => handleCorrectAnswerStage2(player)}
                      disabled={!question || isRevealingAnswer}
                      sx={{ minWidth: 0 }}
                    >
                      ✓&nbsp;{player.name}&nbsp;+{scoreDelta}
                    </Button>
                  ))}
                </Box>
              </>
            ) : (
              <Typography variant="caption" color="text.secondary">
                No more players to answer.
              </Typography>
            )}
          </Box>
        )}
      </DialogContent>

      {isAdmin && (
        <DialogActions>
          {/* Stage 1 controls — hidden once a wrong answer is recorded */}
          {!wrongPlayerId && (
            <>
              {!selectedPlayer && (
                <Typography variant="caption" color="error" sx={{ flex: 1, textAlign: 'left', px: 1 }}>
                  Select a player first.
                </Typography>
              )}
              <Button
                onClick={handleWrongAnswer}
                variant="outlined"
                color="error"
                disabled={!selectedPlayer || !question || isRevealingAnswer}
              >
                ✗&nbsp;Wrong&nbsp;(−{wrongAnswerPenalty})
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
