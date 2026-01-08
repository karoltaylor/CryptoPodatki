import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { HomeScreen, ImportScreen, ResultsScreen, HistoryScreen } from '../screens';
import { colors, typography } from '../constants/theme';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

const screenOptions = {
  headerStyle: {
    backgroundColor: colors.backgroundDark,
  },
  headerTintColor: colors.primary,
  headerTitleStyle: {
    fontWeight: typography.weights.semibold as '600',
    color: colors.textPrimary,
  },
  headerShadowVisible: false,
  contentStyle: {
    backgroundColor: colors.backgroundDark,
  },
  animation: 'slide_from_right' as const,
};

export const AppNavigator: React.FC = () => {
  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="Home"
        screenOptions={screenOptions}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{
            headerShown: false,
          }}
        />
        <Stack.Screen
          name="Import"
          component={ImportScreen}
          options={{
            title: 'Wczytaj transakcje',
            headerBackTitle: 'Wróć',
          }}
        />
        <Stack.Screen
          name="Results"
          component={ResultsScreen}
          options={{
            title: 'Wynik obliczeń',
            headerBackTitle: 'Wróć',
          }}
        />
        <Stack.Screen
          name="History"
          component={HistoryScreen}
          options={{
            title: 'Historia obliczeń',
            headerBackTitle: 'Wróć',
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

