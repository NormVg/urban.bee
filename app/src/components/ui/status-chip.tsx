import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { STATUS_WORDS } from '@/lib/plain-words';
import type { ComplaintStatus } from '@/lib/types';

/** Status in words with its colour, e.g. "Being fixed". */
export function StatusChip({ status }: { status: ComplaintStatus }) {
  const words = STATUS_WORDS[status];
  return (
    <View style={[styles.chip, { backgroundColor: words.tint }]} accessibilityLabel={`Status: ${words.chip}`}>
      <Icon name={words.icon} size={13} color={words.color} />
      <Text style={[styles.label, { color: words.color }]}>{words.chip}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 3,
    borderRadius: 999,
  },
  label: { fontSize: 14, fontWeight: '700' },
});
