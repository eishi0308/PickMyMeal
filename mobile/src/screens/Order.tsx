import { View, Text, TouchableOpacity, StyleSheet, Linking, Image } from 'react-native';

interface Props {
  category: string;
  imageUrl: string | null;
  onBack: () => void;
  onReset: () => void;
}

export default function Order({ category, imageUrl, onBack, onReset }: Props) {
  const uberUrl = `https://www.ubereats.com/search?q=${encodeURIComponent(category)}`;
  const fallback = `https://loremflickr.com/600/400/food,${encodeURIComponent(category)}`;

  return (
    <View style={styles.screen}>
      {/* Hero image with overlay */}
      <View style={styles.hero}>
        <Image
          style={styles.heroImg}
          source={{ uri: imageUrl ?? fallback }}
        />
        <View style={styles.heroOverlay} />
        <View style={styles.heroContent}>
          <Text style={styles.eyebrow}>Great choice</Text>
          <Text style={styles.title}>{category}</Text>
        </View>
      </View>

      {/* Actions */}
      <View style={styles.body}>
        <Text style={styles.subtitle}>Ready to order?</Text>

        <TouchableOpacity
          style={styles.uberBtn}
          onPress={() => Linking.openURL(uberUrl)}
          activeOpacity={0.85}
        >
          <Text style={styles.uberBtnText}>Order on Uber Eats</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={onBack} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>← Back to picks</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={onReset} activeOpacity={0.7}>
          <Text style={styles.resetBtnText}>× Start over</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFBF5',
  },

  // Hero
  hero: {
    width: '100%',
    height: 280,
    position: 'relative',
  },
  heroImg: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  heroOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  heroContent: {
    position: 'absolute',
    bottom: 24,
    left: 24,
    right: 24,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: 'rgba(255,255,255,0.75)',
    marginBottom: 6,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    letterSpacing: -1,
    color: '#fff',
    textTransform: 'capitalize',
    lineHeight: 40,
  },

  // Body
  body: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 40,
    gap: 12,
  },
  subtitle: {
    fontSize: 17,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 4,
  },
  uberBtn: {
    backgroundColor: '#06C167',
    borderRadius: 999,
    paddingVertical: 17,
    alignItems: 'center',
    shadowColor: '#06C167',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  uberBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  backBtn: {
    paddingVertical: 15,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  backBtnText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#6B7280',
  },
  resetBtn: {
    paddingVertical: 13,
    borderRadius: 999,
    borderWidth: 1.5,
    borderColor: '#FECDD3',
    alignItems: 'center',
  },
  resetBtnText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F43F5E',
  },
});
