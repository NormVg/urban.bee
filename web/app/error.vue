<script setup lang="ts">
import type { NuxtError } from '#app'

const props = defineProps<{ error: NuxtError }>()

const notFound = computed(() => props.error.statusCode === 404)
const title = computed(() =>
  notFound.value ? 'We couldn’t find that page' : 'Something went wrong on our side',
)
const body = computed(() =>
  notFound.value
    ? 'The link may be old, or the complaint may have been removed.'
    : 'Please try again in a moment. If it keeps happening, let the team know.',
)

useHead({ title: () => `${title.value} · urban.bee` })

function goHome() {
  clearError({ redirect: '/dashboard' })
}
</script>

<template>
  <main class="err">
    <div class="err__card u-rise">
      <BrandWordmark size="md" />
      <p class="err__code">{{ error.statusCode }}</p>
      <h1 class="err__title">{{ title }}</h1>
      <p class="err__body">{{ body }}</p>
      <UiButton variant="primary" size="lg" icon-left="arrowLeft" @click="goHome">
        Back to the dashboard
      </UiButton>
    </div>
  </main>
</template>

<style scoped>
.err {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: var(--bg);
}

.err__card {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 12px;
  width: min(440px, 100%);
  padding: 32px;
  background: var(--surface-2);
  border: 1px solid var(--line);
  border-radius: var(--r-lg);
  box-shadow: var(--sh-2);
}

.err__code {
  margin-top: 12px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.1em;
  color: var(--orange);
}

.err__title {
  font-size: 22px;
  font-weight: 650;
  color: var(--ink);
}

.err__body {
  margin-bottom: 8px;
  font-size: 14.5px;
  line-height: 1.55;
  color: var(--ink-2);
}
</style>
