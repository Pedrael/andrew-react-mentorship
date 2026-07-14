import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import type { QuestionDialogActionsProps } from './types';

export default function QuestionDialogActions({
  auctionActive,
  selectedPlayer,
  scoreDelta,
  isRevealingAnswer,
  hasQuestion,
  onFail,
  onCorrect,
  onClose,
}: QuestionDialogActionsProps) {
  return (
    <DialogActions>
      {!auctionActive && (
        <>
          {!selectedPlayer && (
            <Typography
              variant="caption"
              color="error"
              sx={{ flex: 1, textAlign: 'left', px: 1 }}
            >
              Select a player first.
            </Typography>
          )}
          <Button
            onClick={onFail}
            variant="outlined"
            color="error"
            disabled={!selectedPlayer || !hasQuestion || isRevealingAnswer}
          >
            ✗&nbsp;Failed&nbsp;(start auction)
          </Button>
          <Button
            onClick={onCorrect}
            variant="contained"
            color="success"
            disabled={!selectedPlayer || !hasQuestion || isRevealingAnswer}
          >
            ✓&nbsp;Correct&nbsp;+{scoreDelta}
          </Button>
        </>
      )}
      <Button onClick={onClose} variant="contained">
        Close
      </Button>
    </DialogActions>
  );
}
