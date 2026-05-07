import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    primary: { main: '#cc0000' },
  },

  shape: { borderRadius: 8 },

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
        root: {
          textAlign: 'center',
          // row separator
          borderBottom: '1px solid #000',
          // column separator; last cell in a row gets no right border (container provides it)
          borderRight: '1px solid #000',
          '&:last-child': { borderRight: 'none' },
        },
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

    MuiOutlinedInput: {
      styleOverrides: {
        notchedOutline: { borderColor: '#000' },
        root: {
          '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#000' },
        },
      },
    },

    MuiIconButton: {
      styleOverrides: {
        root: { boxShadow: 'none' },
      },
    },
  },
});
