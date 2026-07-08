import { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Animated } from 'react-native';
import { getHistory } from '../api/history';

interface Props {
  onStart: () => void;
  onHistory: () => void;
}

const STEPS = [
  {
    num: '01',
    emoji: '🎭',
    title: 'Tell your mood',
    desc: 'Spicy, cozy, quick, adventurous — tap a few feelings in under a minute.',
    color: '#E8703A',
  },
  {
    num: '02',
    emoji: '✨',
    title: 'AI picks one dish',
    desc: 'No endless scrolling. No paradox of choice. One perfect meal, just for you.',
    color: '#7C3AED',
  },
  {
    num: '03',
    emoji: '🍳',
    title: 'Cook it or order it',
    desc: 'Get a real recipe and save AU$15+ — or order from your favourite app instantly.',
    color: '#FF6B9D',
  },
];

const FEATURES = [
  {
    icon: '⚡',
    title: 'Instant decisions',
    desc: "Under a minute from mood to meal. Because your hunger can't wait.",
    bgColor: 'rgba(232,112,58,0.14)',
    borderColor: 'rgba(232,112,58,0.28)',
  },
  {
    icon: '🎯',
    title: 'One recommendation',
    desc: 'Not 50 options. Just the right one. Picked for your exact mood right now.',
    bgColor: 'rgba(124,58,237,0.14)',
    borderColor: 'rgba(124,58,237,0.28)',
  },
  {
    icon: '🧠',
    title: 'Gets smarter',
    desc: 'Preferences remembered. Every pick learns from you and gets better over time.',
    bgColor: 'rgba(255,107,157,0.14)',
    borderColor: 'rgba(255,107,157,0.28)',
  },
];

const SAVINGS_ROWS = [
  { label: 'Uber Eats / DoorDash', src: 'food + delivery + service fees · Uber AU', val: '~$26–38', color: '#F43F5E' },
  { label: 'Cook at home', src: 'ingredients per person · Canstar Blue, 2025', val: '~$5–10', color: 'rgba(255,255,255,0.7)' },
];

export default function Landing({ onStart, onHistory }: Props) {
  const [historyCount, setHistoryCount] = useState(0);
  const heroOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    getHistory().then((h) => setHistoryCount(h.length));
    Animated.timing(heroOpacity, { toValue: 1, duration: 700, useNativeDriver: true }).start();
  }, []);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

      {/* ── HERO ── */}
      <Animated.View style={[styles.hero, { opacity: heroOpacity }]}>
        <View style={styles.badge}>
          <View style={styles.badgeDot} />
          <Text style={styles.badgeText}>AI-powered meal decisions</Text>
          <View style={styles.badgeTag}><Text style={styles.badgeTagText}>NEW</Text></View>
        </View>

        <Text style={styles.headline}>
          No idea what to eat?{'\n'}<Text style={styles.gradText}>We got you.</Text>
        </Text>

        <Text style={styles.tagline}>
          Tell us your mood. Get <Text style={styles.taglineStrong}>one perfect dish</Text>
          {' '}—{'\n'}cook it for <Text style={styles.accent}>AU$15+ less</Text> or order instantly.
        </Text>

        <TouchableOpacity style={styles.ctaBtn} onPress={onStart} activeOpacity={0.85}>
          <Text style={styles.ctaBtnText}>Decide my meal →</Text>
        </TouchableOpacity>

        {historyCount > 0 && (
          <TouchableOpacity onPress={onHistory} activeOpacity={0.7}>
            <Text style={styles.ghostBtn}>
              {historyCount} past meal{historyCount !== 1 ? 's' : ''} →
            </Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      {/* ── PROBLEM HOOK ── */}
      <View style={styles.section}>
        <View style={styles.problemCard}>
          <Text style={styles.problemLabel}>You know this feeling.</Text>
          <Text style={styles.problemQ}>
            "I've been scrolling for <Text style={styles.kw}>20 minutes</Text>
            {' '}—{'\n'}and I still <Text style={styles.kw}>don't know what to eat.</Text>"
          </Text>
          <View style={styles.problemRule} />
          <Text style={styles.problemA}>
            One decision. <Text style={styles.gradText}>Made for you.</Text>
          </Text>
          <View style={styles.problemStatBlock}>
            <Text style={styles.problemStatNum}>AU$60</Text>
            <View style={styles.problemStatRight}>
              <Text style={styles.problemStatText}>
                average Australians spend per week on food delivery — most of it on meals they never planned.
              </Text>
              <Text style={styles.problemStatSrc}>Source: Canstar Blue, 2025</Text>
            </View>
          </View>
        </View>
      </View>

      {/* ── HOW IT WORKS ── */}
      <View style={styles.section}>
        <View style={styles.secHead}>
          <Text style={styles.secTag}>How it works</Text>
          <Text style={styles.secTitle}>3 steps.{'\n'}<Text style={styles.gradText}>One perfect meal.</Text></Text>
        </View>
        <View style={styles.steps}>
          {STEPS.map((s, i) => (
            <View key={i} style={styles.step}>
              <Text style={[styles.stepNum, { color: s.color }]}>{s.num}</Text>
              <View style={styles.stepBody}>
                <Text style={styles.stepEmoji}>{s.emoji}</Text>
                <Text style={styles.stepTitle}>{s.title}</Text>
                <Text style={styles.stepDesc}>{s.desc}</Text>
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* ── SAVINGS PROOF ── */}
      <View style={styles.section}>
        <View style={styles.secHead}>
          <Text style={styles.secTag}>Cook it for less</Text>
          <Text style={styles.secTitle}>Every single time.</Text>
        </View>
        <View style={styles.savCard}>
          {SAVINGS_ROWS.map((row, i) => (
            <View key={i} style={[styles.savRow, i < SAVINGS_ROWS.length - 1 && styles.savRowBorder]}>
              <View style={styles.savLeft}>
                <Text style={styles.savLabel}>{row.label}</Text>
                <Text style={styles.savSrc}>{row.src}</Text>
              </View>
              <Text style={[styles.savVal, { color: row.color }]}>{row.val}</Text>
            </View>
          ))}
          <View style={styles.savDivider} />
          <View style={styles.savTotal}>
            <Text style={styles.savTotalLabel}>You save</Text>
            <View style={styles.savTotalRight}>
              <Text style={styles.savTotalVal}>AU$15+</Text>
              <View style={styles.savBadge}><Text style={styles.savBadgeText}>per meal</Text></View>
            </View>
          </View>
        </View>
      </View>

      {/* ── FEATURES ── */}
      <View style={styles.section}>
        <View style={styles.secHead}>
          <Text style={styles.secTag}>Why it works</Text>
          <Text style={styles.secTitle}>Built for the{'\n'}indecisive human.</Text>
        </View>
        <View style={styles.featGrid}>
          {FEATURES.map((f, i) => (
            <View key={i} style={[styles.featCard, { backgroundColor: f.bgColor, borderColor: f.borderColor }]}>
              <View style={styles.featIconBg}>
                <Text style={styles.featIcon}>{f.icon}</Text>
              </View>
              <Text style={styles.featTitle}>{f.title}</Text>
              <Text style={styles.featDesc}>{f.desc}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* ── CLOSING CTA ── */}
      <View style={[styles.section, styles.closing]}>
        <Text style={styles.closingTitle}>
          Your next meal{'\n'}<Text style={styles.gradText}>is one tap away.</Text>
        </Text>
        <TouchableOpacity style={[styles.ctaBtn, styles.ctaBtnLg]} onPress={onStart} activeOpacity={0.85}>
          <Text style={styles.ctaBtnText}>Decide my meal →</Text>
        </TouchableOpacity>
      </View>

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#07070F' },
  scrollContent: { paddingBottom: 60 },

  // Hero
  hero: {
    paddingHorizontal: 24,
    paddingTop: 64,
    paddingBottom: 56,
    alignItems: 'center',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginBottom: 32,
  },
  badgeDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#E8703A' },
  badgeText: { fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: '500' },
  badgeTag: {
    backgroundColor: 'rgba(232,112,58,0.2)',
    borderRadius: 4,
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  badgeTagText: { fontSize: 9, fontWeight: '800', color: '#E8703A', letterSpacing: 0.8 },

  headline: {
    fontSize: 48,
    fontWeight: '900',
    letterSpacing: -2,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 56,
    marginBottom: 20,
  },
  gradText: { color: '#E8703A' },

  tagline: {
    fontSize: 15,
    color: 'rgba(255,255,255,0.42)',
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 32,
  },
  taglineStrong: { color: 'rgba(255,255,255,0.78)', fontWeight: '600' },
  accent: { color: '#E8703A', fontWeight: '700' },

  ctaBtn: {
    backgroundColor: '#E8703A',
    borderRadius: 999,
    paddingVertical: 17,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginBottom: 14,
    width: 275,
    shadowColor: '#E8703A',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 20,
    elevation: 6,
  },
  ctaBtnLg: { width: 280, paddingVertical: 18 },
  ctaBtnText: { color: '#fff', fontSize: 16, fontWeight: '700', letterSpacing: -0.3 },

  ghostBtn: {
    fontSize: 13,
    fontWeight: '500',
    color: 'rgba(255,255,255,0.32)',
    paddingVertical: 6,
    paddingHorizontal: 10,
  },

  // Sections
  section: { paddingHorizontal: 20, paddingVertical: 48 },

  secHead: { marginBottom: 28, alignItems: 'center' },
  secTag: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 14,
  },
  secTitle: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1.5,
    color: '#fff',
    lineHeight: 46,
    textAlign: 'center',
  },

  // Problem card
  problemCard: {
    padding: 28,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    borderRadius: 22,
  },
  problemLabel: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 2,
    textTransform: 'uppercase',
    color: 'rgba(255,255,255,0.45)',
    marginBottom: 20,
  },
  problemQ: {
    fontSize: 24,
    fontWeight: '800',
    fontStyle: 'italic',
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 34,
    marginBottom: 24,
    letterSpacing: -0.8,
  },
  kw: { color: '#60A5FA', fontWeight: '900' },
  problemRule: {
    height: 1,
    backgroundColor: 'rgba(232,112,58,0.35)',
    marginBottom: 22,
  },
  problemA: {
    fontSize: 24,
    fontWeight: '800',
    color: 'rgba(255,255,255,0.88)',
    letterSpacing: -0.6,
    lineHeight: 32,
    marginBottom: 24,
  },
  problemStatBlock: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
    backgroundColor: 'rgba(232,112,58,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(232,112,58,0.2)',
    borderRadius: 16,
    padding: 18,
  },
  problemStatNum: {
    fontSize: 34,
    fontWeight: '900',
    color: '#E8703A',
    letterSpacing: -1.5,
    lineHeight: 40,
    flexShrink: 0,
  },
  problemStatRight: { flex: 1, gap: 6 },
  problemStatText: { fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 20 },
  problemStatSrc: { fontSize: 11, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' },

  // Steps
  steps: { gap: 16 },
  step: {
    flexDirection: 'row',
    gap: 20,
    padding: 24,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.09)',
    borderRadius: 24,
  },
  stepNum: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5, paddingTop: 5, width: 28, flexShrink: 0 },
  stepBody: { flex: 1 },
  stepEmoji: { fontSize: 38, lineHeight: 46, marginBottom: 14 },
  stepTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 8, lineHeight: 26 },
  stepDesc: { fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 22 },

  // Savings
  savCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 24,
    padding: 28,
    gap: 18,
  },
  savRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 },
  savRowBorder: { paddingBottom: 18, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.07)' },
  savLeft: { flex: 1, gap: 4 },
  savLabel: { fontSize: 16, fontWeight: '700', color: 'rgba(255,255,255,0.85)', letterSpacing: -0.3 },
  savSrc: { fontSize: 11, color: 'rgba(255,255,255,0.28)', fontStyle: 'italic' },
  savVal: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5, flexShrink: 0 },
  savDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },
  savTotal: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  savTotalLabel: { fontSize: 18, fontWeight: '800', color: 'rgba(255,255,255,0.9)', letterSpacing: -0.4 },
  savTotalRight: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  savTotalVal: { fontSize: 34, fontWeight: '900', color: '#22C55E', letterSpacing: -1.5 },
  savBadge: {
    backgroundColor: 'rgba(34,197,94,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(34,197,94,0.25)',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 10,
  },
  savBadgeText: { fontSize: 11, fontWeight: '700', color: 'rgba(34,197,94,0.7)' },

  // Features
  featGrid: { gap: 14 },
  featCard: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
  },
  featIconBg: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  featIcon: { fontSize: 28, lineHeight: 34 },
  featTitle: { fontSize: 20, fontWeight: '800', color: '#fff', letterSpacing: -0.5, marginBottom: 8, lineHeight: 26 },
  featDesc: { fontSize: 14, color: 'rgba(255,255,255,0.55)', lineHeight: 22 },

  // Closing
  closing: { alignItems: 'center', paddingBottom: 80 },
  closingTitle: {
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1.8,
    color: '#fff',
    textAlign: 'center',
    lineHeight: 42,
    marginBottom: 28,
  },
});
