import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, borderRadius, shadows, gradients } from '../constants/theme';

interface CardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'gradient' | 'gold';
  style?: ViewStyle;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  style,
  padding = 'md',
}) => {
  const paddingValue = {
    none: 0,
    sm: spacing.sm,
    md: spacing.md,
    lg: spacing.lg,
  }[padding];

  if (variant === 'gradient' || variant === 'gold') {
    return (
      <LinearGradient
        colors={variant === 'gold' ? gradients.gold : gradients.card}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[
          styles.card,
          variant === 'gold' && shadows.gold,
          { padding: paddingValue },
          style,
        ]}
      >
        {children}
      </LinearGradient>
    );
  }

  return (
    <View
      style={[
        styles.card,
        variant === 'elevated' && styles.elevated,
        variant === 'elevated' && shadows.md,
        { padding: paddingValue },
        style,
      ]}
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.backgroundCard,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border,
  },
  elevated: {
    backgroundColor: colors.surfaceElevated,
  },
});

