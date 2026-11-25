<template>
  <v-app>
    <template v-if="!route.meta.public">
      <v-navigation-drawer v-model="drawer" :permanent="!mobile" :temporary="mobile">
        <v-list nav>
          <v-list-item
            v-for="item in menu"
            :key="item.path"
            :prepend-icon="item.meta.icon"
            :title="routeTitle(item, role)"
            :to="item.path"
          />
        </v-list>
      </v-navigation-drawer>

      <v-app-bar color="primary">
        <v-app-bar-nav-icon v-if="mobile" icon="mdi-menu" @click="drawer = !drawer" />
        <v-app-bar-title>{{ routeTitle(route, role) }}</v-app-bar-title>
        <v-chip class="me-2" prepend-icon="mdi-account-circle" variant="text">{{ auth.user?.full_name }}</v-chip>
        <v-btn icon="mdi-logout" title="ออกจากระบบ" @click="auth.logout()" />
      </v-app-bar>
    </template>

    <v-main>
      <router-view :key="route.path" />
    </v-main>

    <v-snackbar v-model="notify.state.show" :color="notify.state.color" location="top">
      {{ notify.state.text }}
    </v-snackbar>
  </v-app>
</template>

<script setup>
  import { computed, ref } from 'vue'
  import { useRoute } from 'vue-router'
  import { useDisplay } from 'vuetify'
  import { useNotify } from '@/composables/useNotify'
  import { routes, routeTitle } from '@/router'
  import { useAuthStore } from '@/stores/auth'

  const route = useRoute()
  const auth = useAuthStore()
  const notify = useNotify()
  const { mobile } = useDisplay()
  const drawer = ref(!mobile.value)

  const role = computed(() => auth.user?.role)
  const menu = computed(() => routes.filter(r => r.meta?.menu && (!r.meta.roles || r.meta.roles.includes(role.value))))
</script>
