import type { ParsedFile, TaxCalculation } from '../types';

export type RootStackParamList = {
  Home: undefined;
  Import: { parsedFile: ParsedFile };
  Results: { calculation: TaxCalculation };
  History: undefined;
};

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

