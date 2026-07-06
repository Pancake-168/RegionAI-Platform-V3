<script setup lang="ts">
import { useTheme } from '@/composables/useTheme'
import ToastProvider from '@/components/common/ToastProvider.vue'

useTheme()
</script>

<template>
  <ToastProvider>
    <div class="app-layout">
      <div class="main-page">
        <nav class="app-nav">
          <!-- 导航链接后续配置 -->
        </nav>
        <div class="app-content">
          <router-view />
        </div>
      </div>
    </div>
  </ToastProvider>
</template>
