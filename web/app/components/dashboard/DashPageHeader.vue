<script setup lang="ts">
/** Title row shared by every dashboard page: title, one-line context, actions on the right. */
defineProps<{ title: string; subtitle?: string }>()
</script>

<template>
  <header class="phead u-rise">
    <div class="phead__text">
      <h1 class="phead__title">{{ title }}</h1>
      <p v-if="subtitle || $slots.meta" class="phead__sub">
        <slot name="meta">{{ subtitle }}</slot>
      </p>
    </div>
    <div v-if="$slots.actions" class="phead__actions">
      <slot name="actions" />
    </div>
  </header>
</template>

<style scoped>
.phead {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.phead__text {
  min-width: 0;
}

.phead__title {
  font-size: 24px;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.2;
  color: var(--ink);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.phead__sub {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 4px 10px;
  margin-top: 4px;
  font-size: 13.5px;
  color: var(--ink-3);
}

.phead__actions {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
}
</style>
