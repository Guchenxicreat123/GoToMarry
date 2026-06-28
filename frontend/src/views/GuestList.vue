<template>
  <div class="guest-page">
    <div class="page-sticky-head">
      <van-nav-bar title="宾客管理">
        <template #right>
          <van-icon name="share-o" size="18" @click="handleExport" />
          <van-icon name="plus" style="margin-left:16px" @click="$router.push('/guests/batch')" />
        </template>
      </van-nav-bar>
    </div>

    <div class="page-content">
      <!-- 汇总卡片 -->
      <div class="guest-summary">
        <div class="gs-item">
          <span class="gs-value">{{ stats.total }}</span>
          <span class="gs-label">全部</span>
        </div>
        <div class="gs-divider"></div>
        <div class="gs-item">
          <span class="gs-value confirmed">{{ stats.confirmed }}</span>
          <span class="gs-label">已确认</span>
        </div>
        <div class="gs-divider"></div>
        <div class="gs-item">
          <span class="gs-value attend">{{ stats.totalAttendCount }}</span>
          <span class="gs-label">出席人数</span>
        </div>
      </div>

      <!-- 筛选 -->
      <div class="filter-row">
        <van-radio-group v-model="filterType" direction="horizontal">
          <van-radio name="" class="filter-radio">全部</van-radio>
          <van-radio name="groom" class="filter-radio">男方亲友</van-radio>
          <van-radio name="bride" class="filter-radio">女方亲友</van-radio>
          <van-radio name="unconfirmed" class="filter-radio">未确认</van-radio>
        </van-radio-group>
      </div>

      <!-- 宾客列表 -->
      <div class="card-group" style="margin-top:0">
        <van-cell-group>
          <div v-for="guest in filteredGuests" :key="guest.id">
            <van-swipe-cell>
              <div class="guest-row" @click="editGuest(guest)">
                <div class="gr-left">
                  <div class="gr-avatar" :class="guest.side">
                    {{ guest.name[0] }}
                  </div>
                  <div class="gr-info">
                    <div class="gr-name-line">
                      <span class="gr-name">{{ guest.name }}</span>
                      <span class="gr-relation" v-if="guest.relation">{{ guest.relation }}</span>
                    </div>
                    <div class="gr-detail">
                      <span>👥 {{ guest.attend_count }}人</span>
                      <span v-if="guest.tableName">🪑 {{ guest.tableName }}</span>
                    </div>
                  </div>
                </div>
                <div class="gr-right">
                  <van-tag v-if="guest.side === 'groom'" type="primary" plain round size="small" style="margin-bottom:4px">男方亲友</van-tag>
                  <van-tag v-else-if="guest.side === 'bride'" type="warning" plain round size="small" style="margin-bottom:4px">女方亲友</van-tag>
                  <van-tag v-if="guest.is_confirmed" type="success" round size="small">已确认</van-tag>
                  <van-tag v-else round size="small" plain>未确认</van-tag>
                </div>
              </div>
              <template #right>
                <van-button square type="danger" text="删除" @click="handleDelete(guest)" class="swipe-delete-btn" />
              </template>
            </van-swipe-cell>
          </div>
          <van-empty v-if="filteredGuests.length === 0" description="还没有宾客数据" />
        </van-cell-group>
      </div>
    </div>

    <!-- ===== 新增按钮（悬浮） ===== -->
    <div class="fab-add" @click="$router.push('/guests/create')">
      <van-icon name="plus" size="22" />
    </div>

    <!-- ===== 编辑弹窗 ===== -->
    <van-dialog v-model:show="showEditDialog" title="编辑宾客" show-cancel-button
      @confirm="handleEditSave" confirm-button-text="保存">
      <div class="dialog-form">
        <van-field v-model="editForm.name" label="姓名" placeholder="姓名" :rules="[{required:true}]" />
        <van-field v-model="editForm.phone" label="电话" type="tel" placeholder="手机号" />
        <van-field v-model="editForm.relation" label="关系" is-link readonly placeholder="选择"
          @click="showEditRelation = true" />
        <van-cell center title="人数">
          <template #right-icon>
            <van-stepper v-model="editForm.attendCount" min="1" max="5" button-size="24" />
          </template>
        </van-cell>
        <van-field :model-value="editSideLabel" label="亲友方" is-link readonly placeholder="选择"
          @click="showEditSide = true" />
        <van-cell center title="已发请帖">
          <template #right-icon>
            <van-switch v-model="editForm.isInvited" size="20" />
          </template>
        </van-cell>
        <van-cell center title="确认出席">
          <template #right-icon>
            <van-switch v-model="editForm.isConfirmed" size="20" />
          </template>
        </van-cell>
      </div>
    </van-dialog>
    <van-action-sheet v-model:show="showEditSide" :actions="editSideOptions"
      @select="v => { editForm.side = v.value; showEditSide = false; }" />
    <van-action-sheet v-model:show="showEditRelation" :actions="editRelationOptions"
      @select="v => { editForm.relation = v.value; showEditRelation = false; }" />

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
import { showToast, showConfirmDialog } from 'vant';
import { useGuestStore } from '@/stores/guest';

const guestStore = useGuestStore();
const activeTab = ref('guests');
const filterType = ref('');
const showEditDialog = ref(false);
const showEditSide = ref(false);
const showEditRelation = ref(false);
const editingGuestId = ref(null);

const route = useRoute();
const isHome = computed(() => route.path === '/');
const isTasks = computed(() => route.path.startsWith('/task'));
const isBudgets = computed(() => route.path.startsWith('/budget'));
const isGuests = computed(() => route.path.startsWith('/guest'));

const editForm = reactive({
  name: '', phone: '', relation: '', attendCount: 1, side: '',
  isInvited: false, isConfirmed: false
});

const editSideOptions = [
  { name: '男方亲友', value: 'groom' },
  { name: '女方亲友', value: 'bride' }
];

const editRelationOptions = [
  { name: '亲戚', value: '亲戚' },
  { name: '同学', value: '同学' },
  { name: '同事', value: '同事' },
  { name: '朋友', value: '朋友' },
  { name: '其他', value: '其他' }
];

const editSideLabel = computed(() => {
  const map = { groom: '男方', bride: '女方' };
  return map[editForm.side] || '';
});

function editGuest(guest) {
  editingGuestId.value = guest.id;
  editForm.name = guest.name;
  editForm.phone = guest.phone || '';
  editForm.relation = guest.relation || '';
  editForm.attendCount = guest.attend_count || 1;
  editForm.side = guest.side || '';
  editForm.isInvited = Boolean(guest.is_invited);
  editForm.isConfirmed = Boolean(guest.is_confirmed);
  showEditDialog.value = true;
}

async function handleEditSave() {
  if (!editForm.name) { showToast('请输入姓名'); return false; }
  try {
    await guestStore.updateGuest(editingGuestId.value, {
      name: editForm.name,
      phone: editForm.phone,
      relation: editForm.relation,
      attendCount: editForm.attendCount,
      side: editForm.side,
      isInvited: editForm.isInvited,
      isConfirmed: editForm.isConfirmed
    });
    showToast('✅ 已更新');
    return true;
  } catch (err) {
    showToast('更新失败: ' + (err.message || ''));
    return false;
  }
}

const stats = computed(() => guestStore.summary || { total: 0, confirmed: 0, totalAttendCount: 0 });

const filteredGuests = computed(() => {
  let list = guestStore.items;
  if (filterType.value === 'unconfirmed') {
    list = list.filter(g => !g.is_confirmed);
  } else if (filterType.value) {
    list = list.filter(g => g.side === filterType.value);
  }
  return [...list].sort((a, b) => (a.name || '').localeCompare(b.name || '', 'zh-CN'));
});

function formatMoney(n) {
  if (!n) return '0';
  return Number(n).toLocaleString('zh-CN');
}

async function handleExport() {
  try {
    showToast('正在导出...');
    const token = localStorage.getItem('token');
    const res = await fetch('/api/guests/export', {
      headers: { 'Authorization': 'Bearer ' + token }
    });
    const data = await res.json();
    if (data.code === 200) {
      showToast('✅ 已导出 ' + data.data.count + ' 位宾客');
    } else {
      showToast('导出失败: ' + (data.msg || '未知错误'));
    }
  } catch (err) {
    showToast('导出失败: ' + err.message);
  }
}

async function handleDelete(guest) {
  try {
    await showConfirmDialog({
      title: '确认删除',
      message: `确定要删除宾客「${guest.name}」吗？此操作不可恢复。`,
      confirmButtonColor: '#ee4444'
    });
    await guestStore.deleteGuest(guest.id);
    showToast('✅ 已删除');
  } catch {
    // 用户取消
  }
}

onMounted(() => guestStore.fetchAll());
</script>

<style scoped>
.guest-page {
  min-height: 100vh;
  background: var(--bg-page);
}

/* ===== 汇总卡片 ===== */
.guest-summary {
  display: flex;
  align-items: center;
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 16px 12px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-card);
}

.gs-item {
  flex: 1;
  text-align: center;
}

.gs-divider {
  width: 1px;
  height: 28px;
  background: var(--border);
}

.gs-value {
  display: block;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-primary);
}

.gs-value.confirmed { color: var(--success); }
.gs-value.attend { color: var(--primary); }


.gs-label {
  display: block;
  font-size: 11px;
  color: var(--text-tertiary);
  margin-top: 2px;
}

/* ===== 筛选 ===== */
.filter-row {
  margin-bottom: 12px;
  padding: 0 2px;
}

.filter-row :deep(.van-radio-group) {
  display: flex;
  gap: 8px;
}

.filter-radio :deep(.van-radio__label) {
  font-size: 13px;
}

/* ===== 宾客行 ===== */
.guest-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
}

/* ===== 左滑删除按钮 ===== */
.swipe-delete-btn {
  height: 100%;
  border-radius: 0;
}

.guest-row:active { background: var(--bg-page); }

.gr-left {
  display: flex;
  align-items: center;
  gap: 10px;
  flex: 1;
  min-width: 0;
}

.gr-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  color: #fff;
  flex-shrink: 0;
}

.gr-avatar.groom { background: linear-gradient(135deg, #5c7cfa, #7e9cff); }
.gr-avatar.bride { background: linear-gradient(135deg, #e88d7a, #f0a88f); }

.gr-name-line {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 3px;
}

.gr-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-primary);
}

.gr-relation {
  font-size: 11px;
  color: var(--text-tertiary);
  background: var(--bg-tag);
  padding: 1px 8px;
  border-radius: 10px;
}

.gr-detail {
  font-size: 11px;
  color: var(--text-tertiary);
  display: flex;
  gap: 8px;
}

.gr-right {
  flex-shrink: 0;
  margin-left: 10px;
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

/* 悬浮新增按钮（纯自定义，不用 Vant 浮标组件） */
.fab-add {
  position: fixed;
  bottom: 100px;
  right: 16px;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: #e88d7a;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(232, 141, 122, 0.4);
  z-index: 100;
  cursor: pointer;
}

.fab-add:active {
  opacity: 0.85;
}

/* Dialog 表单 */
.dialog-form {
  padding: 8px 16px;
}

.dialog-form :deep(.van-cell) {
  padding-left: 0;
  padding-right: 0;
}

.page-sticky-head {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
}
</style>
