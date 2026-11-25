import axios from 'axios'
import { useNotify } from '@/composables/useNotify'
import { useAuthStore } from '@/stores/auth'
import { errorMessage } from '@/utils/errorMessage'

export const api = axios.create({ baseURL: '/api' })

api.interceptors.request.use(config => {
  const auth = useAuthStore()
  if (auth.token) config.headers.Authorization = `Bearer ${auth.token}`
  return config
})

api.interceptors.response.use(
  res => res.data,
  error => {
    const status = error.response?.status
    if (error.config?.url === '/auth/login' || status === 422) return Promise.reject(error)
    if (status === 401) useAuthStore().logout()
    useNotify().error(errorMessage(error))
    return Promise.reject(error)
  },
)

export const createApi = prefix => ({
  list: params => api.get(prefix, { params }),
  get: id => api.get(`${prefix}/${id}`),
  create: body => api.post(prefix, body),
  update: (id, body) => api.put(`${prefix}/${id}`, body),
  remove: id => api.delete(`${prefix}/${id}`),
})

export const ticketsApi = createApi('/tickets')
export const categoriesApi = createApi('/categories')
export const adminUsersApi = createApi('/admin/users')
export const adminCategoriesApi = createApi('/admin/categories')
