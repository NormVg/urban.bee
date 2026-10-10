/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import '@/global.css';

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#000000',
    background: '#ffffff',
    backgroundElement: '#F0F0F3',
    backgroundSelected: '#E0E1E6',
    textSecondary: '#60646C',
  },
  dark: {
    text: '#ffffff',
    background: '#000000',
    backgroundElement: '#212225',
    backgroundSelected: '#2E3135',
    textSecondary: '#B0B4BA',
  },
} as const;

/**
 * urban.bee brand palette — kept in lockstep with the web design tokens
 * (web/app/assets/css/main.css). Fixed (not scheme-reactive) like the web.
 */
export const Brand = {
  /** app background (70%) */
  bg: '#e3d9c9',
  /** cards */
  surface: '#f7f2e8',
  /** raised: inputs, popover */
  surface2: '#fdfaf3',
  /** wells, table headers */
  surfaceInset: '#efe7d8',
  /** deep blue (20%) — sidebar / login ground */
  blue: '#1c4f78',
  blueDeep: '#16405f',
  blueInk: '#123350',
  /** orange (10%) — primary action */
  orange: '#e6683f',
  orangeStrong: '#d2552c',
  /** darker edge under orange buttons (pressable depth) */
  orangeLip: '#b4451f',
  /** warm ink */
  ink: '#241c13',
  ink2: '#5d5142',
  ink3: '#8a7b67',
  /** text on deep blue */
  onBlue: '#efe9dc',
  onBlueMuted: 'rgba(239, 233, 220, 0.62)',
  onBlueLine: 'rgba(239, 233, 220, 0.14)',
  /** status tones */
  success: '#4a7b5a',
  warning: '#a06f22',
  danger: '#b0442f',
  /** soft fills behind coloured text */
  blueTint: 'rgba(28, 79, 120, 0.1)',
  orangeTint: 'rgba(230, 104, 63, 0.12)',
  successTint: 'rgba(74, 123, 90, 0.14)',
  warningTint: 'rgba(160, 111, 34, 0.14)',
  dangerTint: 'rgba(176, 68, 47, 0.12)',
  line: 'rgba(36, 28, 19, 0.12)',
  lineStrong: 'rgba(36, 28, 19, 0.2)',
} as const;

/**
 * Type scale for the citizen app. Body text never goes below 18 pt so the
 * app stays readable for older eyes; sizes still follow the phone's font setting.
 */
export const Type = {
  hero: { fontSize: 32, lineHeight: 38, fontWeight: '800', letterSpacing: -0.6 },
  title: { fontSize: 26, lineHeight: 32, fontWeight: '800', letterSpacing: -0.4 },
  heading: { fontSize: 21, lineHeight: 27, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 18, lineHeight: 26, fontWeight: '400' },
  bodyStrong: { fontSize: 18, lineHeight: 26, fontWeight: '700' },
  button: { fontSize: 20, lineHeight: 24, fontWeight: '700' },
  /** secondary details only (times, reference numbers) */
  small: { fontSize: 16, lineHeight: 22, fontWeight: '500' },
} as const;

export const Radius = { sm: 10, md: 16, lg: 22, xl: 28, pill: 999 } as const;

/** Warm layered shadows, matching the dashboard. */
export const Shadow = {
  card: {
    shadowColor: '#3b2a14',
    shadowOpacity: 0.08,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  raised: {
    shadowColor: '#3b2a14',
    shadowOpacity: 0.16,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;
