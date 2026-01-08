# CryptoPodatki 🪙

Aplikacja mobilna do obliczania podatku od kryptowalut zgodnie z polskim prawem podatkowym (PIT-38).

## Funkcje

- 📁 **Import plików** - obsługa formatów CSV, XLSX z popularnych giełd (Binance, Kraken, Coinbase, Zonda/BitBay)
- 💰 **Obliczanie podatku** - automatyczne kalkulacje zgodne z polskimi przepisami podatkowymi
- 📊 **NBP Exchange Rates** - automatyczne przeliczanie walut obcych według kursów NBP
- 📋 **Dane do PIT-38** - gotowe wartości dla kolumn c, d, f zeznania podatkowego
- 💾 **Historia obliczeń** - zapisywanie i przeglądanie poprzednich kalkulacji
- 📤 **Udostępnianie** - eksport wyników do udostępnienia

## Zasady podatkowe

Aplikacja implementuje polskie przepisy podatkowe dotyczące kryptowalut:

- **Stawka podatku**: 19%
- **Opodatkowane**: sprzedaż krypto za FIAT, płatności kryptowalutami
- **Nieopodatkowane**: wymiana między kryptowalutami (crypto-crypto swap)
- **Koszty**: koszty nabycia, opłaty transakcyjne przy sprzedaży
- **Przeniesienie kosztów**: nadwyżka kosztów przenoszona na następny rok
- **Termin składania**: PIT-38 od 15 lutego do 30 kwietnia

## Tech Stack

- React Native 0.83 + TypeScript
- React Navigation (nawigacja między ekranami)
- react-native-document-picker (wybór plików)
- xlsx + papaparse (parsowanie Excel/CSV)
- AsyncStorage (lokalne przechowywanie danych)
- react-native-linear-gradient (efekty wizualne)

## Instalacja

```bash
# Zainstaluj zależności
npm install

# iOS (wymaga macOS)
cd ios && pod install && cd ..
npm run ios

# Android
npm run android
```

## Struktura projektu

```
src/
├── components/        # Komponenty UI wielokrotnego użytku
├── constants/         # Stałe, kolory, theme
├── navigation/        # Konfiguracja nawigacji
├── screens/           # Ekrany aplikacji
│   ├── HomeScreen     # Ekran główny
│   ├── ImportScreen   # Import i podgląd transakcji
│   ├── ResultsScreen  # Wyniki obliczeń podatkowych
│   └── HistoryScreen  # Historia zapisanych obliczeń
├── services/          # Logika biznesowa
│   ├── fileParser     # Parsowanie plików CSV/XLSX
│   ├── taxCalculator  # Obliczanie podatku
│   ├── nbpService     # Kursy walut NBP
│   └── storageService # Zapis/odczyt AsyncStorage
└── types/             # Definicje TypeScript
```

## Obsługiwane giełdy

- Binance
- Kraken
- Coinbase
- Zonda (BitBay)
- Format generyczny (automatyczne wykrywanie kolumn)

## Budowanie na produkcję

### Android (Google Play)

```bash
cd android
./gradlew bundleRelease
```

Plik `.aab` znajdziesz w `android/app/build/outputs/bundle/release/`

### iOS (App Store)

Otwórz `ios/CryptoPodatkiApp.xcworkspace` w Xcode i użyj Archive do budowania.

## Uwagi prawne

⚠️ **Ważne**: Aplikacja służy wyłącznie do celów poglądowych. Przed złożeniem zeznania podatkowego zweryfikuj wszystkie dane. W przypadku wątpliwości skonsultuj się z doradcą podatkowym.

## Licencja

MIT
