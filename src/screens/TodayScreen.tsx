import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Linking } from 'react-native';
import * as Speech from 'expo-speech';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { getMedications, getIntakeLogsForDate, setIntakeStatus, getLowRefillMeds } from '../services/storage';
import { format, isToday } from 'date-fns';
import { IntakeLog, IntakeStatus, Medication } from '../types/medication';
import { colors } from '../theme/tokens';

export default function TodayScreen() {
  const [medications, setMedications] = useState<Medication[]>([]);
  const [intakes, setIntakes] = useState<IntakeLog[]>([]);

  const load = useCallback(async () => {
    const meds = await getMedications();
    setMedications(meds);
    const today = format(new Date(), 'yyyy-MM-dd');
    const logs = await getIntakeLogsForDate(today);
    setIntakes(logs);
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const items = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const doseItems = medications.flatMap((m) =>
      (m.times || []).map((t) => {
        const existing = intakes.find((l) => l.medicationId === m.id && l.scheduledDate === today && l.scheduledTime === t);
        const status: IntakeStatus = existing?.status ?? 'pending';
        return { medication: m, time: t, status };
      })
    );
    return doseItems.sort((a, b) => a.time.localeCompare(b.time));
  }, [medications, intakes]);

  const summary = useMemo(() => {
    const total = items.length;
    const taken = items.filter((i) => i.status === 'taken').length;
    return { total, taken };
  }, [items]);

  const onMark = async (medicationId: string, time: string, status: IntakeStatus) => {
    const today = format(new Date(), 'yyyy-MM-dd');
    await setIntakeStatus(medicationId, today, time, status);
    await load();
  };

  const lowRefill = useMemo(() => getLowRefillMeds(medications), [medications]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>You have taken {summary.taken}/{summary.total} doses today</Text>

      {lowRefill.length > 0 && (
        <View style={styles.alertBox}>
          <Text style={styles.alertText}>Refill alert: {lowRefill.map((m) => m.name).join(', ')}</Text>
          {lowRefill.some((m) => !!m.pharmacyPhone) && (
            <TouchableOpacity
              style={[styles.button, styles.refillButton]}
              onPress={() => {
                const medWithPhone = lowRefill.find((m) => m.pharmacyPhone);
                if (medWithPhone?.pharmacyPhone) {
                  Linking.openURL(`tel:${medWithPhone.pharmacyPhone}`);
                }
              }}
            >
              <Text style={styles.buttonText}>Request Refill</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      <FlatList
        data={items}
        keyExtractor={(item) => item.medication.id + '_' + item.time}
        renderItem={({ item }) => (
          <View style={[styles.listItem, item.status === 'taken' ? styles.taken : item.status === 'skipped' ? styles.skipped : undefined]}>
            <View style={styles.itemLeft}>
              {item.medication.pillPhotoUri ? (
                <Image source={{ uri: item.medication.pillPhotoUri }} style={styles.photo} />
              ) : (
                <View style={styles.placeholderPhoto} />
              )}
              <View>
                <Text style={styles.medName}>{item.medication.name}</Text>
                <Text style={styles.medMeta}>{item.time} • {item.medication.dosage}</Text>
              </View>
            </View>
            <View style={styles.itemRight}>
              <TouchableOpacity style={[styles.button, styles.takeButton]} onPress={() => onMark(item.medication.id, item.time, 'taken')}>
                <Text style={styles.buttonText}>Taken</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.skipButton]} onPress={() => onMark(item.medication.id, item.time, 'skipped')}>
                <Text style={styles.buttonText}>Skip</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.button, styles.speakButton]} onPress={() => Speech.speak(`Time to take your ${item.time} medication: ${item.medication.name} ${item.medication.dosage}`)}>
                <Text style={styles.buttonText}>Speak</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 24, paddingHorizontal: 16, backgroundColor: colors.canvas },
  title: { fontSize: 18, fontWeight: '600', marginBottom: 12 },
  alertBox: { backgroundColor: colors.amberBg, borderColor: colors.amber, borderWidth: 1, padding: 12, borderRadius: 8, marginBottom: 12 },
  alertText: { color: colors.amberInk, marginBottom: 8 },
  listItem: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 12 },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  itemRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  medName: { fontSize: 16, fontWeight: '600' },
  medMeta: { color: colors.mute },
  photo: { width: 40, height: 40, borderRadius: 20 },
  placeholderPhoto: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.hairline },
  button: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 6 },
  takeButton: { backgroundColor: colors.sage },
  skipButton: { backgroundColor: colors.amber },
  speakButton: { backgroundColor: colors.navy },
  refillButton: { alignSelf: 'flex-start', backgroundColor: colors.navy },
  buttonText: { color: colors.card, fontWeight: '600' },
  separator: { height: 1, backgroundColor: colors.hairline },
  taken: { opacity: 0.6 },
  skipped: { opacity: 0.6 }
});
