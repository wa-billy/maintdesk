<template>
  <div :style="{ height: `${height}px` }">
    <Bar :data="chartData" :options="options" />
  </div>
</template>

<script setup>
  import { computed } from 'vue'
  import { Bar } from 'vue-chartjs'
  import '@/plugins/chart'

  const props = defineProps({
    items: { type: Array, default: () => [] },
    horizontal: { type: Boolean, default: false },
    color: { type: String, default: '#1976d2' },
  })
  const height = computed(() => Math.max(300, props.items.length * 40))

  const chartData = computed(() => ({
    labels: props.items.map(i => i.label),
    datasets: [{ label: 'จำนวน', data: props.items.map(i => i.value), backgroundColor: props.color }],
  }))
  const options = computed(() => ({
    indexAxis: props.horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: { x: { beginAtZero: true, ticks: { precision: 0 } }, y: { beginAtZero: true, ticks: { precision: 0 } } },
  }))
</script>
