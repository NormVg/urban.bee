<script setup lang="ts">
import type { ComplaintSummary } from '#shared/types/complaint'
import { formatTimeAgo } from '~/composables/useTimeAgo'

/** The most urgent open problems, each one click away on the map. */
defineProps<{ complaints: ComplaintSummary[] }>()
</script>

<template>
  <UiCard padding="none" class="crit-card">
    <template #header>
      <div>
        <h2 class="crit__title">Needs attention now</h2>
        <p class="crit__sub">Most urgent open problems</p>
      </div>
      <UiButton variant="ghost" size="sm" icon-right="chevronRight" to="/map">Live map</UiButton>
    </template>

    <UiEmptyState
      v-if="complaints.length === 0"
      icon="checkCircle"
      title="Nothing urgent"
      description="No urgent or high-priority problems are open."
    />

    <ul v-else class="crit">
      <li v-for="(c, i) in complaints" :key="c.id" class="u-rise" :style="{ '--stagger': `${260 + i * 40}ms` }">
        <NuxtLink :to="`/complaints?id=${c.id}`" class="crit__row">
          <img :src="c.coverPhotoUrl" alt="" class="crit__img" loading="lazy" />
          <span class="crit__body">
            <span class="crit__name">{{ c.title }}</span>
            <span class="crit__meta">
              {{ c.departmentLabel }} · {{ c.address?.split(',')[0] ?? 'Unknown location' }} · {{ formatTimeAgo(c.createdAt) }}
            </span>
          </span>
          <span class="crit__side">
            <ComplaintPriorityBadge :priority="c.priority" />
            <span v-if="c.reportCount > 1" class="crit__people tnum"><UiIcon name="users" :size="12" /> {{ c.reportCount }}</span>
          </span>
        </NuxtLink>
      </li>
    </ul>
  </UiCard>
</template>

<style scoped>
.crit-card { height: 100%; }

.crit__title { font-size: 15px; font-weight: 650; color: var(--ink); }
.crit__sub { font-size: 12.5px; color: var(--ink-3); }

.crit {
  list-style: none;
  margin: 0;
  padding: 6px;
}

.crit__row {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 10px;
  border-radius: var(--r-sm);
  text-decoration: none;
  color: inherit;
  transition: background-color var(--t-fast) var(--ease-in-out);
}

.crit__row:hover { background: rgba(255, 255, 255, 0.55); }

.crit__img {
  width: 48px;
  height: 48px;
  flex-shrink: 0;
  border-radius: var(--r-sm);
  object-fit: cover;
  background: var(--surface-inset);
}

.crit__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.crit__name {
  font-size: 13.5px;
  font-weight: 650;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.crit__meta {
  font-size: 12px;
  color: var(--ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.crit__side {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 4px;
}

.crit__people {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11.5px;
  color: var(--ink-3);
}
</style>
