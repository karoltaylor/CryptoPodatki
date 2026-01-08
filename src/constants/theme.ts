// Elegant dark theme with gold/amber accents - inspired by financial apps
export const colors = {
  // Primary colors
  primary: '#D4AF37',      // Gold
  primaryDark: '#B8860B',  // Dark Goldenrod
  primaryLight: '#F4E4BA', // Light Gold
  
  // Background gradients
  backgroundDark: '#0D0D0D',
  backgroundMedium: '#1A1A1A',
  backgroundLight: '#262626',
  backgroundCard: '#1F1F1F',
  
  // Surface colors
  surface: '#2A2A2A',
  surfaceElevated: '#333333',
  
  // Text colors
  textPrimary: '#FFFFFF',
  textSecondary: '#B3B3B3',
  textMuted: '#666666',
  textGold: '#D4AF37',
  
  // Semantic colors
  success: '#34C759',
  successLight: '#30D158',
  error: '#FF453A',
  errorLight: '#FF6961',
  warning: '#FF9F0A',
  info: '#64D2FF',
  
  // Transaction type colors
  buy: '#34C759',
  sell: '#FF9F0A',
  swap: '#64D2FF',
  fee: '#FF453A',
  
  // Border & Dividers
  border: '#3A3A3A',
  borderLight: '#444444',
  divider: '#2C2C2C',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
};

export const gradients = {
  primary: ['#D4AF37', '#B8860B'],
  background: ['#0D0D0D', '#1A1A1A', '#0D0D0D'],
  card: ['#1F1F1F', '#2A2A2A'],
  success: ['#34C759', '#30A14E'],
  gold: ['#F4E4BA', '#D4AF37', '#B8860B'],
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  round: 9999,
};

export const typography = {
  // Font families - using system fonts with fallbacks
  fontFamily: {
    regular: 'System',
    medium: 'System',
    bold: 'System',
    mono: 'Courier',
  },
  
  // Font sizes
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 28,
    xxxl: 36,
    display: 48,
  },
  
  // Line heights
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
  
  // Font weights
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  gold: {
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const animations = {
  timing: {
    fast: 150,
    normal: 300,
    slow: 500,
  },
};

