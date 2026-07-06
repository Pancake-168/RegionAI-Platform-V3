import { createRouter, createWebHashHistory } from 'vue-router'

const router = createRouter({
  history: createWebHashHistory(),
  routes: [
    {
      path: '/',
      name: 'Demo',
      component: () => import('@/views/DemoPage.vue'),
    },
  ],
})

export default router
