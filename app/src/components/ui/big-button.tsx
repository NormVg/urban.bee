import * as Haptics from 'expo-haptics';
import { ActivityIndicator, Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from 'react-native';

import { Icon, type IconName } from '@/components/ui/icon';
import { Brand, Radius } from '@/constants/theme';

type Variant = 'primary' | 'secondary' | 'quiet' | 'link';

const TONES: Record<Exclude<Variant, 'link'>, { bg: string; pressed: string; fg: string; border?: string }> = {
  primary: { bg: Brand.orange, pressed: Brand.orangeStrong, fg: '#ffffff' },
  secondary: { bg: Brand.blue, pressed: Brand.blueDeep, fg: Brand.onBlue },
  quiet: { bg: 'transparent', pressed: Brand.surfaceInset, fg: Brand.ink, border: Brand.lineStrong },
};

/**
 * The main action on a screen: one solid button, a short verb and an optional
 * small icon. "link" is the lighter second choice.
 */
export function BigButton({
  label,
  onPress,
  icon,
  variant = 'primary',
  disabled = false,
  loading = false,
  hint,
  accessibilityHint,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  /** Short reason shown under a disabled button, e.g. "Add a photo first" */
  hint?: string;
  accessibilityHint?: string;
  style?: StyleProp<ViewStyle>;
}) {
  const inactive = disabled || loading;
  const press = () => {
    void Haptics.selectionAsync();
    onPress();
  };

  if (variant === 'link') {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint}
        disabled={inactive}
        onPress={press}
        style={({ pressed }) => [styles.link, pressed && { opacity: 0.6 }, inactive && { opacity: 0.4 }, style]}
      >
        {icon ? <Icon name={icon} size={18} color={Brand.blue} /> : null}
        <Text style={styles.linkLabel}>{label}</Text>
      </Pressable>
    );
  }

  const tone = TONES[variant];
  const off = disabled && !loading;

  return (
    <>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={label}
        accessibilityHint={accessibilityHint ?? hint}
        accessibilityState={{ disabled: inactive, busy: loading }}
        disabled={inactive}
        onPress={press}
        style={({ pressed }) => [
          styles.button,
          { backgroundColor: off ? Brand.surfaceInset : pressed ? tone.pressed : tone.bg },
          tone.border && !off ? { borderWidth: 1, borderColor: tone.border } : null,
          style,
        ]}
      >
        {loading ? (
          <ActivityIndicator color={tone.fg} />
        ) : (
          <>
            {icon ? <Icon name={icon} size={19} color={off ? Brand.ink3 : tone.fg} /> : null}
            <Text style={[styles.label, { color: off ? Brand.ink3 : tone.fg }]}>{label}</Text>
          </>
        )}
      </Pressable>
      {off && hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    minHeight: 54,
    paddingHorizontal: 20,
    borderRadius: Radius.md,
  },
  label: { fontSize: 18, fontWeight: '700' },
  hint: { marginTop: -2, fontSize: 15, color: Brand.ink3, textAlign: 'center' },
  link: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    gap: 6,
    minHeight: 44,
    paddingHorizontal: 8,
  },
  linkLabel: { fontSize: 17, fontWeight: '600', color: Brand.blue },
});
