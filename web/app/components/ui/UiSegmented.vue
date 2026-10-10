<script setup lang="ts" generic="T extends string">
/** Segmented control (single choice), keyboard friendly via radio semantics. */
defineProps<{
  options: readonly { id: T; label: string }[]
  label: string
  /** Stretch to the container width, options sharing it equally */
  block?: boolean
}>()
const model = defineModel<T>({ required: true })
</script>

<template>
  <div class="ui-seg" :class="{ 'ui-seg--block': block }" role="radiogroup" :aria-label="label">
    <button
      v-for="opt in options"
      :key="opt.id"
      type="button"
      role="radio"
      :aria-checked="model === opt.id"
      class="ui-seg__item"
      :class="{ 'is-active': model === opt.id }"
      @click="model = opt.id"
    >
      {{ opt.label }}
    </button>
  </div>
</template>

<style scoped>
.ui-seg {
  display: inline-flex;
  padding: 3px;
  gap: 2px;
  border-radius: var(--r-sm);
  background: var(--surface-inset);
  border: 1px solid var(--line);
}

.ui-seg--block {
  display: flex;
  width: 100%;
}

.ui-seg--block .ui-seg__item {
  flex: 1;
  padding: 0 6px;
}

.ui-seg__item {
  height: 28px;
  padding: 0 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-3);
  cursor: pointer;
  white-space: nowrap;
  transition:
    background-color var(--t-fast) var(--ease-in-out),
    color var(--t-fast) var(--ease-in-out),
    box-shadow var(--t-fast) var(--ease-in-out);
}

.ui-seg__item:hover {
  color: var(--ink);
}

.ui-seg__item.is-active {
  background: var(--surface-2);
  color: var(--ink);
  box-shadow: var(--sh-1);
}
</style>
