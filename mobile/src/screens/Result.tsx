import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, Linking, ActivityIndicator,
} from 'react-native';
import { recommend, generateImage } from '../api/foodApi';
import { addToHistory } from '../api/history';
import { PreferenceMap, RecommendResponse } from '../types';
import NavBar from '../components/NavBar';

interface ResultData {
  response: RecommendResponse;
  backups: RecommendResponse[];
  preferences: PreferenceMap;
}

interface Props {
  best: RecommendResponse;
  backups: RecommendResponse[];
  preferences: PreferenceMap;
  excludes: string[];
  onResult: (data: ResultData) => void;
  onBack: () => void;
  onReset: () => void;
  onHistory: () => void;
  onLogoClick: () => void;
}

export default function Result({
  best, backups, preferences, excludes,
  onResult, onBack, onReset, onHistory, onLogoClick,
}: Props) {
  const [loading, setLoading] = useState(false);
  const fallbackUrl = `https://loremflickr.com/600/400/food,${encodeURIComponent(best.category)}`;
  const uberEatsUrl = `https://www.ubereats.com/search?q=${encodeURIComponent(best.category)}`;

  const handleTryAgain = async () => {
    setLoading(true);
    try {
      const r1 = await recommend({ preferences, exclude: excludes });
      const r2 = await recommend({ preferences, exclude: [...excludes, r1.category] });
      const r3 = await recommend({ preferences, exclude: [...excludes, r1.category, r2.category] });
      const [img0, img1, img2] = await Promise.all([
        generateImage(r1.category, r1.category),
        generateImage(r2.category, r2.category),
        generateImage(r3.category, r3.category),
      ]);
      r1.image_url = img0.image_url;
      r2.image_url = img1.image_url;
      r3.image_url = img2.image_url;
      await addToHistory({ preferences, category: r1.category, reason: r1.reason });
      onResult({ response: r1, backups: [r2, r3], preferences });
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <NavBar onLogoClick={onLogoClick} onBack={onBack} onHistory={onHistory} />

        {/* Best Pick */}
        <View style={styles.bestCard}>
          <View style={styles.bestBadge}>
            <Text style={styles.bestBadgeText}>⭐  Best Pick</Text>
          </View>

          <Text style={styles.bestCategory}>{best.category}</Text>

          <Image
            style={styles.bestImage}
            source={{ uri: best.image_url ?? fallbackUrl }}
          />

          <Text style={styles.bestReason}>{best.reason}</Text>

          <TouchableOpacity
            style={styles.uberEatsBtn}
            onPress={() => Linking.openURL(uberEatsUrl)}
          >
            <Text style={styles.uberEatsBtnText}>Order on Uber Eats →</Text>
          </TouchableOpacity>
        </View>

        {/* Backups */}
        {backups.map((item, index) => {
          const fb = `https://loremflickr.com/600/400/food,${encodeURIComponent(item.category)}`;
          return (
            <View key={index} style={styles.bestCard}>
              <View style={styles.bestBadge}>
                <Text style={styles.bestBadgeText}>#{index + 2} Pick</Text>
              </View>
              <Text style={styles.bestCategory}>{item.category}</Text>
              <Image
                style={styles.bestImage}
                source={{ uri: item.image_url ?? fb }}
              />
              <Text style={styles.bestReason}>{item.reason}</Text>
              <TouchableOpacity
                style={styles.uberEatsBtn}
                onPress={() => Linking.openURL(`https://www.ubereats.com/search?q=${encodeURIComponent(item.category)}`)}
              >
                <Text style={styles.uberEatsBtnText}>Order on Uber Eats →</Text>
              </TouchableOpacity>
            </View>
          );
        })}

        {/* Actions */}
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.tryBtn, loading && styles.btnDisabled]}
            onPress={handleTryAgain}
            disabled={loading}
          >
            {loading ? (
              <View style={styles.row}>
                <ActivityIndicator color="#fff" size="small" />
                <Text style={styles.tryBtnText}>  Finding new picks…</Text>
              </View>
            ) : (
              <Text style={styles.tryBtnText}>Try different picks →</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={onReset}>
            <Text style={styles.ghostBtnText}>Start over</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFBF5' },
  scrollContent: { paddingHorizontal: 20, paddingTop: 28, paddingBottom: 48 },

  // Best Pick card
  bestCard: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 20,
    marginBottom: 20,
    borderWidth: 1.5,
    borderColor: '#F0E8E0',
    shadowColor: '#E8703A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  bestBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(232,112,58,0.1)',
    borderRadius: 9999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  bestBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E8703A',
    letterSpacing: 0.3,
  },
  bestCategory: {
    fontSize: 36,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -1,
    textTransform: 'capitalize',
    marginBottom: 16,
    lineHeight: 42,
  },
  bestImage: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
  },
  imagePlaceholder: {
    width: '100%',
    height: 180,
    borderRadius: 14,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bestReason: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },
  uberEatsBtn: {
    backgroundColor: '#06C167',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  uberEatsBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },

  // Backups
  backupsSection: { marginBottom: 20 },
  backupsLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  backupCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    flexDirection: 'row',
    marginBottom: 12,
  },
  backupImage: {
    width: 110,
    height: 110,
    borderTopLeftRadius: 14,
    borderBottomLeftRadius: 14,
  },
  backupBody: {
    flex: 1,
    padding: 14,
    justifyContent: 'center',
  },
  backupNumber: {
    width: 22,
    height: 22,
    borderRadius: 9999,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  backupNumberText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
  },
  backupCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1A1A1A',
    textTransform: 'capitalize',
    marginBottom: 4,
    lineHeight: 22,
  },
  backupReason: {
    fontSize: 12,
    color: '#9CA3AF',
    lineHeight: 18,
    marginBottom: 10,
  },
  backupUber: {
    fontSize: 12,
    fontWeight: '600',
    color: '#06C167',
  },

  // Actions
  actions: { gap: 12 },
  tryBtn: {
    backgroundColor: '#E8703A',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.35 },
  tryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center' },
  ghostBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  ghostBtnText: { color: '#6B7280', fontSize: 15, fontWeight: '500' },
});
