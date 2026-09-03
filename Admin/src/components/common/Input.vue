<script setup lang="ts">
import { computed, useAttrs, useId } from 'vue'
import Label from './Label.vue'
import styles from './Input.module.css'

const attrs = useAttrs()

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<{
    modelValue: string
    label?: string
    helper?: string
    error?: string
    type?: 'text' | 'password' | 'number'
    disabled?: boolean
    min?: number
    max?: number
    step?: number
  }>(),
  {
    type: 'text',
    disabled: false,
    step: 1,
  },
)

const emit = defineEmits<{
  'update:modelValue': [v: string]
}>()

const inputId = useId()

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

const inputAttrs = computed(() => {
  const {
    class: _className,
    style: _style,
    ...rest
  } = attrs as Record<string, unknown>
  return rest
})

const isNumber = computed(() => props.type === 'number')

function spin(delta: number) {
  const current = Number(props.modelValue)
  if (Number.isNaN(current)) return
  const step = props.step ?? 1
  let next = (current * 10 + delta * step * 10) / 10
  next = Math.round(next * 10) / 10
  if (props.min !== undefined && next < props.min) return
  if (props.max !== undefined && next > props.max) return
  emit('update:modelValue', String(next))
}
</script>

<template>
  <div :class="[styles.wrapper, wrapperClass]" :style="wrapperStyle">
    <Label v-if="label" :html-for="inputId" :class="styles.label">{{
      label
    }}</Label>
    <div v-if="isNumber" :class="styles.numberWrapper">
      <input
        :id="inputId"
        v-bind="inputAttrs"
        :type="type"
        :class="[styles.field, { [styles.hasError]: error }]"
        :value="modelValue"
        :disabled="disabled"
        :min="min"
        :max="max"
        :step="step"
        @input="
          emit('update:modelValue', ($event.target as HTMLInputElement).value)
        "
      />
      <span :class="styles.spinBtnGroup">
        <button
          type="button"
          :class="styles.spinBtn"
          :disabled="disabled"
          tabindex="-1"
          aria-label="增加"
          @click="spin(1)"
        >
          ▲
        </button>
        <button
          type="button"
          :class="styles.spinBtn"
          :disabled="disabled"
          tabindex="-1"
          aria-label="减少"
          @click="spin(-1)"
        >
          ▼
        </button>
      </span>
    </div>
    <input
      v-else
      :id="inputId"
      v-bind="inputAttrs"
      :type="type"
      :class="[styles.field, { [styles.hasError]: error }]"
      :value="modelValue"
      :disabled="disabled"
      :min="min"
      :max="max"
      :step="step"
      @input="
        emit('update:modelValue', ($event.target as HTMLInputElement).value)
      "
    />
    <span v-if="error" :class="styles.errorText">{{ error }}</span>
    <span v-else-if="helper" :class="styles.helper">{{ helper }}</span>
  </div>
</template>
