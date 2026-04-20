import { useState, useEffect } from 'react';
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
  onOrder: (category: string, imageUrl: string | null) => void;
  onTune: () => void;
}

function ImageSlot({ src, alt }: { src: string | null; alt: string }) {
  const fallback = `https://loremflickr.com/600/400/food,${encodeURIComponent(alt)}`;
  if (!src) {
    return <View style={styles.imageShimmer} />;
  }
  return (
    <Image
      style={styles.primaryImage}
      source={{ uri: src }}
      onError={(e) => { (e.nativeEvent as any).target.setNativeProps({ src: [{ uri: fallback }] }); }}
    />
  );
}

function FoodCard({
  item,
  imageUrl,
  badge,
  onOrder,
  onCollapse,
}: {
  item: RecommendResponse;
  imageUrl: string | null;
  badge: string;
  onOrder: (category: string, imageUrl: string | null) => void;
  onCollapse?: () => void;
}) {
  return (
    <View style={styles.primaryCard}>
      <TouchableOpacity
        style={styles.cardHeader}
        onPress={onCollapse}
        disabled={!onCollapse}
      >
        <View style={styles.primaryBadge}>
          <Text style={styles.primaryBadgeText}>{badge}</Text>
        </View>
        {onCollapse && (
          <Text style={styles.collapseText}>↑ Close</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.primaryTitle}>{item.category}</Text>
      <ImageSlot src={imageUrl} alt={item.category} />
      <Text style={styles.primaryReason}>{item.reason}</Text>

      <TouchableOpacity style={styles.takeBtn} onPress={() => onOrder(item.category, imageUrl)}>
        <View style={styles.takeBtnInner}>
          <View style={styles.takeBtnIcon}>
            <Text style={styles.takeBtnIconText}>✓</Text>
          </View>
          <Text style={styles.takeBtnText}>Yes, this one</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

export default function Result({
  best, backups, preferences, excludes,
  onResult, onBack, onReset, onHistory, onLogoClick, onOrder, onTune,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [expandedBackups, setExpandedBackups] = useState<Set<number>>(new Set());
  const [bestImage, setBestImage] = useState<string | null>(null);
  const [backupImages, setBackupImages] = useState<(string | null)[]>([null, null]);

  useEffect(() => {
    setBestImage(null);
    setBackupImages([null, null]);
    generateImage(best.category, best.category).then(img => {
      setBestImage(img.image_url ?? null);
    });
    backups.forEach((backup, i) => {
      generateImage(backup.category, backup.category).then(img => {
        setBackupImages(prev => {
          const next = [...prev];
          next[i] = img.image_url ?? null;
          return next;
        });
      });
    });
  }, [best.category]);

  const handleTryAgain = async () => {
    setLoading(true);
    setExpandedBackups(new Set());
    try {
      const currentShown = [best.category, ...backups.map(b => b.category)];
      const newExcludes = [...new Set([...excludes, ...currentShown])];
      const r1 = await recommend({ preferences, exclude: newExcludes });
      const r2 = await recommend({ preferences, exclude: [...newExcludes, r1.category] });
      const r3 = await recommend({ preferences, exclude: [...newExcludes, r1.category, r2.category] });
      await addToHistory({ preferences, category: r1.category, reason: r1.reason });
      onResult({ response: r1, backups: [r2, r3], preferences });
    } finally {
      setLoading(false);
    }
  };

  const toggleBackup = (i: number) =>
    setExpandedBackups(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <NavBar onLogoClick={onLogoClick} onBack={onBack} onHistory={onHistory} />

        {/* Primary card */}
        <FoodCard
          item={best}
          imageUrl={bestImage}
          badge="⭐ Best Pick"
          onOrder={onOrder}
        />

        {/* Compact backups — accordion */}
        <View style={styles.backupsSection}>
          <Text style={styles.backupsLabel}>Or try:</Text>

          {backups.map((item, i) => {
            const isExpanded = expandedBackups.has(i);

            return (
              <View key={i}>
                {isExpanded ? (
                  <View style={styles.expandedWrap}>
                    <FoodCard
                      item={item}
                      imageUrl={backupImages[i]}
                      badge={`#${i + 2} Pick`}
                      onOrder={onOrder}
                      onCollapse={() => toggleBackup(i)}
                    />
                  </View>
                ) : (
                  <TouchableOpacity
                    style={styles.backupRow}
                    onPress={() => toggleBackup(i)}
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

        {/* Tune it — once, below all options */}
        <TouchableOpacity style={styles.tuneBtn} onPress={onTune} activeOpacity={0.8}>
          <View style={styles.tuneBtnIcon}>
            <Text style={styles.tuneBtnIconText}>⚙</Text>
          </View>
          <View style={styles.tuneBtnContent}>
            <Text style={styles.tuneBtnTitle}>Fine-tune my taste</Text>
            <Text style={styles.tuneBtnSub}>Adjust preferences for a better match</Text>
          </View>
          <Text style={styles.tuneBtnArrow}>›</Text>
        </TouchableOpacity>

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
              <Text style={styles.tryBtnText}>↻  Show me different picks</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.ghostBtn} onPress={onReset}>
            <Text style={styles.ghostBtnText}>× Start over</Text>
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
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  primaryBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(232,112,58,0.1)',
    borderRadius: 9999,
    paddingVertical: 5,
    paddingHorizontal: 12,
  },
  primaryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#E8703A',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  collapseText: {
    fontSize: 12,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  primaryTitle: {
    fontSize: 38,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -1.2,
    textTransform: 'capitalize',
    marginBottom: 14,
    lineHeight: 44,
  },
  primaryImage: {
    width: '100%',
    height: 224,
    borderRadius: 18,
    marginBottom: 18,
    backgroundColor: '#F3F4F6',
  },
  imageShimmer: {
    width: '100%',
    height: 224,
    borderRadius: 18,
    marginBottom: 18,
    backgroundColor: '#E5E7EB',
  },
  primaryReason: {
    fontSize: 15,
    color: '#6B7280',
    lineHeight: 26,
    marginBottom: 28,
  },
  takeBtnInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  takeBtnIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  takeBtnIconText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '700',
    lineHeight: 16,
  },
  takeBtn: {
    backgroundColor: '#E8703A',
    borderRadius: 14,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#E8703A',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 5,
    marginTop: 4,
  },
  takeBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },

  // Backups
  backupsSection: { marginBottom: 12 },
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
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.06)',
    borderRadius: 14,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  backupBullet: { color: '#E8703A', fontSize: 16, fontWeight: '700' },
  backupName: { fontSize: 15, fontWeight: '700', color: '#1A1A1A', textTransform: 'capitalize' },
  backupReason: { flex: 1, fontSize: 13, color: '#9CA3AF' },
  backupArrow: { fontSize: 18, color: '#D1D5DB' },
  expandedWrap: { marginBottom: 8 },

  // Tune it
  tuneBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: 18,
    padding: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F0EEFF',
    borderWidth: 1.5,
    borderColor: 'rgba(99,75,230,0.15)',
    marginBottom: 20,
  },
  tuneBtnIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#7C5CFC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  tuneBtnIconText: { fontSize: 18, color: '#fff' },
  tuneBtnContent: { flex: 1, gap: 2 },
  tuneBtnTitle: { fontSize: 15, fontWeight: '700', color: '#3D2DB5' },
  tuneBtnSub: { fontSize: 12, color: '#7C6FCD', marginTop: 2 },
  tuneBtnArrow: { fontSize: 20, color: '#7C5CFC', fontWeight: '300' },

  // Actions
  actions: { gap: 12 },
  tryBtn: {
    backgroundColor: 'transparent',
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8703A',
  },
  btnDisabled: { opacity: 0.35 },
  tryBtnText: { color: '#E8703A', fontSize: 16, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center' },
  ghostBtn: {
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: '#FECDD3',
  },
  ghostBtnText: { color: '#F43F5E', fontSize: 14, fontWeight: '500' },
});
