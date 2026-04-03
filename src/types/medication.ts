/**
 * Core data types for the Medicine Cabinet app.
 */

// ── Medication ──────────────────────────────────────────────────────

export type DosageUnit = 'mg' | 'cc';

export type Recurrence = 'Daily' | 'Weekly' | 'Monthly';

export type MedicationForm =
  | 'tablet'
  | 'capsule'
  | 'liquid'
  | 'injection'
  | 'topical'
  | 'inhaler'
  | 'drops'
  | 'other';

export interface Medication {
  id: string;
  name: string;
  photoUri?: string;
  dosageAmount: number;
  dosageUnit: DosageUnit;
  /** Legacy combined dosage string (e.g. "500 mg") — computed on save. */
  dosage: string;
  prescribingDoctor: string;
  startDate: string; // YYYY-MM-DD
  expirationDate: string; // YYYY-MM-DD
  recurrence: Recurrence;
  notes: string;
  colorShape: string;
  form: MedicationForm;
  times: string[]; // HH:mm format
  /** @deprecated use photoUri */
  pillPhotoUri?: string;
  /** @deprecated use colorShape */
  pillDescription?: string;
  instructions?: string;
  doctorNotes?: string;
  pharmacyPhone?: string;
  remainingPills?: number;
  dailyDoses?: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

// ── Dose ────────────────────────────────────────────────────────────

export interface Dose {
  id: string;
  medicationId: string;
  scheduledTime: string; // HH:mm
  scheduledDate: string; // YYYY-MM-DD
  quantity: number;
  unit: string;
}

// ── ReminderSchedule ────────────────────────────────────────────────

export type RepeatPattern = 'daily' | 'weekly' | 'monthly' | 'asNeeded';

export interface ReminderSchedule {
  id: string;
  medicationId: string;
  times: string[];
  repeatPattern: RepeatPattern;
  daysOfWeek?: number[];
  dayOfMonth?: number;
  enabled: boolean;
  notifyBefore: number;
  createdAt: string;
  updatedAt: string;
}

// ── DoseLog (intake tracking) ───────────────────────────────────────

export type IntakeStatus = 'pending' | 'taken' | 'skipped' | 'missed';

export interface DoseLog {
  id: string;
  medicationId: string;
  doseId?: string;
  scheduledDate: string;
  scheduledTime: string;
  status: IntakeStatus;
  takenAt?: string;
  notes?: string;
}

export type IntakeLog = DoseLog;
