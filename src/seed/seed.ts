import { saveMedication } from '../services/storage';
import { Medication } from '../types/medication';

export async function seedSampleData() {
  const meds: Medication[] = [
    {
      id: 'metformin-500',
      name: 'Metformin',
      dosage: '500mg',
      times: ['08:00', '20:00'],
      pillDescription: 'White, round',
      instructions: 'Take with meals',
      doctorNotes: 'Monitor blood sugar',
      pharmacyPhone: '5551234567',
      remainingPills: 5,
      dailyDoses: 2,
    },
    {
      id: 'lisinopril-10',
      name: 'Lisinopril',
      dosage: '10mg',
      times: ['08:00'],
      pillDescription: 'Pink, oblong',
      instructions: 'Take in the morning',
      remainingPills: 30,
      dailyDoses: 1,
    },
  ];

  for (const m of meds) await saveMedication(m);
}
