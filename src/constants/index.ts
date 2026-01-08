export * from './theme';

// Tax constants for Polish jurisdiction
export const TAX_RATE = 0.19; // 19% tax on cryptocurrency income

// NBP API base URL for exchange rates
export const NBP_API_BASE = 'https://api.nbp.pl/api/exchangerates';

// Supported exchanges and their identifiers
export const SUPPORTED_EXCHANGES = [
  'binance',
  'kraken',
  'coinbase',
  'bitbay',
  'zonda',
  'kucoin',
  'bybit',
  'custom',
] as const;

// File size limits
export const MAX_FILE_SIZE_MB = 50;
export const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

// Supported file types
export const SUPPORTED_FILE_TYPES = {
  csv: ['text/csv', 'application/csv', 'text/comma-separated-values'],
  xlsx: ['application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/vnd.ms-excel'],
  pdf: ['application/pdf'],
};

// Date format for display
export const DATE_FORMAT = 'DD.MM.YYYY';
export const DATETIME_FORMAT = 'DD.MM.YYYY HH:mm';

// Storage keys
export const STORAGE_KEYS = {
  CALCULATIONS: '@cryptopodatki/calculations',
  SETTINGS: '@cryptopodatki/settings',
  CARRY_FORWARD_COSTS: '@cryptopodatki/carry_forward_costs',
  NBP_RATE_CACHE: '@cryptopodatki/nbp_cache',
};

// Transaction type labels in Polish
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  buy: 'Zakup',
  sell: 'Sprzedaż',
  crypto_swap: 'Wymiana crypto-crypto',
  fee: 'Opłata',
  transfer_in: 'Wpłata',
  transfer_out: 'Wypłata',
  payment: 'Płatność',
  staking_reward: 'Nagroda staking',
  airdrop: 'Airdrop',
  unknown: 'Nieznany',
};

// Common crypto symbols
export const COMMON_CRYPTO_SYMBOLS = [
  'BTC', 'ETH', 'USDT', 'USDC', 'BNB', 'XRP', 'ADA', 'SOL', 'DOGE', 'DOT',
  'MATIC', 'LTC', 'SHIB', 'TRX', 'AVAX', 'LINK', 'ATOM', 'UNI', 'XMR', 'ETC',
];

// Fiat currencies
export const FIAT_CURRENCIES = ['PLN', 'USD', 'EUR', 'GBP', 'CHF'];

