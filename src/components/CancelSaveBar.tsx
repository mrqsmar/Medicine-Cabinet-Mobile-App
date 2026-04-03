import React from 'react';
import { View, StyleSheet } from 'react-native';
import BigButton from './BigButton';
import { Spacing } from '../theme';

interface CancelSaveBarProps {
  onCancel: () => void;
  onSave: () => void;
  cancelLabel?: string;
  saveLabel?: string;
  saveDisabled?: boolean;
  saving?: boolean;
}

export default function CancelSaveBar({
  onCancel,
  onSave,
  cancelLabel = 'Cancel',
  saveLabel = 'Save',
  saveDisabled = false,
  saving = false,
}: CancelSaveBarProps) {
  return (
    <View style={styles.row}>
      <View style={styles.half}>
        <BigButton
          label={cancelLabel}
          onPress={onCancel}
          variant="cancel"
          accessibilityHint="Discard changes and go back"
        />
      </View>
      <View style={styles.half}>
        <BigButton
          label={saveLabel}
          onPress={onSave}
          variant="confirm"
          disabled={saveDisabled}
          loading={saving}
          accessibilityHint="Save your changes"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.lg,
  },
  half: {
    flex: 1,
  },
});
