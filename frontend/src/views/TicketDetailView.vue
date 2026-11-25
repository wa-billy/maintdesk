<template>
  <v-container>
    <v-progress-linear v-if="loading && !ticket" color="primary" indeterminate />

    <v-card v-else-if="!ticket" class="pa-8 text-center">
      <v-icon color="grey" icon="mdi-alert-circle" size="48" />
      <div class="text-h6 mt-2">ไม่พบใบงาน</div>
      <v-btn class="mt-4" prepend-icon="mdi-arrow-left" to="/tickets" variant="tonal">กลับไปรายการใบงาน</v-btn>
    </v-card>

    <template v-else>
      <v-card :loading="loading">
        <v-card-title class="d-flex flex-wrap align-center ga-2">
          <v-btn icon="mdi-arrow-left" size="small" title="ย้อนกลับ" variant="text" @click="router.back()" />
          <span class="text-medium-emphasis" :title="ticket.id">#{{ ticket.id.slice(-6) }}</span>
          <span class="text-wrap">{{ ticket.title }}</span>
          <StatusChip :status="ticket.status" />
        </v-card-title>

        <v-card-text>
          <v-row dense>
            <v-col cols="12" md="6">
              <v-list density="compact">
                <v-list-item title="หมวดหมู่">
                  <template #prepend><CategoryAvatar class="me-4" :category="ticket.category" :size="32" /></template>
                  <v-list-item-subtitle>{{ ticket.category.name }}</v-list-item-subtitle>
                </v-list-item>
                <v-list-item prepend-icon="mdi-map-marker" :subtitle="ticket.location" title="สถานที่" />
                <v-list-item prepend-icon="mdi-account" :subtitle="ticket.reporter.full_name" title="ผู้แจ้ง" />
                <v-list-item prepend-icon="mdi-account-hard-hat" :subtitle="ticket.technician?.full_name ?? 'ยังไม่มอบหมาย'" title="ช่าง" />
                <v-list-item prepend-icon="mdi-history" :subtitle="formatDate(ticket.created_at)" title="วันที่แจ้ง" />
                <v-list-item v-if="ticket.repair_cost !== null" prepend-icon="mdi-cash" :subtitle="formatMoney(ticket.repair_cost)" title="ค่าใช้จ่าย" />
              </v-list>
            </v-col>
            <v-col cols="12" md="6">
              <div class="text-subtitle-2 mb-1">รายละเอียด</div>
              <p class="text-body-1" style="white-space: pre-line">{{ ticket.description }}</p>
            </v-col>
          </v-row>

          <div class="d-flex flex-wrap ga-2 my-4">
            <v-btn v-if="actions.assign" color="primary" prepend-icon="mdi-account-hard-hat" @click="openAssign">
              {{ ticket.technician ? 'เปลี่ยนช่าง' : 'มอบงาน' }}
            </v-btn>
            <v-btn v-if="actions.start" color="primary" prepend-icon="mdi-play-circle" @click="dialog = 'start'">เริ่มงาน</v-btn>
            <v-btn v-if="actions.repairImage" prepend-icon="mdi-camera" variant="tonal" @click="openRepairImage">
              {{ ticket.repair_image_url ? 'เปลี่ยนรูปหลังซ่อม' : 'แนบรูปหลังซ่อม' }}
            </v-btn>
            <v-tooltip v-if="actions.close" :disabled="!!ticket.repair_image_url" location="top" text="กรุณาแนบรูปหลังซ่อมก่อนปิดงาน">
              <template #activator="{ props: tip }">
                <span v-bind="tip">
                  <v-btn color="success" :disabled="!ticket.repair_image_url" prepend-icon="mdi-check-circle" @click="openClose">ปิดงาน</v-btn>
                </span>
              </template>
            </v-tooltip>
            <v-btn v-if="actions.edit" prepend-icon="mdi-pencil" :to="`/tickets/${ticket.id}/edit`" variant="tonal">แก้ไข</v-btn>
            <v-btn v-if="actions.cancel" color="error" prepend-icon="mdi-close-circle" variant="tonal" @click="openCancel">ยกเลิก</v-btn>
            <v-btn v-if="actions.remove" color="error" prepend-icon="mdi-delete" variant="tonal" @click="dialog = 'remove'">ลบ</v-btn>
          </div>

          <v-row>
            <v-col cols="12" md="6">
              <ImagePreview icon="mdi-paperclip" label="ก่อนซ่อม" :src="ticket.report_attachment_url" />
            </v-col>
            <v-col cols="12" md="6">
              <ImagePreview icon="mdi-camera" label="หลังซ่อม" :src="ticket.repair_image_url" />
            </v-col>
          </v-row>
        </v-card-text>
      </v-card>

      <v-card class="mt-4">
        <v-card-text>
          <TicketTimeline :logs="ticket.logs" />
        </v-card-text>
      </v-card>
    </template>

    <!-- มอบงาน / เปลี่ยนช่าง (admin) -->
    <v-dialog max-width="440" :model-value="dialog === 'assign'" persistent>
      <v-card :title="ticket?.technician ? 'เปลี่ยนช่าง' : 'มอบงาน'">
        <v-card-text>
          <v-select
            v-model="technicianId"
            :error-messages="fieldErrors.technician_id"
            item-title="full_name"
            item-value="id"
            :items="technicians"
            label="เลือกช่าง"
            :loading="!technicians.length && saving"
            prepend-inner-icon="mdi-account-hard-hat"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="saving" @click="dialog = null">ยกเลิก</v-btn>
          <v-btn color="primary" :disabled="!technicianId" :loading="saving" prepend-icon="mdi-content-save" variant="flat" @click="assign">
            บันทึก
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- แนบ / เปลี่ยนรูปหลังซ่อม (ช่าง) -->
    <v-dialog max-width="480" :model-value="dialog === 'repairImage'" persistent>
      <v-card title="รูปหลังซ่อม">
        <v-card-text>
          <v-form ref="imageForm">
            <v-file-input
              v-model="repairFile"
              accept="image/jpeg,image/png"
              capture="environment"
              :error-messages="fieldErrors.repair_image"
              hint="jpg หรือ png ไม่เกิน 5 MB"
              label="เลือกหรือถ่ายรูป"
              persistent-hint
              prepend-icon=""
              prepend-inner-icon="mdi-camera"
              :rules="[imageRule]"
              @update:model-value="fieldErrors.repair_image = null"
            />
          </v-form>
          <ImagePreview v-if="repairPreview" class="mt-4" :src="repairPreview" />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="saving" @click="dialog = null">ยกเลิก</v-btn>
          <v-btn color="primary" :disabled="!repairFileOne" :loading="saving" prepend-icon="mdi-file-upload" variant="flat" @click="uploadRepairImage">
            อัปโหลด
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- ปิดงาน (ช่าง) -->
    <v-dialog max-width="480" :model-value="dialog === 'close'" persistent>
      <v-card title="ปิดงาน">
        <v-card-text>
          <v-form ref="closeForm">
            <v-textarea v-model="note" label="บันทึกการซ่อม" rows="3" />
            <v-text-field
              v-model="repairCost"
              :error-messages="fieldErrors.repair_cost"
              label="ค่าใช้จ่าย (บาท, ไม่บังคับ)"
              min="0"
              prepend-inner-icon="mdi-cash"
              :rules="[costRule]"
              step="0.01"
              type="number"
              @update:model-value="fieldErrors.repair_cost = null"
            />
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="saving" @click="dialog = null">ยกเลิก</v-btn>
          <v-btn color="success" :loading="saving" prepend-icon="mdi-check-circle" variant="flat" @click="closeTicket">ปิดงาน</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ConfirmDialog
      color="primary"
      confirm-icon="mdi-play-circle"
      confirm-text="เริ่มงาน"
      :loading="saving"
      :model-value="dialog === 'start'"
      :text="`เริ่มซ่อมใบงาน #${ticket?.id.slice(-6)} ${ticket?.title} ?`"
      title="เริ่มงาน"
      @confirm="changeStatus({ status: 'in_progress' }, 'เริ่มงานแล้ว')"
      @update:model-value="dialog = null"
    />

    <ConfirmDialog
      confirm-icon="mdi-close-circle"
      confirm-text="ยกเลิกใบงาน"
      :loading="saving"
      :model-value="dialog === 'cancel'"
      :text="`ยกเลิกใบงาน #${ticket?.id.slice(-6)} ${ticket?.title} ?`"
      title="ยกเลิกใบงาน"
      @confirm="changeStatus({ status: 'cancelled', note: note || null }, 'ยกเลิกใบงานแล้ว')"
      @update:model-value="dialog = null"
    >
      <v-textarea v-model="note" class="mt-4" label="เหตุผล" rows="2" />
    </ConfirmDialog>

    <ConfirmDialog
      :loading="saving"
      :model-value="dialog === 'remove'"
      :text="`ลบใบงาน #${ticket?.id.slice(-6)} ${ticket?.title} ?`"
      title="ยืนยันการลบ"
      @confirm="remove"
      @update:model-value="dialog = null"
    />
  </v-container>
</template>

<script setup>
  import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import CategoryAvatar from '@/components/CategoryAvatar.vue'
  import ConfirmDialog from '@/components/ConfirmDialog.vue'
  import ImagePreview from '@/components/ImagePreview.vue'
  import StatusChip from '@/components/StatusChip.vue'
  import TicketTimeline from '@/components/TicketTimeline.vue'
  import { useNotify } from '@/composables/useNotify'
  import { useResource } from '@/composables/useResource'
  import { api, ticketsApi } from '@/services/api'
  import { useAuthStore } from '@/stores/auth'
  import { ticketActions } from '@/utils/ticketStatus'
  import { toFormData } from '@/utils/toFormData'

  const route = useRoute()
  const router = useRouter()
  const auth = useAuthStore()
  const notify = useNotify()
  const tickets = useResource(ticketsApi)

  const ticket = computed(() => tickets.item.value)
  const loading = computed(() => tickets.loading.value)
  const actions = computed(() => ticket.value ? ticketActions(ticket.value, auth.user) : {})

  const dialog = ref(null)
  const saving = ref(false)
  const fieldErrors = reactive({})
  const technicians = ref([])
  const technicianId = ref(null)
  const note = ref('')
  const repairCost = ref('')
  const repairFile = ref(null)
  const repairPreview = ref(null)
  const imageForm = ref()
  const closeForm = ref()

  const load = () => tickets.get(route.params.id)
  onMounted(load)

  async function run (request, message) {
    saving.value = true
    try {
      await request()
      notify.success(message)
      dialog.value = null
      await load()
      return true
    } catch (error) {
      if (error.response?.status === 422) {
        for (const e of error.response.data.errors ?? []) fieldErrors[e.field] = e.message
      } else {
        dialog.value = null
        await load()
      }
      return false
    } finally {
      saving.value = false
    }
  }

  const changeStatus = (body, message) => run(() => api.patch(`/tickets/${ticket.value.id}/status`, body), message)

  async function openAssign () {
    technicianId.value = ticket.value.technician?.id ?? null
    fieldErrors.technician_id = null
    dialog.value = 'assign'
    if (!technicians.value.length) {
      technicians.value = (await api.get('/admin/users', { params: { role: 'technician', is_active: true, limit: 50 } })).data
    }
  }
  const assign = () => run(() => api.patch(`/admin/tickets/${ticket.value.id}/assign`, { technician_id: technicianId.value }), 'มอบงานสำเร็จ')

  const repairFileOne = computed(() => (Array.isArray(repairFile.value) ? repairFile.value[0] : repairFile.value) ?? null)
  function imageRule () {
    const f = repairFileOne.value
    if (!f) return true
    if (!['image/jpeg', 'image/png'].includes(f.type)) return 'รองรับเฉพาะรูป jpg หรือ png'
    return f.size <= 5 * 1024 * 1024 || 'ไฟล์ต้องไม่เกิน 5 MB'
  }
  const revokePreview = () => repairPreview.value && URL.revokeObjectURL(repairPreview.value)
  watch(repairFileOne, f => {
    revokePreview()
    repairPreview.value = f && imageRule() === true ? URL.createObjectURL(f) : null
  })
  watch(dialog, value => value !== 'repairImage' && (repairFile.value = null))
  onBeforeUnmount(revokePreview)

  function openRepairImage () {
    fieldErrors.repair_image = null
    dialog.value = 'repairImage'
  }
  async function uploadRepairImage () {
    if (!(await imageForm.value.validate()).valid) return
    run(() => api.put(`/tickets/${ticket.value.id}/repair-image`, toFormData({ repair_image: repairFileOne.value })), 'บันทึกรูปหลังซ่อมแล้ว')
  }

  const costRule = v => v === '' || v === null || (Number(v) >= 0 && Number(v) <= 99_999_999.99) || 'ค่าใช้จ่ายต้องอยู่ระหว่าง 0 ถึง 99,999,999.99'
  function openClose () {
    note.value = ''
    repairCost.value = ''
    fieldErrors.repair_cost = null
    dialog.value = 'close'
  }
  async function closeTicket () {
    if (!(await closeForm.value.validate()).valid) return
    const cost = repairCost.value === '' || repairCost.value === null ? null : Number(repairCost.value)
    changeStatus({ status: 'done', note: note.value || null, repair_cost: cost }, 'ปิดงานสำเร็จ')
  }

  function openCancel () {
    note.value = ''
    dialog.value = 'cancel'
  }

  async function remove () {
    saving.value = true
    try {
      await ticketsApi.remove(ticket.value.id)
      notify.success('ลบใบงานสำเร็จ')
      dialog.value = null
      router.replace('/tickets')
    } catch {

    } finally {
      saving.value = false
    }
  }

  const formatDate = value => new Date(value).toLocaleString('th-TH', { dateStyle: 'medium', timeStyle: 'short' })
  const formatMoney = value => Number(value).toLocaleString('th-TH', { style: 'currency', currency: 'THB' })
</script>
