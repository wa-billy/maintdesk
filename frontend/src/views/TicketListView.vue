<template>
  <v-container fluid>
    <v-card>
      <v-card-text>
        <TicketFilters v-model="filters" :categories="categories" />
      </v-card-text>

      <v-data-table-server
        :headers="headers"
        :items="tickets.items.value"
        :items-length="tickets.meta.value.total"
        :items-per-page="query.limit"
        :items-per-page-options="[10, 20, 50]"
        :loading="tickets.loading.value"
        mobile-breakpoint="md"
        :page="query.page"
        @update:items-per-page="limit => updateQuery({ limit, page: 1 })"
        @update:page="page => updateQuery({ page })"
      >
        <template #item.id="{ item }">
          <span class="text-medium-emphasis" :title="item.id">#{{ shortId(item.id) }}</span>
        </template>
        <template #item.category="{ item }">
          <div class="d-flex align-center ga-2">
            <CategoryAvatar :category="item.category" :size="28" />
            {{ item.category.name }}
          </div>
        </template>
        <template #item.status="{ item }">
          <StatusChip :status="item.status" />
        </template>
        <template #item.technician="{ item }">
          {{ item.technician?.full_name ?? '—' }}
        </template>
        <template #item.created_at="{ item }">
          {{ formatDate(item.created_at) }}
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-btn icon="mdi-eye" size="small" title="ดูรายละเอียด" :to="`/tickets/${item.id}`" variant="text" />
            <template v-if="ticketActions(item, auth.user).edit">
              <v-btn icon="mdi-pencil" size="small" title="แก้ไข" :to="`/tickets/${item.id}/edit`" variant="text" />
            </template>
            <template v-if="ticketActions(item, auth.user).remove">
              <v-btn color="error" icon="mdi-delete" size="small" title="ลบ" variant="text" @click="deleting = item" />
            </template>
          </div>
        </template>
        <template #no-data>
          <div class="py-6 text-medium-emphasis">ไม่พบใบงาน</div>
        </template>
      </v-data-table-server>
    </v-card>

    <ConfirmDialog
      :loading="tickets.loading.value"
      :model-value="!!deleting"
      :text="deleting ? `ลบใบงาน #${shortId(deleting.id)} ${deleting.title} ?` : ''"
      title="ยืนยันการลบ"
      @confirm="remove"
      @update:model-value="deleting = null"
    />
  </v-container>
</template>

<script setup>
  import { computed, onMounted, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import CategoryAvatar from '@/components/CategoryAvatar.vue'
  import ConfirmDialog from '@/components/ConfirmDialog.vue'
  import StatusChip from '@/components/StatusChip.vue'
  import TicketFilters from '@/components/TicketFilters.vue'
  import { useNotify } from '@/composables/useNotify'
  import { useResource } from '@/composables/useResource'
  import { categoriesApi, ticketsApi } from '@/services/api'
  import { useAuthStore } from '@/stores/auth'
  import { ticketActions } from '@/utils/ticketStatus'

  const headers = [
    { title: 'เลขที่', key: 'id', sortable: false },
    { title: 'หัวข้อ', key: 'title', sortable: false },
    { title: 'สถานที่', key: 'location', sortable: false },
    { title: 'หมวดหมู่', key: 'category', sortable: false },
    { title: 'สถานะ', key: 'status', sortable: false },
    { title: 'ช่าง', key: 'technician', sortable: false },
    { title: 'วันที่แจ้ง', key: 'created_at', sortable: false },
    { title: '', key: 'actions', sortable: false, align: 'end' },
  ]

  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()
  const notify = useNotify()
  const tickets = useResource(ticketsApi)
  const categories = ref([])
  const deleting = ref(null)

  const query = computed(() => ({
    q: route.query.q ?? '',
    status: route.query.status ?? null,
    category_id: route.query.category_id ?? null,
    page: Number(route.query.page) || 1,
    limit: Number(route.query.limit) || 10,
  }))

  function updateQuery (patch) {
    const next = { ...query.value, ...patch }
    const clean = Object.fromEntries(Object.entries(next).filter(([key, value]) =>
      value !== '' && value !== null && !(key === 'page' && value === 1) && !(key === 'limit' && value === 10)))
    router.replace({ query: clean })
  }

  const filters = computed({
    get: () => ({ q: query.value.q, status: query.value.status, category_id: query.value.category_id }),
    set: value => updateQuery({ ...value, page: 1 }),
  })

  async function load () {
    if (route.path !== '/tickets') return
    const { q, ...rest } = query.value
    await tickets.list({ ...rest, q: q || undefined })
    if (tickets.error.value?.response?.status === 422) return router.replace({ query: {} })
    if (tickets.items.value.length === 0 && query.value.page > 1) updateQuery({ page: query.value.page - 1 })
  }

  async function remove () {
    if (await tickets.remove(deleting.value.id)) {
      notify.success('ลบใบงานสำเร็จ')
      deleting.value = null
      load()
    }
  }

  const shortId = id => id.slice(-6)
  const formatDate = value => new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })

  watch(query, load, { immediate: true })
  onMounted(async () => {
    categories.value = (await categoriesApi.list()).data
  })
</script>
