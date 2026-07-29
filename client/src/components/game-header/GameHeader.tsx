import type { ReactNode } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import { displayFont, tokens } from '../../theme';

type GameHeaderProps = {
  /** Short status label shown on the right, e.g. "Host view" or "Live game". */
  status?: string;
  /** Optional action rendered at the far right (admin primary action). */
  action?: ReactNode;
};

export default function GameHeader({ status, action }: GameHeaderProps) {
  return (
    <Box
      component="header"
      sx={{
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        px: 3,
        py: 1.5,
        borderBottom: `1px solid ${tokens.border}`,
        backgroundColor: 'rgba(20, 16, 17, 0.6)',
      }}
    >
      <Typography
        component="span"
        sx={{
          fontFamily: displayFont,
          fontWeight: 800,
          fontSize: '1.05rem',
          letterSpacing: '0.01em',
          color: tokens.textPrimary,
          whiteSpace: 'nowrap',
        }}
      >
        Krasty
        <Box component="span" sx={{ color: tokens.accent }}>
          Soft
        </Box>
      </Typography>

      <Box
        sx={{
          width: '1px',
          alignSelf: 'stretch',
          my: 0.5,
          backgroundColor: tokens.border,
        }}
      />

      <Typography
        component="h1"
        sx={{
          fontFamily: displayFont,
          fontWeight: 700,
          fontSize: '1rem',
          color: tokens.textSecondary,
          m: 0,
        }}
      >
        Jeopardy
      </Typography>

      <Box sx={{ flex: 1 }} />

      {status && (
        <Typography
          component="span"
          sx={{
            fontSize: '0.72rem',
            fontWeight: 700,
            textTransform: 'uppercase',
            letterSpacing: '0.1em',
            color: tokens.textMuted,
            border: `1px solid ${tokens.border}`,
            borderRadius: 999,
            px: 1.5,
            py: 0.5,
            whiteSpace: 'nowrap',
          }}
        >
          {status}
        </Typography>
      )}

      {action}
    </Box>
  );
}
