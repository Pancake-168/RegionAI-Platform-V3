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
    disabled?: boolean
    rows?: number
    maxLength?: number
  }>(),
  {
    disabled: false,
    rows: 4,
  },
)

const emit = defineEmits<{
  'update:modelValue': [v: string]
}>()

const textareaId = useId()
</script>

<template>
  <div :class="styles.wrapper">
    <label v-if="label" :class="styles.label" :for="textareaId">{{ label }}</label>
    <textarea
      :id="textareaId"
      v-bind="$attrs"
      :class="[styles.field, styles.textarea, { [styles.hasError]: error }]"
      :value="modelValue"
      :disabled="disabled"
      :rows="rows"
      :maxlength="maxLength"
      @input="emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
    <span v-if="error" :class="styles.errorText">{{ error }}</span>
    <span v-else-if="helper" :class="styles.helper">{{ helper }}</span>
  </div>
</template>
