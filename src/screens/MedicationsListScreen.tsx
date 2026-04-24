import React, { useCallback, useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { getMedications, deleteMedication } from '../services/storage';
import { Medication } from '../types/medication';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import { colors } from '../theme/tokens';

export default function MedicationsListScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [medications, setMedications] = useState<Medication[]>([]);

  const load = useCallback(async () => {
    setMedications(await getMedications());
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', load);
    return unsubscribe;
  }, [navigation, load]);

  const onDelete = (id: string) => {
    Alert.alert('Delete medication', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: async () => { await deleteMedication(id); await load(); } }
    ]);
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={medications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.item} onPress={() => navigation.navigate('MedicationDetail', { medicationId: item.id })} onLongPress={() => onDelete(item.id)}>
            {item.pillPhotoUri ? (
              <Image source={{ uri: item.pillPhotoUri }} style={styles.photo} />
            ) : (
              <View style={styles.placeholderPhoto} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>{item.dosage} • {item.times?.join(', ')}</Text>
            </View>
          </TouchableOpacity>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 24 }}>No medications yet</Text>}
      />
      <TouchableOpacity style={styles.fab} onPress={() => navigation.navigate('AddEditMedication', {})}>
        <Text style={styles.fabText}>＋</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.canvas },
  item: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 },
  name: { fontSize: 16, fontWeight: '600' },
  meta: { color: colors.mute },
  photo: { width: 40, height: 40, borderRadius: 20 },
  placeholderPhoto: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.hairline },
  separator: { height: 1, backgroundColor: colors.hairline },
  fab: { position: 'absolute', right: 20, bottom: 20, backgroundColor: colors.navy, width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', elevation: 4 },
  fabText: { color: colors.card, fontSize: 28, lineHeight: 28, fontWeight: '700' }
});
