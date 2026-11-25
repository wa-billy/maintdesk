<template>
  <v-dialog v-model="open" max-width="420" persistent>
    <v-card :title="title">
      <v-card-text>
        {{ text }}
        <slot />
      </v-card-text>
      <v-card-actions>
        <v-spacer />
        <v-btn :disabled="loading" @click="open = false">ยกเลิก</v-btn>
        <v-btn :color="color" :loading="loading" :prepend-icon="confirmIcon" variant="flat" @click="emit('confirm')">
          {{ confirmText }}
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
  const open = defineModel({ type: Boolean, default: false })
  defineProps({
    title: { type: String, required: true },
    text: { type: String, default: '' },
    confirmText: { type: String, default: 'ลบ' },
    confirmIcon: { type: String, default: 'mdi-delete' },
    color: { type: String, default: 'error' },
    loading: { type: Boolean, default: false },
  })
  const emit = defineEmits(['confirm'])
</script>
