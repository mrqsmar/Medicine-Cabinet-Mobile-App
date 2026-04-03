import React from 'react';
import { Text } from 'react-native';
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
import AddEditMedicationScreen from '../screens/AddEditMedicationScreen';
import RemindersScreen from '../screens/RemindersScreen';
import SettingsScreen from '../screens/SettingsScreen';
import MedicationDetailScreen from '../screens/MedicationDetailScreen';

import { Colors, FontSizes, FontWeights, MinTapSize, Spacing } from '../theme';

// ── Param lists ─────────────────────────────────────────────────────

export type RootStackParamList = {
  Tabs: undefined;
  MedicationDetail: { medicationId: string };
  AddEditMedication: { medicationId?: string };
};

export type TabsParamList = {
  Home: undefined;
  Medications: undefined;
  AddMedication: undefined;
  Reminders: undefined;
  Settings: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabsParamList>();

export const navigationRef = createNavigationContainerRef<RootStackParamList>();

// ── Custom theme ────────────────────────────────────────────────────

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

// Tab icon helper — plain-text icons sized for accessibility
function tabIcon(label: string) {
  return ({ color }: { color: string }) => (
    <Text style={{ fontSize: 22, color }} accessibilityElementsHidden>
      {label}
    </Text>
  );
}

// ── Bottom tabs ─────────────────────────────────────────────────────

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.disabled,
        tabBarLabelStyle: {
          fontSize: FontSizes.xs,
          fontWeight: FontWeights.medium,
        },
        tabBarStyle: {
          height: 64,
          paddingBottom: Spacing.sm,
          paddingTop: Spacing.xs,
        },
        tabBarItemStyle: {
          minHeight: MinTapSize,
        },
        headerTitleStyle: {
          fontSize: FontSizes.lg,
          fontWeight: FontWeights.bold,
          color: Colors.textPrimary,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          title: 'Home',
          tabBarIcon: tabIcon('🏠'),
        }}
      />
      <Tab.Screen
        name="Medications"
        component={MedicationsScreen}
        options={{
          title: 'Medications',
          tabBarIcon: tabIcon('💊'),
        }}
      />
      <Tab.Screen
        name="AddMedication"
        component={AddEditMedicationScreen}
        options={{
          title: 'Add',
          tabBarIcon: tabIcon('➕'),
        }}
      />
      <Tab.Screen
        name="Reminders"
        component={RemindersScreen}
        options={{
          title: 'Reminders',
          tabBarIcon: tabIcon('🔔'),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: 'Settings',
          tabBarIcon: tabIcon('⚙️'),
        }}
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
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
