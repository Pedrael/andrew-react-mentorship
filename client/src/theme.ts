import { createTheme, type TypographyStyle } from '@mui/material/styles';

const REM_BASE_PX = 16;
const FONT_SIZE_REDUCTION_PX = 2;

const reduceFontSize = (fontSize: string | number): string | number => {
  if (typeof fontSize === 'number') {
    return fontSize - FONT_SIZE_REDUCTION_PX;
  }

  const remMatch = fontSize.match(/^([\d.]+)rem$/);
  if (remMatch) {
    return `${parseFloat(remMatch[1]) * REM_BASE_PX - FONT_SIZE_REDUCTION_PX}px`;
  }

  const pxMatch = fontSize.match(/^([\d.]+)px$/);
  if (pxMatch) {
    return `${parseFloat(pxMatch[1]) - FONT_SIZE_REDUCTION_PX}px`;
  }

  return fontSize;
};

const reduceTypographyVariant = (variant: TypographyStyle): TypographyStyle => ({
  ...variant,
  ...(variant.fontSize != null && { fontSize: reduceFontSize(variant.fontSize) }),
});

const baseTheme = createTheme();
const typographyVariantKeys = [
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'subtitle1',
  'subtitle2',
  'body1',
  'body2',
  'button',
  'caption',
  'overline',
] as const;

const reducedTypography = {
  ...baseTheme.typography,
  fontSize: baseTheme.typography.fontSize - FONT_SIZE_REDUCTION_PX,
  ...Object.fromEntries(
    typographyVariantKeys.map((key) => [
      key,
      reduceTypographyVariant(baseTheme.typography[key]),
    ]),
  ),
};

export const theme = createTheme({
  palette: {
    primary: { main: '#cc0000' },
  },

  shape: { borderRadius: 8 },

  typography: reducedTypography,

  components: {
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 999,
          width: 'fit-content',
          textTransform: 'none',
          boxShadow: 'none',
          '&:hover': { boxShadow: 'none' },
          '&:active': { boxShadow: 'none' },
        },
        outlined: {
          borderColor: '#000',
          '&:hover': { borderColor: '#000' },
        },
      },
    },

    MuiPaper: {
      defaultProps: { elevation: 0 },
      styleOverrides: {
        root: { boxShadow: 'none' },
      },
    },

    // Only the table wrapper gets a black border — keeps Dialog and other Papers clean
    MuiTableContainer: {
      styleOverrides: {
        root: {
          border: '1px solid #000',
          borderRadius: 8,
          overflow: 'hidden',
        },
      },
    },

    MuiTableCell: {
      styleOverrides: {
        root: ({ theme: muiTheme }) => ({
          textAlign: 'center',
          fontSize: muiTheme.typography.body2.fontSize,
          // row separator
          borderBottom: '1px solid #000',
          // column separator; last cell in a row gets no right border (container provides it)
          borderRight: '1px solid #000',
          '&:last-child': { borderRight: 'none' },
        }),
      },
    },

    // The last data row should not double-border with the container bottom edge
    MuiTableBody: {
      styleOverrides: {
        root: {
          '& .MuiTableRow-root:last-child .MuiTableCell-root': {
            borderBottom: 'none',
          },
        },
      },
    },

    MuiDialog: {
      styleOverrides: {
        paper: { borderRadius: 16 },
      },
    },

    MuiDialogTitle: {
      styleOverrides: {
        root: ({ theme: muiTheme }) => ({
          fontSize: muiTheme.typography.h6.fontSize,
        }),
      },
    },

    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: '#000' },
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#000' },
        },
        input: ({ theme: muiTheme }) => ({
          fontSize: muiTheme.typography.body1.fontSize,
        }),
      },
    },

    MuiInputBase: {
      styleOverrides: {
        input: ({ theme: muiTheme }) => ({
          fontSize: muiTheme.typography.body1.fontSize,
        }),
      },
    },

    MuiFormLabel: {
      styleOverrides: {
        root: ({ theme: muiTheme }) => ({
          fontSize: muiTheme.typography.body2.fontSize,
        }),
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: { boxShadow: 'none' },
      },
    },
  },
});
