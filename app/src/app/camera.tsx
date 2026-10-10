import { CameraView, useCameraPermissions, type FlashMode } from 'expo-camera';
import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import { Image } from 'expo-image';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import { ActivityIndicator, Alert, Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BigButton } from '@/components/ui/big-button';
import { Icon } from '@/components/ui/icon';
import { Brand, Type } from '@/constants/theme';
import { MAX_PHOTOS, preparePhoto, type Photo } from '@/hooks/use-photos';
import { deliverCapturedPhotos } from '@/lib/photo-capture';

/**
 * The app's own camera: take 1 to 4 photos without leaving urban.bee, then
 * "Done" hands them back to the report screen.
 */
export default function CameraScreen() {
  const params = useLocalSearchParams<{ room?: string }>();
  const room = Math.max(1, Math.min(MAX_PHOTOS, Number(params.room) || MAX_PHOTOS));
  const [permission, requestPermission] = useCameraPermissions();
  const camera = useRef<CameraView>(null);
  const [ready, setReady] = useState(false);
  const [shooting, setShooting] = useState(false);
  const [flash, setFlash] = useState<FlashMode>('off');
  const [taken, setTaken] = useState<Photo[]>([]);
  const blink = useSharedValue(0);
  const blinkStyle = useAnimatedStyle(() => ({ opacity: blink.get() }));

  function finish(photos: Photo[]) {
    deliverCapturedPhotos(photos);
    router.back();
  }

  function close() {
    if (!taken.length) return finish([]);
    Alert.alert('Keep these photos?', undefined, [
      { text: 'Throw away', style: 'destructive', onPress: () => finish([]) },
      { text: 'Keep', onPress: () => finish(taken) },
    ]);
  }

  async function shoot() {
    if (!camera.current || !ready || shooting) return;
    setShooting(true);
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    blink.set(withSequence(withTiming(0.85, { duration: 60 }), withTiming(0, { duration: 220 })));
    try {
      const shot = await camera.current.takePictureAsync({ quality: 0.85 });
      const photo = await preparePhoto(shot);
      const next = [...taken, photo];
      setTaken(next);
      if (next.length >= room) finish(next);
    } catch {
      Alert.alert('That photo didn’t work', 'Please try again.');
    } finally {
      setShooting(false);
    }
  }

  if (!Device.isDevice) {
    return (
      <SafeAreaView style={styles.ask}>
        <View style={styles.askBody}>
          <Icon name="camera-off" size={32} color={Brand.ink3} />
          <Text style={styles.askTitle}>No camera on this device</Text>
          <Text style={styles.askText}>The simulator can’t take photos. On a phone this opens the camera.</Text>
        </View>
        <BigButton label="Go back" variant="quiet" onPress={() => finish([])} />
      </SafeAreaView>
    );
  }

  if (!permission) {
    return <View style={styles.black} />;
  }

  if (!permission.granted) {
    const settings = !permission.canAskAgain;
    return (
      <SafeAreaView style={styles.ask}>
        <View style={styles.askBody}>
          <Icon name="camera" size={32} color={Brand.blue} />
          <Text style={styles.askTitle}>Allow the camera</Text>
          <Text style={styles.askText}>urban.bee needs the camera to photograph the problem you report.</Text>
        </View>
        <BigButton
          label={settings ? 'Open settings' : 'Allow camera'}
          onPress={() => (settings ? void Linking.openSettings() : void requestPermission())}
        />
        <BigButton label="Not now" variant="link" onPress={() => finish([])} />
      </SafeAreaView>
    );
  }

  const last = taken[taken.length - 1];

  return (
    <View style={styles.black}>
      <CameraView
        ref={camera}
        style={StyleSheet.absoluteFill}
        facing="back"
        flash={flash}
        onCameraReady={() => setReady(true)}
      />
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.blink, blinkStyle]} />

      <SafeAreaView edges={['top']} style={styles.top}>
        <Pressable accessibilityRole="button" accessibilityLabel="Close camera" onPress={close} style={styles.iconBtn}>
          <Icon name="x" size={22} color="#ffffff" />
        </Pressable>
        <Text style={styles.counter}>
          {taken.length} of {room}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={flash === 'on' ? 'Turn flash off' : 'Turn flash on'}
          onPress={() => setFlash((f) => (f === 'on' ? 'off' : 'on'))}
          style={styles.iconBtn}
        >
          <Icon name={flash === 'on' ? 'zap' : 'zap-off'} size={20} color="#ffffff" />
        </Pressable>
      </SafeAreaView>

      <SafeAreaView edges={['bottom']} style={styles.bottom}>
        <Text style={styles.hint}>{taken.length ? 'Add a wider shot, or tap Done' : 'Point at the problem and tap the button'}</Text>
        <View style={styles.controls}>
          <View style={styles.side}>
            {last ? <Image source={{ uri: last.uri }} style={styles.thumb} contentFit="cover" /> : null}
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Take photo"
            disabled={!ready || shooting}
            onPress={shoot}
            style={({ pressed }) => [styles.shutter, pressed && { transform: [{ scale: 0.94 }] }]}
          >
            <View style={styles.shutterInner}>{shooting ? <ActivityIndicator color={Brand.ink} /> : null}</View>
          </Pressable>

          <View style={[styles.side, styles.sideRight]}>
            {taken.length ? (
              <Pressable accessibilityRole="button" onPress={() => finish(taken)} hitSlop={10} style={styles.done}>
                <Text style={styles.doneLabel}>Done</Text>
              </Pressable>
            ) : null}
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const SHUTTER = 74;

const styles = StyleSheet.create({
  black: { flex: 1, backgroundColor: '#000000' },
  blink: { backgroundColor: '#ffffff' },
  top: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  iconBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  counter: { fontSize: 15, fontWeight: '600', color: '#ffffff', fontVariant: ['tabular-nums'] },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingBottom: 12, gap: 14, backgroundColor: 'rgba(0, 0, 0, 0.35)' },
  hint: { marginTop: 12, fontSize: 15, color: 'rgba(255, 255, 255, 0.85)', textAlign: 'center' },
  controls: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 24 },
  side: { flex: 1 },
  sideRight: { alignItems: 'flex-end' },
  thumb: { width: 48, height: 48, borderRadius: 8, borderWidth: 2, borderColor: '#ffffff' },
  shutter: {
    width: SHUTTER,
    height: SHUTTER,
    borderRadius: SHUTTER / 2,
    borderWidth: 4,
    borderColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shutterInner: {
    width: SHUTTER - 14,
    height: SHUTTER - 14,
    borderRadius: (SHUTTER - 14) / 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  done: { minHeight: 44, justifyContent: 'center', paddingHorizontal: 14, borderRadius: 22, backgroundColor: Brand.orange },
  doneLabel: { fontSize: 17, fontWeight: '700', color: '#ffffff' },
  ask: { flex: 1, backgroundColor: Brand.bg, paddingHorizontal: 20, paddingBottom: 12, gap: 8 },
  askBody: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10, paddingHorizontal: 12 },
  askTitle: { ...Type.heading, color: Brand.ink },
  askText: { fontSize: 17, lineHeight: 24, color: Brand.ink2, textAlign: 'center' },
});
