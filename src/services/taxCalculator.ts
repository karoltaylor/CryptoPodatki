import { TAX_RATE } from '../constants';
import type { Transaction, TaxYear, TaxCalculation, ParsedFile } from '../types';
import { convertToPLN } from './nbpService';

/**
 * Determines if a transaction is a taxable sale (odpłatne zbycie)
 * According to Polish tax law, these are taxable:
 * - Selling crypto for FIAT
 * - Exchanging crypto for goods/services
 * - Paying with crypto
 * 
 * NOT taxable:
 * - Crypto to crypto swaps
 */
function isTaxableSale(transaction: Transaction): boolean {
  return transaction.type === 'sell' || transaction.type === 'payment';
}

/**
 * Determines if a transaction is a deductible cost (koszt uzyskania przychodu)
 * According to Polish tax law, deductible costs include:
 * - Direct costs of purchasing crypto (for FIAT)
 * - Fees for selling crypto
 * 
 * NOT deductible:
 * - Crypto to crypto swap fees
 * - Mining equipment
 * - Electricity for mining
 * - Loan/credit costs for buying crypto
 */
function isDeductibleCost(transaction: Transaction): boolean {
  // Purchase transactions are costs
  if (transaction.type === 'buy') {
    return true;
  }
  // Fees related to selling are deductible
  if (transaction.type === 'fee' && transaction.notes?.includes('sell')) {
    return true;
  }
  return false;
}

/**
 * Groups transactions by tax year
 */
function groupByYear(transactions: Transaction[]): Map<number, Transaction[]> {
  const groups = new Map<number, Transaction[]>();
  
  for (const tx of transactions) {
    const year = tx.date.getFullYear();
    if (!groups.has(year)) {
      groups.set(year, []);
    }
    groups.get(year)!.push(tx);
  }
  
  return groups;
}

/**
 * Calculates PLN amounts for all transactions
 */
async function calculatePLNAmounts(transactions: Transaction[]): Promise<Transaction[]> {
  const result: Transaction[] = [];
  
  for (const tx of transactions) {
    const txCopy = { ...tx };
    
    // Convert fiat amount to PLN if not already
    if (tx.fiatCurrency !== 'PLN' && tx.fiatAmount > 0) {
      const conversion = await convertToPLN(tx.fiatAmount, tx.fiatCurrency, tx.date);
      txCopy.nbpExchangeRate = conversion.exchangeRate;
      txCopy.amountInPLN = conversion.amountPLN;
    } else {
      txCopy.amountInPLN = tx.fiatAmount;
      txCopy.nbpExchangeRate = 1;
    }
    
    // Convert fee to PLN
    if (tx.fee && tx.feeCurrency) {
      if (tx.feeCurrency !== 'PLN') {
        const feeConversion = await convertToPLN(tx.fee, tx.feeCurrency, tx.date);
        txCopy.feeInPLN = feeConversion.amountPLN;
      } else {
        txCopy.feeInPLN = tx.fee;
      }
    }
    
    result.push(txCopy);
  }
  
  return result;
}

/**
 * Calculates tax for a single year
 */
function calculateYearTax(
  year: number,
  transactions: Transaction[],
  carryForwardFromPreviousYear: number
): TaxYear {
  // Separate taxable sales and acquisition costs
  const taxableSales = transactions.filter(isTaxableSale);
  const acquisitions = transactions.filter(isDeductibleCost);
  
  // Calculate revenue from taxable sales
  const revenue = taxableSales.reduce((sum, tx) => {
    return sum + (tx.amountInPLN || 0);
  }, 0);
  
  // Calculate costs from current year acquisitions
  const currentYearCosts = acquisitions.reduce((sum, tx) => {
    let cost = tx.amountInPLN || 0;
    // Add fees if present
    if (tx.feeInPLN) {
      cost += tx.feeInPLN;
    }
    return sum + cost;
  }, 0);
  
  // Total costs = current year + carry forward from previous years
  const previousYearsCosts = carryForwardFromPreviousYear;
  const totalCosts = currentYearCosts + previousYearsCosts;
  
  // Income = max(revenue - costs, 0)
  // According to Polish tax law, there's no "loss" in crypto - just carry forward
  const income = Math.max(revenue - totalCosts, 0);
  
  // Calculate carry forward costs for next year
  // If costs > revenue, the excess is carried forward
  const carryForwardCosts = Math.max(totalCosts - revenue, 0);
  
  // Tax = income * 19%
  const tax = income * TAX_RATE;
  
  return {
    year,
    revenue: Math.round(revenue * 100) / 100,
    currentYearCosts: Math.round(currentYearCosts * 100) / 100,
    previousYearsCosts: Math.round(previousYearsCosts * 100) / 100,
    totalCosts: Math.round(totalCosts * 100) / 100,
    income: Math.round(income * 100) / 100,
    tax: Math.round(tax * 100) / 100,
    carryForwardCosts: Math.round(carryForwardCosts * 100) / 100,
    taxableTransactions: taxableSales,
    acquisitionTransactions: acquisitions,
  };
}

/**
 * Main tax calculation function
 * Processes all transactions and calculates tax for each year
 */
export async function calculateTax(
  files: ParsedFile[],
  previousCarryForwardCosts: number = 0,
  calculationName: string = 'Nowe obliczenie'
): Promise<TaxCalculation> {
  // Combine all transactions from all files
  const allTransactions: Transaction[] = [];
  for (const file of files) {
    allTransactions.push(...file.transactions);
  }
  
  // Sort transactions by date
  allTransactions.sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Calculate PLN amounts for all transactions
  const transactionsWithPLN = await calculatePLNAmounts(allTransactions);
  
  // Group by year
  const byYear = groupByYear(transactionsWithPLN);
  const years = Array.from(byYear.keys()).sort();
  
  // Calculate tax for each year, carrying forward costs
  const taxYears: TaxYear[] = [];
  let carryForward = previousCarryForwardCosts;
  
  for (const year of years) {
    const yearTransactions = byYear.get(year) || [];
    const taxYear = calculateYearTax(year, yearTransactions, carryForward);
    taxYears.push(taxYear);
    carryForward = taxYear.carryForwardCosts;
  }
  
  // Calculate totals
  const totalRevenue = taxYears.reduce((sum, y) => sum + y.revenue, 0);
  const totalCosts = taxYears.reduce((sum, y) => sum + y.currentYearCosts, 0);
  const totalIncome = taxYears.reduce((sum, y) => sum + y.income, 0);
  const totalTax = taxYears.reduce((sum, y) => sum + y.tax, 0);
  
  const calculation: TaxCalculation = {
    id: generateId(),
    createdAt: new Date(),
    updatedAt: new Date(),
    name: calculationName,
    years: taxYears,
    files,
    totalRevenue: Math.round(totalRevenue * 100) / 100,
    totalCosts: Math.round(totalCosts * 100) / 100,
    totalIncome: Math.round(totalIncome * 100) / 100,
    totalTax: Math.round(totalTax * 100) / 100,
  };
  
  return calculation;
}

/**
 * Generates a unique ID
 */
function generateId(): string {
  return `calc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Gets tax summary for a specific year from calculation
 */
export function getYearSummary(calculation: TaxCalculation, year: number): TaxYear | undefined {
  return calculation.years.find(y => y.year === year);
}

/**
 * Formats currency amount for display
 */
export function formatPLN(amount: number): string {
  return new Intl.NumberFormat('pl-PL', {
    style: 'currency',
    currency: 'PLN',
  }).format(amount);
}

/**
 * Gets a breakdown of costs for PIT-38 form
 * Returns costs categorized as required by the Polish tax form
 */
export function getPIT38Breakdown(taxYear: TaxYear): {
  columnC: number;  // Koszty poniesione w danym roku
  columnD: number;  // Koszty z lat ubiegłych niepotrącone
  columnF: number;  // Koszty niepotrącone w roku podatkowym
} {
  return {
    columnC: taxYear.currentYearCosts,
    columnD: taxYear.previousYearsCosts,
    columnF: taxYear.carryForwardCosts,
  };
}

