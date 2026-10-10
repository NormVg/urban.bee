import { router } from 'expo-router';
import { Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ReportRow } from '@/components/report/report-row';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Brand, Radius, Type } from '@/constants/theme';
import { useMyReports } from '@/hooks/use-my-reports';
import { problemMessage } from '@/lib/plain-words';

/** Reports the city has fixed or closed, kept apart from the live ones on Home. */
export default function CompletedScreen() {
  const { completed, error, refreshing, refresh, retry } = useMyReports(true);

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Brand.blue} />}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back to home"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={({ pressed }) => [styles.back, pressed && { backgroundColor: Brand.surfaceInset }]}
      >
        <Icon name="chevron-left" size={26} color={Brand.ink} />
        <Text style={styles.backLabel}>Home</Text>
      </Pressable>

      <View style={styles.head}>
        <Text style={styles.title} accessibilityRole="header">
          Completed
        </Text>
        <Text style={styles.sub}>Problems that were fixed, or that the team couldn’t act on.</Text>
      </View>

      {error && !completed ? (
        <Notice message={problemMessage(error)} actionLabel="Try again" onAction={retry} />
      ) : !completed ? (
        <>
          <Skeleton height={108} radius={Radius.lg} />
          <Skeleton height={108} radius={Radius.lg} />
        </>
      ) : completed.length === 0 ? (
        <Text style={styles.sub}>Nothing here yet.</Text>
      ) : (
        completed.map((report, i) => (
          <Animated.View key={report.id} entering={FadeInDown.delay(i * 45).duration(320)}>
            <ReportRow
              report={report}
              onPress={() => router.push({ pathname: '/reports/[id]', params: { id: report.id } })}
            />
          </Animated.View>
        ))
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
  head: { gap: 6 },
  title: { ...Type.title, color: Brand.ink },
  sub: { ...Type.body, color: Brand.ink2 },
});
