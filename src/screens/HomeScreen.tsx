import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius, Shadow } from '../theme';
import { CheckmarkBadge } from '../components';
import { useMedications } from '../context/MedicationContext';
import { getDoseLogsForDate } from '../database';
import { format } from 'date-fns';
import type { Medication, DoseLog } from '../types/medication';

interface DoseRow {
  medication: Medication;
  log?: DoseLog;
  time: string;
}

export default function HomeScreen() {
  const { state } = useMedications();
  const [doseRows, setDoseRows] = useState<DoseRow[]>([]);
  const today = format(new Date(), 'yyyy-MM-dd');

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const logs = await getDoseLogsForDate(today);
        const logMap = new Map<string, DoseLog>();
        for (const l of logs) {
          logMap.set(`${l.medicationId}_${l.scheduledTime}`, l);
        }

        const rows: DoseRow[] = [];
        for (const med of state.medications) {
          for (const t of med.times) {
            rows.push({
              medication: med,
              log: logMap.get(`${med.id}_${t}`),
              time: t,
            });
          }
        }
        rows.sort((a, b) => a.time.localeCompare(b.time));
        setDoseRows(rows);
      })();
    }, [today, state.medications]),
  );

  const takenCount = doseRows.filter((r) => r.log?.status === 'taken').length;

  const renderItem = ({ item }: { item: DoseRow }) => {
    const status = item.log?.status ?? 'pending';
    const photoSource = item.medication.photoUri ?? item.medication.pillPhotoUri;

    return (
      <View
        style={[styles.doseCard, status === 'taken' && styles.doseCardDone]}
        accessibilityLabel={`${item.medication.name} at ${item.time}, ${status}`}
      >
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
        <View style={styles.doseInfo}>
          <Text style={styles.medName}>{item.medication.name}</Text>
          <Text style={styles.doseTime}>
            {item.time} · {item.medication.dosageAmount} {item.medication.dosageUnit}
          </Text>
        </View>
        <CheckmarkBadge status={status} size={36} />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>Today</Text>
        <Text style={styles.summaryCount}>
          {takenCount} / {doseRows.length} doses taken
        </Text>
      </View>

      <FlatList
        data={doseRows}
        keyExtractor={(item) => `${item.medication.id}_${item.time}`}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No medications scheduled today.</Text>
        }
      />
    </View>
  );
}

const THUMB_SIZE = 48;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  summaryCard: {
    backgroundColor: Colors.primary,
    padding: Spacing.xl,
    margin: Spacing.lg,
    borderRadius: BorderRadius.lg,
  },
  summaryTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textOnPrimary,
  },
  summaryCount: {
    fontSize: FontSizes.md,
    color: Colors.textOnPrimary,
    marginTop: Spacing.xs,
  },
  list: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  doseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  doseCardDone: {
    opacity: 0.55,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: BorderRadius.sm,
    marginRight: Spacing.md,
  },
  placeholderThumb: {
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 22,
  },
  doseInfo: {
    flex: 1,
  },
  medName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  doseTime: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  empty: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
