import * as SQLite from 'expo-sqlite';
import type {
  Medication,
  DoseLog,
  ReminderSchedule,
  IntakeStatus,
} from '../types/medication';

const DB_NAME = 'medicine_cabinet.db';

let _db: SQLite.SQLiteDatabase | null = null;

export async function getDatabase(): Promise<SQLite.SQLiteDatabase> {
  if (_db) return _db;
  _db = await SQLite.openDatabaseAsync(DB_NAME);
  await _db.execAsync(`PRAGMA journal_mode = WAL;`);
  await createTables(_db);
  return _db;
}

// ── Schema ──────────────────────────────────────────────────────────

async function createTables(db: SQLite.SQLiteDatabase) {
  await db.execAsync(`
    CREATE TABLE IF NOT EXISTS medications (
      id                TEXT PRIMARY KEY NOT NULL,
      name              TEXT NOT NULL,
      photoUri          TEXT,
      dosageAmount      REAL NOT NULL DEFAULT 0,
      dosageUnit        TEXT NOT NULL DEFAULT 'mg',
      dosage            TEXT NOT NULL DEFAULT '',
      prescribingDoctor TEXT NOT NULL DEFAULT '',
      startDate         TEXT NOT NULL DEFAULT '',
      expirationDate    TEXT NOT NULL DEFAULT '',
      recurrence        TEXT NOT NULL DEFAULT 'Daily',
      notes             TEXT NOT NULL DEFAULT '',
      colorShape        TEXT NOT NULL DEFAULT '',
      form              TEXT NOT NULL DEFAULT 'tablet',
      times             TEXT NOT NULL DEFAULT '[]',
      pillPhotoUri      TEXT,
      pillDescription   TEXT,
      instructions      TEXT,
      doctorNotes       TEXT,
      pharmacyPhone     TEXT,
      remainingPills    INTEGER,
      dailyDoses        INTEGER,
      createdAt         TEXT NOT NULL,
      updatedAt         TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dose_logs (
      id            TEXT PRIMARY KEY NOT NULL,
      medicationId  TEXT NOT NULL,
      doseId        TEXT,
      scheduledDate TEXT NOT NULL,
      scheduledTime TEXT NOT NULL,
      status        TEXT NOT NULL DEFAULT 'pending',
      takenAt       TEXT,
      notes         TEXT,
      FOREIGN KEY (medicationId) REFERENCES medications(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS reminder_schedules (
      id            TEXT PRIMARY KEY NOT NULL,
      medicationId  TEXT NOT NULL,
      times         TEXT NOT NULL DEFAULT '[]',
      repeatPattern TEXT NOT NULL DEFAULT 'daily',
      daysOfWeek    TEXT,
      dayOfMonth    INTEGER,
      enabled       INTEGER NOT NULL DEFAULT 1,
      notifyBefore  INTEGER NOT NULL DEFAULT 0,
      createdAt     TEXT NOT NULL,
      updatedAt     TEXT NOT NULL,
      FOREIGN KEY (medicationId) REFERENCES medications(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_dose_logs_date
      ON dose_logs (scheduledDate);
    CREATE INDEX IF NOT EXISTS idx_dose_logs_med
      ON dose_logs (medicationId);
    CREATE INDEX IF NOT EXISTS idx_reminder_med
      ON reminder_schedules (medicationId);
  `);
}

// ── Medication CRUD ─────────────────────────────────────────────────

export async function getAllMedications(): Promise<Medication[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>('SELECT * FROM medications ORDER BY name');
  return rows.map(rowToMedication);
}

export async function getMedicationById(id: string): Promise<Medication | null> {
  const db = await getDatabase();
  const row = await db.getFirstAsync<any>(
    'SELECT * FROM medications WHERE id = ?',
    [id],
  );
  return row ? rowToMedication(row) : null;
}

export async function upsertMedication(med: Medication): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO medications
       (id, name, photoUri, dosageAmount, dosageUnit, dosage,
        prescribingDoctor, startDate, expirationDate, recurrence,
        notes, colorShape, form, times,
        pillPhotoUri, pillDescription, instructions, doctorNotes,
        pharmacyPhone, remainingPills, dailyDoses, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      med.id,
      med.name,
      med.photoUri ?? null,
      med.dosageAmount,
      med.dosageUnit,
      med.dosage,
      med.prescribingDoctor,
      med.startDate,
      med.expirationDate,
      med.recurrence,
      med.notes,
      med.colorShape,
      med.form,
      JSON.stringify(med.times),
      med.pillPhotoUri ?? med.photoUri ?? null,
      med.pillDescription ?? med.colorShape ?? null,
      med.instructions ?? null,
      med.doctorNotes ?? null,
      med.pharmacyPhone ?? null,
      med.remainingPills ?? null,
      med.dailyDoses ?? null,
      med.createdAt,
      med.updatedAt,
    ],
  );
}

export async function deleteMedication(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM medications WHERE id = ?', [id]);
}

function rowToMedication(row: any): Medication {
  return {
    ...row,
    times: JSON.parse(row.times || '[]'),
    dosageAmount: row.dosageAmount ?? 0,
    dosageUnit: row.dosageUnit ?? 'mg',
    prescribingDoctor: row.prescribingDoctor ?? '',
    startDate: row.startDate ?? '',
    expirationDate: row.expirationDate ?? '',
    recurrence: row.recurrence ?? 'Daily',
    notes: row.notes ?? '',
    colorShape: row.colorShape ?? row.pillDescription ?? '',
  };
}

// ── DoseLog CRUD ────────────────────────────────────────────────────

export async function getDoseLogsForDate(date: string): Promise<DoseLog[]> {
  const db = await getDatabase();
  return db.getAllAsync<DoseLog>(
    'SELECT * FROM dose_logs WHERE scheduledDate = ? ORDER BY scheduledTime',
    [date],
  );
}

export async function upsertDoseLog(log: DoseLog): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO dose_logs
       (id, medicationId, doseId, scheduledDate, scheduledTime, status, takenAt, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      log.id,
      log.medicationId,
      log.doseId ?? null,
      log.scheduledDate,
      log.scheduledTime,
      log.status,
      log.takenAt ?? null,
      log.notes ?? null,
    ],
  );
}

export async function setDoseStatus(
  id: string,
  status: IntakeStatus,
  takenAt?: string,
): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    'UPDATE dose_logs SET status = ?, takenAt = ? WHERE id = ?',
    [status, takenAt ?? null, id],
  );
}

// ── ReminderSchedule CRUD ───────────────────────────────────────────

export async function getRemindersForMedication(
  medicationId: string,
): Promise<ReminderSchedule[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM reminder_schedules WHERE medicationId = ?',
    [medicationId],
  );
  return rows.map(rowToReminder);
}

export async function getAllReminders(): Promise<ReminderSchedule[]> {
  const db = await getDatabase();
  const rows = await db.getAllAsync<any>(
    'SELECT * FROM reminder_schedules ORDER BY createdAt',
  );
  return rows.map(rowToReminder);
}

export async function upsertReminder(r: ReminderSchedule): Promise<void> {
  const db = await getDatabase();
  await db.runAsync(
    `INSERT OR REPLACE INTO reminder_schedules
       (id, medicationId, times, repeatPattern, daysOfWeek, dayOfMonth,
        enabled, notifyBefore, createdAt, updatedAt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      r.id,
      r.medicationId,
      JSON.stringify(r.times),
      r.repeatPattern,
      r.daysOfWeek ? JSON.stringify(r.daysOfWeek) : null,
      r.dayOfMonth ?? null,
      r.enabled ? 1 : 0,
      r.notifyBefore,
      r.createdAt,
      r.updatedAt,
    ],
  );
}

export async function deleteReminder(id: string): Promise<void> {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM reminder_schedules WHERE id = ?', [id]);
}

function rowToReminder(row: any): ReminderSchedule {
  return {
    ...row,
    times: JSON.parse(row.times || '[]'),
    daysOfWeek: row.daysOfWeek ? JSON.parse(row.daysOfWeek) : undefined,
    enabled: !!row.enabled,
  };
}
