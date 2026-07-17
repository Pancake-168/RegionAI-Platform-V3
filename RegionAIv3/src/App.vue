<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import ToastProvider from '@/components/common/ToastProvider.vue'
import TauriBar from '@/components/TauriBar.vue'

useTheme()
</script>

<template>
  <ToastProvider>
    <div class="app-layout">
      <TauriBar />
      <div class="main-page">
        <nav class="app-nav">
          <!-- 首页导航链接 -->
          <router-link to="/">首页</router-link>
          <!-- 后台管理导航链接 -->
          <router-link to="/admin">后台管理</router-link>
          <router-link to="/demo">demo</router-link>
        </nav>
        <div class="app-content">
          <router-view />
        </div>
      </div>
    </div>
  </ToastProvider>
</template>
