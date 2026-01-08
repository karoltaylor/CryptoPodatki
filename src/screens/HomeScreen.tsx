import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Button, Card, FilePickerButton } from '../components';
import { colors, spacing, typography, gradients, borderRadius } from '../constants/theme';
import { pickFile, parseFile } from '../services/fileParser';
import { getCalculations, getStorageInfo } from '../services/storageService';
import type { RootStackParamList } from '../navigation/types';
import type { ParsedFile, SavedCalculation } from '../types';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const [loading, setLoading] = useState(false);
  const [recentCalculations, setRecentCalculations] = useState<SavedCalculation[]>([]);
  const [storageInfo, setStorageInfo] = useState<{ calculationCount: number; hasCarryForwardCosts: boolean } | null>(null);

  useEffect(() => {
    loadRecentData();
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadRecentData();
    });
    return unsubscribe;
  }, [navigation]);

  const loadRecentData = async () => {
    const calculations = await getCalculations();
    setRecentCalculations(calculations.slice(-3).reverse());
    const info = await getStorageInfo();
    setStorageInfo(info);
  };

  const handleFilePick = async () => {
    try {
      setLoading(true);
      const file = await pickFile();

      if (file) {
        const parsedFile = await parseFile(file.uri, file.name, file.type);
        
        if (parsedFile.parseErrors.length > 0 && parsedFile.transactions.length === 0) {
          Alert.alert(
            'Błąd parsowania',
            parsedFile.parseErrors.join('\n'),
            [{ text: 'OK' }]
          );
          return;
        }

        navigation.navigate('Import', { parsedFile });
      }
    } catch (error) {
      Alert.alert(
        'Błąd',
        'Nie udało się wczytać pliku. Sprawdź format pliku.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoading(false);
    }
  };

  const formatPLN = (amount: number) => {
    return new Intl.NumberFormat('pl-PL', {
      style: 'currency',
      currency: 'PLN',
    }).format(amount);
  };

  return (
    <LinearGradient
      colors={gradients.background}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <SafeAreaView style={styles.safeArea}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.logo}>₿</Text>
            <Text style={styles.title}>CryptoPodatki</Text>
            <Text style={styles.subtitle}>
              Kalkulator podatku od kryptowalut
            </Text>
          </View>

          {/* Main Action */}
          <View style={styles.mainAction}>
            <FilePickerButton onPress={handleFilePick} loading={loading} />
          </View>

          {/* Tax Info Card */}
          <Card variant="gradient" style={styles.infoCard}>
            <Text style={styles.infoTitle}>📋 PIT-38</Text>
            <Text style={styles.infoText}>
              Zeznanie podatkowe dla kryptowalut składasz od 15 lutego do 30 kwietnia roku następującego po roku podatkowym.
            </Text>
            <View style={styles.taxRateContainer}>
              <Text style={styles.taxRateLabel}>Stawka podatku</Text>
              <Text style={styles.taxRateValue}>19%</Text>
            </View>
          </Card>

          {/* Recent Calculations */}
          {recentCalculations.length > 0 && (
            <View style={styles.recentSection}>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Ostatnie obliczenia</Text>
                <Button
                  title="Zobacz wszystkie"
                  variant="ghost"
                  size="sm"
                  onPress={() => navigation.navigate('History')}
                />
              </View>

              {recentCalculations.map((calc) => (
                <Card key={calc.id} style={styles.recentCard}>
                  <View style={styles.recentCardHeader}>
                    <Text style={styles.recentCardName}>{calc.name}</Text>
                    <Text style={styles.recentCardDate}>
                      {new Date(calc.createdAt).toLocaleDateString('pl-PL')}
                    </Text>
                  </View>
                  {calc.summary.map((year) => (
                    <View key={year.year} style={styles.recentYearRow}>
                      <Text style={styles.recentYear}>{year.year}</Text>
                      <Text style={styles.recentTax}>
                        Podatek: {formatPLN(year.tax)}
                      </Text>
                    </View>
                  ))}
                </Card>
              ))}
            </View>
          )}

          {/* Quick Tips */}
          <View style={styles.tipsSection}>
            <Text style={styles.sectionTitle}>💡 Warto wiedzieć</Text>
            
            <Card style={styles.tipCard}>
              <Text style={styles.tipTitle}>Wymiana crypto-crypto</Text>
              <Text style={styles.tipText}>
                Wymiana między kryptowalutami NIE podlega opodatkowaniu.
              </Text>
            </Card>

            <Card style={styles.tipCard}>
              <Text style={styles.tipTitle}>Koszty do przeniesienia</Text>
              <Text style={styles.tipText}>
                Nadwyżka kosztów nad przychodami zostaje przeniesiona na następny rok podatkowy.
              </Text>
            </Card>

            <Card style={styles.tipCard}>
              <Text style={styles.tipTitle}>Kursy walut</Text>
              <Text style={styles.tipText}>
                Transakcje w walutach obcych przeliczamy według kursu NBP z dnia poprzedzającego transakcję.
              </Text>
            </Card>
          </View>

          {/* Storage Info */}
          {storageInfo && storageInfo.calculationCount > 0 && (
            <View style={styles.storageInfo}>
              <Text style={styles.storageText}>
                Zapisane obliczenia: {storageInfo.calculationCount}
              </Text>
            </View>
          )}
        </ScrollView>
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
    paddingBottom: spacing.xxl,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  logo: {
    fontSize: 64,
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: typography.sizes.xxxl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
  },
  mainAction: {
    marginBottom: spacing.xl,
  },
  infoCard: {
    marginBottom: spacing.xl,
  },
  infoTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 20,
    marginBottom: spacing.md,
  },
  taxRateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.backgroundDark + '80',
    padding: spacing.md,
    borderRadius: borderRadius.md,
  },
  taxRateLabel: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  taxRateValue: {
    fontSize: typography.sizes.xxl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
  },
  recentSection: {
    marginBottom: spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  recentCard: {
    marginBottom: spacing.sm,
  },
  recentCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  recentCardName: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  recentCardDate: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
  recentYearRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recentYear: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  recentTax: {
    fontSize: typography.sizes.sm,
    color: colors.primary,
    fontWeight: typography.weights.medium,
  },
  tipsSection: {
    marginBottom: spacing.xl,
  },
  tipCard: {
    marginBottom: spacing.sm,
  },
  tipTitle: {
    fontSize: typography.sizes.md,
    fontWeight: typography.weights.semibold,
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  tipText: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  storageInfo: {
    alignItems: 'center',
  },
  storageText: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
  },
});

