<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    name: string
    size?: 'sm' | 'md' | 'lg'
  }>(),
  { size: 'md' },
)

/** Deterministic tone per name; drawn from the app palette */
const TONES = [
  { bg: 'var(--blue)', fg: '#f2efe6' },
  { bg: 'var(--orange)', fg: '#fff6ee' },
  { bg: '#6e5f4b', fg: '#f2efe6' },
] as const

const tone = computed(
  () => TONES[[...props.name].reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % TONES.length] ?? TONES[0],
)

const initials = computed(() =>
  props.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0]!.toUpperCase())
    .join(''),
)
</script>

<template>
  <span
    class="ui-avatar"
    :class="`ui-avatar--${size}`"
    :style="{ background: tone.bg, color: tone.fg }"
    aria-hidden="true"
  >
    {{ initials }}
  </span>
</template>

<style scoped>
.ui-avatar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-weight: 600;
  letter-spacing: 0.02em;
  border-radius: 30%;
  box-shadow: inset 0 0 0 0.5px rgba(58, 42, 24, 0.18);
}

.ui-avatar--sm { width: 28px; height: 28px; font-size: 11px; }
.ui-avatar--md { width: 36px; height: 36px; font-size: 13px; }
.ui-avatar--lg { width: 44px; height: 44px; font-size: 14px; }
</style>
