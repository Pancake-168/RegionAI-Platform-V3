<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'
import Label from './Label.vue'
import styles from './Input.module.css'

const attrs = useAttrs()

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

type ClassValue =
  | string
  | Record<string, boolean>
  | Array<string | Record<string, boolean>>
  | undefined
type StyleValue = string | Record<string, string | number> | undefined

const wrapperClass = computed<ClassValue>(
  () => (attrs as { class?: ClassValue }).class,
)
const wrapperStyle = computed<StyleValue>(
  () => (attrs as { style?: StyleValue }).style,
)

const textareaAttrs = computed(() => {
  const {
    class: _className,
    style: _style,
    ...rest
  } = attrs as Record<string, unknown>
  return rest
})
</script>

<template>
  <div :class="[styles.wrapper, wrapperClass]" :style="wrapperStyle">
    <Label v-if="label" :html-for="textareaId" :class="styles.label">{{
      label
    }}</Label>
    <textarea
      :id="textareaId"
      v-bind="textareaAttrs"
      :class="[styles.field, styles.textarea, { [styles.hasError]: error }]"
      :value="modelValue"
      :disabled="disabled"
      :rows="rows"
      :maxlength="maxLength"
      @input="
        emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)
      "
    />
    <span v-if="error" :class="styles.errorText">{{ error }}</span>
    <span v-else-if="helper" :class="styles.helper">{{ helper }}</span>
  </div>
</template>
