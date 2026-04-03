import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Medication, Recurrence } from '../types/medication';

// ── Permission ──────────────────────────────────────────────────────

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    const res = await Notifications.requestPermissionsAsync();
    return res.status === 'granted';
  }
  return true;
}

// ── Schedule medication reminders based on recurrence ───────────────

export async function scheduleMedicationReminders(
  medications: Medication[],
): Promise<void> {
  if (!(await requestNotificationPermissions())) return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  for (const med of medications) {
    for (const time of med.times || []) {
      const [hourStr, minuteStr] = time.split(':');
      const hour = Number(hourStr);
      const minute = Number(minuteStr);

      const trigger = buildTrigger(med.recurrence, hour, minute);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication Reminder',
          body: `Time to take ${med.name} (${med.dosageAmount} ${med.dosageUnit})`,
          data: {
            type: 'medication_reminder',
            medicationId: med.id,
            time,
            screen: 'Home',
          },
          sound: true,
        },
        trigger,
      });
    }
  }
}

function buildTrigger(
  recurrence: Recurrence,
  hour: number,
  minute: number,
): Notifications.NotificationTriggerInput {
  switch (recurrence) {
    case 'Weekly':
      // Schedule for each day — on iOS use CALENDAR with weekday, on Android use WEEKLY
      return Platform.select({
        ios: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute,
          weekday: 2, // Monday — user can customize in edit
          repeats: true,
        },
        default: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
          hour,
          minute,
          weekday: 2,
        },
      })!;

    case 'Monthly':
      return Platform.select({
        ios: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute,
          day: 1,
          repeats: true,
        },
        default: {
          // Android doesn't have monthly trigger — use daily and let the app filter
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      })!;

    case 'Daily':
    default:
      return Platform.select({
        ios: {
          type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
          hour,
          minute,
          repeats: true,
        },
        default: {
          type: Notifications.SchedulableTriggerInputTypes.DAILY,
          hour,
          minute,
        },
      })!;
  }
}

// ── Refill warning notifications ────────────────────────────────────

export async function scheduleRefillWarnings(
  medications: Medication[],
): Promise<void> {
  if (!(await requestNotificationPermissions())) return;

  const warnings = getRefillWarnings(medications);
  const expirationWarnings = getExpirationWarnings(medications);

  for (const med of warnings) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Refill Needed',
        body: `Time to refill ${med.name}! Only ${med.remainingPills} pills remaining.`,
        data: {
          type: 'refill_warning',
          medicationId: med.id,
          screen: 'Home',
        },
        sound: true,
      },
      trigger: null, // Send immediately
    });
  }

  for (const med of expirationWarnings) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Prescription Expiring Soon',
        body: `Your ${med.name} prescription expires on ${med.expirationDate}. Contact your doctor.`,
        data: {
          type: 'expiration_warning',
          medicationId: med.id,
          screen: 'Home',
        },
        sound: true,
      },
      trigger: null,
    });
  }
}

// ── Warning logic (exported for use in Home screen banners) ─────────

const REFILL_THRESHOLD_DAYS = 7;
const EXPIRATION_THRESHOLD_DAYS = 14;

export function getRefillWarnings(medications: Medication[]): Medication[] {
  return medications.filter((m) => {
    if (m.remainingPills == null || m.remainingPills < 0) return false;
    const dosesPerDay = m.dailyDoses ?? m.times.length ?? 1;
    const daysLeft = dosesPerDay > 0 ? m.remainingPills / dosesPerDay : Infinity;
    return daysLeft <= REFILL_THRESHOLD_DAYS;
  });
}

export function getExpirationWarnings(medications: Medication[]): Medication[] {
  if (!medications.length) return [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return medications.filter((m) => {
    if (!m.expirationDate) return false;
    const exp = new Date(m.expirationDate + 'T00:00:00');
    const diffMs = exp.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= EXPIRATION_THRESHOLD_DAYS;
  });
}

// ── Foreground notification handler ─────────────────────────────────

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});
