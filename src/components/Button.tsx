import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, borderRadius, typography, shadows, gradients } from '../constants/theme';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
}) => {
  const isDisabled = disabled || loading;

  const sizeStyles: Record<string, { container: ViewStyle; text: TextStyle }> = {
    sm: {
      container: { paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
      text: { fontSize: typography.sizes.sm },
    },
    md: {
      container: { paddingVertical: spacing.md, paddingHorizontal: spacing.lg },
      text: { fontSize: typography.sizes.md },
    },
    lg: {
      container: { paddingVertical: spacing.lg, paddingHorizontal: spacing.xl },
      text: { fontSize: typography.sizes.lg },
    },
  };

  const renderContent = () => (
    <>
      {loading ? (
        <ActivityIndicator
          color={variant === 'primary' ? colors.backgroundDark : colors.primary}
          size="small"
        />
      ) : (
        <>
          {icon && <>{icon}</>}
          <Text
            style={[
              styles.text,
              sizeStyles[size].text,
              variant === 'primary' && styles.textPrimary,
              variant === 'secondary' && styles.textSecondary,
              variant === 'outline' && styles.textOutline,
              variant === 'ghost' && styles.textGhost,
              isDisabled && styles.textDisabled,
              icon && { marginLeft: spacing.sm },
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </>
  );

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[style]}
      >
        <LinearGradient
          colors={isDisabled ? [colors.surface, colors.surface] : gradients.primary}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[
            styles.container,
            sizeStyles[size].container,
            isDisabled && styles.disabled,
            shadows.gold,
          ]}
        >
          {renderContent()}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.container,
        sizeStyles[size].container,
        variant === 'secondary' && styles.secondaryContainer,
        variant === 'outline' && styles.outlineContainer,
        variant === 'ghost' && styles.ghostContainer,
        isDisabled && styles.disabled,
        style,
      ]}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.md,
  },
  secondaryContainer: {
    backgroundColor: colors.surface,
  },
  outlineContainer: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  ghostContainer: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontWeight: typography.weights.semibold,
  },
  textPrimary: {
    color: colors.backgroundDark,
  },
  textSecondary: {
    color: colors.textPrimary,
  },
  textOutline: {
    color: colors.primary,
  },
  textGhost: {
    color: colors.primary,
  },
  textDisabled: {
    color: colors.textMuted,
  },
});

