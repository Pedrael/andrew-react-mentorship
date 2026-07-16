import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ControllableTextField from '../controllable-text-field/ControllableTextField';
import { displayFont, tokens } from '../../theme';
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
        <Typography
          sx={{
            fontFamily: displayFont,
            fontWeight: 600,
            fontSize: 'clamp(1.3rem, 2.4vw, 1.9rem)',
            lineHeight: 1.45,
            color: tokens.textPrimary,
            textAlign: 'center',
            maxWidth: '32ch',
            mx: 'auto',
            py: 3,
          }}
        >
          {question?.question}
        </Typography>
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
          style={{
            maxWidth: '100%',
            maxHeight: '40vh',
            objectFit: 'contain',
            borderRadius: 10,
            alignSelf: 'center',
          }}
        />
      )}

      {isAdmin ? (
        <ControllableTextField name="answer" control={control} label="Answer" fullWidth />
      ) : (
        (isRevealingAnswer || showAnswer) && (
          <Box sx={{ textAlign: 'center', pb: 1 }}>
            <Typography
              component="span"
              sx={{
                display: 'block',
                fontSize: '0.72rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: tokens.textMuted,
                mb: 0.5,
              }}
            >
              Answer
            </Typography>
            <Typography
              sx={{
                fontFamily: displayFont,
                fontWeight: 700,
                fontSize: '1.15rem',
                color: tokens.textPrimary,
              }}
            >
              {question?.answer}
            </Typography>
          </Box>
        )
      )}

      {winner && (
        <Typography
          sx={{
            textAlign: isAdmin ? 'left' : 'center',
            fontWeight: 700,
            color: tokens.green,
          }}
        >
          Winner: {winner.name}
        </Typography>
      )}
    </>
  );
}
