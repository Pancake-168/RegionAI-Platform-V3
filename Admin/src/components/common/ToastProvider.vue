<script setup lang="ts">
import { ToastProvider, ToastViewport, ToastRoot, ToastClose } from 'reka-ui'
import { Icon } from '@iconify/vue'
import IconContainer from './IconContainer.vue'
import Button from './Button.vue'
import { useToastViewport } from '@/composables/useToast'
import styles from './Toast.module.css'
import { getIcon } from '@/icons'

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
        @update:open="
          (open: boolean) => {
            if (!open) removeToast(t.id)
          }
        "
      >
        <div :class="['pill', t.variant ?? 'info', styles.dot]" />
        <span :class="styles.message">{{ t.message }}</span>
        <Button
          v-if="t.action"
          variant="subtle"
          :class="styles.action"
          @click="t.action.onClick"
        >
          {{ t.action.label }}
        </Button>
        <ToastClose :class="styles.close" aria-label="关闭">
          <IconContainer :size="14"
            ><Icon :icon="getIcon('close')" :width="14"
          /></IconContainer>
        </ToastClose>
      </ToastRoot>
    </ToastViewport>
  </ToastProvider>
</template>
