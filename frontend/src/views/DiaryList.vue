<template>
  <div class="diary-page">
    <div class="moments-feed">
      <div v-for="entry in items" :key="entry.id" class="moment-card">
        <div class="mc-header">
          <div class="mc-avatar">
            <span class="avatar-item">{{ entry.author === groomName ? '🤵' : '👰' }}</span>
            <span class="avatar-heart">❤</span>
            <span class="avatar-item">{{ entry.author === groomName ? '👰' : '🤵' }}</span>
          </div>
          <div class="mc-info">
            <span class="mc-name">{{ entry.author }}</span>
            <div class="mc-meta">
              <span v-if="entry.mood" class="mc-mood-emoji">{{ moodEmoji(entry.mood) }}</span>
              <span v-if="entry.mood">{{ entry.mood }}</span>
              <span>{{ entry.date }}</span>
            </div>
          </div>
          <van-icon name="edit" size="16" color="#c4b6b8" class="mc-delete" style="margin-right: 8px" @click="handleEdit(entry)" />
          <van-icon name="delete-o" size="16" color="#c4b6b8" class="mc-delete" @click="handleDelete(entry)" />
        </div>
        <div class="mc-text" v-if="entry.content">{{ entry.content }}</div>
        <div v-if="entry.has_images" :class="['mc-images', 'img-count-' + (entry.image_filenames?.length || 0)]">
          <div v-for="(img, idx) in entry.image_filenames || []" :key="idx" class="mc-img-item" @click="loadImages(entry.id)">
            <img :src="'/diary-images/' + img" alt="diary image" />
          </div>
        </div>
        <div class="mc-footer">
          <span class="mc-time">{{ formatTime(entry.created_at) }}</span>
        </div>
      </div>
      <div v-if="items.length === 0" class="mc-img-placeholder">
        <span>还没有日记，点击右下角按钮记录第一笔吧</span>
      </div>
    </div>

    <van-image-preview v-model:show="showPreview" :images="previewImages" :start-position="previewIndex" />

    <van-dialog v-model:show="showAddDialog" :title="editingId ? '编辑日记' : '记录时光'" show-cancel-button :before-close="handleSave" :confirm-button-text="editingId ? '保存' : '发布'" class="diary-dialog">
      <div class="dialog-form">
        <div class="upload-section">
          <div class="upload-label">作者</div>
          <div class="author-selector">
            <span v-for="a in authorOptions" :key="a.value" :class="['author-item', { active: diaryForm.author === a.value }]" @click="diaryForm.author = a.value">
              <span class="author-emoji">{{ a.emoji }}</span>
              <span class="author-text">{{ a.label }}</span>
            </span>
          </div>
        </div>
        <div class="upload-section">
          <div class="upload-label">心情</div>
          <div class="mood-selector">
            <span v-for="m in moodOptions" :key="m.value" :class="['mood-item', { active: diaryForm.mood === m.value }]" @click="diaryForm.mood = m.value">
              <span class="mood-emoji">{{ m.emoji }}</span>
              <span class="mood-text">{{ m.label }}</span>
            </span>
          </div>
        </div>
        <van-field v-model="diaryForm.content" label="正文" type="textarea" rows="3" autosize placeholder="今天发生了什么..." />
        <div class="upload-section">
          <van-uploader v-model="imageFiles" :max-count="9" :preview-full-image="false" accept="image/*" />
        </div>
      </div>
    </van-dialog>

    <div class="bottom-nav">
      <div :class="['nav-item', { 'nav-active': isHome }]" @click="$router.push('/')">
        <div class="nav-indicator"></div>
        <van-icon name="home-o" size="22" class="nav-icon" />
        <span class="nav-label">首页</span>
      </div>
      <div :class="['nav-item', { 'nav-active': isTasks }]" @click="$router.push('/tasks')">
        <div class="nav-indicator"></div>
        <van-icon name="todo-list-o" size="22" class="nav-icon" />
        <span class="nav-label">清单</span>
      </div>
      <div :class="['nav-item', { 'nav-active': isBudgets }]" @click="$router.push('/budgets')">
        <div class="nav-indicator"></div>
        <van-icon name="balance-list-o" size="22" class="nav-icon" />
        <span class="nav-label">预算</span>
      </div>
      <div :class="['nav-item', { 'nav-active': isGuests }]" @click="$router.push('/guests')">
        <div class="nav-indicator"></div>
        <van-icon name="friends-o" size="22" class="nav-icon" />
        <span class="nav-label">宾客</span>
      </div>
    </div>
    <div class="add-diary-btn" @click="showAddDialog = true">
      <van-icon name="plus" size="24" color="#FFFFFF" />
    </div>
  </div>
</template>
<script setup>
import { ref, computed, reactive, onMounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { showToast, showConfirmDialog } from 'vant';
import { useDiaryStore } from '@/stores/diary';

const groomName = import.meta.env.VITE_GROOM_NAME || '新郎';
const brideName = import.meta.env.VITE_BRIDE_NAME || '新娘';

const diaryStore = useDiaryStore();
const showAddDialog = ref(false);
const editingId = ref(null);
const editingDate = ref('');
const showPreview = ref(false);
const previewImages = ref([]);
const previewIndex = ref(0);

const today = new Date().toISOString().split('T')[0];
const diaryForm = reactive({
  author: groomName, mood: '', content: ''
});
const imageFiles = ref([]);

const route = useRoute();
const isHome = computed(() => route.path === '/');
const isTasks = computed(() => route.path.startsWith('/task'));
const isBudgets = computed(() => route.path.startsWith('/budget'));
const isGuests = computed(() => route.path.startsWith('/guest'));

function compressImage(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const MAX_W = 1200;
      let w = img.width, h = img.height;
      if (w > MAX_W) { h = h * MAX_W / w; w = MAX_W; }
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.5));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

const moodOptions = [
  { emoji: '😊', label: '开心', value: '开心' },
  { emoji: '🥱', label: '疲惫', value: '疲惫' },
  { emoji: '😰', label: '紧张', value: '紧张' },
  { emoji: '🥰', label: '期待', value: '期待' },
  { emoji: '😭', label: '感动', value: '感动' },
  { emoji: '😣', label: '焦虑', value: '焦虑' },
  { emoji: '😡', label: '烦躁', value: '烦躁' },
  { emoji: '😌', label: '释然', value: '释然' }
];

const authorOptions = [
  { emoji: '🤵', label: groomName, value: groomName },
  { emoji: '👰', label: brideName, value: brideName }
];

const moodEmoji = (val) => {
  const found = moodOptions.find(m => m.value === val);
  return found ? found.emoji : '';
};

const items = computed(() => {
  return diaryStore.items;
});

const imagesCache = {};

async function loadImages(diaryId) {
  if (imagesCache[diaryId]) {
    previewImages.value = imagesCache[diaryId];
    previewIndex.value = 0;
    showPreview.value = true;
    return;
  }
  try {
    const { getDiaryImages } = await import('@/api/diaries');
    const imgs = await getDiaryImages(diaryId);
    imagesCache[diaryId] = imgs;
    previewImages.value = imgs;
    previewIndex.value = 0;
    showPreview.value = true;
  } catch (err) {
    showToast('图片加载失败');
    console.error('[Diary] 图片加载失败:', err);
  }
}

function formatTime(t) {
  if (!t) return '';
  const d = new Date(t.replace(' ', 'T'));
  const y = d.getFullYear();
  const M = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const m = String(d.getMinutes()).padStart(2, '0');
  const s = String(d.getSeconds()).padStart(2, '0');
  return y + '-' + M + '-' + day + ' ' + h + ':' + m + ':' + s;
}

async function handleSave(action) {
  if (action !== 'confirm') return true;
  let images = [];
  for (const file of imageFiles.value) {
    if (file.content) {
      const compressed = await compressImage(file.content);
      images.push(compressed);
    } else if (file.url) {
      try {
        const resp = await fetch(file.url);
        const blob = await resp.blob();
        const b64 = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
        const compressed = await compressImage(b64);
        images.push(compressed);
      } catch {
        console.warn('[Diary] 无法读取图片:', file.url);
      }
    }
  }
  try {
    for (const b64 of images) {
      const sizeKB = (b64.length * 3) / 4 / 1024;
      if (sizeKB > 500) {
        showToast('图片过大，请换一张或降低分辨率');
        return false;
      }
    }
    if (editingId.value) {
      await diaryStore.updateDiary(editingId.value, {
        author: diaryForm.author,
        mood: diaryForm.mood || '',
        content: diaryForm.content || '',
        date: editingDate.value,
        images: images.length > 0 ? images : []
      });
      showToast('已保存');
    } else {
      const nowDate = new Date().toISOString().split('T')[0];
      await diaryStore.addDiary({
        author: diaryForm.author,
        mood: diaryForm.mood || '',
        content: diaryForm.content || '',
        date: nowDate,
        images: images.length > 0 ? images : []
      });
      showToast('已发布');
    }
    resetForm();
    await diaryStore.fetchAll();
    return true;
  } catch (err) {
    const msg = err.message || err || '未知错误';
    console.error('[Diary] 发布失败:', err);
    showToast('发布失败: ' + msg);
    return false;
  }
}

function resetForm() {
  diaryForm.author = groomName;
  diaryForm.mood = '';
  diaryForm.content = '';
  imageFiles.value = [];
  editingId.value = null;
  editingDate.value = '';
}

async function handleEdit(entry) {
  editingId.value = entry.id;
  editingDate.value = entry.date || today;
  diaryForm.author = entry.author || groomName;
  diaryForm.mood = entry.mood || '';
  diaryForm.content = entry.content || '';
  imageFiles.value = [];
  showAddDialog.value = true;
}

async function handleDelete(entry) {
  try {
    await showConfirmDialog({ title: '删除', message: '确定删除这条记录吗？' });
    await diaryStore.deleteDiary(entry.id);
    showToast('已删除');
  } catch {}
}

onMounted(() => {
  diaryStore.fetchAll();
  nextTick(() => window.scrollTo(0, 0));
});
</script>

<style scoped>
.diary-page { min-height: 100vh; background: var(--bg-page); }

.moments-feed { padding-bottom: 80px; }

.moment-card {
  background: #fff;
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
  box-shadow: var(--shadow-sm);
  border: 1px solid var(--border-light);
}

.mc-header {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10px;
}

.mc-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--primary-gradient);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  font-weight: 600;
  flex-shrink: 0;
  margin-right: 10px;
}

.mc-avatar .avatar-item {
  font-size: 12px;
  line-height: 1;
}

.mc-avatar .avatar-heart {
  font-size: 8px;
  color: #E53935;
  margin: 0 1px;
  opacity: 1;
}

.mc-info { flex: 1; min-width: 0; }

.mc-name {
  display: block;
  font-size: 15px;
  font-weight: 600;
  color: var(--text-primary);
  margin-bottom: 2px;
}

.mc-meta {
  display: flex;
  gap: 6px;
  font-size: 11px;
  color: var(--text-tertiary);
}

.mc-delete {
  flex-shrink: 0;
  padding: 4px;
}

.mc-text {
  font-size: 14px;
  color: var(--text-primary);
  line-height: 1.6;
  margin-bottom: 10px;
  white-space: pre-wrap;
  word-break: break-word;
}

.mc-images {
  display: grid;
  gap: 4px;
  margin-bottom: 10px;
}

.img-count-1 { grid-template-columns: 1fr; }
.img-count-2 { grid-template-columns: 1fr 1fr; }
.img-count-3 { grid-template-columns: 1fr 1fr 1fr; }
.img-count-4 { grid-template-columns: 1fr 1fr; }
.img-count-5 { grid-template-columns: 1fr 1fr 1fr; }
.img-count-6 { grid-template-columns: 1fr 1fr 1fr; }
.img-count-7 { grid-template-columns: 1fr 1fr 1fr 1fr; }
.img-count-8 { grid-template-columns: 1fr 1fr 1fr 1fr; }
.img-count-9 { grid-template-columns: 1fr 1fr 1fr; }

.mc-img-item {
  border-radius: 6px;
  overflow: hidden;
  cursor: pointer;
  aspect-ratio: 1;
  background: var(--border);
}

.mc-img-item img,
.mc-img-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.img-count-1 .mc-img-item {
  aspect-ratio: 16/9;
  max-height: 240px;
}

.mc-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 10px;
  border-top: 1px solid var(--border);
}

.mc-time {
  font-size: 11px;
  color: var(--text-tertiary);
}

.dialog-form { padding: 8px 16px; }
.dialog-form :deep(.van-cell) { padding-left: 0; padding-right: 0; }

.upload-section {
  padding: 10px 16px;
}

.upload-label {
  font-size: 12px;
  color: var(--text-secondary);
  margin-bottom: 8px;
}

/* 作者选择器 */
.author-selector {
  display: flex;
  gap: 12px;
}

.author-item {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border-radius: 16px;
  border: 1.5px solid #e8e0e3;
  background: #faf5f7;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 14px;
}

.author-item.active {
  border-color: #f091a0;
  background: #fef0f3;
  color: #f091a0;
  font-weight: 500;
}

.author-emoji {
  font-size: 18px;
}

.author-text {
  color: inherit;
}

/* 心情选择器 */
.mood-selector {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.mood-item {
  display: flex;
  align-items: center;
  gap: 3px;
  padding: 4px 10px;
  border-radius: 16px;
  border: 1.5px solid #e8e0e3;
  background: #faf5f7;
  cursor: pointer;
  transition: all 0.2s;
  font-size: 13px;
}

.mood-item.active {
  border-color: #f091a0;
  background: #fef0f3;
  color: #f091a0;
  font-weight: 500;
}

.mood-emoji {
  font-size: 16px;
}

.mood-text {
  color: inherit;
}

.mc-mood-emoji {
  font-size: 14px;
  margin-right: 2px;
}

.mc-img-placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 120px;
  background: #faf5f7;
  border: 1.5px dashed #e8e0e3;
  border-radius: 8px;
  color: #c4b6b8;
  font-size: 12px;
  cursor: pointer;
}

.mc-img-placeholder:active {
  background: #f5eef2;
}

.add-diary-btn {
  position: fixed;
  bottom: 90px;
  right: 20px;
  width: 52px;
  height: 52px;
  border-radius: 50%;
  background: #F26B8A;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(242, 107, 138, 0.4);
  cursor: pointer;
  z-index: 100;
  transition: transform 0.2s;
}

.add-diary-btn:active {
  transform: scale(0.95);
}

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
