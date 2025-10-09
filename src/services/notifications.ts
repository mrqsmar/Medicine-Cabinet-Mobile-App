import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Medication } from '../types/medication';

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const res = await Notifications.requestPermissionsAsync();
    return res.status === 'granted';
  }
  return true;
}

export async function scheduleMedicationReminders(medications: Medication[]): Promise<void> {
  if (!(await requestNotificationPermissions())) return;

  // Cancel existing scheduled notifications for a clean slate
  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const med of medications) {
    for (const time of med.times || []) {
      const [hourStr, minuteStr] = time.split(':');
      const hour = Number(hourStr);
      const minute = Number(minuteStr);
      const trigger: Notifications.NotificationTriggerInput = Platform.select({
        ios: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute,
          repeats: true,
        },
        android: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
        default: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      })!;

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication Reminder',
          body: `Time to take your ${time} medication: ${med.name} ${med.dosage}`,
          data: { medicationId: med.id, time },
        },
        trigger,
      });
    }
  }
}

// Configure notification handling to show alerts when received in foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
