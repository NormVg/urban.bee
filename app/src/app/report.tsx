import * as Haptics from 'expo-haptics';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import Animated, { FadeIn, FadeInDown } from 'react-native-reanimated';

import { CHECKING_STEP_MS, CHECKING_STEPS, CheckingView } from '@/components/report/checking-view';
import { HoldToSpeak } from '@/components/report/hold-to-speak';
import { LocationLine } from '@/components/report/location-line';
import { PhotoPrompt } from '@/components/report/photo-prompt';
import { PhotoStrip } from '@/components/report/photo-strip';
import { ThankYouView } from '@/components/report/thank-you-view';
import { BigButton } from '@/components/ui/big-button';
import { Icon } from '@/components/ui/icon';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Brand, Radius } from '@/constants/theme';
import { useLocationFix } from '@/hooks/use-location-fix';
import { usePhotos } from '@/hooks/use-photos';
import { useVoiceNote } from '@/hooks/use-voice-note';
import { sendReport } from '@/lib/api';
import { awaitPickedPlace } from '@/lib/place-picker';
import { problemMessage } from '@/lib/plain-words';
import { reportsChanged } from '@/lib/report-events';
import type { SubmitResponse } from '@/lib/types';

type Phase = 'compose' | 'sending' | 'done';

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * One screen for the whole report: photo first (the camera opens straight
 * away), location fills itself, voice and text are optional, then Send.
 */
export default function ReportScreen() {
  const { photos, add, remove, busy, failed, hasCamera, canAddMore } = usePhotos();
  const { fix, retry: retryLocation, locateMe, choose } = useLocationFix();
  const voice = useVoiceNote();
  const [note, setNote] = useState('');
  const [noteOpen, setNoteOpen] = useState(false);
  const [phase, setPhase] = useState<Phase>('compose');
  const [checked, setChecked] = useState(false);
  const [result, setResult] = useState<SubmitResponse | null>(null);
  const [sendError, setSendError] = useState<string | null>(null);
  const openedCamera = useRef(false);

  /*
   * The camera opens as soon as the screen has settled: the photo is the report.
   * Opening it during the modal's slide-in made iOS drop the picker silently,
   * which left the button spinning forever.
   */
  useEffect(() => {
    if (openedCamera.current || !hasCamera) return;
    // Wait for the slide-in (about 350 ms) to finish before presenting the picker.
    const timer = setTimeout(() => {
      openedCamera.current = true;
      void add('camera');
    }, 600);
    return () => clearTimeout(timer);
  }, [add, hasCamera]);

  const hasPhoto = photos.length > 0;
  const located = fix.state === 'found';
  const ready = hasPhoto && located && !voice.isRecording;
  const sendHint = !hasPhoto
    ? 'Add a photo first'
    : fix.state === 'finding'
      ? 'Waiting for your location…'
      : !located
        ? 'We need your location to send'
        : undefined;

  async function send() {
    if (!ready || fix.state !== 'found') return;
    setSendError(null);
    setPhase('sending');
    try {
      const [response] = await Promise.all([
        sendReport({
          photos,
          latitude: fix.latitude,
          longitude: fix.longitude,
          accuracy: fix.accuracy,
          address: fix.address,
          description: note,
          voice: voice.note,
        }),
        wait(CHECKING_STEP_MS * (CHECKING_STEPS.length - 1)),
      ]);
      setChecked(true);
      reportsChanged();
      await wait(CHECKING_STEP_MS + 250);
      setResult(response);
      setPhase('done');
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      setPhase('compose');
      setChecked(false);
      setSendError(
        (error as { status?: number }).status === 0
          ? 'That didn’t send. Your report is safe here. Check your internet and try again.'
          : `That didn’t send. Your report is safe here. ${problemMessage(error)}`,
      );
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  }

  function chooseOnMap() {
    awaitPickedPlace(choose);
    const near = fix.state === 'found' ? { lat: String(fix.latitude), lng: String(fix.longitude) } : {};
    router.push({ pathname: '/pick-location', params: near });
  }

  function close() {
    const started = hasPhoto || voice.note || note.trim();
    if (!started) {
      router.back();
      return;
    }
    Alert.alert('Leave without sending?', 'Your photo and notes for this report will be lost.', [
      { text: 'Keep reporting', style: 'cancel' },
      { text: 'Leave', style: 'destructive', onPress: () => router.back() },
    ]);
  }

  if (phase === 'sending') {
    return (
      <Screen scroll={false}>
        <CheckingView finished={checked} />
      </Screen>
    );
  }

  if (phase === 'done' && result) {
    return (
      <Screen
        footer={
          <>
            <BigButton label="Done" onPress={() => router.back()} />
            <BigButton
              label="See my report"
              variant="link"
              onPress={() => router.replace({ pathname: '/reports/[id]', params: { id: result.complaint.id } })}
            />
          </>
        }
      >
        <ThankYouView result={result} />
      </Screen>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen
        footer={
          <BigButton
            label="Send report"
            icon="send"
            onPress={send}
            disabled={!ready}
            hint={sendHint}
          />
        }
      >
        <View style={styles.top}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cancel this report"
            onPress={close}
            style={({ pressed }) => [styles.close, pressed && { backgroundColor: Brand.surfaceInset }]}
          >
            <Icon name="x" size={24} color={Brand.ink} />
            <Text style={styles.closeLabel}>Cancel</Text>
          </Pressable>
        </View>

        <Text style={styles.title} accessibilityRole="header">
          Report a problem
        </Text>

        {failed && !hasPhoto ? (
          <Notice
            message={
              hasCamera
                ? 'We couldn’t open the camera. You can choose a photo from your phone instead.'
                : 'This device has no camera. Choose a photo from your phone instead.'
            }
            tone="info"
            icon="camera"
          />
        ) : null}

        {sendError ? <Notice message={sendError} actionLabel="Try again" onAction={send} /> : null}

        {/* 1. Photo */}
        {hasPhoto ? (
          <Animated.View entering={FadeIn.duration(240)}>
            <PhotoStrip
              photos={photos}
              onAdd={() => void add(hasCamera ? 'camera' : 'library')}
              onRemove={remove}
              canAddMore={canAddMore}
              busy={busy}
            />
          </Animated.View>
        ) : (
          <PhotoPrompt
            onCamera={() => void add('camera')}
            onLibrary={() => void add('library')}
            busy={busy}
          />
        )}

        {/* 2. Where */}
        <View style={styles.block}>
          <Text style={styles.label}>Where</Text>
          <LocationLine
            fix={fix}
            onRetry={retryLocation}
            onChoose={chooseOnMap}
            onUseMyLocation={() => void locateMe()}
          />
        </View>

        {/* 3. Tell us more (optional) */}
        <View style={styles.block}>
          <Text style={styles.label}>Tell us more</Text>
          <HoldToSpeak voice={voice} />
          {noteOpen ? (
            <Animated.View entering={FadeInDown.duration(220)} style={styles.noteWrap}>
              <TextInput
                accessibilityLabel="Your note"
                value={note}
                onChangeText={setNote}
                placeholder="For example: the hole is getting bigger after the rain"
                placeholderTextColor={Brand.ink3}
                multiline
                maxLength={1000}
                autoFocus
                style={styles.note}
              />
            </Animated.View>
          ) : (
            <Pressable
              accessibilityRole="button"
              onPress={() => setNoteOpen(true)}
              style={({ pressed }) => [styles.typeLink, pressed && { backgroundColor: Brand.blueTint }]}
            >
              <Icon name="edit-3" size={16} color={Brand.blue} />
              <Text style={styles.typeLinkText}>Or type a note</Text>
            </Pressable>
          )}
        </View>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.bg },
  top: { flexDirection: 'row' },
  close: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 48,
    paddingHorizontal: 12,
    marginLeft: -12,
    borderRadius: Radius.sm,
  },
  closeLabel: { fontSize: 18, fontWeight: '600', color: Brand.ink },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', color: Brand.ink },
  block: { gap: 10 },
  label: { fontSize: 17, fontWeight: '700', color: Brand.ink },
  noteWrap: { gap: 6 },
  note: {
    minHeight: 120,
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Brand.lineStrong,
    backgroundColor: Brand.surface2,
    fontSize: 18,
    lineHeight: 26,
    color: Brand.ink,
    textAlignVertical: 'top',
  },
  typeLink: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 4,
    borderRadius: Radius.sm,
  },
  typeLinkText: { fontSize: 16, fontWeight: '600', color: Brand.blue },
});
