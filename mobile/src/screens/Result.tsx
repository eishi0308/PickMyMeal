import { useState } from 'react';
import {
  View, Text, TouchableOpacity, Image, ScrollView, StyleSheet, ActivityIndicator,
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
  onOrder: (category: string) => void;
}

function PrimaryCard({
  item,
  badge,
  fallbackUrl,
  onOrder,
}: {
  item: RecommendResponse;
  badge: string;
  fallbackUrl: string;
  onOrder: (category: string) => void;
}) {
  return (
    <View style={styles.primaryCard}>
      <View style={styles.primaryBadge}>
        <Text style={styles.primaryBadgeText}>{badge}</Text>
      </View>
      <Text style={styles.primaryTitle}>{item.category}</Text>
      <Image
        style={styles.primaryImage}
        source={{ uri: item.image_url ?? fallbackUrl }}
      />
      <Text style={styles.primaryReason}>{item.reason}</Text>

      <View style={styles.actionLayer}>
        <TouchableOpacity style={styles.takeBtn} onPress={() => onOrder(item.category)}>
          <Text style={styles.takeBtnText}>✅ Take this</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.tuneBtn} disabled>
          <Text style={styles.tuneBtnText}>🔁 Tune it</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function Result({
  best, backups, preferences, excludes,
  onResult, onBack, onReset, onHistory, onLogoClick, onOrder,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [expandedBackup, setExpandedBackup] = useState<number | null>(null);
  const fallbackUrl = `https://loremflickr.com/600/400/food,${encodeURIComponent(best.category)}`;

  const handleTryAgain = async () => {
    setLoading(true);
    setExpandedBackup(null);
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

        {/* Primary card */}
        <PrimaryCard
          item={best}
          badge="⭐ Best Pick"
          fallbackUrl={fallbackUrl}
          onOrder={onOrder}
        />

        {/* Compact backups */}
        <View style={styles.backupsSection}>
          <Text style={styles.backupsLabel}>Or try:</Text>

          {backups.map((item, i) => {
            const fb = `https://loremflickr.com/600/400/food,${encodeURIComponent(item.category)}`;
            const isExpanded = expandedBackup === i;

            return (
              <View key={i}>
                {isExpanded ? (
                  <View style={styles.expandedCardWrap}>
                    <PrimaryCard
                      item={item}
                      badge={`#${i + 2} Pick`}
                      fallbackUrl={fb}
                      onOrder={onOrder}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.backupRow}
                    onPress={() => setExpandedBackup(i)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.backupBullet}>•</Text>
                    <Text style={styles.backupName}>{item.category}</Text>
                    <Text style={styles.backupReason} numberOfLines={1}>{item.reason}</Text>
                    <Text style={styles.backupArrow}>›</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>

        {/* Bottom actions */}
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

  // Primary card
  primaryCard: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 22,
    marginBottom: 16,
    borderWidth: 1.5,
    borderColor: '#F0E8E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 4,
  },
  primaryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(232,112,58,0.1)',
    borderRadius: 9999,
    paddingVertical: 5,
    paddingHorizontal: 12,
    marginBottom: 14,
  },
  primaryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E8703A',
    letterSpacing: 0.3,
  },
  primaryTitle: {
    fontSize: 40,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -1.2,
    textTransform: 'capitalize',
    marginBottom: 16,
    lineHeight: 46,
  },
  primaryImage: {
    width: '100%',
    height: 220,
    borderRadius: 16,
    marginBottom: 16,
    backgroundColor: '#F3F4F6',
  },
  primaryReason: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 24,
    marginBottom: 20,
  },

  // Action layer
  actionLayer: {
    flexDirection: 'row',
    gap: 10,
  },
  takeBtn: {
    flex: 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
  },
  takeBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  tuneBtn: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    opacity: 0.5,
  },
  tuneBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },

  // Compact backups
  backupsSection: { marginBottom: 24 },
  backupsLabel: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    color: '#9CA3AF',
    marginBottom: 10,
  },
  backupRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 13,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderWidth: 1.5,
    borderColor: '#F0F0F0',
    borderRadius: 14,
    marginBottom: 8,
  },
  backupBullet: {
    color: '#E8703A',
    fontSize: 16,
    fontWeight: '700',
  },
  backupName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A1A1A',
    textTransform: 'capitalize',
  },
  backupReason: {
    flex: 1,
    fontSize: 13,
    color: '#9CA3AF',
  },
  backupArrow: {
    fontSize: 18,
    color: '#D1D5DB',
  },
  expandedCardWrap: {
    marginBottom: 8,
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
