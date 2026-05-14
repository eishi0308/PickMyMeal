import { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NavBar from '../components/NavBar';
import { getCookAlternative, generateImage } from '../api/foodApi';
import { CookAlternativeResponse } from '../types';

interface Props {
  category: string;
  imageUrl: string | null;
  prefetchedData: CookAlternativeResponse | null;
  prefetchLoading: boolean;
  onOrder: (category: string, imageUrl: string | null) => void;
  onBack: () => void;
  onReset: () => void;
  onLogoClick: () => void;
}

interface SavingsEntry {
  date: string;
  dish: string;
  alternative: string;
  saving: string;
  amount: number;
}

function parseSavingMidpoint(saving: string): number {
  const match = saving.replace('~', '').match(/\$(\d+)[–\-](\d+)/);
  if (!match) return 0;
  return Math.round((parseInt(match[1]) + parseInt(match[2])) / 2);
}

async function loadSavings(): Promise<{ count: number; total: number }> {
  const raw = await AsyncStorage.getItem('cookedSavings');
  const entries: SavingsEntry[] = raw ? JSON.parse(raw) : [];
  const total = entries.reduce((sum, e) => sum + (e.amount || 0), 0);
  return { count: entries.length, total };
}

async function saveCookedEntry(dish: string, alternative: string, saving: string) {
  const raw = await AsyncStorage.getItem('cookedSavings');
  const entries: SavingsEntry[] = raw ? JSON.parse(raw) : [];
  entries.push({ date: new Date().toISOString(), dish, alternative, saving, amount: parseSavingMidpoint(saving) });
  await AsyncStorage.setItem('cookedSavings', JSON.stringify(entries));
}

export default function CookAlternative({
  category, imageUrl, prefetchedData, prefetchLoading,
  onOrder, onBack, onReset, onLogoClick,
}: Props) {
  const [variant, setVariant] = useState<'easier' | 'closer' | undefined>(undefined);
  const [variantData, setVariantData] = useState<CookAlternativeResponse | null>(null);
  const [variantLoading, setVariantLoading] = useState(false);
  const [variantError, setVariantError] = useState(false);

  const [selfData, setSelfData] = useState<CookAlternativeResponse | null>(null);
  const [selfLoading, setSelfLoading] = useState(false);
  const [selfError, setSelfError] = useState(false);
  const didSelfFetch = useRef(false);

  const [altImage, setAltImage] = useState<string | null>(null);
  const [cooked, setCooked] = useState(false);
  const [cookMode, setCookMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [savings, setSavings] = useState({ count: 0, total: 0 });

  useEffect(() => {
    loadSavings().then(setSavings);
  }, []);

  // Self-fetch fallback
  useEffect(() => {
    if (variant !== undefined || prefetchedData || prefetchLoading || didSelfFetch.current) return;
    didSelfFetch.current = true;
    setSelfLoading(true);
    setSelfError(false);
    getCookAlternative(category)
      .then(res => { setSelfData(res); setSelfLoading(false); })
      .catch(() => { setSelfError(true); setSelfLoading(false); });
  }, [variant, prefetchedData, prefetchLoading, category]);

  // Variant fetch
  useEffect(() => {
    if (variant === undefined) return;
    let cancelled = false;
    setVariantLoading(true);
    setVariantError(false);
    setVariantData(null);
    setCooked(false);
    setCookMode(false);
    getCookAlternative(category, variant)
      .then(res => { if (!cancelled) { setVariantData(res); setVariantLoading(false); } })
      .catch(() => { if (!cancelled) { setVariantError(true); setVariantLoading(false); } });
    return () => { cancelled = true; };
  }, [variant, category]);

  const activeData = variantData ?? prefetchedData ?? selfData;
  const loading = variant !== undefined ? variantLoading : (prefetchLoading || selfLoading);
  const error = variant !== undefined ? variantError : selfError;

  useEffect(() => {
    if (!activeData) return;
    setAltImage(null);
    generateImage(activeData.alternative_name, activeData.alternative_name)
      .then(img => setAltImage(img.image_url ?? null));
  }, [activeData?.alternative_name]);

  const handleCooked = async () => {
    if (!activeData) return;
    await saveCookedEntry(category, activeData.alternative_name, activeData.saving_estimate);
    const updated = await loadSavings();
    setSavings(updated);
    setCooked(true);
    setCookMode(true);
    setCurrentStep(0);
  };

  const handleNextStep = () => {
    if (!activeData) return;
    if (currentStep < activeData.steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setCookMode(false);
    }
  };

  const handleRetry = () => {
    didSelfFetch.current = false;
    setSelfData(null);
    setSelfError(false);
    setSelfLoading(true);
    getCookAlternative(category)
      .then(res => { setSelfData(res); setSelfLoading(false); })
      .catch(() => { setSelfError(true); setSelfLoading(false); });
  };

  if (loading) {
    return (
      <View style={styles.screen}>
        <NavBar onLogoClick={onLogoClick} onBack={onBack} />
        <View style={styles.centered}>
          <ActivityIndicator color="#E8703A" size="large" />
          <Text style={styles.loadingText}>Finding a home-cook version…</Text>
        </View>
      </View>
    );
  }

  if (error || !activeData) {
    return (
      <View style={styles.screen}>
        <NavBar onLogoClick={onLogoClick} onBack={onBack} />
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Couldn't load the home-cook alternative.</Text>
          <TouchableOpacity style={styles.cookBtn} onPress={handleRetry}>
            <Text style={styles.cookBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progress = ((currentStep + 1) / activeData.steps.length) * 100;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <NavBar onLogoClick={onLogoClick} onBack={onBack} />

        {savings.count > 0 && (
          <View style={styles.savingsCounter}>
            <Text style={styles.savingsCounterText}>
              🏠 {savings.count} home cook{savings.count > 1 ? 's' : ''} · ~${savings.total} saved so far
            </Text>
          </View>
        )}

        <Text style={styles.originLabel}>You picked</Text>
        <Text style={styles.originDish}>{category}</Text>

        {/* Main card */}
        <View style={styles.primaryCard}>
          <View style={styles.cookBadge}>
            <Text style={styles.cookBadgeText}>🏠 Home Cook Alternative</Text>
          </View>
          <Text style={styles.primaryTitle}>{activeData.alternative_name}</Text>

          <View style={styles.imageWrap}>
            {altImage
              ? <Image style={styles.primaryImage} source={{ uri: altImage }} />
              : <View style={styles.imageShimmer} />
            }
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statChip}><Text style={styles.statText}>⏱ {activeData.time_minutes} min</Text></View>
            <View style={styles.statChip}><Text style={styles.statText}>{activeData.effort}</Text></View>
            <View style={styles.statChip}><Text style={styles.statText}>💰 Save {activeData.saving_estimate}</Text></View>
          </View>

          <View style={styles.savingsCard}>
            <View style={styles.savingsRow}>
              <Text style={styles.savingsLabel}>Delivery / restaurant</Text>
              <Text style={styles.savingsValue}>{activeData.delivery_estimate}</Text>
            </View>
            <View style={styles.savingsRow}>
              <Text style={styles.savingsLabel}>Cook at home</Text>
              <Text style={styles.savingsValue}>{activeData.home_estimate}</Text>
            </View>
            <View style={[styles.savingsRow, styles.savingsHighlight]}>
              <Text style={[styles.savingsLabel, styles.savingsHighlightText]}>You could save</Text>
              <Text style={[styles.savingsValue, styles.savingsHighlightText]}>{activeData.saving_estimate}</Text>
            </View>
          </View>

          <Text style={styles.explanation}>{activeData.explanation}</Text>
        </View>

        {/* Cook mode or ingredient/step list */}
        {cookMode ? (
          <View style={styles.cookMode}>
            <View style={styles.cookModeHeader}>
              <Text style={styles.cookModeLabel}>Step {currentStep + 1} of {activeData.steps.length}</Text>
              <TouchableOpacity onPress={() => setCookMode(false)}>
                <Text style={styles.cookModeExit}>Exit cook mode</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
            </View>
            <Text style={styles.cookModeStep}>{activeData.steps[currentStep]}</Text>
            <TouchableOpacity style={styles.cookBtn} onPress={handleNextStep}>
              <Text style={styles.cookBtnText}>
                {currentStep < activeData.steps.length - 1 ? 'Next step →' : 'Done! 🎉'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Ingredients</Text>
              <View style={styles.ingredientsWrap}>
                {activeData.ingredients.map((ing, i) => (
                  <View key={i} style={styles.ingredientChip}>
                    <Text style={styles.ingredientText}>{ing}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>How to make it</Text>
              {activeData.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {cooked && !cookMode ? (
            <View style={styles.savedBanner}>
              <Text style={styles.savedBannerText}>Cooked at home! You saved ~{activeData.saving_estimate} 🎉</Text>
            </View>
          ) : !cooked ? (
            <TouchableOpacity style={styles.cookBtn} onPress={handleCooked}>
              <Text style={styles.cookBtnText}>I'll cook this — save {activeData.saving_estimate}</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.uberBtn} onPress={() => onOrder(category, imageUrl)}>
            <Text style={styles.uberBtnText}>Order on Uber Eats anyway</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => { setVariant('easier'); setCooked(false); setCookMode(false); }}
          >
            <Text style={styles.ghostBtnText}>Make it even easier</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.ghostBtn}
            onPress={() => { setVariant('closer'); setCooked(false); setCookMode(false); }}
          >
            <Text style={styles.ghostBtnText}>Make it closer to {category}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={onBack}>
            <Text style={styles.ghostBtnText}>← Back to picks</Text>
          </TouchableOpacity>

          <TouchableOpacity style={[styles.ghostBtn, styles.dangerBtn]} onPress={onReset}>
            <Text style={[styles.ghostBtnText, styles.dangerText]}>× Start over</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFBF5' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, padding: 24 },
  loadingText: { fontSize: 16, color: '#6B7280', textAlign: 'center', marginTop: 12 },

  savingsCounter: {
    backgroundColor: 'rgba(232,112,58,0.08)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignSelf: 'flex-start',
    marginBottom: 16,
  },
  savingsCounterText: { fontSize: 13, fontWeight: '600', color: '#E8703A' },

  originLabel: { fontSize: 12, fontWeight: '700', color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  originDish: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 16 },

  primaryCard: {
    backgroundColor: '#fff',
    borderRadius: 28,
    padding: 24,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.07,
    shadowRadius: 16,
    elevation: 4,
  },
  cookBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(232,112,58,0.1)',
    borderRadius: 9999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginBottom: 10,
  },
  cookBadgeText: { fontSize: 11, fontWeight: '700', color: '#E8703A', letterSpacing: 0.5, textTransform: 'uppercase' },
  primaryTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -1,
    textTransform: 'capitalize',
    marginBottom: 14,
    lineHeight: 38,
  },
  imageWrap: { marginBottom: 16 },
  primaryImage: { width: '100%', height: 180, borderRadius: 18, backgroundColor: '#F3F4F6' },
  imageShimmer: { width: '100%', height: 180, borderRadius: 18, backgroundColor: '#E5E7EB' },

  statsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  statChip: {
    backgroundColor: 'rgba(232,112,58,0.08)',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  statText: { fontSize: 13, fontWeight: '600', color: '#E8703A' },

  savingsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    gap: 10,
  },
  savingsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  savingsLabel: { fontSize: 14, color: '#6B7280' },
  savingsValue: { fontSize: 14, fontWeight: '700', color: '#1A1A1A' },
  savingsHighlight: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.08)',
    paddingTop: 10,
    marginTop: 2,
  },
  savingsHighlightText: { color: '#16A34A', fontWeight: '800' },

  explanation: { fontSize: 15, color: '#6B7280', lineHeight: 26 },

  cookMode: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 24,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    gap: 16,
  },
  cookModeHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  cookModeLabel: { fontSize: 13, fontWeight: '700', color: '#1A1A1A' },
  cookModeExit: { fontSize: 13, color: '#9CA3AF', fontWeight: '500' },
  progressTrack: { height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, overflow: 'hidden' },
  progressFill: { height: 4, backgroundColor: '#E8703A', borderRadius: 2 },
  cookModeStep: { fontSize: 17, color: '#1A1A1A', lineHeight: 28, fontWeight: '500' },

  section: { marginBottom: 20 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  ingredientsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  ingredientChip: {
    backgroundColor: '#F3F4F6',
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  ingredientText: { fontSize: 13, color: '#374151', fontWeight: '500' },

  stepRow: { flexDirection: 'row', gap: 12, marginBottom: 12, alignItems: 'flex-start' },
  stepNum: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8703A',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
    marginTop: 1,
  },
  stepNumText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  stepText: { flex: 1, fontSize: 15, color: '#374151', lineHeight: 24 },

  actions: { gap: 12 },
  savedBanner: {
    backgroundColor: 'rgba(22,163,74,0.1)',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
  },
  savedBannerText: { fontSize: 15, fontWeight: '700', color: '#16A34A', textAlign: 'center' },

  cookBtn: {
    backgroundColor: '#E8703A',
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#E8703A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
  },
  cookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },

  uberBtn: {
    backgroundColor: '#000',
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
  },
  uberBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  ghostBtn: {
    borderRadius: 999,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(0,0,0,0.15)',
  },
  ghostBtnText: { color: '#374151', fontSize: 15, fontWeight: '600' },
  dangerBtn: { borderColor: '#F43F5E' },
  dangerText: { color: '#F43F5E' },
});
