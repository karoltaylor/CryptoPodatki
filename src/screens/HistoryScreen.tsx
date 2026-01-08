import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Card, Button } from '../components';
import { colors, spacing, typography, gradients, borderRadius } from '../constants/theme';
import { 
  getCalculations, 
  getCalculationById, 
  deleteCalculation,
  clearAllData 
} from '../services/storageService';
import { formatPLN } from '../services/taxCalculator';
import type { RootStackParamList } from '../navigation/types';
import type { SavedCalculation } from '../types';

type HistoryScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'History'>;

interface HistoryScreenProps {
  navigation: HistoryScreenNavigationProp;
}

export const HistoryScreen: React.FC<HistoryScreenProps> = ({ navigation }) => {
  const [calculations, setCalculations] = useState<SavedCalculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadCalculations = useCallback(async () => {
    const data = await getCalculations();
    setCalculations(data.reverse()); // Most recent first
    setLoading(false);
    setRefreshing(false);
  }, []);

  useEffect(() => {
    loadCalculations();
  }, [loadCalculations]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      loadCalculations();
    });
    return unsubscribe;
  }, [navigation, loadCalculations]);

  const handleViewCalculation = async (id: string) => {
    try {
      setLoading(true);
      const calculation = await getCalculationById(id);
      
      if (calculation) {
        navigation.navigate('Results', { calculation });
      } else {
        Alert.alert('Błąd', 'Nie udało się wczytać obliczeń.');
      }
    } catch (error) {
      Alert.alert('Błąd', 'Wystąpił problem podczas wczytywania obliczeń.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCalculation = (id: string, name: string) => {
    Alert.alert(
      'Usuń obliczenie',
      `Czy na pewno chcesz usunąć "${name}"?`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCalculation(id);
              loadCalculations();
            } catch (error) {
              Alert.alert('Błąd', 'Nie udało się usunąć obliczeń.');
            }
          },
        },
      ]
    );
  };

  const handleClearAll = () => {
    Alert.alert(
      'Wyczyść wszystkie dane',
      'Czy na pewno chcesz usunąć wszystkie zapisane obliczenia? Tej operacji nie można cofnąć.',
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Wyczyść',
          style: 'destructive',
          onPress: async () => {
            try {
              await clearAllData();
              loadCalculations();
            } catch (error) {
              Alert.alert('Błąd', 'Nie udało się wyczyścić danych.');
            }
          },
        },
      ]
    );
  };

  const renderCalculation = ({ item }: { item: SavedCalculation }) => {
    const totalTax = item.summary.reduce((sum, y) => sum + y.tax, 0);
    const years = item.summary.map(y => y.year).join(', ');

    return (
      <TouchableOpacity
        onPress={() => handleViewCalculation(item.id)}
        onLongPress={() => handleDeleteCalculation(item.id, item.name)}
        activeOpacity={0.8}
      >
        <Card variant="elevated" style={styles.calculationCard}>
          <View style={styles.cardHeader}>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardDate}>
                {new Date(item.createdAt).toLocaleDateString('pl-PL', {
                  day: 'numeric',
                  month: 'long',
                  year: 'numeric',
                })}
              </Text>
            </View>
            <View style={styles.cardTax}>
              <Text style={styles.taxLabel}>Podatek</Text>
              <Text style={styles.taxAmount}>{formatPLN(totalTax)}</Text>
            </View>
          </View>

          <View style={styles.yearsSummary}>
            {item.summary.map((year) => (
              <View key={year.year} style={styles.yearChip}>
                <Text style={styles.yearChipText}>{year.year}</Text>
                <Text style={styles.yearChipAmount}>
                  {formatPLN(year.tax)}
                </Text>
              </View>
            ))}
          </View>

          <Text style={styles.hintText}>
            Dotknij, aby zobaczyć szczegóły • Przytrzymaj, aby usunąć
          </Text>
        </Card>
      </TouchableOpacity>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📊</Text>
      <Text style={styles.emptyTitle}>Brak zapisanych obliczeń</Text>
      <Text style={styles.emptyText}>
        Wczytaj pliki z transakcjami i oblicz podatek, aby zobaczyć historię obliczeń.
      </Text>
      <Button
        title="Wczytaj plik"
        onPress={() => navigation.navigate('Home')}
        style={styles.emptyButton}
      />
    </View>
  );

  return (
    <LinearGradient colors={gradients.background} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <FlatList
          data={calculations}
          keyExtractor={(item) => item.id}
          renderItem={renderCalculation}
          contentContainerStyle={[
            styles.listContent,
            calculations.length === 0 && styles.emptyListContent,
          ]}
          ListEmptyComponent={!loading ? renderEmptyState : null}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => {
                setRefreshing(true);
                loadCalculations();
              }}
              tintColor={colors.primary}
              colors={[colors.primary]}
            />
          }
          ListFooterComponent={
            calculations.length > 0 ? (
              <View style={styles.footer}>
                <Button
                  title="Wyczyść wszystkie"
                  variant="ghost"
                  onPress={handleClearAll}
                />
              </View>
            ) : null
          }
        />
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
  listContent: {
    padding: spacing.lg,
  },
  emptyListContent: {
    flex: 1,
    justifyContent: 'center',
  },
  calculationCard: {
    marginBottom: spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: typography.sizes.lg,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  cardDate: {
    fontSize: typography.sizes.sm,
    color: colors.textMuted,
    marginTop: spacing.xs,
  },
  cardTax: {
    alignItems: 'flex-end',
  },
  taxLabel: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textTransform: 'uppercase',
  },
  taxAmount: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.bold,
    color: colors.primary,
    marginTop: spacing.xs,
  },
  yearsSummary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  yearChip: {
    backgroundColor: colors.backgroundLight,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  yearChipText: {
    fontSize: typography.sizes.sm,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
  },
  yearChipAmount: {
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  hintText: {
    fontSize: typography.sizes.xs,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.sizes.xl,
    fontWeight: typography.weights.semibold,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  emptyButton: {
    minWidth: 200,
  },
  footer: {
    marginTop: spacing.xl,
    alignItems: 'center',
  },
});

