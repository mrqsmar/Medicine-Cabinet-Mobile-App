import React, { useState, useCallback } from 'react';
import { View, Text, FlatList, Switch, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadow,
} from '../theme';
import { getAllReminders, getAllMedications, upsertReminder } from '../database';
import type { ReminderSchedule, Medication } from '../types/medication';

interface ReminderRow {
  reminder: ReminderSchedule;
  medicationName: string;
}

export default function RemindersScreen() {
  const [rows, setRows] = useState<ReminderRow[]>([]);

  useFocusEffect(
    useCallback(() => {
      (async () => {
        const [reminders, meds] = await Promise.all([
          getAllReminders(),
          getAllMedications(),
        ]);
        const medMap = new Map<string, Medication>();
        for (const m of meds) medMap.set(m.id, m);

        setRows(
          reminders.map((r) => ({
            reminder: r,
            medicationName: medMap.get(r.medicationId)?.name ?? 'Unknown',
          })),
        );
      })();
    }, []),
  );

  const toggleEnabled = async (reminder: ReminderSchedule) => {
    const updated: ReminderSchedule = {
      ...reminder,
      enabled: !reminder.enabled,
      updatedAt: new Date().toISOString(),
    };
    await upsertReminder(updated);
    setRows((prev) =>
      prev.map((r) =>
        r.reminder.id === reminder.id ? { ...r, reminder: updated } : r,
      ),
    );
  };

  const renderItem = ({ item }: { item: ReminderRow }) => {
    const { reminder, medicationName } = item;
    return (
      <View style={styles.card}>
        <View style={styles.cardLeft}>
          <Text style={styles.medName}>{medicationName}</Text>
          <Text style={styles.times}>{reminder.times.join(', ')}</Text>
          <Text style={styles.pattern}>
            {reminder.repeatPattern}
            {reminder.notifyBefore > 0
              ? ` · ${reminder.notifyBefore} min early`
              : ''}
          </Text>
        </View>
        <Switch
          value={reminder.enabled}
          onValueChange={() => toggleEnabled(reminder)}
          trackColor={{ true: Colors.confirm, false: Colors.border }}
          thumbColor={Colors.white}
          accessibilityLabel={`Toggle reminder for ${medicationName}`}
        />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={rows}
        keyExtractor={(item) => item.reminder.id}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No reminders yet.{'\n'}Add a medication to create reminders.
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...Shadow.sm,
  },
  cardLeft: {
    flex: 1,
  },
  medName: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  times: {
    fontSize: FontSizes.base,
    color: Colors.accent,
    marginTop: 2,
  },
  pattern: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  empty: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxl,
    lineHeight: 28,
  },
});
