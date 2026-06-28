<template>
  <div class="gallery-page">
    <!-- ===== 顶部 ===== -->
    <div class="page-sticky-head">
      <van-nav-bar title="📸 时光画廊" left-arrow @click-left="goBack">
        <template #right>
          <div class="nav-actions">
            <van-icon name="replay" size="20" class="nav-icon sync-icon" @click="syncPhotos" />
            <van-icon
              :name="viewMode === 'flow' ? 'grid' : 'bars'"
              size="20"
              class="nav-icon"
              @click="toggleViewMode"
            />
            <van-icon name="plus" size="20" class="nav-icon" @click="showUpload" />
          </div>
        </template>
      </van-nav-bar>
    </div>

    <div class="gallery-header">
      <div class="header-subtitle">记录我们相爱的第 <strong>{{ loveDays }}</strong> 天</div>
      <div class="header-count">共 {{ photos.length }} 张照片</div>
    </div>

    <!-- ===== 瀑布流模式 ===== -->
    <div v-show="viewMode === 'flow'" class="photo-flow" ref="flowRef">
      <div
        v-for="(photo, idx) in photos"
        :key="photo.id || idx"
                class="photo-card"
                :class="{ 'photo-active': activeIndex === idx, 'photo-visible': visibleIndices.has(idx) }"
        @click="openPreview(idx)"
      >
        <div class="photo-img-wrap">
          <img :src="photo.url" :alt="'photo-' + idx" loading="lazy" />
          <div class="img-overlay">
            <span class="overlay-heart" @click.stop="toggleLove(photo)">❤️</span>
            <span v-if="photo.id > 0" class="overlay-delete" @click.stop="deletePhoto(photo, idx)">🗑️</span>
          </div>
        </div>
        <div class="photo-footer">
          <span class="photo-date">{{ photo.date || '未记录日期' }}</span>
          <span class="photo-heart" @click.stop="toggleLove(photo)">
            <span :class="{ 'love-active': photo.loved }">❤️</span>
            {{ photo.likes || 0 }}
          </span>
        </div>
      </div>
    </div>

    <!-- ===== 网格模式 ===== -->
    <div v-show="viewMode === 'grid'" class="photo-grid" ref="gridRef">
      <div
        v-for="(photo, idx) in photos"
        :key="photo.id || idx"
        class="grid-card"
        :style="{ animationDelay: (idx * 0.05) + 's' }"
        @click="openPreview(idx)"
      >
        <div class="grid-img-wrap">
          <img :src="photo.url" :alt="'photo-' + idx" loading="lazy" />
          <div class="grid-delete" v-if="photo.id > 0" @click.stop="deletePhoto(photo, idx)" />
        </div>
        <div class="grid-info">
          <span class="grid-heart" @click.stop="toggleLove(photo)">
            <span :class="{ 'love-active': photo.loved }">❤️</span>
            {{ photo.likes || 0 }}
          </span>
        </div>
      </div>
    </div>

    <!-- ===== 全屏预览 ===== -->
    <van-image-preview
      v-model:show="previewShow"
      :images="previewImages"
      :startPosition="previewIndex"
      :closeable="true"
      :max-zoom="3"
      :min-zoom="0.5"
      @change="onPreviewChange"
    >
      <template v-if="photos[previewIndex]" #index>
        {{ previewIndex + 1 }} / {{ photos.length }}
      </template>
    </van-image-preview>

    <!-- ===== 添加上传 ===== -->
    <van-dialog
      v-model:show="uploadShow"
      title="添加上传照片"
      show-cancel-button
      :before-close="handleUpload"
    >
      <div class="upload-body">
        <div class="upload-area" @click="triggerFilePicker" v-if="selectedFiles.length === 0">
          <van-icon name="plus" size="32" color="#F26B8A" />
          <span>点击选择照片（可多选）</span>
        </div>
        <div class="preview-grid" v-else>
          <div v-for="(file, idx) in selectedFiles" :key="idx" class="preview-item">
            <img :src="file.previewUrl" class="preview-thumb" />
            <div class="preview-remove" @click="removeFile(idx)">✕</div>
          </div>
          <div class="preview-add" @click="triggerFilePicker">
            <van-icon name="plus" size="28" color="#F26B8A" />
          </div>
        </div>
        <van-field v-model="uploadCaption" label="说明" placeholder="给这些照片写句话...（可选）" maxlength="50" />
        <van-field v-model="uploadDate" label="日期" type="date" />
      </div>
      <input ref="fileInput" type="file" accept="image/*" multiple style="display:none" @change="onFileSelected" />
    </van-dialog>

    <!-- ===== 添加按钮（悬浮） ===== -->
    <div class="fab-upload" @click="showUpload">
      <van-icon name="photograph" size="20" />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { showToast, showLoadingToast, closeToast, showDialog } from 'vant';
import * as galleryApi from '@/api/gallery';

const router = useRouter();
const goBack = () => router.push('/album');

// ===== 倒计时天数 =====
const WEDDING_DATE = import.meta.env.VITE_WEDDING_DATE || 'YYYY-MM-DD';
const loveDays = computed(() => {
  const now = new Date();
  const target = new Date(WEDDING_DATE);
  const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
  return diff > 0 ? diff : 0;
});

// ===== 视图模式 =====
const viewMode = ref('flow');
function toggleViewMode() {
  viewMode.value = viewMode.value === 'flow' ? 'grid' : 'flow';
  if (viewMode.value === 'flow') {
    nextTick(() => checkVisibility());
  }
}

// ===== 照片数据 =====
const photos = ref([]);

async function fetchPhotos() {
  try {
    const data = await galleryApi.getList();
    photos.value = (data || []).map(p => ({
      id: p.id,
      url: `/gallery-images/${p.image_filename}`,
      date: p.photo_date || p.created_at?.substring(0, 10) || '',
      caption: p.caption || '',
      likes: 0,
      loved: false,
    }));
  } catch (err) {
    console.error('获取画廊照片失败:', err);
    photos.value = [];
  }
}

// ===== 同步文件 =====
const isSyncing = ref(false);
async function syncPhotos() {
  if (isSyncing.value) return;
  isSyncing.value = true;
  showLoadingToast({ message: '正在扫描图片...', forbidClick: true });
  try {
    const result = await galleryApi.sync();
    closeToast();
    showToast(`同步完成，新增 ${result.imported} 张`);
    await fetchPhotos();
  } catch {
    closeToast();
    showToast('同步失败');
  } finally {
    isSyncing.value = false;
  }
}

// ===== 删除照片 =====
async function deletePhoto(photo, idx) {
  try {
    await showDialog({
      title: '删除照片',
      message: '确定要删除这张照片吗？',
      showCancelButton: true,
      confirmButtonText: '删除',
      confirmButtonColor: '#ee0a24',
    });
    showLoadingToast({ message: '删除中...', forbidClick: true });
    await galleryApi.remove(photo.id);
    closeToast();
    showToast('已删除');
    photos.value.splice(idx, 1);
  } catch {
    closeToast();
    // 用户取消删除，不报错
  }
}

// ===== 点赞 =====
function toggleLove(photo) {
  photo.loved = !photo.loved;
  photo.likes = photo.loved ? (photo.likes || 0) + 1 : Math.max(0, (photo.likes || 0) - 1);
}

// ===== 全屏预览 =====
const previewShow = ref(false);
const previewImages = computed(() => photos.value.map(p => p.url));
const previewIndex = ref(0);

function openPreview(idx) {
  previewIndex.value = idx;
  previewShow.value = true;
}

function onPreviewChange(idx) {
  previewIndex.value = idx;
}

// ===== 上传 =====
const uploadShow = ref(false);
const fileInput = ref(null);
const uploadCaption = ref('');
const uploadDate = ref('');
const selectedFiles = ref([]); // [{ file, previewUrl }]

function showUpload() {
  uploadCaption.value = '';
  uploadDate.value = new Date().toISOString().substring(0, 10);
  selectedFiles.value = [];
  if (fileInput.value) fileInput.value.value = '';
  uploadShow.value = true;
}

function triggerFilePicker() { fileInput.value?.click(); }

function onFileSelected(e) {
  const files = Array.from(e.target.files || []);
  files.forEach(file => {
    const reader = new FileReader();
    reader.onload = (ev) => {
      selectedFiles.value.push({
        file,
        previewUrl: ev.target.result,
      });
    };
    reader.readAsDataURL(file);
  });
  // 清空 input 值，允许重复选择同一批文件
  if (fileInput.value) fileInput.value.value = '';
}

function removeFile(idx) {
  selectedFiles.value.splice(idx, 1);
}

async function handleUpload(action) {
  if (action === 'cancel') return true;
  if (selectedFiles.value.length === 0) { showToast('请选择照片'); return false; }
  showLoadingToast({ message: '上传中...', forbidClick: true });
  try {
    for (const { file } of selectedFiles.value) {
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = e => resolve(e.target.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      await galleryApi.upload({ image: base64, caption: uploadCaption.value, date: uploadDate.value });
    }
    closeToast();
    showToast(`上传成功，共 ${selectedFiles.value.length} 张`);
    selectedFiles.value = [];
    await fetchPhotos();
    return true;
  } catch (err) {
    closeToast();
    showToast('上传失败');
    return false;
  }
}

// ===== 滚动停止后判断可视区域（仅瀑布流） =====
const flowRef = ref(null);
const activeIndex = ref(-1);
const visibleIndices = ref(new Set());
let scrollTimer = null;

function checkVisibility() {
  if (viewMode.value !== 'flow') return;
  const cards = flowRef.value?.querySelectorAll('.photo-card');
  if (!cards || cards.length === 0) return;
  
  const viewCenter = window.innerHeight / 2;
  let bestIdx = -1;
  let bestDist = Infinity;
  const visible = new Set();
  
  cards.forEach((card, idx) => {
    const rect = card.getBoundingClientRect();
    const elCenter = rect.top + rect.height / 2;
    const dist = Math.abs(elCenter - viewCenter);
    const inViewport = rect.bottom > 0 && rect.top < window.innerHeight;
    if (inViewport) {
      visible.add(idx);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    }
  });
  
  visibleIndices.value = visible;
  activeIndex.value = bestIdx;
}

function onScroll() {
  if (scrollTimer) clearTimeout(scrollTimer);
  scrollTimer = setTimeout(checkVisibility, 150);
}

onMounted(async () => {
  await fetchPhotos();
  await nextTick();
  checkVisibility();
  window.addEventListener('scroll', onScroll, { passive: true });
});

onBeforeUnmount(() => {
  if (scrollTimer) clearTimeout(scrollTimer);
  window.removeEventListener('scroll', onScroll);
});
</script>

<style scoped>
.gallery-page {
  min-height: 100vh;
  background: linear-gradient(180deg, #FDF0F5 0%, #FCE4EC 100%);
  padding-bottom: 80px;
}

.page-sticky-head {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(255, 255, 255, 0.85);
  backdrop-filter: blur(12px);
}

.nav-actions { display: flex; gap: 8px; }
.nav-icon { color: #F26B8A; padding: 4px; }
.sync-icon { font-size: 18px; }

.gallery-header {
  text-align: center;
  padding: 20px 16px 8px;
}

.header-subtitle {
  font-size: 14px;
  color: #666;
  letter-spacing: 1px;
}

.header-subtitle strong { color: #F26B8A; font-size: 16px; }

.header-count {
  font-size: 12px;
  color: #999;
  margin-top: 4px;
}

/* =====================================================
   瀑布流模式
   ===================================================== */
.photo-flow {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  padding: 12px 16px;
}

.photo-card {
  width: 100%;
  max-width: 360px;
  background: rgba(255, 255, 255, 0.4);
  border: 1px solid rgba(255, 255, 255, 0.6);
  border-radius: 24px;
  padding: 12px;
  box-shadow: 0 8px 30px rgba(242, 107, 138, 0.15);
  transition: transform 0.45s cubic-bezier(0.34, 1.56, 0.64, 1),
              opacity 0.45s cubic-bezier(0.34, 1.56, 0.64, 1);
  transform: scale(0.85);
  opacity: 0;
  visibility: hidden;
  cursor: pointer;
  contain: layout paint;
  will-change: transform, opacity;
}

.photo-card.photo-visible {
  opacity: 0.5;
  visibility: visible;
}

.photo-card.photo-active {
  transform: scale(1);
  opacity: 1;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  box-shadow: 0 8px 40px rgba(242, 107, 138, 0.35),
              0 0 0 3px rgba(242, 107, 138, 0.08);
}

.photo-img-wrap {
  position: relative;
  border-radius: 16px;
  overflow: hidden;
  background: #f0f0f0;
}

.photo-img-wrap img {
  display: block;
  width: 100%;
  height: auto;
  transition: transform 0.3s ease;
}

.photo-card.photo-active .photo-img-wrap img { transform: scale(1.02); }

/* 操作区 OVERLAY — 常驻可见 */
.img-overlay {
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  background: linear-gradient(transparent 60%, rgba(0,0,0,0.2));
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 10px;
  pointer-events: none;
}

.overlay-heart, .overlay-delete {
  font-size: 16px;
  pointer-events: auto;
  text-shadow: 0 1px 4px rgba(0,0,0,0.3);
}

.overlay-delete {
  font-size: 15px;
  cursor: pointer;
}

.photo-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 4px 2px;
}

.photo-date, .photo-heart { font-size: 12px; color: #999; cursor: default; }
.photo-heart { cursor: pointer; }
.love-active { color: #F26B8A; }

/* =====================================================
   网格模式
   ===================================================== */
.photo-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 10px;
  padding: 12px 16px;
}

.grid-card {
  position: relative;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(242, 107, 138, 0.12);
  cursor: pointer;
  animation: gridIn 0.35s ease both;
  transition: transform 0.2s;
}

.grid-card:active { transform: scale(0.95); }

@keyframes gridIn {
  from { opacity: 0; transform: translateY(16px) scale(0.9); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}

.grid-img-wrap {
  position: relative;
  aspect-ratio: 1;
  overflow: hidden;
  background: #f0f0f0;
}

.grid-img-wrap img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s;
}

.grid-card:active .grid-img-wrap img { transform: scale(1.08); }

.grid-delete {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 28px;
  height: 28px;
  background: rgba(0,0,0,0.45);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2;
  pointer-events: auto;
}

.grid-delete::after {
  content: '🗑️';
  font-size: 13px;
}

.grid-info {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  padding: 8px 10px;
}

.grid-heart { font-size: 11px; color: #999; cursor: pointer; }
.grid-heart .love-active { color: #F26B8A; }

/* ===== 上传弹窗 ===== */
.upload-body { padding: 16px; }

.upload-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  height: 140px;
  border: 2px dashed #F26B8A;
  border-radius: 16px;
  background: rgba(242, 107, 138, 0.04);
  color: #999;
  font-size: 13px;
  cursor: pointer;
  margin-bottom: 12px;
}

/* 多图预览网格 */
.preview-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
  margin-bottom: 12px;
}

.preview-item {
  position: relative;
  aspect-ratio: 1;
  border-radius: 12px;
  overflow: hidden;
  background: #f0f0f0;
}

.preview-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-remove {
  position: absolute;
  top: 2px;
  right: 2px;
  width: 22px;
  height: 22px;
  border-radius: 50%;
  background: rgba(0,0,0,0.55);
  color: #fff;
  font-size: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.preview-add {
  display: flex;
  align-items: center;
  justify-content: center;
  aspect-ratio: 1;
  border: 2px dashed rgba(242, 107, 138, 0.3);
  border-radius: 12px;
  cursor: pointer;
  transition: background 0.2s;
}

.preview-add:active { background: rgba(242, 107, 138, 0.08); }

/* ===== 悬浮上传按钮 ===== */
.fab-upload {
  position: fixed;
  bottom: 32px;
  right: 24px;
  width: 50px;
  height: 50px;
  border-radius: 50%;
  background: linear-gradient(135deg, #F26B8A, #D4AF37);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 16px rgba(242, 107, 138, 0.4);
  cursor: pointer;
  z-index: 9;
  transition: transform 0.2s;
}

.fab-upload:active { transform: scale(0.9); }
</style>
