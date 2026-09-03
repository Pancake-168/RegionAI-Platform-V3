<script setup lang="ts">
import { useAttrs } from 'vue'
import { Label as LabelRoot } from 'reka-ui'
import styles from './Label.module.css'

defineOptions({ inheritAttrs: false })

withDefaults(
  defineProps<{
    htmlFor?: string
  }>(),
  {},
)

const attrs = useAttrs()
const {
  class: className,
  style: styleAttr,
  ...restAttrs
} = attrs as Record<string, unknown>
</script>

<template>
  <LabelRoot
    v-bind="restAttrs"
    :for="htmlFor"
    :class="[styles.label, className]"
    :style="styleAttr"
  >
    <slot />
  </LabelRoot>
</template>
