<template>
  <van-progress
    :percentage="percentage"
    :pivot-text="pivotText"
    :stroke-width="strokeWidth"
    :color="color"
    :background-color="backgroundColor"
  />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  percentage: { type: Number, default: 0 },
  pivotText: { type: String, default: '' },
  strokeWidth: { type: Number, default: 10 },
  color: { type: [String, Object], default: '' },
  backgroundColor: { type: String, default: '#f0f0f0' }
});

const percentage = computed(() => Math.min(Math.max(props.percentage, 0), 100));
</script>
