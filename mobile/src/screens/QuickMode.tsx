import { useState, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
} from 'react-native';
import { PreferenceMap } from '../types';

const STEPS = [
  {
    key: 'temperature',
    question: 'Hot or cold?',
    options: [
      { value: 'Hot', emoji: '🔥', label: 'Hot' },
      { value: 'Cold', emoji: '🧊', label: 'Cold' },
    ],
  },
  {
    key: 'fullness',
    question: 'Light or heavy?',
    options: [
      { value: 'Light', emoji: '🥗', label: 'Light' },
      { value: 'Heavy', emoji: '🍖', label: 'Heavy' },
    ],
  },
  {
    key: 'mood',
    question: "What's the vibe?",
    options: [
      { value: 'Comfort food', emoji: '🍲', label: 'Comfort food' },
      { value: 'Healthy', emoji: '🥗', label: 'Healthy' },
      { value: 'Treat yourself', emoji: '🍰', label: 'Treat yourself' },
    ],
  },
];

interface Props {
  onSubmit: (preferences: PreferenceMap) => void;
}

export default function QuickMode({ onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PreferenceMap>({});
  const [showConfirm, setShowConfirm] = useState(false);
  const submitting = useRef(false);
  const fadeAnim = useRef(new Animated.Value(1)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const currentStep = STEPS[step];
  const progressPct = showConfirm ? 100 : ((step + 1) / STEPS.length) * 100;
  const prevAnswers = STEPS.slice(0, step).filter(s => answers[s.key]).map(s => {
    const opt = s.options.find(o => o.value === answers[s.key]);
    return opt ? { emoji: opt.emoji, label: opt.label } : null;
  }).filter(Boolean) as { emoji: string; label: string }[];

  const animateTransition = (dir: 'fwd' | 'back', callback: () => void) => {
    const outX = dir === 'fwd' ? -32 : 32;
    const inX = dir === 'fwd' ? 32 : -32;
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 0, duration: 120, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: outX, duration: 120, useNativeDriver: true }),
    ]).start(() => {
      callback();
      slideAnim.setValue(inX);
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 160, useNativeDriver: true }),
        Animated.timing(slideAnim, { toValue: 0, duration: 160, useNativeDriver: true }),
      ]).start();
    });
  };

  const handleChoice = (value: string) => {
    if (submitting.current) return;
    const newAnswers = { ...answers, [STEPS[step].key]: value };
    setAnswers(newAnswers);
    if (step < STEPS.length - 1) {
      animateTransition('fwd', () => setStep(s => s + 1));
    } else {
      animateTransition('fwd', () => setShowConfirm(true));
    }
  };

  const goBack = () => {
    if (showConfirm) {
      animateTransition('back', () => setShowConfirm(false));
    } else if (step > 0) {
      animateTransition('back', () => setStep(s => s - 1));
    }
  };

  const handleConfirm = () => {
    if (submitting.current) return;
    submitting.current = true;
    onSubmit(answers);
  };

  if (showConfirm) {
    return (
      <View style={styles.container}>
        <View style={styles.progressTrack}>
          <View style={[styles.progressFill, { width: '100%' }]} />
        </View>

        <Animated.View style={[styles.stepContent, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
          <Text style={styles.question}>Does this look right?</Text>
          <View style={styles.confirmList}>
            {STEPS.map(s => {
              const opt = s.options.find(o => o.value === answers[s.key]);
              if (!opt) return null;
              return (
                <View key={s.key} style={styles.confirmRow}>
                  <Text style={styles.confirmEmoji}>{opt.emoji}</Text>
                  <View style={styles.confirmText}>
                    <Text style={styles.confirmQ}>{s.question}</Text>
                    <Text style={styles.confirmA}>{opt.label}</Text>
                  </View>
                </View>
              );
            })}
          </View>
          <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} activeOpacity={0.85}>
            <Text style={styles.confirmBtnText}>Find my meal →</Text>
          </TouchableOpacity>
        </Animated.View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={goBack} activeOpacity={0.7}>
            <Text style={styles.backBtn}>← Change something</Text>
          </TouchableOpacity>
          <View />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress bar */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${progressPct}%` as any }]} />
      </View>

      {/* Previous answer chips */}
      <View style={styles.prevAnswers}>
        {prevAnswers.map((a, i) => (
          <View key={i} style={styles.prevChip}>
            <Text style={styles.prevChipText}>{a.emoji} {a.label}</Text>
          </View>
        ))}
      </View>

      <Animated.View style={[styles.stepContent, { opacity: fadeAnim, transform: [{ translateX: slideAnim }] }]}>
        <Text style={styles.question}>{currentStep.question}</Text>
        <View style={styles.options}>
          {currentStep.options.map(({ value, emoji, label }) => {
            const isSelected = answers[currentStep.key] === value;
            return (
              <TouchableOpacity
                key={value}
                style={[styles.card, isSelected && styles.cardSelected]}
                onPress={() => handleChoice(value)}
                activeOpacity={0.85}
              >
                <Text style={styles.cardEmoji}>{emoji}</Text>
                <Text style={styles.cardLabel}>{label}</Text>
                <Text style={[styles.cardArrow, isSelected && styles.cardArrowSelected]}>
                  {isSelected ? '✓' : '→'}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        {step > 0 ? (
          <TouchableOpacity onPress={goBack} activeOpacity={0.7}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
        ) : <View />}
        <Text style={styles.stepCounter}>{step + 1} / {STEPS.length}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingBottom: 20,
  },
  progressTrack: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 99,
    marginBottom: 32,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: '#E8703A',
    borderRadius: 99,
  },
  prevAnswers: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
    minHeight: 32,
  },
  prevChip: {
    backgroundColor: 'rgba(232,112,58,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232,112,58,0.2)',
    borderRadius: 99,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  prevChipText: { fontSize: 13, color: '#E8703A', fontWeight: '600' },
  stepContent: { width: '100%', flex: 1 },
  question: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 28,
    color: '#1A1A1A',
    lineHeight: 36,
  },
  options: {
    flexDirection: 'column',
    gap: 12,
    width: '100%',
  },
  card: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 20,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  cardSelected: {
    borderColor: '#E8703A',
    backgroundColor: 'rgba(232,112,58,0.05)',
  },
  cardEmoji: { fontSize: 34, lineHeight: 40, flexShrink: 0 },
  cardLabel: { flex: 1, fontSize: 18, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.3 },
  cardArrow: { fontSize: 16, color: '#9CA3AF', flexShrink: 0 },
  cardArrowSelected: { color: '#E8703A' },

  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 28,
  },
  backBtn: { fontSize: 14, fontWeight: '600', color: '#6B7280', paddingVertical: 8 },
  stepCounter: { fontSize: 13, fontWeight: '500', color: '#6B7280' },

  // Confirm screen
  confirmList: { flexDirection: 'column', gap: 10, width: '100%', marginBottom: 28 },
  confirmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 16,
  },
  confirmEmoji: { fontSize: 28, flexShrink: 0 },
  confirmText: { flexDirection: 'column', gap: 2 },
  confirmQ: { fontSize: 12, color: '#6B7280', fontWeight: '500' },
  confirmA: { fontSize: 16, fontWeight: '700', color: '#1A1A1A', letterSpacing: -0.2 },
  confirmBtn: {
    width: '100%',
    paddingVertical: 18,
    backgroundColor: '#E8703A',
    borderRadius: 16,
    alignItems: 'center',
  },
  confirmBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
