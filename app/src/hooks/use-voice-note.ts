import {
  RecordingPresets,
  requestRecordingPermissionsAsync,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from 'expo-audio';
import * as Haptics from 'expo-haptics';
import { useCallback, useRef, useState } from 'react';

export interface VoiceNote {
  uri: string;
  durationMs: number;
}

/** Shortest note we keep; anything shorter was probably an accidental tap. */
const MIN_MS = 1000;
/** Longest note, so uploads stay small. */
export const MAX_VOICE_MS = 90_000;

/** Metering on, so the recorder can show the person's voice level live. */
const RECORDING_OPTIONS = { ...RecordingPresets.HIGH_QUALITY, isMeteringEnabled: true };

/** Metering is in dBFS (about -60 quiet room to 0 loud); map it to 0..1. */
function toLevel(metering: number | undefined): number {
  if (metering === undefined || !Number.isFinite(metering)) return 0;
  return Math.min(1, Math.max(0, (metering + 55) / 50));
}

/**
 * Hold-to-speak recording. start() on press-in, finish() on release.
 * Notes shorter than a second are discarded with a gentle hint.
 */
export function useVoiceNote() {
  const recorder = useAudioRecorder(RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 120);
  const [note, setNote] = useState<VoiceNote | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const starting = useRef(false);
  const releasedEarly = useRef(false);

  const finish = useCallback(async () => {
    if (starting.current) {
      // Let go before the microphone was ready.
      releasedEarly.current = true;
      return;
    }
    if (!recorder.isRecording) return;
    const duration = recorder.currentTime * 1000;
    await recorder.stop();
    await setAudioModeAsync({ allowsRecording: false, playsInSilentMode: true }).catch(() => undefined);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (!recorder.uri || duration < MIN_MS) {
      setHint('Hold the button a little longer while you speak.');
      return;
    }
    setNote({ uri: recorder.uri, durationMs: Math.min(duration, MAX_VOICE_MS) });
  }, [recorder]);

  const start = useCallback(async () => {
    if (starting.current || recorder.isRecording) return;
    starting.current = true;
    releasedEarly.current = false;
    setHint(null);
    try {
      const permission = await requestRecordingPermissionsAsync();
      if (!permission.granted) {
        setDenied(true);
        return;
      }
      setDenied(false);
      await setAudioModeAsync({ allowsRecording: true, playsInSilentMode: true });
      await recorder.prepareToRecordAsync();
      recorder.record();
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } catch {
      setHint('We couldn’t start the microphone. Please try again.');
    } finally {
      starting.current = false;
    }
    if (releasedEarly.current) await finish();
  }, [recorder, finish]);

  const remove = useCallback(() => {
    setNote(null);
    setHint(null);
  }, []);

  return {
    note,
    hint,
    denied,
    isRecording: recorderState.isRecording,
    elapsedMs: recorderState.durationMillis,
    /** Live input level 0..1 while recording. */
    level: recorderState.isRecording ? toLevel(recorderState.metering) : 0,
    start,
    finish,
    remove,
  };
}
