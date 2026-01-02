
import { TriageHistoryItem } from '../types';

const STORAGE_KEY = 'swasthya_triage_history';

export const saveTriageHistory = (item: TriageHistoryItem) => {
  const existing = getTriageHistory();
  const updated = [item, ...existing].slice(0, 10); // Keep last 10
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
};

export const getTriageHistory = (): TriageHistoryItem[] => {
  const data = localStorage.getItem(STORAGE_KEY);
  if (!data) return [];
  try {
    return JSON.parse(data);
  } catch {
    return [];
  }
};

export const clearTriageHistory = () => {
  localStorage.removeItem(STORAGE_KEY);
};
