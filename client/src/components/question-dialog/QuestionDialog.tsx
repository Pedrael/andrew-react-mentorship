import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
import { displayFont, tokens } from '../../theme';
import type { QuestionDialogData } from './types';

type QuestionDialogProps = {
  question: QuestionDialogData | null;
  isOpen: boolean;
  onClose: () => void;
  disableBackdropClose?: boolean;
  children: ReactNode;
  actions?: ReactNode;
};

export default function QuestionDialog({
  question,
  isOpen,
  onClose,
  disableBackdropClose = false,
  children,
  actions,
}: QuestionDialogProps) {
  const handleClose = (_event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (disableBackdropClose && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="md" fullWidth>
      <DialogTitle
        component="div"
        sx={{ display: 'flex', alignItems: 'center', gap: 1.5, px: 4, pt: 3, pb: 1 }}
      >
        <Typography
          component="span"
          sx={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: tokens.textMuted,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {question?.category}
        </Typography>
        {question && (
          <Box
            component="span"
            sx={{
              fontFamily: displayFont,
              fontSize: '0.85rem',
              fontWeight: 700,
              color: tokens.accentBright,
              backgroundColor: tokens.accentTint,
              border: `1px solid ${tokens.accentBorder}`,
              borderRadius: 999,
              px: 1.5,
              py: 0.25,
              lineHeight: 1.4,
              flexShrink: 0,
            }}
          >
            ${question.price}
          </Box>
        )}
      </DialogTitle>

      <DialogContent
        sx={{ display: 'flex', flexDirection: 'column', gap: 2, px: 4, '&&': { pt: 2 } }}
      >
        {children}
      </DialogContent>

      {actions}
    </Dialog>
  );
}
