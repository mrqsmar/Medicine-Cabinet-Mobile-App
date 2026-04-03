import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Switch,
  TextInput,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadow,
  MinTapSize,
} from '../theme';
import { CancelSaveBar, BigButton } from '../components';
import { useMedications } from '../context/MedicationContext';
import {
  getAllReminders,
  upsertReminder,
  deleteReminder,
} from '../database';
import { scheduleMedicationReminders } from '../services/notifications';
import type { ReminderSchedule, Medication, Recurrence } from '../types/medication';

// ── Row model ───────────────────────────────────────────────────────

interface ReminderRow {
  reminder: ReminderSchedule;
  medication: Medication;
  editing: boolean;
  editTimes: string[];
  editTimeInput: string;
}

// ── Screen ──────────────────────────────────────────────────────────

export default function RemindersScreen() {
  const { state } = useMedications();
  const [rows, setRows] = useState<ReminderRow[]>([]);

  // Build rows: one reminder per medication. Auto-create if missing.
  useFocusEffect(
    useCallback(() => {
      (async () => {
        const existing = await getAllReminders();
        const reminderMap = new Map<string, ReminderSchedule>();
        for (const r of existing) reminderMap.set(r.medicationId, r);

        const built: ReminderRow[] = [];
        for (const med of state.medications) {
          let reminder = reminderMap.get(med.id);
          if (!reminder) {
            // Auto-create a reminder from the medication's schedule
            const ts = new Date().toISOString();
            reminder = {
              id: `reminder_${med.id}`,
              medicationId: med.id,
              times: [...med.times],
              repeatPattern: med.recurrence.toLowerCase() as any,
              enabled: true,
              notifyBefore: 0,
              createdAt: ts,
              updatedAt: ts,
            };
            await upsertReminder(reminder);
          }
          built.push({
            reminder,
            medication: med,
            editing: false,
            editTimes: [...reminder.times],
            editTimeInput: '',
          });
        }
        setRows(built);
      })();
    }, [state.medications]),
  );

  // ── Actions ─────────────────────────────────────────────────────

  const toggleEnabled = async (idx: number) => {
    const row = rows[idx];
    const updated: ReminderSchedule = {
      ...row.reminder,
      enabled: !row.reminder.enabled,
      updatedAt: new Date().toISOString(),
    };
    await upsertReminder(updated);
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, reminder: updated } : r)),
    );
    // Reschedule notifications
    await scheduleMedicationReminders(state.medications);
  };

  const startEditing = (idx: number) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, editing: true, editTimes: [...r.reminder.times], editTimeInput: '' }
          : r,
      ),
    );
  };

  const cancelEditing = (idx: number) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, editing: false } : r)),
    );
  };

  const addEditTime = (idx: number) => {
    const row = rows[idx];
    const t = row.editTimeInput.trim();
    if (!/^[0-2]\d:[0-5]\d$/.test(t)) return;
    if (row.editTimes.includes(t)) return;
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, editTimes: [...r.editTimes, t].sort(), editTimeInput: '' }
          : r,
      ),
    );
  };

  const removeEditTime = (idx: number, time: string) => {
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx
          ? { ...r, editTimes: r.editTimes.filter((x) => x !== time) }
          : r,
      ),
    );
  };

  const setEditTimeInput = (idx: number, val: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === idx ? { ...r, editTimeInput: val } : r)),
    );
  };

  const saveEditing = async (idx: number) => {
    const row = rows[idx];
    if (row.editTimes.length === 0) {
      Alert.alert('Required', 'Add at least one reminder time.');
      return;
    }
    const updated: ReminderSchedule = {
      ...row.reminder,
      times: row.editTimes,
      updatedAt: new Date().toISOString(),
    };
    await upsertReminder(updated);
    setRows((prev) =>
      prev.map((r, i) =>
        i === idx ? { ...r, reminder: updated, editing: false } : r,
      ),
    );
    await scheduleMedicationReminders(state.medications);
  };

  const handleDelete = (idx: number) => {
    const row = rows[idx];
    Alert.alert(
      'Delete Reminder',
      `Remove the reminder for ${row.medication.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            await deleteReminder(row.reminder.id);
            setRows((prev) => prev.filter((_, i) => i !== idx));
            await scheduleMedicationReminders(state.medications);
          },
        },
      ],
    );
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.scrollContent}
    >
      <Text style={styles.heading}>Reminders</Text>
      <Text style={styles.subheading}>
        Manage notification times for each medication
      </Text>

      {rows.length === 0 ? (
        <Text style={styles.empty}>
          No medications yet.{'\n'}Add a medication to create reminders.
        </Text>
      ) : (
        rows.map((row, idx) => (
          <ReminderCard
            key={row.reminder.id}
            row={row}
            onToggle={() => toggleEnabled(idx)}
            onStartEdit={() => startEditing(idx)}
            onCancelEdit={() => cancelEditing(idx)}
            onSaveEdit={() => saveEditing(idx)}
            onAddTime={() => addEditTime(idx)}
            onRemoveTime={(t) => removeEditTime(idx, t)}
            onTimeInputChange={(v) => setEditTimeInput(idx, v)}
            onDelete={() => handleDelete(idx)}
          />
        ))
      )}
    </ScrollView>
  );
}

// ── ReminderCard ────────────────────────────────────────────────────

interface ReminderCardProps {
  row: ReminderRow;
  onToggle: () => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
  onSaveEdit: () => void;
  onAddTime: () => void;
  onRemoveTime: (time: string) => void;
  onTimeInputChange: (val: string) => void;
  onDelete: () => void;
}

function ReminderCard({
  row,
  onToggle,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onAddTime,
  onRemoveTime,
  onTimeInputChange,
  onDelete,
}: ReminderCardProps) {
  const { reminder, medication, editing, editTimes, editTimeInput } = row;
  const recurrenceLabel =
    reminder.repeatPattern.charAt(0).toUpperCase() +
    reminder.repeatPattern.slice(1);

  return (
    <View style={[styles.card, !reminder.enabled && styles.cardDisabled]}>
      {/* Header row: name + switch */}
      <View style={styles.cardHeader}>
        <View style={styles.cardHeaderLeft}>
          <Text style={styles.medName}>{medication.name}</Text>
          <Text style={styles.recurrence}>{recurrenceLabel}</Text>
        </View>
        <Switch
          value={reminder.enabled}
          onValueChange={onToggle}
          trackColor={{ true: Colors.confirm, false: Colors.border }}
          thumbColor={Colors.white}
          accessibilityLabel={`Toggle reminder for ${medication.name}`}
        />
      </View>

      {/* Times display / edit */}
      {!editing ? (
        <>
          <View style={styles.timesRow}>
            {reminder.times.map((t) => (
              <View key={t} style={styles.timeBadge}>
                <Text style={styles.timeBadgeText}>{t}</Text>
              </View>
            ))}
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity
              onPress={onStartEdit}
              style={styles.editBtn}
              accessibilityRole="button"
              accessibilityLabel="Edit reminder times"
            >
              <Text style={styles.editBtnText}>Edit Times</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onDelete}
              style={styles.deleteBtn}
              accessibilityRole="button"
              accessibilityLabel="Delete reminder"
            >
              <Text style={styles.deleteBtnText}>Delete</Text>
            </TouchableOpacity>
          </View>
        </>
      ) : (
        <>
          {/* Edit mode */}
          <Text style={styles.editLabel}>Reminder Times</Text>
          <View style={styles.timeInputRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={editTimeInput}
              onChangeText={onTimeInputChange}
              placeholder="08:00"
              placeholderTextColor={Colors.disabled}
              accessibilityLabel="New reminder time"
            />
            <BigButton
              label="Add"
              onPress={onAddTime}
              variant="outline"
              style={{ width: 80, marginLeft: Spacing.sm }}
            />
          </View>
          <View style={styles.chipRow}>
            {editTimes.map((t) => (
              <TouchableOpacity
                key={t}
                style={styles.chip}
                onPress={() => onRemoveTime(t)}
                accessibilityLabel={`Remove ${t}`}
                accessibilityRole="button"
              >
                <Text style={styles.chipText}>{t} ✕</Text>
              </TouchableOpacity>
            ))}
          </View>
          <CancelSaveBar
            onCancel={onCancelEdit}
            onSave={onSaveEdit}
            saveDisabled={editTimes.length === 0}
          />
        </>
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
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl + 24,
  },
  heading: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  subheading: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  empty: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxl,
    lineHeight: 30,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
    ...Shadow.md,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardHeaderLeft: {
    flex: 1,
  },
  medName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  recurrence: {
    fontSize: FontSizes.base,
    color: Colors.accent,
    marginTop: 2,
    textTransform: 'capitalize',
  },

  // Times badges
  timesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.lg,
  },
  timeBadge: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    minHeight: MinTapSize,
    justifyContent: 'center',
  },
  timeBadgeText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textOnPrimary,
  },

  // Action row
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.lg,
    gap: Spacing.md,
  },
  editBtn: {
    flex: 1,
    minHeight: MinTapSize,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  editBtnText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.primary,
  },
  deleteBtn: {
    minHeight: MinTapSize,
    minWidth: MinTapSize,
    borderRadius: BorderRadius.md,
    borderWidth: 2,
    borderColor: Colors.cancel,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.lg,
  },
  deleteBtnText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.cancel,
  },

  // Edit mode
  editLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
    marginBottom: Spacing.sm,
  },
  timeInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.surface,
    minHeight: MinTapSize,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  chip: {
    backgroundColor: Colors.background,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: BorderRadius.pill,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: MinTapSize,
    justifyContent: 'center',
  },
  chipText: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
  },
});
