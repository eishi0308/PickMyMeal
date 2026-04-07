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
  preferences: PreferenceMap;
}

interface Props {
  category: string;
  reason: string;
  imageUrl: string | null;
  preferences: PreferenceMap;
  excludes: string[];
  onResult: (data: ResultData) => void;
  onBack: () => void;
  onReset: () => void;
  onHistory: () => void;
  onLogoClick: () => void;
}

export default function Result({
  category, reason, imageUrl, preferences, excludes,
  onResult, onBack, onReset, onHistory, onLogoClick,
}: Props) {
  const [moreLoading, setMoreLoading] = useState(false);
  const fallbackUrl = `https://loremflickr.com/600/400/food,${encodeURIComponent(category)}`;
  const uberEatsUrl = `https://www.ubereats.com/search?q=${encodeURIComponent(category)}`;

  const handleSurpriseMe = async () => {
    setMoreLoading(true);
    try {
      const response = await recommend({ preferences, exclude: excludes });
      const imageRes = await generateImage(response.category, response.category);
      response.image_url = imageRes.image_url;
      await addToHistory({ preferences, category: response.category, reason: response.reason });
      onResult({ response, preferences });
    } finally {
      setMoreLoading(false);
    }
  };

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <NavBar onLogoClick={onLogoClick} onBack={onBack} onHistory={onHistory} />

        <View style={styles.body}>
          <Text style={styles.eyebrow}>Your food today</Text>
          <Text style={styles.categoryText}>{category}</Text>

          <Image
            style={styles.image}
            source={{ uri: imageUrl ?? fallbackUrl }}
            defaultSource={{ uri: fallbackUrl }}
          />

          <Text style={styles.reason}>{reason}</Text>

          <View style={styles.actions}>
            <TouchableOpacity
              style={styles.uberEatsBtn}
              onPress={() => Linking.openURL(uberEatsUrl)}
            >
              <Text style={styles.uberEatsBtnText}>Open on Uber Eats →</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.decideBtn, moreLoading && styles.decideBtnDisabled]}
              onPress={handleSurpriseMe}
              disabled={moreLoading}
            >
              {moreLoading ? (
                <View style={styles.loadingRow}>
                  <ActivityIndicator color="#fff" size="small" />
                  <Text style={styles.decideBtnText}>  Finding something different…</Text>
                </View>
              ) : (
                <Text style={styles.decideBtnText}>Try a different one →</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity style={styles.ghostBtn} onPress={onReset}>
              <Text style={styles.ghostBtnText}>Start over</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#FFFBF5' },
  scrollContent: { paddingHorizontal: 24, paddingTop: 28, paddingBottom: 48 },
  body: { alignItems: 'center' },
  eyebrow: {
    fontSize: 11, fontWeight: '700', textTransform: 'uppercase',
    letterSpacing: 1.2, color: '#E8703A', marginBottom: 16,
  },
  categoryText: {
    fontSize: 48, fontWeight: '800', letterSpacing: -1.5, color: '#1A1A1A',
    marginBottom: 20, textTransform: 'capitalize', textAlign: 'center', lineHeight: 56,
  },
  image: {
    width: 300, height: 200, borderRadius: 16, marginBottom: 24,
  },
  reason: {
    fontSize: 16, color: '#6B7280', maxWidth: 300, lineHeight: 26,
    marginBottom: 48, textAlign: 'center',
  },
  actions: { width: '100%', maxWidth: 300, gap: 12 },
  uberEatsBtn: {
    backgroundColor: '#06C167', borderRadius: 12,
    paddingVertical: 15, alignItems: 'center',
  },
  uberEatsBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  decideBtn: {
    backgroundColor: '#E8703A', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  decideBtnDisabled: { opacity: 0.35 },
  decideBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  loadingRow: { flexDirection: 'row', alignItems: 'center' },
  ghostBtn: {
    borderRadius: 12, paddingVertical: 14, alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', backgroundColor: 'transparent',
  },
  ghostBtnText: { color: '#6B7280', fontSize: 15, fontWeight: '500' },
});
