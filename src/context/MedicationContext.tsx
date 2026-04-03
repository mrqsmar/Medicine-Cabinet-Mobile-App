import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import type { Medication } from '../types/medication';
import {
  getAllMedications,
  upsertMedication,
  deleteMedication as dbDelete,
} from '../database';

// ── State ───────────────────────────────────────────────────────────

interface MedicationState {
  medications: Medication[];
  loading: boolean;
}

const initialState: MedicationState = {
  medications: [],
  loading: true,
};

// ── Actions ─────────────────────────────────────────────────────────

type Action =
  | { type: 'SET_ALL'; payload: Medication[] }
  | { type: 'UPSERT'; payload: Medication }
  | { type: 'DELETE'; payload: string }
  | { type: 'SET_LOADING'; payload: boolean };

function reducer(state: MedicationState, action: Action): MedicationState {
  switch (action.type) {
    case 'SET_ALL':
      return { ...state, medications: action.payload, loading: false };
    case 'UPSERT': {
      const idx = state.medications.findIndex((m) => m.id === action.payload.id);
      const next = [...state.medications];
      if (idx >= 0) {
        next[idx] = action.payload;
      } else {
        next.push(action.payload);
      }
      next.sort((a, b) => a.name.localeCompare(b.name));
      return { ...state, medications: next };
    }
    case 'DELETE':
      return {
        ...state,
        medications: state.medications.filter((m) => m.id !== action.payload),
      };
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    default:
      return state;
  }
}

// ── Context ─────────────────────────────────────────────────────────

interface MedicationContextValue {
  state: MedicationState;
  refresh: () => Promise<void>;
  saveMedication: (med: Medication) => Promise<void>;
  removeMedication: (id: string) => Promise<void>;
}

const MedicationContext = createContext<MedicationContextValue | null>(null);

// ── Provider ────────────────────────────────────────────────────────

export function MedicationProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  const refresh = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true });
    const meds = await getAllMedications();
    dispatch({ type: 'SET_ALL', payload: meds });
  }, []);

  const saveMedication = useCallback(async (med: Medication) => {
    await upsertMedication(med);
    dispatch({ type: 'UPSERT', payload: med });
  }, []);

  const removeMedication = useCallback(async (id: string) => {
    await dbDelete(id);
    dispatch({ type: 'DELETE', payload: id });
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <MedicationContext.Provider
      value={{ state, refresh, saveMedication, removeMedication }}
    >
      {children}
    </MedicationContext.Provider>
  );
}

// ── Hook ────────────────────────────────────────────────────────────

export function useMedications() {
  const ctx = useContext(MedicationContext);
  if (!ctx) {
    throw new Error('useMedications must be used within a MedicationProvider');
  }
  return ctx;
}
