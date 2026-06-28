<template>
  <div class="task-page">
    <div class="page-sticky-head">
      <van-nav-bar title="备婚清单">
        <template #right>
          <van-icon name="plus" size="20" @click="showAddDialog = true" style="cursor:pointer;padding:4px 4px;color:#F26B8A" />
        </template>
      </van-nav-bar>
    </div>

    <div class="page-content">
      <!-- ===== 顶部统计卡片 ===== -->
      <div class="stats-card">
        <div class="stats-row">
          <div class="stat-item">
            <span class="stat-num">{{ totalCount }}</span>
            <span class="stat-label">总任务</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num doing">{{ doingCount }}</span>
            <span class="stat-label">进行中</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num pending">{{ pendingCount }}</span>
            <span class="stat-label">待定</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num done">{{ doneCount }}</span>
            <span class="stat-label">已完成</span>
          </div>
          <div class="stat-divider"></div>
          <div class="stat-item">
            <span class="stat-num pct">{{ taskPercent }}%</span>
            <span class="stat-label">完成度</span>
          </div>
        </div>
        <div class="stats-track">
          <div class="stats-fill" :style="{ width: taskPercent + '%' }"></div>
        </div>
      </div>

      <!-- ===== 视图切换 ===== -->
      <div class="view-toggle">
        <div class="toggle-btn" :class="{ active: viewMode === 'list' }" @click="viewMode = 'list'">
          <van-icon name="bars" /> 清单
        </div>
        <div class="toggle-btn" :class="{ active: viewMode === 'timeline' }" @click="viewMode = 'timeline'">
          <van-icon name="clock-o" /> 时间线
        </div>
      </div>

      <!-- ===== 清单视图 ===== -->
      <div v-if="viewMode === 'list'" class="list-view">
        <!-- 全部任务卡片 -->
        <div class="task-card">
          <div class="tc-header">
            <span class="tc-title">📋 全部任务</span>
            <span class="tc-count">{{ doneCount }}/{{ totalCount }} 已完成</span>
          </div>
          <div class="tc-track">
            <div class="tc-fill" :style="{ width: taskPercent + '%' }"></div>
          </div>
          <div class="tc-body">
            <div v-for="task in sortedTasks" :key="task.id" class="task-row"
              :class="{ 'is-done': task.status === 'done' }"
              @click.stop="openEditDialog(task)">
              <div class="tr-check" @click.stop="toggleTask(task)">
                <div class="check-circle" :class="{ checked: task.status === 'done' }">
                  <van-icon v-if="task.status === 'done'" name="success" size="10" color="#fff" />
                </div>
              </div>
              <div class="tr-body" @click.stop="openEditDialog(task)">
                <div class="tr-title-line">
                  <span class="tr-title">{{ task.title }}</span>
                  <span v-if="task.is_recurring" class="tr-badge recycle">🔄 周期性</span>
                  <span v-if="task.due_date" class="tr-badge deadline">📅 {{ formatDate(task.due_date) }}</span>
                  <span v-else class="tr-badge deadline pending">📅 待定</span>
                </div>
                <div class="tr-meta" v-if="task.notes">
                  <span class="tr-notes">📝 {{ task.notes }}</span>
                </div>
                <div class="tr-footer">
                  <span class="tr-tag" :class="assigneeClass(task.assignee)">{{ assigneeLabel(task.assignee) }}</span>
                  <div class="tr-right-actions">
                    <span v-if="task.status === 'done'" class="tr-badge complete">🎉 圆满完成</span>
                    <van-icon name="delete-o" size="14" color="#c4b6b8" @click.stop="handleDelete(task)" />
                  </div>
                </div>
              </div>
            </div>
            <div v-if="tasks.length === 0" class="empty-state">
              <van-empty description="✨ 还没有任务，点下方按钮添加" />
            </div>
          </div>
          <!-- 添加代办按钮 -->
          <div class="tc-action" @click="showAddDialog = true">
            <van-icon name="plus" /> 添加待办
          </div>
        </div>
      </div>

      <!-- ===== 时间线视图 ===== -->
      <div v-if="viewMode === 'timeline'" class="timeline-view">
        <div v-if="timelineGroups.length === 0" class="empty-state">
          <van-empty description="还没有任务" />
        </div>
        <div v-for="group in timelineGroups" :key="group.month" class="tl-group">
          <div class="tl-month">{{ group.month }}</div>
          <div class="tl-items">
            <div
              v-for="task in group.tasks"
              :key="task.id"
              class="tl-item"
              :class="{ 'is-done': task.status === 'done' }"
              @click="toggleTask(task)"
            >
              <div class="tl-dot" :class="{ done: task.status === 'done' }"></div>
              <div class="tl-line"></div>
              <div class="tl-body">
                <div class="tl-title">{{ task.title }}</div>
                <div class="tl-meta">
                  <span v-if="task.due_date" class="tl-date">📅 {{ task.due_date }}</span>
                  <span v-else class="tl-date pending">📅 待定</span>
                  <span class="tl-status" :class="task.status">
                    {{ task.status === 'done' ? '✅ 已完成' : '⏳ 未完成' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>

    <!-- ===== 添加任务弹窗 ===== -->
    <van-dialog v-model:show="showAddDialog" title="添加待办" show-cancel-button
      :before-close="handleAddTask" confirm-button-text="添加">
      <div class="dialog-form">
        <van-field v-model="addForm.title" label="任务" placeholder="做什么？" :rules="[{required:true}]" />
        <van-field v-model="addForm.notes" label="备注" placeholder="选填" />
        <div class="van-cell van-field deadline-field">
          <div class="van-cell__title van-field__label">截止日期</div>
          <div class="van-cell__value van-field__value">
            <label class="deadline-input-wrap">
              <input type="date" v-model="addForm.dueDate" class="deadline-native-input" />
              <span class="deadline-label" :class="{ 'pending': !addForm.dueDate }">{{ addForm.dueDate || '待定' }}</span>
            </label>
            <van-icon v-if="addForm.dueDate" name="clear" class="deadline-clear" @click.stop="clearAddDate" />
          </div>
        </div>
        <van-cell center title="周期性任务">
          <template #right-icon>
            <van-switch v-model="addForm.isRecurring" size="20" />
          </template>
        </van-cell>
        <van-field v-model="addForm.assignee" label="负责人" is-link readonly placeholder="选择"
          @click="showAssignee = true" />
      </div>
    </van-dialog>
    <van-action-sheet v-model:show="showAssignee" :actions="assigneeOptions"
      @select="v => { addForm.assignee = v.value; showAssignee = false; }" />

    <!-- ===== 编辑任务弹窗 ===== -->
    <van-dialog v-model:show="showEditDialog" title="编辑任务" show-cancel-button
      :before-close="handleEditTask" confirm-button-text="保存">
      <div class="dialog-form">
        <van-field v-model="editForm.title" label="任务" placeholder="做什么？" :rules="[{required:true}]" />
        <van-field v-model="editForm.notes" label="备注" placeholder="选填" />
        <div class="van-cell van-field deadline-field">
          <div class="van-cell__title van-field__label">截止日期</div>
          <div class="van-cell__value van-field__value">
            <label class="deadline-input-wrap">
              <input type="date" v-model="editForm.dueDate" class="deadline-native-input" />
              <span class="deadline-label" :class="{ 'pending': !editForm.dueDate }">{{ editForm.dueDate || '待定' }}</span>
            </label>
            <van-icon v-if="editForm.dueDate" name="clear" class="deadline-clear" @click.stop="clearEditDate" />
          </div>
        </div>
        <van-cell center title="周期性任务">
          <template #right-icon>
            <van-switch v-model="editForm.isRecurring" size="20" />
          </template>
        </van-cell>
        <van-field v-model="editForm.assignee" label="负责人" is-link readonly placeholder="选择"
          @click="showEditAssignee = true" />
        <van-field v-model="editForm.status" label="状态" is-link readonly placeholder="选择"
          @click="showEditStatus = true" />
      </div>
    </van-dialog>
    <van-action-sheet v-model:show="showEditAssignee" :actions="assigneeOptions"
      @select="v => { editForm.assignee = v.value; showEditAssignee = false; }" />
    <van-action-sheet v-model:show="showEditStatus" :actions="statusOptions"
      @select="v => { editForm.status = v.value; showEditStatus = false; }" />

    <!-- ===== 底部导航 ===== -->
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
import { ref, computed, onMounted, reactive } from 'vue';
import { useRoute } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import { useTaskStore } from '@/stores/task';

const taskStore = useTaskStore();
const activeTab = ref('tasks');
const viewMode = ref('list');
const showAddDialog = ref(false);
const showAssignee = ref(false);
const showEditDialog = ref(false);
const showEditAssignee = ref(false);
const showEditStatus = ref(false);

const editingTaskId = ref(null);

const route = useRoute();
const isHome = computed(() => route.path === '/');
const isTasks = computed(() => route.path.startsWith('/task'));
const isBudgets = computed(() => route.path.startsWith('/budget'));
const isGuests = computed(() => route.path.startsWith('/guest'));

const addForm = reactive({
  title: '', notes: '', dueDate: '', isRecurring: false, assignee: ''
});

const editForm = reactive({
  title: '', notes: '', dueDate: '', isRecurring: false, assignee: '', status: ''
});
const assigneeOptions = [
  { name: '男方负责', value: 'groom' },
  { name: '女方负责', value: 'bride' },
  { name: '共同完成', value: 'both' }
];

const tasks = computed(() => taskStore.items);

const totalCount = computed(() => tasks.value.length);
const doingCount = computed(() => tasks.value.filter(t => t.status !== 'done' && t.due_date).length);
const pendingCount = computed(() => tasks.value.filter(t => t.status !== 'done' && !t.due_date).length);
const doneCount = computed(() => tasks.value.filter(t => t.status === 'done').length);
const taskPercent = computed(() => totalCount.value > 0 ? Math.round(doneCount.value / totalCount.value * 100) : 0);

const sortedTasks = computed(() => {
  return [...tasks.value].sort((a, b) => {
    // 未完成在前，已完成在后
    if (a.status === 'done' && b.status !== 'done') return 1;
    if (a.status !== 'done' && b.status === 'done') return -1;
    // 待定（无日期）排在最前面
    if (!a.due_date && !b.due_date) return 0;
    if (!a.due_date) return -1;
    if (!b.due_date) return 1;
    // 按日期排序
    return a.due_date.localeCompare(b.due_date);
  });
});

/** 按月份分组（时间线） */
const timelineGroups = computed(() => {
  const sorted = [...tasks.value].sort((a, b) => {
    const da = a.due_date || '9999-99-99';
    const db = b.due_date || '9999-99-99';
    if (da === '9999-99-99' && db === '9999-99-99') return 0;
    if (da === '9999-99-99') return 1;
    if (db === '9999-99-99') return -1;
    return da.localeCompare(db);
  });
  const groups = [];
  let current = null;
  for (const t of sorted) {
    const month = t.due_date ? t.due_date.substring(0, 7) : '未安排';
    if (!current || current.month !== month) {
      current = { month, tasks: [] };
      groups.push(current);
    }
    current.tasks.push(t);
  }
  return groups;
});

async function toggleTask(task) {
  await taskStore.toggleTask(task.id);
}
async function handleDelete(task) {
  try {
    await showConfirmDialog({ title: '删除任务', message: `确定删除「${task.title}」吗？` });
    await taskStore.deleteTask(task.id);
    showToast('🗑️ 已删除');
  } catch {}
}

function clearAddDate() {
  addForm.dueDate = '';
}

function clearEditDate() {
  editForm.dueDate = '';
}

async function handleAddTask(action) {
  if (action !== 'confirm') return true;
  if (!addForm.title) { showToast('请输入任务名称'); return false; }
  await taskStore.addTask({
    title: addForm.title,
    notes: addForm.notes || '',
    dueDate: addForm.dueDate || '',
    isRecurring: addForm.isRecurring ? 1 : 0,
    assignee: addForm.assignee || 'both',
    stage: addForm.dueDate ? getStageFromDate(addForm.dueDate) : '6-months',
    priority: 1
  });
  showToast('✅ 已添加');
  addForm.title = ''; addForm.notes = ''; addForm.dueDate = ''; addForm.isRecurring = false; addForm.assignee = '';
  return true;
}

function getStageFromDate(dateStr) {
  if (!dateStr) return '6-months';
  const d = new Date(dateStr);
  const wedding = new Date(import.meta.env.VITE_WEDDING_DATE || 'YYYY-MM-DD');
  const diff = (wedding - d) / (1000 * 60 * 60 * 24);
  if (diff > 365) return '12-months';
  if (diff > 270) return '9-months';
  if (diff > 180) return '6-months';
  if (diff > 90) return '3-months';
  if (diff > 30) return '1-month';
  if (diff > 7) return 'wedding-week';
  return 'wedding-week';
}

const statusOptions = [

  { name: '未开始', value: 'todo' },
  { name: '进行中', value: 'doing' },
  { name: '已完成', value: 'done' }
];

function openEditDialog(task) {
  editingTaskId.value = task.id;
  editForm.title = task.title || '';
  editForm.notes = task.notes || '';
  editForm.dueDate = task.due_date || '';
  editForm.isRecurring = Boolean(task.is_recurring);
  editForm.assignee = task.assignee || '';
  editForm.status = task.status || 'todo';
  showEditDialog.value = true;
}

async function handleEditTask(action) {
  if (action !== 'confirm') return true;
  if (!editForm.title) { showToast('请输入任务名称'); return false; }
  try {
    await taskStore.updateTask(editingTaskId.value, {
      title: editForm.title,
      notes: editForm.notes,
      dueDate: editForm.dueDate,
      isRecurring: editForm.isRecurring ? 1 : 0,
      assignee: editForm.assignee,
      status: editForm.status
    });
    showToast('✅ 已保存');
  } catch (err) {
    showToast(err.message || '保存失败');
    return false;
  }
  return true;
}


function formatDate(d) { return d || ''; }
function assigneeLabel(a) {
  const map = { groom: '男方', bride: '女方', both: '共同' };
  return map[a] || a;
}
function assigneeClass(a) {
  const map = { groom: 'info', bride: 'primary', both: 'gold' };
  return map[a] || '';
}

onMounted(() => taskStore.fetchList());
</script>

<style scoped>
.task-page {
  min-height: 100vh;
  background: var(--bg-page);
}

/* ===== 统计卡片 ===== */
.stats-card {
  background: #fff;
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 16px;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-light);
}

.stats-row {
  display: flex;
  align-items: center;
}

.stat-item { flex: 1; text-align: center; }
.stat-divider { width: 1px; height: 28px; background: var(--border); }

.stat-num { display: block; font-size: 22px; font-weight: 700; color: var(--text-primary); }
.stat-num.doing { color: var(--info); }
.stat-num.pending { color: var(--warning); }
.stat-num.done { color: var(--success); }
.stat-num.pct { color: var(--primary); }

.stat-label { display: block; font-size: 11px; color: var(--text-tertiary); margin-top: 2px; }

.stats-track {
  margin-top: 12px;
  height: 6px;
  background: var(--border);
  border-radius: 3px;
  overflow: hidden;
}

.stats-fill {
  height: 100%;
  background: var(--primary-gradient);
  border-radius: 3px;
  transition: width 0.6s;
}

/* ===== 视图切换 ===== */
.view-toggle {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.toggle-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px;
  border-radius: var(--radius);
  background: #fff;
  font-size: 13px;
  color: var(--text-secondary);
  cursor: pointer;
  border: 1px solid var(--border-light);
  transition: all 0.2s;
}

.toggle-btn.active {
  background: var(--primary-light);
  color: var(--primary-dark);
  border-color: var(--primary);
}

/* ===== 任务卡片 ===== */
.task-card {
  background: #fff;
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-card);
  border: 1px solid var(--border-light);
  margin-bottom: 12px;
}

.tc-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px 8px;
}

.tc-title { font-size: 15px; font-weight: 600; color: var(--text-primary); }
.tc-count { font-size: 12px; color: var(--text-tertiary); }

.tc-track {
  margin: 0 16px 8px;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  overflow: hidden;
}

.tc-fill {
  height: 100%;
  background: var(--success);
  border-radius: 2px;
  transition: width 0.4s;
}

.tc-body { padding: 0; }

.tc-action {
  padding: 12px 16px;
  text-align: center;
  font-size: 14px;
  color: var(--primary);
  font-weight: 500;
  cursor: pointer;
  border-top: 1px solid var(--border);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.tc-action:active { background: var(--primary-light); }

/* ===== 任务行 ===== */
.task-row {
  display: flex;
  align-items: flex-start;
  padding: 10px 16px;
  gap: 10px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  transition: background 0.1s;
}
.task-row:last-child { border-bottom: none; }
.task-row:hover { background: #fefafb; }
.task-row.is-done { opacity: 0.6; }

.tr-check { padding-top: 2px; flex-shrink: 0; }

.check-circle {
  width: 20px; height: 20px;
  border-radius: 50%;
  border: 2px solid var(--border);
  display: flex; align-items: center; justify-content: center;
  transition: all 0.2s;
}
.check-circle.checked { background: var(--success); border-color: var(--success); }

.tr-body { flex: 1; min-width: 0; }

.tr-title-line {
  display: flex; align-items: center; gap: 6px;
  margin-bottom: 3px;
}

.tr-title { font-size: 14px; font-weight: 500; color: var(--text-primary); }

.tr-badge {
  font-size: 10px; padding: 1px 6px; border-radius: 10px; font-weight: 500;
  white-space: nowrap;
}
.tr-badge.recycle { background: var(--info-bg); color: var(--info); }
.tr-badge.deadline { background: var(--primary-light); color: var(--primary-dark); }
.tr-badge.deadline.pending { background: #FFF3E0; color: #E65100; }

.tr-meta { margin-bottom: 4px; }
.tr-notes { font-size: 11px; color: var(--text-tertiary); }

.tr-footer {
  display: flex; justify-content: space-between; align-items: center;
}

.tr-right-actions {
  display: flex; align-items: center; gap: 8px;
}

.tr-tag {
  font-size: 10px; padding: 1px 8px; border-radius: 10px;
  background: var(--bg-tag); color: var(--text-secondary);
}
.tr-tag.info { background: var(--info-bg); color: var(--info); }
.tr-tag.primary { background: var(--primary-light); color: var(--primary-dark); }
.tr-tag.gold { background: var(--gold-light); color: var(--gold); }

.tr-badge.complete {
  font-size: 10px; padding: 2px 8px; border-radius: 10px;
  background: linear-gradient(135deg, #FFD700, #FFA500);
  color: #3D2B1F;
  font-weight: 600;
  white-space: nowrap;
}

/* ===== 时间线 ===== */
.timeline-view { margin-bottom: 12px; }

.tl-group { margin-bottom: 16px; }

.tl-month {
  font-size: 14px; font-weight: 600; color: var(--primary-dark);
  margin-bottom: 10px; padding-left: 8px;
}

.tl-items { padding-left: 12px; }

.tl-item {
  display: flex; align-items: flex-start;
  padding-bottom: 16px; position: relative;
  cursor: pointer;
}
.tl-item:last-child { padding-bottom: 0; }
.tl-item.is-done { opacity: 0.6; }

.tl-dot {
  width: 12px; height: 12px;
  border-radius: 50%;
  background: var(--border);
  border: 2px solid var(--text-tertiary);
  flex-shrink: 0;
  margin-top: 4px;
  position: relative;
  z-index: 1;
}
.tl-dot.done { background: var(--success); border-color: var(--success); }
.tl-line {
  position: absolute;
  left: 5px;
  top: 18px;
  bottom: 0;
  width: 2px;
  background: var(--border);
}

.tl-body { margin-left: 12px; flex: 1; }
.tl-title { font-size: 14px; font-weight: 500; color: var(--text-primary); margin-bottom: 2px; }
.tl-meta { display: flex; gap: 8px; font-size: 11px; color: var(--text-tertiary); }
.tl-status.done { color: var(--success); }
.tl-date.pending { color: #E65100; font-weight: 600; }


.empty-state :deep(.van-empty__description) { color: var(--text-tertiary); }

/* Dialog */
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

/* 可见的原生日期选择器 */
.deadline-field {
  cursor: pointer;
}
.deadline-input-wrap {
  display: flex;
  align-items: center;
  width: 100%;
  min-height: 24px;
  position: relative;
  cursor: pointer;
}
.deadline-native-input {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  opacity: 0;
  cursor: pointer;
}
.deadline-label {
  font-size: 14px;
  color: var(--text-primary);
  pointer-events: none;
}
.deadline-label.pending {
  color: var(--primary);
  font-weight: 600;
}
.deadline-clear {
  color: #c8c9cc;
  font-size: 16px;
  padding: 0 0 0 8px;
}

.page-sticky-head {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
}
</style>
