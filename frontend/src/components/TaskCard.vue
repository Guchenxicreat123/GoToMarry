<template>
  <van-cell :title="task.title" :label="task.description" border @click="$emit('click', task)">
    <template #title>
      <div class="task-header">
        <span :class="priorityClass">{{ task.title }}</span>
        <AssigneeTag :assignee="task.assignee" />
        <StageTab :stage="task.stage" />
      </div>
    </template>
    <template #label>
      <div class="task-meta">
        <span v-if="task.dueDate" class="due-date">📅 {{ formatDate(task.dueDate) }}</span>
        <span v-if="task.status === 'doing'" class="doing-tag">跟进中</span>
      </div>
    </template>
    <template #right-icon>
      <van-checkbox
        :model-value="task.status === 'done'"
        @click.stop="$emit('toggle', task)"
      />
    </template>
  </van-cell>
</template>

<script setup>
import { computed } from 'vue';
import AssigneeTag from './AssigneeTag.vue';
import StageTab from './StageTab.vue';

const props = defineProps({
  task: { type: Object, required: true }
});

defineEmits(['click', 'toggle']);

const priorityClass = computed(() => `priority-${props.task.priority}`);

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}
</script>

<style scoped>
.task-header {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.task-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
}

.due-date {
  color: #969799;
}

.doing-tag {
  color: #1989fa;
  background: #eaf4ff;
  padding: 1px 6px;
  border-radius: 4px;
}

.priority-3 { color: #ee0a24; font-weight: bold; }
.priority-2 { color: #ff976a; }
.priority-1 { color: #323233; }
</style>
