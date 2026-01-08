import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Share,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Button, Card, TaxSummaryCard, TransactionList } from '../components';
import { colors, spacing, typography, gradients, borderRadius, shadows } from '../constants/theme';
import { formatPLN, getPIT38Breakdown } from '../services/taxCalculator';
import { saveCalculation, saveCarryForwardCosts } from '../services/storageService';
import type { RootStackParamList } from '../navigation/types';

type ResultsScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Results'>;
type ResultsScreenRouteProp = RouteProp<RootStackParamList, 'Results'>;

interface ResultsScreenProps {
  navigation: ResultsScreenNavigationProp;
  route: ResultsScreenRouteProp;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({ navigation, route }) => {
  const { calculation } = route.params;
  const [selectedYear, setSelectedYear] = useState<number | null>(
    calculation.years.length > 0 ? calculation.years[calculation.years.length - 1].year : null
  );
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedYearData = calculation.years.find(y => y.year === selectedYear);

  const handleSave = async () => {
    try {
      setSaving(true);
      await saveCalculation(calculation);
      
      // Save carry forward costs for each year
      for (const year of calculation.years) {
        if (year.carryForwardCosts > 0) {
          await saveCarryForwardCosts(year.year, year.carryForwardCosts);
        }
      }
      
      setSaved(true);
      Alert.alert('Zapisano', 'Obliczenia zostały zapisane.');
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się zapisać obliczeń.');
    } finally {
      setSaving(false);
    }
  };

  const handleShare = async () => {
    try {
      let message = `CryptoPodatki - Rozliczenie podatkowe\n\n`;
      
      for (const year of calculation.years) {
        message += `ROK ${year.year}\n`;
        message += `Przychód: ${formatPLN(year.revenue)}\n`;
        message += `Koszty: ${formatPLN(year.totalCosts)}\n`;
        message += `Dochód: ${formatPLN(year.income)}\n`;
        message += `PODATEK: ${formatPLN(year.tax)}\n`;
        
        if (year.carryForwardCosts > 0) {
          message += `Do przeniesienia: ${formatPLN(year.carryForwardCosts)}\n`;
        }
        message += '\n';
      }

      message += `\nStawka podatku: 19%`;
      message += `\nZeznanie: PIT-38`;

      await Share.share({
        message,
        title: 'Rozliczenie podatkowe kryptowalut',
      });
    } catch (error) {
      // User cancelled
    }
  };

  const handleNewCalculation = () => {
    navigation.popToTop();
  };

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Total Summary Card */}
          <Card variant="gold" style={styles.totalCard}>
            <View style={styles.totalHeader}>
              <Text style={styles.totalTitle}>Podsumowanie</Text>
              <Text style={styles.calculationName}>{calculation.name}</Text>
            </View>

            <View style={styles.totalGrid}>
              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>Całkowity przychód</Text>
                <Text style={styles.totalValue}>{formatPLN(calculation.totalRevenue)}</Text>
              </View>
              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>Całkowite koszty</Text>
                <Text style={styles.totalValue}>{formatPLN(calculation.totalCosts)}</Text>
              </View>
              <View style={styles.totalItem}>
                <Text style={styles.totalLabel}>Całkowity dochód</Text>
                <Text style={[styles.totalValue, styles.incomeValue]}>
                  {formatPLN(calculation.totalIncome)}
                </Text>
              </View>
            </View>

            <View style={[styles.taxBox, shadows.lg]}>
              <Text style={styles.taxLabel}>ŁĄCZNY PODATEK DO ZAPŁATY</Text>
              <Text style={styles.taxValue}>{formatPLN(calculation.totalTax)}</Text>
            </View>
          </Card>

          {/* Year Selector */}
          {calculation.years.length > 1 && (
            <View style={styles.yearSelector}>
              <Text style={styles.sectionTitle}>Wybierz rok podatkowy</Text>
              <View style={styles.yearButtons}>
                {calculation.years.map((year) => (
                  <Button
                    key={year.year}
                    title={year.year.toString()}
                    variant={selectedYear === year.year ? 'primary' : 'outline'}
                    size="sm"
                    onPress={() => setSelectedYear(year.year)}
                    style={styles.yearButton}
                  />
                ))}
              </View>
            </View>
          )}

          {/* Selected Year Details */}
          {selectedYearData && (
            <>
              <TaxSummaryCard taxYear={selectedYearData} showDetails />

              {/* PIT-38 Section */}
              <Card variant="elevated" style={styles.pit38Card}>
                <Text style={styles.pit38Title}>📋 Dane do PIT-38</Text>
                
                {(() => {
                  const breakdown = getPIT38Breakdown(selectedYearData);
                  return (
                    <View style={styles.pit38Grid}>
                      <View style={styles.pit38Row}>
                        <View style={styles.pit38Box}>
                          <Text style={styles.pit38Label}>Przychód</Text>
                          <Text style={styles.pit38Value}>
                            {formatPLN(selectedYearData.revenue)}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.pit38Row}>
                        <View style={styles.pit38Box}>
                          <Text style={styles.pit38Label}>Kolumna c</Text>
                          <Text style={styles.pit38Sublabel}>Koszty {selectedYearData.year}</Text>
                          <Text style={styles.pit38Value}>
                            {formatPLN(breakdown.columnC)}
                          </Text>
                        </View>
                        <View style={styles.pit38Box}>
                          <Text style={styles.pit38Label}>Kolumna d</Text>
                          <Text style={styles.pit38Sublabel}>Koszty z lat ubiegłych</Text>
                          <Text style={styles.pit38Value}>
                            {formatPLN(breakdown.columnD)}
                          </Text>
                        </View>
                      </View>
                      
                      <View style={styles.pit38Row}>
                        <View style={styles.pit38Box}>
                          <Text style={styles.pit38Label}>Dochód</Text>
                          <Text style={[styles.pit38Value, { color: colors.success }]}>
                            {formatPLN(selectedYearData.income)}
                          </Text>
                        </View>
                        <View style={styles.pit38Box}>
                          <Text style={styles.pit38Label}>Kolumna f</Text>
                          <Text style={styles.pit38Sublabel}>Niepotrącone</Text>
                          <Text style={[styles.pit38Value, { color: colors.warning }]}>
                            {formatPLN(breakdown.columnF)}
                          </Text>
                        </View>
                      </View>

                      <View style={styles.pit38Row}>
                        <View style={[styles.pit38Box, styles.taxResultBox]}>
                          <Text style={styles.pit38Label}>Podatek 19%</Text>
                          <Text style={[styles.pit38Value, styles.pit38Tax]}>
                            {formatPLN(selectedYearData.tax)}
                          </Text>
                        </View>
                      </View>
                    </View>
                  );
                })()}
              </Card>

              {/* Transaction Lists */}
              {selectedYearData.taxableTransactions.length > 0 && (
                <TransactionList
                  transactions={selectedYearData.taxableTransactions}
                  title="Transakcje odpłatnego zbycia (przychód)"
                />
              )}

              {selectedYearData.acquisitionTransactions.length > 0 && (
                <TransactionList
                  transactions={selectedYearData.acquisitionTransactions.slice(0, 10)}
                  title={`Transakcje nabycia (koszty) - ${Math.min(10, selectedYearData.acquisitionTransactions.length)} z ${selectedYearData.acquisitionTransactions.length}`}
                />
              )}
            </>
          )}

          {/* Disclaimer */}
          <Card style={styles.disclaimerCard}>
            <Text style={styles.disclaimerTitle}>⚠️ Ważne informacje</Text>
            <Text style={styles.disclaimerText}>
              • Obliczenia mają charakter poglądowy{'\n'}
              • Przed złożeniem zeznania zweryfikuj dane{'\n'}
              • W razie wątpliwości skonsultuj się z doradcą podatkowym{'\n'}
              • Termin złożenia PIT-38: 15.02 - 30.04
            </Text>
          </Card>
        </ScrollView>

        {/* Bottom Actions */}
        <View style={styles.bottomContainer}>
          <View style={styles.buttonRow}>
            <Button
              title="Udostępnij"
              variant="outline"
              onPress={handleShare}
              style={styles.actionButton}
            />
            <Button
              title={saved ? "✓ Zapisano" : "Zapisz"}
              variant="secondary"
              onPress={handleSave}
              loading={saving}
              disabled={saved}
              style={styles.actionButton}
            />
          </View>
          <Button
            title="Nowe obliczenie"
            onPress={handleNewCalculation}
          />
        </View>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl + 140,
  },
  totalCard: {
    marginBottom: spacing.xl,
  },
  totalHeader: {
    marginBottom: spacing.lg,
  },
  totalTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.backgroundDark,
  },
  calculationName: {
    fontSize: typography.sizes.sm,
    color: colors.backgroundDark + 'AA',
    marginTop: spacing.xs,
  },
  totalGrid: {
    marginBottom: spacing.lg,
  },
  totalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  totalLabel: {
    fontSize: typography.sizes.md,
    color: colors.backgroundDark + 'CC',
  },
  totalValue: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.backgroundDark,
  },
  incomeValue: {
    color: colors.success,
  },
  taxBox: {
    backgroundColor: colors.backgroundDark,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
  },
  taxLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    letterSpacing: 1,
    marginBottom: spacing.sm,
  },
  taxValue: {
    fontSize: typography.sizes.display,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  yearSelector: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  yearButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  yearButton: {
    minWidth: 80,
  },
  pit38Card: {
    marginBottom: spacing.xl,
  },
  pit38Title: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  pit38Grid: {
    gap: spacing.md,
  },
  pit38Row: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pit38Box: {
    flex: 1,
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
  },
  taxResultBox: {
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  pit38Label: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  pit38Sublabel: {
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    marginTop: 2,
  },
  pit38Value: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.bold,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  pit38Tax: {
    color: colors.primary,
    fontSize: typography.sizes.xl,
  },
  disclaimerCard: {
    backgroundColor: colors.error + '10',
    borderColor: colors.error + '30',
    marginTop: spacing.md,
  },
  disclaimerTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.error,
    marginBottom: spacing.sm,
  },
  disclaimerText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 22,
  },
  bottomContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.lg,
    backgroundColor: colors.backgroundDark,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});

