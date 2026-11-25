<template>
  <div style="height: 300px">
    <Doughnut :data="chartData" :options="options" />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { Doughnut } from 'vue-chartjs'
  import '@/plugins/chart'
  import { STATUS } from '@/utils/ticketStatus'

  const props = defineProps({ counts: { type: Object, required: true } })

  const chartData = computed(() => ({
    labels: Object.keys(STATUS).map(s => STATUS[s].label),
    datasets: [{
      data: Object.keys(STATUS).map(s => props.counts[s] ?? 0),
      backgroundColor: ['#2196f3', '#1976d2', '#fb8c00', '#4caf50', '#9e9e9e'],
    }],
  }))
  const options = { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }
</script>
