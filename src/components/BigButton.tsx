import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  MinTapSize,
  BorderRadius,
} from '../theme';

type Variant = 'primary' | 'confirm' | 'cancel' | 'outline';

interface BigButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityHint?: string;
}

const backgroundForVariant: Record<Variant, string> = {
  primary: Colors.primary,
  confirm: Colors.confirm,
  cancel: Colors.cancel,
  outline: 'transparent',
};

const textForVariant: Record<Variant, string> = {
  primary: Colors.textOnPrimary,
  confirm: Colors.textOnConfirm,
  cancel: Colors.textOnCancel,
  outline: Colors.primary,
};

export default function BigButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  textStyle,
  accessibilityHint,
}: BigButtonProps) {
  const bg = disabled ? Colors.disabled : backgroundForVariant[variant];
  const fg = disabled ? Colors.white : textForVariant[variant];

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled }}
      style={[
        styles.button,
        { backgroundColor: bg },
        variant === 'outline' && { borderWidth: 2, borderColor: Colors.primary },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} size="small" />
      ) : (
        <Text style={[styles.label, { color: fg }, textStyle]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    width: '100%',
    minHeight: MinTapSize,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    borderRadius: BorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    textAlign: 'center',
  },
});
