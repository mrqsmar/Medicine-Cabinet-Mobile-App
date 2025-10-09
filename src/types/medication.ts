export type IntakeStatus = 'pending' | 'taken' | 'skipped';

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  times: string[]; // 'HH:mm'
  pillPhotoUri?: string;
  pillDescription?: string;
  instructions?: string;
  doctorNotes?: string;
  pharmacyPhone?: string;
  remainingPills?: number; // for refill alerts
  dailyDoses?: number; // how many pills per day
}

export interface IntakeLog {
  medicationId: string;
  date: string; // yyyy-MM-dd
  time: string; // HH:mm
  status: IntakeStatus;
}
