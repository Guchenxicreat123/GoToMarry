<template>
  <div class="gift-page">
    <van-nav-bar title="🧧 礼金记录">
      <template #right>
        <van-icon name="share" size="20" color="#f091a0" style="margin-right: 16px;" @click="handleExport" />
        <van-icon name="plus" size="20" color="#f091a0" @click="showAddDialog = true" />
      </template>
    </van-nav-bar>

    <div class="page-content">
      <!-- 汇总 -->
      <div class="gift-summary">
        <div class="gs-item">
          <span class="gs-num">¥{{ formatMoney(summary.totalAmount) }}</span>
          <span class="gs-label">礼金总额</span>
        </div>
        <div class="gs-divider"></div>
        <div class="gs-item">
          <span class="gs-num">{{ summary.totalCount }}</span>
          <span class="gs-label">笔数</span>
        </div>
        <div class="gs-divider"></div>
        <div class="gs-item">
          <span class="gs-num groom">¥{{ formatMoney(summary.groomTotal) }}</span>
          <span class="gs-label">男方</span>
        </div>
        <div class="gs-divider"></div>
        <div class="gs-item">
          <span class="gs-num bride">¥{{ formatMoney(summary.brideTotal) }}</span>
          <span class="gs-label">女方</span>
        </div>
      </div>

      <!-- 列表（左滑出现删除） -->
      <van-swipe-cell v-for="gift in items" :key="gift.id">
        <div class="gift-card" @click="editGift(gift)">
          <div class="gc-top">
            <div class="gc-left">
              <span class="gc-name">{{ gift.guest_name }}</span>
              <span class="gc-tag" v-if="gift.side === 'groom'">男方</span>
              <span class="gc-tag bride" v-else-if="gift.side === 'bride'">女方</span>
            </div>
            <span class="gc-amount">¥{{ formatMoney(gift.amount) }}</span>
          </div>
          <div class="gc-bottom">
            <span v-if="gift.gift_type" class="gc-type">{{ gift.gift_type }}</span>
            <span v-if="gift.date_given" class="gc-date">📅 {{ gift.date_given }}</span>
            <span v-if="gift.notes" class="gc-notes">📝 {{ gift.notes }}</span>
          </div>
        </div>
        <template #right>
          <div class="delete-btn" @click.stop="handleDelete(gift)">
            <van-icon name="delete" size="20" />
            <span>删除</span>
          </div>
        </template>
      </van-swipe-cell>
      <van-empty v-if="items.length === 0" description="还没有礼金记录" />
    </div>

    <!-- 添加/编辑弹窗 -->
    <van-dialog v-model:show="showAddDialog" :title="editingGiftId ? '编辑礼金' : '记礼金'"
      show-cancel-button @confirm="handleSave" confirm-button-text="保存">
      <div class="dialog-form">
        <van-field v-model="giftForm.guestName" label="宾客" placeholder="姓名" :rules="[{required:true}]" />
        <van-field v-model="giftForm.amount" label="金额" type="digit" placeholder="0" />
        <van-field v-model="giftForm.giftType" label="类型" is-link readonly placeholder="选择类型"
          @click="showGiftType = true" />
        <van-field v-model="giftForm.dateGiven" label="日期" type="date" />
        <van-field v-model="giftForm.side" label="关系" is-link readonly placeholder="选择"
          @click="showGiftSide = true" />
        <van-field v-model="giftForm.notes" label="备注" placeholder="选填" />
      </div>
    </van-dialog>
    <van-action-sheet v-model:show="showGiftSide" :actions="giftSideOptions"
      @select="v => { giftForm.side = v.value; showGiftSide = false; }" />
    <van-action-sheet v-model:show="showGiftType" :actions="giftTypeOptions"
      @select="v => { giftForm.giftType = v.value; showGiftType = false; }" />

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
import { ref, computed, reactive, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { showDialog, showToast } from 'vant';
import { useGiftStore } from '@/stores/gift';

const giftStore = useGiftStore();
const activeTab = ref('');
const showAddDialog = ref(false);
const showGiftSide = ref(false);
const showGiftType = ref(false);
const editingGiftId = ref(null);

const route = useRoute();
const isHome = computed(() => route.path === '/');
const isTasks = computed(() => route.path.startsWith('/task'));
const isBudgets = computed(() => route.path.startsWith('/budget'));
const isGuests = computed(() => route.path.startsWith('/guest'));

const giftForm = reactive({
  guestName: '', amount: '', giftType: '', dateGiven: '', side: '', notes: ''
});

const giftSideOptions = [
  { name: '男方亲友', value: 'groom' },
  { name: '女方亲友', value: 'bride' }
];

const giftTypeOptions = [
  { name: '💰 现金', value: '现金' },
  { name: '💳 转账', value: '转账' },
  { name: '🧧 微信红包', value: '微信红包' },
  { name: '🎁 实物', value: '实物' },
  { name: '💳 刷卡/扫码', value: '刷卡/扫码' },
  { name: '其他', value: '其他' }
];

const items = computed(() => giftStore.items);
const summary = computed(() => giftStore.summary || { totalAmount: 0, totalCount: 0, groomTotal: 0, brideTotal: 0 });

function editGift(gift) {
  editingGiftId.value = gift.id;
  Object.assign(giftForm, {
    guestName: gift.guest_name,
    amount: String(gift.amount),
    giftType: gift.gift_type || '',
    dateGiven: gift.date_given || '',
    side: gift.side || '',
    notes: gift.notes || ''
  });
  showAddDialog.value = true;
}

async function handleExport() {
  try {
    showToast('正在导出...');
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gifts/export', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (data.code === 200) {
      showToast('✅ 已导出 ' + data.data.count + ' 条礼金记录');
    } else {
      showToast('导出失败: ' + (data.msg || '未知错误'));
    }
  } catch (err) {
    showToast('导出失败: ' + err.message);
  }
}

async function handleSave() {
  if (!giftForm.guestName) { showToast('请输入姓名'); return false; }
  const data = {
    guestName: giftForm.guestName,
    amount: Number(giftForm.amount) || 0,
    giftType: giftForm.giftType || '现金',
    dateGiven: giftForm.dateGiven || '',
    side: giftForm.side || '',
    notes: giftForm.notes || ''
  };
  if (editingGiftId.value) {
    await giftStore.updateGift(editingGiftId.value, data);
    showToast('✅ 已更新');
  } else {
    await giftStore.addGift(data);
    showToast('✅ 已记录');
  }
  resetForm();
  return true;
}

function resetForm() {
  editingGiftId.value = null;
  giftForm.guestName = ''; giftForm.amount = '';
  giftForm.giftType = ''; giftForm.dateGiven = ''; giftForm.side = ''; giftForm.notes = '';
}

function formatMoney(n) { return (n || 0).toLocaleString('zh-CN'); }

async function handleDelete(gift) {
  try {
    await showDialog({
      title: '确认删除',
      message: `确定删除 <b>${gift.guest_name}</b> 的 ¥{{ formatMoney(gift.amount) }} 礼金记录？`,
      confirmButtonColor: '#f091a0'
    });
    await giftStore.deleteGift(gift.id);
    showToast('✅ 已删除');
  } catch {
    // 取消操作
  }
}

onMounted(() => giftStore.fetchAll());
</script>

<style scoped>
.gift-page { min-height: 100vh; background: var(--bg-page); }

.gift-summary {
  display: flex; align-items: center;
  background: #fff; border-radius: var(--radius); padding: 16px;
  margin-bottom: 16px; box-shadow: var(--shadow-card);
  border: 1px solid var(--border-light);
}
.gs-item { flex: 1; text-align: center; }
.gs-divider { width: 1px; height: 30px; background: var(--border); }
.gs-num { display: block; font-size: 18px; font-weight: 700; color: var(--text-primary); }
.gs-num.groom { color: var(--info); }
.gs-num.bride { color: var(--primary); }
.gs-label { display: block; font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }

.gift-card {
  background: #fff; border-radius: var(--radius); padding: 14px 16px;
  margin-bottom: 8px; box-shadow: var(--shadow-sm); cursor: pointer;
  border: 1px solid var(--border-light);
}
.gift-card:active { background: var(--bg-page); }
.gc-top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
.gc-left { display: flex; align-items: center; gap: 6px; }
.gc-name { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.gc-tag { font-size: 10px; padding: 1px 6px; border-radius: 10px; background: var(--info-bg); color: var(--info); }
.gc-tag.bride { background: var(--primary-light); color: var(--primary-dark); }
.gc-amount { font-size: 18px; font-weight: 700; color: var(--gold); }
.gc-bottom { display: flex; flex-wrap: wrap; gap: 8px; font-size: 11px; color: var(--text-tertiary); }

.dialog-form { padding: 8px 16px; }
.dialog-form :deep(.van-cell) { padding-left: 0; padding-right: 0; }

/* 左滑删除按钮 */
.delete-btn {
  height: 100%;
  background: var(--danger);
  color: #fff;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 60px;
  font-size: 12px;
  gap: 2px;
}

.delete-btn:active {
  background: #c0392b;
}

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
</style>
