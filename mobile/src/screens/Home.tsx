import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator, Animated,
} from 'react-native';
import { recommend } from '../api/foodApi';
import { addToHistory } from '../api/history';
import { PreferenceMap, RecommendResponse } from '../types';
import NavBar from '../components/NavBar';
import QuickMode from './QuickMode';

const ESSENTIALS = [
  { key: 'mood', label: 'Mood?', options: ['Healthy', 'Comfort food', 'Treat yourself', 'Balanced', 'Any'] },
  { key: 'cuisine', label: 'Cuisine', options: ['Japanese', 'Korean', 'Chinese', 'Thai', 'Indian', 'Italian', 'Mexican', 'American', 'Any'] },
  { key: 'meal_type', label: 'Meal type', options: ['Quick bite', 'Full meal', 'Snack', 'Late night', 'Any'] },
  { key: 'protein', label: 'Protein', options: ['Chicken', 'Beef', 'Pork', 'Seafood', 'Vegetarian', 'Vegan', 'Any'] },
];

const DETAILS = [
  { key: 'temperature', label: 'Hot or cold?', options: ['Hot', 'Cold', 'Either'] },
  { key: 'fullness', label: 'How filling?', options: ['Light', 'Medium', 'Heavy', 'Any'] },
  { key: 'flavor', label: 'Flavor', options: ['Savory', 'Salty', 'Sweet', 'Sour', 'Any'] },
  { key: 'spice_level', label: 'Spice level', options: ['No spice', 'Mild', 'Medium', 'Hot', 'Extra hot', 'Any'] },
  { key: 'base', label: 'Base', options: ['Rice', 'Noodles', 'Bread', 'Salad / Bowl', 'Any'] },
  { key: 'style', label: 'Cooking style', options: ['Fried', 'Soup / Stew', 'Grilled', 'Raw / Fresh', 'Saucy', 'Any'] },
  { key: 'portion', label: 'Portion', options: ['Just me', 'Sharing', 'Any'] },
];

const AVOID = [
  { key: 'avoid_cuisine', label: 'Cuisine to avoid', options: ['Japanese', 'Korean', 'Chinese', 'Thai', 'Indian', 'Italian', 'Mexican', 'American'] },
  { key: 'avoid_ingredient', label: 'Ingredients / types to avoid', options: ['Dairy', 'Gluten', 'Pork', 'Beef', 'Seafood', 'Raw fish', 'Spicy', 'Heavy / oily'] },
];

interface Props {
  selected: PreferenceMap;
  initialMode?: 'quick' | 'fine';
  lastResultNames?: string[];
  onToggle: (key: string, option: string) => void;
  onResult: (data: { response: RecommendResponse; backups: RecommendResponse[]; preferences: PreferenceMap }) => void;
  onBackToResult?: () => void;
  onHistory: () => void;
  onLogoClick: () => void;
}

export default function Home({ selected, initialMode = 'quick', lastResultNames = [], onToggle, onResult, onBackToResult, onHistory, onLogoClick }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<'quick' | 'fine'>(initialMode);
  const [fineStep, setFineStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    setMode(initialMode);
    if (initialMode === 'fine') setFineStep(0);
  }, [initialMode]);

  const hasSelection = Object.keys(selected).length > 0;
  const isQuick = mode === 'quick';
  const isFine = mode === 'fine';

  const handleDecideWithPrefs = async (prefs: PreferenceMap) => {
    setLoading(true);
    setError(null);
    try {
      const best = await recommend({ preferences: prefs });
      const backup1 = await recommend({ preferences: prefs, exclude: [best.category] });
      const backup2 = await recommend({ preferences: prefs, exclude: [best.category, backup1.category] });
      await addToHistory({ preferences: prefs, category: best.category, reason: best.reason });
      // Navigate immediately — images load progressively inside Result
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

  const goToStep = (next: number, dir: 'fwd' | 'back') => {
    const outX = dir === 'fwd' ? -30 : 30;
    const inX = dir === 'fwd' ? 30 : -30;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: outX, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setFineStep(next);
      slideAnim.setValue(inX);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start();
    });
  };

  const switchMode = (newMode: 'quick' | 'fine') => {
    setMode(newMode);
    if (newMode === 'fine') setFineStep(0);
    setError(null);
  };

  return (
    <View style={styles.screen}>
      {mode === 'quick' ? (
        /* Quick mode — no scroll, centered layout */
        <View style={styles.quickContainer}>
          <NavBar onLogoClick={onLogoClick} onHistory={onHistory} />

          {/* Last result banner */}
          {lastResultNames.length > 0 && onBackToResult && (
            <TouchableOpacity style={styles.lastResultBanner} onPress={onBackToResult} activeOpacity={0.75}>
              <View style={styles.lastResultTop}>
                <Text style={styles.lastResultLabel}>Last result</Text>
                <Text style={styles.lastResultArrow}>View →</Text>
              </View>
              <View style={styles.lastResultChips}>
                {lastResultNames.map((name, i) => (
                  <View key={i} style={[styles.lastResultChip, i === 0 ? styles.lastResultChipBest : undefined]}>
                    <Text style={[styles.lastResultChipText, i === 0 ? styles.lastResultChipTextBest : undefined]}>
                      {i === 0 ? '⭐ ' : ''}{name}
                    </Text>
                  </View>
                ))}
              </View>
            </TouchableOpacity>
          )}

          {/* Mode toggle */}
          <View style={styles.modeToggle}>
            <TouchableOpacity
              style={[styles.modeBtn, isQuick ? styles.modeBtnActive : undefined]}
              onPress={() => switchMode('quick')}
            >
              <Text style={[styles.modeBtnText, isQuick ? styles.modeBtnTextActive : undefined]}>
                ⚡ Quick
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.modeBtn, isFine ? styles.modeBtnActive : undefined]}
              onPress={() => switchMode('fine')}
            >
              <Text style={[styles.modeBtnText, isFine ? styles.modeBtnTextActive : undefined]}>
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
      ) : loading ? (
        /* Fine Tune loading */
        <View style={styles.quickContainer}>
          <NavBar onLogoClick={onLogoClick} onHistory={onHistory} />
          <View style={styles.quickLoading}>
            <ActivityIndicator color="#E8703A" size="large" />
            <Text style={styles.quickLoadingText}>Finding your meal…</Text>
          </View>
        </View>
      ) : error ? (
        /* Fine Tune error */
        <View style={styles.quickContainer}>
          <NavBar onLogoClick={onLogoClick} onHistory={onHistory} />
          <View style={styles.quickError}>
            <Text style={styles.errorMsg}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => setError(null)}>
              <Text style={styles.retryBtnText}>Try again</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        /* Fine Tune — 3-step wizard */
        <View style={styles.screen}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
          >
            <NavBar onLogoClick={onLogoClick} onHistory={onHistory} />

            {/* Mode toggle */}
            <View style={styles.modeToggle}>
              <TouchableOpacity
                style={[styles.modeBtn, isQuick ? styles.modeBtnActive : undefined]}
                onPress={() => switchMode('quick')}
              >
                <Text style={[styles.modeBtnText, isQuick ? styles.modeBtnTextActive : undefined]}>
                  ⚡ Quick
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, isFine ? styles.modeBtnActive : undefined]}
                onPress={() => switchMode('fine')}
              >
                <Text style={[styles.modeBtnText, isFine ? styles.modeBtnTextActive : undefined]}>
                  🎛 Fine Tune
                </Text>
              </TouchableOpacity>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${((fineStep + 1) / 3) * 100}%` as any }]} />
            </View>

            {/* Step header */}
            <Text style={styles.stepLabel}>Step {fineStep + 1} of 3</Text>
            <Text style={styles.stepTitle}>
              {['The essentials', 'Dial it in', 'Anything off limits?'][fineStep]}
            </Text>
            <Text style={styles.stepSub}>
              {[
                "What are you in the mood for today?",
                "Optional — skip anything you're flexible on.",
                "Select what to avoid. Pick as many as you like.",
              ][fineStep]}
            </Text>

            {/* Animated step content */}
            <Animated.View style={{ opacity: fadeAnim, transform: [{ translateX: slideAnim }] }}>
              {(fineStep === 0 ? ESSENTIALS : fineStep === 1 ? DETAILS : AVOID).map(({ key, label, options }) => {
                const isAvoid = fineStep === 2;
                const avoidVals = isAvoid && selected[key] ? selected[key].split(',') : [];
                return (
                  <View key={key} style={styles.category}>
                    <Text style={styles.categoryLabel}>{label}</Text>
                    <View style={styles.chipGrid}>
                      {options.map((option) => {
                        const isOn = isAvoid ? avoidVals.includes(option) : selected[key] === option;
                        return (
                          <TouchableOpacity
                            key={option}
                            style={[
                              styles.chip,
                              isAvoid ? styles.avoidChip : undefined,
                              isOn ? (isAvoid ? styles.avoidChipSelected : styles.chipSelected) : undefined,
                            ]}
                            onPress={() => onToggle(key, option)}
                          >
                            <Text style={[
                              styles.chipText,
                              isAvoid ? styles.avoidChipText : undefined,
                              isOn ? (isAvoid ? styles.avoidChipTextSelected : styles.chipTextSelected) : undefined,
                            ]}>
                              {isAvoid && isOn ? `✕ ${option}` : option}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                );
              })}
            </Animated.View>

            {/* Escape hatch on step 2 */}
            {fineStep === 1 && hasSelection && (
              <TouchableOpacity onPress={handleDecide} style={styles.skipLink}>
                <Text style={styles.skipLinkText}>Decide now, skip avoids →</Text>
              </TouchableOpacity>
            )}

            <View style={styles.footerSpacer} />
          </ScrollView>

          {/* Step footer */}
          <View style={styles.stepFooter}>
            <View style={styles.stepFooterLeft}>
              {fineStep > 0 && (
                <TouchableOpacity style={styles.backBtn} onPress={() => goToStep(fineStep - 1, 'back')}>
                  <Text style={styles.backBtnText}>← Back</Text>
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.stepFooterRight}>
              {fineStep < 2 ? (
                <TouchableOpacity style={styles.nextBtn} onPress={() => goToStep(fineStep + 1, 'fwd')}>
                  <Text style={styles.nextBtnText}>Continue →</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.decideBtn, !hasSelection ? styles.decideBtnDisabled : undefined]}
                  onPress={handleDecide}
                  disabled={!hasSelection}
                >
                  <Text style={styles.decideBtnText}>Decide for me →</Text>
                </TouchableOpacity>
              )}
            </View>
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

  lastResultBanner: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
    padding: 12,
    paddingHorizontal: 16,
    marginBottom: 14,
    backgroundColor: 'rgba(232,112,58,0.07)',
    borderWidth: 1,
    borderColor: 'rgba(232,112,58,0.2)',
    borderRadius: 18,
  },
  lastResultTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastResultLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#E8703A',
  },
  lastResultArrow: {
    fontSize: 12,
    fontWeight: '600',
    color: '#E8703A',
  },
  lastResultChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  lastResultChip: {
    paddingVertical: 5,
    paddingHorizontal: 12,
    borderRadius: 999,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  lastResultChipBest: {
    backgroundColor: '#E8703A',
  },
  lastResultChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    textTransform: 'capitalize',
  },
  lastResultChipTextBest: {
    color: '#fff',
  },

  /* Mode toggle */
  modeToggle: {
    flexDirection: 'row',
    backgroundColor: '#EFEFEF',
    borderRadius: 999,
    padding: 3,
    marginBottom: 32,
    gap: 2,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 16,
    borderRadius: 999,
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
  /* Progress bar */
  progressTrack: {
    height: 4, backgroundColor: '#E5E7EB', borderRadius: 999,
    marginBottom: 24, overflow: 'hidden',
  },
  progressFill: {
    height: 4, backgroundColor: '#E8703A', borderRadius: 999,
  },

  /* Step header */
  stepLabel: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 0.8, color: '#6B7280', marginBottom: 8,
  },
  stepTitle: {
    fontSize: 28, fontWeight: '800', letterSpacing: -0.8,
    color: '#1A1A1A', marginBottom: 6, lineHeight: 32,
  },
  stepSub: { fontSize: 14, color: '#6B7280', marginBottom: 24 },

  /* Step footer */
  stepFooter: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 16,
    backgroundColor: '#FFFBF5',
    borderTopWidth: 1, borderTopColor: '#E5E7EB',
  },
  stepFooterLeft: { flex: 1 },
  stepFooterRight: { flex: 1, alignItems: 'flex-end' },

  backBtn: {
    paddingVertical: 12, paddingHorizontal: 20,
    borderRadius: 999, borderWidth: 2, borderColor: '#E5E7EB',
    alignSelf: 'flex-start',
  },
  backBtnText: { fontSize: 14, fontWeight: '600', color: '#6B7280' },

  nextBtn: {
    paddingVertical: 13, paddingHorizontal: 26,
    borderRadius: 999, backgroundColor: '#E8703A',
    shadowColor: '#E8703A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  nextBtnText: { fontSize: 15, fontWeight: '700', color: '#fff' },

  /* Skip link */
  skipLink: { paddingVertical: 8, alignItems: 'flex-end', marginBottom: 4 },
  skipLinkText: {
    fontSize: 13, fontWeight: '500', color: '#9CA3AF',
    textDecorationLine: 'underline',
  },

  sectionHeader: {
    fontSize: 13, fontWeight: '800', textTransform: 'uppercase',
    letterSpacing: 1, color: '#1A1A1A', marginBottom: 14, marginTop: 8,
    paddingBottom: 8, borderBottomWidth: 2, borderBottomColor: '#E5E7EB',
  },
  sectionHeaderAvoid: { color: '#F43F5E', borderBottomColor: 'rgba(244,63,94,0.2)' },
  sectionSub: { fontSize: 13, color: '#9CA3AF', marginBottom: 14, marginTop: -8 },
  avoidChip: { borderColor: '#FECDD3' },
  avoidChipSelected: { backgroundColor: '#F43F5E', borderColor: '#F43F5E' },
  avoidChipText: { color: '#F43F5E' },
  avoidChipTextSelected: { color: '#fff' },
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
  footerSpacer: { height: 140 },
  footer: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    paddingHorizontal: 24, paddingBottom: 40, paddingTop: 12,
    backgroundColor: '#FFFBF5',
  },
  decideBtn: {
    paddingVertical: 13, paddingHorizontal: 26,
    backgroundColor: '#E8703A', borderRadius: 999, alignItems: 'center',
    shadowColor: '#E8703A', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 4,
  },
  decideBtnDisabled: { opacity: 0.35, shadowOpacity: 0 },
  decideBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  errorMsg: { color: '#DC2626', fontSize: 13, marginTop: 12, textAlign: 'center' },
});
