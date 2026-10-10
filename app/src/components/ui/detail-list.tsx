import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Brand, Radius } from '@/constants/theme';
import { URGENCY_WORDS } from '@/lib/plain-words';
import type { Priority } from '@/lib/types';

/** A quiet card of label / value lines, separated by hairlines. */
export function DetailList({ children }: { children: ReactNode }) {
  return <View style={styles.list}>{children}</View>;
}

/** One line in a DetailList. Pass `value` for plain text or children for anything else. */
export function Detail({ label, value, last, children }: { label: string; value?: string; last?: boolean; children?: ReactNode }) {
  return (
    <View style={[styles.row, !last && styles.line]}>
      <Text style={styles.label}>{label}</Text>
      {children ?? (
        <Text style={styles.value} numberOfLines={2}>
          {value}
        </Text>
      )}
    </View>
  );
}

/** "[Urgent] within a few hours": the urgency word as a small tinted pill plus the time. */
export function UrgencyValue({ priority }: { priority: Priority }) {
  const urgency = URGENCY_WORDS[priority];
  return (
    <View style={styles.urgency}>
      <View style={[styles.pill, { backgroundColor: urgency.tint }]}>
        <Text style={[styles.pillText, { color: urgency.color }]}>{urgency.label}</Text>
      </View>
      <Text style={styles.value}>{urgency.when}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 50, paddingVertical: 10 },
  line: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: Brand.lineStrong },
  label: { fontSize: 15, color: Brand.ink3 },
  value: { fontSize: 16, fontWeight: '600', color: Brand.ink, textAlign: 'right', flexShrink: 1 },
  urgency: { flexDirection: 'row', alignItems: 'center', gap: 8, flexShrink: 1 },
  pill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 999 },
  pillText: { fontSize: 13, fontWeight: '700' },
});
