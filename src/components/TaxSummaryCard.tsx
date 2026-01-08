import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Card } from './Card';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { formatPLN } from '../services/taxCalculator';
import type { TaxYear } from '../types';

interface TaxSummaryCardProps {
  taxYear: TaxYear;
  showDetails?: boolean;
}

export const TaxSummaryCard: React.FC<TaxSummaryCardProps> = ({
  taxYear,
  showDetails = false,
}) => {
  return (
    <Card variant="elevated" style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.yearLabel}>Rok podatkowy</Text>
        <Text style={styles.year}>{taxYear.year}</Text>
      </View>

      <View style={styles.mainStats}>
        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Przychód</Text>
          <Text style={[styles.statValue, styles.revenue]}>
            {formatPLN(taxYear.revenue)}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Dochód</Text>
          <Text style={[styles.statValue, styles.income]}>
            {formatPLN(taxYear.income)}
          </Text>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <Text style={styles.statLabel}>Podatek</Text>
          <Text style={[styles.statValue, styles.tax]}>
            {formatPLN(taxYear.tax)}
          </Text>
        </View>
      </View>

      {showDetails && (
        <>
          <View style={styles.separator} />
          
          <View style={styles.details}>
            <Text style={styles.detailsTitle}>Szczegóły kosztów (PIT-38)</Text>
            
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Koszty poniesione w {taxYear.year} (kol. c)
              </Text>
              <Text style={styles.detailValue}>
                {formatPLN(taxYear.currentYearCosts)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Koszty z lat ubiegłych (kol. d)
              </Text>
              <Text style={styles.detailValue}>
                {formatPLN(taxYear.previousYearsCosts)}
              </Text>
            </View>

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>
                Suma kosztów
              </Text>
              <Text style={styles.detailValue}>
                {formatPLN(taxYear.totalCosts)}
              </Text>
            </View>

            {taxYear.carryForwardCosts > 0 && (
              <View style={[styles.detailRow, styles.carryForward]}>
                <Text style={[styles.detailLabel, styles.carryForwardText]}>
                  Do przeniesienia na {taxYear.year + 1} (kol. f)
                </Text>
                <Text style={[styles.detailValue, styles.carryForwardText]}>
                  {formatPLN(taxYear.carryForwardCosts)}
                </Text>
              </View>
            )}
          </View>

          <View style={styles.separator} />

          <View style={styles.transactionCounts}>
            <View style={styles.countItem}>
              <Text style={styles.countValue}>
                {taxYear.taxableTransactions.length}
              </Text>
              <Text style={styles.countLabel}>Transakcji sprzedaży</Text>
            </View>
            <View style={styles.countItem}>
              <Text style={styles.countValue}>
                {taxYear.acquisitionTransactions.length}
              </Text>
              <Text style={styles.countLabel}>Transakcji kupna</Text>
            </View>
          </View>
        </>
      )}

      <View style={styles.taxRate}>
        <Text style={styles.taxRateText}>Stawka podatku: 19%</Text>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  yearLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  year: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  mainStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: colors.border,
  },
  revenue: {
    color: colors.textPrimary,
  },
  income: {
    color: colors.success,
  },
  tax: {
    color: colors.primary,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
    marginVertical: spacing.md,
  },
  details: {
    gap: spacing.sm,
  },
  detailsTitle: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    fontWeight: typography.weights.medium,
  },
  carryForward: {
    backgroundColor: colors.warning + '20',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.xs,
  },
  carryForwardText: {
    color: colors.warning,
  },
  transactionCounts: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  countItem: {
    alignItems: 'center',
  },
  countValue: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
  },
  countLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  taxRate: {
    marginTop: spacing.md,
    alignItems: 'center',
  },
  taxRateText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
  },
});

