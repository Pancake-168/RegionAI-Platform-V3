<script setup lang="ts">
import { Icon } from '@iconify/vue'

defineProps<{
  title: string
  description?: string
}>()
</script>

<template>
  <div
    :style="{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 'var(--spacing-md)',
      padding: 'var(--spacing-2xl)',
      border: '1px dashed var(--glass-brd)',
      borderRadius: 'var(--radius-xl)',
      textAlign: 'center',
    }"
  >
    <div :style="{ color: 'var(--muted)', fontSize: '48px', lineHeight: '1' }">
      <slot name="icon">
        <Icon icon="codicon:folder-opened" :width="48" />
      </slot>
    </div>
    <span
      :style="{
        color: 'var(--text)',
        fontWeight: '600',
        fontSize: 'var(--text-md)',
      }"
    >
      {{ title }}
    </span>
    <span
      v-if="description"
      :style="{ color: 'var(--muted)', fontSize: 'var(--text-sm)' }"
    >
      {{ description }}
    </span>
    <div v-if="$slots.action" :style="{ marginTop: 'var(--spacing-sm)' }">
      <slot name="action" />
    </div>
  </div>
</template>
