<template>
  <span :class="['stage-tab', `stage-${stageValue}`]">
    {{ stageLabel }}
  </span>
</template>

<script setup>
import { computed } from 'vue';

const STAGES = {
  '12-months': { label: '婚前12月', class: '12-months' },
  '9-months': { label: '婚前9月', class: '9-months' },
  '6-months': { label: '婚前6月', class: '6-months' },
  '3-months': { label: '婚前3月', class: '3-months' },
  '1-month': { label: '婚前1月', class: '1-month' },
  'wedding-week': { label: '婚前一周', class: 'wedding-week' },
  'post-wedding': { label: '婚后收尾', class: 'post-wedding' },
};

const props = defineProps({
  stage: {
    type: String,
    required: true
  }
});

const stageConfig = computed(() => STAGES[props.stage] || { label: props.stage, class: 'unknown' });
const stageLabel = computed(() => stageConfig.value.label);
const stageValue = computed(() => stageConfig.value.class);
</script>

<style scoped>
.stage-tab {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 11px;
  color: #fff;
}

.stage-12-months { background: #1989fa; }
.stage-9-months { background: #1989fa; }
.stage-6-months { background: #07c160; }
.stage-3-months { background: #ff976a; }
.stage-1-month { background: #ff976a; }
.stage-wedding-week { background: #ee0a24; }
.stage-post-wedding { background: #969799; }
.stage-unknown { background: #f5f5f5; color: #969799; }
</style>
