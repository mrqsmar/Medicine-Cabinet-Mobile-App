import { upsertMedication, getAllMedications } from '../database';
import type { Medication } from '../types/medication';

const now = new Date().toISOString();

export async function seedSampleData() {
  // Skip seeding if data already exists
  const existing = await getAllMedications();
  if (existing.length > 0) return;

  const meds: Medication[] = [
    {
      id: 'metformin-500',
      name: 'Metformin',
      dosage: '500mg',
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
      dosage: '10mg',
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
