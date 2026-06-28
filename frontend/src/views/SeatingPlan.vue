<template>
  <div class="seating-page">
    <!-- ===== 固定顶部（导航 + 统计 + 桌台列表/详情卡片） ===== -->
    <div class="sticky-top">
      <van-nav-bar :title="currentView === 'detail' ? selectedTable.name : '排座管理'" left-text="返回" left-arrow @click-left="goBack" />

      <!-- ===== 桌台列表视图 - 固定区 ===== -->
      <div v-if="currentView === 'list'">
        <!-- 已排座统计 -->
        <div class="stats-bar">
          <span class="stats-item">🏠 {{ seatedCount }}人已排座</span>
          <span class="stats-item">📭 {{ unseatedCount }}人待排座</span>
          <span class="stats-item">🪑 {{ tableStore.items.length }}桌</span>
        </div>

        <!-- 桌台列表 -->
        <div class="section-title">🪑 桌台</div>
        <van-cell-group inset>
          <van-cell
            v-for="table in tableStore.items"
            :key="table.id"
            clickable
            @click="openTableDetail(table)"
          >
            <template #title>
              <div class="table-name">{{ table.name }}</div>
              <div class="table-info">{{ table.location || '未设置位置' }} · {{ table.capacity }}人容量</div>
            </template>
            <template #value>
              <div class="table-count" :class="{ full: Number(table.guestCount) >= Number(table.capacity) }">
                {{ table.guestCount }}/{{ table.capacity }}人
              </div>
            </template>
            <template #right-icon>
              <van-icon name="arrow" class="cell-arrow" />
            </template>
          </van-cell>
          <van-cell clickable @click="showAddTable = true">
            <template #title>
              <van-icon name="plus" class="add-icon" />
              <span class="add-text">添加桌台</span>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- ===== 桌台详情视图 - 固定区 ===== -->
      <div v-if="currentView === 'detail'">
        <!-- 桌台信息卡片 -->
        <div class="table-card">
          <div class="table-card-header">
            <div>
              <div class="table-card-name">{{ selectedTable.name }}</div>
              <div class="table-card-info">{{ selectedTable.location || '未设置位置' }} · {{ selectedTable.capacity }}人容量</div>
            </div>
            <div class="table-card-count" :class="{ full: seatedAttendSum >= selectedTable.capacity }">
              {{ seatedAttendSum }}/{{ selectedTable.capacity }}人
            </div>
          </div>
          <div class="table-card-actions">
            <van-button size="small" @click="showEditTable = true">编辑桌台</van-button>
            <van-button size="small" type="danger" plain @click="handleDeleteTable">删除桌台</van-button>
          </div>
        </div>
      </div>
    </div>

    <!-- ===== 滚动内容区 ===== -->
    <div class="scroll-area">

      <!-- ===== 桌台列表视图 - 滚动区 ===== -->
      <div v-if="currentView === 'list'" class="content">
        <div class="section-title" style="margin-top: 4px;">👥 待排座宾客 ({{ unseatedGuests.length }}人)</div>
        <van-cell-group inset>
          <van-cell
            v-for="guest in unseatedGuests"
            :key="guest.id"
            clickable
            @click="showAssignDialog(guest)"
          >
            <template #title>
              <div class="guest-name">{{ guest.name }}</div>
              <div class="guest-info">{{ guest.side === 'groom' ? '🤵' : '👰' }} {{ guest.relation || '未分类' }} · {{ guest.attend_count || 1 }}人</div>
            </template>
            <template #value>
              <van-tag v-if="guest.is_confirmed" type="success" plain>已确认</van-tag>
              <van-tag v-else type="danger" plain>未确认</van-tag>
            </template>
            <template #right-icon>
              <van-icon name="arrow" class="cell-arrow" />
            </template>
          </van-cell>
          <van-cell v-if="unseatedGuests.length === 0" center>
            <template #title>
              <span class="empty-tip">🎉 所有宾客已排座完毕</span>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

      <!-- ===== 桌台详情视图 - 滚动区 ===== -->
      <div v-if="currentView === 'detail'" class="content">
        <div class="section-title">🍽️ 已入座 ({{ seatedAttendSum }}人)</div>
        <van-cell-group inset>
          <van-cell
            v-for="guest in seatedInTable"
            :key="guest.id"
          >
            <template #title>
              <div class="guest-name">{{ guest.name }}</div>
              <div class="guest-info">{{ guest.side === 'groom' ? '🤵' : '👰' }} {{ guest.relation || '未分类' }} · {{ guest.attend_count || 1 }}人</div>
            </template>
            <template #value>
              <van-tag v-if="guest.is_confirmed" type="success" plain>已确认</van-tag>
              <van-tag v-else type="danger" plain>未确认</van-tag>
            </template>
            <template #right-icon>
              <van-icon name="cross" class="remove-icon" @click.stop="removeGuestFromTable(guest)" />
            </template>
          </van-cell>
          <van-cell v-if="seatedInTable.length === 0" center>
            <template #title>
              <span class="empty-tip">暂无宾客入座</span>
            </template>
          </van-cell>
        </van-cell-group>

        <div class="section-title" style="margin-top: 20px;">➕ 从待排座中添加</div>
        <van-cell-group inset>
          <div
            v-for="guest in unseatedGuests"
            :key="guest.id"
            class="guest-add-row"
            @click="addGuestToTable(guest)"
          >
            <div class="guest-add-info">
              <div class="guest-name">{{ guest.name }}</div>
              <div class="guest-info">{{ guest.side === 'groom' ? '🤵' : '👰' }} {{ guest.relation || '未分类' }} · {{ guest.attend_count || 1 }}人</div>
            </div>
            <div class="guest-add-btn">+ 入座</div>
          </div>
          <van-cell v-if="unseatedGuests.length === 0" center>
            <template #title>
              <span class="empty-tip">没有待排座宾客了</span>
            </template>
          </van-cell>
        </van-cell-group>
      </div>

    </div>

    <!-- ===== 弹窗们 ===== -->

    <!-- 添加桌台 -->
    <van-dialog v-model:show="showAddTable" title="添加桌台" show-cancel-button @confirm="addTable">
      <div class="dialog-body">
        <van-field v-model="newTableName" label="桌名" placeholder="例如：女方亲戚桌" />
        <van-field v-model="newTableCapacity" label="容量" type="number" placeholder="10" unit="人" />
        <van-field v-model="newTableLocation" label="位置" placeholder="例如：主宴会厅 A 区" />
      </div>
    </van-dialog>

    <!-- 编辑桌台 -->
    <van-dialog v-model:show="showEditTable" title="编辑桌台" show-cancel-button @confirm="editTable">
      <div class="dialog-body">
        <van-field v-model="editTableName" label="桌名" placeholder="桌名" />
        <van-field v-model="editTableCapacity" label="容量" type="number" placeholder="10" unit="人" />
        <van-field v-model="editTableLocation" label="位置" placeholder="例如：主宴会厅 A 区" />
      </div>
    </van-dialog>

    <!-- 分配宾客弹窗（选择桌台） -->
    <van-action-sheet
      v-model:show="showAssignSheet"
      :actions="assignActions"
      cancel-text="取消"
      @select="onAssignSelect"
    />

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
import { useRouter, useRoute } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import { useGuestStore } from '@/stores/guest';
import { useTableStore } from '@/stores/table';

const router = useRouter();
const guestStore = useGuestStore();
const tableStore = useTableStore();

const activeTabBar = ref('guests');

const route = useRoute();
const isHome = computed(() => route.path === '/');
const isTasks = computed(() => route.path.startsWith('/task'));
const isBudgets = computed(() => route.path.startsWith('/budget'));
const isGuests = computed(() => route.path.startsWith('/guest'));

const currentView = ref('list');
const selectedTable = ref({});

// 添加桌台
const showAddTable = ref(false);
const newTableName = ref('');
const newTableCapacity = ref('10');
const newTableLocation = ref('');

// 编辑桌台
const showEditTable = ref(false);
const editTableName = ref('');
const editTableCapacity = ref('');
const editTableLocation = ref('');

// 分配宾客弹窗
const showAssignSheet = ref(false);
const assignActions = ref([]);
const pendingGuest = ref(null);

// 计算属性
const unseatedGuests = computed(() => guestStore.items.filter(g => !g.table_id));

const seatedInTable = computed(() => {
  if (!selectedTable.value.id) return [];
  return guestStore.items.filter(g => g.table_id === selectedTable.value.id);
});

const unseatedCount = computed(() => unseatedGuests.value.length);
const seatedCount = computed(() => guestStore.items.filter(g => g.table_id).reduce((sum, g) => sum + (g.attend_count || 1), 0));

// 当前桌台已入座人数总和
const seatedAttendSum = computed(() =>
  guestStore.items.filter(g => g.table_id === selectedTable.value.id).reduce((s, g) => s + (g.attend_count || 1), 0)
);

// 获取可选桌台
const availableTables = computed(() =>
  tableStore.items.filter(t => {
    const seated = guestStore.items.filter(g => g.table_id === t.id).reduce((sum, g) => sum + (g.attend_count || 1), 0);
    return seated < t.capacity;
  })
);

function openTableDetail(table) {
  selectedTable.value = table;
  editTableName.value = table.name;
  editTableCapacity.value = String(table.capacity);
  editTableLocation.value = table.location || '';
  currentView.value = 'detail';
}

function goBack() {
  if (currentView.value === 'detail') {
    currentView.value = 'list';
    selectedTable.value = {};
  } else {
    router.back();
  }
}

async function addTable() {
  if (!newTableName.value) {
    showToast('请输入桌名');
    return;
  }
  try {
    await tableStore.addTable({
      name: newTableName.value,
      capacity: Number(newTableCapacity.value) || 10,
      location: newTableLocation.value
    });
    showToast('桌台添加成功');
    newTableName.value = '';
    newTableCapacity.value = '10';
    newTableLocation.value = '';
  } catch (err) {
    showToast(err.message || '添加失败');
  }
}

async function editTable() {
  try {
    await tableStore.updateTable(selectedTable.value.id, {
      name: editTableName.value,
      capacity: Number(editTableCapacity.value) || 10,
      location: editTableLocation.value
    });
    await tableStore.fetchList();
    const updated = tableStore.items.find(t => t.id === selectedTable.value.id);
    if (updated) selectedTable.value = { ...updated };
    showToast('桌台已更新');
  } catch (err) {
    showToast(err.message || '更新失败');
  }
}

async function handleDeleteTable() {
  try {
    await showConfirmDialog({
      title: '删除桌台',
      message: `确定删除"${selectedTable.value.name}"吗？宾客将重新变为待排座状态。`,
    });
    await tableStore.deleteTable(selectedTable.value.id);
    await guestStore.fetchList();
    showToast('桌台已删除');
    currentView.value = 'list';
    selectedTable.value = {};
  } catch {}
}

function showAssignDialog(guest) {
  pendingGuest.value = guest;
  const tables = availableTables.value;
  if (tables.length === 0) {
    showToast('没有可用的桌台，请先添加桌台');
    return;
  }
  assignActions.value = tables.map(t => ({
    name: `${t.name}（${guestStore.items.filter(g => g.table_id === t.id).reduce((s, g) => s + (g.attend_count || 1), 0)}/${t.capacity}人）`,
    value: t.id
  }));
  showAssignSheet.value = true;
}

async function onAssignSelect(action) {
  const tableId = action.value;
  try {
    await tableStore.assignGuests(tableId, [pendingGuest.value.id]);
    await guestStore.fetchList();
    showToast(`已分配到 ${action.name.split('（')[0]}`);
  } catch (err) {
    showToast(err.message || '分配失败');
  }
  showAssignSheet.value = false;
}

async function addGuestToTable(guest) {
  if (!selectedTable.value || !selectedTable.value.id) {
    showToast('请先选择一个桌台');
    return;
  }
  if (seatedInTable.value.reduce((s, g) => s + (g.attend_count || 1), 0) + (guest.attend_count || 1) > selectedTable.value.capacity) {
    showToast('超出容量，无法添加');
    return;
  }
  try {
    await tableStore.assignGuests(Number(selectedTable.value.id), [Number(guest.id)]);
    await guestStore.fetchList();
    await tableStore.fetchList();
    showToast(`${guest.name} 已入座`);
  } catch (err) {
    showToast(err.message || '添加失败');
  }
}

async function removeGuestFromTable(guest) {
  try {
    await tableStore.assignGuests(null, [Number(guest.id)]);
    await guestStore.fetchList();
    showToast(`${guest.name} 已移除`);
  } catch (err) {
    showToast(err.message || '移除失败');
  }
}

onMounted(async () => {
  await Promise.all([tableStore.fetchList(), guestStore.fetchList()]);
});
</script>

<style scoped>
.seating-page {
  min-height: 100vh;
  padding-bottom: 70px;
  background: #f7f8fa;
}

.content {
  padding-bottom: 40px;
}

.sticky-top {
  position: sticky;
  top: 0;
  background: #f7f8fa;
  z-index: 10;
}

.stats-bar {
  display: flex;
  justify-content: space-around;
  padding: 12px 16px;
  background: #fff;
  font-size: 13px;
  color: #666;
  border-bottom: 1px solid #f0f0f0;
}

.section-title {
  font-size: 14px;
  font-weight: bold;
  padding: 16px 16px 8px;
  color: #323233;
}

/* 桌台列表项 */
.table-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.table-info {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

.table-count {
  font-size: 14px;
  color: #F26B8A;
  font-weight: 600;
}

.table-count.full {
  color: #999;
}

.cell-arrow {
  color: #c8c9cc;
  margin-left: 4px;
}

/* 添加项 */
.add-icon {
  color: #F26B8A;
  margin-right: 6px;
  vertical-align: middle;
}

.add-text {
  color: #F26B8A;
}

/* 宾客项 */
.guest-name {
  font-size: 15px;
  font-weight: 600;
  color: #333;
}

.guest-info {
  font-size: 12px;
  color: #999;
  margin-top: 2px;
}

/* 空状态 */
.empty-tip {
  color: #999;
  font-size: 14px;
}

/* 桌台详情卡片 */
.table-card {
  margin: 12px 16px;
  background: linear-gradient(135deg, #F26B8A 0%, #D4AF37 25%, #A855F7 50%, #D4AF37 75%, #F26B8A 100%);
  border-radius: 16px;
  padding: 16px 20px;
  color: #fff;
}

.table-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.table-card-name {
  font-size: 20px;
  font-weight: 700;
  color: #fff;
}

.table-card-info {
  font-size: 13px;
  color: rgba(255,255,255,0.8);
  margin-top: 4px;
}

.table-card-count {
  font-size: 18px;
  font-weight: 700;
  color: #fff;
}

.table-card-count.full {
  color: rgba(255,255,255,0.5);
}

.table-card-actions {
  display: flex;
  gap: 10px;
}

/* 已入座宾客 */
.remove-icon {
  color: #ee0a24;
  font-size: 16px;
  padding: 4px;
}

.add-guest-icon {
  color: #F26B8A;
  font-size: 16px;
}

/* 宾客入座行 */
.guest-add-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  cursor: pointer;
  transition: background 0.15s;
}

.guest-add-row:last-child {
  border-bottom: none;
}

.guest-add-row:active {
  background: #fef0f3;
}

.guest-add-info {
  flex: 1;
  min-width: 0;
}

.guest-add-btn {
  flex-shrink: 0;
  margin-left: 12px;
  padding: 5px 14px;
  background: #F26B8A;
  color: #fff;
  border-radius: 20px;
  font-size: 13px;
  font-weight: 600;
}

/* 弹窗 */
.dialog-body {
  padding: 16px;
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
</style>