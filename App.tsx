import React, { useEffect } from 'react';
import AppNavigator from './src/navigation/AppNavigator';
import { MedicationProvider } from './src/context/MedicationContext';
import { scheduleMedicationReminders } from './src/services/notifications';
import { seedSampleData } from './src/seed/seed';
import { getAllMedications } from './src/database';

export default function App() {
  useEffect(() => {
    (async () => {
      await seedSampleData();
      const meds = await getAllMedications();
      await scheduleMedicationReminders(meds);
    })();
  }, []);

  return (
    <MedicationProvider>
      <AppNavigator />
    </MedicationProvider>
  );
}
