/**
 * Core data types for the Medicine Cabinet app.
 */

// ── Medication ──────────────────────────────────────────────────────

export interface Medication {
  id: string;
  name: string;
  dosage: string;
  form: MedicationForm;
  times: string[]; // HH:mm format
  pillPhotoUri?: string;
  pillDescription?: string;
  instructions?: string;
  doctorNotes?: string;
  pharmacyPhone?: string;
  remainingPills?: number;
  dailyDoses?: number;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

export type MedicationForm =
  | 'tablet'
  | 'capsule'
  | 'liquid'
  | 'injection'
  | 'topical'
  | 'inhaler'
  | 'drops'
  | 'other';

// ── Dose ────────────────────────────────────────────────────────────

export interface Dose {
  id: string;
  medicationId: string;
  scheduledTime: string; // HH:mm
  scheduledDate: string; // YYYY-MM-DD
  quantity: number; // e.g. 1 pill, 5 mL
  unit: string; // "pill" | "mL" | "mg" etc.
}

// ── ReminderSchedule ────────────────────────────────────────────────

export type RepeatPattern = 'daily' | 'weekly' | 'monthly' | 'asNeeded';

export interface ReminderSchedule {
  id: string;
  medicationId: string;
  times: string[]; // HH:mm entries
  repeatPattern: RepeatPattern;
  daysOfWeek?: number[]; // 0=Sun … 6=Sat (for weekly)
  dayOfMonth?: number; // 1-31 (for monthly)
  enabled: boolean;
  notifyBefore: number; // minutes before scheduled time (0 = on time)
  createdAt: string;
  updatedAt: string;
}

// ── DoseLog (intake tracking) ───────────────────────────────────────

export type IntakeStatus = 'pending' | 'taken' | 'skipped' | 'missed';

export interface DoseLog {
  id: string;
  medicationId: string;
  doseId?: string;
  scheduledDate: string; // YYYY-MM-DD
  scheduledTime: string; // HH:mm
  status: IntakeStatus;
  takenAt?: string; // ISO 8601 — actual time the dose was taken
  notes?: string;
}

// ── Legacy alias (used by existing screens) ─────────────────────────

export type IntakeLog = DoseLog;
