import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { useContext, useEffect, useState } from 'react';
import { GameContext } from '../../context/GameContext';

export type QuestionDialogData = {
  category: string;
  question: string;
  price: number;
  answer: string;
  image?: string;
  isAnswered?: boolean;
};

type QuestionDialogProps = {
  question: QuestionDialogData | null;
  isOpen: boolean;
  onClose: () => void;
  disableBackdropClose?: boolean;
  onQuestionAnswered?: (question: QuestionDialogData) => void;
};

export default function QuestionDialog({
  question,
  isOpen,
  onClose,
  disableBackdropClose = false,
  onQuestionAnswered,
}: QuestionDialogProps) {
  const game = useContext(GameContext);

  if (!game) {
    throw new Error('QuestionDialog must be used inside GameProvider');
  }

  const { players, addScore, subtractScore } = game;
  const selectedPlayer = players.find((player) => player.isSelected);
  const scoreDelta = question?.price ?? 0;
  const wrongAnswerPenalty = 100;
  const [isChoosingAuctionWinner, setIsChoosingAuctionWinner] = useState(false);

  const handleClose = (_event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (disableBackdropClose && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }

    onClose();
  };
  const handleAddScore = () => {
    if (!selectedPlayer || !question) return;
    addScore(selectedPlayer.id, scoreDelta);
    onQuestionAnswered?.(question);
    onClose();
  };

  const handleSubtractScore = () => {
    if (!selectedPlayer || !question) return;
    subtractScore(selectedPlayer.id, wrongAnswerPenalty);
    setIsChoosingAuctionWinner(true);
  };

  const handleAuctionWinnerAddScore = (playerId: string) => {
    if (!question) return;
    addScore(playerId, scoreDelta);
    onQuestionAnswered?.(question);
    onClose();
  };

  const handleAuctionNoWinner = () => {
    if (!question) return;
    onQuestionAnswered?.(question);
    onClose();
  };

  useEffect(() => {
    if (!isOpen) {
      setIsChoosingAuctionWinner(false);
    }
  }, [isOpen]);

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
        {isChoosingAuctionWinner && (
          <>
            <Typography variant="subtitle2" sx={{ mt: 1.5 }}>
              Wrong answer: -{wrongAnswerPenalty} applied. Choose player to get +{scoreDelta}, or no
              one.
            </Typography>
            {players.map((player) => (
              <Button
                key={player.id}
                onClick={() => {
                  handleAuctionWinnerAddScore(player.id);
                }}
                variant="outlined"
                sx={{ mt: 1, mr: 1 }}
              >
                {player.name}
              </Button>
            ))}
            <Button onClick={handleAuctionNoWinner} variant="outlined" sx={{ mt: 1, mr: 1 }}>
              No one (wrong answer)
            </Button>
          </>
        )}
        {question?.image && (
          <img
            src={question.image}
            alt={`${question.category} question`}
            loading="lazy"
            style={{ maxWidth: '100%', marginTop: 12, borderRadius: 8 }}
          />
        )}
      </DialogContent>
      <DialogActions>
        <Button
          onClick={handleSubtractScore}
          variant="outlined"
          color="error"
          disabled={!selectedPlayer || !question || isChoosingAuctionWinner}
        >
          -{wrongAnswerPenalty}
        </Button>
        <Button
          onClick={handleAddScore}
          variant="contained"
          color="success"
          disabled={!selectedPlayer || !question || isChoosingAuctionWinner}
        >
          +{scoreDelta}
        </Button>
        <Button onClick={onClose} variant="contained">
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
