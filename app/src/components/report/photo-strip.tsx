import { Image } from 'expo-image';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Brand, Radius, Shadow, Type } from '@/constants/theme';
import { MAX_PHOTOS, type Photo } from '@/hooks/use-photos';

/** Large preview of the chosen photo, thumbnails underneath, and an "add another" tile. */
export function PhotoStrip({
  photos,
  onAdd,
  onRemove,
  canAddMore,
  busy,
}: {
  photos: Photo[];
  onAdd: () => void;
  onRemove: (index: number) => void;
  canAddMore: boolean;
  busy: boolean;
}) {
  const [selected, setSelected] = useState(0);
  const index = Math.min(selected, photos.length - 1);
  const current = photos[index];
  if (!current) return null;

  return (
    <View style={styles.wrap}>
      <View style={[styles.hero, Shadow.card]}>
        <Image source={{ uri: current.uri }} style={StyleSheet.absoluteFill} contentFit="cover" transition={180} />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Remove photo ${index + 1}`}
          onPress={() => onRemove(index)}
          hitSlop={8}
          style={({ pressed }) => [styles.remove, pressed && { opacity: 0.8 }]}
        >
          <Icon name="x" size={20} color="#ffffff" />
          <Text style={styles.removeLabel}>Remove</Text>
        </Pressable>
      </View>

      <View style={styles.row}>
        {photos.map((photo, i) => (
          <Pressable
            key={photo.uri}
            accessibilityRole="button"
            accessibilityLabel={`Show photo ${i + 1} of ${photos.length}`}
            accessibilityState={{ selected: i === index }}
            onPress={() => setSelected(i)}
            style={[styles.thumb, i === index && styles.thumbActive]}
          >
            <Image source={{ uri: photo.uri }} style={StyleSheet.absoluteFill} contentFit="cover" />
          </Pressable>
        ))}
        {canAddMore ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Add another photo"
            accessibilityHint="A wider shot helps the team find it"
            disabled={busy}
            onPress={() => {
              onAdd();
              setSelected(photos.length);
            }}
            style={({ pressed }) => [styles.add, pressed && { backgroundColor: Brand.surfaceInset }]}
          >
            <Icon name="plus" size={26} color={Brand.blue} />
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.caption}>
        {canAddMore
          ? 'Add another photo. A wider shot helps the team find it.'
          : `That’s the most we can take (${MAX_PHOTOS} photos).`}
      </Text>
    </View>
  );
}

const THUMB = 64;

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  hero: {
    aspectRatio: 4 / 3,
    borderRadius: Radius.lg,
    overflow: 'hidden',
    backgroundColor: Brand.surfaceInset,
  },
  remove: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: 'rgba(18, 13, 8, 0.6)',
  },
  removeLabel: { color: '#ffffff', fontSize: 16, fontWeight: '700' },
  row: { flexDirection: 'row', gap: 10, flexWrap: 'wrap' },
  thumb: {
    width: THUMB,
    height: THUMB,
    borderRadius: Radius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
    backgroundColor: Brand.surfaceInset,
  },
  thumbActive: { borderColor: Brand.orange },
  add: {
    width: THUMB,
    height: THUMB,
    borderRadius: Radius.sm,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Brand.blue,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Brand.surface,
  },
  caption: { ...Type.small, color: Brand.ink2 },
});
