<template>
  <v-container>
    <v-card :loading="loading">
      <v-card-title class="d-flex align-center ga-2">
        <v-btn icon="mdi-arrow-left" size="small" title="ย้อนกลับ" variant="text" @click="router.back()" />
        {{ isEdit ? 'แก้ไขใบงาน' : 'แจ้งซ่อม' }}
      </v-card-title>

      <v-card-text>
        <v-form ref="formRef" @submit.prevent="submit">
          <v-row>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.title"
                counter="150"
                :error-messages="serverErrors.title"
                label="หัวข้อ"
                :rules="[required, maxLength(150)]"
                @update:model-value="clearError('title')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-select
                v-model="form.category_id"
                :error-messages="serverErrors.category_id"
                item-title="name"
                item-value="id"
                :items="categories"
                label="หมวดหมู่"
                prepend-inner-icon="mdi-tag"
                :rules="[required]"
                @update:model-value="clearError('category_id')"
              >
                <template #item="{ item, props: itemProps }">
                  <v-list-item v-bind="itemProps">
                    <template #prepend>
                      <CategoryAvatar class="me-3" :category="item" :size="28" />
                    </template>
                  </v-list-item>
                </template>
              </v-select>
            </v-col>
            <v-col cols="12" md="6">
              <v-text-field
                v-model="form.location"
                counter="100"
                :error-messages="serverErrors.location"
                label="สถานที่"
                prepend-inner-icon="mdi-map-marker"
                :rules="[required, maxLength(100)]"
                @update:model-value="clearError('location')"
              />
            </v-col>
            <v-col cols="12" md="6">
              <v-file-input
                v-model="file"
                accept="image/jpeg,image/png,application/pdf"
                :error-messages="serverErrors.report_attachment"
                :hint="isEdit ? 'เลือกไฟล์ใหม่เพื่อแทนที่ไฟล์เดิม' : 'jpg, png หรือ pdf ไม่เกิน 5 MB'"
                label="ไฟล์แนบ (ไม่บังคับ)"
                persistent-hint
                prepend-icon=""
                prepend-inner-icon="mdi-paperclip"
                :rules="[fileRule]"
                @update:model-value="clearError('report_attachment')"
              />
            </v-col>
            <v-col cols="12">
              <v-textarea
                v-model="form.description"
                :error-messages="serverErrors.description"
                label="รายละเอียด"
                rows="4"
                :rules="[required]"
                @update:model-value="clearError('description')"
              />
            </v-col>
            <v-col v-if="previewUrl || existingUrl" cols="12" md="6">
              <ImagePreview
                :label="previewUrl ? 'ไฟล์ที่เลือก' : 'ไฟล์เดิม'"
                :pdf="selectedFile?.type === 'application/pdf'"
                :src="previewUrl || existingUrl"
              />
            </v-col>
          </v-row>

          <div class="d-flex justify-end mt-4">
            <v-btn color="primary" :disabled="saving || loading" :loading="saving" prepend-icon="mdi-content-save" type="submit">
              บันทึก
            </v-btn>
          </div>
        </v-form>
      </v-card-text>
    </v-card>
  </v-container>
</template>

<script setup>
  import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import CategoryAvatar from '@/components/CategoryAvatar.vue'
  import ImagePreview from '@/components/ImagePreview.vue'
  import { useNotify } from '@/composables/useNotify'
  import { useResource } from '@/composables/useResource'
  import { categoriesApi, ticketsApi } from '@/services/api'
  import { toFormData } from '@/utils/toFormData'

  const FILE_TYPES = ['image/jpeg', 'image/png', 'application/pdf']
  const MAX_FILE_MB = 5

  const route = useRoute()
  const router = useRouter()
  const notify = useNotify()
  const tickets = useResource(ticketsApi)

  const isEdit = computed(() => !!route.params.id)
  const formRef = ref()
  const form = reactive({ title: '', category_id: null, location: '', description: '' })
  const file = ref(null)
  const categories = ref([])
  const existingUrl = ref(null)
  const previewUrl = ref(null)
  const serverErrors = reactive({})
  const loading = ref(false)
  const saving = ref(false)

  const selectedFile = computed(() => (Array.isArray(file.value) ? file.value[0] : file.value) ?? null)

  const required = v => (v !== null && v !== undefined && String(v).trim() !== '') || 'กรุณากรอกข้อมูล'
  const maxLength = n => v => (v ?? '').length <= n || `ต้องไม่เกิน ${n} ตัวอักษร`
  function fileRule () {
    const f = selectedFile.value
    if (!f) return true
    if (!FILE_TYPES.includes(f.type)) return 'รองรับเฉพาะไฟล์ jpg, png หรือ pdf'
    return f.size <= MAX_FILE_MB * 1024 * 1024 || `ไฟล์ต้องไม่เกิน ${MAX_FILE_MB} MB`
  }
  const clearError = key => delete serverErrors[key]

  watch(selectedFile, f => {
    if (previewUrl.value) URL.revokeObjectURL(previewUrl.value)
    previewUrl.value = f && fileRule() === true ? URL.createObjectURL(f) : null
  })
  onBeforeUnmount(() => previewUrl.value && URL.revokeObjectURL(previewUrl.value))

  onMounted(async () => {
    loading.value = true
    try {
      categories.value = (await categoriesApi.list()).data
      if (!isEdit.value) return
      await tickets.get(route.params.id)
      const ticket = tickets.item.value
      if (!ticket) return router.replace('/tickets')
      if (ticket.status !== 'new') {
        notify.error('แก้ไขได้เฉพาะใบงานที่ยังไม่ได้มอบหมาย')
        return router.replace(`/tickets/${ticket.id}`)
      }
      Object.assign(form, {
        title: ticket.title,
        category_id: ticket.category_id,
        location: ticket.location,
        description: ticket.description,
      })
      existingUrl.value = ticket.report_attachment_url
    } finally {
      loading.value = false
    }
  })

  async function submit () {
    saving.value = true
    const body = toFormData({ ...form, report_attachment: selectedFile.value })
    const ticket = isEdit.value
      ? await tickets.update(route.params.id, body)
      : await tickets.create(body)
    saving.value = false

    if (ticket) {
      notify.success(isEdit.value ? 'แก้ไขใบงานสำเร็จ' : 'แจ้งซ่อมสำเร็จ')
      return router.push(`/tickets/${ticket.id}`)
    }
    for (const e of tickets.error.value?.response?.data?.errors ?? []) serverErrors[e.field] = e.message
  }
</script>
