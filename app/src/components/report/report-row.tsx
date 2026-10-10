import { Image } from 'expo-image';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { StatusChip } from '@/components/ui/status-chip';
import { Brand, Radius } from '@/constants/theme';
import { mediaUrl } from '@/lib/api';
import { timeAgo } from '@/lib/plain-words';
import type { ComplaintSummary } from '@/lib/types';

/** One of "Your reports": photo, plain title, where, and status in words. */
export function ReportRow({ report, onPress }: { report: ComplaintSummary; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${report.title}. ${report.address ?? ''}`}
      accessibilityHint="Opens the report to see its progress"
      onPress={onPress}
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
    >
      <Image source={{ uri: mediaUrl(report.coverPhotoUrl) }} style={styles.photo} contentFit="cover" transition={150} />
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={2}>
          {report.title}
        </Text>
        <Text style={styles.meta} numberOfLines={1}>
          {report.address ?? report.departmentLabel} · {timeAgo(report.createdAt)}
        </Text>
        <StatusChip status={report.status} />
      </View>
      <Icon name="chevron-right" size={20} color={Brand.ink3} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: Radius.md,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  pressed: { backgroundColor: Brand.surfaceInset },
  photo: { width: 64, height: 64, borderRadius: Radius.sm, backgroundColor: Brand.surfaceInset },
  body: { flex: 1, gap: 4 },
  title: { fontSize: 17, lineHeight: 22, fontWeight: '700', color: Brand.ink },
  meta: { fontSize: 14, lineHeight: 19, color: Brand.ink2 },
});
