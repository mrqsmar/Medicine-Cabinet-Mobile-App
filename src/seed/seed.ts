import { upsertMedication, getAllMedications } from '../database';
import type { Medication } from '../types/medication';

const now = new Date().toISOString();
const today = new Date().toISOString().slice(0, 10);

export async function seedSampleData() {
  const existing = await getAllMedications();
  if (existing.length > 0) return;

  const meds: Medication[] = [
    {
      id: 'metformin-500',
      name: 'Metformin',
      photoUri: undefined,
      dosageAmount: 500,
      dosageUnit: 'mg',
      dosage: '500 mg',
      prescribingDoctor: 'Dr. Johnson',
      startDate: '2025-01-15',
      expirationDate: '2026-01-15',
      recurrence: 'Daily',
      notes: 'Take with meals. Monitor blood sugar levels.',
      colorShape: 'White, round, imprint M500',
      form: 'tablet',
      times: ['08:00', '20:00'],
      pillDescription: 'White, round',
      instructions: 'Take with meals',
      doctorNotes: 'Monitor blood sugar',
      pharmacyPhone: '5551234567',
      remainingPills: 5,
      dailyDoses: 2,
      createdAt: now,
      updatedAt: now,
    },
    {
      id: 'lisinopril-10',
      name: 'Lisinopril',
      photoUri: undefined,
      dosageAmount: 10,
      dosageUnit: 'mg',
      dosage: '10 mg',
      prescribingDoctor: 'Dr. Patel',
      startDate: '2025-03-01',
      expirationDate: '2026-03-01',
      recurrence: 'Daily',
      notes: 'Take in the morning on an empty stomach.',
      colorShape: 'Pink, oblong',
      form: 'tablet',
      times: ['08:00'],
      pillDescription: 'Pink, oblong',
      instructions: 'Take in the morning',
      remainingPills: 30,
      dailyDoses: 1,
      createdAt: now,
      updatedAt: now,
    },
  ];

  for (const m of meds) await upsertMedication(m);
}
