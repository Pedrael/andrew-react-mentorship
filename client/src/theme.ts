import { createTheme } from '@mui/material/styles';

// Krasty Soft dark game-show tokens. Everything visual derives from these;
// swap hex values here to rebrand.
export const tokens = {
  // Surfaces, darkest to lightest
  bg: '#0C0A0B',
  board: '#141011',
  surface: '#1C1618',
  elevated: '#241C1E',
  sunken: '#120E0F',

  // Brand
  accent: '#E01E2B',
  accentBright: '#F5323F',
  glow: '#5A0C12',

  // Text
  textPrimary: '#F5F3F2',
  textSecondary: '#B4ACAE',
  textMuted: '#7C7377',

  // Status (accents only, never full fills)
  green: '#3FB56B',
  amber: '#E0A32E',

  // Edges
  border: 'rgba(255, 255, 255, 0.08)',
  borderStrong: 'rgba(255, 255, 255, 0.16)',
  accentBorder: 'rgba(224, 30, 43, 0.55)',
  accentTint: 'rgba(224, 30, 43, 0.10)',
} as const;

export const displayFont = "'Sora', 'Inter', sans-serif";
export const bodyFont = "'Inter', 'Helvetica Neue', Arial, sans-serif";

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: tokens.accent, contrastText: '#fff' },
    success: { main: tokens.green },
    warning: { main: tokens.amber },
    error: { main: tokens.accentBright },
    background: { default: tokens.bg, paper: tokens.surface },
    text: {
      primary: tokens.textPrimary,
      secondary: tokens.textSecondary,
      disabled: tokens.textMuted,
    },
    divider: tokens.border,
  },

  shape: { borderRadius: 10 },

  typography: {
    fontFamily: bodyFont,
    h1: { fontFamily: displayFont, fontWeight: 800 },
    h2: { fontFamily: displayFont, fontWeight: 800 },
    h3: { fontFamily: displayFont, fontWeight: 700 },
    h4: { fontFamily: displayFont, fontWeight: 700 },
    h5: { fontFamily: displayFont, fontWeight: 700 },
    h6: { fontFamily: displayFont, fontWeight: 700 },
    button: { fontWeight: 600, textTransform: 'none' },
    overline: {
      fontWeight: 700,
      letterSpacing: '0.08em',
      color: tokens.textMuted,
    },
  },

  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          backgroundColor: tokens.bg,
          backgroundImage: `
            radial-gradient(1100px 520px at 50% -12%, rgba(90, 12, 18, 0.55), transparent 70%),
            radial-gradient(900px 480px at 85% 110%, rgba(90, 12, 18, 0.28), transparent 70%)
          `,
          backgroundAttachment: 'fixed',
          minHeight: '100vh',
        },
        '@media (prefers-reduced-motion: reduce)': {
          '*, *::before, *::after': {
            animationDuration: '0.01ms !important',
            animationIterationCount: '1 !important',
            transitionDuration: '0.01ms !important',
          },
        },
      },
    },

    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          textTransform: 'none',
          fontWeight: 600,
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
          '&:active': { boxShadow: 'none' },
          variants: [
            {
              props: { variant: 'contained', color: 'primary' },
              style: {
                '&:hover': { backgroundColor: tokens.accentBright },
              },
            },
            {
              props: { variant: 'contained', color: 'success' },
              style: { color: '#0C0A0B' },
            },
            {
              props: { variant: 'outlined' },
              style: {
                borderColor: tokens.borderStrong,
                color: tokens.textPrimary,
                '&:hover': {
                  borderColor: tokens.accentBorder,
                  backgroundColor: tokens.accentTint,
                },
              },
            },
            {
              props: { variant: 'outlined', color: 'error' },
              style: {
                borderColor: 'rgba(245, 50, 63, 0.5)',
                color: tokens.accentBright,
                '&:hover': {
                  borderColor: tokens.accentBright,
                  backgroundColor: tokens.accentTint,
                },
              },
            },
            {
              props: { variant: 'outlined', color: 'success' },
              style: {
                borderColor: 'rgba(63, 181, 107, 0.5)',
                color: tokens.green,
                '&:hover': {
                  borderColor: tokens.green,
                  backgroundColor: 'rgba(63, 181, 107, 0.10)',
                },
              },
            },
          ],
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: 'none',
        },
      },
    },

    // Board container: elevated dark panel instead of a bordered spreadsheet
    MuiTableContainer: {
      styleOverrides: {
        root: {
          backgroundColor: tokens.board,
          border: `1px solid ${tokens.border}`,
          borderRadius: 14,
          padding: 10,
          boxShadow: '0 18px 50px rgba(0, 0, 0, 0.45)',
        },
      },
    },

    // Gaps between tiles instead of grid lines
    MuiTable: {
      styleOverrides: {
        root: {
          borderCollapse: 'separate',
          borderSpacing: 6,
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: {
          textAlign: 'center',
          border: 'none',
          borderRadius: 8,
        },
        head: {
          color: tokens.textMuted,
          fontSize: '0.75rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          backgroundColor: 'transparent',
          paddingTop: 6,
          paddingBottom: 6,
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: {
          backgroundColor: '#171113',
          border: `1px solid ${tokens.borderStrong}`,
          borderRadius: 14,
          boxShadow: '0 24px 80px rgba(0, 0, 0, 0.65), 0 0 70px rgba(90, 12, 18, 0.4)',
        },
      },
    },

    MuiBackdrop: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(9, 6, 7, 0.72)',
          backdropFilter: 'blur(5px)',
        },
        invisible: {
          backgroundColor: 'transparent',
          backdropFilter: 'none',
        },
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          backgroundColor: 'rgba(255, 255, 255, 0.03)',
          borderRadius: 10,
          '& .MuiOutlinedInput-notchedOutline': { borderColor: tokens.border },
          '&:hover .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.borderStrong,
          },
          '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
            borderColor: tokens.accentBorder,
          },
        },
      },
    },

    MuiFormLabel: {
      styleOverrides: {
        root: {
          color: tokens.textSecondary,
          '&.Mui-focused': { color: tokens.textSecondary },
        },
      },
    },

    MuiRadio: {
      styleOverrides: {
        root: {
          color: tokens.textMuted,
          '&.Mui-checked': { color: tokens.accent },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: {
          color: tokens.textMuted,
          '&:hover': {
            color: tokens.textPrimary,
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
          },
        },
      },
    },
  },
});
