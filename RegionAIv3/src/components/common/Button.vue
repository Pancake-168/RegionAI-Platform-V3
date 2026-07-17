<script setup lang="ts">
import type { ButtonVariant } from './types'

withDefaults(
  defineProps<{
    variant?: ButtonVariant
    loading?: boolean
    loadingText?: string
    type?: 'button' | 'submit'
    disabled?: boolean
    block?: boolean
  }>(),
  {
    variant: 'primary',
    loading: false,
    loadingText: '请稍候...',
    type: 'button',
    disabled: false,
    block: false,
  },
)

defineEmits<{
  click: [e: MouseEvent]
}>()
</script>

<template>
  <button
    :type="type"
    :class="['btn', variant, { spinning: loading, block: block }]"
    :disabled="disabled || loading ? true : undefined"
    @click="loading ? undefined : $emit('click', $event)"
  >
    <slot v-if="!loading" name="icon" />
    <template v-if="loading">{{ loadingText }}</template>
    <slot v-else />
  </button>
</template>
