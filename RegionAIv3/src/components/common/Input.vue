<script setup lang="ts">
import { useId } from 'vue'
import styles from './Input.module.css'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    helper?: string
    error?: string
    type?: 'text' | 'password' | 'number'
    disabled?: boolean
  }>(),
  {
    type: 'text',
    disabled: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [v: string]
}>()

const inputId = useId()
</script>

<template>
  <div :class="styles.wrapper">
    <label v-if="label" :class="styles.label" :for="inputId">{{ label }}</label>
    <input
      :id="inputId"
      v-bind="$attrs"
      :type="type"
      :class="[styles.field, { [styles.hasError]: error }]"
      :value="modelValue"
      :disabled="disabled"
      @input="emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="error" :class="styles.errorText">{{ error }}</span>
    <span v-else-if="helper" :class="styles.helper">{{ helper }}</span>
  </div>
</template>
