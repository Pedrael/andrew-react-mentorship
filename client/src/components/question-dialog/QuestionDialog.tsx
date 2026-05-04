import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { useContext } from 'react';
import { GameContext } from '../../context/GameContext';

export type QuestionDialogData = {
  category: string;
  question: string;
  price: number;
  answer: string;
  image?: string;
};

type QuestionDialogProps = {
  question: QuestionDialogData | null;
  isOpen: boolean;
  onClose: () => void;
  disableBackdropClose?: boolean;
};

export default function QuestionDialog({
  question,
  isOpen,
  onClose,
  disableBackdropClose = false,
}: QuestionDialogProps) {
  const game = useContext(GameContext);

  if (!game) {
    throw new Error('QuestionDialog must be used inside GameProvider');
  }

  const { players, addScore, subtractScore } = game;
  const selectedPlayer = players.find((player) => player.isSelected);
  const scoreDelta = question?.price ?? 0;

  const handleClose = (_event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (disableBackdropClose && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }

    onClose();
  };
  const handleAddScore = () => {
    if (!selectedPlayer || !question) return;
    addScore(selectedPlayer.id, scoreDelta);
    onClose();
  };

  const handleSubtractScore = () => {
    if (!selectedPlayer || !question) return;
    subtractScore(selectedPlayer.id, scoreDelta);
    onClose();
  };

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
          disabled={!selectedPlayer || !question}
        >
          -{scoreDelta}
        </Button>
        <Button
          onClick={handleAddScore}
          variant="contained"
          color="success"
          disabled={!selectedPlayer || !question}
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
