import { StyleSheet, Text, View } from 'react-native';

import { BigButton } from '@/components/ui/big-button';
import { Icon, type IconName } from '@/components/ui/icon';
import { Brand, Radius, Type } from '@/constants/theme';

/** One sentence about what happened, one button to fix it. */
export function Notice({
  message,
  tone = 'danger',
  icon = 'alert-circle',
  actionLabel,
  onAction,
}: {
  message: string;
  tone?: 'danger' | 'info';
  icon?: IconName;
  actionLabel?: string;
  onAction?: () => void;
}) {
  const color = tone === 'danger' ? Brand.danger : Brand.blue;
  const bg = tone === 'danger' ? Brand.dangerTint : Brand.blueTint;
  return (
    <View style={[styles.box, { backgroundColor: bg }]} accessibilityRole="alert">
      <View style={styles.row}>
        <Icon name={icon} size={24} color={color} />
        <Text style={[styles.text, { color: Brand.ink }]}>{message}</Text>
      </View>
      {actionLabel && onAction ? (
        <BigButton label={actionLabel} onPress={onAction} variant="quiet" />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { borderRadius: Radius.md, padding: 16, gap: 14 },
  row: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
  text: { ...Type.body, flex: 1 },
});
