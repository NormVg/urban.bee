import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View, type RefreshControlProps, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets, type Edge } from 'react-native-safe-area-context';

import { Brand, Spacing } from '@/constants/theme';

/** Sand page with safe areas, a readable max width and optional scrolling. */
export function Screen({
  children,
  scroll = true,
  footer,
  edges = ['top', 'bottom'],
  refreshControl,
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  /** Pinned at the bottom (the screen's main action) */
  footer?: ReactNode;
  edges?: Edge[];
  refreshControl?: React.ReactElement<RefreshControlProps>;
  contentStyle?: StyleProp<ViewStyle>;
}) {
  /*
   * Pad from the app-wide insets rather than a native SafeAreaView: inside a
   * full-screen modal the native view measured 0 at first, so the top of the
   * screen slid under the status bar.
   */
  const insets = useSafeAreaInsets();
  const pad = {
    paddingTop: edges.includes('top') ? insets.top : 0,
    paddingBottom: edges.includes('bottom') ? insets.bottom : 0,
  };
  return (
    <View style={[styles.safe, pad]}>
      {scroll ? (
        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.content, contentStyle]}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.flex, styles.content, contentStyle]}>{children}</View>
      )}
      {footer ? <View style={styles.footer}>{footer}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Brand.bg },
  flex: { flex: 1 },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.five,
    gap: 20,
  },
  footer: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Spacing.three,
    gap: 10,
    backgroundColor: Brand.bg,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: Brand.line,
  },
});
