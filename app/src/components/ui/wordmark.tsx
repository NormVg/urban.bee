import { Image } from 'expo-image';
import { StyleSheet, Text, View } from 'react-native';

import { Brand } from '@/constants/theme';

/** Bee mark plus "urban.bee", as on the dashboard. */
export function Wordmark({ size = 'md' }: { size?: 'md' | 'lg' }) {
  const large = size === 'lg';
  return (
    <View style={styles.row} accessibilityRole="header" accessibilityLabel="urban.bee">
      <Image source={require('@/assets/images/logo.png')} style={large ? styles.markLg : styles.mark} contentFit="contain" />
      <Text style={[styles.word, large && styles.wordLg]}>
        urban<Text style={styles.dot}>.</Text>
        <Text style={styles.bee}>bee</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  mark: { width: 30, height: 30 },
  markLg: { width: 44, height: 44 },
  word: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, color: Brand.ink },
  wordLg: { fontSize: 30 },
  dot: { color: Brand.orange },
  bee: { color: Brand.blue },
});
