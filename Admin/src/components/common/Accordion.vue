<script setup lang="ts">
import {
  AccordionRoot,
  AccordionItem,
  AccordionHeader,
  AccordionTrigger,
  AccordionContent,
} from 'reka-ui'
import { Icon } from '@iconify/vue'
import IconContainer from './IconContainer.vue'
import styles from './Accordion.module.css'
import { getIcon } from '@/icons'

interface AccordionItemType {
  value: string
  trigger?: any
  content?: any
  disabled?: boolean
}

withDefaults(
  defineProps<{
    items: AccordionItemType[]
    type?: 'single' | 'multiple'
    collapsible?: boolean
  }>(),
  {
    type: 'single',
    collapsible: false,
  },
)
</script>

<template>
  <AccordionRoot :class="styles.root" :type="type" :collapsible="collapsible">
    <AccordionItem
      v-for="item in items"
      :key="item.value"
      :value="item.value"
      :disabled="item.disabled"
      :class="styles.item"
    >
      <AccordionHeader :class="styles.header">
        <AccordionTrigger :class="styles.trigger">
          <span :class="styles.triggerText">
            <component
              :is="item.trigger"
              v-if="item.trigger && typeof item.trigger !== 'string'"
            />
            <template v-else>{{ item.trigger }}</template>
          </span>
          <IconContainer :size="16"
            ><Icon
              :icon="getIcon('chevronDown')"
              :class="styles.chevron"
              :width="16"
              :height="16"
          /></IconContainer>
        </AccordionTrigger>
      </AccordionHeader>
      <AccordionContent :class="styles.content">
        <div :class="styles.contentInner">
          <component
            :is="item.content"
            v-if="item.content && typeof item.content !== 'string'"
          />
          <template v-else>{{ item.content }}</template>
        </div>
      </AccordionContent>
    </AccordionItem>
  </AccordionRoot>
</template>
