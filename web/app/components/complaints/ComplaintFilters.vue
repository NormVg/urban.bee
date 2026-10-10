<script setup lang="ts">
import type { Severity } from '#shared/triage/taxonomy'
import { SEVERITY_META, SEVERITY_ORDER, STATUS_FILTERS, type StatusFilterId } from '~/constants/complaints'

defineProps<{ resultCount: number; pending: boolean }>()

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
</script>

<template>
  <div class="cfilters">
    <UiInput v-model="draft" class="cfilters__search" size="sm" icon="search" placeholder="Search title, street or UB- number" />

    <UiSegmented v-model="statusId" :options="STATUS_FILTERS" label="Status" />

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
        <UiIcon name="alert" :size="13" /> Check these
      </UiChip>
    </div>

    <p class="cfilters__count tnum" aria-live="polite">
      <UiSpinner v-if="pending" :size="13" />
      {{ resultCount }} {{ resultCount === 1 ? 'problem' : 'problems' }}
    </p>
  </div>
</template>

<style scoped>
.cfilters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px 12px;
}

.cfilters__search {
  width: min(300px, 100%);
}

.cfilters__chips {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.cfilters__count {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-left: auto;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-3);
}
</style>
