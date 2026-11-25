import { createRouter, createWebHistory } from 'vue-router'
import { useNotify } from '@/composables/useNotify'
import { useAuthStore } from '@/stores/auth'

export const routes = [
  { path: '/login', name: 'login', component: () => import('@/views/LoginView.vue'), meta: { title: 'เข้าสู่ระบบ', public: true } },
  { path: '/', redirect: '/dashboard' },
  {
    path: '/dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Dashboard', icon: 'mdi-view-dashboard', menu: true },
  },
  {
    path: '/tickets',
    component: () => import('@/views/TicketListView.vue'),
    meta: {
      title: 'รายการใบงาน',
      roleTitles: { technician: 'งานของฉัน', reporter: 'ใบงานของฉัน' },
      icon: 'mdi-clipboard-list',
      menu: true,
    },
  },
  {
    path: '/tickets/new',
    component: () => import('@/views/TicketFormView.vue'),
    meta: { title: 'แจ้งซ่อม', icon: 'mdi-clipboard-plus', roles: ['reporter'], menu: true },
  },
  { path: '/tickets/:id', component: () => import('@/views/TicketDetailView.vue'), meta: { title: 'รายละเอียดใบงาน' } },
  {
    path: '/tickets/:id/edit',
    component: () => import('@/views/TicketFormView.vue'),
    meta: { title: 'แก้ไขใบงาน', roles: ['reporter'] },
  },
  {
    path: '/users',
    component: () => import('@/views/UserListView.vue'),
    meta: { title: 'จัดการผู้ใช้', icon: 'mdi-account-group', roles: ['admin'], menu: true },
  },
  {
    path: '/categories',
    component: () => import('@/views/CategoryListView.vue'),
    meta: { title: 'จัดการหมวดหมู่', icon: 'mdi-shape', roles: ['admin'], menu: true },
  },
  { path: '/:pathMatch(.*)*', component: () => import('@/views/NotFoundView.vue'), meta: { title: 'ไม่พบหน้าที่ต้องการ' } },
]

export const routeTitle = (route, role) => route.meta?.roleTitles?.[role] ?? route.meta?.title

const router = createRouter({ history: createWebHistory(), routes })

router.beforeEach(to => {
  const auth = useAuthStore()
  if (to.meta.public) return to.name === 'login' && auth.isLoggedIn ? '/dashboard' : true
  if (!auth.isLoggedIn) return '/login'
  if (to.meta.roles && !to.meta.roles.includes(auth.user?.role)) {
    useNotify().error('ไม่มีสิทธิ์เข้าถึงหน้านี้')
    return '/dashboard'
  }
})

router.afterEach(to => {
  document.title = `${routeTitle(to, useAuthStore().user?.role)} | MaintDesk`
})

export default router
