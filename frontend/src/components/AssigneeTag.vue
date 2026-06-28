<template>
  <span :class="['assignee-tag', `assignee-${assignee}`]">
    <van-icon :name="icon" size="12" />
    <span class="label">{{ label }}</span>
  </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  assignee: {
    type: String,
    required: true
  }
});

const config = computed(() => {
  switch (props.assignee) {
    case 'groom':
      return { icon: 'male', label: '男方', class: 'groom' };
    case 'bride':
      return { icon: 'female', label: '女方', class: 'bride' };
    case 'both':
      return { icon: 'friends-o', label: '共同', class: 'both' };
    default:
      return { icon: 'user-o', label: props.assignee, class: 'unknown' };
  }
});

const icon = computed(() => config.value.icon);
const label = computed(() => config.value.label);
</script>

<style scoped>
.assignee-tag {
  display: inline-flex;
  align-items: center;
  gap: 2px;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  margin-left: 6px;
}

.assignee-groom {
  background: #e8f4ff;
  color: #1989fa;
}

.assignee-bride {
  background: #fdf2ef;
  color: #e88d7a;
}

.assignee-both {
  background: #f5ede3;
  color: #d4a574;
}

.assignee-unknown {
  background: #f5f5f5;
  color: #969799;
}
</style>
