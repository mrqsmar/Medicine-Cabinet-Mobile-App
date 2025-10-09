import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';
import { getMedicationById, saveMedication } from '../services/storage';
import { Medication } from '../types/medication';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { RootStackParamList } from '../navigation/AppNavigator';

export default function AddEditMedicationScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'AddEditMedication'>>();
  const navigation = useNavigation();
  const [med, setMed] = useState<Medication>({
    id: uuidv4(),
    name: '',
    dosage: '',
    times: [],
    pillPhotoUri: undefined,
    pillDescription: '',
    instructions: '',
    doctorNotes: '',
    pharmacyPhone: '',
    remainingPills: undefined,
    dailyDoses: undefined,
  });
  const [timeInput, setTimeInput] = useState('08:00');

  useEffect(() => {
    if (route.params?.medicationId) {
      getMedicationById(route.params.medicationId).then((m) => m && setMed(m));
    }
  }, [route.params?.medicationId]);

  const addTime = () => {
    if (!/^[0-2][0-9]:[0-5][0-9]$/.test(timeInput)) return;
    if (!med.times.includes(timeInput)) setMed({ ...med, times: [...med.times, timeInput].sort() });
  };

  const removeTime = (t: string) => setMed({ ...med, times: med.times.filter((x) => x !== t) });

  const pickImage = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, quality: 0.8 });
    if (!res.canceled) setMed({ ...med, pillPhotoUri: res.assets[0].uri });
  };

  const onSave = async () => {
    const toSave = { ...med, name: med.name.trim() };
    if (!toSave.name) return;
    await saveMedication(toSave);
    navigation.goBack();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.label}>Name</Text>
      <TextInput style={styles.input} value={med.name} onChangeText={(v) => setMed({ ...med, name: v })} placeholder="Metformin" />

      <Text style={styles.label}>Dosage</Text>
      <TextInput style={styles.input} value={med.dosage} onChangeText={(v) => setMed({ ...med, dosage: v })} placeholder="500mg" />

      <Text style={styles.label}>Times per day</Text>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
        <TextInput style={[styles.input, { flex: 1 }]} value={timeInput} onChangeText={setTimeInput} placeholder="08:00" />
        <TouchableOpacity style={[styles.button, styles.secondary]} onPress={addTime}><Text style={styles.buttonText}>Add</Text></TouchableOpacity>
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 }}>
        {med.times.map((t) => (
          <TouchableOpacity key={t} style={styles.chip} onPress={() => removeTime(t)}>
            <Text style={styles.chipText}>{t} ✕</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>Pill details</Text>
      <TextInput style={styles.input} value={med.pillDescription} onChangeText={(v) => setMed({ ...med, pillDescription: v })} placeholder="Blue, round, imprint M 500" />

      <Text style={styles.label}>Instructions</Text>
      <TextInput style={[styles.input, { height: 80 }]} multiline value={med.instructions} onChangeText={(v) => setMed({ ...med, instructions: v })} placeholder="Take with breakfast" />

      <Text style={styles.label}>Doctor’s notes</Text>
      <TextInput style={[styles.input, { height: 80 }]} multiline value={med.doctorNotes} onChangeText={(v) => setMed({ ...med, doctorNotes: v })} placeholder="Watch for dizziness" />

      <Text style={styles.label}>Pharmacy phone</Text>
      <TextInput style={styles.input} value={med.pharmacyPhone} onChangeText={(v) => setMed({ ...med, pharmacyPhone: v })} placeholder="5551234567" keyboardType="phone-pad" />

      <Text style={styles.label}>Pill count remaining (optional)</Text>
      <TextInput style={styles.input} value={med.remainingPills?.toString() || ''} onChangeText={(v) => setMed({ ...med, remainingPills: v ? Number(v) : undefined })} keyboardType="numeric" />

      <Text style={styles.label}>Daily doses (optional)</Text>
      <TextInput style={styles.input} value={med.dailyDoses?.toString() || ''} onChangeText={(v) => setMed({ ...med, dailyDoses: v ? Number(v) : undefined })} keyboardType="numeric" />

      <TouchableOpacity style={[styles.button, styles.secondary]} onPress={pickImage}>
        <Text style={styles.buttonText}>Pick pill photo</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.primary]} onPress={onSave}>
        <Text style={styles.buttonText}>Save</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 12 },
  label: { fontWeight: '700' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 8, padding: 12 },
  button: { paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  primary: { backgroundColor: '#2563eb' },
  secondary: { backgroundColor: '#e5e7eb' },
  buttonText: { color: '#111', fontWeight: '700' },
  chip: { backgroundColor: '#f3f4f6', paddingVertical: 6, paddingHorizontal: 10, borderRadius: 16 },
  chipText: { color: '#111' }
});
