import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  MinTapSize,
} from '../theme';

interface SegmentedControlProps<T extends string> {
  options: T[];
  value: T;
  onChange: (value: T) => void;
  labels?: Record<T, string>;
  accessibilityLabel?: string;
}

export default function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  labels,
  accessibilityLabel,
}: SegmentedControlProps<T>) {
  return (
    <View
      style={styles.container}
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
    >
      {options.map((opt) => {
        const selected = opt === value;
        return (
          <TouchableOpacity
            key={opt}
            style={[styles.segment, selected && styles.segmentActive]}
            onPress={() => onChange(opt)}
            activeOpacity={0.7}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            accessibilityLabel={labels?.[opt] ?? opt}
          >
            <Text style={[styles.label, selected && styles.labelActive]}>
              {labels?.[opt] ?? opt}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
  },
  segment: {
    flex: 1,
    minHeight: MinTapSize,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  segmentActive: {
    backgroundColor: Colors.primary,
  },
  label: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  labelActive: {
    color: Colors.textOnPrimary,
    fontWeight: FontWeights.bold,
  },
});
