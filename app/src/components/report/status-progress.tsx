import { StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Brand } from '@/constants/theme';
import { PROGRESS_STEPS, progressIndex, STATUS_WORDS } from '@/lib/plain-words';
import type { ComplaintStatus } from '@/lib/types';

const STEPS = PROGRESS_STEPS.length;
/** Each step owns an equal column; the rail runs from the first dot's centre to the last one's. */
const EDGE = 100 / (STEPS * 2);
const SPAN = 100 - EDGE * 2;

/** Big status sentence plus four labelled dots: Sent · Seen · Being fixed · Fixed. */
export function StatusProgress({ status }: { status: ComplaintStatus }) {
  const words = STATUS_WORDS[status];
  const reached = progressIndex(status);
  const closed = status === 'rejected';

  return (
    <View style={styles.wrap}>
      <View style={styles.sentence}>
        <View style={styles.kickerRow}>
          <View style={[styles.statusDot, { backgroundColor: words.color }]} />
          <Text style={styles.kicker}>Status</Text>
        </View>
        <Text style={styles.text} accessibilityRole="header">
          {words.sentence}
        </Text>
      </View>

      {closed ? null : (
        <View
          style={styles.track}
          accessibilityLabel={`Step ${reached + 1} of ${STEPS}: ${PROGRESS_STEPS[reached]}`}
        >
          {/* One rail behind the dots; the opaque dots sit on top, so the line never shows inside a circle. */}
          <View style={[styles.rail, { left: `${EDGE}%`, right: `${EDGE}%` }]} />
          <View style={[styles.rail, styles.railDone, { left: `${EDGE}%`, width: `${(SPAN * reached) / (STEPS - 1)}%` }]} />

          {PROGRESS_STEPS.map((label, i) => {
            const done = i <= reached;
            const now = i === reached;
            return (
              <View key={label} style={styles.step}>
                <View style={styles.halo}>
                  <View style={[styles.dot, done ? styles.dotDone : styles.dotTodo]}>
                    {done ? <Icon name="check" size={12} color="#ffffff" /> : null}
                  </View>
                </View>
                <Text style={[styles.label, done && styles.labelDone, now && styles.labelNow]} numberOfLines={1}>
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      )}
    </View>
  );
}

const DOT = 22;
const HALO = 22;
const RAIL = 3;

const styles = StyleSheet.create({
  wrap: { gap: 18 },
  sentence: { gap: 4 },
  kickerRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  kicker: { fontSize: 14, fontWeight: '600', color: Brand.ink3 },
  text: { fontSize: 20, lineHeight: 26, fontWeight: '700', color: Brand.ink },
  track: { flexDirection: 'row' },
  rail: {
    position: 'absolute',
    top: HALO / 2 - RAIL / 2,
    height: RAIL,
    borderRadius: RAIL / 2,
    backgroundColor: Brand.surfaceInset,
  },
  railDone: { backgroundColor: Brand.success },
  step: { flex: 1, alignItems: 'center', gap: 6 },
  halo: { width: HALO, height: HALO, alignItems: 'center', justifyContent: 'center' },
  dot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dotDone: { backgroundColor: Brand.success },
  dotTodo: { backgroundColor: Brand.surface, borderWidth: 2, borderColor: Brand.lineStrong },
  label: { fontSize: 13, fontWeight: '600', color: Brand.ink3, textAlign: 'center' },
  labelDone: { color: Brand.ink2 },
  labelNow: { color: Brand.ink, fontWeight: '700' },
});
