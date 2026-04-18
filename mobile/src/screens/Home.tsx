import { useState } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import { recommend, generateImage } from '../api/foodApi';
import { addToHistory } from '../api/history';
import { PreferenceMap, RecommendResponse } from '../types';
import NavBar from '../components/NavBar';
import QuickMode from './QuickMode';

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
  onResult: (data: { response: RecommendResponse; backups: RecommendResponse[]; preferences: PreferenceMap }) => void;
  onHistory: () => void;
  onLogoClick: () => void;
}

export default function Home({ selected, onToggle, onResult, onHistory, onLogoClick }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'quick' | 'fine'>('quick');

  const hasSelection = Object.keys(selected).length > 0;

  const handleDecideWithPrefs = async (prefs: PreferenceMap) => {
    setLoading(true);
    setError(null);
    try {
      const best = await recommend({ preferences: prefs });
      const backup1 = await recommend({ preferences: prefs, exclude: [best.category] });
      const backup2 = await recommend({ preferences: prefs, exclude: [best.category, backup1.category] });
      const [img0, img1, img2] = await Promise.all([
        generateImage(best.category, best.category),
        generateImage(backup1.category, backup1.category),
        generateImage(backup2.category, backup2.category),
      ]);
      best.image_url = img0.image_url;
      backup1.image_url = img1.image_url;
      backup2.image_url = img2.image_url;
      await addToHistory({ preferences: prefs, category: best.category, reason: best.reason });
      onResult({ response: best, backups: [backup1, backup2], preferences: prefs });
    } catch {
      setError('Could not connect. Is the backend running?');
    } finally {
      setLoading(false);
    }
  };

  const handleDecide = async () => {
    if (!hasSelection) return;
    handleDecideWithPrefs(selected);
  };

  const switchMode = (newMode: 'quick' | 'fine') => {
    setMode(newMode);
    setError(null);
  };

  return (
    <View style={styles.screen}>
      {mode === 'quick' ? (
        /* Quick mode — no scroll, centered layout */
        <View style={styles.quickContainer}>
          <NavBar onLogoClick={onLogoClick} onHistory={onHistory} />

          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'quick' && styles.modeBtnActive]}
              onPress={() => switchMode('quick')}
            >
              <Text style={[styles.modeBtnText, mode === 'quick' && styles.modeBtnTextActive]}>
                ⚡ Quick
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, mode === 'fine' && styles.modeBtnActive]}
              onPress={() => switchMode('fine')}
            >
              <Text style={[styles.modeBtnText, mode === 'fine' && styles.modeBtnTextActive]}>
                🎛 Fine Tune
              </Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.quickLoading}>
              <ActivityIndicator color="#E8703A" size="large" />
              <Text style={styles.quickLoadingText}>Finding your meal…</Text>
            </View>
          ) : error ? (
            <View style={styles.quickError}>
              <Text style={styles.errorMsg}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={() => setError(null)}>
                <Text style={styles.retryBtnText}>Try again</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <QuickMode onSubmit={handleDecideWithPrefs} />
          )}
        </View>
      ) : (
        /* Fine Tune mode — scrollable chip list */
        <View style={styles.screen}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
            <NavBar onLogoClick={onLogoClick} onHistory={onHistory} />

            {/* Mode toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'quick' && styles.modeBtnActive]}
                onPress={() => switchMode('quick')}
              >
                <Text style={[styles.modeBtnText, mode === 'quick' && styles.modeBtnTextActive]}>
                  ⚡ Quick
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === 'fine' && styles.modeBtnActive]}
                onPress={() => switchMode('fine')}
              >
                <Text style={[styles.modeBtnText, mode === 'fine' && styles.modeBtnTextActive]}>
                  🎛 Fine Tune
                </Text>
              </TouchableOpacity>
            </View>

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
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFBF5' },

  /* Quick mode layout */
  quickContainer: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    backgroundColor: '#FFFBF5',
  },
  quickLoading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingBottom: 60,
  },
  quickLoadingText: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '500',
  },
  quickError: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingBottom: 60,
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  retryBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },

  /* Mode toggle */
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#EFEFEF',
    borderRadius: 12,
    padding: 3,
    marginBottom: 32,
    gap: 2,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  modeBtnActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 4,
    elevation: 2,
  },
  modeBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  modeBtnTextActive: {
    color: '#1A1A1A',
    fontWeight: '600',
  },

  /* Fine tune / scroll layout */
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
