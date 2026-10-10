<script setup lang="ts">
import { ICONS, type IconName } from '~/constants/icons'

const props = withDefaults(
  defineProps<{
    /** Name from the central icon registry (app/constants/icons.ts) */
    name: IconName
    /** Pixel size (square) */
    size?: number
    /** Accessible label; omit for decorative icons */
    label?: string
  }>(),
  { size: 18 },
)

/* ICONS holds real Lucide component objects, so :is resolves directly. */
const icon = computed(() => ICONS[props.name])
</script>

<template>
  <component
    :is="icon"
    :size="size"
    :stroke-width="1.75"
    :role="label ? 'img' : undefined"
    :aria-label="label"
    :aria-hidden="label ? undefined : 'true'"
    class="ui-icon"
  />
</template>
