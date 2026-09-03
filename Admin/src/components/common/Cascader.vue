<script setup lang="ts">
import { computed, ref } from 'vue'
import Popover from './Popover.vue'
import Button from './Button.vue'
import styles from './Cascader.module.css'

interface CascaderOption {
  value: string
  label: string
  children?: CascaderOption[]
  disabled?: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: string[]
    options: CascaderOption[]
    placeholder?: string
  }>(),
  {
    placeholder: '请选择',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const open = ref(false)
const activePath = ref<string[]>([...props.modelValue])

function findPathLabels(options: CascaderOption[], path: string[]) {
  const labels: string[] = []
  let currentOptions = options
  for (const segment of path) {
    const node = currentOptions.find((option) => option.value === segment)
    if (!node) break
    labels.push(node.label)
    currentOptions = node.children ?? []
  }
  return labels
}

function buildColumns(options: CascaderOption[], path: string[]) {
  const columns: CascaderOption[][] = [options]
  let currentOptions = options
  for (const segment of path) {
    const node = currentOptions.find((option) => option.value === segment)
    if (!node || !node.children) break
    currentOptions = node.children
    columns.push(currentOptions)
  }
  return columns
}

const columns = computed(() => buildColumns(props.options, activePath.value))
const selectedLabels = computed(() =>
  findPathLabels(props.options, props.modelValue),
)

function onOpenChange(next: boolean) {
  if (next) activePath.value = [...props.modelValue]
  open.value = next
}

function selectOption(columnIndex: number, option: CascaderOption) {
  const nextPath = activePath.value.slice(0, columnIndex)
  if (option.children?.length) {
    activePath.value = [...nextPath, option.value]
    return
  }
  const fullPath = [...nextPath, option.value]
  emit('update:modelValue', fullPath)
  open.value = false
}
</script>

<template>
  <div :class="styles.wrapper">
    <Popover
      :open="open"
      :content-class="styles.content"
      bare-content
      align="start"
      :side-offset="4"
      :show-arrow="false"
      @update:open="onOpenChange"
    >
      <template #trigger>
        <Button variant="secondary" block :class="styles.trigger">
          <span
            :class="selectedLabels.length ? styles.text : styles.placeholder"
          >
            {{
              selectedLabels.length ? selectedLabels.join(' / ') : placeholder
            }}
          </span>
        </Button>
      </template>
      <div :class="styles.columns">
        <div
          v-for="(column, columnIndex) in columns"
          :key="columnIndex"
          :class="styles.column"
        >
          <Button
            v-for="option in column"
            :key="option.value"
            variant="subtle"
            block
            :class="[
              styles.option,
              activePath[columnIndex] === option.value ? styles.active : '',
            ]"
            :disabled="option.disabled"
            @click="selectOption(columnIndex, option)"
          >
            <span :class="styles.optionText">{{ option.label }}</span>
            <span v-if="option.children?.length" :class="styles.arrow">›</span>
          </Button>
        </div>
      </div>
    </Popover>
  </div>
</template>
