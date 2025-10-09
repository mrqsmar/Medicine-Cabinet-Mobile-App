import AsyncStorage from '@react-native-async-storage/async-storage';
import { format } from 'date-fns';
import { IntakeLog, IntakeStatus, Medication } from '../types/medication';

const KEYS = {
  MEDS: 'medications',
  INTAKES: 'intakes',
} as const;

export async function getMedications(): Promise<Medication[]> {
  const raw = await AsyncStorage.getItem(KEYS.MEDS);
  return raw ? (JSON.parse(raw) as Medication[]) : [];
}

export async function saveMedication(medication: Medication): Promise<void> {
  const meds = await getMedications();
  const idx = meds.findIndex((m) => m.id === medication.id);
  if (idx >= 0) {
    meds[idx] = medication;
  } else {
    meds.push(medication);
  }
  await AsyncStorage.setItem(KEYS.MEDS, JSON.stringify(meds));
}

export async function getMedicationById(id: string): Promise<Medication | null> {
  const meds = await getMedications();
  return meds.find((m) => m.id === id) || null;
}

export async function deleteMedication(id: string): Promise<void> {
  const meds = await getMedications();
  const next = meds.filter((m) => m.id !== id);
  await AsyncStorage.setItem(KEYS.MEDS, JSON.stringify(next));
}

export async function setIntakeStatus(
  medicationId: string,
  date: string,
  time: string,
  status: IntakeStatus
): Promise<void> {
  const intakes = await getAllIntakes();
  const key = `${medicationId}|${date}|${time}`;
  const next = { ...intakes, [key]: { medicationId, date, time, status } satisfies IntakeLog } as Record<string, IntakeLog>;
  await AsyncStorage.setItem(KEYS.INTAKES, JSON.stringify(next));
}

export async function getAllIntakes(): Promise<Record<string, IntakeLog>> {
  const raw = await AsyncStorage.getItem(KEYS.INTAKES);
  return raw ? (JSON.parse(raw) as Record<string, IntakeLog>) : {};
}

export async function getIntakeLogsForDate(date: string): Promise<IntakeLog[]> {
  const all = await getAllIntakes();
  return Object.values(all).filter((l) => l.date === date);
}

export function getLowRefillMeds(medications: Medication[]): Medication[] {
  return medications.filter((m) => {
    if (m.remainingPills == null || m.dailyDoses == null) return false;
    const threshold = m.dailyDoses * 3; // 3 days left
    return m.remainingPills <= threshold;
  });
}
