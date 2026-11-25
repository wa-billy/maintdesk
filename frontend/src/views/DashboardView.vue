<template>
  <v-container fluid>
    <v-progress-linear v-if="loading" color="primary" indeterminate />

    <template v-if="summary">
      <!-- การ์ดสถานะ: ทุก role กดแล้วไปรายการที่กรองตามสถานะ -->
      <v-row dense>
        <v-col v-for="(info, key) in STATUS" :key="key" cols="6" md="4" lg="2">
          <v-card
            class="text-center pa-3 status-card"
            :color="info.color"
            :prepend-icon="info.icon"
            :title="info.label"
            variant="tonal"
            @click="router.push({ path: '/tickets', query: { status: key } })"
          >
            <div class="text-h4 mt-2">{{ summary.status_counts[key] ?? 0 }}</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- ใบงานล่าสุด -->
      <v-card class="mt-4" title="ใบงานล่าสุด 5 รายการ">
        <v-list lines="one">
          <v-list-item
            v-for="t in summary.recent"
            :key="t.id"
            :title="t.title"
            :to="`/tickets/${t.id}`"
          >
            <template #append>
              <StatusChip :status="t.status" />
            </template>
          </v-list-item>
          <v-list-item v-if="!summary.recent.length" title="ไม่มีใบงาน" />
        </v-list>
      </v-card>

      <!-- การ์ดที่ต้องลงมือทำ และเวลาซ่อมเฉลี่ย -->
      <v-row class="mt-2" dense>
        <v-col v-if="isAdmin" cols="12" md="6">
          <v-card color="warning" prepend-icon="mdi-account-alert" title="ยังไม่มีช่างรับ" variant="tonal">
            <div class="text-h4 mt-2">{{ summary.unassigned }}</div>
          </v-card>
        </v-col>
        <v-col v-if="summary.avg_resolve_hours !== undefined" cols="12" md="6">
          <v-card color="success" prepend-icon="mdi-timer-outline" title="เวลาซ่อมเฉลี่ย (ชั่วโมง)" variant="tonal">
            <div class="text-h4 mt-2">{{ summary.avg_resolve_hours ?? '—' }}</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- กราฟ -->
      <v-row class="mt-2" dense>
        <v-col cols="12" md="6">
          <v-card title="สัดส่วนสถานะ">
            <v-card-text><StatusDoughnut :counts="summary.status_counts" /></v-card-text>
          </v-card>
        </v-col>
        <template v-if="isAdmin">
          <v-col cols="12" md="6">
            <v-card title="ใบงานตามหมวดหมู่">
              <v-card-text>
                <CountBar :items="summary.by_category.map(c => ({ label: c.name, value: c.count }))" />
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card title="งานค้างของช่าง">
              <v-card-text>
                <CountBar
                  color="#fb8c00"
                  horizontal
                  :items="summary.technician_load.map(t => ({ label: t.full_name, value: t.open }))"
                />
              </v-card-text>
            </v-card>
          </v-col>
          <v-col cols="12" md="6">
            <v-card title="แจ้งใหม่ 7 วันย้อนหลัง">
              <v-card-text>
                <CountBar :items="summary.daily_new.map(d => ({ label: d.date.slice(5), value: d.count }))" />
              </v-card-text>
            </v-card>
          </v-col>
        </template>
      </v-row>
    </template>
  </v-container>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import CountBar from '@/components/charts/CountBar.vue'
  import StatusDoughnut from '@/components/charts/StatusDoughnut.vue'
  import StatusChip from '@/components/StatusChip.vue'
  import { api } from '@/services/api'
  import { useAuthStore } from '@/stores/auth'
  import { STATUS } from '@/utils/ticketStatus'

  const router = useRouter()
  const auth = useAuthStore()
  const isAdmin = computed(() => auth.user?.role === 'admin')
  const summary = ref(null)
  const loading = ref(false)

  async function load () {
    loading.value = true
    try {
      summary.value = (await api.get('/dashboard/summary')).data
    } finally {
      loading.value = false
    }
  }
  onMounted(load)
  watch(() => auth.user?.id, (id, old) => id !== old && load())
</script>

<style scoped>
  .status-card { cursor: pointer; }
</style>
