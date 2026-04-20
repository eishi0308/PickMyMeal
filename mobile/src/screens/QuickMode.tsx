import { useState } from 'react';
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
    key: 'flavor',
    question: 'Salty or sweet?',
    options: [
      { value: 'Salty', emoji: '🧂', label: 'Salty' },
      { value: 'Sweet', emoji: '🍯', label: 'Sweet' },
    ],
  },
];

interface Props {
  onSubmit: (preferences: PreferenceMap) => void;
}

export default function QuickMode({ onSubmit }: Props) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<PreferenceMap>({});

  const handleChoice = (value: string) => {
    const newAnswers = { ...answers, [STEPS[step].key]: value };
    setAnswers(newAnswers);
    if (step < STEPS.length - 1) {
      setStep(step + 1);
    } else {
      onSubmit(newAnswers);
    }
  };

  const currentStep = STEPS[step];

  return (
    <View style={styles.container}>
      {/* Progress dots */}
      <View style={styles.progress}>
        {STEPS.map((_, i) => (
          <View
            key={i}
            style={[
              styles.dot,
              i < step && styles.dotDone,
              i === step && styles.dotActive,
            ]}
          />
        ))}
      </View>

      <View style={styles.stepContent}>
        <Text style={styles.stepLabel}>{step + 1} of {STEPS.length}</Text>
        <Text style={styles.question}>{currentStep.question}</Text>
        <View style={styles.options}>
          {currentStep.options.map(({ value, emoji, label }) => (
            <TouchableOpacity
              key={value}
              style={styles.card}
              onPress={() => handleChoice(value)}
              activeOpacity={0.75}
            >
              <Text style={styles.emoji}>{emoji}</Text>
              <Text style={styles.cardLabel}>{label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 60,
  },
  progress: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 44,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5E7EB',
  },
  dotActive: {
    backgroundColor: '#E8703A',
    transform: [{ scale: 1.25 }],
  },
  dotDone: {
    backgroundColor: '#E8703A',
    opacity: 0.35,
  },
  stepContent: {
    width: '100%',
    alignItems: 'center',
  },
  stepLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    marginBottom: 14,
    letterSpacing: 0.2,
  },
  question: {
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: -0.8,
    textAlign: 'center',
    marginBottom: 40,
    color: '#1A1A1A',
    lineHeight: 36,
  },
  options: {
    flexDirection: 'row',
    gap: 14,
    width: '100%',
  },
  card: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingVertical: 36,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#EBEBEB',
    borderRadius: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  emoji: {
    fontSize: 52,
    lineHeight: 60,
  },
  cardLabel: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A1A1A',
    letterSpacing: -0.3,
  },
});
