import DocumentPicker, { types } from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import type { Transaction, ParsedFile, TransactionType } from '../types';
import { MAX_FILE_SIZE_BYTES } from '../constants';

/**
 * Opens file picker and allows user to select CSV, XLSX, or PDF files
 */
export async function pickFile(): Promise<{
  uri: string;
  name: string;
  type: string;
} | null> {
  try {
    const result = await DocumentPicker.pick({
      type: [types.csv, types.xlsx, types.xls, types.pdf],
      copyTo: 'cachesDirectory',
    });

    if (result && result.length > 0) {
      const file = result[0];
      return {
        uri: file.fileCopyUri || file.uri,
        name: file.name || 'unknown',
        type: file.type || 'unknown',
      };
    }
    return null;
  } catch (err) {
    if (DocumentPicker.isCancel(err)) {
      return null;
    }
    throw err;
  }
}

/**
 * Reads and parses a file based on its type
 */
export async function parseFile(
  uri: string,
  fileName: string,
  fileType: string
): Promise<ParsedFile> {
  // Check file size
  const fileInfo = await RNFS.stat(uri);
  if (fileInfo.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`Plik jest zbyt duży. Maksymalny rozmiar: 50MB`);
  }

  const normalizedType = getFileType(fileName, fileType);
  
  switch (normalizedType) {
    case 'csv':
      return await parseCSV(uri, fileName);
    case 'xlsx':
      return await parseXLSX(uri, fileName);
    case 'pdf':
      return parsePDF(uri, fileName);
    default:
      throw new Error(`Nieobsługiwany format pliku: ${normalizedType}`);
  }
}

/**
 * Determines file type from extension and MIME type
 */
function getFileType(fileName: string, mimeType: string): 'csv' | 'xlsx' | 'pdf' {
  const extension = fileName.split('.').pop()?.toLowerCase();
  
  if (extension === 'csv' || mimeType.includes('csv')) {
    return 'csv';
  }
  if (extension === 'xlsx' || extension === 'xls' || mimeType.includes('spreadsheet') || mimeType.includes('excel')) {
    return 'xlsx';
  }
  if (extension === 'pdf' || mimeType.includes('pdf')) {
    return 'pdf';
  }
  
  // Default to CSV for unknown types
  return 'csv';
}

/**
 * Parses a CSV file
 */
async function parseCSV(uri: string, fileName: string): Promise<ParsedFile> {
  const content = await RNFS.readFile(uri, 'utf8');
  const errors: string[] = [];
  const transactions: Transaction[] = [];

  return new Promise((resolve) => {
    Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data as Record<string, string>[];
        const headers = results.meta.fields || [];

        // Detect exchange format and parse accordingly
        const parser = detectExchangeFormat(headers);
        
        rows.forEach((row, index) => {
          try {
            const transaction = parser(row, headers, index);
            if (transaction) {
              transactions.push(transaction);
            }
          } catch (error) {
            errors.push(`Wiersz ${index + 2}: ${(error as Error).message}`);
          }
        });

        resolve({
          fileName,
          fileType: 'csv',
          transactions,
          parseErrors: errors,
          parsedAt: new Date(),
        });
      },
      error: (error) => {
        errors.push(`Błąd parsowania CSV: ${error.message}`);
        resolve({
          fileName,
          fileType: 'csv',
          transactions: [],
          parseErrors: errors,
          parsedAt: new Date(),
        });
      },
    });
  });
}

/**
 * Parses an XLSX file
 */
async function parseXLSX(uri: string, fileName: string): Promise<ParsedFile> {
  const errors: string[] = [];
  const transactions: Transaction[] = [];

  try {
    // Read file as base64
    const content = await RNFS.readFile(uri, 'base64');
    const workbook = XLSX.read(content, { type: 'base64' });
    
    // Get the first sheet
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    
    // Convert to JSON
    const rows = XLSX.utils.sheet_to_json<Record<string, string>>(sheet, { header: 1 });
    
    if (rows.length < 2) {
      errors.push('Plik jest pusty lub nie zawiera danych');
      return {
        fileName,
        fileType: 'xlsx',
        transactions: [],
        parseErrors: errors,
        parsedAt: new Date(),
      };
    }

    // First row is headers
    const headers = (rows[0] as unknown as string[]).map(h => String(h || '').trim());
    const parser = detectExchangeFormat(headers);

    // Parse data rows
    for (let i = 1; i < rows.length; i++) {
      const rowArray = rows[i] as unknown as string[];
      const row: Record<string, string> = {};
      headers.forEach((header, index) => {
        row[header] = String(rowArray[index] || '');
      });

      try {
        const transaction = parser(row, headers, i);
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        errors.push(`Wiersz ${i + 1}: ${(error as Error).message}`);
      }
    }
  } catch (error) {
    errors.push(`Błąd parsowania XLSX: ${(error as Error).message}`);
  }

  return {
    fileName,
    fileType: 'xlsx',
    transactions,
    parseErrors: errors,
    parsedAt: new Date(),
  };
}

/**
 * PDF parsing placeholder - would require OCR for full implementation
 */
function parsePDF(uri: string, fileName: string): ParsedFile {
  // PDF parsing would require OCR which is complex
  // For now, return empty with instruction
  return {
    fileName,
    fileType: 'pdf',
    transactions: [],
    parseErrors: [
      'Parsowanie PDF wymaga ręcznego wprowadzenia danych.',
      'Proszę wyeksportować dane z giełdy do formatu CSV lub XLSX.',
    ],
    parsedAt: new Date(),
  };
}

/**
 * Detects exchange format based on headers and returns appropriate parser
 */
function detectExchangeFormat(
  headers: string[]
): (row: Record<string, string>, headers: string[], index: number) => Transaction | null {
  const headerLower = headers.map(h => h.toLowerCase());

  // Binance format detection
  if (headerLower.includes('operation') && headerLower.includes('coin')) {
    return parseBinanceRow;
  }

  // Kraken format detection
  if (headerLower.includes('txid') && headerLower.includes('pair')) {
    return parseKrakenRow;
  }

  // Coinbase format detection
  if (headerLower.includes('transaction type') && headerLower.includes('asset')) {
    return parseCoinbaseRow;
  }

  // BitBay/Zonda format detection
  if (headerLower.includes('typ') && headerLower.includes('waluta')) {
    return parseBitBayRow;
  }

  // Generic format
  return parseGenericRow;
}

/**
 * Parse Binance export row
 */
function parseBinanceRow(
  row: Record<string, string>,
  _headers: string[],
  index: number
): Transaction | null {
  const operation = row['Operation']?.toLowerCase() || '';
  const coin = row['Coin'] || '';
  const change = parseFloat(row['Change']) || 0;
  const dateStr = row['UTC_Time'] || row['Date'] || '';

  if (!dateStr || !coin) return null;

  let type: TransactionType = 'unknown';
  if (operation.includes('buy') || operation.includes('deposit')) {
    type = change > 0 ? 'buy' : 'sell';
  } else if (operation.includes('sell') || operation.includes('withdraw')) {
    type = 'sell';
  } else if (operation.includes('fee')) {
    type = 'fee';
  } else if (operation.includes('transfer')) {
    type = change > 0 ? 'transfer_in' : 'transfer_out';
  }

  return {
    id: `binance_${index}_${Date.now()}`,
    date: new Date(dateStr),
    type,
    cryptoSymbol: coin,
    cryptoAmount: Math.abs(change),
    fiatAmount: 0, // Binance doesn't always provide FIAT value
    fiatCurrency: 'USD',
    exchangeName: 'Binance',
  };
}

/**
 * Parse Kraken export row
 */
function parseKrakenRow(
  row: Record<string, string>,
  _headers: string[],
  index: number
): Transaction | null {
  const txType = row['type']?.toLowerCase() || '';
  const pair = row['pair'] || '';
  const cost = parseFloat(row['cost']) || 0;
  const vol = parseFloat(row['vol']) || 0;
  const fee = parseFloat(row['fee']) || 0;
  const dateStr = row['time'] || '';

  if (!dateStr || !pair) return null;

  // Extract crypto symbol from pair
  const cryptoSymbol = pair.replace(/USD|EUR|PLN|GBP/gi, '').replace(/X/g, '');

  let type: TransactionType = 'unknown';
  if (txType === 'buy') {
    type = 'buy';
  } else if (txType === 'sell') {
    type = 'sell';
  }

  return {
    id: `kraken_${index}_${Date.now()}`,
    date: new Date(dateStr),
    type,
    cryptoSymbol,
    cryptoAmount: vol,
    fiatAmount: cost,
    fiatCurrency: 'USD', // Would need to detect from pair
    fee,
    feeCurrency: 'USD',
    exchangeName: 'Kraken',
  };
}

/**
 * Parse Coinbase export row
 */
function parseCoinbaseRow(
  row: Record<string, string>,
  _headers: string[],
  index: number
): Transaction | null {
  const txType = (row['Transaction Type'] || '').toLowerCase();
  const asset = row['Asset'] || '';
  const quantity = parseFloat(row['Quantity Transacted']) || 0;
  const spotPrice = parseFloat(row['Spot Price at Transaction']) || 0;
  const total = parseFloat(row['Total (inclusive of fees)']) || 0;
  const fees = parseFloat(row['Fees']) || 0;
  const dateStr = row['Timestamp'] || '';

  if (!dateStr || !asset) return null;

  let type: TransactionType = 'unknown';
  if (txType === 'buy') {
    type = 'buy';
  } else if (txType === 'sell') {
    type = 'sell';
  } else if (txType === 'receive') {
    type = 'transfer_in';
  } else if (txType === 'send') {
    type = 'transfer_out';
  }

  return {
    id: `coinbase_${index}_${Date.now()}`,
    date: new Date(dateStr),
    type,
    cryptoSymbol: asset,
    cryptoAmount: quantity,
    fiatAmount: total || (quantity * spotPrice),
    fiatCurrency: 'USD',
    fee: fees,
    feeCurrency: 'USD',
    exchangeName: 'Coinbase',
  };
}

/**
 * Parse BitBay/Zonda export row (Polish exchange)
 */
function parseBitBayRow(
  row: Record<string, string>,
  _headers: string[],
  index: number
): Transaction | null {
  const typ = (row['Typ'] || row['Type'] || '').toLowerCase();
  const waluta = row['Waluta'] || row['Currency'] || '';
  const kwota = parseFloat(row['Kwota'] || row['Amount'] || '0') || 0;
  const dateStr = row['Data'] || row['Date'] || '';

  if (!dateStr || !waluta) return null;

  let type: TransactionType = 'unknown';
  if (typ.includes('kupno') || typ.includes('buy')) {
    type = 'buy';
  } else if (typ.includes('sprzedaż') || typ.includes('sell')) {
    type = 'sell';
  } else if (typ.includes('wpłata') || typ.includes('deposit')) {
    type = 'transfer_in';
  } else if (typ.includes('wypłata') || typ.includes('withdraw')) {
    type = 'transfer_out';
  } else if (typ.includes('prowizja') || typ.includes('fee')) {
    type = 'fee';
  }

  return {
    id: `bitbay_${index}_${Date.now()}`,
    date: new Date(dateStr),
    type,
    cryptoSymbol: waluta,
    cryptoAmount: Math.abs(kwota),
    fiatAmount: 0,
    fiatCurrency: 'PLN',
    exchangeName: 'BitBay/Zonda',
  };
}

/**
 * Generic row parser for unknown formats
 * Tries to intelligently detect columns
 */
function parseGenericRow(
  row: Record<string, string>,
  headers: string[],
  index: number
): Transaction | null {
  // Find date column
  const dateKeys = ['date', 'data', 'time', 'timestamp', 'datetime', 'utc_time'];
  const dateKey = headers.find(h => dateKeys.includes(h.toLowerCase()));
  
  // Find type column
  const typeKeys = ['type', 'typ', 'operation', 'side', 'action'];
  const typeKey = headers.find(h => typeKeys.includes(h.toLowerCase()));
  
  // Find amount/quantity column
  const amountKeys = ['amount', 'kwota', 'quantity', 'vol', 'volume', 'size'];
  const amountKey = headers.find(h => amountKeys.includes(h.toLowerCase()));
  
  // Find symbol column
  const symbolKeys = ['symbol', 'coin', 'asset', 'currency', 'waluta', 'pair'];
  const symbolKey = headers.find(h => symbolKeys.includes(h.toLowerCase()));
  
  // Find price/total column
  const priceKeys = ['price', 'cena', 'total', 'cost', 'value', 'wartość'];
  const priceKey = headers.find(h => priceKeys.includes(h.toLowerCase()));

  if (!dateKey) return null;

  const dateStr = row[dateKey];
  if (!dateStr) return null;

  const typeStr = typeKey ? (row[typeKey] || '').toLowerCase() : '';
  let type: TransactionType = 'unknown';
  
  if (typeStr.includes('buy') || typeStr.includes('kup')) {
    type = 'buy';
  } else if (typeStr.includes('sell') || typeStr.includes('sprzed')) {
    type = 'sell';
  }

  return {
    id: `generic_${index}_${Date.now()}`,
    date: new Date(dateStr),
    type,
    cryptoSymbol: symbolKey ? row[symbolKey] : 'UNKNOWN',
    cryptoAmount: amountKey ? Math.abs(parseFloat(row[amountKey]) || 0) : 0,
    fiatAmount: priceKey ? Math.abs(parseFloat(row[priceKey]) || 0) : 0,
    fiatCurrency: 'PLN',
    exchangeName: 'Custom',
  };
}

/**
 * Validates parsed transactions
 */
export function validateTransactions(transactions: Transaction[]): string[] {
  const errors: string[] = [];

  transactions.forEach((tx, index) => {
    if (!tx.date || isNaN(tx.date.getTime())) {
      errors.push(`Transakcja ${index + 1}: Nieprawidłowa data`);
    }
    if (!tx.cryptoSymbol) {
      errors.push(`Transakcja ${index + 1}: Brak symbolu kryptowaluty`);
    }
    if (tx.type === 'unknown') {
      errors.push(`Transakcja ${index + 1}: Nierozpoznany typ transakcji`);
    }
  });

  return errors;
}

