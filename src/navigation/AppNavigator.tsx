import React from 'react';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createNativeStackNavigator, NativeStackScreenProps } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import TodayScreen from '../screens/TodayScreen';
import MedicationsListScreen from '../screens/MedicationsListScreen';
import MedicationDetailScreen from '../screens/MedicationDetailScreen';
import AddEditMedicationScreen from '../screens/AddEditMedicationScreen';

export type RootStackParamList = {
  Tabs: undefined;
  MedicationDetail: { medicationId: string };
  AddEditMedication: { medicationId?: string } | undefined;
};

export type TabsParamList = {
  Today: undefined;
  Medications: undefined;
};

const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<TabsParamList>();

function Tabs() {
  return (
    <Tab.Navigator>
      <Tab.Screen name="Today" component={TodayScreen} />
      <Tab.Screen name="Medications" component={MedicationsListScreen} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <NavigationContainer theme={DefaultTheme}>
      <RootStack.Navigator>
        <RootStack.Screen
          name="Tabs"
          component={Tabs}
          options={{ headerShown: false }}
        />
        <RootStack.Screen name="MedicationDetail" component={MedicationDetailScreen} options={{ title: 'Medication' }} />
        <RootStack.Screen name="AddEditMedication" component={AddEditMedicationScreen} options={{ title: 'Add / Edit Medication' }} />
      </RootStack.Navigator>
    </NavigationContainer>
  );
}
