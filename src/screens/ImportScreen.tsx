import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { Button, Card, TransactionList } from '../components';
import { colors, spacing, typography, gradients, borderRadius } from '../constants/theme';
import { calculateTax } from '../services/taxCalculator';
import { getLatestCarryForwardCost } from '../services/storageService';
import { validateTransactions, pickFile, parseFile } from '../services/fileParser';
import type { RootStackParamList } from '../navigation/types';
import type { ParsedFile } from '../types';

type ImportScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Import'>;
type ImportScreenRouteProp = RouteProp<RootStackParamList, 'Import'>;

interface ImportScreenProps {
  navigation: ImportScreenNavigationProp;
  route: ImportScreenRouteProp;
}

export const ImportScreen: React.FC<ImportScreenProps> = ({ navigation, route }) => {
  const [files, setFiles] = useState<ParsedFile[]>([route.params.parsedFile]);
  const [calculationName, setCalculationName] = useState('');
  const [carryForwardCosts, setCarryForwardCosts] = useState('0');
  const [loading, setLoading] = useState(false);
  const [showCarryForwardInput, setShowCarryForwardInput] = useState(false);

  const allTransactions = files.flatMap(f => f.transactions);
  const allErrors = files.flatMap(f => f.parseErrors);
  const validationErrors = validateTransactions(allTransactions);

  const handleAddFile = async () => {
    try {
      setLoading(true);
      const file = await pickFile();

      if (file) {
        const parsedFile = await parseFile(file.uri, file.name, file.type);
        setFiles([...files, parsedFile]);
      }
    } catch (error) {
      Alert.alert('Błąd', 'Nie udało się wczytać pliku.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFile = (index: number) => {
    if (files.length > 1) {
      setFiles(files.filter((_, i) => i !== index));
    }
  };

  const handleCalculate = async () => {
    if (allTransactions.length === 0) {
      Alert.alert('Brak danych', 'Nie znaleziono transakcji do przetworzenia.');
      return;
    }

    try {
      setLoading(true);

      // Get carry forward costs
      let previousCosts = parseFloat(carryForwardCosts) || 0;
      
      if (!showCarryForwardInput) {
        // Try to get from storage
        const years = allTransactions.map(t => t.date.getFullYear());
        const minYear = Math.min(...years);
        previousCosts = await getLatestCarryForwardCost(minYear);
      }

      const name = calculationName.trim() || `Obliczenie ${new Date().toLocaleDateString('pl-PL')}`;
      
      const calculation = await calculateTax(files, previousCosts, name);

      navigation.navigate('Results', { calculation });
    } catch (error) {
      Alert.alert(
        'Błąd obliczenia',
        'Wystąpił problem podczas obliczania podatku. Sprawdź poprawność danych.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const getTransactionStats = () => {
    const buys = allTransactions.filter(t => t.type === 'buy').length;
    const sells = allTransactions.filter(t => t.type === 'sell' || t.type === 'payment').length;
    const swaps = allTransactions.filter(t => t.type === 'crypto_swap').length;
    const other = allTransactions.length - buys - sells - swaps;

    return { buys, sells, swaps, other };
  };

  const stats = getTransactionStats();

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Files Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Wczytane pliki</Text>
            
            {files.map((file, index) => (
              <Card key={index} style={styles.fileCard}>
                <View style={styles.fileHeader}>
                  <Text style={styles.fileName}>{file.fileName}</Text>
                  <Text style={styles.fileType}>{file.fileType.toUpperCase()}</Text>
                </View>
                <View style={styles.fileStats}>
                  <Text style={styles.fileStat}>
                    {file.transactions.length} transakcji
                  </Text>
                  {file.parseErrors.length > 0 && (
                    <Text style={styles.fileErrors}>
                      ⚠️ {file.parseErrors.length} ostrzeżeń
                    </Text>
                  )}
                </View>
                {files.length > 1 && (
                  <Button
                    title="Usuń"
                    variant="ghost"
                    size="sm"
                    onPress={() => handleRemoveFile(index)}
                  />
                )}
              </Card>
            ))}

            <Button
              title="+ Dodaj kolejny plik"
              variant="outline"
              onPress={handleAddFile}
              loading={loading}
            />
          </View>

          {/* Transaction Summary */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Podsumowanie transakcji</Text>
            
            <Card variant="elevated">
              <View style={styles.statsGrid}>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: colors.success }]}>
                    {stats.buys}
                  </Text>
                  <Text style={styles.statLabel}>Kupno</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: colors.warning }]}>
                    {stats.sells}
                  </Text>
                  <Text style={styles.statLabel}>Sprzedaż</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: colors.info }]}>
                    {stats.swaps}
                  </Text>
                  <Text style={styles.statLabel}>Wymiana</Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={[styles.statNumber, { color: colors.textMuted }]}>
                    {stats.other}
                  </Text>
                  <Text style={styles.statLabel}>Inne</Text>
                </View>
              </View>

              {stats.swaps > 0 && (
                <View style={styles.infoBox}>
                  <Text style={styles.infoText}>
                    ℹ️ {stats.swaps} transakcji wymiany crypto-crypto nie podlega opodatkowaniu
                  </Text>
                </View>
              )}
            </Card>
          </View>

          {/* Errors/Warnings */}
          {(allErrors.length > 0 || validationErrors.length > 0) && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>⚠️ Ostrzeżenia</Text>
              <Card style={styles.warningCard}>
                {[...allErrors, ...validationErrors].map((error, index) => (
                  <Text key={index} style={styles.warningText}>
                    • {error}
                  </Text>
                ))}
              </Card>
            </View>
          )}

          {/* Carry Forward Costs */}
          <View style={styles.section}>
            <Button
              title={showCarryForwardInput 
                ? "Użyj zapisanych kosztów" 
                : "Mam koszty z lat ubiegłych"
              }
              variant="ghost"
              size="sm"
              onPress={() => setShowCarryForwardInput(!showCarryForwardInput)}
            />

            {showCarryForwardInput && (
              <Card style={styles.inputCard}>
                <Text style={styles.inputLabel}>
                  Koszty z lat ubiegłych do przeniesienia (PLN)
                </Text>
                <TextInput
                  style={styles.textInput}
                  value={carryForwardCosts}
                  onChangeText={setCarryForwardCosts}
                  keyboardType="numeric"
                  placeholder="0.00"
                  placeholderTextColor={colors.textMuted}
                />
                <Text style={styles.inputHint}>
                  Wprowadź kwotę z kolumny f poprzedniego zeznania PIT-38
                </Text>
              </Card>
            )}
          </View>

          {/* Calculation Name */}
          <View style={styles.section}>
            <Card style={styles.inputCard}>
              <Text style={styles.inputLabel}>Nazwa obliczenia (opcjonalnie)</Text>
              <TextInput
                style={styles.textInput}
                value={calculationName}
                onChangeText={setCalculationName}
                placeholder="np. Rozliczenie 2025"
                placeholderTextColor={colors.textMuted}
              />
            </Card>
          </View>

          {/* Recent Transactions Preview */}
          {allTransactions.length > 0 && (
            <TransactionList
              transactions={allTransactions.slice(0, 5)}
              title={`Ostatnie transakcje (${Math.min(5, allTransactions.length)} z ${allTransactions.length})`}
            />
          )}
        </ScrollView>

        {/* Fixed Bottom Button */}
        <View style={styles.bottomContainer}>
          <Button
            title="Oblicz podatek"
            onPress={handleCalculate}
            loading={loading}
            disabled={allTransactions.length === 0}
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
    paddingBottom: spacing.xxl + 80,
  },
  section: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  fileCard: {
    marginBottom: spacing.sm,
  },
  fileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  fileName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.medium,
    color: colors.textPrimary,
    flex: 1,
  },
  fileType: {
    fontSize: typography.sizes.xs,
    color: colors.primary,
    backgroundColor: colors.primary + '20',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    overflow: 'hidden',
  },
  fileStats: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  fileStat: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  fileErrors: {
    fontSize: typography.sizes.sm,
    color: colors.warning,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
  },
  statLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  infoBox: {
    backgroundColor: colors.info + '15',
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    marginTop: spacing.md,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.info,
  },
  warningCard: {
    backgroundColor: colors.warning + '15',
    borderColor: colors.warning + '30',
  },
  warningText: {
    fontSize: typography.sizes.sm,
    color: colors.warning,
    marginBottom: spacing.xs,
  },
  inputCard: {
    marginTop: spacing.sm,
  },
  inputLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginBottom: spacing.sm,
  },
  textInput: {
    backgroundColor: colors.backgroundLight,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.border,
  },
  inputHint: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    marginTop: spacing.sm,
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
});

