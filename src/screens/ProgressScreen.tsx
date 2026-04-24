import React, { useState, useCallback } from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadow,
} from '../theme';
import { colors } from '../theme/tokens';
import { useMedications } from '../context/MedicationContext';
import { getDoseLogsForDate } from '../database';
import type { Medication } from '../types/medication';
import { format, subDays } from 'date-fns';

// ── Helpers ─────────────────────────────────────────────────────────

interface DaySummary {
  date: string;
  label: string;       // e.g. "M"
  total: number;
  taken: number;
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

async function buildWeek(medications: Medication[]): Promise<DaySummary[]> {
  const meds = medications.filter((m) => m.times.length > 0);
  const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const result: DaySummary[] = [];

  for (let daysAgo = 6; daysAgo >= 0; daysAgo--) {
    const d = subDays(new Date(), daysAgo);
    const date = format(d, 'yyyy-MM-dd');
    const logs = await getDoseLogsForDate(date);
    const takenSet = new Set(
      logs
        .filter((l) => l.status === 'taken')
        .map((l) => `${l.medicationId}|${l.scheduledTime}`),
    );
    let total = 0;
    let taken = 0;
    for (const med of meds) {
      for (const t of med.times) {
        total++;
        if (takenSet.has(`${med.id}|${t}`)) taken++;
      }
    }
    result.push({ date, label: dayLabels[d.getDay()], total, taken });
  }
  return result;
}

// ── Screen ──────────────────────────────────────────────────────────

export default function ProgressScreen() {
  const { state } = useMedications();
  const today = format(new Date(), 'yyyy-MM-dd');

  const [takenToday, setTakenToday] = useState(0);
  const [totalToday, setTotalToday] = useState(0);
  const [streak, setStreak] = useState(0);
  const [week, setWeek] = useState<DaySummary[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const logs = await getDoseLogsForDate(today);
        const takenSet = new Set(
          logs
            .filter((l) => l.status === 'taken')
            .map((l) => `${l.medicationId}|${l.scheduledTime}`),
        );
        let total = 0;
        let taken = 0;
        for (const med of state.medications) {
          for (const t of med.times) {
            total++;
            if (takenSet.has(`${med.id}|${t}`)) taken++;
          }
        }
        setTotalToday(total);
        setTakenToday(taken);
        setStreak(await computeStreak(state.medications));
        setWeek(await buildWeek(state.medications));
      })();
    }, [today, state.medications]),
  );

  const allDone = totalToday > 0 && takenToday === totalToday;
  const pct = totalToday > 0 ? takenToday / totalToday : 0;

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Progress</Text>

      {/* ── Today card ──────────────────────────────── */}
      <View style={styles.card}>
        <Text style={styles.sectionLabel}>TODAY</Text>
        {totalToday === 0 ? (
          <Text style={styles.emptyBody}>No medications scheduled today.</Text>
        ) : allDone ? (
          <>
            <Text style={styles.allDoneHeadline}>All done! 🎉</Text>
            <Text style={styles.allDoneBody}>
              Every dose taken today. Great work!
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.todayHeadline}>
              {takenToday}
              <Text style={styles.todayTotal}> of {totalToday}</Text>
            </Text>
            <Text style={styles.todayLabel}>doses taken today</Text>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.round(pct * 100)}%` as any },
                ]}
              />
            </View>
          </>
        )}
      </View>

      {/* ── Streak card ─────────────────────────────── */}
      <View style={[styles.card, styles.streakCard]}>
        <Text style={styles.streakEmoji}>🏆</Text>
        <View style={styles.streakTexts}>
          {streak > 0 ? (
            <>
              <Text style={styles.streakHeadline}>{streak}-day streak!</Text>
              <Text style={styles.streakBody}>
                All doses taken {streak} day{streak !== 1 ? 's' : ''} in a row.
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.streakHeadline}>Start your streak</Text>
              <Text style={styles.streakBody}>
                Take all today's doses to begin a streak.
              </Text>
            </>
          )}
        </View>
      </View>

      {/* ── 7-day history ───────────────────────────── */}
      {week.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.sectionLabel}>LAST 7 DAYS</Text>
          <View style={styles.weekRow}>
            {week.map((day, i) => {
              const isToday = day.date === today;
              const pctDay = day.total > 0 ? day.taken / day.total : -1;
              const done = pctDay === 1;
              const partial = pctDay > 0 && pctDay < 1;
              const missed = !isToday && day.total > 0 && day.taken === 0;

              return (
                <View key={day.date} style={styles.dayCol}>
                  <View
                    style={[
                      styles.dayDot,
                      done && styles.dotDone,
                      partial && styles.dotPartial,
                      missed && styles.dotMissed,
                      isToday && !done && styles.dotToday,
                    ]}
                  >
                    {done && <Text style={styles.dotCheck}>✓</Text>}
                  </View>
                  <Text
                    style={[
                      styles.dayLabel,
                      isToday && styles.dayLabelToday,
                    ]}
                  >
                    {day.label}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.legendRow}>
            <LegendDot style={styles.dotDone} label="All taken" />
            <LegendDot style={styles.dotPartial} label="Partial" />
            <LegendDot style={styles.dotMissed} label="Missed" />
          </View>
        </View>
      )}
    </ScrollView>
  );
}

function LegendDot({
  style,
  label,
}: {
  style: object;
  label: string;
}) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, style]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────

const DOT_SIZE = 36;

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
  heading: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    ...Shadow.sm,
  },
  sectionLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
    letterSpacing: 1,
    marginBottom: Spacing.md,
  },
  emptyBody: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    paddingVertical: Spacing.md,
  },

  // Today
  todayHeadline: {
    fontSize: 56,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    lineHeight: 62,
  },
  todayTotal: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.regular,
    color: Colors.textSecondary,
  },
  todayLabel: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginBottom: Spacing.lg,
  },
  progressTrack: {
    height: 10,
    backgroundColor: Colors.border,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: 10,
    backgroundColor: Colors.confirm,
    borderRadius: 5,
  },
  allDoneHeadline: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: colors.sageInk,
    marginBottom: Spacing.xs,
  },
  allDoneBody: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },

  // Streak
  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
    backgroundColor: colors.amberBg,
    borderWidth: 1,
    borderColor: colors.amber,
  },
  streakEmoji: {
    fontSize: 40,
  },
  streakTexts: {
    flex: 1,
  },
  streakHeadline: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: colors.amberInk,
  },
  streakBody: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 20,
  },

  // Weekly history
  weekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  dayCol: {
    alignItems: 'center',
    gap: 6,
  },
  dayDot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: {
    backgroundColor: colors.sageBg,
    borderWidth: 2,
    borderColor: colors.sage,
  },
  dotPartial: {
    backgroundColor: colors.amberBg,
    borderWidth: 2,
    borderColor: colors.amber,
  },
  dotMissed: {
    backgroundColor: colors.coralBg,
    borderWidth: 2,
    borderColor: colors.coral,
  },
  dotToday: {
    borderWidth: 2,
    borderColor: colors.navy,
    backgroundColor: colors.navySoft,
  },
  dotCheck: {
    fontSize: 16,
    color: colors.sageInk,
    fontWeight: FontWeights.bold,
  },
  dayLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  dayLabelToday: {
    color: colors.navy,
    fontWeight: FontWeights.bold,
  },

  // Legend
  legendRow: {
    flexDirection: 'row',
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
});
