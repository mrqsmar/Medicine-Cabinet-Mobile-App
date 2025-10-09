import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import { getMedications } from './src/services/storage';
import { scheduleMedicationReminders } from './src/services/notifications';
import { seedSampleData } from './src/seed/seed';

export default function App() {
  useEffect(() => {
    (async () => {
      await seedSampleData();
      const meds = await getMedications();
      await scheduleMedicationReminders(meds);
    })();
  }, []);

  return <AppNavigator />;
}
