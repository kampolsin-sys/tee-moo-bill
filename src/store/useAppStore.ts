import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type User = 'Tee' | 'Moo';

export interface Transaction {
  id: string;
  date: string; // ISO date string
  description: string;
  note?: string;
  amount: number;
  paidBy: User;
  sharedWith: User | 'Both';
  clearDate: string; // The target date to clear this bill (e.g. 15th of next month)
  status: 'pending' | 'paid';
}

export interface Routine {
  id: string;
  description: string;
  amount: number;
  paidBy: User;
  sharedWith: User | 'Both';
}

export interface CycleSettings {
  cycleStartDay: number;
  cycleEndDay: number;
  payDay: number;
}

export interface Settings {
  cycleStartDay?: number; // legacy
  cycleEndDay?: number; // legacy
  payDay?: number; // legacy
  mooOwesTee?: CycleSettings;
  teeOwesMoo?: CycleSettings;
}

export const getCycleSettings = (settings: Settings, type: 'mooOwesTee' | 'teeOwesMoo'): CycleSettings => {
  if (settings[type]) return settings[type]!;
  return {
    cycleStartDay: settings.cycleStartDay || 21,
    cycleEndDay: settings.cycleEndDay || 20,
    payDay: settings.payDay || 15,
  };
};

interface AppState {
  transactions: Transaction[];
  routines: Routine[];
  settings: Settings;
  addTransaction: (tx: Omit<Transaction, 'id' | 'status'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addRoutine: (routine: Omit<Routine, 'id'>) => void;
  updateRoutine: (id: string, routine: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  markCycleAsPaid: (clearDate: string, whoIsPaying: User | 'All') => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      transactions: [],
      routines: [],
      settings: {
        cycleStartDay: 21,
        cycleEndDay: 20,
        payDay: 15,
      },
      addTransaction: (tx) =>
        set((state) => ({
          transactions: [...state.transactions, { ...tx, id: crypto.randomUUID(), status: 'pending' }],
        })),
      updateTransaction: (id, updatedTx) =>
        set((state) => ({
          transactions: state.transactions.map((tx) =>
            tx.id === id ? { ...tx, ...updatedTx } : tx
          ),
        })),
      deleteTransaction: (id) =>
        set((state) => ({
          transactions: state.transactions.filter((tx) => tx.id !== id),
        })),
      addRoutine: (routine) =>
        set((state) => ({
          routines: [...state.routines, { ...routine, id: crypto.randomUUID() }],
        })),
      updateRoutine: (id, updatedRoutine) =>
        set((state) => ({
          routines: state.routines.map((r) =>
            r.id === id ? { ...r, ...updatedRoutine } : r
          ),
        })),
      deleteRoutine: (id) =>
        set((state) => ({
          routines: state.routines.filter((r) => r.id !== id),
        })),
      updateSettings: (newSettings) =>
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        })),
      markCycleAsPaid: (clearDate, whoIsPaying) =>
        set((state) => ({
          transactions: state.transactions.map((tx) => {
            if (tx.clearDate !== clearDate) return tx;
            if (whoIsPaying === 'All') return { ...tx, status: 'paid' };
            // If Tee is paying Moo, it settles transactions where Moo paid.
            if (whoIsPaying === 'Tee' && tx.paidBy === 'Moo') return { ...tx, status: 'paid' };
            // If Moo is paying Tee, it settles transactions where Tee paid.
            if (whoIsPaying === 'Moo' && tx.paidBy === 'Tee') return { ...tx, status: 'paid' };
            return tx;
          }),
        })),
    }),
    {
      name: 'tee-moo-storage',
    }
  )
);
