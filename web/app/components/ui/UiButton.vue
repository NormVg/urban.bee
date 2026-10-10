<script setup lang="ts">
import type { IconName } from '~/constants/icons'

type Variant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'inverse-ghost'
type Size = 'sm' | 'md' | 'lg'

const props = withDefaults(
  defineProps<{
    variant?: Variant
    size?: Size
    /** Icon shown before the label */
    iconLeft?: IconName
    /** Icon shown after the label */
    iconRight?: IconName
    /** Square icon-only button; requires ariaLabel */
    iconOnly?: IconName
    loading?: boolean
    disabled?: boolean
    block?: boolean
    type?: 'button' | 'submit' | 'reset'
    /** Renders a NuxtLink instead of a button */
    to?: string
    ariaLabel?: string
    /** Small attention dot (e.g. unread notifications) */
    indicator?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button' },
)

/* A plain string in <component :is> does NOT resolve NuxtLink — it renders
   an inert <nuxtlink> custom element. resolveComponent() is required. */
const NuxtLinkComponent = resolveComponent('NuxtLink')

const iconSize = computed(() => ({ sm: 15, md: 17, lg: 18 })[props.size])
</script>

<template>
  <component
    :is="to ? NuxtLinkComponent : 'button'"
    :to="to"
    :type="to ? undefined : type"
    :disabled="to ? undefined : disabled || loading"
    :aria-label="ariaLabel"
    :aria-busy="loading || undefined"
    class="ui-btn"
    :class="[
      `ui-btn--${variant}`,
      `ui-btn--${size}`,
      { 'ui-btn--block': block, 'ui-btn--icon-only': iconOnly, 'is-loading': loading },
    ]"
  >
    <UiSpinner v-if="loading" :size="iconSize" class="ui-btn__spinner" />
    <UiIcon v-else-if="iconOnly" :name="iconOnly" :size="iconSize" />
    <template v-else>
      <UiIcon v-if="iconLeft" :name="iconLeft" :size="iconSize" />
      <span class="ui-btn__label"><slot /></span>
      <UiIcon v-if="iconRight" :name="iconRight" :size="iconSize" />
    </template>
    <span v-if="indicator" class="ui-btn__indicator" aria-hidden="true" />
  </component>
</template>

<style scoped>
.ui-btn {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid transparent;
  border-radius: var(--r-sm);
  font-weight: 600;
  line-height: 1;
  letter-spacing: 0.01em;
  white-space: nowrap;
  text-decoration: none;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
  transition:
    background-color var(--t-fast) var(--ease-in-out),
    color var(--t-fast) var(--ease-in-out),
    border-color var(--t-fast) var(--ease-in-out),
    box-shadow var(--t-fast) var(--ease-in-out),
    transform var(--t-fast) var(--ease-in-out);
}

.ui-btn:active:not(:disabled):not(.is-loading) {
  transform: scale(0.97);
}

.ui-btn:disabled {
  opacity: 0.4;
}

.ui-btn.is-loading {
  opacity: 0.75;
  pointer-events: none;
}

/* Expand the hit target of small buttons to the 40px minimum */
.ui-btn--sm::after {
  content: '';
  position: absolute;
  inset: -4px;
}

/* --- sizes --- */
.ui-btn--sm {
  height: 34px;
  padding: 0 12px;
  font-size: 13px;
  gap: 6px;
}
.ui-btn--md {
  height: 40px;
  padding: 0 16px;
  font-size: 14px;
}
.ui-btn--lg {
  height: 48px;
  padding: 0 22px;
  font-size: 15px;
}

.ui-btn--block {
  width: 100%;
}

.ui-btn--icon-only.ui-btn--sm { width: 34px; padding: 0; }
.ui-btn--icon-only.ui-btn--md { width: 40px; padding: 0; }
.ui-btn--icon-only.ui-btn--lg { width: 48px; padding: 0; }

.ui-btn__indicator {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: var(--orange);
}

/* --- primary: orange, full shadow anatomy --- */
.ui-btn--primary {
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--orange) 94%, white),
    var(--orange)
  );
  color: #fff6ee;
  text-shadow: 0 1px 1px rgba(96, 38, 12, 0.3);
  box-shadow:
    0 0 0 0.5px rgba(96, 38, 12, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 1px 2px rgba(96, 38, 12, 0.16),
    0 3px 7px rgba(96, 38, 12, 0.13),
    0 8px 18px rgba(96, 38, 12, 0.07);
}
.ui-btn--primary:hover:not(:disabled):not(.is-loading) {
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--orange-strong) 94%, white),
    var(--orange-strong)
  );
  box-shadow:
    0 0 0 0.5px rgba(96, 38, 12, 0.45),
    inset 0 0 0 1px rgba(255, 255, 255, 0.1),
    inset 0 1px 0 rgba(255, 255, 255, 0.18),
    0 1px 2px rgba(96, 38, 12, 0.18),
    0 4px 9px rgba(96, 38, 12, 0.15),
    0 10px 22px rgba(96, 38, 12, 0.09);
}

/* --- secondary: deep blue --- */
.ui-btn--secondary {
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--blue) 94%, white),
    var(--blue)
  );
  color: #f2efe6;
  text-shadow: 0 1px 1px rgba(10, 28, 44, 0.35);
  box-shadow:
    0 0 0 0.5px rgba(10, 30, 48, 0.4),
    inset 0 0 0 1px rgba(255, 255, 255, 0.08),
    inset 0 1px 0 rgba(255, 255, 255, 0.14),
    0 1px 2px rgba(10, 30, 48, 0.16),
    0 3px 7px rgba(10, 30, 48, 0.12),
    0 8px 18px rgba(10, 30, 48, 0.07);
}
.ui-btn--secondary:hover:not(:disabled):not(.is-loading) {
  background: linear-gradient(
    to bottom,
    color-mix(in srgb, var(--blue-deep) 94%, white),
    var(--blue-deep)
  );
}

/* --- outline --- */
.ui-btn--outline {
  background: transparent;
  color: var(--ink-2);
  border-color: var(--line-strong);
  box-shadow: var(--sh-1);
}
.ui-btn--outline:hover:not(:disabled):not(.is-loading) {
  background: var(--blue-tint);
  border-color: var(--blue);
  color: var(--blue);
}

/* --- ghost --- */
.ui-btn--ghost {
  background: transparent;
  color: var(--ink-2);
  box-shadow: none;
}
.ui-btn--ghost:hover:not(:disabled):not(.is-loading) {
  background: rgba(36, 28, 19, 0.06);
  color: var(--ink);
}

/* --- inverse-ghost: for use on the deep blue sidebar --- */
.ui-btn--inverse-ghost {
  background: transparent;
  color: var(--on-blue-muted);
  box-shadow: none;
}
.ui-btn--inverse-ghost:hover:not(:disabled):not(.is-loading) {
  background: rgba(239, 233, 220, 0.12);
  color: var(--on-blue);
}
</style>
