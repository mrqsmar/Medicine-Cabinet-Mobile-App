import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView } from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { getMedicationById } from '../database';
import type { Medication } from '../types/medication';
import { BigButton } from '../components';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadow,
} from '../theme';

export default function MedicationDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'MedicationDetail'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [med, setMed] = useState<Medication | null>(null);

  useEffect(() => {
    getMedicationById(route.params.medicationId).then(setMed);
  }, [route.params.medicationId]);

  if (!med) return null;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {med.pillPhotoUri ? (
        <Image
          source={{ uri: med.pillPhotoUri }}
          style={styles.photo}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.photo, styles.placeholderPhoto]}>
          <Text style={styles.placeholderIcon}>💊</Text>
        </View>
      )}

      <Text style={styles.name}>{med.name}</Text>
      <Text style={styles.meta}>{med.dosage}</Text>
      {med.pillDescription ? (
        <Text style={styles.meta}>{med.pillDescription}</Text>
      ) : null}

      <Section title="Instructions">{med.instructions || '—'}</Section>

      {med.doctorNotes ? (
        <Section title="Doctor's Notes">{med.doctorNotes}</Section>
      ) : null}

      <Section title="Schedule">{med.times?.join(', ') || '—'}</Section>

      {med.pharmacyPhone ? (
        <Section title="Pharmacy">{`📞 ${med.pharmacyPhone}`}</Section>
      ) : null}

      <BigButton
        label="Edit Medication"
        onPress={() =>
          navigation.navigate('AddEditMedication', { medicationId: med.id })
        }
        variant="primary"
        style={{ marginTop: Spacing.xl }}
        accessibilityHint="Opens the edit form for this medication"
      />
    </ScrollView>
  );
}

function Section({ title, children }: { title: string; children: string }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <Text style={styles.body}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  photo: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: 'center',
  },
  placeholderPhoto: {
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  placeholderIcon: {
    fontSize: 48,
  },
  name: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    textAlign: 'center',
    color: Colors.textPrimary,
    marginTop: Spacing.lg,
  },
  meta: {
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: FontSizes.base,
    marginTop: Spacing.xs,
  },
  section: {
    marginTop: Spacing.xl,
  },
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  body: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    marginTop: Spacing.xs,
    lineHeight: 26,
  },
});
