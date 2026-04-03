import React, { useEffect, useState, useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { useMedications } from '../context/MedicationContext';
import type { Medication } from '../types/medication';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadow,
  MinTapSize,
} from '../theme';

export default function MedicationDetailScreen() {
  const route = useRoute<RouteProp<RootStackParamList, 'MedicationDetail'>>();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { state } = useMedications();

  const med = state.medications.find(
    (m) => m.id === route.params.medicationId,
  ) ?? null;

  // Pencil icon in header to launch edit mode
  useLayoutEffect(() => {
    if (!med) return;
    navigation.setOptions({
      headerRight: () => (
        <TouchableOpacity
          onPress={() =>
            navigation.navigate('AddEditMedication', { medicationId: med.id })
          }
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          accessibilityRole="button"
          accessibilityLabel="Edit medication"
          style={styles.editIcon}
        >
          <Text style={styles.editIconText}>✏️</Text>
        </TouchableOpacity>
      ),
    });
  }, [navigation, med]);

  if (!med) return null;

  const photoSource = med.photoUri ?? med.pillPhotoUri;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      {/* Photo */}
      {photoSource ? (
        <Image
          source={{ uri: photoSource }}
          style={styles.photo}
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View style={[styles.photo, styles.placeholderPhoto]}>
          <Text style={styles.placeholderIcon}>💊</Text>
        </View>
      )}

      <Text style={styles.name}>{med.name}</Text>
      <Text style={styles.meta}>
        {med.dosageAmount} {med.dosageUnit}
      </Text>

      {/* Color / shape */}
      {med.colorShape ? (
        <InfoChip label={med.colorShape} />
      ) : null}

      {/* Detail rows */}
      <View style={styles.card}>
        <DetailRow label="Prescribing Doctor" value={med.prescribingDoctor} />
        <DetailRow label="Start Date" value={med.startDate} />
        <DetailRow label="Expiration Date" value={med.expirationDate} />
        <DetailRow label="Recurrence" value={med.recurrence} />
        <DetailRow label="Schedule" value={med.times?.join(', ') || '—'} />
        {med.pharmacyPhone ? (
          <DetailRow label="Pharmacy" value={`📞 ${med.pharmacyPhone}`} />
        ) : null}
      </View>

      {/* Notes */}
      {med.notes ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Notes</Text>
          <Text style={styles.body}>{med.notes}</Text>
        </View>
      ) : null}

      {/* Legacy fields */}
      {med.instructions ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Instructions</Text>
          <Text style={styles.body}>{med.instructions}</Text>
        </View>
      ) : null}
      {med.doctorNotes ? (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Doctor's Notes</Text>
          <Text style={styles.body}>{med.doctorNotes}</Text>
        </View>
      ) : null}
    </ScrollView>
  );
}

// ── Sub-components ──────────────────────────────────────────────────

function DetailRow({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailLabel}>{label}</Text>
      <Text style={styles.detailValue}>{value}</Text>
    </View>
  );
}

function InfoChip({ label }: { label: string }) {
  return (
    <View style={styles.infoChip}>
      <Text style={styles.infoChipText}>{label}</Text>
    </View>
  );
}

// ── Styles ──────────────────────────────────────────────────────────

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
    fontSize: FontSizes.md,
    marginTop: Spacing.xs,
  },

  // Info chip
  infoChip: {
    alignSelf: 'center',
    marginTop: Spacing.sm,
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.pill,
    paddingVertical: Spacing.xs,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  infoChipText: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
  },

  // Card
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.lg,
    ...Shadow.sm,
  },

  // Detail rows
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    minHeight: MinTapSize,
  },
  detailLabel: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    flex: 1,
  },
  detailValue: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
    flex: 1,
    textAlign: 'right',
  },

  // Section
  sectionTitle: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginBottom: Spacing.xs,
  },
  body: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    lineHeight: 26,
  },

  // Edit icon
  editIcon: {
    padding: Spacing.sm,
    minWidth: MinTapSize,
    minHeight: MinTapSize,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editIconText: {
    fontSize: 22,
  },
});
