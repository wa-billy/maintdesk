import { nextTick, reactive } from 'vue'

const state = reactive({ show: false, text: '', color: 'success' })

export function useNotify () {
  async function show (text, color) {
    Object.assign(state, { text, color })
    if (state.show) {
      state.show = false
      await nextTick()
    }
    state.show = true
  }
  return {
    state,
    success: text => show(text, 'success'),
    error: text => show(text, 'error'),
  }
}
