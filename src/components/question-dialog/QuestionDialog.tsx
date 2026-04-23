import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';

export type QuestionDialogData = {
  category: string;
  question: string;
  price: number;
  answer: string;
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
  const handleClose = (_event: object, reason: 'backdropClick' | 'escapeKeyDown') => {
    if (disableBackdropClose && (reason === 'backdropClick' || reason === 'escapeKeyDown')) {
      return;
    }

    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>{question?.category}</DialogTitle>
      <DialogContent>
        <Typography variant="body1">{question?.question}</Typography>
      </DialogContent>
    </Dialog>
  );
}
