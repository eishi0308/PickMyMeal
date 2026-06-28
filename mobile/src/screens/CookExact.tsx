import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator,
} from 'react-native';
import NavBar from '../components/NavBar';
import { CookExactResponse } from '../types';

interface Props {
  category: string;
  imageUrl: string | null;
  data: CookExactResponse | null;
  loading: boolean;
  error: boolean;
  onRetry: () => void;
  onSwitchToEasy: () => void;
  onOrder: (category: string, imageUrl: string | null) => void;
  onBack: () => void;
  onLogoClick: () => void;
}

export default function CookExact({
  category, imageUrl, data, loading, error,
  onRetry, onSwitchToEasy, onOrder, onBack, onLogoClick,
}: Props) {
  const [cookMode, setCookMode] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [done, setDone] = useState(false);

  if (loading) {
    return (
      <View style={styles.screen}>
        <NavBar onLogoClick={onLogoClick} onBack={onBack} />
        <View style={styles.centered}>
          <ActivityIndicator color="#E8703A" size="large" />
          <Text style={styles.loadingText}>Building the real recipe…</Text>
        </View>
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.screen}>
        <NavBar onLogoClick={onLogoClick} onBack={onBack} />
        <View style={styles.centered}>
          <Text style={styles.loadingText}>Couldn't load the recipe.</Text>
          <TouchableOpacity style={styles.cookBtn} onPress={onRetry}>
            <Text style={styles.cookBtnText}>Try again</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const progress = ((currentStep + 1) / data.steps.length) * 100;

  const handleNextStep = () => {
    if (currentStep < data.steps.length - 1) {
      setCurrentStep(s => s + 1);
    } else {
      setCookMode(false);
      setDone(true);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <NavBar onLogoClick={onLogoClick} onBack={onBack} />

        {/* Flow label */}
        <View style={styles.cookFlow}>
          <Text style={styles.cookFlowOriginal}>{category}</Text>
          <Text style={styles.cookFlowArrow}>→</Text>
          <View style={styles.cookFlowLabelWrap}>
            <Text style={styles.cookFlowLabel}>👨‍🍳 Real recipe</Text>
          </View>
        </View>

        {/* Primary card */}
        <View style={styles.primaryCard}>
          <Text style={styles.primaryTitle}>{data.dish_name}</Text>

          {imageUrl && (
            <Image style={styles.primaryImage} source={{ uri: imageUrl }} />
          )}

          <View style={styles.statsRow}>
            <View style={styles.statChip}><Text style={styles.statText}>⏱ {data.time_minutes} min</Text></View>
            <View style={styles.statChip}><Text style={styles.statText}>{data.effort}</Text></View>
            <View style={styles.statChip}><Text style={styles.statText}>Serves {data.serves}</Text></View>
            {data.saving_estimate && (
              <View style={styles.statChip}><Text style={styles.statText}>💰 Save {data.saving_estimate}</Text></View>
            )}
          </View>

          {data.delivery_estimate && (
            <View style={styles.savingsCard}>
              <View style={styles.savingsRow}>
                <Text style={styles.savingsLabel}>Delivery / restaurant</Text>
                <Text style={styles.savingsValue}>{data.delivery_estimate}</Text>
              </View>
              <View style={styles.savingsRow}>
                <Text style={styles.savingsLabel}>Cook at home</Text>
                <Text style={styles.savingsValue}>{data.home_estimate}</Text>
              </View>
              <View style={[styles.savingsRow, styles.savingsHighlight]}>
                <Text style={[styles.savingsLabel, styles.savingsHighlightText]}>You could save</Text>
                <Text style={[styles.savingsValue, styles.savingsHighlightText]}>{data.saving_estimate}</Text>
              </View>
            </View>
          )}

          {data.tip && (
            <View style={styles.tip}>
              <Text style={styles.tipText}>💡 {data.tip}</Text>
            </View>
          )}
        </View>

        {/* Cook mode or ingredient/step list */}
        {cookMode ? (
          <View style={styles.cookMode}>
            <View style={styles.cookModeHeader}>
              <Text style={styles.cookModeLabel}>Step {currentStep + 1} of {data.steps.length}</Text>
              <TouchableOpacity onPress={() => setCookMode(false)}>
                <Text style={styles.cookModeExit}>Exit cook mode</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progress}%` as any }]} />
            </View>
            <Text style={styles.cookModeStep}>{data.steps[currentStep]}</Text>
            <TouchableOpacity style={styles.cookBtn} onPress={handleNextStep}>
              <Text style={styles.cookBtnText}>
                {currentStep < data.steps.length - 1 ? 'Next step →' : 'Done! 🎉'}
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>Ingredients</Text>
              <View style={styles.ingredientsWrap}>
                {data.ingredients.map((ing, i) => (
                  <View key={i} style={styles.ingredientChip}>
                    <Text style={styles.ingredientText}>{ing}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionLabel}>How to make it</Text>
              {data.steps.map((step, i) => (
                <View key={i} style={styles.stepRow}>
                  <View style={styles.stepNum}>
                    <Text style={styles.stepNumText}>{i + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step.replace(/^\d+\.\s*/, '')}</Text>
                </View>
              ))}
            </View>
          </>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {done ? (
            <View style={styles.savedBanner}>
              <Text style={styles.savedBannerText}>You made the real {category}! 🎉</Text>
            </View>
          ) : !cookMode ? (
            <TouchableOpacity style={styles.cookBtn} onPress={() => { setCookMode(true); setCurrentStep(0); }}>
              <Text style={styles.cookBtnText}>Start cooking — step by step</Text>
            </TouchableOpacity>
          ) : null}

          <TouchableOpacity style={styles.uberBtn} onPress={() => onOrder(category, imageUrl)}>
            <Text style={styles.uberBtnText}>Order on Uber Eats instead</Text>
          </TouchableOpacity>

          <View style={styles.escapeWrap}>
            <Text style={styles.escapeLabel}>Looks too complex?</Text>
            <TouchableOpacity onPress={onSwitchToEasy}>
              <Text style={styles.escapeBtn}>Show me the easy home version →</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.backLinkBtn} onPress={onBack}>
            <Text style={styles.backLinkBtnText}>← Back to picks</Text>
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

  cookFlow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16, flexWrap: 'wrap' },
  cookFlowOriginal: { fontSize: 15, fontWeight: '800', color: '#1A1A1A', letterSpacing: -0.3 },
  cookFlowArrow: { fontSize: 15, color: '#9CA3AF' },
  cookFlowLabelWrap: { backgroundColor: 'rgba(0,0,0,0.06)', borderRadius: 999, paddingVertical: 3, paddingHorizontal: 10 },
  cookFlowLabel: { fontSize: 13, fontWeight: '700', color: '#374151' },

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
  primaryTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -1,
    textTransform: 'capitalize',
    marginBottom: 14,
    lineHeight: 38,
  },
  primaryImage: { width: '100%', height: 180, borderRadius: 18, marginBottom: 16, backgroundColor: '#F3F4F6' },

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
  savingsHighlight: { borderTopWidth: 1, borderTopColor: 'rgba(0,0,0,0.08)', paddingTop: 10, marginTop: 2 },
  savingsHighlightText: { color: '#16A34A', fontWeight: '800' },

  tip: {
    backgroundColor: 'rgba(232,112,58,0.06)',
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#E8703A',
  },
  tipText: { fontSize: 13, color: '#6B7280', lineHeight: 20 },

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
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 5,
  },
  cookBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },

  uberBtn: {
    backgroundColor: 'transparent',
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.18)',
  },
  uberBtnText: { color: '#111', fontSize: 16, fontWeight: '700' },

  escapeWrap: { alignItems: 'center', gap: 6, paddingVertical: 8 },
  escapeLabel: { fontSize: 13, color: '#9CA3AF' },
  escapeBtn: { fontSize: 14, fontWeight: '700', color: '#7C5CFC' },

  backLinkBtn: { paddingVertical: 12, alignItems: 'center' },
  backLinkBtnText: { color: '#9CA3AF', fontSize: 15, fontWeight: '500' },
});
