import Button from '@mui/material/Button';
import DialogActions from '@mui/material/DialogActions';
import Typography from '@mui/material/Typography';
import { tokens } from '../../theme';
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
    <DialogActions sx={{ px: 4, pb: 3, pt: 1, gap: 1 }}>
      {!auctionActive && (
        <>
          {!selectedPlayer && (
            <Typography
              variant="caption"
              sx={{ flex: 1, textAlign: 'left', color: tokens.accentBright }}
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
      <Button onClick={onClose} variant="outlined">
        Close
      </Button>
    </DialogActions>
  );
}
