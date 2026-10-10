import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { Icon } from '@/components/ui/icon';
import { Brand, Radius, Type } from '@/constants/theme';

/** Empty photo slot: take a photo (camera) or choose one (gallery), side by side. */
export function PhotoPrompt({
  onCamera,
  onLibrary,
  busy,
}: {
  onCamera: () => void;
  onLibrary: () => void;
  busy: boolean;
}) {
  return (
    <View style={styles.box}>
      {busy ? (
        <View style={styles.busy}>
          <ActivityIndicator color={Brand.blue} />
          <Text style={styles.busyText}>Getting your photo ready…</Text>
        </View>
      ) : (
        <>
          <Text style={styles.title}>Add a photo of the problem</Text>
          <View style={styles.row}>
            <Option icon="camera" label="Take photo" onPress={onCamera} primary />
            <Option icon="image" label="Choose photo" onPress={onLibrary} />
          </View>
        </>
      )}
    </View>
  );
}

function Option({
  icon,
  label,
  onPress,
  primary,
}: {
  icon: 'camera' | 'image';
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      style={({ pressed }) => [
        styles.option,
        primary ? styles.optionPrimary : styles.optionQuiet,
        pressed && { opacity: 0.85 },
      ]}
    >
      <Icon name={icon} size={20} color={primary ? Brand.onBlue : Brand.blue} />
      <Text style={[styles.optionLabel, { color: primary ? Brand.onBlue : Brand.blue }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  box: {
    gap: 14,
    padding: 16,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Brand.lineStrong,
  },
  title: { ...Type.bodyStrong, fontSize: 17, color: Brand.ink },
  row: { flexDirection: 'row', gap: 10 },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 50,
    borderRadius: Radius.sm,
  },
  optionPrimary: { backgroundColor: Brand.blue },
  optionQuiet: { backgroundColor: Brand.blueTint },
  optionLabel: { fontSize: 17, fontWeight: '700' },
  busy: { flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 50 },
  busyText: { ...Type.body, fontSize: 17, color: Brand.ink2 },
});
