import { NBP_API_BASE } from '../constants';
import type { NBPExchangeRate } from '../types';

// Cache for NBP exchange rates to minimize API calls
const rateCache: Map<string, number> = new Map();

/**
 * Gets the last business day before the given date
 * Required for Polish tax rules: exchange rate from last business day before transaction
 */
function getLastBusinessDay(date: Date): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - 1);
  
  // Keep going back until we hit a weekday
  while (result.getDay() === 0 || result.getDay() === 6) {
    result.setDate(result.getDate() - 1);
  }
  
  return result;
}

/**
 * Formats a date as YYYY-MM-DD for NBP API
 */
function formatDateForAPI(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Gets the NBP exchange rate for a currency on a specific date
 * Uses Table A for most currencies
 */
export async function getNBPExchangeRate(
  currencyCode: string,
  transactionDate: Date
): Promise<number> {
  // PLN doesn't need conversion
  if (currencyCode.toUpperCase() === 'PLN') {
    return 1;
  }

  const rateDate = getLastBusinessDay(transactionDate);
  const formattedDate = formatDateForAPI(rateDate);
  const cacheKey = `${currencyCode.toUpperCase()}_${formattedDate}`;

  // Check cache first
  if (rateCache.has(cacheKey)) {
    return rateCache.get(cacheKey)!;
  }

  try {
    // Try to get the rate for the specific date
    const response = await fetch(
      `${NBP_API_BASE}/rates/a/${currencyCode.toLowerCase()}/${formattedDate}/?format=json`
    );

    if (!response.ok) {
      // If not found, try to get the nearest available rate
      return await getNearestNBPRate(currencyCode, rateDate);
    }

    const data: NBPExchangeRate = await response.json();
    const rate = data.rates[0].mid;
    
    // Cache the result
    rateCache.set(cacheKey, rate);
    
    return rate;
  } catch (error) {
    console.error('Error fetching NBP rate:', error);
    // Try to get the nearest available rate
    return await getNearestNBPRate(currencyCode, rateDate);
  }
}

/**
 * Gets the nearest available NBP rate (looking back up to 7 days)
 */
async function getNearestNBPRate(
  currencyCode: string,
  startDate: Date
): Promise<number> {
  const endDate = formatDateForAPI(startDate);
  const searchStartDate = new Date(startDate);
  searchStartDate.setDate(searchStartDate.getDate() - 7);
  const startDateStr = formatDateForAPI(searchStartDate);

  try {
    const response = await fetch(
      `${NBP_API_BASE}/rates/a/${currencyCode.toLowerCase()}/${startDateStr}/${endDate}/?format=json`
    );

    if (!response.ok) {
      throw new Error(`Failed to fetch NBP rate for ${currencyCode}`);
    }

    const data: NBPExchangeRate = await response.json();
    
    if (data.rates.length === 0) {
      throw new Error(`No NBP rate found for ${currencyCode}`);
    }

    // Return the most recent rate
    const rate = data.rates[data.rates.length - 1].mid;
    
    // Cache it
    const cacheKey = `${currencyCode.toUpperCase()}_${endDate}`;
    rateCache.set(cacheKey, rate);
    
    return rate;
  } catch (error) {
    console.error('Error fetching nearest NBP rate:', error);
    // Return a fallback rate for common currencies
    return getFallbackRate(currencyCode);
  }
}

/**
 * Fallback rates for when API is unavailable
 * These are approximate and should only be used as last resort
 */
function getFallbackRate(currencyCode: string): number {
  const fallbackRates: Record<string, number> = {
    USD: 4.0,
    EUR: 4.3,
    GBP: 5.1,
    CHF: 4.5,
    AUD: 2.6,
    CAD: 3.0,
    JPY: 0.027,
  };
  
  return fallbackRates[currencyCode.toUpperCase()] || 4.0;
}

/**
 * Converts an amount in foreign currency to PLN
 */
export async function convertToPLN(
  amount: number,
  currency: string,
  transactionDate: Date
): Promise<{ amountPLN: number; exchangeRate: number }> {
  const exchangeRate = await getNBPExchangeRate(currency, transactionDate);
  return {
    amountPLN: amount * exchangeRate,
    exchangeRate,
  };
}

/**
 * Batch convert multiple transactions to PLN
 * More efficient as it caches rates
 */
export async function batchConvertToPLN(
  transactions: Array<{
    amount: number;
    currency: string;
    date: Date;
  }>
): Promise<Array<{ amountPLN: number; exchangeRate: number }>> {
  const results: Array<{ amountPLN: number; exchangeRate: number }> = [];
  
  for (const tx of transactions) {
    const result = await convertToPLN(tx.amount, tx.currency, tx.date);
    results.push(result);
  }
  
  return results;
}

/**
 * Clears the rate cache
 */
export function clearRateCache(): void {
  rateCache.clear();
}

/**
 * Gets the cache size for debugging
 */
export function getCacheSize(): number {
  return rateCache.size;
}

