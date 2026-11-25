<template>
  <div>
    <div class="text-subtitle-1 mb-2 d-flex align-center ga-2">
      <v-icon icon="mdi-history" />ประวัติ
    </div>
    <v-timeline align="start" density="compact" side="end">
      <v-timeline-item
        v-for="(log, i) in logs"
        :key="i"
        :dot-color="STATUS[log.to_status]?.color ?? 'grey'"
        :icon="STATUS[log.to_status]?.icon"
        size="small"
      >
        <div class="font-weight-medium">{{ title(log) }}</div>
        <div class="text-caption text-medium-emphasis">{{ log.actor }} · {{ formatDate(log.created_at) }}</div>
        <div v-if="log.note && log.from_status !== log.to_status" class="text-body-2 mt-1">{{ log.note }}</div>
      </v-timeline-item>
    </v-timeline>
  </div>
</template>

<script setup>
  import { STATUS } from '@/utils/ticketStatus'

  defineProps({ logs: { type: Array, default: () => [] } })

  const label = status => STATUS[status]?.label ?? status
  function title (log) {
    if (!log.from_status) return 'แจ้งซ่อม'
    if (log.from_status === log.to_status) return log.note || 'อัปเดตใบงาน'
    return `${label(log.from_status)} → ${label(log.to_status)}`
  }
  const formatDate = value => new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
</script>
