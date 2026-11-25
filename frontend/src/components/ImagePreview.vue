<template>
  <div>
    <div v-if="label" class="text-subtitle-2 mb-2 d-flex align-center ga-1">
      <v-icon :icon="icon" size="small" />{{ label }}
    </div>

    <v-sheet v-if="!src" class="d-flex flex-column align-center justify-center text-medium-emphasis" height="160" rounded border>
      <v-icon icon="mdi-image-off" size="40" />
      <span class="text-caption mt-1">ไม่มีไฟล์</span>
    </v-sheet>

    <v-btn v-else-if="isPdf" :href="src" prepend-icon="mdi-paperclip" rel="noopener" target="_blank" variant="tonal">
      เปิดไฟล์ PDF
    </v-btn>

    <template v-else>
      <v-img class="cursor-pointer rounded" cover height="160" :src="src" @click="full = true" />
      <v-dialog v-model="full" max-width="900">
        <v-img :src="src" @click="full = false" />
      </v-dialog>
    </template>
  </div>
</template>

<script setup>
  import { computed, ref } from 'vue'

  const props = defineProps({
    src: { type: String, default: null },
    pdf: { type: Boolean, default: false },
    label: { type: String, default: '' },
    icon: { type: String, default: 'mdi-paperclip' },
  })
  const full = ref(false)
  const isPdf = computed(() => props.pdf || props.src?.toLowerCase().endsWith('.pdf'))
</script>
