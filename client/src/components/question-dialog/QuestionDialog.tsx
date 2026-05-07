import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
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

  if (!game) {
    throw new Error('QuestionDialog must be used inside GameProvider');
  }

  const {
    players,
    addScore,
    subtractScore,
    selectNextPlayer,
    auctionedQuestionKeys,
    markQuestionAnswered,
    markQuestionAuctioned,
    revealedQuestionKey,
    revealQuestionAnswer,
    clearRevealedQuestionAnswer,
    revealWinnerOnGameEnd,
  } = game;
  const selectedPlayer = players.find((player) => player.isSelected);
  const scoreDelta = question?.price ?? 0;
  const wrongAnswerPenalty = 100;
  const questionKey = question ? buildQuestionKey(question.category, question.price) : null;
  const isAuctioned = Boolean(questionKey && auctionedQuestionKeys.has(questionKey));
  const isRevealingAnswer = Boolean(questionKey && revealedQuestionKey === questionKey);
  const previousQuestionKeyRef = useRef<string | null>(null);

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
  const handleRevealAnswer = () => {
    if (!selectedPlayer || !question || !questionKey) return;
    revealQuestionAnswer(questionKey);
    addScore(selectedPlayer.id, scoreDelta);
    markQuestionAnswered(questionKey);
    selectNextPlayer();
    onAnswerReveal?.(questionKey);
    const winner = revealWinnerOnGameEnd();
    setWinner(winner);
  };

  const handleMarkAsAuctioned = () => {
    if (!question || !questionKey) return;
    if (!isAuctioned) {
      if (!selectedPlayer) return;
      subtractScore(selectedPlayer.id, wrongAnswerPenalty);
    }
    clearRevealedQuestionAnswer();
    markQuestionAuctioned(questionKey);
    selectNextPlayer();
    onClose();
  };

  useEffect(() => {
    if (!isOpen || !questionKey) {
      clearRevealedQuestionAnswer();
      previousQuestionKeyRef.current = questionKey;
      return;
    }

    if (previousQuestionKeyRef.current && previousQuestionKeyRef.current !== questionKey) {
      clearRevealedQuestionAnswer();
    }

    previousQuestionKeyRef.current = questionKey;
  }, [isOpen, questionKey, clearRevealedQuestionAnswer]);

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{question?.category}</DialogTitle>
      <DialogContent>
        <Typography variant="body1">{question?.question}</Typography>
        {!selectedPlayer && (
          <Typography variant="caption" color="error">
            Select a player before applying score.
          </Typography>
        )}
        {isAuctioned && (
          <Typography variant="subtitle2" color="warning.main" sx={{ mt: 1.5 }}>
            Auctioned question: answer it like a regular question with no penalty for wrong answers.
          </Typography>
        )}
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
          <Typography variant="body1" sx={{ mt: 1.5, color: 'success.main' }}>
            Winner: {winner?.name}
          </Typography>
        )}
      </DialogContent>
      {isAdmin && (
        <DialogActions>
          <Button
            onClick={handleMarkAsAuctioned}
            variant="outlined"
            color={isAuctioned ? 'warning' : 'error'}
            disabled={!question || isRevealingAnswer || (!isAuctioned && !selectedPlayer)}
          >
            {isAuctioned ? 'Wrong answer (-0)' : `Mark as auctioned (-${wrongAnswerPenalty})`}
          </Button>
          <Button
            onClick={handleRevealAnswer}
            variant="contained"
            color="success"
            disabled={!selectedPlayer || !question || isRevealingAnswer}
          >
            +{scoreDelta}
          </Button>
          <Button onClick={closeDialog} variant="contained">
            Close
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}
