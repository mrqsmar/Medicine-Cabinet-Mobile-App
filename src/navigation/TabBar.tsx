import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { colors } from '../theme/tokens';
import { FontWeights } from '../theme';

// ── Tab definitions — key must match the navigator route name ────────

const TAB_CONFIG: Record<string, { label: string; icon: string }> = {
  Today:    { label: 'Today',    icon: '⌂' },
  Meds:     { label: 'Meds',     icon: '⊕' },
  Progress: { label: 'Progress', icon: '▲' },
  More:     { label: 'More',     icon: '≡' },
};

const ICON_SIZE = 26;
const LABEL_SIZE = 12;
const MIN_TOUCH = 56;

// ── Component ────────────────────────────────────────────────────────

export default function TabBar({
  state,
  navigation,
}: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        // 30 pt minimum clears the home indicator on all devices
        { paddingBottom: Math.max(insets.bottom, 30) },
      ]}
    >
      {state.routes.map((route, index) => {
        const active = state.index === index;
        const cfg = TAB_CONFIG[route.name] ?? {
          label: route.name,
          icon: '●',
        };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!active && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tab}
            onPress={onPress}
            onLongPress={() =>
              navigation.emit({ type: 'tabLongPress', target: route.key })
            }
            activeOpacity={0.65}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={cfg.label}
          >
            <Text
              style={[
                styles.icon,
                { color: active ? colors.navy : colors.mute },
              ]}
            >
              {cfg.icon}
            </Text>
            <Text
              style={[
                styles.label,
                active ? styles.labelActive : styles.labelInactive,
              ]}
            >
              {cfg.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Styles ───────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    // rgba(255,253,249,0.94) — warm canvas tint, near-opaque
    backgroundColor: 'rgba(255,253,249,0.94)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.hairline,
    paddingTop: 8,
    // Shadow lets content peek through the semi-transparent bar
    shadowColor: colors.ink,
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 8,
  },
  tab: {
    flex: 1,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 4,
    gap: 2,
  },
  icon: {
    fontSize: ICON_SIZE,
    lineHeight: ICON_SIZE + 4,
  },
  label: {
    fontSize: LABEL_SIZE,
    letterSpacing: 0.1,
  },
  labelActive: {
    color: colors.navy,
    fontWeight: FontWeights.bold,
  },
  labelInactive: {
    color: colors.mute,
    fontWeight: FontWeights.regular,
  },
});
