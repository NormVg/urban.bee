import { useState } from 'react';
import { StyleSheet, Text, TextInput, View, type TextInputProps } from 'react-native';

import { Brand, Radius, Type } from '@/constants/theme';

/** Label above a tall input (56 pt); the label is always visible, never a placeholder only. */
export function Field({ label, error, ...input }: TextInputProps & { label: string; error?: string | null }) {
  const [focused, setFocused] = useState(false);
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={Brand.ink3}
        {...input}
        onFocus={(e) => {
          setFocused(true);
          input.onFocus?.(e);
        }}
        onBlur={(e) => {
          setFocused(false);
          input.onBlur?.(e);
        }}
        style={[styles.input, focused && styles.focused, error ? styles.invalid : null, input.style]}
      />
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 8 },
  label: { ...Type.bodyStrong, color: Brand.ink },
  input: {
    minHeight: 56,
    paddingHorizontal: 16,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Brand.lineStrong,
    backgroundColor: Brand.surface2,
    fontSize: 18,
    color: Brand.ink,
  },
  focused: { borderColor: Brand.blue },
  invalid: { borderColor: Brand.danger },
  error: { fontSize: 16, color: Brand.danger },
});
