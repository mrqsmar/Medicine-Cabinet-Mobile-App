import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadow,
  MinTapSize,
} from '../theme';
import { colors } from '../theme/tokens';

type Nav = NativeStackNavigationProp<RootStackParamList>;

// ── Row item ─────────────────────────────────────────────────────────

function NavRow({
  icon,
  label,
  sublabel,
  onPress,
  destructive,
}: {
  icon: string;
  label: string;
  sublabel?: string;
  onPress: () => void;
  destructive?: boolean;
}) {
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={onPress}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.rowIcon}>{icon}</Text>
      <View style={styles.rowTexts}>
        <Text
          style={[
            styles.rowLabel,
            destructive && { color: colors.coralInk },
          ]}
        >
          {label}
        </Text>
        {!!sublabel && <Text style={styles.rowSublabel}>{sublabel}</Text>}
      </View>
      <Text style={styles.chevron}>›</Text>
    </TouchableOpacity>
  );
}

// ── Screen ───────────────────────────────────────────────────────────

export default function MoreScreen() {
  const navigation = useNavigation<Nav>();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>More</Text>

      {/* ── Medications ──────────────────────────── */}
      <Text style={styles.sectionHeader}>Medications</Text>
      <View style={styles.card}>
        <NavRow
          icon="➕"
          label="Add Medication"
          sublabel="Scan a pill or enter details"
          onPress={() => navigation.navigate('AddEditMedication', {})}
        />
      </View>

      {/* ── Reminders & Settings ─────────────────── */}
      <Text style={styles.sectionHeader}>Tools</Text>
      <View style={styles.card}>
        <NavRow
          icon="🔔"
          label="Reminders"
          sublabel="Set notification times"
          onPress={() => navigation.navigate('Reminders')}
        />
        <View style={styles.divider} />
        <NavRow
          icon="⚙️"
          label="Settings"
          sublabel="Notifications, display, AI"
          onPress={() => navigation.navigate('Settings')}
        />
      </View>
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl + 24,
  },
  heading: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.6,
    marginBottom: Spacing.sm,
    paddingHorizontal: Spacing.xs,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    marginBottom: Spacing.xl,
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    minHeight: MinTapSize + 8,
    gap: Spacing.md,
  },
  rowIcon: {
    fontSize: 24,
    width: 32,
    textAlign: 'center',
  },
  rowTexts: {
    flex: 1,
  },
  rowLabel: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.textPrimary,
  },
  rowSublabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  chevron: {
    fontSize: 22,
    color: Colors.disabled,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
    marginLeft: Spacing.lg + 32 + Spacing.md,
  },
});
