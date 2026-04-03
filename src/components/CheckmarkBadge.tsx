import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors, FontSizes, BorderRadius } from '../theme';
import type { IntakeStatus } from '../types/medication';

interface CheckmarkBadgeProps {
  status: IntakeStatus;
  size?: number;
}

const config: Record<
  IntakeStatus,
  { symbol: string; bg: string; fg: string; label: string }
> = {
  taken: {
    symbol: '✓',
    bg: Colors.confirm,
    fg: Colors.white,
    label: 'Taken',
  },
  skipped: {
    symbol: '—',
    bg: Colors.warning,
    fg: Colors.white,
    label: 'Skipped',
  },
  missed: {
    symbol: '✗',
    bg: Colors.cancel,
    fg: Colors.white,
    label: 'Missed',
  },
  pending: {
    symbol: '○',
    bg: Colors.border,
    fg: Colors.textSecondary,
    label: 'Pending',
  },
};

export default function CheckmarkBadge({ status, size = 32 }: CheckmarkBadgeProps) {
  const { symbol, bg, fg, label } = config[status];

  return (
    <View
      accessibilityRole="image"
      accessibilityLabel={label}
      style={[
        styles.badge,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: bg,
        },
      ]}
    >
      <Text
        style={[styles.symbol, { color: fg, fontSize: size * 0.55 }]}
        accessibilityElementsHidden
      >
        {symbol}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  symbol: {
    fontWeight: '700',
    textAlign: 'center',
  },
});
