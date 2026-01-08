// Transaction types for cryptocurrency tax calculations
export type TransactionType = 
  | 'buy'           // Zakup kryptowaluty za FIAT
  | 'sell'          // Sprzedaż kryptowaluty za FIAT (odpłatne zbycie)
  | 'crypto_swap'   // Wymiana między kryptowalutami (nie podlega opodatkowaniu)
  | 'fee'           // Opłata transakcyjna
  | 'transfer_in'   // Transfer na giełdę/portfel
  | 'transfer_out'  // Transfer z giełdy/portfela
  | 'payment'       // Płatność kryptowalutą za towar/usługę (odpłatne zbycie)
  | 'staking_reward'// Nagroda ze stakingu
  | 'airdrop'       // Airdrop
  | 'unknown';

export interface Transaction {
  id: string;
  date: Date;
  type: TransactionType;
  cryptoSymbol: string;
  cryptoAmount: number;
  fiatAmount: number;
  fiatCurrency: string;
  fee?: number;
  feeCurrency?: string;
  exchangeName?: string;
  notes?: string;
  // NBP exchange rate to PLN (for non-PLN transactions)
  nbpExchangeRate?: number;
  amountInPLN?: number;
  feeInPLN?: number;
}

export interface ParsedFile {
  fileName: string;
  fileType: 'csv' | 'xlsx' | 'pdf';
  transactions: Transaction[];
  parseErrors: string[];
  parsedAt: Date;
}

export interface TaxYear {
  year: number;
  // Przychód z odpłatnego zbycia
  revenue: number;
  // Koszty poniesione w danym roku
  currentYearCosts: number;
  // Koszty z lat ubiegłych niepotrącone
  previousYearsCosts: number;
  // Suma kosztów (currentYearCosts + previousYearsCosts)
  totalCosts: number;
  // Dochód = max(revenue - totalCosts, 0)
  income: number;
  // Podatek = income * 0.19
  tax: number;
  // Koszty niepotrącone (do przeniesienia na następny rok)
  carryForwardCosts: number;
  // Lista transakcji odpłatnego zbycia
  taxableTransactions: Transaction[];
  // Lista transakcji nabycia (koszty)
  acquisitionTransactions: Transaction[];
}

export interface TaxCalculation {
  id: string;
  createdAt: Date;
  updatedAt: Date;
  name: string;
  years: TaxYear[];
  files: ParsedFile[];
  totalRevenue: number;
  totalCosts: number;
  totalIncome: number;
  totalTax: number;
}

export interface SavedCalculation {
  id: string;
  name: string;
  createdAt: string;
  summary: {
    year: number;
    revenue: number;
    income: number;
    tax: number;
  }[];
}

// Exchange mapping for different file formats
export interface ExchangeParser {
  name: string;
  supportedFormats: ('csv' | 'xlsx')[];
  detectFormat: (headers: string[]) => boolean;
  parseRow: (row: Record<string, string>, headers: string[]) => Transaction | null;
}

// NBP API response type
export interface NBPExchangeRate {
  table: string;
  currency: string;
  code: string;
  rates: {
    no: string;
    effectiveDate: string;
    mid: number;
  }[];
}

