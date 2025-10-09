import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getMedicationById } from '../services/storage';
import { Medication } from '../types/medication';

export default function MedicationDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'MedicationDetail'>>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [med, setMed] = useState<Medication | null>(null);

  useEffect(() => {
    getMedicationById(route.params.medicationId).then(setMed);
  }, [route.params.medicationId]);

  if (!med) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {med.pillPhotoUri ? (
        <Image source={{ uri: med.pillPhotoUri }} style={styles.photo} />
      ) : (
        <View style={styles.placeholderPhoto} />
      )}
      <Text style={styles.name}>{med.name}</Text>
      <Text style={styles.meta}>{med.dosage}</Text>
      {med.pillDescription ? <Text style={styles.meta}>{med.pillDescription}</Text> : null}
      <Text style={styles.sectionTitle}>Instructions</Text>
      <Text style={styles.body}>{med.instructions || '—'}</Text>
      {med.doctorNotes ? (
        <>
          <Text style={styles.sectionTitle}>Doctor’s notes</Text>
          <Text style={styles.body}>{med.doctorNotes}</Text>
        </>
      ) : null}
      <Text style={styles.sectionTitle}>Schedule</Text>
      <Text style={styles.body}>{med.times?.join(', ') || '—'}</Text>
      {med.pharmacyPhone ? (
        <Text style={styles.body}>Pharmacy: {med.pharmacyPhone}</Text>
      ) : null}
      <TouchableOpacity style={styles.editButton} onPress={() => navigation.navigate('AddEditMedication', { medicationId: med.id })}>
        <Text style={styles.editText}>Edit</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  photo: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center' },
  placeholderPhoto: { width: 100, height: 100, borderRadius: 50, alignSelf: 'center', backgroundColor: '#e5e5e5' },
  name: { fontSize: 22, fontWeight: '700', textAlign: 'center', marginTop: 12 },
  meta: { textAlign: 'center', color: '#666', marginTop: 4 },
  sectionTitle: { marginTop: 16, fontWeight: '700' },
  body: { marginTop: 4, color: '#111' },
  editButton: { marginTop: 24, backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 8, alignItems: 'center' },
  editText: { color: 'white', fontWeight: '700' }
});
