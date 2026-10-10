<script setup lang="ts">
import type { ComplaintStatus } from '#shared/triage/taxonomy'
import type { ComplaintDetail } from '#shared/types/complaint'
import { STATUS_META } from '~/constants/complaints'
import { formatTimeAgo } from '~/composables/useTimeAgo'

/** Full complaint view, shared by the map drawer and the /complaints/[id] page. */
const props = defineProps<{
  complaint: ComplaintDetail
  updating: ComplaintStatus | null
}>()
defineEmits<{ change: [status: ComplaintStatus, message: string] }>()

const points = computed(() =>
  props.complaint.reports.map((r) => ({ latitude: r.latitude, longitude: r.longitude, relation: r.relation })),
)

const mapsUrl = computed(
  () => `https://www.google.com/maps/search/?api=1&query=${props.complaint.latitude},${props.complaint.longitude}`,
)

const { notify } = useToast()
async function copyReference() {
  await navigator.clipboard?.writeText(props.complaint.reference)
  notify({ tone: 'info', message: `${props.complaint.reference} copied` })
}
</script>

<template>
  <article class="cdetail">
    <header class="cdetail__head u-rise">
      <div class="cdetail__badges">
        <button type="button" class="cdetail__ref tnum" title="Copy reference" @click="copyReference">
          {{ complaint.reference }} <UiIcon name="copy" :size="12" />
        </button>
        <ComplaintPriorityBadge :priority="complaint.priority" show-label />
        <UiBadge :tone="STATUS_META[complaint.status].tone" :icon="STATUS_META[complaint.status].icon">
          {{ STATUS_META[complaint.status].label }}
        </UiBadge>
      </div>
      <h2 class="cdetail__title">{{ complaint.title }}</h2>
      <p class="cdetail__sub">
        {{ complaint.departmentLabel }} · reported {{ formatTimeAgo(complaint.createdAt) }}
        <template v-if="complaint.reportCount > 1"> · by {{ complaint.reportCount }} people</template>
        <template v-if="complaint.extentM > 0"> · covers about {{ Math.round(complaint.extentM * 2) }} m</template>
      </p>
      <ComplaintActions
        class="cdetail__actions"
        :status="complaint.status"
        :updating="updating"
        :reference="complaint.reference"
        @change="(s, m) => $emit('change', s, m)"
      />
    </header>

    <div class="cdetail__cols">
      <div class="cdetail__col">
        <ComplaintGallery class="u-rise" :style="{ '--stagger': '40ms' }" :photos="complaint.photos" />

        <ComplaintAiCard class="u-rise" :style="{ '--stagger': '80ms' }" :complaint="complaint" />

        <section class="cdetail__where u-rise" :style="{ '--stagger': '120ms' }" aria-labelledby="where-title">
          <div class="cdetail__where-head">
            <h3 id="where-title" class="cdetail__h3">Where</h3>
            <UiButton variant="ghost" size="sm" icon-right="externalLink" :to="mapsUrl" target="_blank">
              Open in Google Maps
            </UiButton>
          </div>
          <p class="cdetail__addr"><UiIcon name="mapPin" :size="14" /> {{ complaint.address ?? 'Address not available' }}</p>
          <div class="cdetail__map">
            <ClientOnly>
              <ComplaintMap :complaints="[complaint]" :points="points" :selected-id="complaint.id" mini />
            </ClientOnly>
          </div>
        </section>
      </div>

      <div class="cdetail__col">
        <ComplaintEvidence class="u-rise" :style="{ '--stagger': '160ms' }" :reports="complaint.reports" />

        <ComplaintTrace v-if="complaint.aiTrace.length" class="u-rise" :style="{ '--stagger': '200ms' }" :steps="complaint.aiTrace" />

        <ComplaintTimeline class="u-rise" :style="{ '--stagger': '240ms' }" :events="complaint.events" />
      </div>
    </div>
  </article>
</template>

<style scoped>
.cdetail {
  container-type: inline-size;
  display: flex;
  flex-direction: column;
  gap: 22px;
}

/* One column in the side panel; two on the full page when there is room. */
.cdetail__cols,
.cdetail__col {
  display: flex;
  flex-direction: column;
  gap: 22px;
  min-width: 0;
}

@container (min-width: 960px) {
  .cdetail__cols {
    display: grid;
    grid-template-columns: minmax(0, 1.25fr) minmax(0, 1fr);
    align-items: start;
    gap: 28px;
  }
}

.cdetail__badges {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.cdetail__ref {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 3px 8px;
  border: 1px solid var(--line);
  border-radius: var(--r-pill);
  background: var(--surface-2);
  font-size: 11.5px;
  font-weight: 700;
  color: var(--ink-2);
  cursor: pointer;
}
.cdetail__ref:hover { color: var(--ink); border-color: var(--line-strong); }

.cdetail__title {
  margin-top: 10px;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.015em;
  line-height: 1.25;
}

.cdetail__sub {
  margin-top: 4px;
  font-size: 13px;
  color: var(--ink-3);
}

.cdetail__actions {
  margin-top: 14px;
}

.cdetail__where-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.cdetail__h3 {
  font-size: 14px;
  font-weight: 700;
}

.cdetail__addr {
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 4px 0 10px;
  font-size: 13px;
  color: var(--ink-2);
}

.cdetail__map {
  position: relative;
  height: 220px;
  overflow: hidden;
  border-radius: var(--r-md);
}
</style>
