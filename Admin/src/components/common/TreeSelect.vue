<script setup lang="ts">
import { computed, ref } from 'vue'
import Popover from './Popover.vue'
import { Icon } from '@iconify/vue'
import IconContainer from './IconContainer.vue'
import Button from './Button.vue'
import ScrollArea from './ScrollArea.vue'
import styles from './TreeSelect.module.css'
import { getIcon } from '@/icons'

interface TreeSelectOption {
  value: string
  label: string
  children?: TreeSelectOption[]
  disabled?: boolean
}

interface VisibleNode extends TreeSelectOption {
  depth: number
  hasChildren: boolean
  expanded: boolean
}

const props = withDefaults(
  defineProps<{
    modelValue: string
    options: TreeSelectOption[]
    placeholder?: string
    emptyText?: string
  }>(),
  {
    placeholder: '请选择',
    emptyText: '无数据',
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: string]
}>()

const open = ref(false)
const expanded = ref<Set<string>>(new Set())

function findLabelPath(
  options: TreeSelectOption[],
  target: string,
  trail: string[] = [],
): string[] | null {
  for (const option of options) {
    const nextTrail = [...trail, String(option.label)]
    if (option.value === target) return nextTrail
    if (option.children) {
      const found = findLabelPath(option.children, target, nextTrail)
      if (found) return found
    }
  }
  return null
}

const selectedPath = computed(() =>
  findLabelPath(props.options, props.modelValue),
)

function flattenVisible(
  nodes: TreeSelectOption[],
  depth: number,
): VisibleNode[] {
  const result: VisibleNode[] = []
  for (const node of nodes) {
    const hasChildren = Boolean(node.children?.length)
    const isExpanded = hasChildren && expanded.value.has(node.value)
    result.push({
      ...node,
      depth,
      hasChildren,
      expanded: isExpanded,
    })
    if (hasChildren && isExpanded && node.children) {
      result.push(...flattenVisible(node.children, depth + 1))
    }
  }
  return result
}

const visibleNodes = computed(() => flattenVisible(props.options, 0))

function toggleExpanded(value: string) {
  const next = new Set(expanded.value)
  if (next.has(value)) next.delete(value)
  else next.add(value)
  expanded.value = next
}

function selectValue(value: string) {
  emit('update:modelValue', value)
  open.value = false
}
</script>

<template>
  <div :class="styles.wrapper">
    <Popover
      v-model:open="open"
      :content-class="styles.content"
      bare-content
      align="start"
      :side-offset="4"
      :show-arrow="false"
    >
      <template #trigger>
        <Button variant="secondary" block :class="styles.trigger">
          <span
            :class="selectedPath?.length ? styles.text : styles.placeholder"
          >
            {{ selectedPath?.length ? selectedPath.join(' / ') : placeholder }}
          </span>
        </Button>
      </template>
      <ScrollArea v-if="options.length" :max-height="280">
        <div v-for="node in visibleNodes" :key="node.value">
          <div
            :class="styles.nodeRow"
            :style="{ paddingLeft: node.depth * 16 }"
          >
            <Button
              v-if="node.hasChildren"
              variant="subtle"
              :class="styles.expandBtn"
              :aria-label="node.expanded ? '折叠' : '展开'"
              @click="toggleExpanded(node.value)"
            >
              <IconContainer :size="14"
                ><Icon
                  :icon="
                    node.expanded
                      ? getIcon('chevronDown')
                      : getIcon('chevronRight')
                  "
                  :width="14"
                  :height="14"
              /></IconContainer>
            </Button>
            <span v-else :class="styles.spacer" />
            <Button
              variant="subtle"
              block
              :class="[
                styles.option,
                node.value === modelValue ? styles.selected : '',
              ]"
              :disabled="node.disabled"
              @click="selectValue(node.value)"
            >
              {{ node.label }}
            </Button>
          </div>
        </div>
      </ScrollArea>
      <div v-else :class="styles.empty">{{ emptyText }}</div>
    </Popover>
  </div>
</template>
