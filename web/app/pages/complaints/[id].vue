<script setup lang="ts">
definePageMeta({ layout: 'dashboard' })

const route = useRoute()
const id = computed(() => String(route.params.id))
const { complaint, pending, error, updating, setStatus } = useComplaint(id)

useHead({ title: computed(() => (complaint.value ? `${complaint.value.reference} · urban.bee` : 'Problem · urban.bee')) })
</script>

<template>
  <div class="cfull">
    <UiButton class="cfull__back" variant="ghost" size="sm" icon-left="arrowLeft" :to="`/complaints?id=${id}`">
      Back to map
    </UiButton>

    <div v-if="pending" class="cfull__loading">
      <UiSkeleton height="28px" width="50%" />
      <UiSkeleton height="320px" radius="var(--r-md)" />
    </div>

    <UiEmptyState
      v-else-if="error || !complaint"
      tone="danger"
      icon="alert"
      title="We couldn't find this problem"
      description="It may have been removed, or the link is wrong."
    >
      <UiButton variant="outline" size="sm" to="/complaints">See all problems</UiButton>
    </UiEmptyState>

    <ComplaintDetailView v-else :complaint="complaint" :updating="updating" @change="setStatus" />
  </div>
</template>

<style scoped>
.cfull {
  width: 100%;
  max-width: 1240px;
  margin: 0 auto;
}

.cfull__back {
  margin-bottom: 14px;
  margin-left: -8px;
}

.cfull__loading {
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
