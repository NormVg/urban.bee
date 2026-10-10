import { useEffect } from 'react';
import { type DimensionValue } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { Brand, Radius } from '@/constants/theme';

/** Soft pulsing placeholder used while content loads (instead of a spinner). */
export function Skeleton({ height, width = '100%', radius = Radius.md }: { height: number; width?: DimensionValue; radius?: number }) {
  const opacity = useSharedValue(0.55);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(1, { duration: 750 }), -1, true);
  }, [opacity]);
  const animated = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={[{ height, width, borderRadius: radius, backgroundColor: Brand.surfaceInset }, animated]}
    />
  );
}
