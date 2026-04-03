import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { getAllMedications } from './src/database';
import { scheduleMedicationReminders } from './src/services/notifications';
import { seedSampleData } from './src/seed/seed';

export default function App() {
  useEffect(() => {
    (async () => {
      await seedSampleData();
      const meds = await getAllMedications();
      await scheduleMedicationReminders(meds);
    })();
  }, []);

  return <AppNavigator />;
}
