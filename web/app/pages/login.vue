<script setup lang="ts">
import { authClient } from '~/utils/auth-client'

definePageMeta({ layout: false })
useHead({ title: 'Sign in · urban.bee' })

const route = useRoute()
const { load, signOut } = useAdminSession()

const email = ref('')
const password = ref('')
const pending = ref(false)
const formError = ref<string | null>(null)
const denied = ref(route.query.denied === '1')
const touched = ref(false)

const emailError = computed(() =>
  touched.value && !/^\S+@\S+\.\S+$/.test(email.value.trim()) ? 'Enter a valid email address' : undefined,
)
const passwordError = computed(() => (touched.value && !password.value ? 'Enter your password' : undefined))

async function submit() {
  touched.value = true
  formError.value = null
  if (emailError.value || passwordError.value) return

  pending.value = true
  try {
    const { error } = await authClient.signIn.email({ email: email.value.trim(), password: password.value })
    if (error) {
      formError.value = error.status === 401 ? 'That email and password don’t match.' : 'We couldn’t sign you in. Please try again.'
      return
    }
    const me = await load()
    if (!me?.isAdmin) {
      denied.value = true
      await authClient.signOut()
      return
    }
    const next = typeof route.query.next === 'string' && route.query.next.startsWith('/') ? route.query.next : '/dashboard'
    await navigateTo(next)
  } finally {
    pending.value = false
  }
}

const FEATURES = [
  { icon: 'camera', text: 'Citizens report with one photo' },
  { icon: 'sparkles', text: 'AI sorts, prioritises and routes it' },
  { icon: 'map', text: 'Your team sees it live on the map' },
] as const
</script>

<template>
  <main class="login">
    <section class="login__brand" aria-hidden="true">
      <div class="login__brand-inner">
        <BrandWordmark size="lg" on-blue />
        <p class="login__pitch u-rise">Every street problem, sorted and sent to the right team in seconds.</p>
        <ul class="login__features">
          <li v-for="(f, i) in FEATURES" :key="f.text" class="u-rise" :style="{ '--stagger': `${120 + i * 60}ms` }">
            <span class="login__feature-icon"><UiIcon :name="f.icon" :size="16" /></span>
            {{ f.text }}
          </li>
        </ul>
      </div>
    </section>

    <section class="login__panel">
      <form class="login__form u-rise" novalidate @submit.prevent="submit">
        <div class="login__mobile-brand"><BrandWordmark size="md" /></div>
        <h1 class="login__title">Sign in to the city dashboard</h1>
        <p class="login__sub">For city staff and department teams.</p>

        <div v-if="denied" class="login__alert" role="alert">
          <UiIcon name="shield" :size="16" />
          <span>This account doesn’t have dashboard access. Ask your administrator to add your email.</span>
        </div>
        <div v-else-if="formError" class="login__alert" role="alert">
          <UiIcon name="alert" :size="16" />
          <span>{{ formError }}</span>
        </div>

        <UiInput
          v-model="email"
          label="Work email"
          type="email"
          icon="users"
          placeholder="you@city.gov.in"
          autocomplete="email"
          size="lg"
          :error="emailError"
          :disabled="pending"
          required
        />
        <UiInput
          v-model="password"
          label="Password"
          type="password"
          icon="shield"
          placeholder="Your password"
          autocomplete="current-password"
          size="lg"
          :error="passwordError"
          :disabled="pending"
          required
        />

        <UiButton type="submit" variant="primary" size="lg" block :loading="pending">Sign in</UiButton>

        <p class="login__foot">
          <NuxtLink to="/">Back to urban.bee</NuxtLink>
        </p>
      </form>
    </section>
  </main>
</template>

<style scoped>
.login {
  min-height: 100dvh;
  display: grid;
  grid-template-columns: minmax(0, 5fr) minmax(0, 6fr);
}

.login__brand {
  position: relative;
  display: flex;
  align-items: center;
  padding: 48px clamp(32px, 5vw, 72px);
  background: linear-gradient(160deg, var(--blue) 0%, var(--blue-ink) 100%);
  color: var(--on-blue);
  overflow: hidden;
}

.login__brand::after {
  content: '';
  position: absolute;
  right: -120px;
  bottom: -120px;
  width: 360px;
  height: 360px;
  border-radius: 50%;
  background: radial-gradient(circle, rgba(230, 104, 63, 0.28), transparent 70%);
}

.login__brand-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  gap: 28px;
  max-width: 420px;
}

.login__pitch {
  font-size: 26px;
  font-weight: 650;
  line-height: 1.3;
  letter-spacing: -0.015em;
}

.login__features {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 14px;
  font-size: 14.5px;
  color: var(--on-blue-muted);
}

.login__features li {
  display: flex;
  align-items: center;
  gap: 12px;
}

.login__feature-icon {
  display: inline-flex;
  padding: 8px;
  border-radius: var(--r-sm);
  background: rgba(239, 233, 220, 0.1);
  color: var(--on-blue);
}

.login__panel {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}

.login__form {
  width: 100%;
  max-width: 380px;
  display: flex;
  flex-direction: column;
  gap: 18px;
}

.login__mobile-brand {
  display: none;
}

.login__title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.login__sub {
  margin-top: -10px;
  font-size: 14px;
  color: var(--ink-3);
}

.login__alert {
  display: flex;
  gap: 10px;
  padding: 12px 14px;
  border-radius: var(--r-sm);
  background: var(--danger-bg);
  color: var(--danger);
  font-size: 13px;
  line-height: 1.45;
}

.login__foot {
  text-align: center;
  font-size: 13px;
}

.login__foot a {
  color: var(--ink-3);
  text-decoration: none;
}
.login__foot a:hover { color: var(--blue); }

@media (max-width: 860px) {
  .login { grid-template-columns: 1fr; }
  .login__brand { display: none; }
  .login__mobile-brand { display: block; margin-bottom: 8px; }
}
</style>
