<script setup lang="ts">
withDefaults(
  defineProps<{
    padding?: 'none' | 'sm' | 'md' | 'lg'
    hoverable?: boolean
    as?: string
  }>(),
  { padding: 'md', as: 'div' },
)
</script>

<template>
  <component
    :is="as"
    class="ui-card"
    :class="[`ui-card--${padding}`, { 'ui-card--hoverable': hoverable }]"
  >
    <header v-if="$slots.header" class="ui-card__header">
      <slot name="header" />
    </header>
    <div v-if="$slots.default" class="ui-card__body">
      <slot />
    </div>
    <footer v-if="$slots.footer" class="ui-card__footer">
      <slot name="footer" />
    </footer>
  </component>
</template>

<style scoped>
.ui-card {
  display: flex;
  flex-direction: column;
  min-width: 0;
  background: var(--surface);
  border: 1px solid var(--line);
  border-radius: var(--r-md);
  box-shadow: var(--sh-1);
}

.ui-card--hoverable {
  transition:
    box-shadow var(--t-med) var(--ease-out),
    transform var(--t-med) var(--ease-out);
}
.ui-card--hoverable:hover {
  box-shadow: var(--sh-2);
  transform: translateY(-2px);
}

.ui-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 14px 20px;
  border-bottom: 1px solid var(--line);
}

.ui-card__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 20px;
  border-top: 1px solid var(--line);
}

.ui-card__body {
  padding: 20px;
}

.ui-card--sm .ui-card__header { padding: 10px 14px; }
.ui-card--sm .ui-card__footer { padding: 10px 14px; }
.ui-card--sm .ui-card__body { padding: 14px; }
.ui-card--lg .ui-card__header { padding: 18px 24px; }
.ui-card--lg .ui-card__footer { padding: 16px 24px; }
.ui-card--lg .ui-card__body { padding: 24px; }
/* "none" is for edge-to-edge content (tables, lists); header and footer keep their padding */
.ui-card--none .ui-card__body { padding: 0; }
</style>
