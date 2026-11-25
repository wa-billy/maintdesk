<template>
  <v-container class="d-flex align-center" fluid style="min-height: 100vh">
    <v-row justify="center">
      <v-col cols="12" lg="4" md="5" sm="8">
        <v-card class="pa-4" elevation="8">
          <v-card-title class="text-center">
            <v-icon color="primary" icon="mdi-wrench" size="48" />
            <div class="text-h5 mt-2">MaintDesk</div>
            <div class="text-body-2 text-medium-emphasis">ระบบแจ้งซ่อม</div>
          </v-card-title>

          <v-card-text>
            <v-alert
              v-if="error"
              class="mb-4"
              icon="mdi-alert-circle"
              :text="error"
              type="error"
              variant="tonal"
            />
            <v-form ref="form" @submit.prevent="submit">
              <v-text-field
                v-model="username"
                autocomplete="username"
                label="ชื่อผู้ใช้"
                prepend-inner-icon="mdi-account"
                :rules="[required]"
              />
              <v-text-field
                v-model="password"
                :append-inner-icon="showPassword ? 'mdi-eye-off' : 'mdi-eye'"
                autocomplete="current-password"
                label="รหัสผ่าน"
                prepend-inner-icon="mdi-lock"
                :rules="[required]"
                :type="showPassword ? 'text' : 'password'"
                @click:append-inner="showPassword = !showPassword"
              />
              <v-btn
                block
                class="mt-2"
                color="primary"
                :loading="loading"
                prepend-icon="mdi-login"
                size="large"
                type="submit"
              >
                เข้าสู่ระบบ
              </v-btn>
            </v-form>
          </v-card-text>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup>
  import { ref } from 'vue'
  import { useRouter } from 'vue-router'
  import { useAuthStore } from '@/stores/auth'
  import { errorMessage } from '@/utils/errorMessage'

  const LOGIN_ERRORS = {
    401: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง',
    403: 'บัญชีถูกปิดใช้งาน กรุณาติดต่อผู้ดูแลระบบ',
  }

  const auth = useAuthStore()
  const router = useRouter()
  const form = ref()
  const username = ref('')
  const password = ref('')
  const showPassword = ref(false)
  const loading = ref(false)
  const error = ref('')

  const required = v => !!v?.trim() || 'กรุณากรอกข้อมูล'

  async function submit () {
    const { valid } = await form.value.validate()
    if (!valid) return
    loading.value = true
    error.value = ''
    try {
      await auth.login(username.value, password.value)
      router.push('/dashboard')
    } catch (error_) {
      error.value = LOGIN_ERRORS[error_.response?.status] ?? errorMessage(error_)
    } finally {
      loading.value = false
    }
  }
</script>
