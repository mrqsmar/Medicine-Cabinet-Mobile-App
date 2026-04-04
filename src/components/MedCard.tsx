import React from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadow,
  MinTapSize,
} from '../theme';
import type { Medication } from '../types/medication';

interface MedCardProps {
  medication: Medication;
  onPress?: () => void;
  onLongPress?: () => void;
}

export default function MedCard({ medication, onPress, onLongPress }: MedCardProps) {
  const timesLabel = medication.times.join(', ');
  const photoSource = medication.photoUri ?? medication.pillPhotoUri;
  const dosageLabel = medication.dosageAmount
    ? `${medication.dosageAmount} ${medication.dosageUnit}`
    : medication.dosage;

  return (
    <TouchableOpacity
      onPress={onPress}
      onLongPress={onLongPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={`${medication.name}, ${dosageLabel}, scheduled at ${timesLabel}`}
      style={styles.card}
    >
      <View style={styles.thumbnailWrap}>
        {photoSource ? (
          <Image
            source={{ uri: photoSource }}
            style={styles.thumbnail}
            accessibilityIgnoresInvertColors={true}
          />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderThumb]}>
            <Text style={styles.placeholderIcon}>💊</Text>
          </View>
        )}
      </View>

      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>
          {medication.name}
        </Text>
        <Text style={styles.dosage} numberOfLines={1}>
          {dosageLabel}
        </Text>
        <Text style={styles.times} numberOfLines={1}>
          {medication.recurrence} · {timesLabel}
        </Text>
      </View>

      <Text style={styles.chevron} accessibilityElementsHidden>
        ›
      </Text>
    </TouchableOpacity>
  );
}

const THUMB_SIZE = 56;

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    minHeight: MinTapSize,
    ...Shadow.sm,
  },
  thumbnailWrap: {
    marginRight: Spacing.lg,
  },
  thumbnail: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: BorderRadius.md,
  },
  placeholderThumb: {
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 28,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  dosage: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  times: {
    fontSize: FontSizes.sm,
    color: Colors.accent,
    marginTop: 4,
  },
  chevron: {
    fontSize: 28,
    color: Colors.disabled,
    marginLeft: Spacing.sm,
  },
});
