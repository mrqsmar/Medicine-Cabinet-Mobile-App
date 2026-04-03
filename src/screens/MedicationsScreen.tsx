import React from 'react';
import { View, Text, FlatList, Alert, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors, FontSizes, Spacing } from '../theme';
import { MedCard, BigButton } from '../components';
import { useMedications } from '../context/MedicationContext';
import type { Medication } from '../types/medication';
import type { RootStackParamList } from '../navigation/AppNavigator';

export default function MedicationsScreen() {
  const { state, removeMedication } = useMedications();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const handleDelete = (med: Medication) => {
    Alert.alert(
      'Delete Medication',
      `Remove "${med.name}" and all its records?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => removeMedication(med.id),
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={state.medications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <MedCard
            medication={item}
            onPress={() =>
              navigation.navigate('MedicationDetail', { medicationId: item.id })
            }
            onLongPress={() => handleDelete(item)}
          />
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>
            No medications yet.{'\n'}Tap the button below to add one.
          </Text>
        }
      />
      <View style={styles.addWrap}>
        <BigButton
          label="+ Add Medication"
          onPress={() => navigation.navigate('AddEditMedication', {})}
          variant="primary"
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  list: {
    padding: Spacing.lg,
    paddingBottom: 100,
  },
  empty: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.xxl,
    lineHeight: 28,
  },
  addWrap: {
    position: 'absolute',
    bottom: Spacing.xl,
    left: Spacing.lg,
    right: Spacing.lg,
  },
});
