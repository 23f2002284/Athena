// Color palette
const palette = {
  white: '#FFFFFF',
  black: '#000000',
  gray: {
    100: '#F7FAFC',
    200: '#EDF2F7',
    300: '#E2E8F0',
    400: '#CBD5E0',
    500: '#A0AEC0',
    600: '#718096',
    700: '#4A5568',
    800: '#2D3748',
    900: '#1A202C',
  },
  blue: {
    100: '#EBF8FF',
    200: '#BEE3F8',
    300: '#90CDF4',
    400: '#63B3ED',
    500: '#4299E1',
    600: '#3182CE',
    700: '#2B6CB0',
    800: '#2C5282',
    900: '#2A4365',
  },
  // Add more colors as needed
};

export const Colors = {
  light: {
    background: palette.white,
    card: palette.white,
    text: palette.gray[900],
    border: palette.gray[200],
    notification: '#FF3B30',
    primary: palette.blue[600],
    tint: palette.blue[500],
    tabIconDefault: palette.gray[500],
    tabIconSelected: palette.blue[600],
    ...palette,
  },
  dark: {
    background: palette.gray[900],
    card: palette.gray[800],
    text: palette.white,
    border: palette.gray[700],
    notification: '#FF453A',
    primary: palette.blue[400],
    tint: palette.blue[400],
    tabIconDefault: palette.gray[500],
    tabIconSelected: palette.blue[400],
    ...palette,
  },
};

export type ColorTheme = typeof Colors.light;
