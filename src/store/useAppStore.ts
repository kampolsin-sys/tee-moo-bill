import { create } from 'zustand';
import { supabase } from '../lib/supabase';

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
  receiptUrl?: string; // URL to the uploaded receipt image
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
  mooOwesTee?: CycleSettings;
  teeOwesMoo?: CycleSettings;
}

export const getCycleSettings = (settings: Settings, type: 'mooOwesTee' | 'teeOwesMoo'): CycleSettings => {
  if (settings[type]) return settings[type]!;
  return {
    cycleStartDay: 21,
    cycleEndDay: 20,
    payDay: 15,
  };
};

export type TabType = 'home' | 'add' | 'routines' | 'history' | 'settings';

interface AppState {
  transactions: Transaction[];
  routines: Routine[];
  settings: Settings;
  isInitialized: boolean;
  activeTab: TabType;
  draftTransaction: Partial<Transaction> | null;
  setActiveTab: (tab: TabType) => void;
  setDraftTransaction: (tx: Partial<Transaction> | null) => void;
  addTransaction: (tx: Omit<Transaction, 'id' | 'status'>) => void;
  updateTransaction: (id: string, tx: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  addRoutine: (routine: Omit<Routine, 'id'>) => void;
  updateRoutine: (id: string, routine: Partial<Routine>) => void;
  deleteRoutine: (id: string) => void;
  updateSettings: (settings: Partial<Settings>) => void;
  markCycleAsPaid: (clearDate: string, whoIsPaying: User | 'All') => void;
  undoCycle: (clearDate: string) => void;
}

export const useAppStore = create<AppState>((set) => ({
  transactions: [],
  routines: [],
  settings: {
    mooOwesTee: { cycleStartDay: 21, cycleEndDay: 20, payDay: 15 },
    teeOwesMoo: { cycleStartDay: 21, cycleEndDay: 20, payDay: 15 },
  },
  isInitialized: false,
  activeTab: 'home',
  draftTransaction: null,

  setActiveTab: (tab) => set({ activeTab: tab }),
  setDraftTransaction: (tx) => set({ draftTransaction: tx }),

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
        if (whoIsPaying === 'Tee' && tx.paidBy === 'Moo') return { ...tx, status: 'paid' };
        if (whoIsPaying === 'Moo' && tx.paidBy === 'Tee') return { ...tx, status: 'paid' };
        return tx;
      }),
    })),
  undoCycle: (clearDate) =>
    set((state) => ({
      transactions: state.transactions.map((tx) => {
        if (tx.clearDate === clearDate && tx.status === 'paid') {
          return { ...tx, status: 'pending' };
        }
        return tx;
      }),
    })),
}));

// --- Supabase Realtime Sync Logic ---

let isSyncingFromRemote = false;

export const initSync = async () => {
  // 1. Fetch initial state from DB
  const { data } = await supabase.from('app_state').select('state').eq('id', 'main').single();
  
  if (data && data.state) {
    isSyncingFromRemote = true;
    useAppStore.setState({ 
      transactions: data.state.transactions || [],
      routines: data.state.routines || [],
      settings: data.state.settings || {
        mooOwesTee: { cycleStartDay: 21, cycleEndDay: 20, payDay: 15 },
        teeOwesMoo: { cycleStartDay: 21, cycleEndDay: 20, payDay: 15 },
      },
      isInitialized: true 
    });
    isSyncingFromRemote = false;
  } else {
    // Attempt to migrate from LocalStorage if DB is empty
    const localData = localStorage.getItem('tee-moo-storage');
    if (localData) {
      try {
        const parsed = JSON.parse(localData).state;
        isSyncingFromRemote = true;
        useAppStore.setState({ ...parsed, isInitialized: true });
        isSyncingFromRemote = false;
        
        // Push local data to DB
        await supabase.from('app_state').upsert({ 
          id: 'main', 
          state: {
            transactions: parsed.transactions || [],
            routines: parsed.routines || [],
            settings: parsed.settings || {}
          } 
        });
      } catch (e) {
        useAppStore.setState({ isInitialized: true });
      }
    } else {
      useAppStore.setState({ isInitialized: true });
    }
  }

  // 2. Subscribe to realtime changes from other devices
  supabase.channel('app_state_channel')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'app_state', filter: 'id=eq.main' }, (payload: any) => {
      if (payload.new && payload.new.state) {
        isSyncingFromRemote = true;
        useAppStore.setState({ 
          transactions: payload.new.state.transactions || [],
          routines: payload.new.state.routines || [],
          settings: payload.new.state.settings || {}
        });
        isSyncingFromRemote = false;
      }
    }).subscribe();
};

// 3. Push local changes to Supabase
useAppStore.subscribe((state) => {
  if (isSyncingFromRemote || !state.isInitialized) return;
  
  supabase.from('app_state').upsert({ 
    id: 'main', 
    state: {
      transactions: state.transactions,
      routines: state.routines,
      settings: state.settings
    } 
  }).then(({ error }) => {
    if (error) console.error("Sync error:", error);
  });
});
