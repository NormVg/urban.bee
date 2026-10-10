import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Brand, Radius } from '@/constants/theme';

const BARS = 40;

function clock(ms: number): string {
  const total = Math.max(0, Math.round(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/**
 * A stable, speech-like waveform for a recording. It is decorative (we don't
 * decode the audio), so it is seeded from the file name to look the same
 * every time the same note is shown.
 */
function waveform(seed: string): number[] {
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return Array.from({ length: BARS }, (_, i) => {
    h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0;
    const noise = (h % 1000) / 1000;
    const envelope = 0.45 + 0.55 * Math.sin((Math.PI * (i + 0.5)) / BARS);
    return Math.max(0.18, Math.min(1, envelope * (0.35 + noise * 0.75)));
  });
}

/** Play / pause a voice note over its waveform. Optional Remove for the person's own unsent note. */
export function VoicePlayer({
  uri,
  durationMs,
  label = 'Voice note',
  onRemove,
  bare = false,
}: {
  uri: string;
  durationMs: number | null;
  label?: string;
  onRemove?: () => void;
  /** No card around it, for use inside another card */
  bare?: boolean;
}) {
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);
  const playing = status.playing;
  const length = durationMs ?? (status.duration ? status.duration * 1000 : 0);
  const bars = useMemo(() => waveform(uri), [uri]);
  const progress = length > 0 ? Math.min(1, (status.currentTime * 1000) / length) : 0;
  const finished = status.didJustFinish || progress >= 0.995;
  const shown = playing || (progress > 0 && !finished) ? progress : 0;

  function toggle() {
    if (playing) {
      player.pause();
      return;
    }
    if (finished) void player.seekTo(0);
    player.play();
  }

  return (
    <View style={[styles.box, bare && styles.bare]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Pause voice note' : 'Play voice note'}
        onPress={toggle}
        style={({ pressed }) => [styles.play, !playing && styles.playNudge, pressed && styles.playPressed]}
      >
        <Icon name={playing ? 'pause' : 'play'} size={18} color="#ffffff" />
      </Pressable>

      <View style={styles.body}>
        <View style={styles.wave} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
          {bars.map((height, i) => (
            <View
              key={i}
              style={[styles.bar, { height: `${height * 100}%` }, i / BARS < shown && styles.barPlayed]}
            />
          ))}
        </View>
        <View style={styles.meta}>
          <Text style={styles.label} numberOfLines={1}>
            {label}
          </Text>
          <Text style={styles.time}>
            {playing || shown > 0 ? `${clock(status.currentTime * 1000)} / ${clock(length)}` : clock(length)}
          </Text>
        </View>
      </View>

      {onRemove ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Remove voice note"
          onPress={onRemove}
          hitSlop={6}
          style={({ pressed }) => [styles.remove, pressed && styles.removePressed]}
        >
          <Icon name="trash-2" size={18} color={Brand.danger} />
        </Pressable>
      ) : null}
    </View>
  );
}

const PLAY = 44;

const styles = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 10,
    paddingLeft: 10,
    paddingRight: 4,
    borderRadius: Radius.md,
    backgroundColor: Brand.surface,
    borderWidth: 1,
    borderColor: Brand.line,
  },
  bare: { padding: 0, paddingVertical: 0, paddingLeft: 0, paddingRight: 0, borderWidth: 0, backgroundColor: 'transparent' },
  play: {
    width: PLAY,
    height: PLAY,
    borderRadius: PLAY / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.blue,
  },
  /* The play triangle looks centred only when nudged right a little. */
  playNudge: { paddingLeft: 2 },
  playPressed: { opacity: 0.85 },
  body: { flex: 1, gap: 4 },
  wave: { flexDirection: 'row', alignItems: 'center', gap: 2, height: 20 },
  bar: { flex: 1, borderRadius: 1, backgroundColor: Brand.lineStrong },
  barPlayed: { backgroundColor: Brand.blue },
  meta: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  label: { fontSize: 14, fontWeight: '600', color: Brand.ink2, flexShrink: 1 },
  time: { fontSize: 14, color: Brand.ink3, fontVariant: ['tabular-nums'] },
  remove: { minWidth: 44, minHeight: 44, alignItems: 'center', justifyContent: 'center', borderRadius: 22 },
  removePressed: { backgroundColor: Brand.dangerTint },
});
