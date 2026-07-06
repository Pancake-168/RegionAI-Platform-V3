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
        <nav class="app-nav" v-if="false">
          <!-- 导航链接后续配置 -->
        </nav>
        <div class="app-content">
          <router-view />
        </div>
      </div>
    </div>
  </ToastProvider>
</template>
