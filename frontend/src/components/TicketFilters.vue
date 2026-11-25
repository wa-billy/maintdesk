<template>
  <v-row dense>
    <v-col cols="12" md="4">
      <v-text-field
        v-model="q"
        clearable
        density="compact"
        hide-details
        label="ค้นหาหัวข้อหรือสถานที่"
        prepend-inner-icon="mdi-magnify"
      />
    </v-col>
    <v-col cols="12" md="3" sm="6">
      <v-select
        clearable
        density="compact"
        hide-details
        :items="STATUS_OPTIONS"
        label="สถานะ"
        :model-value="filters.status"
        prepend-inner-icon="mdi-filter-variant"
        @update:model-value="set('status', $event)"
      />
    </v-col>
    <v-col cols="12" md="3" sm="6">
      <v-select
        clearable
        density="compact"
        hide-details
        item-title="name"
        item-value="id"
        :items="categories"
        label="หมวดหมู่"
        :model-value="filters.category_id"
        prepend-inner-icon="mdi-tag"
        @update:model-value="set('category_id', $event)"
      />
    </v-col>
    <v-col class="d-flex align-center" cols="12" md="2">
      <v-btn block variant="tonal" @click="clear">ล้างตัวกรอง</v-btn>
    </v-col>
  </v-row>
</template>

<script setup>
  import { ref, watch } from 'vue'
  import { STATUS_OPTIONS } from '@/utils/ticketStatus'

  const filters = defineModel({ type: Object, required: true })
  defineProps({ categories: { type: Array, default: () => [] } })

  const set = (key, value) => (filters.value = { ...filters.value, [key]: value ?? null })

  const q = ref(filters.value.q)
  let timer
  watch(q, value => {
    clearTimeout(timer)
    if ((value ?? '') === filters.value.q) return
    timer = setTimeout(() => set('q', value ?? ''), 300)
  })
  watch(() => filters.value.q, value => (q.value = value))

  function clear () {
    clearTimeout(timer)
    filters.value = { q: '', status: null, category_id: null }
  }
</script>
