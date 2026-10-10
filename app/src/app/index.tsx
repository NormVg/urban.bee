import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Alert, Pressable, RefreshControl, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { ReportRow } from '@/components/report/report-row';
import { BigButton } from '@/components/ui/big-button';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Skeleton } from '@/components/ui/skeleton';
import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { useMyReports } from '@/hooks/use-my-reports';
import { authClient } from '@/lib/auth-client';
import { problemMessage } from '@/lib/plain-words';

export default function HomeScreen() {
  const { data: session, isPending } = authClient.useSession();
  const { live, completed, error, refreshing, refresh, retry } = useMyReports(Boolean(session));

  /* Signed-out visitors go straight to sign in. */
  useEffect(() => {
    if (!isPending && !session) router.replace('/login');
  }, [isPending, session]);

  if (!session) {
    return (
      <Screen>
        <Skeleton height={64} width="70%" />
        <Skeleton height={112} radius={Radius.xl} />
        <Skeleton height={108} />
      </Screen>
    );
  }

  const firstName = session.user.name.split(' ')[0] || session.user.name;
  const openReport = (id: string) => router.push({ pathname: '/reports/[id]', params: { id } });

  function confirmSignOut() {
    Alert.alert('Sign out?', 'You can sign back in any time with your email.', [
      { text: 'Stay signed in', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => void authClient.signOut() },
    ]);
  }

  return (
    <Screen refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={Brand.blue} />}>
      <Animated.View entering={FadeInDown.duration(360)} style={styles.header}>
        <View style={styles.greeting}>
          <Text style={styles.hello} accessibilityRole="header" numberOfLines={1}>
            Hi {firstName}
          </Text>
          <Text style={styles.prompt}>Seen something that needs fixing?</Text>
        </View>
        <Animated.View entering={FadeInDown.delay(60).duration(420)}>
          <Image
            source={require('@/assets/images/logo.png')}
            style={styles.logo}
            contentFit="contain"
            accessibilityLabel="urban.bee"
          />
        </Animated.View>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(100).duration(380)}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Report a problem"
          accessibilityHint="Opens the camera to photograph the problem"
          onPress={() => router.push('/report')}
        >
          {({ pressed }) => (
            <View style={[styles.cta, pressed && styles.ctaPressed]}>
              <View style={styles.ctaIcon}>
                <Icon name="camera" size={22} color={Brand.orange} />
              </View>
              <View style={styles.ctaText}>
                <Text style={styles.ctaTitle} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  Report a problem
                </Text>
                <Text style={styles.ctaSub} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85}>
                  Takes less than a minute
                </Text>
              </View>
              <Icon name="chevron-right" size={26} color="#ffffff" />
            </View>
          )}
        </Pressable>
      </Animated.View>

      <Animated.View entering={FadeInDown.delay(180).duration(380)} style={styles.section}>
        <View style={styles.sectionHead}>
          <Text style={styles.sectionTitle}>In progress</Text>
          {live && live.length > 0 ? <Text style={styles.count}>{live.length}</Text> : null}
        </View>

        {error && !live ? (
          <Notice message={problemMessage(error)} actionLabel="Try again" onAction={retry} />
        ) : !live ? (
          <>
            <Skeleton height={108} radius={Radius.lg} />
            <Skeleton height={108} radius={Radius.lg} />
          </>
        ) : live.length === 0 ? (
          <View style={styles.empty}>
            <View style={styles.emptyIcon}>
              <Icon name={completed?.length ? 'check' : 'inbox'} size={22} color={Brand.ink3} />
            </View>
            <Text style={styles.emptyText}>
              {completed?.length
                ? 'Nothing open right now. Everything you reported has been dealt with.'
                : 'Nothing reported yet. When you report a problem, you can follow it here.'}
            </Text>
          </View>
        ) : (
          live.map((report, i) => (
            <Animated.View key={report.id} entering={FadeInDown.delay(220 + i * 45).duration(320)}>
              <ReportRow report={report} onPress={() => openReport(report.id)} />
            </Animated.View>
          ))
        )}
      </Animated.View>

      {completed && completed.length > 0 ? (
        <Animated.View entering={FadeInDown.delay(260).duration(380)}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={`Completed reports, ${completed.length}`}
            onPress={() => router.push('/completed')}
            style={({ pressed }) => [styles.doneLink, pressed && styles.doneLinkPressed]}
          >
            <Icon name="check-circle" size={22} color={Brand.success} />
            <View style={styles.doneText}>
              <Text style={styles.doneTitle}>Completed</Text>
              <Text style={styles.doneSub}>
                {completed.length === 1 ? '1 report fixed or closed' : `${completed.length} reports fixed or closed`}
              </Text>
            </View>
            <Icon name="chevron-right" size={24} color={Brand.ink3} />
          </Pressable>
        </Animated.View>
      ) : null}

      <View style={styles.footer}>
        <Text style={styles.signedIn}>Signed in as {session.user.email}</Text>
        <BigButton label="Sign out" icon="log-out" variant="link" onPress={confirmSignOut} />
      </View>
    </Screen>
  );
}

const LOGO = 52;

const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
  greeting: { flex: 1, gap: 2 },
  hello: { ...Type.title, fontSize: 28, lineHeight: 34, color: Brand.ink },
  prompt: { fontSize: 17, lineHeight: 23, color: Brand.ink2 },
  logo: { width: LOGO, height: LOGO },
  cta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    minHeight: 80,
    paddingLeft: 14,
    paddingRight: 12,
    borderRadius: Radius.lg,
    backgroundColor: Brand.orange,
    ...Shadow.card,
  },
  ctaPressed: { backgroundColor: Brand.orangeStrong },
  ctaIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  ctaText: { flex: 1, gap: 1 },
  ctaTitle: { fontSize: 20, lineHeight: 25, fontWeight: '800', color: '#ffffff' },
  ctaSub: { fontSize: 15, lineHeight: 20, color: 'rgba(255, 255, 255, 0.88)' },
  section: { gap: 10, marginTop: 4 },
  sectionHead: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 19, lineHeight: 25, fontWeight: '700', color: Brand.ink },
  count: { fontSize: 16, fontWeight: '600', color: Brand.ink3 },
  empty: {
    alignItems: 'center',
    gap: 8,
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: Brand.lineStrong,
  },
  emptyIcon: { alignItems: 'center', justifyContent: 'center' },
  emptyText: { fontSize: 16, lineHeight: 22, color: Brand.ink2, textAlign: 'center' },
  doneLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 56,
    paddingHorizontal: 14,
    borderRadius: Radius.md,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  doneLinkPressed: { backgroundColor: Brand.surfaceInset },
  doneText: { flex: 1 },
  doneTitle: { fontSize: 17, fontWeight: '700', color: Brand.ink },
  doneSub: { fontSize: 14, color: Brand.ink2 },
  footer: { marginTop: 'auto', paddingTop: 24, alignItems: 'center', gap: 2 },
  signedIn: { fontSize: 14, color: Brand.ink3 },
});
