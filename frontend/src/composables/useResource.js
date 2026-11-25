import { ref } from 'vue'

export function useResource (resource) {
  const items = ref([])
  const item = ref(null)
  const meta = ref({ total: 0 })
  const loading = ref(false)
  const error = ref(null)

  async function run (fn) {
    loading.value = true
    error.value = null
    try {
      return await fn()
    } catch (error_) {
      error.value = error_
    } finally {
      loading.value = false
    }
  }

  return {
    items, item, meta, loading, error,
    list: params => run(async () => {
      const res = await resource.list(params)
      items.value = res.data
      meta.value = res.meta ?? { total: res.data.length }
    }),
    get: id => run(async () => {
      item.value = (await resource.get(id)).data
    }),
    create: body => run(async () => (await resource.create(body)).data),
    update: (id, body) => run(async () => (await resource.update(id, body)).data),
    remove: id => run(async () => {
      await resource.remove(id)
      return true
    }),
  }
}
