<script setup lang="ts">
/** Compact voice-note player: play/pause, progress, time. */
const props = defineProps<{
  src: string
  durationMs?: number | null
}>()

const audio = ref<HTMLAudioElement | null>(null)
const playing = ref(false)
const current = ref(0)
const duration = ref((props.durationMs ?? 0) / 1000)

const progress = computed(() => (duration.value ? Math.min(100, (current.value / duration.value) * 100) : 0))

const fmt = (s: number) => {
  if (!Number.isFinite(s) || s <= 0) return '0:00'
  return `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

function toggle() {
  const el = audio.value
  if (!el) return
  if (el.paused) el.play()
  else el.pause()
}

function seek(event: MouseEvent) {
  const el = audio.value
  const bar = event.currentTarget as HTMLElement
  if (!el || !duration.value) return
  const ratio = (event.clientX - bar.getBoundingClientRect().left) / bar.clientWidth
  el.currentTime = Math.max(0, Math.min(1, ratio)) * duration.value
}

function onMeta() {
  const d = audio.value?.duration
  if (d && Number.isFinite(d)) duration.value = d
}
</script>

<template>
  <div class="ui-audio">
    <audio
      ref="audio"
      :src="src"
      preload="metadata"
      @play="playing = true"
      @pause="playing = false"
      @ended="playing = false"
      @timeupdate="current = audio?.currentTime ?? 0"
      @loadedmetadata="onMeta"
    />
    <button type="button" class="ui-audio__btn" :aria-label="playing ? 'Pause voice note' : 'Play voice note'" @click="toggle">
      <UiIcon :name="playing ? 'pause' : 'play'" :size="15" />
    </button>
    <div class="ui-audio__track" role="slider" aria-label="Voice note position" :aria-valuenow="Math.round(progress)" aria-valuemin="0" aria-valuemax="100" tabindex="0" @click="seek">
      <span class="ui-audio__fill" :style="{ width: `${progress}%` }" />
    </div>
    <span class="ui-audio__time tnum">{{ fmt(playing || current ? current : duration) }}</span>
  </div>
</template>

<style scoped>
.ui-audio {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 6px 12px 6px 6px;
  border-radius: var(--r-pill);
  background: var(--surface-2);
  border: 1px solid var(--line);
}

.ui-audio__btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  flex-shrink: 0;
  border: none;
  border-radius: 50%;
  background: var(--blue);
  color: var(--on-blue);
  cursor: pointer;
  transition: background-color var(--t-fast) var(--ease-in-out), transform var(--t-fast) var(--ease-in-out);
}
.ui-audio__btn:hover { background: var(--blue-deep); }
.ui-audio__btn:active { transform: scale(0.94); }

.ui-audio__track {
  position: relative;
  flex: 1;
  height: 6px;
  border-radius: 3px;
  background: var(--surface-inset);
  cursor: pointer;
  overflow: hidden;
}

.ui-audio__fill {
  position: absolute;
  inset: 0 auto 0 0;
  border-radius: 3px;
  background: var(--orange);
  transition: width 120ms linear;
}

.ui-audio__time {
  font-size: 12px;
  font-weight: 600;
  color: var(--ink-2);
  min-width: 34px;
  text-align: right;
}
</style>
