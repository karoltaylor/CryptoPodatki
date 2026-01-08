import AsyncStorage from '@react-native-async-storage/async-storage';
import { STORAGE_KEYS } from '../constants';
import type { TaxCalculation, SavedCalculation } from '../types';

/**
 * Saves a tax calculation to storage
 */
export async function saveCalculation(calculation: TaxCalculation): Promise<void> {
  try {
    // Get existing calculations
    const existing = await getCalculations();
    
    // Check if this calculation already exists (by ID)
    const existingIndex = existing.findIndex(c => c.id === calculation.id);
    
    // Create a lightweight summary for storage
    const summary: SavedCalculation = {
      id: calculation.id,
      name: calculation.name,
      createdAt: calculation.createdAt.toISOString(),
      summary: calculation.years.map(y => ({
        year: y.year,
        revenue: y.revenue,
        income: y.income,
        tax: y.tax,
      })),
    };

    if (existingIndex >= 0) {
      existing[existingIndex] = summary;
    } else {
      existing.push(summary);
    }

    // Save the list
    await AsyncStorage.setItem(
      STORAGE_KEYS.CALCULATIONS,
      JSON.stringify(existing)
    );

    // Also save the full calculation for later retrieval
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.CALCULATIONS}_${calculation.id}`,
      JSON.stringify({
        ...calculation,
        createdAt: calculation.createdAt.toISOString(),
        updatedAt: calculation.updatedAt.toISOString(),
      })
    );
  } catch (error) {
    console.error('Error saving calculation:', error);
    throw new Error('Nie udało się zapisać obliczeń');
  }
}

/**
 * Gets all saved calculation summaries
 */
export async function getCalculations(): Promise<SavedCalculation[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CALCULATIONS);
    if (!data) return [];
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting calculations:', error);
    return [];
  }
}

/**
 * Gets a specific calculation by ID with full details
 */
export async function getCalculationById(id: string): Promise<TaxCalculation | null> {
  try {
    const data = await AsyncStorage.getItem(`${STORAGE_KEYS.CALCULATIONS}_${id}`);
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    
    // Convert date strings back to Date objects
    return {
      ...parsed,
      createdAt: new Date(parsed.createdAt),
      updatedAt: new Date(parsed.updatedAt),
      years: parsed.years.map((y: Record<string, unknown>) => ({
        ...y,
        taxableTransactions: (y.taxableTransactions as Array<Record<string, unknown>>).map((t: Record<string, unknown>) => ({
          ...t,
          date: new Date(t.date as string),
        })),
        acquisitionTransactions: (y.acquisitionTransactions as Array<Record<string, unknown>>).map((t: Record<string, unknown>) => ({
          ...t,
          date: new Date(t.date as string),
        })),
      })),
      files: parsed.files.map((f: Record<string, unknown>) => ({
        ...f,
        parsedAt: new Date(f.parsedAt as string),
        transactions: (f.transactions as Array<Record<string, unknown>>).map((t: Record<string, unknown>) => ({
          ...t,
          date: new Date(t.date as string),
        })),
      })),
    };
  } catch (error) {
    console.error('Error getting calculation by ID:', error);
    return null;
  }
}

/**
 * Deletes a calculation by ID
 */
export async function deleteCalculation(id: string): Promise<void> {
  try {
    // Get existing calculations
    const existing = await getCalculations();
    const filtered = existing.filter(c => c.id !== id);
    
    // Save the updated list
    await AsyncStorage.setItem(
      STORAGE_KEYS.CALCULATIONS,
      JSON.stringify(filtered)
    );

    // Remove the full calculation
    await AsyncStorage.removeItem(`${STORAGE_KEYS.CALCULATIONS}_${id}`);
  } catch (error) {
    console.error('Error deleting calculation:', error);
    throw new Error('Nie udało się usunąć obliczeń');
  }
}

/**
 * Saves carry forward costs for future tax years
 */
export async function saveCarryForwardCosts(
  year: number,
  amount: number
): Promise<void> {
  try {
    const existing = await getCarryForwardCosts();
    existing[year] = amount;
    await AsyncStorage.setItem(
      STORAGE_KEYS.CARRY_FORWARD_COSTS,
      JSON.stringify(existing)
    );
  } catch (error) {
    console.error('Error saving carry forward costs:', error);
    throw new Error('Nie udało się zapisać kosztów do przeniesienia');
  }
}

/**
 * Gets carry forward costs from previous years
 */
export async function getCarryForwardCosts(): Promise<Record<number, number>> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.CARRY_FORWARD_COSTS);
    if (!data) return {};
    return JSON.parse(data);
  } catch (error) {
    console.error('Error getting carry forward costs:', error);
    return {};
  }
}

/**
 * Gets the most recent carry forward cost (for the year before the given year)
 */
export async function getLatestCarryForwardCost(forYear: number): Promise<number> {
  const costs = await getCarryForwardCosts();
  return costs[forYear - 1] || 0;
}

/**
 * Clears all stored data
 */
export async function clearAllData(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cryptoPodatkiKeys = keys.filter(k => k.startsWith('@cryptopodatki'));
    await AsyncStorage.multiRemove(cryptoPodatkiKeys);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw new Error('Nie udało się wyczyścić danych');
  }
}

/**
 * Gets storage usage info
 */
export async function getStorageInfo(): Promise<{
  calculationCount: number;
  hasCarryForwardCosts: boolean;
}> {
  const calculations = await getCalculations();
  const carryForward = await getCarryForwardCosts();
  
  return {
    calculationCount: calculations.length,
    hasCarryForwardCosts: Object.keys(carryForward).length > 0,
  };
}

