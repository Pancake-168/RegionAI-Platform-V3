<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useTheme } from '@/composables/useTheme'
import ToastProvider from '@/components/common/ToastProvider.vue'
import TauriBar from '@/components/TauriBar.vue'

useTheme()

const route = useRoute()
const isAdmin = computed(() => route.path === '/admin')
</script>

<template>
  <ToastProvider>
    <div class="app-layout">
      <TauriBar />
      <div class="main-page">
        <nav class="app-nav">
          <!-- 首页导航链接 -->
          <router-link to="/">首页</router-link>
          <!-- 后台管理导航链接（只在 admin 页面显示） -->
          <router-link v-if="isAdmin || true" to="/admin">后台管理</router-link>
        </nav>
        <div class="app-content">
          <router-view />
        </div>
      </div>
    </div>
  </ToastProvider>
</template>
