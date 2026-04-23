import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import AppNavigator from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/AppNavigator';
import { MedicationProvider } from './src/context/MedicationContext';
import {
  scheduleMedicationReminders,
  scheduleRefillWarnings,
} from './src/services/notifications';
import { seedSampleData } from './src/seed/seed';
import { getAllMedications } from './src/database';
import { loadApiKey } from './src/services/medRecognition';

export default function App() {
  const responseListener = useRef<Notifications.Subscription | null>(null);

  useEffect(() => {
    (async () => {
      await loadApiKey();
      await seedSampleData();
      const meds = await getAllMedications();
      await scheduleMedicationReminders(meds);
      await scheduleRefillWarnings(meds);
    })();

    // Deep-link to Home tab when a notification is tapped
    responseListener.current =
      Notifications.addNotificationResponseReceivedListener((response) => {
        const data = response.notification.request.content.data;
        if (data?.screen === 'Home' && navigationRef.isReady()) {
          navigationRef.navigate('Tabs' as any);
        }
      });

    return () => {
      if (responseListener.current) {
        responseListener.current.remove();
      }
    };
  }, []);

  return (
    <MedicationProvider>
      <AppNavigator />
    </MedicationProvider>
  );
}
