import { atom } from 'jotai';

export interface AnalyticsData {
  totalComparisons: number;
  totalTokens: number;
  totalCost: number;
  averageResponseTime: number;
  mostUsedModel: string;
  comparisonsThisWeek: number;
  comparisonsThisMonth: number;
  modelUsage: Array<{
    name: string;
    count: number;
    percentage: number;
  }>;
  dailyUsage: Array<{
    day: string;
    comparisons: number;
  }>;
  recentActivity: Array<{
    time: string;
    action: string;
    prompt: string;
  }>;
}

export interface AnalyticsState {
  data: AnalyticsData | null;
  loading: boolean;
  error: string | null;
  lastFetched: number | null;
}

// Initial state
const initialAnalyticsState: AnalyticsState = {
  data: null,
  loading: false,
  error: null,
  lastFetched: null,
};

// Main analytics state atom
export const analyticsAtom = atom<AnalyticsState>(initialAnalyticsState);

// Derived atoms for easy access
export const analyticsDataAtom = atom(
  (get) => get(analyticsAtom).data
);

export const analyticsLoadingAtom = atom(
  (get) => get(analyticsAtom).loading
);

export const analyticsErrorAtom = atom(
  (get) => get(analyticsAtom).error
);

// Action atoms
export const setAnalyticsLoadingAtom = atom(
  null,
  (get, set, loading: boolean) => {
    set(analyticsAtom, { ...get(analyticsAtom), loading });
  }
);

export const setAnalyticsDataAtom = atom(
  null,
  (get, set, data: AnalyticsData) => {
    set(analyticsAtom, {
      data,
      loading: false,
      error: null,
      lastFetched: Date.now(),
    });
  }
);

export const setAnalyticsErrorAtom = atom(
  null,
  (get, set, error: string) => {
    set(analyticsAtom, { ...get(analyticsAtom), loading: false, error });
  }
);

export const clearAnalyticsAtom = atom(
  null,
  (get, set) => {
    set(analyticsAtom, initialAnalyticsState);
  }
);
