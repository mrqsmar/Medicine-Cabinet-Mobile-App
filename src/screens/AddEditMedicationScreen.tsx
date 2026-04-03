import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Platform,
  Alert,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useMedications } from '../context/MedicationContext';
import { getMedicationById } from '../database';
import type {
  Medication,
  DosageUnit,
  Recurrence,
} from '../types/medication';
import { CancelSaveBar, BigButton } from '../components';
import SegmentedControl from '../components/SegmentedControl';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  MinTapSize,
  Shadow,
} from '../theme';
import { format, parse } from 'date-fns';

// ── Helpers ─────────────────────────────────────────────────────────

const now = () => new Date().toISOString();
const todayStr = () => format(new Date(), 'yyyy-MM-dd');

function blankMedication(): Medication {
  const ts = now();
  return {
    id: uuidv4(),
    name: '',
    photoUri: undefined,
    dosageAmount: 0,
    dosageUnit: 'mg',
    dosage: '',
    prescribingDoctor: '',
    startDate: todayStr(),
    expirationDate: '',
    recurrence: 'Daily',
    notes: '',
    colorShape: '',
    form: 'tablet',
    times: ['08:00'],
    createdAt: ts,
    updatedAt: ts,
  };
}

// ── Screen ──────────────────────────────────────────────────────────

export default function AddEditMedicationScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'AddEditMedication'>>();
  const navigation = useNavigation();
  const { saveMedication } = useMedications();

  const isEditing = !!route.params?.medicationId;

  const [med, setMed] = useState<Medication>(blankMedication);
  const [saving, setSaving] = useState(false);
  const [timeInput, setTimeInput] = useState('08:00');

  // Date picker state
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showExpPicker, setShowExpPicker] = useState(false);

  useEffect(() => {
    if (route.params?.medicationId) {
      getMedicationById(route.params.medicationId).then((m) => {
        if (m) setMed(m);
      });
    }
  }, [route.params?.medicationId]);

  // ── Field helpers ───────────────────────────────────────────────

  const set = <K extends keyof Medication>(key: K, value: Medication[K]) =>
    setMed((prev) => ({ ...prev, [key]: value }));

  const addTime = () => {
    if (!/^[0-2]\d:[0-5]\d$/.test(timeInput)) return;
    if (!med.times.includes(timeInput))
      setMed((prev) => ({ ...prev, times: [...prev.times, timeInput].sort() }));
  };

  const removeTime = (t: string) =>
    setMed((prev) => ({ ...prev, times: prev.times.filter((x) => x !== t) }));

  // ── Photo ─────────────────────────────────────────────────────

  const pickPhoto = () => {
    Alert.alert('Add Photo', 'Choose a source', [
      {
        text: 'Camera',
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) {
            Alert.alert('Permission required', 'Camera access is needed to take a photo.');
            return;
          }
          const res = await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 0.8,
          });
          if (!res.canceled) set('photoUri', res.assets[0].uri);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const res = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 0.8,
          });
          if (!res.canceled) set('photoUri', res.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  // ── Date pickers ──────────────────────────────────────────────

  const onStartDateChange = (_e: DateTimePickerEvent, date?: Date) => {
    setShowStartPicker(Platform.OS === 'ios');
    if (date) set('startDate', format(date, 'yyyy-MM-dd'));
  };

  const onExpDateChange = (_e: DateTimePickerEvent, date?: Date) => {
    setShowExpPicker(Platform.OS === 'ios');
    if (date) set('expirationDate', format(date, 'yyyy-MM-dd'));
  };

  const parseDate = (str: string): Date => {
    if (!str) return new Date();
    try {
      return parse(str, 'yyyy-MM-dd', new Date());
    } catch {
      return new Date();
    }
  };

  // ── Save ──────────────────────────────────────────────────────

  const onSave = async () => {
    const trimmedName = med.name.trim();
    if (!trimmedName) {
      Alert.alert('Required', 'Please enter a medication name.');
      return;
    }
    setSaving(true);
    const toSave: Medication = {
      ...med,
      name: trimmedName,
      dosage: `${med.dosageAmount} ${med.dosageUnit}`,
      pillPhotoUri: med.photoUri,
      pillDescription: med.colorShape,
      updatedAt: now(),
    };
    await saveMedication(toSave);
    setSaving(false);
    navigation.goBack();
  };

  // ── Render ────────────────────────────────────────────────────

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      {/* ── Photo ──────────────────────────────────── */}
      <TouchableOpacity
        onPress={pickPhoto}
        style={styles.photoWrap}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityLabel="Add medication photo"
      >
        {med.photoUri ? (
          <Image
            source={{ uri: med.photoUri }}
            style={styles.photo}
            accessibilityIgnoresInvertColors
          />
        ) : (
          <View style={[styles.photo, styles.photoPlaceholder]}>
            <Text style={styles.photoPlaceholderIcon}>📷</Text>
            <Text style={styles.photoPlaceholderText}>Tap to add photo</Text>
          </View>
        )}
      </TouchableOpacity>

      {/* ── Name ───────────────────────────────────── */}
      <Label text="Medication Name" />
      <TextInput
        style={styles.input}
        value={med.name}
        onChangeText={(v) => set('name', v)}
        placeholder="e.g. Metformin"
        placeholderTextColor={Colors.disabled}
        accessibilityLabel="Medication name"
        autoCapitalize="words"
      />

      {/* ── Dosage ─────────────────────────────────── */}
      <Label text="Dosage" />
      <View style={styles.dosageRow}>
        <TextInput
          style={[styles.input, styles.dosageInput]}
          value={med.dosageAmount ? String(med.dosageAmount) : ''}
          onChangeText={(v) => {
            const num = parseFloat(v);
            set('dosageAmount', isNaN(num) ? 0 : num);
          }}
          placeholder="500"
          placeholderTextColor={Colors.disabled}
          keyboardType="decimal-pad"
          accessibilityLabel="Dosage amount"
        />
        <View style={styles.dosageUnitWrap}>
          <SegmentedControl<DosageUnit>
            options={['mg', 'cc']}
            value={med.dosageUnit}
            onChange={(v) => {
              set('dosageUnit', v);
              set('form', v === 'cc' ? 'liquid' : 'tablet');
            }}
            labels={{ mg: 'mg (tablet)', cc: 'cc (liquid)' }}
            accessibilityLabel="Dosage unit"
          />
        </View>
      </View>

      {/* ── Prescribing Doctor ─────────────────────── */}
      <Label text="Prescribing Doctor" />
      <TextInput
        style={styles.input}
        value={med.prescribingDoctor}
        onChangeText={(v) => set('prescribingDoctor', v)}
        placeholder="Dr. Smith"
        placeholderTextColor={Colors.disabled}
        accessibilityLabel="Prescribing doctor"
        autoCapitalize="words"
      />

      {/* ── Start Date ─────────────────────────────── */}
      <Label text="Prescription Start Date" />
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowStartPicker(true)}
        accessibilityRole="button"
        accessibilityLabel="Select start date"
      >
        <Text style={styles.dateButtonText}>
          {med.startDate || 'Select date'}
        </Text>
      </TouchableOpacity>
      {showStartPicker && (
        <DateTimePicker
          value={parseDate(med.startDate)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onStartDateChange}
        />
      )}

      {/* ── Expiration Date ────────────────────────── */}
      <Label text="Expiration Date" />
      <TouchableOpacity
        style={styles.dateButton}
        onPress={() => setShowExpPicker(true)}
        accessibilityRole="button"
        accessibilityLabel="Select expiration date"
      >
        <Text style={styles.dateButtonText}>
          {med.expirationDate || 'Select date'}
        </Text>
      </TouchableOpacity>
      {showExpPicker && (
        <DateTimePicker
          value={parseDate(med.expirationDate)}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onExpDateChange}
          minimumDate={parseDate(med.startDate)}
        />
      )}

      {/* ── Recurrence ─────────────────────────────── */}
      <Label text="Recurrence" />
      <SegmentedControl<Recurrence>
        options={['Daily', 'Weekly', 'Monthly']}
        value={med.recurrence}
        onChange={(v) => set('recurrence', v)}
        accessibilityLabel="Recurrence pattern"
      />

      {/* ── Times ──────────────────────────────────── */}
      <Label text="Reminder Times" />
      <View style={styles.timeRow}>
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={timeInput}
          onChangeText={setTimeInput}
          placeholder="08:00"
          placeholderTextColor={Colors.disabled}
          accessibilityLabel="Time in HH:mm format"
        />
        <BigButton
          label="Add"
          onPress={addTime}
          variant="outline"
          style={{ width: 80, marginLeft: Spacing.sm }}
        />
      </View>
      <View style={styles.chipRow}>
        {med.times.map((t) => (
          <TouchableOpacity
            key={t}
            style={styles.chip}
            onPress={() => removeTime(t)}
            accessibilityLabel={`Remove ${t}`}
            accessibilityRole="button"
          >
            <Text style={styles.chipText}>{t} ✕</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Color / Shape ──────────────────────────── */}
      <Label text="Color / Shape Description" />
      <TextInput
        style={styles.input}
        value={med.colorShape}
        onChangeText={(v) => set('colorShape', v)}
        placeholder="White, round, imprint M500"
        placeholderTextColor={Colors.disabled}
        accessibilityLabel="Color and shape description"
      />

      {/* ── Notes ──────────────────────────────────── */}
      <Label text="Notes" />
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        value={med.notes}
        onChangeText={(v) => set('notes', v)}
        placeholder="Custom instructions, refill notes..."
        placeholderTextColor={Colors.disabled}
        accessibilityLabel="Notes"
      />

      {/* ── Cancel / Save ──────────────────────────── */}
      <CancelSaveBar
        onCancel={() => navigation.goBack()}
        onSave={onSave}
        saveDisabled={!med.name.trim()}
        saving={saving}
      />
    </ScrollView>
  );
}

// ── Label helper ────────────────────────────────────────────────────

function Label({ text }: { text: string }) {
  return <Text style={styles.label}>{text}</Text>;
}

// ── Styles ──────────────────────────────────────────────────────────

const PHOTO_SIZE = 120;

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  label: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    marginTop: Spacing.sm,
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
  multiline: {
    height: 100,
    textAlignVertical: 'top',
  },

  // Photo
  photoWrap: {
    alignSelf: 'center',
    marginBottom: Spacing.sm,
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
  },
  photoPlaceholder: {
    backgroundColor: Colors.background,
    borderWidth: 2,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPlaceholderIcon: {
    fontSize: 32,
  },
  photoPlaceholderText: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: Spacing.xs,
  },

  // Dosage row
  dosageRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  dosageInput: {
    flex: 1,
  },
  dosageUnitWrap: {
    flex: 2,
  },

  // Date buttons
  dateButton: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    backgroundColor: Colors.surface,
    minHeight: MinTapSize,
    justifyContent: 'center',
  },
  dateButtonText: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },

  // Time chips
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
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
