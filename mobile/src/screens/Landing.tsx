import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { getHistory } from '../api/history';

interface Props {
  onStart: () => void;
  onHistory: () => void;
}

const EMOJIS = ['🍜', '🍕', '🌮', '🍱', '🥗'];

export default function Landing({ onStart, onHistory }: Props) {
  const [historyCount, setHistoryCount] = useState(0);
  const floatAnims = useRef(EMOJIS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    getHistory().then((h) => setHistoryCount(h.length));

    const animations = floatAnims.map((anim, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(anim, { toValue: -10, duration: 1300, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 0, duration: 1300, useNativeDriver: true }),
        ])
      )
    );
    animations.forEach((a) => a.start());
    return () => animations.forEach((a) => a.stop());
  }, []);

  return (
    <View style={styles.screen}>
      <View style={styles.emojis}>
        {EMOJIS.map((emoji, i) => (
          <Animated.Text
            key={i}
            style={[styles.emoji, { transform: [{ translateY: floatAnims[i] }] }]}
          >
            {emoji}
          </Animated.Text>
        ))}
      </View>

      <View style={styles.content}>
        <Text style={styles.title}>DecideMyMeal</Text>
        <Text style={styles.tagline}>
          Can't decide what to eat?{'\n'}Tap a few moods. We'll handle the rest.
        </Text>

        <View style={styles.sellingPoints}>
          {[
            { icon: '✕', text: 'No scrolling through endless menus' },
            { icon: '✕', text: 'No comparing 30 options' },
            { icon: '✕', text: 'No thinking for 20 minutes' },
            { icon: '→', text: 'Just take this — or adjust slightly', highlight: true },
          ].map(({ icon, text, highlight }, i) => (
            <View key={i} style={styles.sellingRow}>
              <Text style={[styles.sellingIcon, highlight && styles.sellingIconHighlight]}>{icon}</Text>
              <Text style={[styles.sellingText, highlight && styles.sellingTextHighlight]}>{text}</Text>
            </View>
          ))}
        </View>

        <TouchableOpacity style={styles.ctaBtn} onPress={onStart}>
          <Text style={styles.ctaBtnText}>Let's go →</Text>
        </TouchableOpacity>

        {historyCount > 0 && (
          <View style={styles.returning}>
            <Text style={styles.returningText}>
              Welcome back — you've tried {historyCount} meal{historyCount !== 1 ? 's' : ''}.
            </Text>
            <TouchableOpacity onPress={onHistory}>
              <Text style={styles.historyLink}>View history →</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingBottom: 60,
    backgroundColor: '#FFFBF5',
  },
  emojis: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: 48,
  },
  emoji: {
    fontSize: 36,
  },
  content: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontSize: 42,
    fontWeight: '800',
    letterSpacing: -1.5,
    color: '#1A1A1A',
    marginBottom: 14,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 17,
    color: '#6B7280',
    lineHeight: 28,
    marginBottom: 28,
    textAlign: 'center',
  },
  sellingPoints: {
    alignSelf: 'stretch',
    gap: 10,
    marginBottom: 36,
    paddingHorizontal: 8,
  },
  sellingRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  sellingIcon: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E8703A',
    marginTop: 2,
    width: 14,
  },
  sellingIconHighlight: {
    fontSize: 14,
  },
  sellingText: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 22,
    flex: 1,
  },
  sellingTextHighlight: {
    color: '#1A1A1A',
    fontWeight: '600',
  },
  ctaBtn: {
    width: 280,
    backgroundColor: '#E8703A',
    borderRadius: 999,
    paddingVertical: 18,
    alignItems: 'center',
  },
  ctaBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
  returning: {
    alignItems: 'center',
    gap: 6,
    marginTop: 28,
  },
  returningText: {
    fontSize: 13,
    color: '#6B7280',
  },
  historyLink: {
    fontSize: 13,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});
