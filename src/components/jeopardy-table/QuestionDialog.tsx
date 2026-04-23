import Dialog from '@mui/material/Dialog';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import Typography from '@mui/material/Typography';

export type QuestionDialogData = {
  category: string;
  question: string;
  price: number;
};

type QuestionDialogProps = {
  question: QuestionDialogData | null;
  onClose: () => void;
};

export default function QuestionDialog({ question, onClose }: QuestionDialogProps) {
  return (
    <Dialog open={Boolean(question)} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{question?.category}</DialogTitle>
      <DialogContent>
        <Typography variant="body1">{question?.question}</Typography>
      </DialogContent>
    </Dialog>
  );
}
