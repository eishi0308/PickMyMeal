import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import NavBar from '../components/NavBar';
import { CookAlternativeResponse } from '../types';

interface Props {
  category: string;
  imageUrl: string | null;
  easyData: CookAlternativeResponse | null;
  easyLoading: boolean;
  onChooseEasy: () => void;
  onChooseExact: () => void;
  onBack: () => void;
  onLogoClick: () => void;
}

export default function CookGateway({
  category, imageUrl, easyData, easyLoading,
  onChooseEasy, onChooseExact, onBack, onLogoClick,
}: Props) {
  const easySubtitle = easyLoading
    ? 'Quick & simple, any kitchen'
    : easyData
      ? `~${easyData.time_minutes} min · ${easyData.effort} · Save ${easyData.saving_estimate}`
      : 'Quick & simple, any kitchen';

  return (
    <View style={styles.screen}>
      <NavBar onLogoClick={onLogoClick} onBack={onBack} />

      <View style={styles.header}>
        {imageUrl && (
          <Image style={styles.headerImg} source={{ uri: imageUrl }} />
        )}
        <Text style={styles.title}>
          How do you want to{'\n'}cook <Text style={styles.titleEm}>{category}</Text>?
        </Text>
        <Text style={styles.subtitle}>Pick your approach — you can always switch.</Text>
      </View>

      <View style={styles.cards}>
        {/* Card A — Authentic real recipe */}
        <TouchableOpacity style={[styles.card, styles.cardReal]} onPress={onChooseExact} activeOpacity={0.85}>
          <View style={styles.cardTop}>
            <Text style={styles.cardIcon}>👨‍🍳</Text>
            <View style={[styles.badge, styles.badgeReal]}>
              <Text style={styles.badgeText}>Authentic</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>Make the real thing</Text>
          <Text style={styles.cardDesc}>Full recipe — real ingredients, proper technique</Text>
          <Text style={styles.cardCta}>Get the recipe →</Text>
        </TouchableOpacity>

        {/* Card B — Easy adapted version */}
        <TouchableOpacity style={[styles.card, styles.cardEasy]} onPress={onChooseEasy} activeOpacity={0.85}>
          <View style={styles.cardTop}>
            <Text style={styles.cardIcon}>⚡</Text>
            <View style={[styles.badge, styles.badgeEasy]}>
              <Text style={[styles.badgeText, styles.badgeEasyText]}>Quick</Text>
            </View>
          </View>
          <Text style={styles.cardTitle}>Easy home version</Text>
          <Text style={styles.cardDesc}>{easySubtitle}</Text>
          <Text style={styles.cardCta}>
            {easyLoading ? 'Loading…' : 'Show easy version →'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFBF5', paddingHorizontal: 20, paddingTop: 28 },

  header: { alignItems: 'center', marginBottom: 28 },
  headerImg: { width: '100%', height: 160, borderRadius: 20, marginBottom: 20, backgroundColor: '#F3F4F6' },
  title: { fontSize: 30, fontWeight: '800', color: '#1A1A1A', textAlign: 'center', letterSpacing: -0.8, lineHeight: 38 },
  titleEm: { color: '#E8703A' },
  subtitle: { fontSize: 14, color: '#9CA3AF', marginTop: 8, textAlign: 'center' },

  cards: { gap: 14 },

  card: {
    borderRadius: 24,
    padding: 22,
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  cardReal: {
    backgroundColor: '#fff',
    borderColor: 'rgba(0,0,0,0.08)',
  },
  cardEasy: {
    backgroundColor: 'rgba(232,112,58,0.04)',
    borderColor: 'rgba(232,112,58,0.25)',
  },

  cardTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  cardIcon: { fontSize: 28 },

  badge: { borderRadius: 999, paddingVertical: 4, paddingHorizontal: 12 },
  badgeReal: { backgroundColor: '#F3F4F6' },
  badgeEasy: { backgroundColor: 'rgba(232,112,58,0.12)' },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#6B7280', letterSpacing: 0.5, textTransform: 'uppercase' },
  badgeEasyText: { color: '#E8703A' },

  cardTitle: { fontSize: 20, fontWeight: '800', color: '#1A1A1A', marginBottom: 6, letterSpacing: -0.4 },
  cardDesc: { fontSize: 14, color: '#6B7280', lineHeight: 21, marginBottom: 16 },
  cardCta: { fontSize: 15, fontWeight: '700', color: '#E8703A' },
});
