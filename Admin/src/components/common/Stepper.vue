<script setup lang="ts">
import { computed } from 'vue'
import { Icon } from '@iconify/vue'
import IconContainer from './IconContainer.vue'
import Button from './Button.vue'
import styles from './Stepper.module.css'
import { getIcon } from '@/icons'

interface StepItem {
  title?: any
  description?: any
}

const props = withDefaults(
  defineProps<{
    steps: StepItem[]
    current: number
    onChange?: (index: number) => void
  }>(),
  {},
)

const emit = defineEmits<{
  change: [index: number]
}>()

const activeIndex = computed(() =>
  Math.min(props.steps.length - 1, Math.max(0, props.current)),
)

function handleChange(index: number) {
  emit('change', index)
  props.onChange?.(index)
}
</script>

<template>
  <ol :class="styles.root">
    <li v-for="(step, index) in steps" :key="index" :class="styles.item">
      <Button
        variant="subtle"
        :class="[
          styles.indicator,
          index === activeIndex ? styles.indicatorActive : '',
          index < activeIndex ? styles.indicatorDone : '',
        ]"
        :disabled="index > activeIndex"
        :aria-current="index === activeIndex ? 'step' : undefined"
        @click="handleChange(index)"
      >
        <IconContainer v-if="index < activeIndex" :size="14"
          ><Icon :icon="getIcon('check')" :width="14" :height="14"
        /></IconContainer>
        <template v-else>{{ index + 1 }}</template>
      </Button>
      <div :class="styles.text">
        <span :class="styles.title">
          <component
            :is="step.title"
            v-if="step.title && typeof step.title !== 'string'"
          />
          <template v-else>{{ step.title }}</template>
        </span>
        <span v-if="step.description" :class="styles.description">
          <component
            :is="step.description"
            v-if="typeof step.description !== 'string'"
          />
          <template v-else>{{ step.description }}</template>
        </span>
      </div>
      <span v-if="index < steps.length - 1" :class="styles.line" />
    </li>
  </ol>
</template>
