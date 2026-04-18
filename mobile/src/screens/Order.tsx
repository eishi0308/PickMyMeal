import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

interface Props {
  category: string;
  onBack: () => void;
  onReset: () => void;
}

export default function Order({ category, onBack, onReset }: Props) {
  const uberUrl = `https://www.ubereats.com/search?q=${encodeURIComponent(category)}`;

  return (
    <View style={styles.screen}>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>You picked</Text>
        <Text style={styles.title}>{category}</Text>
        <Text style={styles.subtitle}>Ready to order?</Text>

        <TouchableOpacity
          style={styles.uberBtn}
          onPress={() => Linking.openURL(uberUrl)}
        >
          <Text style={styles.uberBtnText}>Order on Uber Eats →</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.backBtn} onPress={onBack}>
          <Text style={styles.backBtnText}>Not now, go back</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.resetBtn} onPress={onReset}>
          <Text style={styles.resetBtnText}>Start over</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFBF5',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  body: {
    width: '100%',
    alignItems: 'center',
  },
  eyebrow: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#6B7280',
    marginBottom: 10,
  },
  title: {
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: -1.5,
    color: '#1A1A1A',
    textTransform: 'capitalize',
    marginBottom: 10,
    lineHeight: 52,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#6B7280',
    marginBottom: 40,
  },
  uberBtn: {
    backgroundColor: '#06C167',
    borderRadius: 14,
    paddingVertical: 18,
    paddingHorizontal: 24,
    width: '100%',
    alignItems: 'center',
    marginBottom: 16,
  },
  uberBtnText: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '700',
  },
  backBtn: {
    paddingVertical: 10,
    marginBottom: 8,
  },
  backBtnText: {
    fontSize: 15,
    color: '#6B7280',
  },
  resetBtn: {
    paddingVertical: 8,
  },
  resetBtnText: {
    fontSize: 13,
    color: '#D1D5DB',
  },
});
