import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';

import { BigButton } from '@/components/ui/big-button';
import { Field } from '@/components/ui/field';
import { Notice } from '@/components/ui/notice';
import { Screen } from '@/components/ui/screen';
import { Wordmark } from '@/components/ui/wordmark';
import { Brand, Type } from '@/constants/theme';
import { authClient } from '@/lib/auth-client';

type Mode = 'sign-in' | 'sign-up';

/** Turns auth errors into one plain sentence. */
function friendly(status: number | undefined, mode: Mode): string {
  if (status === 401) return 'That email and password don’t match. Please check them and try again.';
  if (status === 422 || status === 400) {
    return mode === 'sign-up'
      ? 'An account with this email may already exist. Try signing in instead.'
      : 'Please check your email and password.';
  }
  if (status === undefined || status === 0) return 'We can’t reach urban.bee right now. Check your internet and try again.';
  return 'Something went wrong on our side. Please try again.';
}

export default function LoginScreen() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  /*
   * Leave only once the shared session store has the new session. Navigating
   * straight after signIn() raced the store: home still saw "signed out" and
   * bounced back here, so people had to sign in twice.
   */
  const { data: session } = authClient.useSession();
  useEffect(() => {
    if (session) router.replace('/');
  }, [session]);

  const isSignUp = mode === 'sign-up';
  const nameError = checked && isSignUp && !name.trim() ? 'Please tell us your name.' : null;
  const emailError = checked && !/^\S+@\S+\.\S+$/.test(email.trim()) ? 'Please enter your email address.' : null;
  const passwordError =
    checked && password.length < 8
      ? isSignUp
        ? 'Choose a password with at least 8 characters.'
        : 'Please enter your password.'
      : null;

  async function submit() {
    if (pending) return;
    setChecked(true);
    setError(null);
    const invalid =
      (isSignUp && !name.trim()) || !/^\S+@\S+\.\S+$/.test(email.trim()) || password.length < 8;
    if (invalid) return;

    setPending(true);
    try {
      const result = isSignUp
        ? await authClient.signUp.email({ name: name.trim(), email: email.trim(), password })
        : await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) {
        setError(friendly(result.error.status, mode));
        setPending(false);
      }
      // On success the button keeps spinning until the session effect above navigates.
    } catch {
      setError(friendly(0, mode));
      setPending(false);
    }
  }

  function switchMode() {
    setMode(isSignUp ? 'sign-in' : 'sign-up');
    setChecked(false);
    setError(null);
  }

  return (
    <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen contentStyle={styles.content}>
        <Animated.View entering={FadeInDown.duration(360)} style={styles.head}>
          <Wordmark size="lg" />
          <Text style={styles.headline}>
            {isSignUp ? 'Create your account' : 'Fix your street, one photo at a time'}
          </Text>
          <Text style={styles.sub}>
            {isSignUp
              ? 'It takes a few seconds. Then you can report any problem you see.'
              : 'Spot a problem? Snap it. We’ll make sure the right people see it.'}
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(90).duration(360)} style={styles.form}>
          {isSignUp ? (
            <Field
              label="Your name"
              value={name}
              onChangeText={setName}
              autoComplete="name"
              textContentType="name"
              returnKeyType="next"
              error={nameError}
            />
          ) : null}
          <Field
            label="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            autoComplete="email"
            keyboardType="email-address"
            textContentType="emailAddress"
            returnKeyType="next"
            error={emailError}
          />
          <Field
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            textContentType={isSignUp ? 'newPassword' : 'password'}
            returnKeyType="go"
            onSubmitEditing={submit}
            error={passwordError}
          />

          {error ? <Notice message={error} /> : null}

          <BigButton
            label={isSignUp ? 'Create my account' : 'Sign in'}
            onPress={submit}
            loading={pending}
          />
        </Animated.View>

        <Pressable accessibilityRole="button" onPress={switchMode} style={styles.switch}>
          <Text style={styles.switchText}>
            {isSignUp ? 'Already have an account? ' : 'New here? '}
            <Text style={styles.switchLink}>{isSignUp ? 'Sign in' : 'Create an account'}</Text>
          </Text>
        </Pressable>
      </Screen>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: Brand.bg },
  content: { justifyContent: 'center', gap: 28 },
  head: { gap: 14 },
  headline: { ...Type.hero, color: Brand.ink },
  sub: { ...Type.body, color: Brand.ink2 },
  form: { gap: 18 },
  switch: { minHeight: 56, alignItems: 'center', justifyContent: 'center' },
  switchText: { ...Type.body, color: Brand.ink2, textAlign: 'center' },
  switchLink: { color: Brand.blue, fontWeight: '700' },
});
