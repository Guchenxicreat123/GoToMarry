<template>
  <van-cell :title="budget.itemName" :label="budget.category" border>
    <template #title>
      <div class="budget-header">
        <span>{{ budget.itemName }}</span>
        <span class="amount">¥{{ budget.actualAmount }}</span>
      </div>
    </template>
    <van-progress
      :percentage="spentRatio"
      :pivot-text="pivotText"
      :stroke-width="8"
      :color="progressColor"
    />
    <div class="budget-footer">
      <span>预估: ¥{{ budget.estimatedAmount }}</span>
      <span class="status" :class="isPaid ? 'paid' : 'unpaid'">
        {{ isPaid ? '✅ 已结清' : '⏳ 未结清' }}
      </span>
    </div>
    <div class="budget-vendor" v-if="budget.vendor">
      <van-icon name="shop-o" size="12" />
      <span>{{ budget.vendor }}</span>
    </div>
  </van-cell>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  budget: { type: Object, required: true }
});

const spentRatio = computed(() => {
  if (!props.budget.estimatedAmount || props.budget.estimatedAmount <= 0) return 0;
  return Math.round((props.budget.actualAmount / props.budget.estimatedAmount) * 100);
});

const isPaid = computed(() => props.budget.isPaid === 1);

const progressColor = computed(() => {
  const ratio = spentRatio.value / 100;
  if (ratio > 1) return '#ee0a24';
  if (ratio > 0.8) return '#ff976a';
  return '#07c160';
});

const pivotText = computed(() => {
  if (spentRatio.value > 100) return '超支';
  return `${spentRatio.value}%`;
});
</script>

<style scoped>
.budget-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount {
  font-weight: bold;
  color: #e88d7a;
}

.budget-footer {
  display: flex;
  justify-content: space-between;
  font-size: 12px;
  color: #969799;
  margin-top: 6px;
}

.status {
  font-weight: bold;
}

.status.paid { color: #07c160; }
.status.unpaid { color: #ee0a24; }

.budget-vendor {
  font-size: 12px;
  color: #969799;
  margin-top: 4px;
  display: flex;
  align-items: center;
  gap: 4px;
}
</style>
