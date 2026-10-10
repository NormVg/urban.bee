import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { StatusProgress } from '@/components/report/status-progress';
import { VoicePlayer } from '@/components/report/voice-player';
import { Card } from '@/components/ui/card';
import { Detail, DetailList, UrgencyValue } from '@/components/ui/detail-list';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Brand, Radius } from '@/constants/theme';
import { getReport, mediaUrl } from '@/lib/api';
import { openInMaps } from '@/lib/maps';
import { formatDay, problemMessage } from '@/lib/plain-words';
import type { ComplaintDetail } from '@/lib/types';

/** Where a report is up to, in plain words. Pull down to refresh. */
export default function ReportStatusScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { width } = useWindowDimensions();
  const [report, setReport] = useState<ComplaintDetail | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [page, setPage] = useState(0);

  const load = useCallback(
    async (pull = false) => {
      if (pull) setRefreshing(true);
      try {
        setReport(await getReport(id));
        setError(null);
      } catch (e) {
        setError(e);
      } finally {
        setRefreshing(false);
      }
    },
    [id],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const back = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Back to your reports"
      onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
      style={({ pressed }) => [styles.back, pressed && { backgroundColor: Brand.surfaceInset }]}
    >
      <Icon name="chevron-left" size={26} color={Brand.ink} />
      <Text style={styles.backLabel}>Your reports</Text>
    </Pressable>
  );

  if (!report) {
    return (
      <Screen>
        {back}
        {error ? (
          <Notice message={problemMessage(error)} actionLabel="Try again" onAction={() => void load()} />
        ) : (
          <>
            <Skeleton height={260} radius={Radius.lg} />
            <Skeleton height={32} width="70%" />
            <Skeleton height={140} radius={Radius.lg} />
          </>
        )}
      </Screen>
    );
  }

  const mine = report.reports.filter((r) => r.isMine);
  const photoWidth = Math.min(width, 560) - 40;
  const others = report.reportCount - mine.length;

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => void load(true)} tintColor={Brand.blue} />}>
      {back}

      <Animated.View entering={FadeInDown.duration(320)} style={styles.photos}>
        <ScrollView
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={(e) => setPage(Math.round(e.nativeEvent.contentOffset.x / photoWidth))}
          style={{ width: photoWidth }}
        >
          {report.photos.map((photo, i) => (
            <Image
              key={photo.id}
              source={{ uri: mediaUrl(photo.url) }}
              style={{ width: photoWidth, height: photoWidth * 0.75 }}
              contentFit="cover"
              transition={150}
              accessibilityLabel={`Photo ${i + 1} of ${report.photos.length}`}
            />
          ))}
        </ScrollView>
        {report.photos.length > 1 ? (
          <View style={styles.pager}>
            {report.photos.map((photo, i) => (
              <View key={photo.id} style={[styles.pagerDot, i === page && styles.pagerDotOn]} />
            ))}
          </View>
        ) : null}
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(60).duration(320)} style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          {report.title}
        </Text>
        {report.address ? (
          <View style={styles.line}>
            <Icon name="map-pin" size={18} color={Brand.ink2} />
            <Text style={styles.lineText}>{report.address}</Text>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Open this place in Maps"
          onPress={() => openInMaps(report.latitude, report.longitude, report.title)}
          style={({ pressed }) => [styles.maps, pressed && styles.mapsPressed]}
        >
          <Icon name="external-link" size={16} color={Brand.blue} />
          <Text style={styles.mapsLabel}>Open in Maps</Text>
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(120).duration(320)}>
        <Card>
          <StatusProgress status={report.status} />
        </Card>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(320)}>
        <DetailList>
          <Detail label="Team" value={report.departmentLabel} />
          <Detail label="Expected">
            <UrgencyValue priority={report.priority} />
          </Detail>
          {others > 0 ? (
            <Detail label="Also reported by" value={others === 1 ? '1 other person' : `${others} other people`} />
          ) : null}
          <Detail
            label="Reference"
            value={`${report.reference} · ${formatDay(mine[0]?.createdAt ?? report.createdAt)}`}
            last
          />
        </DetailList>
      </Animated.View>

      {mine.map((r) =>
        r.audioUrl || r.description ? (
          <Animated.View key={r.id} entering={FadeInDown.delay(240).duration(320)} style={styles.yours}>
            <Text style={styles.kicker}>What you told us</Text>
            {r.audioUrl ? <VoicePlayer uri={mediaUrl(r.audioUrl)} durationMs={r.audioDurationMs} bare /> : null}
            {r.transcript && r.audioUrl ? <Text style={styles.quote}>“{r.transcript}”</Text> : null}
            {r.description && r.description !== r.transcript ? <Text style={styles.quote}>{r.description}</Text> : null}
          </Animated.View>
        ) : null,
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  back: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 2,
    minHeight: 48,
    paddingRight: 12,
    marginLeft: -8,
    borderRadius: Radius.sm,
  },
  backLabel: { fontSize: 18, fontWeight: '600', color: Brand.ink },
  photos: { borderRadius: Radius.lg, overflow: 'hidden', backgroundColor: Brand.surfaceInset },
  pager: {
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: 'rgba(18, 13, 8, 0.5)',
  },
  pagerDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.5)' },
  pagerDotOn: { backgroundColor: '#ffffff' },
  head: { gap: 8 },
  title: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: Brand.ink },
  line: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  lineText: { fontSize: 16, color: Brand.ink2, flex: 1 },
  maps: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, minHeight: 40 },
  mapsPressed: { opacity: 0.5 },
  mapsLabel: { fontSize: 16, fontWeight: '600', color: Brand.blue },
  yours: {
    gap: 10,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  kicker: { fontSize: 14, fontWeight: '600', color: Brand.ink3 },
  quote: { fontSize: 16, lineHeight: 23, color: Brand.ink2 },
});
