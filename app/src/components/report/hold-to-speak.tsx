import { useEffect, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  cancelAnimation,
  FadeIn,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

import { VoicePlayer } from '@/components/report/voice-player';
import { Icon } from '@/components/ui/icon';
import { Brand, Radius, Type } from '@/constants/theme';
import { MAX_VOICE_MS, useVoiceNote } from '@/hooks/use-voice-note';

const LEVEL_BARS = 26;
const SILENT: number[] = Array(LEVEL_BARS).fill(0);

function clock(ms: number) {
  const total = Math.floor(ms / 1000);
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** Recent input levels, newest on the right, so the bars scroll like a live waveform. */
function useLevelHistory(level: number, active: boolean) {
  const [history, setHistory] = useState<number[]>(SILENT);
  const [seen, setSeen] = useState({ level, active });
  // Adjust state while rendering when the input changes (no effect needed).
  if (seen.level !== level || seen.active !== active) {
    setSeen({ level, active });
    setHistory((h) => (active ? [...h.slice(1), level] : SILENT));
  }
  return history;
}

/**
 * "Hold to speak": press and hold to record, let go to keep it. While held the
 * card turns blue with a live level meter and a timer. Afterwards the note can
 * be played back or removed.
 */
export function HoldToSpeak({ voice }: { voice: ReturnType<typeof useVoiceNote> }) {
  const { note, hint, denied, isRecording, elapsedMs, level, start, finish, remove } = voice;
  const pulse = useSharedValue(0);
  const history = useLevelHistory(level, isRecording);

  useEffect(() => {
    if (isRecording) {
      pulse.value = 0;
      pulse.value = withRepeat(withTiming(1, { duration: 1200 }), -1, false);
    } else {
      cancelAnimation(pulse);
      pulse.value = 0;
    }
  }, [isRecording, pulse]);

  // Stop by itself at the time limit.
  useEffect(() => {
    if (isRecording && elapsedMs >= MAX_VOICE_MS) void finish();
  }, [isRecording, elapsedMs, finish]);

  const ring = useAnimatedStyle(() => ({
    opacity: 0.5 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.55 }],
  }));

  if (note) {
    return (
      <Animated.View entering={FadeIn.duration(220)}>
        <VoicePlayer uri={note.uri} durationMs={note.durationMs} onRemove={remove} />
      </Animated.View>
    );
  }

  return (
    <View style={styles.wrap}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Hold to speak"
        accessibilityHint="Press and hold, say what's wrong, then let go to add a voice note"
        onPressIn={() => void start()}
        onPressOut={() => void finish()}
        style={[styles.card, isRecording && styles.cardLive]}
      >
        <View style={styles.micWrap}>
          <Animated.View style={[styles.ring, ring]} />
          <View style={[styles.mic, isRecording && styles.micLive]}>
            <Icon name="mic" size={20} color="#ffffff" />
          </View>
        </View>

        {isRecording ? (
          <View style={styles.live}>
            <View style={styles.levels} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
              {history.map((v, i) => (
                <View key={i} style={[styles.level, { height: `${18 + v * 82}%`, opacity: 0.45 + (i / LEVEL_BARS) * 0.55 }]} />
              ))}
            </View>
            <View style={styles.liveMeta}>
              <View style={styles.recDot} />
              <Text style={styles.liveText}>Listening… let go to finish</Text>
              <Text style={styles.timer}>{clock(elapsedMs)}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.idle}>
            <Text style={styles.title}>Hold to speak</Text>
            <Text style={styles.sub}>Optional, any language</Text>
          </View>
        )}
      </Pressable>

      {denied ? (
        <Pressable accessibilityRole="button" onPress={() => void Linking.openSettings()} style={styles.help}>
          <Text style={styles.helpText}>
            To add a voice note, allow the microphone in your phone’s settings. <Text style={styles.link}>Open settings</Text>
          </Text>
        </Pressable>
      ) : hint ? (
        <Text style={styles.helpText}>{hint}</Text>
      ) : null}
    </View>
  );
}

const MIC = 44;

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    minHeight: 64,
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: Radius.md,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  cardLive: { backgroundColor: Brand.blue, borderColor: Brand.blue },
  micWrap: { width: MIC, height: MIC, alignItems: 'center', justifyContent: 'center' },
  ring: { position: 'absolute', width: MIC, height: MIC, borderRadius: MIC / 2, backgroundColor: Brand.orange },
  mic: {
    width: MIC,
    height: MIC,
    borderRadius: MIC / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blue,
  },
  micLive: { backgroundColor: Brand.orange },
  idle: { flex: 1, gap: 1 },
  title: { ...Type.bodyStrong, fontSize: 17, lineHeight: 22, color: Brand.ink },
  sub: { fontSize: 15, lineHeight: 20, color: Brand.ink2 },
  live: { flex: 1, gap: 6 },
  levels: { flexDirection: 'row', alignItems: 'center', gap: 2.5, height: 22 },
  level: { flex: 1, borderRadius: 2, backgroundColor: Brand.onBlue },
  liveMeta: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: Brand.orange },
  liveText: { fontSize: 15, color: Brand.onBlueMuted, flex: 1 },
  timer: { fontSize: 15, fontWeight: '700', color: Brand.onBlue, fontVariant: ['tabular-nums'] },
  help: { minHeight: 44, justifyContent: 'center' },
  helpText: { ...Type.small, color: Brand.ink2 },
  link: { color: Brand.blue, fontWeight: '700' },
});
