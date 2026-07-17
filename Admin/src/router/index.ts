import { createRouter, createWebHistory } from 'vue-router'
import { isTauri } from '@/utils/isTauri' // Tauri 运行时检测

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL), // History 模式：无 # 的干净 URL
  routes: [
    {
      path: '/', // 首页路由
      name: 'Main',
      component: () => import('@/views/DemoPage.vue'), // 懒加载 Demo 页面
    },
    {
      path: '/admin', // 后台管理页面路由
      name: 'Admin',
      component: () => import('@/views/AdminPage/index.vue'), // 懒加载 AdminPage
    },
    {
      path: '/login', // 登录页路由
      name: 'Login',
      component: () => import('@/views/views/LoginPage/index.vue'), // 懒加载 LoginPage
    },
    {
      path: '/demo', // 首页路由
      name: 'Demo',
      component: () => import('@/views/DemoPage.vue'), // 懒加载 Demo 页面
    },
  ],
})

// 路由守卫：Tauri 桌面端首次启动跳转登录页
router.beforeEach((to) => {
  // 访问根路径且当前为 Tauri 桌面端 → 重定向到 /login
  if (to.path === '/' && isTauri()) {
    return '/login' // 返回目标路径字符串表示重定向
  }
  // 其他情况放行
  return true
})

export default router
