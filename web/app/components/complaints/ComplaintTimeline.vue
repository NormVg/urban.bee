<script setup lang="ts">
import type { ComplaintEventDto } from '#shared/types/complaint'
import { STATUS_META } from '~/constants/complaints'

defineProps<{ events: ComplaintEventDto[] }>()

function describe(e: ComplaintEventDto): string {
  switch (e.type) {
    case 'created':
      return 'Reported by a citizen'
    case 'triaged':
      return 'Sorted by AI and sent to the team'
    case 'merged':
      return 'Someone else reported the same problem'
    case 'extended':
      return 'Reported further along, area widened'
    case 'status_changed':
      return `Moved to ${e.toStatus ? STATUS_META[e.toStatus].label : 'a new status'}${e.actorName ? ` by ${e.actorName}` : ''}`
  }
}

const fmt = (iso: string) =>
  new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit' })
</script>

<template>
  <section aria-labelledby="timeline-title">
    <h3 id="timeline-title" class="tl__title">History</h3>
    <ol class="tl">
      <li v-for="e in [...events].reverse()" :key="e.id" class="tl__item">
        <span class="tl__dot" :class="`tl__dot--${e.type}`" />
        <div>
          <p class="tl__text">{{ describe(e) }}</p>
          <p v-if="e.note && e.type !== 'triaged'" class="tl__note">{{ e.note }}</p>
          <p class="tl__time">{{ fmt(e.createdAt) }}</p>
        </div>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.tl__title {
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
}

.tl {
  list-style: none;
  margin: 0;
  padding: 0;
}

.tl__item {
  position: relative;
  display: flex;
  gap: 12px;
  padding-bottom: 14px;
}

.tl__item:not(:last-child)::before {
  content: '';
  position: absolute;
  left: 4px;
  top: 14px;
  bottom: 0;
  width: 2px;
  background: var(--line);
}

.tl__dot {
  width: 10px;
  height: 10px;
  margin-top: 4px;
  flex-shrink: 0;
  border-radius: 50%;
  background: var(--blue);
  box-shadow: 0 0 0 3px var(--bg);
}
.tl__dot--merged,
.tl__dot--extended { background: var(--orange); }
.tl__dot--created { background: var(--ink-3); }

.tl__text {
  font-size: 13px;
  font-weight: 600;
  color: var(--ink);
}

.tl__note {
  font-size: 12px;
  color: var(--ink-2);
}

.tl__time {
  font-size: 11.5px;
  color: var(--ink-3);
}
</style>
