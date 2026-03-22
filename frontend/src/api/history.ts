import { HistoryEntry, PreferenceMap } from '../types';

const STORAGE_KEY = 'mood-food-history';
const MAX_ENTRIES = 50;

export function getHistory(): HistoryEntry[] {
  const data = localStorage.getItem(STORAGE_KEY);
  return data ? (JSON.parse(data) as HistoryEntry[]) : [];
}

export function addToHistory(entry: {
  preferences: PreferenceMap;
  category: string;
  reason: string;
}): HistoryEntry {
  const history = getHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: crypto.randomUUID(),
    timestamp: new Date().toISOString(),
  };
  history.unshift(newEntry);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ENTRIES)));
  return newEntry;
}

export function clearHistory(): void {
  localStorage.removeItem(STORAGE_KEY);
}
