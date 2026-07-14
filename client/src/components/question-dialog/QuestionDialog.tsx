import type { ReactNode } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';
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
        {children}
      </DialogContent>

      {actions}
    </Dialog>
  );
}
