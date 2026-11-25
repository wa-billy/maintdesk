<template>
  <v-container fluid>
    <v-card>
      <v-card-text class="d-flex justify-end">
        <v-btn color="primary" prepend-icon="mdi-plus" @click="openForm()">เพิ่มหมวดหมู่</v-btn>
      </v-card-text>

      <v-data-table
        :headers="headers"
        hide-default-footer
        :items="categories.items.value"
        :items-per-page="-1"
        :loading="categories.loading.value"
        mobile-breakpoint="md"
      >
        <template #item.image="{ item }">
          <CategoryAvatar :category="item" :size="48" />
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-btn icon="mdi-pencil" size="small" title="แก้ไข" variant="text" @click="openForm(item)" />
            <v-btn color="error" icon="mdi-delete" size="small" title="ลบ" variant="text" @click="deleting = item" />
          </div>
        </template>
        <template #no-data>
          <div class="py-6 text-medium-emphasis">ยังไม่มีหมวดหมู่</div>
        </template>
      </v-data-table>
    </v-card>

    <v-dialog max-width="480" :model-value="formOpen" persistent>
      <v-card :title="editing ? 'แก้ไขหมวดหมู่' : 'เพิ่มหมวดหมู่'">
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="save">
            <v-text-field
              v-model="name"
              counter="50"
              :error-messages="fieldErrors.name"
              label="ชื่อหมวดหมู่"
              :rules="[required, maxLength(50)]"
              @update:model-value="fieldErrors.name = null"
            />
            <v-file-input
              v-model="file"
              accept="image/jpeg,image/png"
              :error-messages="fieldErrors.image"
              :hint="editing ? 'เลือกรูปใหม่เพื่อแทนที่รูปเดิม ไม่เลือก = ใช้รูปเดิม' : 'jpg หรือ png ไม่เกิน 5 MB'"
              label="รูปหมวดหมู่ (ไม่บังคับ)"
              persistent-hint
              prepend-icon=""
              prepend-inner-icon="mdi-image"
              :rules="[fileRule]"
              @update:model-value="fieldErrors.image = null"
            />
            <input hidden type="submit">
          </v-form>
          <ImagePreview
            v-if="previewUrl || editing?.image_url"
            class="mt-4"
            :label="previewUrl ? 'รูปที่เลือก' : 'รูปเดิม'"
            :src="previewUrl || editing.image_url"
          />
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="saving" @click="formOpen = false">ยกเลิก</v-btn>
          <v-btn color="primary" :loading="saving" prepend-icon="mdi-content-save" variant="flat" @click="save">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ConfirmDialog
      :loading="saving"
      :model-value="!!deleting"
      :text="deleting ? `ลบหมวดหมู่ ${deleting.name} ?` : ''"
      title="ยืนยันการลบ"
      @confirm="remove"
      @update:model-value="deleting = null"
    />
  </v-container>
</template>

<script setup>
  import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue'
  import CategoryAvatar from '@/components/CategoryAvatar.vue'
  import ConfirmDialog from '@/components/ConfirmDialog.vue'
  import ImagePreview from '@/components/ImagePreview.vue'
  import { useNotify } from '@/composables/useNotify'
  import { useResource } from '@/composables/useResource'
  import { adminCategoriesApi, categoriesApi } from '@/services/api'
  import { toFormData } from '@/utils/toFormData'

  const headers = [
    { title: 'รูป', key: 'image', sortable: false, width: 80 },
    { title: 'ชื่อหมวดหมู่', key: 'name', sortable: false },
    { title: '', key: 'actions', sortable: false, align: 'end' },
  ]

  const notify = useNotify()
  const categories = useResource(categoriesApi)

  const formOpen = ref(false)
  const editing = ref(null)
  const name = ref('')
  const file = ref(null)
  const previewUrl = ref(null)
  const formRef = ref()
  const deleting = ref(null)
  const saving = ref(false)
  const fieldErrors = reactive({})

  const required = v => (v !== null && v !== undefined && String(v).trim() !== '') || 'กรุณากรอกข้อมูล'
  const maxLength = n => v => (v ?? '').length <= n || `ต้องไม่เกิน ${n} ตัวอักษร`
  const selectedFile = computed(() => (Array.isArray(file.value) ? file.value[0] : file.value) ?? null)
  function fileRule () {
    const f = selectedFile.value
    if (!f) return true
    if (!['image/jpeg', 'image/png'].includes(f.type)) return 'รองรับเฉพาะรูป jpg หรือ png'
    return f.size <= 5 * 1024 * 1024 || 'ไฟล์ต้องไม่เกิน 5 MB'
  }

  const revoke = () => previewUrl.value && URL.revokeObjectURL(previewUrl.value)
  watch(selectedFile, f => {
    revoke()
    previewUrl.value = f && fileRule() === true ? URL.createObjectURL(f) : null
  })
  watch(formOpen, open => !open && (file.value = null))
  onBeforeUnmount(revoke)

  const load = () => categories.list()
  load()

  function openForm (category = null) {
    editing.value = category
    name.value = category?.name ?? ''
    file.value = null
    for (const key of Object.keys(fieldErrors)) delete fieldErrors[key]
    formOpen.value = true
  }

  async function save () {
    if (!(await formRef.value.validate()).valid) return
    const body = toFormData({ name: name.value.trim(), image: selectedFile.value })
    saving.value = true
    try {
      await (editing.value ? adminCategoriesApi.update(editing.value.id, body) : adminCategoriesApi.create(body))
      notify.success(editing.value ? 'แก้ไขหมวดหมู่สำเร็จ' : 'เพิ่มหมวดหมู่สำเร็จ')
      formOpen.value = false
      await load()
    } catch (error) {
      if (error.response?.status === 422) {
        for (const e of error.response.data.errors ?? []) fieldErrors[e.field] = e.message
      }
    } finally {
      saving.value = false
    }
  }

  async function remove () {
    saving.value = true
    try {
      await adminCategoriesApi.remove(deleting.value.id)
      notify.success('ลบหมวดหมู่สำเร็จ')
      await load()
    } catch (error) {
      if (error.response?.status === 409) notify.error('ลบไม่ได้ เนื่องจากมีใบงานใช้หมวดหมู่นี้อยู่')
    } finally {
      saving.value = false
      deleting.value = null
    }
  }
</script>
