import * as Device from 'expo-device';
import * as Haptics from 'expo-haptics';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { useCallback, useRef, useState } from 'react';

import { awaitCapturedPhotos } from '@/lib/photo-capture';

export interface Photo {
  uri: string;
  width: number;
  height: number;
}

export const MAX_PHOTOS = 4;
const MAX_EDGE = 1600;

/** Shrinks big photos so they send quickly on mobile data. */
export async function preparePhoto(source: { uri: string; width: number; height: number }): Promise<Photo> {
  const longest = Math.max(source.width, source.height);
  if (longest <= MAX_EDGE) return { uri: source.uri, width: source.width, height: source.height };
  const resize = source.width >= source.height ? { width: MAX_EDGE } : { height: MAX_EDGE };
  const image = await ImageManipulator.manipulate(source.uri).resize(resize).renderAsync();
  const saved = await image.saveAsync({ format: SaveFormat.JPEG, compress: 0.8 });
  return { uri: saved.uri, width: saved.width, height: saved.height };
}

export type PhotoSource = 'camera' | 'library';

/**
 * Photos for one report (1 to 4). "camera" opens the app's own camera screen;
 * "library" opens the phone's gallery.
 */
export function usePhotos() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  /** Only while gallery photos are being resized, never while a picker is open. */
  const [busy, setBusy] = useState(false);
  /** The gallery couldn't open, or this device has no camera. */
  const [failed, setFailed] = useState(false);
  /** This device has no camera (e.g. the iOS Simulator); only the gallery works. */
  const hasCamera = Device.isDevice;
  const picking = useRef(false);

  const append = useCallback((more: Photo[]) => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setPhotos((current) => [...current, ...more].slice(0, MAX_PHOTOS));
  }, []);

  const add = useCallback(
    async (source: PhotoSource) => {
      const room = MAX_PHOTOS - photos.length;
      if (room <= 0 || picking.current) return;
      setFailed(false);

      if (source === 'camera') {
        // The camera screen itself explains when the device has no camera.
        awaitCapturedPhotos(append);
        router.push({ pathname: '/camera', params: { room: String(room) } });
        return;
      }

      picking.current = true;
      try {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ['images'],
          quality: 0.85,
          allowsMultipleSelection: room > 1,
          selectionLimit: room,
        });
        if (result.canceled) return;
        setBusy(true);
        append(await Promise.all(result.assets.slice(0, room).map(preparePhoto)));
      } catch {
        setFailed(true);
      } finally {
        picking.current = false;
        setBusy(false);
      }
    },
    [photos.length, append],
  );

  const remove = useCallback((index: number) => {
    setPhotos((current) => current.filter((_, i) => i !== index));
  }, []);

  return { photos, add, remove, busy, failed, hasCamera, canAddMore: photos.length < MAX_PHOTOS };
}
