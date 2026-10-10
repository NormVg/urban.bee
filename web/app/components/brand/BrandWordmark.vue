<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: 'sm' | 'md' | 'lg'
    /** Variant for use on the deep blue sidebar */
    onBlue?: boolean
    /** Render only the hexagon sigil, no word (e.g. page corner) */
    markOnly?: boolean
    /** Hide the hexagon sigil, word only (e.g. centered splash) */
    showMark?: boolean
  }>(),
  { size: 'md', showMark: true },
)
</script>

<template>
  <span class="brand" :class="[{ 'brand--on-blue': onBlue }, `brand--${size}`]">
    <img
      v-if="showMark"
      class="brand__mark"
      src="/logo.png"
      alt=""
      aria-hidden="true"
      draggable="false"
    >

    <span v-if="!markOnly" class="brand__word">
      urban<span class="brand__dot">.</span><span class="brand__bee">bee</span>
    </span>
  </span>
</template>

<style scoped>
.brand {
  display: inline-flex;
  align-items: center;
  gap: 12px;
  color: var(--blue);
}

.brand--on-blue {
  color: var(--on-blue);
}

.brand__mark {
  flex-shrink: 0;
  display: block;
  width: 28px;
  height: 28px;
  object-fit: contain;
  transition: transform var(--t-med) var(--ease-out);
}

a:hover .brand__mark,
.brand:hover .brand__mark {
  transform: rotate(-6deg) scale(1.05);
}

.brand__word {
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
  white-space: nowrap;
}

.brand--on-blue .brand__word {
  color: var(--on-blue);
}

.brand__dot {
  color: var(--orange);
}

.brand__bee {
  color: var(--blue);
}

.brand--on-blue .brand__bee {
  color: var(--on-blue);
}

/* --- sizes --- */
.brand--sm .brand__mark {
  width: 48px;
  height: 48px;
}
.brand--md .brand__mark {
  width: 32px;
  height: 32px;
}
.brand--md .brand__word {
  font-size: 17px;
}

.brand--lg {
  flex-direction: column;
  gap: 20px;
}
.brand--lg .brand__mark {
  width: 72px;
  height: 72px;
}
.brand--lg .brand__word {
  font-size: clamp(44px, 8vw, 76px);
  line-height: 1;
}
</style>
