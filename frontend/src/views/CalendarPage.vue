<template>
  <div class="calendar-page">
    <!-- ===== 顶部导航 ===== -->
    <div class="page-header">
      <div class="header-left" @click="goBack">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#333" stroke-width="2"><path d="M15 18l-6-6 6-6"/></svg>
      </div>
      <div class="header-title">{{ pageTitle }}</div>
      <div class="header-right"></div>
    </div>

    <!-- ===== 纪念日列表 ===== -->
    <div class="anniversary-section">
      <div class="anniversary-header">
        <span class="anniversary-title">纪念日</span>
        <span class="anniversary-add" @click="openAnniversaryForm()">+ 添加</span>
      </div>
      <div class="anniversary-list" v-if="anniversaries.length">
        <div v-for="a in anniversaries" :key="a.id" class="anniversary-item">
          <!-- 里程碑标记 -->
          <div v-if="isMilestone(a.date)" class="milestone-badge">🎉</div>

          <!-- ===== 扁卡（默认显示） ===== -->
          <div
            class="anniversary-card"
            :class="{ 'has-image': a.image, 'card-hidden': squaredIds.has(a.id) }"
            :style="a.image ? { backgroundImage: `url(/anniversary-images/${a.image})` } : {}"
            @click="toggleCard(a.id)"
          >
            <div class="card-overlay" v-if="a.image"></div>
            <div class="anniversary-dot" :style="{ backgroundColor: getAnniversaryTypeColor(a.type) }"></div>
            <div class="anniversary-info">
              <div class="anniversary-name">{{ a.title }}</div>
              <div class="anniversary-meta">
                <span class="anniversary-tag" :style="{ color: getAnniversaryTypeColor(a.type), borderColor: getAnniversaryTypeColor(a.type) }">{{ getAnniversaryTypeLabel(a.type) }}</span>
                <span class="anniversary-date">{{ formatAnniversaryDate(a.date) }}</span>
              </div>
              <div class="anniversary-note" v-if="a.note">{{ a.note }}</div>
            </div>
            <div class="anniversary-countdown">
              <span class="countdown-num">{{ getDaysUntil(a.date) }}</span>
              <span class="countdown-label">天后</span>
            </div>
            <div class="anniversary-actions">
              <span class="anniversary-action-btn" @click.stop="openAnniversaryForm(a)">&#9998;</span>
              <span class="anniversary-action-btn anniversary-del" @click.stop="deleteAnniversary(a.id)">&#10005;</span>
            </div>
          </div>

          <!-- ===== 方卡（点击后切换显示） ===== -->
          <div
            class="square-card"
            :class="{ 'has-image': a.image, 'card-shown': squaredIds.has(a.id) }"
            :style="a.image ? { backgroundImage: `url(/anniversary-images/${a.image})` } : { background: getSquareGradient(a.type, a.id) }"
            @click="toggleCard(a.id)"
          >
            <div class="square-overlay" v-if="a.image"></div>
            <div class="square-content">
              <div class="square-type-tag" :style="{ background: getAnniversaryTypeColor(a.type) }">{{ getAnniversaryTypeLabel(a.type) }}</div>
              <div class="square-name">{{ a.title }}</div>
              <div class="square-date">{{ formatAnniversaryDate(a.date) }}</div>
              <div class="square-meta-row">
                <span class="square-countdown-num">{{ getDaysUntil(a.date) }}</span>
                <span class="square-countdown-label">天后</span>
              </div>
              <div class="square-actions">
                <span class="square-action-btn" @click.stop="openAnniversaryForm(a)">&#9998;</span>
                <span class="square-action-btn square-del" @click.stop="deleteAnniversary(a.id)">&#10005;</span>
              </div>
            </div>
          </div>

          <div class="anniversary-sub">
            <span class="sub-since">❤️ 已经<strong>{{ getDaysSince(a.date) }}</strong> 天</span>
            <span v-if="isMilestone(a.date)" class="sub-milestone">🎊 {{ getMilestoneLabel(a.date) }}</span>
          </div>
        </div>
      </div>
      <div class="anniversary-empty" v-else>
        <div class="anniversary-empty-text">还没有纪念日，点击添加按钮记录你们的第一个纪念日吧</div>
      </div>
    </div>

    <!-- ===== 纪念日弹窗 ===== -->
    <van-dialog
      v-model:show="showAnniversaryForm"
      :title="editingAnniversaryId ? '编辑纪念日' : '添加纪念日'"
      show-cancel-button
      confirm-button-text="保存"
      @confirm="saveAnniversary"
    >
      <div class="anniversary-form">
        <div class="form-row">
          <label>日期类型</label>
          <select v-model="anniversaryForm.calendarType" @change="onCalendarTypeChange" class="form-input">
            <option value="solar">阳历</option>
            <option value="lunar">农历</option>
          </select>
        </div>
        <div class="form-row">
          <label>日期</label>
          <input v-model="anniversaryForm.date" type="date" class="form-input" />
        </div>
        <div class="form-row">
          <label>分类</label>
          <select v-model="anniversaryForm.type" class="form-input" @change="anniversaryForm.customType = ''">
            <option v-for="t in anniversaryTypes" :key="t.value" :value="t.value">{{ t.label }}</option>
          </select>
        </div>
        <div class="form-row" v-if="anniversaryForm.type === 'other'">
          <label>名称</label>
          <input v-model="anniversaryForm.customType" placeholder="自定义分类名称" class="form-input" />
        </div>
        <div class="form-row">
          <label>照片</label>
          <div class="image-upload-row">
            <div v-if="anniversaryForm.imagePreview" class="upload-preview" @click="triggerFileInput">
              <img :src="anniversaryForm.imagePreview" />
              <span class="upload-remove" @click.stop="removeImage()">&#10005;</span>
            </div>
            <div v-else class="upload-placeholder" @click="triggerFileInput">
              <span>+</span>
              <span class="upload-hint">上传照片</span>
            </div>
            <input ref="fileInput" type="file" accept="image/*" style="display:none" @change="onFileChange" />
          </div>
        </div>
        <div class="form-row" style="border-bottom:none">
          <label>备注</label>
          <input v-model="anniversaryForm.note" placeholder="备注信息（可选）" class="form-input" />
        </div>
      </div>
    </van-dialog>

  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';

const router = useRouter();
const goBack = () => router.push('/');

const pageTitle = '我们的纪念日';

// 纪念日
const showAnniversaryForm = ref(false);
const editingAnniversaryId = ref(null);
const anniversaries = ref([]);
const fileInput = ref(null);

const anniversaryForm = ref({
  date: new Date().toISOString().split('T')[0],
  calendarType: 'solar',
  type: 'love',
  customType: '',
  note: '',
  imageBase64: '',
  imagePreview: ''
});

// 卡片切换状态：哪些纪念日显示方卡
const squaredIds = ref(new Set());
function toggleCard(id) {
  const s = new Set(squaredIds.value);
  if (s.has(id)) s.delete(id); else s.add(id);
  squaredIds.value = s;
}

const anniversaryTypes = [
  { value: 'love', label: '恋爱', color: '#F26B8A' },
  { value: 'proposal', label: '求婚', color: '#A855F7' },
  { value: 'engagement', label: '订婚', color: '#FF8C00' },
  { value: 'wedding', label: '婚礼', color: '#D4AF37' },
  { value: 'register', label: '领证', color: '#FF6347' },
  { value: 'honeymoon', label: '蜜月', color: '#00CED1' },
  { value: 'met', label: '相识', color: '#7B68EE' },
  { value: 'confession', label: '告白', color: '#FF69B4' },
  { value: 'birthday', label: '生日', color: '#FFA07A' },
  { value: 'other', label: '其他', color: '#36CFC9' }
];

function onCalendarTypeChange() {
  // 切换日期类型时，重置为今天日期
  anniversaryForm.value.date = new Date().toISOString().split('T')[0];
}

function triggerFileInput() {
  fileInput.value?.click();
}

function onFileChange(e) {
  const file = e.target.files?.[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    anniversaryForm.value.imageBase64 = ev.target.result;
    anniversaryForm.value.imagePreview = ev.target.result;
  };
  reader.readAsDataURL(file);
}

function removeImage() {
  anniversaryForm.value.imageBase64 = '';
  anniversaryForm.value.imagePreview = '';
}

async function fetchAnniversaries() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/anniversaries', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.code === 200) anniversaries.value = data.data;
  } catch (err) {
    console.error('获取纪念日失败:', err);
  }
}

function openAnniversaryForm(item = null) {
  if (item) {
    editingAnniversaryId.value = item.id;
    const isOther = !anniversaryTypes.some(t => t.value === item.type);
    let calType = 'solar';
    let dateVal = item.date || new Date().toISOString().split('T')[0];
    if (dateVal.startsWith('lunar-')) {
      calType = 'lunar';
      dateVal = dateVal.replace('lunar-', '');
    }
    // 编辑时：如果是预设分类且title是纯标签名，恢复为标签名（不加"纪念日"）
    let editType = isOther ? 'other' : (item.type || 'love');
    let editCustomType = isOther ? (item.title || '') : '';
    if (!isOther && item.title) {
      const t = anniversaryTypes.find(t => t.value === item.type);
      if (t && item.title === t.label) {
        // 已有数据是纯标签名，编辑时显示原值
        editCustomType = item.title;
      }
    }
    anniversaryForm.value = {
      date: dateVal,
      calendarType: calType,
      type: editType,
      customType: editCustomType,
      note: item.note || '',
      imageBase64: '',
      imagePreview: item.image ? `/anniversary-images/${item.image}` : ''
    };
  } else {
    editingAnniversaryId.value = null;
    anniversaryForm.value = {
      date: new Date().toISOString().split('T')[0],
      calendarType: 'solar',
      type: 'love',
      customType: '',
      note: '',
      imageBase64: '',
      imagePreview: ''
    };
  }
  showAnniversaryForm.value = true;
}

async function saveAnniversary() {
  try {
    const token = localStorage.getItem('token');
    const form = anniversaryForm.value;
    if (!form.date) {
      showToast('请选择日期');
      return;
    }
    let title = '';
    let type = form.type;
    let dateVal = form.date;
    if (form.calendarType === 'lunar') {
      dateVal = 'lunar-' + form.date;
    }
    if (form.type === 'other') {
      if (!form.customType) {
        showToast('请填写自定义分类名称');
        return;
      }
      title = form.customType;
      type = form.customType;
    } else {
      const t = anniversaryTypes.find(t => t.value === form.type);
      title = t ? t.label + '纪念日' : '纪念日';
    }

    const url = editingAnniversaryId.value ? `/api/anniversaries/${editingAnniversaryId.value}` : '/api/anniversaries';
    const method = editingAnniversaryId.value ? 'PUT' : 'POST';

    const body = { title, type, date: dateVal, note: form.note, calendarType: form.calendarType };
    if (form.imageBase64) body.image = form.imageBase64;
    else if (editingAnniversaryId.value && !form.imagePreview) body.image = null;

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(body)
    });
    const data = await res.json();
    if (data.code === 200 || data.code === 201) {
      showToast(editingAnniversaryId.value ? '已更新' : '已添加');
      showAnniversaryForm.value = false;
      await fetchAnniversaries();
    } else {
      showToast(data.msg || '操作失败');
    }
  } catch (err) {
    showToast('操作失败');
  }
}

async function deleteAnniversary(id) {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch(`/api/anniversaries/${id}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await res.json();
    if (data.code === 200) {
      showToast('已删除');
      await fetchAnniversaries();
    }
  } catch (err) {
    showToast('删除失败');
  }
}

function formatAnniversaryDate(dateStr) {
  if (!dateStr) return '';
  if (dateStr.startsWith('lunar-')) {
    const d = new Date(dateStr.replace('lunar-', ''));
    const m = d.getMonth() + 1;
    const day = d.getDate();
    return '农历' + m + '月' + day + '日';
  }
  const d = new Date(dateStr);
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return m + '月' + day + '日';
}

function getAnniversaryTypeLabel(type) {
  const t = anniversaryTypes.find(t => t.value === type);
  if (t) return t.label;
  return type || '纪念日';
}

function getAnniversaryTypeColor(type) {
  const t = anniversaryTypes.find(t => t.value === type);
  if (t) return t.color;
  const other = anniversaryTypes.find(t => t.value === 'other');
  return other ? other.color : '#999';
}

// 正计时：从纪念日到今天过了多少天
function getDaysSince(dateStr) {
  if (!dateStr) return 0;
  if (dateStr.startsWith('lunar-')) dateStr = dateStr.replace('lunar-', '');
  const start = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now - start) / (1000 * 60 * 60 * 24));
  return Math.max(0, diff);
}

// 倒计时：距离下次纪念日还有多少天
function getDaysUntil(dateStr) {
  if (!dateStr) return 0;
  // 农历日期去掉前缀
  if (dateStr.startsWith('lunar-')) dateStr = dateStr.replace('lunar-', '');
  const target = new Date(dateStr);
  const now = new Date();
  target.setHours(0, 0, 0, 0);
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  target.setFullYear(today.getFullYear());
  if (target.getTime() === today.getTime()) return 0;
  if (target < today) target.setFullYear(today.getFullYear() + 1);
  const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
  return diff >= 0 ? diff : 0;
}

// 方形卡片渐变背景（保持稳定，不做随机）
const squareGradients = [
  'linear-gradient(135deg, #FAD0C4 0%, #FFD1FF 100%)',
  'linear-gradient(135deg, #A18CD1 0%, #FBC2EB 100%)',
  'linear-gradient(135deg, #FFECD2 0%, #FCB69F 100%)',
  'linear-gradient(135deg, #89F7FE 0%, #66A6FF 100%)',
  'linear-gradient(135deg, #F6D365 0%, #FDA085 100%)',
  'linear-gradient(135deg, #96E6A1 0%, #D4FC79 100%)',
  'linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)',
  'linear-gradient(135deg, #D4A5A5 0%, #F7D4B6 100%)'
];
function getSquareGradient(type, id) {
  // 根据分类色彩倾向，id防抖
  const idx = type ? type.charCodeAt(0) : (id || 0);
  return squareGradients[Math.abs(idx) % squareGradients.length];
}

// 里程碑检测
const MILESTONES = [
  { days: 100, label: '100天' },
  { days: 200, label: '200天' },
  { days: 300, label: '300天' },
  { days: 365, label: '一周年' },
  { days: 520, label: '520天' },
  { days: 730, label: '两周年' },
  { days: 999, label: '999天' },
  { days: 1000, label: '1000天' },
  { days: 1314, label: '1314天' },
  { days: 1500, label: '1500天' },
  { days: 2000, label: '2000天' }
];

function isMilestone(dateStr) {
  const days = getDaysSince(dateStr);
  return MILESTONES.some(m => m.days === days);
}

function getMilestoneLabel(dateStr) {
  const days = getDaysSince(dateStr);
  const m = MILESTONES.find(m => m.days === days);
  return m ? m.label : '';
}

onMounted(async () => {
  await fetchAnniversaries();
});
</script>

<style scoped>
.calendar-page {
  min-height: 100vh;
  padding-bottom: 20px;
  background: #f7f8fa;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: #fff;
  border-bottom: 1px solid #f0f0f0;
  position: sticky;
  top: 0;
  z-index: 10;
}

.header-left { display: flex; align-items: center; cursor: pointer; padding: 4px; }
.header-title { font-size: 17px; font-weight: 700; color: #2C2C2C; }
.header-right { width: 28px; }

/* 纪念日 */
.anniversary-section { background: #FFFFFF; margin: 16px; border-radius: 16px; padding: 16px; box-shadow: 0 2px 12px rgba(0,0,0,0.04); }
.anniversary-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; }
.anniversary-title { font-size: 17px; font-weight: 700; color: #2C2C2C; }
.anniversary-add { font-size: 13px; color: #F26B8A; font-weight: 600; cursor: pointer; padding: 6px 12px; background: #FFF0F3; border-radius: 14px; transition: all 0.2s; }
.anniversary-add:hover { background: #FFE4E9; }
.anniversary-add:active { transform: scale(0.95); }
.anniversary-list { display: flex; flex-direction: column; gap: 12px; }

/* 卡片布局 */
.anniversary-item { position: relative; }
.milestone-badge {
  position: absolute;
  top: 8px;
  left: 8px;
  z-index: 10;
  font-size: 20px;
  animation: milestone-bounce 1s ease-in-out infinite;
}
@keyframes milestone-bounce {
  0%, 100% { transform: scale(1) rotate(0deg); }
  25% { transform: scale(1.2) rotate(-5deg); }
  75% { transform: scale(1.2) rotate(5deg); }
}

.anniversary-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px;
  background: #FAFAFA;
  border-radius: 14px;
  cursor: default;
  transition: all 0.2s;
  position: relative;
  overflow: hidden;
  min-height: 72px;
}
.anniversary-card:hover { transform: translateX(2px); }
.anniversary-card.has-image {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.anniversary-card .card-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.3) 100%);
  border-radius: 14px;
}
.anniversary-card.has-image .anniversary-name { color: #fff; text-shadow: 0 1px 4px rgba(0,0,0,0.4); }
.anniversary-card.has-image .anniversary-date { color: rgba(255,255,255,0.7); }
.anniversary-card.has-image .countdown-num { color: #FFD700; }
.anniversary-card.has-image .countdown-label { color: rgba(255,255,255,0.6); }

.anniversary-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; z-index: 1; }
.anniversary-info { flex: 1; min-width: 0; z-index: 1; }
.anniversary-name { font-size: 14px; font-weight: 600; color: #333; }
.anniversary-meta { display: flex; align-items: center; gap: 8px; margin-top: 4px; }
.anniversary-tag { font-size: 10px; padding: 2px 8px; border: 1px solid; border-radius: 10px; font-weight: 500; background: rgba(255,255,255,0.9); }
.anniversary-date { font-size: 11px; color: #BBB; }
.anniversary-note { font-size: 11px; color: #999; margin-top: 2px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.anniversary-countdown { text-align: center; flex-shrink: 0; min-width: 40px; z-index: 1; }
.countdown-num { display: block; font-size: 20px; font-weight: 800; color: #F26B8A; line-height: 1; }
.countdown-label { display: block; font-size: 10px; color: #CCC; margin-top: 2px; }
.anniversary-actions { display: flex; gap: 6px; flex-shrink: 0; z-index: 1; }
.anniversary-action-btn { width: 28px; height: 28px; display: flex; align-items: center; justify-content: center; border-radius: 50%; font-size: 13px; cursor: pointer; color: #999; transition: all 0.2s; background: rgba(255,255,255,0.85); }
.anniversary-action-btn:hover { background: #F0F0F0; color: #333; }
.anniversary-del:hover { background: #FFE8E8; color: #E74C3C; }

/* 扁卡点击切换 */
.anniversary-card { cursor: pointer; }
.anniversary-card.card-hidden { display: none; }

/* 正计时副文本 */
.anniversary-sub {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 14px 0 14px;
  font-size: 12px;
  color: #999;
}
.sub-since strong { color: #F26B8A; font-weight: 700; }
.sub-milestone { color: #D4AF37; font-weight: 600; }

/* 方形卡片 */
.square-card {
  display: none;
  margin: 0 14px 0 14px;
  aspect-ratio: 1 / 1;
  width: calc(100% - 28px);
  border-radius: 16px;
  overflow: hidden;
  position: relative;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transition: transform 0.25s ease, box-shadow 0.25s ease;
  cursor: pointer;
}
.square-card.card-shown {
  display: flex;
}
.square-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 24px rgba(0,0,0,0.12);
}
.square-card.has-image {
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
}
.square-card .square-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(135deg, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0.2) 100%);
  border-radius: 16px;
}
.square-content {
  position: relative;
  z-index: 1;
  text-align: center;
  padding: 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}
.square-type-tag {
  font-size: 12px;
  color: #fff;
  padding: 4px 14px;
  border-radius: 20px;
  font-weight: 500;
}
.square-name {
  font-size: 22px;
  font-weight: 800;
  color: #333;
  letter-spacing: 1px;
}
.square-card.has-image .square-name { color: #fff; text-shadow: 0 2px 8px rgba(0,0,0,0.5); }
.square-card.has-image .square-type-tag { box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
.square-date {
  font-size: 13px;
  color: #999;
  font-weight: 400;
}
.square-card.has-image .square-date { color: rgba(255,255,255,0.7); text-shadow: 0 1px 4px rgba(0,0,0,0.3); }
.square-meta-row {
  display: flex;
  align-items: baseline;
  gap: 3px;
  margin-top: 4px;
}
.square-countdown-num {
  font-size: 38px;
  font-weight: 800;
  color: #F26B8A;
  line-height: 1;
  letter-spacing: -1px;
}
.square-card.has-image .square-countdown-num { color: #FFD700; }
.square-countdown-label {
  font-size: 16px;
  color: #BBB;
  font-weight: 500;
}
.square-card.has-image .square-countdown-label { color: rgba(255,255,255,0.6); }
.square-actions {
  display: flex;
  gap: 12px;
  margin-top: 6px;
}
.square-action-btn {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  font-size: 14px;
  cursor: pointer;
  color: #999;
  transition: all 0.2s;
  background: rgba(255,255,255,0.85);
}
.square-action-btn:hover { background: #F0F0F0; color: #333; }
.square-del:hover { background: #FFE8E8; color: #E74C3C; }

.anniversary-empty { text-align: center; padding: 24px 0; }
.anniversary-empty-text { font-size: 13px; color: #999; }

/* 纪念日弹窗 */
.anniversary-form { padding: 0 16px 16px; }
.form-row { display: flex; align-items: center; padding: 12px 0; border-bottom: 1px solid #F5F5F5; }
.form-row:last-child { border-bottom: none; }
.form-row label { font-size: 14px; color: #666; width: 56px; flex-shrink: 0; }
.form-input { flex: 1; border: none; outline: none; font-size: 14px; color: #333; padding: 4px 0; background: transparent; }
select.form-input { -webkit-appearance: none; appearance: none; background: transparent; }

/* 图片上传 */
.image-upload-row { flex: 1; display: flex; align-items: center; }
.upload-placeholder {
  width: 64px; height: 64px;
  border: 2px dashed #DDD;
  border-radius: 10px;
  display: flex; flex-direction: column;
  align-items: center; justify-content: center;
  cursor: pointer;
  color: #CCC;
  font-size: 20px;
  transition: all 0.2s;
}
.upload-placeholder:hover { border-color: #F26B8A; color: #F26B8A; }
.upload-hint { font-size: 10px; margin-top: 2px; }
.upload-preview {
  position: relative;
  width: 64px; height: 64px;
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
}
.upload-preview img { width: 100%; height: 100%; object-fit: cover; }
.upload-remove {
  position: absolute;
  top: -4px; right: -4px;
  width: 20px; height: 20px;
  background: rgba(0,0,0,0.5);
  color: #fff;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  cursor: pointer;
}
</style>