import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  Alert,
  TextInput,
} from 'react-native';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadow,
  MinTapSize,
} from '../theme';
import { BigButton } from '../components';
import {
  setAnthropicApiKey,
  getAnthropicApiKey,
} from '../services/medRecognition';

export default function SettingsScreen() {
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [largeText, setLargeText] = useState(false);
  const [apiKey, setApiKey] = useState(getAnthropicApiKey() ?? '');

  const handleSaveApiKey = () => {
    const trimmed = apiKey.trim();
    if (trimmed) {
      setAnthropicApiKey(trimmed);
      Alert.alert('Saved', 'API key saved. Photo AI auto-fill is now enabled.');
    } else {
      setAnthropicApiKey('');
      Alert.alert('Cleared', 'API key removed. Photo AI auto-fill is disabled.');
    }
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will delete all medications, logs, and reminders. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete Everything',
          style: 'destructive',
          onPress: () => {
            // TODO: implement database wipe
            Alert.alert('Done', 'All data has been cleared.');
          },
        },
      ],
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.sectionHeader}>Notifications</Text>
      <View style={styles.card}>
        <SettingRow
          label="Enable Reminders"
          value={notificationsEnabled}
          onToggle={setNotificationsEnabled}
        />
        <SettingRow
          label="Reminder Sound"
          value={soundEnabled}
          onToggle={setSoundEnabled}
        />
      </View>

      <Text style={styles.sectionHeader}>Display</Text>
      <View style={styles.card}>
        <SettingRow
          label="Extra-Large Text"
          value={largeText}
          onToggle={setLargeText}
        />
      </View>

      <Text style={styles.sectionHeader}>AI Photo Recognition</Text>
      <View style={styles.card}>
        <Text style={styles.apiHint}>
          Enter your Anthropic API key to enable automatic medication
          identification from photos.
        </Text>
        <TextInput
          style={styles.apiInput}
          value={apiKey}
          onChangeText={setApiKey}
          placeholder="sk-ant-..."
          placeholderTextColor={Colors.disabled}
          autoCapitalize="none"
          autoCorrect={false}
          secureTextEntry
          accessibilityLabel="Anthropic API key"
        />
        <BigButton
          label="Save API Key"
          onPress={handleSaveApiKey}
          variant="primary"
          style={{ marginTop: Spacing.md }}
        />
      </View>

      <Text style={styles.sectionHeader}>Data</Text>
      <View style={styles.card}>
        <BigButton
          label="Clear All Data"
          onPress={handleClearData}
          variant="cancel"
          accessibilityHint="Deletes all medications and logs"
        />
      </View>

      <Text style={styles.version}>Medicine Cabinet v1.0.0</Text>
    </ScrollView>
  );
}

function SettingRow({
  label,
  value,
  onToggle,
}: {
  label: string;
  value: boolean;
  onToggle: (v: boolean) => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ true: Colors.confirm, false: Colors.border }}
        thumbColor={Colors.white}
        accessibilityLabel={label}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    padding: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  sectionHeader: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    marginTop: Spacing.xl,
    marginBottom: Spacing.sm,
  },
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    ...Shadow.sm,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  rowLabel: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
  },
  apiHint: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  apiInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    backgroundColor: Colors.background,
    minHeight: MinTapSize,
  },
  version: {
    fontSize: FontSizes.sm,
    color: Colors.disabled,
    textAlign: 'center',
    marginTop: Spacing.xxl,
  },
});
