<script setup lang="ts">
import type { IconName } from '~/constants/icons'

withDefaults(
  defineProps<{
    icon?: IconName
    title: string
    description?: string
    tone?: 'neutral' | 'danger'
  }>(),
  { icon: 'inbox', tone: 'neutral' },
)
</script>

<template>
  <div class="ui-empty u-fade" :class="`ui-empty--${tone}`" role="status">
    <span class="ui-empty__icon"><UiIcon :name="icon" :size="22" /></span>
    <p class="ui-empty__title">{{ title }}</p>
    <p v-if="description" class="ui-empty__desc">{{ description }}</p>
    <div v-if="$slots.default" class="ui-empty__actions"><slot /></div>
  </div>
</template>

<style scoped>
.ui-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 6px;
  padding: 36px 20px;
}

.ui-empty__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 48px;
  height: 48px;
  margin-bottom: 6px;
  border-radius: var(--r-md);
  background: var(--blue-tint);
  color: var(--blue);
}

.ui-empty--danger .ui-empty__icon {
  background: var(--danger-bg);
  color: var(--danger);
}

.ui-empty__title {
  font-size: 14.5px;
  font-weight: 650;
  color: var(--ink);
}

.ui-empty__desc {
  max-width: 320px;
  font-size: 13px;
  color: var(--ink-3);
}

.ui-empty__actions {
  margin-top: 10px;
}
</style>
