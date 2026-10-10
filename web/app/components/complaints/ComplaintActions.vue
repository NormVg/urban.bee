<script setup lang="ts">
import type { ComplaintStatus } from '#shared/triage/taxonomy'

/** Status actions with the copy officers expect. */
const props = defineProps<{
  status: ComplaintStatus
  updating: ComplaintStatus | null
  reference: string
}>()
const emit = defineEmits<{ change: [status: ComplaintStatus, message: string] }>()

const confirmReject = ref(false)

const isOpen = computed(() => ['received', 'triaged', 'in_progress'].includes(props.status))

function reject() {
  if (!confirmReject.value) {
    confirmReject.value = true
    return
  }
  confirmReject.value = false
  emit('change', 'rejected', `${props.reference} marked as not actionable`)
}
</script>

<template>
  <div class="actions">
    <template v-if="isOpen">
      <UiButton
        v-if="status !== 'in_progress'"
        variant="primary"
        icon-left="construction"
        :loading="updating === 'in_progress'"
        :disabled="!!updating"
        @click="emit('change', 'in_progress', `${reference}: work started`)"
      >
        Start work
      </UiButton>
      <UiButton
        :variant="status === 'in_progress' ? 'primary' : 'secondary'"
        icon-left="checkCircle"
        :loading="updating === 'resolved'"
        :disabled="!!updating"
        @click="emit('change', 'resolved', `${reference} marked as fixed`)"
      >
        Mark fixed
      </UiButton>
      <UiButton
        variant="ghost"
        :loading="updating === 'rejected'"
        :disabled="!!updating"
        @click="reject"
        @blur="confirmReject = false"
      >
        {{ confirmReject ? 'Tap again to confirm' : 'Not actionable' }}
      </UiButton>
    </template>
    <template v-else>
      <UiButton
        variant="outline"
        icon-left="refresh"
        :loading="updating === 'triaged'"
        :disabled="!!updating"
        @click="emit('change', 'triaged', `${reference} reopened`)"
      >
        Reopen
      </UiButton>
    </template>
  </div>
</template>

<style scoped>
.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
