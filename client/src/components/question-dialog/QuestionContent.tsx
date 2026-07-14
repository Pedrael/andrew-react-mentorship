import Typography from '@mui/material/Typography';
import ControllableTextField from '../controllable-text-field/ControllableTextField';
import type { QuestionContentProps } from './types';

export default function QuestionContent({
  isAdmin,
  question,
  showAnswer,
  isRevealingAnswer,
  control,
  editImage,
  winner,
}: QuestionContentProps) {
  return (
    <>
      {isAdmin ? (
        <ControllableTextField
          name="question"
          control={control}
          label="Question"
          multiline
          minRows={2}
          fullWidth
        />
      ) : (
        <Typography variant="body1">{question?.question}</Typography>
      )}

      {isAdmin && (
        <ControllableTextField
          name="image"
          control={control}
          label="Image URL (optional)"
          fullWidth
        />
      )}

      {(editImage || question?.image) && (
        <img
          src={isAdmin ? editImage : question?.image}
          alt={`${question?.category} question`}
          loading="lazy"
          style={{ maxWidth: '100%', borderRadius: 8 }}
        />
      )}

      {isAdmin ? (
        <ControllableTextField name="answer" control={control} label="Answer" fullWidth />
      ) : (
        (isRevealingAnswer || showAnswer) && (
          <Typography variant="subtitle2">Answer: {question?.answer}</Typography>
        )
      )}

      {winner && (
        <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 700 }}>
          Winner: {winner.name}
        </Typography>
      )}
    </>
  );
}
