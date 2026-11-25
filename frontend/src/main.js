import { createPinia } from 'pinia'
import { createApp } from 'vue'
import App from './App.vue'
import vuetify from './plugins/vuetify'
import router from './router'
import 'unfonts.css'

createApp(App)
  .use(vuetify)
  .use(createPinia())
  .use(router)
  .mount('#app')
