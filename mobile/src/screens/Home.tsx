import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { recommend, generateImage } from '../api/foodApi';
import { addToHistory } from '../api/history';
import { PreferenceMap, RecommendResponse } from '../types';
import NavBar from '../components/NavBar';

const CATEGORIES = [
  { key: 'flavor', label: 'Flavor', options: ['Salty', 'Sweet', 'Savory', 'Sour', 'Any'] },
  { key: 'spice_level', label: 'Spice level', options: ['Not spicy', 'Mild', 'Spicy', 'Very spicy', 'Any'] },
  { key: 'temperature', label: 'Hot or cold?', options: ['Hot', 'Cold', 'Either'] },
  { key: 'fullness', label: 'How filling?', options: ['Light', 'Medium', 'Heavy', 'Any'] },
  { key: 'richness', label: 'Rich or fresh?', options: ['Rich', 'Fresh', 'In between', 'Any'] },
  { key: 'base', label: 'Base', options: ['Rice', 'Noodles', 'Bread', 'Any'] },
  { key: 'style', label: 'Style', options: ['Fried', 'Soup', 'Grilled', 'Fresh', 'Saucy', 'Any'] },
  { key: 'mood', label: 'What sounds good?', options: ['Healthy', 'Comfort', 'Treat', 'Balanced', 'Any'] },
  { key: 'protein', label: 'Protein', options: ['Chicken', 'Beef', 'Pork', 'Seafood', 'Vegetarian', 'Any'] },
  { key: 'cuisine', label: 'Cuisine', options: ['Japanese', 'Korean', 'Chinese', 'Thai', 'Italian', 'Mexican', 'American', 'Any'] },
  { key: 'meal_type', label: 'Meal type', options: ['Quick', 'Full meal', 'Snack', 'Late night'] },
  { key: 'texture', label: 'Texture', options: ['Crispy', 'Soft', 'Chewy', 'Any'] },
  { key: 'portion', label: 'Portion', options: ['Just me', 'Sharing', 'Any'] },
];

interface Props {
  selected: PreferenceMap;
  onToggle: (key: string, option: string) => void;
  onResult: (data: { response: RecommendResponse; preferences: PreferenceMap }) => void;
  onHistory: () => void;
  onLogoClick: () => void;
}

export default function Home({ selected, onToggle, onResult, onHistory, onLogoClick }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const hasSelection = Object.keys(selected).length > 0;

  const handleDecide = async () => {
    if (!hasSelection) return;
    setLoading(true);
    setError(null);
    try {
      const response = await recommend({ preferences: selected });
      const imageRes = await generateImage(response.category, response.category);
      response.image_url = imageRes.image_url;
      await addToHistory({ preferences: selected, category: response.category, reason: response.reason });
      onResult({ response, preferences: selected });
    } catch {
      setError('Could not connect. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <NavBar onLogoClick={onLogoClick} onHistory={onHistory} />
        <Text style={styles.title}>What do you feel like?</Text>
        <Text style={styles.subtitle}>Tap to pick. No typing needed.</Text>

        {CATEGORIES.map(({ key, label, options }) => (
          <View key={key} style={styles.category}>
            <Text style={styles.categoryLabel}>{label}</Text>
            <View style={styles.chipGrid}>
              {options.map((option) => (
                <TouchableOpacity
                  key={option}
                  style={[styles.chip, selected[key] === option && styles.chipSelected]}
                  onPress={() => onToggle(key, option)}
                >
                  <Text style={[styles.chipText, selected[key] === option && styles.chipTextSelected]}>
                    {option}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ))}

        <View style={styles.footerSpacer} />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.decideBtn, (!hasSelection || loading) && styles.decideBtnDisabled]}
          onPress={handleDecide}
          disabled={!hasSelection || loading}
        >
          {loading ? (
            <View style={styles.loadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.decideBtnText}>  Finding your meal…</Text>
            </View>
          ) : (
            <Text style={styles.decideBtnText}>Decide for me →</Text>
          )}
        </TouchableOpacity>
        {error && <Text style={styles.errorMsg}>{error}</Text>}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFBF5' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 20 },
  title: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5, color: '#1A1A1A', marginBottom: 4 },
  subtitle: { fontSize: 15, color: '#6B7280', marginBottom: 32 },
  category: { marginBottom: 24 },
  categoryLabel: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, color: '#6B7280', marginBottom: 10,
  },
  chipGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  chip: {
    paddingVertical: 10, paddingHorizontal: 16,
    borderRadius: 9999, backgroundColor: '#F3F4F6',
    borderWidth: 2, borderColor: 'transparent',
  },
  chipSelected: { backgroundColor: '#E8703A', borderColor: '#E8703A' },
  chipText: { fontSize: 14, fontWeight: '500', color: '#1A1A1A' },
  chipTextSelected: { color: '#fff' },
  footerSpacer: { height: 120 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    backgroundColor: '#FFFBF5',
  },
  decideBtn: {
    backgroundColor: '#E8703A', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  decideBtnDisabled: { opacity: 0.35 },
  decideBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  errorMsg: { color: '#DC2626', fontSize: 13, marginTop: 12, textAlign: 'center' },
});
