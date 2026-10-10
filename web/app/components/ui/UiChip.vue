<script setup lang="ts">
/** Toggle chip for filters. Colour dot is optional (e.g. severity). */
defineProps<{
  selected?: boolean
  color?: string
  count?: number
}>()
defineEmits<{ toggle: [] }>()
</script>

<template>
  <button
    type="button"
    class="ui-chip"
    :class="{ 'is-selected': selected }"
    :aria-pressed="selected"
    @click="$emit('toggle')"
  >
    <span v-if="color" class="ui-chip__dot" :style="{ background: color }" aria-hidden="true" />
    <slot />
    <span v-if="count !== undefined" class="ui-chip__count tnum">{{ count }}</span>
  </button>
</template>

<style scoped>
.ui-chip {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  height: 32px;
  padding: 0 12px;
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  background: var(--surface);
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-2);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color var(--t-fast) var(--ease-in-out),
    border-color var(--t-fast) var(--ease-in-out),
    color var(--t-fast) var(--ease-in-out),
    transform var(--t-fast) var(--ease-in-out);
}

.ui-chip:hover {
  border-color: var(--line-strong);
  color: var(--ink);
}

.ui-chip:active {
  transform: scale(0.97);
}

.ui-chip.is-selected {
  background: var(--blue);
  border-color: var(--blue);
  color: var(--on-blue);
}

.ui-chip__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.6);
}

.ui-chip__count {
  font-size: 11px;
  opacity: 0.7;
}
</style>
