import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';

import { Detail, DetailList, UrgencyValue } from '@/components/ui/detail-list';
import { Icon } from '@/components/ui/icon';
import { Brand } from '@/constants/theme';
import { formatDay, outcomeWords } from '@/lib/plain-words';
import type { SubmitResponse } from '@/lib/types';

/** The result of sending: one plain sentence for what happened, who has it, and how soon. */
export function ThankYouView({ result }: { result: SubmitResponse }) {
  const { complaint, outcome } = result;
  const mine = complaint.reports.find((r) => r.isMine);
  const words = outcomeWords(outcome, {
    departmentLabel: complaint.departmentLabel,
    priority: complaint.priority,
    reportedOn: outcome === 'already_reported' && mine ? formatDay(mine.createdAt) : undefined,
  });
  const repeat = outcome === 'already_reported';

  return (
    <View style={styles.wrap}>
      <Animated.View entering={ZoomIn.duration(360)} style={[styles.badge, repeat && styles.badgeInfo]}>
        <Icon name={repeat ? 'bookmark' : 'check'} size={26} color="#ffffff" />
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(320)} style={styles.copy}>
        <Text style={styles.title} accessibilityRole="header">
          {words.title}
        </Text>
        <Text style={styles.body}>{words.body}</Text>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(240).duration(320)}>
        <DetailList>
          <Detail label="Team" value={complaint.departmentLabel} />
          <Detail label="Expected">
            <UrgencyValue priority={complaint.priority} />
          </Detail>
          {complaint.reportCount > 1 ? (
            <Detail label="Reported by" value={`${complaint.reportCount} people, including you`} />
          ) : null}
          <Detail label="Reference" value={complaint.reference} last />
        </DetailList>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, justifyContent: 'center', gap: 22 },
  badge: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.success,
  },
  badgeInfo: { backgroundColor: Brand.blue },
  copy: { gap: 10 },
  title: { fontSize: 28, lineHeight: 34, fontWeight: '800', color: Brand.ink },
  body: { fontSize: 17, lineHeight: 25, color: Brand.ink2 },
});
