import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface Props {
  onLogoClick: () => void;
  onBack?: () => void;
  onHistory?: () => void;
}

export default function NavBar({ onLogoClick, onBack, onHistory }: Props) {
  return (
    <View style={styles.navbar}>
      <View style={styles.left}>
        {onBack && (
          <TouchableOpacity onPress={onBack}>
            <Text style={styles.backBtn}>← Back</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity onPress={onLogoClick}>
        <Text style={styles.logo}>DecideMyMeal</Text>
      </TouchableOpacity>

      <View style={styles.right}>
        {onHistory && (
          <TouchableOpacity onPress={onHistory}>
            <Text style={styles.historyLink}>History</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 32,
    minHeight: 36,
  },
  left: { flex: 1 },
  right: { flex: 1, alignItems: 'flex-end' },
  logo: {
    fontSize: 15,
    fontWeight: '800',
    color: '#1A1A1A',
    letterSpacing: -0.5,
  },
  backBtn: {
    fontSize: 14,
    color: '#6B7280',
  },
  historyLink: {
    fontSize: 14,
    color: '#6B7280',
    textDecorationLine: 'underline',
  },
});
