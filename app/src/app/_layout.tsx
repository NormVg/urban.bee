import { DefaultTheme, ThemeProvider, Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import { Brand } from '@/constants/theme';

SplashScreen.preventAutoHideAsync();

/** One warm light theme everywhere, matching the dashboard palette. */
const theme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: Brand.bg, card: Brand.bg, primary: Brand.orange, text: Brand.ink },
};

export default function RootLayout() {
  return (
    <ThemeProvider value={theme}>
      <StatusBar style="dark" />
      <AnimatedSplashOverlay />
      <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Brand.bg } }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="login" options={{ animation: 'fade' }} />
        <Stack.Screen name="report" options={{ presentation: 'fullScreenModal', gestureEnabled: false }} />
        <Stack.Screen name="reports/[id]" />
        <Stack.Screen name="completed" />
        <Stack.Screen name="camera" options={{ presentation: 'fullScreenModal', animation: 'fade' }} />
        <Stack.Screen name="pick-location" options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }} />
      </Stack>
    </ThemeProvider>
  );
}
