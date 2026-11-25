<template>
  <v-avatar :color="category?.image_url ? undefined : 'secondary'" :size="size" variant="tonal">
    <v-img v-if="category?.image_url" :alt="category.name" cover :src="category.image_url" />
    <v-icon v-else icon="mdi-shape" :size="size * 0.6" />
  </v-avatar>
</template>

<script setup>
  defineProps({
    category: { type: Object, default: null },
    size: { type: Number, default: 32 },
  })
</script>
