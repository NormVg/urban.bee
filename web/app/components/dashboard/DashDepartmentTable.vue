<script setup lang="ts">
import type { OverviewResponse } from '#shared/types/complaint'
import { departmentIcon } from '~/constants/complaints'

type DepartmentRow = OverviewResponse['departments'][number]

const props = defineProps<{
  departments: DepartmentRow[]
  /** Department id currently selected in the sidebar switcher */
  activeId?: string
}>()

const emit = defineEmits<{ select: [id: string] }>()

const STATUS: Record<DepartmentRow['status'], { tone: 'success' | 'warning' | 'danger'; label: string }> = {
  healthy: { tone: 'success', label: 'On track' },
  watch: { tone: 'warning', label: 'Watch' },
  critical: { tone: 'danger', label: 'Needs help' },
}

/** Busiest first; the scoped department pinned on top. */
const ordered = computed(() => {
  const sorted = [...props.departments].sort((a, b) => b.p1 - a.p1 || b.open - a.open)
  const active = sorted.find((d) => d.id === props.activeId)
  return active ? [active, ...sorted.filter((d) => d.id !== active.id)] : sorted
})

const totals = computed(() => ({
  count: props.departments.length,
  open: props.departments.reduce((sum, d) => sum + d.open, 0),
  p1: props.departments.reduce((sum, d) => sum + d.p1, 0),
}))
</script>

<template>
  <UiCard padding="none" class="dtable-card">
    <template #header>
      <div>
        <h2 class="dtable__title">Teams</h2>
        <p class="dtable__sub">Open work and urgent problems per department</p>
      </div>
      <UiButton variant="ghost" size="sm" icon-right="chevronRight" to="/departments">All teams</UiButton>
    </template>

    <div class="dtable__scroll">
      <table class="dtable">
        <thead>
          <tr>
            <th scope="col">Department</th>
            <th scope="col" class="is-num">Open</th>
            <th scope="col" class="is-num">Urgent</th>
            <th scope="col" class="is-num">Fixed</th>
            <th scope="col" class="is-status">Status</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="dept in ordered"
            :key="dept.id"
            :class="{ 'is-scope': dept.id === activeId }"
            :aria-current="dept.id === activeId ? 'true' : undefined"
            tabindex="0"
            @click="emit('select', dept.id)"
            @keydown.enter="emit('select', dept.id)"
          >
            <td>
              <div class="dtable__dept">
                <span class="dtable__dept-icon"><UiIcon :name="departmentIcon(dept.icon)" :size="16" /></span>
                <div class="dtable__dept-text">
                  <span class="dtable__dept-name">{{ dept.label }}</span>
                </div>
              </div>
            </td>
            <td class="is-num tnum">{{ dept.open }}</td>
            <td class="is-num tnum" :class="{ 'is-hot': dept.p1 > 0 }">{{ dept.p1 }}</td>
            <td class="is-num tnum">{{ dept.resolved }}</td>
            <td class="is-status">
              <UiBadge :tone="STATUS[dept.status].tone" dot>{{ STATUS[dept.status].label }}</UiBadge>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <template #footer>
      <p class="dtable__totals tnum">
        {{ totals.count }} teams · {{ totals.open }} open · {{ totals.p1 }} urgent
      </p>
      <span class="dtable__scope-note" v-if="activeId">
        <UiIcon name="globe" :size="13" />
        scoped view
      </span>
    </template>
  </UiCard>
</template>

<style scoped>
.dtable-card { height: 100%; }
.dtable-card :deep(.ui-card__body) { flex: 1; }

.dtable__title {
  font-size: 15px;
  font-weight: 650;
  color: var(--ink);
}

.dtable__sub {
  font-size: 12.5px;
  color: var(--ink-3);
}

.dtable__scroll {
  overflow-x: auto;
  border-radius: calc(var(--r-md) - 1px);
}

.dtable {
  width: 100%;
  min-width: 520px;
  border-collapse: collapse;
}

.dtable th {
  text-align: left;
  padding: 11px 12px;
  background: var(--surface-inset);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--ink-3);
  white-space: nowrap;
}

.dtable td {
  padding: 12px 12px;
  border-top: 1px solid var(--line);
  font-size: 13.5px;
  color: var(--ink);
  white-space: nowrap;
}

.dtable th:first-child,
.dtable td:first-child {
  padding-left: 20px;
}

.dtable th:last-child,
.dtable td:last-child {
  padding-right: 20px;
}

.dtable tbody tr {
  cursor: pointer;
  transition: background-color var(--t-fast) var(--ease-in-out);
}

.dtable tbody tr:hover {
  background: rgba(255, 255, 255, 0.5);
}

.dtable tbody tr.is-scope {
  background: var(--blue-tint);
}

.dtable tbody tr.is-scope td:first-child {
  box-shadow: inset 3px 0 0 var(--orange);
}

.is-num {
  text-align: right;
}

.is-hot {
  color: var(--danger);
  font-weight: 700;
}

.dtable th.is-num {
  text-align: right;
}

.dtable__dept {
  display: flex;
  align-items: center;
  gap: 12px;
}

.dtable__dept-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: var(--r-sm);
  background: var(--blue-tint);
  color: var(--blue);
  flex-shrink: 0;
}

.dtable__dept-text {
  display: flex;
  flex-direction: column;
  gap: 1px;
  min-width: 0;
}

.dtable__dept-name {
  font-weight: 600;
}

.dtable__dept-head {
  font-size: 12px;
  color: var(--ink-3);
}

.dtable__totals {
  font-size: 12.5px;
  color: var(--ink-3);
}

.dtable__scope-note {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  font-weight: 500;
  color: var(--blue);
}
</style>

<style scoped>
.dtable .is-status { text-align: right; width: 1%; }
</style>
