import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { getMedicationById, upsertMedication } from '../database';
import type { Medication, MedicationForm } from '../types/medication';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { CancelSaveBar, BigButton } from '../components';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  MinTapSize,
} from '../theme';

const now = () => new Date().toISOString();

export default function AddEditMedicationScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'AddEditMedication'>>();
  const navigation = useNavigation();

  const [med, setMed] = useState<Medication>({
    id: uuidv4(),
    name: '',
    dosage: '',
    form: 'tablet',
    times: [],
    pillPhotoUri: undefined,
    pillDescription: '',
    instructions: '',
    doctorNotes: '',
    pharmacyPhone: '',
    remainingPills: undefined,
    dailyDoses: undefined,
    createdAt: now(),
    updatedAt: now(),
  });
  const [timeInput, setTimeInput] = useState('08:00');

  useEffect(() => {
    if (route.params?.medicationId) {
      getMedicationById(route.params.medicationId).then(
        (m) => m && setMed(m),
      );
    }
  }, [route.params?.medicationId]);

  const addTime = () => {
    if (!/^[0-2][0-9]:[0-5][0-9]$/.test(timeInput)) return;
    if (!med.times.includes(timeInput))
      setMed({ ...med, times: [...med.times, timeInput].sort() });
  };

  const removeTime = (t: string) =>
    setMed({ ...med, times: med.times.filter((x) => x !== t) });

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
    });
    if (!res.canceled) setMed({ ...med, pillPhotoUri: res.assets[0].uri });
  };

  const onSave = async () => {
    const toSave: Medication = { ...med, name: med.name.trim(), updatedAt: now() };
    if (!toSave.name) return;
    await upsertMedication(toSave);
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput
        style={styles.input}
        value={med.name}
        onChangeText={(v) => setMed({ ...med, name: v })}
        placeholder="Metformin"
        placeholderTextColor={Colors.disabled}
        accessibilityLabel="Medication name"
      />

      <Text style={styles.label}>Dosage</Text>
      <TextInput
        style={styles.input}
        value={med.dosage}
        onChangeText={(v) => setMed({ ...med, dosage: v })}
        placeholder="500mg"
        placeholderTextColor={Colors.disabled}
        accessibilityLabel="Dosage"
      />

      <Text style={styles.label}>Times per day</Text>
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

      <Text style={styles.label}>Pill details</Text>
      <TextInput
        style={styles.input}
        value={med.pillDescription}
        onChangeText={(v) => setMed({ ...med, pillDescription: v })}
        placeholder="Blue, round, imprint M 500"
        placeholderTextColor={Colors.disabled}
        accessibilityLabel="Pill description"
      />

      <Text style={styles.label}>Instructions</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        value={med.instructions}
        onChangeText={(v) => setMed({ ...med, instructions: v })}
        placeholder="Take with breakfast"
        placeholderTextColor={Colors.disabled}
        accessibilityLabel="Instructions"
      />

      <Text style={styles.label}>Doctor's notes</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        multiline
        value={med.doctorNotes}
        onChangeText={(v) => setMed({ ...med, doctorNotes: v })}
        placeholder="Watch for dizziness"
        placeholderTextColor={Colors.disabled}
        accessibilityLabel="Doctor notes"
      />

      <Text style={styles.label}>Pharmacy phone</Text>
      <TextInput
        style={styles.input}
        value={med.pharmacyPhone}
        onChangeText={(v) => setMed({ ...med, pharmacyPhone: v })}
        placeholder="5551234567"
        placeholderTextColor={Colors.disabled}
        keyboardType="phone-pad"
        accessibilityLabel="Pharmacy phone number"
      />

      <Text style={styles.label}>Pill count remaining (optional)</Text>
      <TextInput
        style={styles.input}
        value={med.remainingPills?.toString() || ''}
        onChangeText={(v) =>
          setMed({ ...med, remainingPills: v ? Number(v) : undefined })
        }
        keyboardType="numeric"
        placeholderTextColor={Colors.disabled}
        accessibilityLabel="Remaining pill count"
      />

      <Text style={styles.label}>Daily doses (optional)</Text>
      <TextInput
        style={styles.input}
        value={med.dailyDoses?.toString() || ''}
        onChangeText={(v) =>
          setMed({ ...med, dailyDoses: v ? Number(v) : undefined })
        }
        keyboardType="numeric"
        placeholderTextColor={Colors.disabled}
        accessibilityLabel="Number of daily doses"
      />

      <BigButton
        label="Pick pill photo"
        onPress={pickImage}
        variant="outline"
        style={{ marginTop: Spacing.sm }}
      />

      <CancelSaveBar
        onCancel={() => navigation.goBack()}
        onSave={onSave}
        saveDisabled={!med.name.trim()}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    gap: Spacing.md,
    paddingBottom: Spacing.xxxl,
  },
  label: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
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
    height: 90,
    textAlignVertical: 'top',
  },
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
