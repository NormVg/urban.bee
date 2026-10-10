<script setup lang="ts">
import type { Severity } from '#shared/triage/taxonomy'
import { SEVERITY_META, SEVERITY_ORDER, STATUS_FILTERS, type StatusFilterId } from '~/constants/complaints'

/**
 * Filters for the complaints panel, stacked to fit the list column:
 * search, status, then one scrollable row of severity chips.
 */
const statusId = defineModel<StatusFilterId>('status', { required: true })
const severities = defineModel<Severity[]>('severities', { required: true })
const search = defineModel<string>('search', { required: true })
const reviewOnly = defineModel<boolean>('reviewOnly', { required: true })

/* Debounce typing so the list doesn't refetch on every keystroke. */
const draft = ref(search.value)
let debounce: ReturnType<typeof setTimeout> | undefined
watch(draft, (value) => {
  clearTimeout(debounce)
  debounce = setTimeout(() => (search.value = value), 280)
})
watch(search, (value) => {
  if (value !== draft.value) draft.value = value
})

function toggleSeverity(s: Severity) {
  severities.value = severities.value.includes(s)
    ? severities.value.filter((x) => x !== s)
    : [...severities.value, s]
}

const hasFilters = computed(() => severities.value.length > 0 || reviewOnly.value || !!search.value)

function clearAll() {
  severities.value = []
  reviewOnly.value = false
  draft.value = ''
  search.value = ''
}
</script>

<template>
  <div class="cfilters">
    <UiInput v-model="draft" size="sm" icon="search" placeholder="Search title, street or UB- number" aria-label="Search problems" />

    <UiSegmented v-model="statusId" :options="STATUS_FILTERS" label="Status" block />

    <div class="cfilters__row">
      <div class="cfilters__chips" role="group" aria-label="Severity">
        <UiChip
          v-for="s in SEVERITY_ORDER"
          :key="s"
          :selected="severities.includes(s)"
          :color="SEVERITY_META[s].color"
          @toggle="toggleSeverity(s)"
        >
          {{ SEVERITY_META[s].label }}
        </UiChip>
        <UiChip :selected="reviewOnly" @toggle="reviewOnly = !reviewOnly">
          <UiIcon name="alert" :size="13" /> Check
        </UiChip>
      </div>
      <button v-if="hasFilters" type="button" class="cfilters__clear" @click="clearAll">Clear</button>
    </div>
  </div>
</template>

<style scoped>
.cfilters {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.cfilters__row {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
}

/* One line of chips; scrolls sideways on narrow columns instead of wrapping into a second row. */
.cfilters__chips {
  flex: 1;
  min-width: 0;
  display: flex;
  gap: 6px;
  overflow-x: auto;
  scrollbar-width: none;
  mask-image: linear-gradient(90deg, #000 90%, transparent);
}

.cfilters__chips::-webkit-scrollbar {
  display: none;
}

.cfilters__chips :deep(.ui-chip) {
  flex-shrink: 0;
  height: 28px;
  padding: 0 9px;
  gap: 6px;
  font-size: 12px;
}

.cfilters__clear {
  flex-shrink: 0;
  border: none;
  background: none;
  padding: 4px 2px;
  font-size: 12.5px;
  font-weight: 650;
  color: var(--blue);
  cursor: pointer;
}

.cfilters__clear:hover {
  text-decoration: underline;
}
</style>
