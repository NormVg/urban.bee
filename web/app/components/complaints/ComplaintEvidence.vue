<script setup lang="ts">
import type { ComplaintReportDto } from '#shared/types/complaint'
import { MATCH_REASON_LABEL, RELATION_META } from '~/constants/complaints'
import { formatTimeAgo } from '~/composables/useTimeAgo'

/** What each citizen sent: note, voice note + transcript, how it was linked. */
defineProps<{ reports: ComplaintReportDto[] }>()

const LANGUAGES = new Intl.DisplayNames(['en'], { type: 'language' })
const languageName = (code: string | null) => {
  if (!code) return null
  try {
    return LANGUAGES.of(code) ?? code
  } catch {
    return code
  }
}
</script>

<template>
  <section class="evidence" aria-labelledby="evidence-title">
    <h3 id="evidence-title" class="evidence__title">
      What citizens told us
      <span class="evidence__count tnum">{{ reports.length }}</span>
    </h3>

    <ol class="evidence__list">
      <li v-for="r in reports" :key="r.id" class="report">
        <header class="report__head">
          <UiAvatar :name="r.userName" size="sm" />
          <div class="report__who">
            <span class="report__name">{{ r.userName }}</span>
            <span class="report__when">{{ formatTimeAgo(r.createdAt) }}</span>
          </div>
          <UiBadge :tone="RELATION_META[r.relation].tone">{{ RELATION_META[r.relation].label }}</UiBadge>
        </header>

        <p v-if="r.matchReason" class="report__match">
          <UiIcon name="repeat" :size="12" />
          {{ MATCH_REASON_LABEL[r.matchReason] }}<template v-if="r.matchScore"> · {{ Math.round(r.matchScore * 100) }}% sure</template><template v-if="r.distanceM !== null"> · {{ Math.round(r.distanceM) }} m away</template>
        </p>

        <p v-if="r.description" class="report__note">“{{ r.description }}”</p>

        <div v-if="r.audioUrl" class="report__voice">
          <UiAudioPlayer :src="r.audioUrl" :duration-ms="r.audioDurationMs" />
          <p v-if="r.transcript" class="report__transcript">
            <span class="report__lang">{{ languageName(r.transcriptLanguage) ?? 'Voice note' }}</span>
            {{ r.transcript }}
          </p>
        </div>

        <p v-if="!r.description && !r.audioUrl" class="report__photo-only">
          <UiIcon name="camera" :size="12" /> Sent {{ r.photoUrls.length }} {{ r.photoUrls.length === 1 ? 'photo' : 'photos' }}, no note
        </p>
      </li>
    </ol>
  </section>
</template>

<style scoped>
.evidence__title {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 10px;
  font-size: 14px;
  font-weight: 700;
}

.evidence__count {
  padding: 1px 8px;
  border-radius: var(--r-pill);
  background: var(--surface-inset);
  font-size: 11.5px;
  color: var(--ink-2);
}

.evidence__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.report {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px;
  border-radius: var(--r-md);
  background: var(--surface);
  border: 1px solid var(--line);
}

.report__head {
  display: flex;
  align-items: center;
  gap: 10px;
}

.report__who {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.report__name {
  font-size: 13px;
  font-weight: 650;
}

.report__when {
  font-size: 11.5px;
  color: var(--ink-3);
}

.report__match {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--ink-3);
}

.report__note {
  font-size: 13.5px;
  line-height: 1.5;
  color: var(--ink);
}

.report__voice {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.report__transcript {
  font-size: 13px;
  line-height: 1.5;
  color: var(--ink-2);
}

.report__lang {
  display: inline-block;
  margin-right: 6px;
  padding: 0 6px;
  border-radius: var(--r-micro);
  background: var(--blue-tint);
  color: var(--blue);
  font-size: 11px;
  font-weight: 650;
}

.report__photo-only {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--ink-3);
}
</style>
