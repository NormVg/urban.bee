import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { Icon } from '@/components/ui/icon';
import { Brand } from '@/constants/theme';

export const CHECKING_STEPS = ['Sending your photo', 'Understanding the problem', 'Finding the right team'] as const;
/** How long each line shows before the next one ticks in. */
export const CHECKING_STEP_MS = 900;

/** Calm full-screen progress while the report is sent and sorted. */
export function CheckingView({ finished }: { finished: boolean }) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (step >= CHECKING_STEPS.length) return;
    // The last line waits for the server before it ticks.
    if (step === CHECKING_STEPS.length - 1 && !finished) return;
    const timer = setTimeout(() => setStep((s) => s + 1), CHECKING_STEP_MS);
    return () => clearTimeout(timer);
  }, [step, finished]);

  return (
    <View style={styles.wrap} accessibilityLiveRegion="polite">
      <Animated.View entering={FadeInDown.duration(320)} style={styles.badge}>
        <Icon name="send" size={22} color={Brand.onBlue} />
      </Animated.View>
      <Text style={styles.title}>Sending your report</Text>
      <View style={styles.list}>
        {CHECKING_STEPS.map((label, i) => {
          if (i > step) return null;
          const done = i < step;
          return (
            <Animated.View key={label} entering={FadeInDown.duration(280)} style={styles.row}>
              <View style={[styles.dot, done && styles.dotDone]}>
                {done ? (
                  <Icon name="check" size={13} color="#ffffff" />
                ) : (
                  <ActivityIndicator size="small" color={Brand.blue} />
                )}
              </View>
              <Text style={[styles.label, done && styles.labelDone]}>{label}</Text>
            </Animated.View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: 24, paddingHorizontal: 8 },
  badge: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blue,
  },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: Brand.ink },
  list: { gap: 18 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  dot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blueTint,
  },
  dotDone: { backgroundColor: Brand.success },
  label: { fontSize: 17, lineHeight: 23, color: Brand.ink2 },
  labelDone: { color: Brand.ink, fontWeight: '600' },
});
