<script setup lang="ts">
withDefaults(
  defineProps<{
    size?: number
  }>(),
  { size: 18 },
)
</script>

<template>
  <svg
    class="ui-spinner"
    :width="size"
    :height="size"
    viewBox="0 0 24 24"
    fill="none"
    aria-hidden="true"
  >
    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-opacity="0.25" stroke-width="2.5" />
    <path
      d="M21 12a9 9 0 0 0-9-9"
      stroke="currentColor"
      stroke-width="2.5"
      stroke-linecap="round"
    />
  </svg>
</template>

<style scoped>
.ui-spinner {
  animation: ui-spin 0.75s linear infinite; /* linear is correct for progress */
}

@keyframes ui-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
