import { ActivityIndicator, Linking, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Brand, Radius, Type } from '@/constants/theme';
import type { LocationFix } from '@/hooks/use-location-fix';

/**
 * Where the problem is: one compact row. Fills itself from GPS; "Change"
 * opens the map so the person can pick another spot.
 */
export function LocationLine({
  fix,
  onRetry,
  onChoose,
  onUseMyLocation,
}: {
  fix: LocationFix;
  onRetry: () => void;
  onChoose: () => void;
  onUseMyLocation: () => void;
}) {
  if (fix.state === 'denied' || fix.state === 'failed') {
    const settings = fix.state === 'denied' && !fix.canAskAgain;
    return (
      <View style={[styles.row, styles.problem]} accessibilityRole="alert">
        <Icon name="map-pin" size={20} color={Brand.danger} />
        <Text style={styles.text} numberOfLines={2}>
          {fix.state === 'denied' ? 'Location is off.' : 'Couldn’t find you.'}
        </Text>
        <TextAction label="Map" onPress={onChoose} />
        <TextAction label={settings ? 'Settings' : 'Retry'} onPress={settings ? () => void Linking.openSettings() : onRetry} />
      </View>
    );
  }

  const finding = fix.state === 'finding';
  const chosen = fix.state === 'found' && fix.source === 'chosen';
  const place = fix.state === 'found' ? (fix.address ?? 'Pinned location') : 'Finding your location…';

  return (
    <View style={styles.wrap}>
      <View style={styles.row} accessibilityLiveRegion="polite">
        {finding ? (
          <ActivityIndicator size="small" color={Brand.blue} />
        ) : (
          <Icon name={chosen ? 'map-pin' : 'navigation'} size={18} color={chosen ? Brand.orange : Brand.blue} />
        )}
        <Text style={[styles.text, finding && styles.muted]} numberOfLines={1}>
          {place}
        </Text>
        <TextAction label={finding ? 'Use map' : 'Change'} onPress={onChoose} />
      </View>
      {chosen ? (
        <Pressable accessibilityRole="button" onPress={onUseMyLocation} hitSlop={8} style={styles.mine}>
          <Text style={styles.mineLabel}>Use my current location instead</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

function TextAction({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="button" onPress={onPress} hitSlop={10} style={({ pressed }) => [styles.action, pressed && { opacity: 0.5 }]}>
      <Text style={styles.actionLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    minHeight: 52,
    paddingLeft: 14,
    paddingRight: 6,
    borderRadius: Radius.md,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  problem: { backgroundColor: Brand.dangerTint, borderColor: 'transparent' },
  text: { ...Type.body, fontSize: 17, color: Brand.ink, flex: 1 },
  muted: { color: Brand.ink2 },
  action: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 10 },
  actionLabel: { fontSize: 16, fontWeight: '700', color: Brand.blue },
  mine: { alignSelf: 'flex-start', paddingLeft: 4 },
  mineLabel: { fontSize: 15, fontWeight: '600', color: Brand.blue },
});
