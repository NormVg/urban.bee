import * as SecureStore from 'expo-secure-store';

import { createAuthClient } from 'better-auth/react';
import { expoClient } from '@better-auth/expo/client';

/**
 * Auth client for the urban.bee app. The app runs no server of its own —
 * every call goes to the web project's Better Auth routes at
 * `${EXPO_PUBLIC_API_URL}/api/auth/*`.
 *
 * The expoClient plugin persists the session cookie in SecureStore and
 * attaches it to requests; `scheme` matches app.json.
 */
export const authClient = createAuthClient({
  baseURL: process.env.EXPO_PUBLIC_API_URL,
  plugins: [
    expoClient({
      scheme: 'app',
      storagePrefix: 'urbanbee',
      storage: SecureStore,
    }),
  ],
});
