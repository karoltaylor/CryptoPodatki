import React from 'react';
import { StatusBar, LogBox } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation';
import { colors } from './src/constants/theme';

// Ignore some warnings that are expected in React Native
LogBox.ignoreLogs([
  'Non-serializable values were found in the navigation state',
]);

const App: React.FC = () => {
  return (
    <SafeAreaProvider>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.backgroundDark}
        translucent={false}
      />
      <AppNavigator />
    </SafeAreaProvider>
  );
};

export default App;
