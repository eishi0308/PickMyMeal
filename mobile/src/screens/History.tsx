import { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { getHistory, clearHistory } from '../api/history';
import { HistoryEntry } from '../types';
import NavBar from '../components/NavBar';

interface Props {
  onBack: () => void;
  onLogoClick: () => void;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-AU', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default function History({ onBack, onLogoClick }: Props) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    getHistory().then(setEntries);
  }, []);

  const handleClear = async () => {
    await clearHistory();
    setEntries([]);
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <NavBar onLogoClick={onLogoClick} onBack={onBack} />

        <View style={styles.header}>
          <Text style={styles.title}>History</Text>
          {entries.length > 0 && (
            <TouchableOpacity onPress={handleClear}>
              <Text style={styles.clearBtn}>Clear all</Text>
            </TouchableOpacity>
          )}
        </View>

        {entries.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🍽</Text>
            <Text style={styles.emptyText}>No decisions yet.</Text>
            <Text style={styles.emptyText}>Go make your first one.</Text>
          </View>
        ) : (
          <View style={styles.list}>
            {entries.map((entry) => (
              <View key={entry.id} style={styles.item}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemCategory}>{entry.category}</Text>
                  <Text style={styles.itemTime}>{formatDate(entry.timestamp)}</Text>
                </View>
                <View style={styles.moodTags}>
                  {Object.values(entry.preferences).map((value) => (
                    <View key={value} style={styles.moodTag}>
                      <Text style={styles.moodTagText}>{value}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.itemReason}>{entry.reason}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFBF5' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 48 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 },
  title: { fontSize: 20, fontWeight: '700', color: '#1A1A1A' },
  clearBtn: { fontSize: 13, color: '#DC2626' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 6 },
  emptyIcon: { fontSize: 40, marginBottom: 8 },
  emptyText: { fontSize: 15, color: '#6B7280', textAlign: 'center' },
  list: { gap: 12 },
  item: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 1.5, borderColor: '#E5E7EB',
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 },
  itemCategory: { fontSize: 18, fontWeight: '700', color: '#1A1A1A', textTransform: 'capitalize' },
  itemTime: { fontSize: 12, color: '#6B7280' },
  moodTags: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginBottom: 10 },
  moodTag: {
    paddingVertical: 3, paddingHorizontal: 10,
    backgroundColor: 'rgba(232,112,58,0.12)', borderRadius: 9999,
  },
  moodTagText: { fontSize: 12, color: '#E8703A', fontWeight: '600' },
  itemReason: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
});
