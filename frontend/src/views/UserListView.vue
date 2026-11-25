<template>
  <v-container fluid>
    <v-card>
      <v-card-text>
        <v-row dense>
          <v-col cols="12" md="4">
            <v-text-field
              v-model="q"
              clearable
              density="compact"
              hide-details
              label="ค้นหาชื่อผู้ใช้หรือชื่อ-สกุล"
              prepend-inner-icon="mdi-magnify"
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-select
              v-model="role"
              clearable
              density="compact"
              hide-details
              :items="ROLE_OPTIONS"
              label="role"
              prepend-inner-icon="mdi-filter-variant"
            />
          </v-col>
          <v-col cols="6" md="2">
            <v-select
              v-model="isActive"
              clearable
              density="compact"
              hide-details
              :items="ACTIVE_OPTIONS"
              label="สถานะบัญชี"
            />
          </v-col>
          <v-col class="d-flex justify-end" cols="12" md="4">
            <v-btn color="primary" prepend-icon="mdi-plus" @click="openForm()">เพิ่มผู้ใช้</v-btn>
          </v-col>
        </v-row>
      </v-card-text>

      <v-data-table-server
        v-model:items-per-page="limit"
        v-model:page="page"
        :headers="headers"
        :items="users.items.value"
        :items-length="users.meta.value.total"
        :items-per-page-options="[10, 20, 50]"
        :loading="users.loading.value"
        mobile-breakpoint="md"
      >
        <template #item.role="{ item }">
          <v-chip label size="small">{{ ROLE_LABEL[item.role] }}</v-chip>
        </template>
        <template #item.is_active="{ item }">
          <v-chip
            :color="item.is_active ? 'success' : 'grey'"
            label
            :prepend-icon="item.is_active ? 'mdi-account-check' : 'mdi-account-cancel'"
            size="small"
          >
            {{ item.is_active ? 'ใช้งาน' : 'ปิดบัญชี' }}
          </v-chip>
        </template>
        <template #item.actions="{ item }">
          <div class="d-flex justify-end">
            <v-btn icon="mdi-pencil" size="small" title="แก้ไข" variant="text" @click="openForm(item)" />
            <v-btn icon="mdi-lock-reset" size="small" title="รีเซ็ตรหัสผ่าน" variant="text" @click="openPassword(item)" />
            <template v-if="item.id !== auth.user.id">
              <v-btn
                :icon="item.is_active ? 'mdi-account-cancel' : 'mdi-account-check'"
                size="small"
                :title="item.is_active ? 'ปิดบัญชี' : 'เปิดบัญชี'"
                variant="text"
                @click="toggleActive(item)"
              />
              <v-btn color="error" icon="mdi-delete" size="small" title="ลบ" variant="text" @click="deleting = item" />
            </template>
          </div>
        </template>
        <template #no-data>
          <div class="py-6 text-medium-emphasis">ไม่พบผู้ใช้</div>
        </template>
      </v-data-table-server>
    </v-card>

    <!-- เพิ่ม / แก้ไขผู้ใช้ -->
    <v-dialog max-width="480" :model-value="formOpen" persistent>
      <v-card :title="editing ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'">
        <v-card-text>
          <v-form ref="formRef" @submit.prevent="save">
            <v-text-field
              v-model="form.username"
              :disabled="!!editing"
              :error-messages="fieldErrors.username"
              label="ชื่อผู้ใช้"
              prepend-inner-icon="mdi-account"
              :rules="editing ? [] : [required, maxLength(50)]"
              @update:model-value="fieldErrors.username = null"
            />
            <v-text-field
              v-model="form.full_name"
              :error-messages="fieldErrors.full_name"
              label="ชื่อ-สกุล"
              :rules="[required, maxLength(100)]"
              @update:model-value="fieldErrors.full_name = null"
            />
            <v-select
              v-model="form.role"
              :error-messages="fieldErrors.role"
              :items="ROLE_OPTIONS"
              label="role"
              :rules="[required]"
              @update:model-value="fieldErrors.role = null"
            />
            <v-text-field
              v-if="!editing"
              v-model="form.password"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              :error-messages="fieldErrors.password"
              label="รหัสผ่าน (อย่างน้อย 8 ตัวอักษร)"
              prepend-inner-icon="mdi-lock"
              :rules="[passwordRule]"
              :type="showPassword ? 'text' : 'password'"
              @click:append-inner="showPassword = !showPassword"
              @update:model-value="fieldErrors.password = null"
            />
            <input hidden type="submit">
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="saving" @click="formOpen = false">ยกเลิก</v-btn>
          <v-btn color="primary" :loading="saving" prepend-icon="mdi-content-save" variant="flat" @click="save">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- รีเซ็ตรหัสผ่าน -->
    <v-dialog max-width="440" :model-value="!!resetting" persistent>
      <v-card title="รีเซ็ตรหัสผ่าน">
        <v-card-text>
          <div class="mb-2">ผู้ใช้: {{ resetting?.full_name }} ({{ resetting?.username }})</div>
          <v-form ref="passwordRef" @submit.prevent="savePassword">
            <v-text-field
              v-model="newPassword"
              :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
              :error-messages="fieldErrors.password"
              label="รหัสผ่านใหม่ (อย่างน้อย 8 ตัวอักษร)"
              prepend-inner-icon="mdi-lock-reset"
              :rules="[passwordRule]"
              :type="showPassword ? 'text' : 'password'"
              @click:append-inner="showPassword = !showPassword"
              @update:model-value="fieldErrors.password = null"
            />
            <input hidden type="submit">
          </v-form>
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn :disabled="saving" @click="resetting = null">ยกเลิก</v-btn>
          <v-btn color="primary" :loading="saving" prepend-icon="mdi-content-save" variant="flat" @click="savePassword">บันทึก</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <ConfirmDialog
      :loading="saving"
      :model-value="!!deleting"
      :text="deleting ? `ลบผู้ใช้ ${deleting.full_name} (${deleting.username}) ?` : ''"
      title="ยืนยันการลบ"
      @confirm="remove"
      @update:model-value="deleting = null"
    />
  </v-container>
</template>

<script setup>
  import { reactive, ref, watch } from 'vue'
  import ConfirmDialog from '@/components/ConfirmDialog.vue'
  import { useNotify } from '@/composables/useNotify'
  import { useResource } from '@/composables/useResource'
  import { adminUsersApi, api } from '@/services/api'
  import { useAuthStore } from '@/stores/auth'

  const ROLE_LABEL = { admin: 'ผู้ดูแลระบบ', technician: 'ช่าง', reporter: 'ผู้แจ้ง' }
  const ROLE_OPTIONS = Object.entries(ROLE_LABEL).map(([value, title]) => ({ value, title }))
  const ACTIVE_OPTIONS = [{ value: true, title: 'ใช้งาน' }, { value: false, title: 'ปิดบัญชี' }]
  const headers = [
    { title: 'ชื่อผู้ใช้', key: 'username', sortable: false },
    { title: 'ชื่อ-สกุล', key: 'full_name', sortable: false },
    { title: 'role', key: 'role', sortable: false },
    { title: 'สถานะบัญชี', key: 'is_active', sortable: false },
    { title: '', key: 'actions', sortable: false, align: 'end' },
  ]

  const auth = useAuthStore()
  const notify = useNotify()
  const users = useResource(adminUsersApi)

  const q = ref('')
  const role = ref(null)
  const isActive = ref(null)
  const page = ref(1)
  const limit = ref(10)

  const formOpen = ref(false)
  const editing = ref(null)
  const form = reactive({ username: '', full_name: '', role: null, password: '' })
  const formRef = ref()
  const resetting = ref(null)
  const newPassword = ref('')
  const passwordRef = ref()
  const deleting = ref(null)
  const showPassword = ref(false)
  const saving = ref(false)
  const fieldErrors = reactive({})

  const required = v => (v !== null && v !== undefined && String(v).trim() !== '') || 'กรุณากรอกข้อมูล'
  const maxLength = n => v => (v ?? '').length <= n || `ต้องไม่เกิน ${n} ตัวอักษร`
  const passwordRule = v => (v ?? '').length >= 8 || 'รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร'

  function load () {
    return users.list({
      q: q.value || undefined,
      role: role.value ?? undefined,
      is_active: isActive.value ?? undefined,
      page: page.value,
      limit: limit.value,
    })
  }

  let timer
  watch(q, () => {
    clearTimeout(timer)
    timer = setTimeout(() => (page.value === 1 ? load() : (page.value = 1)), 300)
  })
  watch([role, isActive], () => (page.value === 1 ? load() : (page.value = 1)))
  watch([page, limit], load, { immediate: true })

  async function run (request, message, after) {
    saving.value = true
    try {
      await request()
      notify.success(message)
      after?.()
      await load()
      return true
    } catch (error) {
      if (error.response?.status === 422) {
        for (const e of error.response.data.errors ?? []) fieldErrors[e.field] = e.message
      }
      return false
    } finally {
      saving.value = false
    }
  }

  function openForm (user = null) {
    editing.value = user
    Object.assign(form, { username: user?.username ?? '', full_name: user?.full_name ?? '', role: user?.role ?? null, password: '' })
    for (const key of Object.keys(fieldErrors)) delete fieldErrors[key]
    showPassword.value = false
    formOpen.value = true
  }

  async function save () {
    if (!(await formRef.value.validate()).valid) return
    await run(
      () => editing.value
        ? adminUsersApi.update(editing.value.id, { full_name: form.full_name, role: form.role })
        : adminUsersApi.create({ ...form }),
      editing.value ? 'แก้ไขผู้ใช้สำเร็จ' : 'เพิ่มผู้ใช้สำเร็จ',
      () => (formOpen.value = false),
    )
  }

  function openPassword (user) {
    resetting.value = user
    newPassword.value = ''
    delete fieldErrors.password
    showPassword.value = false
  }

  async function savePassword () {
    if (!(await passwordRef.value.validate()).valid) return
    await run(
      () => api.patch(`/admin/users/${resetting.value.id}/password`, { password: newPassword.value }),
      'เปลี่ยนรหัสผ่านสำเร็จ',
      () => (resetting.value = null),
    )
  }

  const toggleActive = user => run(
    () => api.patch(`/admin/users/${user.id}/active`, { is_active: !user.is_active }),
    user.is_active ? 'ปิดบัญชีสำเร็จ' : 'เปิดบัญชีสำเร็จ',
  )

  async function remove () {
    const ok = await run(() => adminUsersApi.remove(deleting.value.id), 'ลบผู้ใช้สำเร็จ')
    deleting.value = null
    if (ok && users.items.value.length === 0 && page.value > 1) page.value -= 1
  }
</script>
