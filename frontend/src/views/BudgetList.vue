<template>
  <div class="budget-page">
    <div class="page-sticky-head">
      <van-nav-bar title="婚礼账本">
        <template #right>
          <van-icon name="plus" size="20" color="#f091a0" @click="$router.push('/budgets/create')" />
        </template>
      </van-nav-bar>
    </div>

    <div class="page-content">
      <!-- ===== 总预算卡片 ===== -->
      <div class="budget-summary">
        <div class="bs-top">
          <div class="bs-item">
            <span class="bs-label">总预算</span>
            <span class="bs-value">¥{{ formatMoney(totalEstimated) }}</span>
          </div>
          <div class="bs-divider"></div>
          <div class="bs-item">
            <span class="bs-label">已支出</span>
            <span class="bs-value spent">¥{{ formatMoney(totalActual) }}</span>
          </div>
          <div class="bs-divider"></div>
          <div class="bs-item">
            <span class="bs-label">剩余</span>
            <span class="bs-value" :class="remainingClass">¥{{ formatMoney(remaining) }}</span>
          </div>
        </div>
        <div class="bs-bar">
          <div class="bs-track">
            <div class="bs-fill" :style="{ width: barWidth + '%' }" :class="barColorClass"></div>
          </div>
          <span class="bs-text">{{ (spentRatio * 100).toFixed(1) }}%</span>
        </div>
        <div class="bs-action" @click="showBudgetGoal = true">🎯 调整总预算目标</div>
      </div>

      <!-- ===== 分类明细 ===== -->
      <div class="section-title">📂 分类细则</div>

      <div class="category-list">
        <div v-for="cat in categorySummary" :key="cat.category"
          class="cat-row" :class="{ active: selectedCategory === cat.category }" @click="toggleCategory(cat.category)">
          <div class="cat-left">
            <span class="cat-name">{{ cat.category }}</span>
            <span class="cat-bar-mini">
              <span class="cf" :style="{ width: cat.percent > 100 ? 100 : cat.percent + '%' }"
                :class="cat.percent > 100 ? 'over' : ''"></span>
            </span>
          </div>
          <div class="cat-right">
            <span class="cat-amount">¥{{ formatMoney(cat.actual) }}</span>
            <span class="cat-est">/ ¥{{ formatMoney(cat.estimated) }}</span>
          </div>
        </div>
      </div>

      <!-- ===== 具体项目 ===== -->
      <div class="section-title" style="margin-top:16px">
        📝 具体项目
        <span v-if="selectedCategory" class="filter-badge" @click.stop="selectedCategory = null">
          {{ selectedCategory }} ✕
        </span>
      </div>

      <div v-for="item in filteredItems" :key="item.id" class="item-card" @click="$router.push(`/budgets/${item.id}/edit`)">
        <div class="ic-top">
          <span class="ic-name">{{ item.item_name }}</span>
          <span class="ic-amount">¥{{ formatMoney(item.actual_amount) }}</span>
        </div>
        <div class="ic-bottom">
          <span class="ic-cat">{{ item.category }}</span>
          <span v-if="item.vendor" class="ic-vendor">🏪 {{ item.vendor }}</span>
          <span class="ic-est">预算 ¥{{ formatMoney(item.estimated_amount) }}</span>
          <span v-if="item.is_paid" class="tag-soft success">已结清</span>
          <span v-else class="tag-soft danger">未结</span>
        </div>
        <div v-if="item.remark" class="ic-remark">📝 {{ item.remark }}</div>
      </div>
      <van-empty v-if="filteredItems.length === 0" description="还没有预算记录" />
    </div>

    <!-- 预算目标设置 -->
    <van-dialog v-model:show="showBudgetGoal" title="设置总预算" show-cancel-button
      @confirm="handleBudgetGoal" confirm-button-text="保存">
      <div class="dialog-form">
        <van-field v-model="budgetGoalInput" label="总预算" type="digit" placeholder="300000" />
      </div>
    </van-dialog>

    <!-- 底部导航 -->
    <div class="bottom-nav">
      <div class="nav-item" :class="{ 'nav-active': isHome }" @click="$router.push('/')">
        <div class="nav-indicator"></div>
        <div class="nav-icon">🏠</div>
        <div class="nav-label">首页</div>
      </div>
      <div class="nav-item" :class="{ 'nav-active': isTasks }" @click="$router.push('/tasks')">
        <div class="nav-icon">📋</div>
        <div class="nav-label">清单</div>
      </div>
      <div class="nav-item" :class="{ 'nav-active': isBudgets }" @click="$router.push('/budgets')">
        <div class="nav-icon">💰</div>
        <div class="nav-label">预算</div>
      </div>
      <div class="nav-item" :class="{ 'nav-active': isGuests }" @click="$router.push('/guests')">
        <div class="nav-icon">👥</div>
        <div class="nav-label">宾客</div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import { useBudgetStore } from '@/stores/budget';

const budgetStore = useBudgetStore();
const activeTab = ref('budgets');
const showBudgetGoal = ref(false);
const budgetGoalInput = ref('');
const selectedCategory = ref(null);

const route = useRoute();
const isHome = computed(() => route.path === '/');
const isTasks = computed(() => route.path.startsWith('/task'));
const isBudgets = computed(() => route.path.startsWith('/budget'));
const isGuests = computed(() => route.path.startsWith('/guest'));

const totalEstimated = computed(() => budgetStore.totalEstimated);
const totalActual = computed(() => budgetStore.totalActual);
const remaining = computed(() => totalEstimated.value - totalActual.value);
const spentRatio = computed(() => budgetStore.spentRatio);
const barWidth = computed(() => Math.min(spentRatio.value * 100, 100));
const barColorClass = computed(() => spentRatio.value > 1 ? 'over' : spentRatio.value > 0.8 ? 'warn' : '');
const remainingClass = computed(() => remaining.value < 0 ? 'over' : remaining.value < totalEstimated.value * 0.2 ? 'warn' : '');

const categorySummary = computed(() => {
  return (budgetStore.summary?.byCategory || []).map(c => ({
    ...c,
    percent: c.estimated > 0 ? (c.actual / c.estimated) * 100 : 0
  }));
});

const filteredItems = computed(() => {
  if (!selectedCategory.value) return budgetStore.items;
  return budgetStore.items.filter(item => item.category === selectedCategory.value);
});

function toggleCategory(cat) {
  if (selectedCategory.value === cat) {
    selectedCategory.value = null;
  } else {
    selectedCategory.value = cat;
  }
}

function formatMoney(n) {
  if (!n) return '0';
  return Number(n).toLocaleString('zh-CN');
}

async function handleBudgetGoal() {
  const val = Number(budgetGoalInput.value);
  if (val > 0) {
    // Update budget_total in settings
    try {
      const request = (await import('@/api/request')).default;
      await request.post('/settings', { key: 'budget_total', value: JSON.stringify({ total: val }) });
      showToast('✅ 预算目标已更新');
      await budgetStore.fetchAll();
    } catch { showToast('保存失败'); }
  }
}

onMounted(() => budgetStore.fetchAll());
</script>

<style scoped>
.budget-page { min-height: 100vh; background: var(--bg-page); }

/* 预算汇总 */
.budget-summary {
  background: #fff; border-radius: var(--radius-lg); padding: 20px 16px; margin-bottom: 16px;
  box-shadow: var(--shadow-card); border: 1px solid var(--border-light);
}
.bs-top { display: flex; margin-bottom: 14px; }
.bs-item { flex: 1; text-align: center; }
.bs-divider { width: 1px; background: var(--border); margin: 4px 0; }
.bs-label { display: block; font-size: 11px; color: var(--text-tertiary); margin-bottom: 4px; }
.bs-value { display: block; font-size: 18px; font-weight: 700; color: var(--text-primary); }
.bs-value.spent { color: var(--primary); }
.bs-value.over { color: var(--danger); }
.bs-value.warn { color: var(--warning); }

.bs-bar { display: flex; align-items: center; gap: 10px; }
.bs-track { flex: 1; height: 6px; background: var(--border); border-radius: 3px; overflow: hidden; }
.bs-fill { height: 100%; background: var(--primary-gradient); border-radius: 3px; transition: width 0.6s; }
.bs-fill.over { background: var(--danger); }
.bs-fill.warn { background: linear-gradient(90deg, var(--warning), var(--danger)); }
.bs-text { font-size: 12px; font-weight: 600; color: var(--text-secondary); }

.bs-action {
  margin-top: 12px; text-align: center; font-size: 12px; color: var(--primary);
  cursor: pointer; padding: 6px; border-radius: var(--radius);
}
.bs-action:active { background: var(--primary-light); }

/* 分类 */
.section-title {
  font-size: 15px; font-weight: 600; color: var(--text-primary);
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.category-list {
  background: #fff; border-radius: var(--radius); overflow: hidden;
  margin-bottom: 12px; border: 1px solid var(--border-light);
}
.cat-row {
  display: flex; align-items: center; justify-content: space-between;
  padding: 12px 16px; border-bottom: 1px solid var(--border); cursor: pointer;
}
.cat-row:last-child { border-bottom: none; }
.cat-row:active { background: var(--bg-page); }

.cat-left { display: flex; flex-direction: column; gap: 6px; flex: 1; min-width: 0; }
.cat-name { font-size: 14px; font-weight: 500; color: var(--text-primary); }
.cat-bar-mini { height: 4px; background: var(--border); border-radius: 2px; overflow: hidden; max-width: 120px; }
.cf { display: block; height: 100%; background: var(--primary-gradient); border-radius: 2px; transition: width 0.4s; }
.cf.over { background: var(--danger); }

.cat-right { text-align: right; flex-shrink: 0; }
.cat-amount { display: block; font-size: 15px; font-weight: 600; color: var(--text-primary); }
.cat-est { display: block; font-size: 11px; color: var(--text-tertiary); }

/* 项目卡片 */
.item-card {
  background: #fff; border-radius: var(--radius); padding: 14px 16px;
  margin-bottom: 8px; box-shadow: var(--shadow-sm); cursor: pointer;
  border: 1px solid var(--border-light);
}
.item-card:active { background: var(--bg-page); }
.ic-top { display: flex; justify-content: space-between; margin-bottom: 6px; }
.ic-name { font-size: 14px; font-weight: 600; color: var(--text-primary); }
.ic-amount { font-size: 16px; font-weight: 700; color: var(--primary); }
.ic-bottom { display: flex; flex-wrap: wrap; gap: 6px; font-size: 11px; color: var(--text-tertiary); align-items: center; }
.ic-cat { background: var(--primary-light); color: var(--primary-dark); padding: 1px 8px; border-radius: 10px; }
.ic-est { color: var(--text-secondary); }
.ic-remark { font-size: 11px; color: var(--text-secondary); margin-top: 6px; padding-top: 6px; border-top: 1px dashed var(--border); line-height: 1.4; }

.tag-soft { padding: 1px 8px; border-radius: 10px; font-size: 10px; font-weight: 500; }
.tag-soft.success { background: var(--success-bg); color: var(--success); }
.tag-soft.danger { background: var(--danger-bg); color: var(--danger); }

.dialog-form { padding: 8px 16px; }
.dialog-form :deep(.van-cell) { padding-left: 0; padding-right: 0; }

/* ===== 底部导航 ===== */
.bottom-nav {
  position: fixed;
  bottom: 0; left: 0; right: 0;
  height: 70px;
  background: #FFFFFF;
  border-top: 1px solid #EEEEEE;
  display: flex;
  align-items: center;
  z-index: 100;
}
.nav-item {
  flex: 1; display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  gap: 2px; cursor: pointer; position: relative;
  padding: 8px 0;
}
.nav-indicator {
  position: absolute; top: 0; left: 50%;
  transform: translateX(-50%);
  width: 20px; height: 3px;
  background: #F26B8A;
  border-radius: 0 0 2px 2px;
}
.nav-active .nav-indicator { display: block; }
.nav-item:not(.nav-active) .nav-indicator { display: none; }
.nav-icon { font-size: 22px; line-height: 1; }
.nav-label { font-size: 11px; color: #999999; }
.nav-active .nav-label { color: #F26B8A; font-weight: 600; }

.page-content {
  padding-bottom: 80px;
}

/* 分类选中高亮 */
.cat-row.active {
  background: var(--primary-light);
  border-left: 3px solid var(--primary);
}

/* 筛选标签 */
.filter-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  font-weight: 500;
  background: var(--primary);
  color: #fff;
  padding: 2px 10px;
  border-radius: 12px;
  cursor: pointer;
}

.page-sticky-head {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
}
</style>
