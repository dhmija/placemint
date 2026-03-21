import { createTheme } from '@mui/material/styles';

// Bennett-inspired Theme (matching the reference image):
const primaryColor = '#0d47a1'; // Dark Blue (headings)
const secondaryColor = '#d32f2f'; // Strong Red (borders & accents)
const pageBackground = '#f5f5f5'; // Very light grey (page background)
const containerBackground = '#ffffff'; // White for outer containers
const innerContainerBackground = '#f0f0f0'; // Light grey for inner containers
const outerBorderColor = '#e0e0e0'; // Subtle grey borders on outer containers
const innerBorderColor = '#e0e0e0'; // Subtle grey borders on inner containers

const theme = createTheme({
  // Increase the base spacing unit to give the entire app more generous breathing room
  spacing: 10,
  palette: {
    primary: {
      main: primaryColor,
    },
    secondary: {
      main: secondaryColor,
    },
    background: {
      default: pageBackground,
      paper: containerBackground,
    },
    text: {
      primary: '#212121',
      secondary: '#616161',
    },
  },
  typography: {
    fontFamily: 'Roboto, Arial, sans-serif',
    h4: {
      fontWeight: 600,
      color: primaryColor,
    },
    h5: {
      fontWeight: 600,
      color: '#333',
    },
    h6: {
      fontWeight: 600,
    },
  },
  components: {
    // The main app bar
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: primaryColor,
          boxShadow: 'none',
        },
        colorDefault: {
          backgroundColor: containerBackground,
          boxShadow: 'none',
          borderBottom: `1px solid ${outerBorderColor}`,
        }
      },
    },
    // The main "widget" containers on each page
    MuiPaper: {
      defaultProps: {
        elevation: 0,
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          border: `1px solid ${outerBorderColor}`,
          backgroundColor: '#ffffff', // White fill for papers
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        },
      },
    },
    // The inner "cards" (e.g., for each job)
    MuiCard: {
      defaultProps: {
        elevation: 0,
        variant: 'outlined',
      },
      styleOverrides: {
        root: {
          borderRadius: 6,
          border: `1px solid ${innerBorderColor}`,
          backgroundColor: '#ffffff', // White fill for inner cards
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        },
      },
    },
    // Buttons
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          textTransform: 'none',
          fontWeight: 600,
          padding: '10px 20px',
        },
        containedPrimary: {
          backgroundColor: primaryColor,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#0b3c8a',
            boxShadow: 'none',
          },
        },
        containedSecondary: {
          backgroundColor: secondaryColor,
          boxShadow: 'none',
          '&:hover': {
            backgroundColor: '#b91c1c',
            boxShadow: 'none',
          },
        },
      },
    },
    // Form fields
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 6,
            '& fieldset': {
              borderColor: innerBorderColor,
              borderWidth: '1px',
            },
            '&:hover fieldset': {
              borderColor: innerBorderColor,
            },
            '&.Mui-focused fieldset': {
              borderColor: innerBorderColor,
              borderWidth: '1px',
            },
          },
        },
      },
    },
    // Chips (for tags)
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
        colorSecondary: {
          backgroundColor: '#ffebee',
          color: secondaryColor,
        },
        colorWarning: {
          backgroundColor: '#fff3e0',
          color: '#f57c00',
        }
      }
    }
  },
});

export default theme;