<template>
  <v-chip :color="info.color" label :prepend-icon="info.icon" size="small">{{ info.label }}</v-chip>
</template>

<script setup>
  import { computed } from 'vue'
  import { STATUS } from '@/utils/ticketStatus'

  const props = defineProps({ status: { type: String, required: true } })
  const info = computed(() => STATUS[props.status] ?? { label: props.status, icon: 'mdi-alert-circle', color: 'grey' })
</script>
