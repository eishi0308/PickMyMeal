import AsyncStorage from '@react-native-async-storage/async-storage';
import { HistoryEntry, PreferenceMap } from '../types';

const STORAGE_KEY = 'mood-food-history';
const MAX_ENTRIES = 50;

export async function getHistory(): Promise<HistoryEntry[]> {
  const data = await AsyncStorage.getItem(STORAGE_KEY);
  return data ? (JSON.parse(data) as HistoryEntry[]) : [];
}

export async function addToHistory(entry: {
  preferences: PreferenceMap;
  category: string;
  reason: string;
}): Promise<HistoryEntry> {
  const history = await getHistory();
  const newEntry: HistoryEntry = {
    ...entry,
    id: Math.random().toString(36).slice(2),
    timestamp: new Date().toISOString(),
  };
  history.unshift(newEntry);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(history.slice(0, MAX_ENTRIES)));
  return newEntry;
}

export async function clearHistory(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}
