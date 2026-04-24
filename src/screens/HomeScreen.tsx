import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadow,
  MinTapSize,
} from '../theme';
import { colors } from '../theme/tokens';
import { useMedications } from '../context/MedicationContext';
import { getDoseLogsForDate, upsertDoseLog } from '../database';
import {
  getRefillWarnings,
  getExpirationWarnings,
} from '../services/notifications';
import type { Medication, DoseLog } from '../types/medication';
import { format } from 'date-fns';

// ── Deterministic log ID so upsert is idempotent ────────────────────

function logId(medicationId: string, date: string, time: string): string {
  return `${medicationId}|${date}|${time}`;
}

// ── Row model ───────────────────────────────────────────────────────

interface DoseRow {
  medication: Medication;
  time: string;
  taken: boolean;
  takenAt?: string;
  logId: string;
}

// ── Screen ──────────────────────────────────────────────────────────

export default function HomeScreen() {
  const { state } = useMedications();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [rows, setRows] = useState<DoseRow[]>([]);
  const today = format(new Date(), 'yyyy-MM-dd');

  // Compute warnings
  const refillMeds = getRefillWarnings(state.medications);
  const expiringMeds = getExpirationWarnings(state.medications);

  // Load dose logs on every focus
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const logs = await getDoseLogsForDate(today);
        const logMap = new Map<string, DoseLog>();
        for (const l of logs) {
          logMap.set(l.id, l);
        }

        const built: DoseRow[] = [];
        for (const med of state.medications) {
          for (const t of med.times) {
            const id = logId(med.id, today, t);
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
      })();
    }, [today, state.medications]),
  );

  // Toggle taken status
  const toggleTaken = async (row: DoseRow) => {
    const nowTaken = !row.taken;
    const takenAt = nowTaken ? new Date().toISOString() : undefined;

    await upsertDoseLog({
      id: row.logId,
      medicationId: row.medication.id,
      scheduledDate: today,
      scheduledTime: row.time,
      status: nowTaken ? 'taken' : 'pending',
      takenAt,
    });

    setRows((prev) =>
      prev.map((r) =>
        r.logId === row.logId ? { ...r, taken: nowTaken, takenAt } : r,
      ),
    );
  };

  const takenCount = rows.filter((r) => r.taken).length;
  const totalCount = rows.length;
  const progressFraction = totalCount > 0 ? takenCount / totalCount : 0;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      {/* ── Header ──────────────────────────────────── */}
      <Text style={styles.heading}>Today's Medications</Text>
      <Text style={styles.date}>{format(new Date(), 'EEEE, MMMM d')}</Text>

      {/* ── Warning Banners ─────────────────────────── */}
      {refillMeds.length > 0 && (
        <View style={styles.warningBanner}>
          <Text style={styles.warningIcon}>⚠️</Text>
          <View style={styles.warningTextWrap}>
            <Text style={styles.warningTitle}>Refill Needed</Text>
            {refillMeds.map((m) => {
              const dosesPerDay = m.dailyDoses ?? m.times.length ?? 1;
              const daysLeft =
                dosesPerDay > 0 && m.remainingPills != null
                  ? Math.floor(m.remainingPills / dosesPerDay)
                  : 0;
              return (
                <Text key={m.id} style={styles.warningBody}>
                  {m.name} — {m.remainingPills} pills left ({daysLeft} day
                  {daysLeft !== 1 ? 's' : ''} supply)
                </Text>
              );
            })}
          </View>
        </View>
      )}

      {expiringMeds.length > 0 && (
        <View style={styles.expirationBanner}>
          <Text style={styles.warningIcon}>📋</Text>
          <View style={styles.warningTextWrap}>
            <Text style={styles.expirationTitle}>
              Prescription Expiring Soon
            </Text>
            {expiringMeds.map((m) => (
              <Text key={m.id} style={styles.expirationBody}>
                {m.name} — expires {m.expirationDate}
              </Text>
            ))}
          </View>
        </View>
      )}

      {/* ── Progress ────────────────────────────────── */}
      <View style={styles.progressCard}>
        <View style={styles.progressTextRow}>
          <Text style={styles.progressLabel}>Progress</Text>
          <Text style={styles.progressCount}>
            {takenCount} of {totalCount} taken
          </Text>
        </View>
        <View style={styles.progressBarBg}>
          <View
            style={[
              styles.progressBarFill,
              { width: `${Math.round(progressFraction * 100)}%` as any },
            ]}
          />
        </View>
        {totalCount > 0 && takenCount === totalCount && (
          <Text style={styles.allDoneText}>All done for today!</Text>
        )}
      </View>

      {/* ── Medication cards ────────────────────────── */}
      {rows.length === 0 ? (
        <Text style={styles.empty}>No medications scheduled today.</Text>
      ) : (
        rows.map((row) => (
          <DoseCard
            key={row.logId}
            row={row}
            onToggle={() => toggleTaken(row)}
            onEdit={() =>
              navigation.navigate('AddEditMedication', {
                medicationId: row.medication.id,
              })
            }
          />
        ))
      )}
    </ScrollView>
  );
}

// ── DoseCard ────────────────────────────────────────────────────────

function DoseCard({
  row,
  onToggle,
  onEdit,
}: {
  row: DoseRow;
  onToggle: () => void;
  onEdit: () => void;
}) {
  const { medication, time, taken } = row;
  const photoSource = medication.photoUri ?? medication.pillPhotoUri;
  const dosageLabel = medication.dosageAmount
    ? `${medication.dosageAmount} ${medication.dosageUnit}`
    : medication.dosage;

  return (
    <View
      style={[styles.card, taken && styles.cardTaken]}
      accessibilityLabel={`${medication.name}, ${dosageLabel} at ${time}, ${taken ? 'taken' : 'not taken'}`}
    >
      {/* Top row: photo + info + edit pencil */}
      <View style={styles.cardTopRow}>
        {photoSource ? (
          <Image
            source={{ uri: photoSource }}
            style={styles.thumb}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.thumb, styles.placeholderThumb]}>
            <Text style={styles.placeholderIcon}>💊</Text>
          </View>
        )}

        <View style={styles.cardInfo}>
          <Text style={[styles.cardName, taken && styles.textTaken]}>
            {medication.name}
          </Text>
          <Text style={[styles.cardDose, taken && styles.textTaken]}>
            {dosageLabel}
          </Text>
          <Text style={[styles.cardTime, taken && styles.textTaken]}>
            {time}
          </Text>
        </View>

        <TouchableOpacity
          onPress={onEdit}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          style={styles.editButton}
          accessibilityRole="button"
          accessibilityLabel={`Edit ${medication.name}`}
        >
          <Text style={styles.editIcon}>✏️</Text>
        </TouchableOpacity>
      </View>

      {/* Large checkmark button */}
      <TouchableOpacity
        onPress={onToggle}
        activeOpacity={0.6}
        style={[styles.checkButton, taken && styles.checkButtonTaken]}
        accessibilityRole="button"
        accessibilityLabel={taken ? 'Mark as not taken' : 'Mark as taken'}
        accessibilityState={{ checked: taken }}
      >
        <Text style={[styles.checkIcon, !taken && styles.checkIconPending]}>
          {taken ? '✓' : '○'}
        </Text>
        <Text style={[styles.checkLabel, taken && styles.checkLabelTaken]}>
          {taken ? 'Taken' : 'Mark as Taken'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

const THUMB_SIZE = 60;
const CHECK_HEIGHT = 56;

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl + 24,
  },

  // Header
  heading: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  date: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
  },

  // Warning banners
  warningBanner: {
    flexDirection: 'row',
    backgroundColor: colors.amberBg,
    borderWidth: 2,
    borderColor: Colors.warning,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    alignItems: 'flex-start',
  },
  expirationBanner: {
    flexDirection: 'row',
    backgroundColor: colors.amberBg,
    borderWidth: 2,
    borderColor: colors.amber,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    alignItems: 'flex-start',
  },
  warningIcon: {
    fontSize: 28,
    marginRight: Spacing.md,
    marginTop: 2,
  },
  warningTextWrap: {
    flex: 1,
  },
  warningTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: colors.amberInk,
  },
  warningBody: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: colors.amberInk,
    marginTop: Spacing.xs,
  },
  expirationTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: colors.amberInk,
  },
  expirationBody: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: colors.amberInk,
    marginTop: Spacing.xs,
  },

  // Progress card
  progressCard: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.xl,
    marginTop: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  progressTextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.textOnPrimary,
  },
  progressCount: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textOnPrimary,
  },
  progressBarBg: {
    height: 12,
    backgroundColor: colors.navySoft,
    borderRadius: 6,
    marginTop: Spacing.md,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: 12,
    backgroundColor: Colors.confirm,
    borderRadius: 6,
  },
  allDoneText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.confirm,
    textAlign: 'center',
    marginTop: Spacing.md,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  cardTaken: {
    opacity: 0.6,
    borderWidth: 2,
    borderColor: Colors.confirm,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Thumbnail
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: BorderRadius.md,
  },
  placeholderThumb: {
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  placeholderIcon: {
    fontSize: 28,
  },

  // Card info
  cardInfo: {
    flex: 1,
    marginLeft: Spacing.lg,
  },
  cardName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  cardDose: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  cardTime: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.accent,
    marginTop: 2,
  },
  textTaken: {
    color: Colors.disabled,
  },

  // Edit pencil
  editButton: {
    minWidth: MinTapSize,
    minHeight: MinTapSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIcon: {
    fontSize: 24,
  },

  // Checkmark button
  checkButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.lg,
    height: CHECK_HEIGHT,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  checkButtonTaken: {
    backgroundColor: Colors.confirm,
    borderColor: Colors.confirm,
  },
  checkIcon: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textOnPrimary,
    marginRight: Spacing.sm,
  },
  checkIconPending: {
    color: Colors.textSecondary,
  },
  checkLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  checkLabelTaken: {
    color: Colors.textOnConfirm,
  },

  // Empty
  empty: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxl,
    lineHeight: 30,
  },
});
