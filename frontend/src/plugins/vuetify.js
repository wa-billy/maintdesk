import { createVuetify } from 'vuetify'
import { th } from 'vuetify/locale'
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

export default createVuetify({
  locale: { locale: 'th', messages: { th } },
  theme: {
    defaultTheme: 'system',
  },
})
