import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { Card } from './Card';
import { colors, spacing, typography, borderRadius } from '../constants/theme';
import { TRANSACTION_TYPE_LABELS } from '../constants';
import type { Transaction } from '../types';

interface TransactionListProps {
  transactions: Transaction[];
  title?: string;
  emptyMessage?: string;
}

const TransactionItem: React.FC<{ transaction: Transaction }> = ({ transaction }) => {
  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pl-PL', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  };

  const formatAmount = (amount: number, currency: string) => {
    if (currency === 'PLN' || currency === 'USD' || currency === 'EUR') {
      return new Intl.NumberFormat('pl-PL', {
        style: 'currency',
        currency,
      }).format(amount);
    }
    return `${amount.toFixed(8)} ${currency}`;
  };

  const getTypeColor = () => {
    switch (transaction.type) {
      case 'buy':
        return colors.success;
      case 'sell':
      case 'payment':
        return colors.warning;
      case 'crypto_swap':
        return colors.info;
      case 'fee':
        return colors.error;
      default:
        return colors.textSecondary;
    }
  };

  return (
    <View style={styles.transactionItem}>
      <View style={styles.transactionLeft}>
        <View style={[styles.typeBadge, { backgroundColor: getTypeColor() + '20' }]}>
          <Text style={[styles.typeText, { color: getTypeColor() }]}>
            {TRANSACTION_TYPE_LABELS[transaction.type] || transaction.type}
          </Text>
        </View>
        <Text style={styles.date}>{formatDate(transaction.date)}</Text>
      </View>

      <View style={styles.transactionRight}>
        <Text style={styles.cryptoAmount}>
          {formatAmount(transaction.cryptoAmount, transaction.cryptoSymbol)}
        </Text>
        {transaction.fiatAmount > 0 && (
          <Text style={styles.fiatAmount}>
            {formatAmount(transaction.fiatAmount, transaction.fiatCurrency)}
          </Text>
        )}
        {transaction.amountInPLN && transaction.fiatCurrency !== 'PLN' && (
          <Text style={styles.plnAmount}>
            ≈ {new Intl.NumberFormat('pl-PL', {
              style: 'currency',
              currency: 'PLN',
            }).format(transaction.amountInPLN)}
          </Text>
        )}
      </View>
    </View>
  );
};

export const TransactionList: React.FC<TransactionListProps> = ({
  transactions,
  title,
  emptyMessage = 'Brak transakcji',
}) => {
  if (transactions.length === 0) {
    return (
      <Card style={styles.emptyCard}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </Card>
    );
  }

  return (
    <View style={styles.container}>
      {title && <Text style={styles.title}>{title}</Text>}
      <Card padding="none">
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => <TransactionItem transaction={item} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          scrollEnabled={false}
        />
      </Card>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: spacing.md,
  },
  transactionLeft: {
    flex: 1,
  },
  typeBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    marginBottom: spacing.xs,
  },
  typeText: {
    fontSize: typography.sizes.xs,
    fontWeight: typography.weights.semibold,
    textTransform: 'uppercase',
  },
  date: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  cryptoAmount: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  fiatAmount: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  plnAmount: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  separator: {
    height: 1,
    backgroundColor: colors.divider,
  },
  emptyCard: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.textMuted,
  },
});

