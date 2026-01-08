import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { colors, spacing, borderRadius, typography, gradients } from '../constants/theme';

interface FilePickerButtonProps {
  onPress: () => void;
  loading?: boolean;
}

export const FilePickerButton: React.FC<FilePickerButtonProps> = ({
  onPress,
  loading = false,
}) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.8}
      style={styles.container}
    >
      <LinearGradient
        colors={[colors.backgroundLight, colors.backgroundCard]}
        style={styles.gradient}
      >
        <View style={styles.iconContainer}>
          <LinearGradient
            colors={gradients.gold}
            style={styles.iconGradient}
          >
            <Text style={styles.icon}>📁</Text>
          </LinearGradient>
        </View>

        <Text style={styles.title}>
          {loading ? 'Wczytywanie...' : 'Wybierz plik'}
        </Text>

        <Text style={styles.subtitle}>
          CSV, XLSX lub PDF
        </Text>

        <View style={styles.supportedFormats}>
          <View style={styles.formatBadge}>
            <Text style={styles.formatText}>Binance</Text>
          </View>
          <View style={styles.formatBadge}>
            <Text style={styles.formatText}>Kraken</Text>
          </View>
          <View style={styles.formatBadge}>
            <Text style={styles.formatText}>Coinbase</Text>
          </View>
          <View style={styles.formatBadge}>
            <Text style={styles.formatText}>Zonda</Text>
          </View>
        </View>

        <Text style={styles.hint}>
          Wyeksportuj historię transakcji ze swojej giełdy
        </Text>
      </LinearGradient>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.xl,
    borderWidth: 2,
    borderColor: colors.border,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  gradient: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: spacing.md,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  supportedFormats: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  formatBadge: {
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  formatText: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  hint: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
});

