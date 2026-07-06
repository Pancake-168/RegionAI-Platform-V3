<script setup lang="ts">
import { ToastProvider, ToastViewport, ToastRoot, ToastClose } from 'reka-ui'
import { Icon } from '@iconify/vue'
import { useToastViewport } from '@/composables/useToast'
import styles from './Toast.module.css'

const { toasts, removeToast } = useToastViewport()
</script>

<template>
  <ToastProvider swipe-direction="right">
    <slot />
    <ToastViewport :class="styles.viewport">
      <ToastRoot
        v-for="t in toasts"
        :key="t.id"
        :class="styles.root"
        :duration="t.duration"
        @update:open="(open: boolean) => { if (!open) removeToast(t.id) }"
      >
        <div
          :class="['pill', t.variant ?? 'info']"
          :style="{ width: '8px', height: '8px', padding: '0', minWidth: '8px', borderRadius: '50%' }"
        />
        <span :class="styles.message">{{ t.message }}</span>
        <button v-if="t.action" :class="styles.action" @click="t.action.onClick">
          {{ t.action.label }}
        </button>
        <ToastClose :class="styles.close" aria-label="关闭">
          <Icon icon="codicon:close" :width="14" />
        </ToastClose>
      </ToastRoot>
    </ToastViewport>
  </ToastProvider>
</template>
