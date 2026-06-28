<template>
  <van-cell :title="guest.name" :label="guest.relation" border>
    <template #title>
      <div class="guest-header">
        <span>{{ guest.name }}</span>
        <AssigneeTag :assignee="guest.side === 'groom' ? 'groom' : 'bride'" />
      </div>
    </template>
    <template #label>
      <div class="guest-info">
        <span>👥 {{ guest.attendCount }}人</span>
        <span v-if="guest.tableName" class="table-info">🪑 {{ guest.tableName }}</span>
      </div>
    </template>
    <template #right-icon>
      <van-tag :type="guest.isConfirmed ? 'success' : 'danger'">
        {{ guest.isConfirmed ? '已确认' : '未确认' }}
      </van-tag>
    </template>
  </van-cell>
</template>

<script setup>
const props = defineProps({
  guest: { type: Object, required: true }
});
</script>

<style scoped>
.guest-header {
  display: flex;
  align-items: center;
  gap: 6px;
}

.guest-info {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
}

.table-info {
  color: #d4a574;
}
</style>
