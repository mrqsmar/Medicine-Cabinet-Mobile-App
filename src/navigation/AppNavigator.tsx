import React from 'react';
import {
  NavigationContainer,
  DefaultTheme,
  createNavigationContainerRef,
} from '@react-navigation/native';
import {
  createNativeStackNavigator,
  NativeStackScreenProps,
} from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import HomeScreen from '../screens/HomeScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import ProgressScreen from '../screens/ProgressScreen';
import MoreScreen from '../screens/MoreScreen';
import AddEditMedicationScreen from '../screens/AddEditMedicationScreen';
import MedicationDetailScreen from '../screens/MedicationDetailScreen';
import RemindersScreen from '../screens/RemindersScreen';
import SettingsScreen from '../screens/SettingsScreen';

import { Colors, FontSizes, FontWeights } from '../theme';
import TabBar from './TabBar';

// ── Param lists ──────────────────────────────────────────────────────

export type RootStackParamList = {
  Tabs: undefined;
  MedicationDetail: { medicationId: string };
  AddEditMedication: { medicationId?: string };
  Reminders: undefined;
  Settings: undefined;
};

export type TabsParamList = {
  Today: undefined;
  Meds: undefined;
  Progress: undefined;
  More: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabsParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// ── Navigation theme ─────────────────────────────────────────────────

const AppTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: Colors.primary,
    background: Colors.background,
    card: Colors.surface,
    text: Colors.textPrimary,
    border: Colors.border,
  },
};

// ── Bottom tabs ──────────────────────────────────────────────────────

function Tabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{
        headerTitleStyle: {
          fontSize: FontSizes.lg,
          fontWeight: FontWeights.bold,
          color: Colors.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="Today"
        component={HomeScreen}
        options={{ title: "Today's Doses" }}
      />
      <Tab.Screen
        name="Meds"
        component={MedicationsScreen}
        options={{ title: 'Medications' }}
      />
      <Tab.Screen
        name="Progress"
        component={ProgressScreen}
        options={{ title: 'Progress' }}
      />
      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{ title: 'More' }}
      />
    </Tab.Navigator>
  );
}

// ── Root stack ───────────────────────────────────────────────────────

export default function AppNavigator() {
  return (
    <NavigationContainer ref={navigationRef} theme={AppTheme}>
      <RootStack.Navigator
        screenOptions={{
          headerTitleStyle: {
            fontSize: FontSizes.lg,
            fontWeight: FontWeights.bold,
            color: Colors.textPrimary,
          },
        }}
      >
        <RootStack.Screen
          name="Tabs"
          component={Tabs}
          options={{ headerShown: false }}
        />
        <RootStack.Screen
          name="MedicationDetail"
          component={MedicationDetailScreen}
          options={{ title: 'Medication Details' }}
        />
        <RootStack.Screen
          name="AddEditMedication"
          component={AddEditMedicationScreen}
          options={{ title: 'Add / Edit Medication' }}
        />
        <RootStack.Screen
          name="Reminders"
          component={RemindersScreen}
          options={{ title: 'Reminders' }}
        />
        <RootStack.Screen
          name="Settings"
          component={SettingsScreen}
          options={{ title: 'Settings' }}
        />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
