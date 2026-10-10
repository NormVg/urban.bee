<script setup lang="ts">
import type { ComplaintSummary } from '#shared/types/complaint'
import { getDepartment } from '#shared/triage/taxonomy'
import { SEVERITY_META, STATUS_META, departmentIcon } from '~/constants/complaints'

const props = defineProps<{ complaint: ComplaintSummary; selected?: boolean }>()
defineEmits<{ select: []; hover: [on: boolean] }>()

const deptIcon = computed(() => departmentIcon(getDepartment(props.complaint.department)?.icon ?? 'building'))
const age = useTimeAgo(() => props.complaint.createdAt)
</script>

<template>
  <button
    type="button"
    class="citem"
    :class="{ 'is-selected': selected }"
    :aria-current="selected ? 'true' : undefined"
    @click="$emit('select')"
    @mouseenter="$emit('hover', true)"
    @mouseleave="$emit('hover', false)"
    @focus="$emit('hover', true)"
    @blur="$emit('hover', false)"
  >
    <span class="citem__thumb">
      <img :src="complaint.coverPhotoUrl" alt="" loading="lazy" />
      <span v-if="complaint.photoCount > 1" class="citem__more tnum">+{{ complaint.photoCount - 1 }}</span>
      <span class="citem__sev" :style="{ background: SEVERITY_META[complaint.severity].color }" />
    </span>

    <span class="citem__body">
      <span class="citem__top">
        <ComplaintPriorityBadge :priority="complaint.priority" />
        <span v-if="complaint.needsReview" class="citem__review"><UiIcon name="alert" :size="12" /> Check</span>
        <span class="citem__age">{{ age }}</span>
      </span>
      <span class="citem__title">{{ complaint.title }}</span>
      <span class="citem__meta">
        <UiIcon :name="deptIcon" :size="13" />
        <span>{{ complaint.departmentLabel }}</span>
        <span class="citem__dot">·</span>
        <span>{{ STATUS_META[complaint.status].label }}</span>
        <template v-if="complaint.reportCount > 1">
          <span class="citem__dot">·</span>
          <span class="citem__people"><UiIcon name="users" :size="12" /> {{ complaint.reportCount }}</span>
        </template>
      </span>
      <span v-if="complaint.address" class="citem__addr">{{ complaint.address }}</span>
    </span>
  </button>
</template>

<style scoped>
.citem {
  display: flex;
  gap: 12px;
  width: 100%;
  padding: 12px;
  border: 1px solid transparent;
  border-radius: var(--r-md);
  background: transparent;
  text-align: left;
  cursor: pointer;
  transition:
    background-color var(--t-fast) var(--ease-in-out),
    border-color var(--t-fast) var(--ease-in-out);
  content-visibility: auto;
  contain-intrinsic-size: auto 96px;
}

.citem:hover {
  background: var(--surface);
}

.citem.is-selected {
  background: var(--surface);
  border-color: var(--blue);
  box-shadow: var(--sh-1);
}

.citem__thumb {
  position: relative;
  width: 72px;
  height: 72px;
  flex-shrink: 0;
  border-radius: var(--r-sm);
  overflow: hidden;
  background: var(--surface-inset);
}

.citem__thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.citem__more {
  position: absolute;
  right: 4px;
  bottom: 4px;
  padding: 1px 6px;
  border-radius: var(--r-pill);
  background: rgba(36, 28, 19, 0.7);
  color: #fff;
  font-size: 10.5px;
  font-weight: 650;
}

.citem__sev {
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  width: 4px;
}

.citem__body {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 3px;
}

.citem__top {
  display: flex;
  align-items: center;
  gap: 8px;
}

.citem__review {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  font-weight: 650;
  color: var(--warning);
}

.citem__age {
  margin-left: auto;
  font-size: 11.5px;
  color: var(--ink-3);
  white-space: nowrap;
}

.citem__title {
  font-size: 13.5px;
  font-weight: 650;
  color: var(--ink);
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.citem__meta {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--ink-2);
  white-space: nowrap;
  overflow: hidden;
}

.citem__dot { color: var(--ink-3); }

.citem__people {
  display: inline-flex;
  align-items: center;
  gap: 3px;
}

.citem__addr {
  font-size: 11.5px;
  color: var(--ink-3);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
</style>
