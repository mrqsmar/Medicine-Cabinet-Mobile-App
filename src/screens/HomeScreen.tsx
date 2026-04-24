import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import * as Notifications from 'expo-notifications';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadow,
  MinTapSize,
} from '../theme';
import { colors, radii } from '../theme/tokens';
import { useMedications } from '../context/MedicationContext';
import { getDoseLogsForDate, upsertDoseLog } from '../database';
import { getRefillWarnings } from '../services/notifications';
import type { Medication } from '../types/medication';
import { format, subDays } from 'date-fns';

// ── Helpers ─────────────────────────────────────────────────────────

interface DoseRow {
  medication: Medication;
  time: string;
  taken: boolean;
  takenAt?: string;
  logId: string;
}

function makeLogId(medicationId: string, date: string, time: string): string {
  return `${medicationId}|${date}|${time}`;
}

function fmt12(time24: string): string {
  const [h, m] = time24.split(':').map(Number);
  const ampm = h < 12 ? 'AM' : 'PM';
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${String(m).padStart(2, '0')} ${ampm}`;
}

function getGreeting(): string {
  const h = new Date().getHours();
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
}

async function computeStreak(medications: Medication[]): Promise<number> {
  const meds = medications.filter((m) => m.times.length > 0);
  if (!meds.length) return 0;
  let streak = 0;
  for (let daysAgo = 1; daysAgo <= 30; daysAgo++) {
    const date = format(subDays(new Date(), daysAgo), 'yyyy-MM-dd');
    const logs = await getDoseLogsForDate(date);
    const takenSet = new Set(
      logs
        .filter((l) => l.status === 'taken')
        .map((l) => `${l.medicationId}|${l.scheduledTime}`),
    );
    const allTaken = meds.every((med) =>
      med.times.every((t) => takenSet.has(`${med.id}|${t}`)),
    );
    if (!allTaken) break;
    streak++;
  }
  return streak;
}

// ── Screen ──────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { state } = useMedications();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const today = format(new Date(), 'yyyy-MM-dd');
  const [rows, setRows] = useState<DoseRow[]>([]);
  const [justTaken, setJustTaken] = useState<DoseRow | null>(null);
  const [laterOpen, setLaterOpen] = useState(false);
  const [streak, setStreak] = useState(0);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const logs = await getDoseLogsForDate(today);
        const logMap = new Map(logs.map((l) => [l.id, l]));

        const built: DoseRow[] = [];
        for (const med of state.medications) {
          for (const t of med.times) {
            const id = makeLogId(med.id, today, t);
            const log = logMap.get(id);
            built.push({
              medication: med,
              time: t,
              taken: log?.status === 'taken',
              takenAt: log?.takenAt,
              logId: id,
            });
          }
        }
        built.sort((a, b) => a.time.localeCompare(b.time));
        setRows(built);

        setStreak(await computeStreak(state.medications));
      })();
    }, [today, state.medications]),
  );

  const markTaken = async (row: DoseRow) => {
    const takenAt = new Date().toISOString();
    await upsertDoseLog({
      id: row.logId,
      medicationId: row.medication.id,
      scheduledDate: today,
      scheduledTime: row.time,
      status: 'taken',
      takenAt,
    });
    const updated: DoseRow = { ...row, taken: true, takenAt };
    setRows((prev) => prev.map((r) => (r.logId === row.logId ? updated : r)));
    setJustTaken(updated);
  };

  const undoTaken = async (row: DoseRow) => {
    await upsertDoseLog({
      id: row.logId,
      medicationId: row.medication.id,
      scheduledDate: today,
      scheduledTime: row.time,
      status: 'pending',
    });
    setRows((prev) =>
      prev.map((r) =>
        r.logId === row.logId ? { ...r, taken: false, takenAt: undefined } : r,
      ),
    );
    setJustTaken(null);
  };

  const remindIn15 = async (row: DoseRow) => {
    try {
      let { status } = await Notifications.getPermissionsAsync();
      if (status !== 'granted') {
        ({ status } = await Notifications.requestPermissionsAsync());
      }
      if (status !== 'granted') return;
      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Medication Reminder',
          body: `Time to take your ${fmt12(row.time)} dose of ${row.medication.name}`,
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 15 * 60,
        },
      });
    } catch {
      // Notifications unavailable in this environment
    }
  };

  // Derived state
  const pending = rows.filter((r) => !r.taken);
  const currentTime = format(new Date(), 'HH:mm');
  const nextDose =
    pending.find((r) => r.time >= currentTime) ?? pending[0] ?? null;
  const laterDoses = pending.filter((r) => r !== nextDose);
  const allDone = rows.length > 0 && pending.length === 0;
  const refillMeds = getRefillWarnings(state.medications);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* ── Profile row ─────────────────────────────── */}
      <View style={styles.profileRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarIcon}>💊</Text>
        </View>
        <View style={styles.profileTexts}>
          <Text style={styles.greeting}>{getGreeting()}</Text>
          <Text style={styles.dateLabel}>
            {format(new Date(), 'EEEE, MMMM d')}
          </Text>
        </View>
      </View>

      {/* ── Hero slot ───────────────────────────────── */}
      {justTaken ? (
        <ConfirmationCard
          row={justTaken}
          nextDoseRow={nextDose}
          allDone={allDone}
          onUndo={undoTaken}
        />
      ) : allDone ? (
        <AllDoneCard streak={streak} />
      ) : nextDose ? (
        <HeroCard row={nextDose} onTake={markTaken} onRemind={remindIn15} />
      ) : rows.length === 0 ? (
        <Text style={styles.emptyText}>No medications scheduled today.</Text>
      ) : null}

      {/* ── Streak ──────────────────────────────────── */}
      {streak > 0 && !allDone && <StreakCard streak={streak} />}

      {/* ── Refill ──────────────────────────────────── */}
      {refillMeds.length > 0 && <RefillCard meds={refillMeds} />}

      {/* ── Later today ─────────────────────────────── */}
      {laterDoses.length > 0 && (
        <LaterTodaySection
          doses={laterDoses}
          open={laterOpen}
          onToggle={() => setLaterOpen((v) => !v)}
        />
      )}
    </ScrollView>
  );
}

// ── HeroCard ────────────────────────────────────────────────────────

function HeroCard({
  row,
  onTake,
  onRemind,
}: {
  row: DoseRow;
  onTake: (row: DoseRow) => void;
  onRemind: (row: DoseRow) => void;
}) {
  const { medication, time } = row;
  const dosageLabel = medication.dosageAmount
    ? `${medication.dosageAmount} ${medication.dosageUnit}`
    : medication.dosage;

  return (
    <View style={styles.heroCard}>
      <Text style={styles.heroLabel}>NEXT DOSE · {fmt12(time)}</Text>
      <Text style={styles.heroMedName}>{medication.name}</Text>
      <Text style={styles.heroDose}>{dosageLabel}</Text>
      {!!medication.notes && (
        <Text style={styles.heroNotes}>{medication.notes}</Text>
      )}
      <TouchableOpacity
        style={styles.tookItBtn}
        onPress={() => onTake(row)}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`I took ${medication.name}`}
      >
        <Text style={styles.tookItIcon}>✓</Text>
        <Text style={styles.tookItLabel}>I took it</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.remindBtn}
        onPress={() => onRemind(row)}
        accessibilityRole="button"
        accessibilityLabel="Remind me in 15 minutes"
      >
        <Text style={styles.remindLabel}>Remind me in 15 minutes</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── ConfirmationCard ────────────────────────────────────────────────

function ConfirmationCard({
  row,
  nextDoseRow,
  allDone,
  onUndo,
}: {
  row: DoseRow;
  nextDoseRow: DoseRow | null;
  allDone: boolean;
  onUndo: (row: DoseRow) => void;
}) {
  const takenTime = row.takenAt
    ? format(new Date(row.takenAt), 'h:mm a')
    : fmt12(row.time);

  const followUp = allDone
    ? 'All done for today! 🎉'
    : nextDoseRow
      ? `Next dose at ${fmt12(nextDoseRow.time)}.`
      : '';

  return (
    <View style={styles.confirmCard}>
      <View style={styles.confirmRow}>
        <Text style={styles.confirmCheck}>✓</Text>
        <View style={styles.confirmTexts}>
          <Text style={styles.confirmTitle}>Nicely done.</Text>
          <Text style={styles.confirmBody}>
            {row.medication.name} taken at {takenTime}.
          </Text>
          {!!followUp && <Text style={styles.confirmNext}>{followUp}</Text>}
        </View>
      </View>
      <TouchableOpacity
        style={styles.undoBtn}
        onPress={() => onUndo(row)}
        accessibilityRole="button"
        accessibilityLabel="Undo — mark as not taken"
      >
        <Text style={styles.undoLabel}>Undo</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── AllDoneCard ─────────────────────────────────────────────────────

function AllDoneCard({ streak }: { streak: number }) {
  return (
    <View style={styles.allDoneCard}>
      <Text style={styles.allDoneEmoji}>🎉</Text>
      <Text style={styles.allDoneTitle}>All done for today!</Text>
      <Text style={styles.allDoneBody}>
        {streak > 0
          ? `That's a ${streak}-day streak — keep it up!`
          : 'Great job taking all your medications.'}
      </Text>
    </View>
  );
}

// ── StreakCard ──────────────────────────────────────────────────────

function StreakCard({ streak }: { streak: number }) {
  return (
    <View style={styles.streakCard}>
      <Text style={styles.streakTrophy}>🏆</Text>
      <Text style={styles.streakText}>{streak}-day streak!</Text>
    </View>
  );
}

// ── RefillCard ──────────────────────────────────────────────────────

function RefillCard({ meds }: { meds: Medication[] }) {
  const withPhone = meds.find((m) => !!m.pharmacyPhone);

  return (
    <View style={styles.refillCard}>
      <View style={styles.refillTextBlock}>
        <Text style={styles.refillTitle}>⚠ Refill soon</Text>
        <Text style={styles.refillBody}>{meds.map((m) => m.name).join(', ')}</Text>
      </View>
      {withPhone && (
        <TouchableOpacity
          style={styles.callPharmacyBtn}
          onPress={() => Linking.openURL(`tel:${withPhone.pharmacyPhone}`)}
          accessibilityRole="button"
          accessibilityLabel={`Call pharmacy at ${withPhone.pharmacyPhone}`}
        >
          <Text style={styles.callPharmacyIcon}>📞</Text>
          <Text style={styles.callPharmacyLabel}>Call Pharmacy</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── LaterTodaySection ───────────────────────────────────────────────

function LaterTodaySection({
  doses,
  open,
  onToggle,
}: {
  doses: DoseRow[];
  open: boolean;
  onToggle: () => void;
}) {
  return (
    <View style={styles.laterCard}>
      <TouchableOpacity
        style={styles.laterHeader}
        onPress={onToggle}
        accessibilityRole="button"
        accessibilityLabel={`${open ? 'Collapse' : 'Expand'} later today`}
        accessibilityState={{ expanded: open }}
      >
        <Text style={styles.laterTitle}>Later today ({doses.length})</Text>
        <Text style={styles.laterChevron}>{open ? '▲' : '▼'}</Text>
      </TouchableOpacity>

      {open && (
        <View style={styles.laterBody}>
          {doses.map((row) => (
            <View key={row.logId} style={styles.laterRow}>
              <Text style={styles.laterTime}>{fmt12(row.time)}</Text>
              <View style={styles.laterMedWrap}>
                <Text style={styles.laterMedName}>{row.medication.name}</Text>
                <Text style={styles.laterDose}>
                  {row.medication.dosageAmount} {row.medication.dosageUnit}
                </Text>
              </View>
            </View>
          ))}
          <View style={styles.callFamilyRow}>
            <Text style={styles.callFamilyText}>📞 Need help? Call family</Text>
          </View>
        </View>
      )}
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl + 24,
  },
  emptyText: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxl,
    lineHeight: 30,
  },

  // Profile row
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.xs,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.navySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.md,
  },
  avatarIcon: {
    fontSize: 22,
  },
  profileTexts: {
    flex: 1,
  },
  greeting: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  dateLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // Hero card (amber/cream)
  heroCard: {
    backgroundColor: colors.amberBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.amber,
  },
  heroLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: colors.amberInk,
    letterSpacing: 0.8,
    marginBottom: Spacing.sm,
  },
  heroMedName: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  heroDose: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
  },
  heroNotes: {
    fontSize: FontSizes.sm,
    color: colors.amberInk,
    fontStyle: 'italic',
    marginTop: Spacing.xs,
  },
  tookItBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.confirm,
    height: 64,
    borderRadius: radii.md,
    marginTop: Spacing.xl,
    gap: Spacing.sm,
  },
  tookItIcon: {
    fontSize: 26,
    color: Colors.textOnConfirm,
    fontWeight: FontWeights.bold,
  },
  tookItLabel: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textOnConfirm,
  },
  remindBtn: {
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingVertical: Spacing.sm,
    minHeight: MinTapSize,
    justifyContent: 'center',
  },
  remindLabel: {
    fontSize: FontSizes.base,
    color: colors.amberInk,
    fontWeight: FontWeights.medium,
  },

  // Confirmation card (sage green)
  confirmCard: {
    backgroundColor: colors.sageBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    borderWidth: 1.5,
    borderColor: colors.sage,
  },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.md,
  },
  confirmCheck: {
    fontSize: 34,
    color: colors.sageInk,
    fontWeight: FontWeights.bold,
    lineHeight: 38,
  },
  confirmTexts: {
    flex: 1,
  },
  confirmTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: colors.sageInk,
  },
  confirmBody: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
  },
  confirmNext: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },
  undoBtn: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.sage,
    alignItems: 'center',
    minHeight: MinTapSize,
    justifyContent: 'center',
  },
  undoLabel: {
    fontSize: FontSizes.base,
    color: colors.sageInk,
    fontWeight: FontWeights.medium,
  },

  // All done card
  allDoneCard: {
    backgroundColor: colors.sageBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.sage,
  },
  allDoneEmoji: {
    fontSize: 48,
    marginBottom: Spacing.md,
  },
  allDoneTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: colors.sageInk,
    textAlign: 'center',
  },
  allDoneBody: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    lineHeight: 26,
  },

  // Streak card
  streakCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    ...Shadow.sm,
  },
  streakTrophy: {
    fontSize: 32,
  },
  streakText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },

  // Refill card
  refillCard: {
    backgroundColor: colors.amberBg,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 1.5,
    borderColor: colors.amber,
    gap: Spacing.md,
  },
  refillTextBlock: {},
  refillTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: colors.amberInk,
    marginBottom: Spacing.xs,
  },
  refillBody: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
  callPharmacyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.navy,
    borderRadius: BorderRadius.md,
    height: MinTapSize,
    gap: Spacing.sm,
  },
  callPharmacyIcon: {
    fontSize: 18,
  },
  callPharmacyLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: colors.card,
  },

  // Later today
  laterCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },
  laterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.lg,
    minHeight: MinTapSize,
  },
  laterTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  laterChevron: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  laterBody: {},
  laterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    gap: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    minHeight: MinTapSize,
  },
  laterTime: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.accent,
    width: 72,
  },
  laterMedWrap: {
    flex: 1,
  },
  laterMedName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  laterDose: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  callFamilyRow: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    padding: Spacing.lg,
    alignItems: 'center',
    minHeight: MinTapSize,
    justifyContent: 'center',
  },
  callFamilyText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
});
