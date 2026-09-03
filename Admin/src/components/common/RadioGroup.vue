<script setup lang="ts">
import { useId } from 'vue'
import { RadioGroupRoot, RadioGroupItem, RadioGroupIndicator } from 'reka-ui'
import Label from './Label.vue'
import styles from './RadioGroup.module.css'

interface RadioOption {
  value: string
  label?: any
  content?: any
  disabled?: boolean
  hideIndicator?: boolean
  itemClass?: string
}

withDefaults(
  defineProps<{
    modelValue: string
    options: RadioOption[]
    label?: string
    disabled?: boolean
    groupClass?: string
    optionClass?: string
    itemClass?: string
    bare?: boolean
  }>(),
  {
    disabled: false,
  },
)

const inputId = useId()
</script>

<template>
  <div v-if="!bare" :class="styles.wrapper">
    <span v-if="label" :class="styles.label">{{ label }}</span>
    <RadioGroupRoot
      :class="[styles.group, groupClass]"
      :model-value="modelValue"
      :disabled="disabled"
      @update:model-value="$emit('update:modelValue', $event)"
    >
      <div
        v-for="option in options"
        :key="option.value"
        :class="[styles.option, optionClass]"
      >
        <RadioGroupItem
          :id="`${inputId}-${option.value}`"
          :value="option.value"
          :disabled="disabled || option.disabled"
          :class="[styles.item, itemClass, option.itemClass]"
        >
          <template v-if="option.content !== undefined">
            <component
              :is="option.content"
              v-if="typeof option.content !== 'string'"
            />
            <template v-else>{{ option.content }}</template>
          </template>
          <RadioGroupIndicator
            v-else-if="!option.hideIndicator"
            :class="styles.indicator"
          />
        </RadioGroupItem>
        <Label
          v-if="option.content === undefined && option.label !== undefined"
          :html-for="`${inputId}-${option.value}`"
          :class="styles.optionLabel"
        >
          <component
            :is="option.label"
            v-if="typeof option.label !== 'string'"
          />
          <template v-else>{{ option.label }}</template>
        </Label>
      </div>
    </RadioGroupRoot>
  </div>
  <RadioGroupRoot
    v-else
    :class="groupClass"
    :model-value="modelValue"
    :disabled="disabled"
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <RadioGroupItem
      v-for="option in options"
      :key="option.value"
      :value="option.value"
      :disabled="disabled || option.disabled"
      :class="[styles.item, itemClass, option.itemClass]"
    >
      <template v-if="option.content !== undefined">
        <component
          :is="option.content"
          v-if="typeof option.content !== 'string'"
        />
        <template v-else>{{ option.content }}</template>
      </template>
      <RadioGroupIndicator
        v-else-if="!option.hideIndicator"
        :class="styles.indicator"
      />
    </RadioGroupItem>
  </RadioGroupRoot>
</template>
