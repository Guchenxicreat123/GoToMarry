<template>
  <div class="album-page">
    <!-- ===== 顶部导航 ===== -->
    <div class="page-sticky-head">
      <van-nav-bar title="📷 相册" left-arrow @click-left="goBack" />
    </div>

    <!-- ===== 相册总览 ===== -->
    <div class="album-overview">
      <div class="overview-title">
        <div class="overview-icon">📚</div>
        <div class="overview-text">
          <div class="overview-main">相册</div>
          <div class="overview-sub">记录我们相爱的每一个瞬间</div>
        </div>
      </div>
      <div class="overview-stats">
        <div class="stat-item">
          <div class="stat-num">{{ galleryPhotoCount }}</div>
          <div class="stat-label">全部照片</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ galleryPhotoCount }}</div>
          <div class="stat-label">画廊照片</div>
        </div>
        <div class="stat-item">
          <div class="stat-num">{{ totalPhotos }}</div>
          <div class="stat-label">总照片数</div>
        </div>
      </div>
    </div>

    <!-- ===== 相册分类入口 ===== -->
    <div class="album-collections">
      <!-- 时光画廊 -->
      <div class="collection-card collection-gateway" @click="$router.push('/gallery')">
        <div class="collection-cover">
          <div class="cover-waterfall">
            <div class="mini-card mini-1"></div>
            <div class="mini-card mini-2"></div>
            <div class="mini-card mini-3"></div>
          </div>
        </div>
        <div class="collection-info">
          <div class="collection-title">
            <span class="collection-icon">📸</span>
            <span>时光画廊</span>
          </div>
          <div class="collection-desc">瀑布流展示，点赞收藏，上传新照片</div>
          <div class="collection-badge">{{ galleryPhotoCount }}</div>
        </div>
      </div>

      <!-- 星空宇宙 -->
      <div class="collection-card collection-space" @click="$router.push('/space')">
        <div class="collection-cover">
          <div class="cover-stars">
            <div class="star star-1"></div>
            <div class="star star-2"></div>
            <div class="star star-3"></div>
            <div class="star star-4"></div>
            <div class="star star-5"></div>
            <div class="star star-6"></div>
            <div class="star star-7"></div>
            <div class="star star-8"></div>
          </div>
          <div class="cover-constellation"></div>
        </div>
        <div class="collection-info">
          <div class="collection-title">
            <span class="collection-icon">🌌</span>
            <span>星空宇宙</span>
          </div>
          <div class="collection-desc">Canvas 交互式相册，星座连线/行星轨道/深空视差</div>
          <div class="collection-badge">{{ galleryPhotoCount }}</div>
        </div>
      </div>

      <!-- 照片墙 -->
      <div class="collection-card collection-wall" @click="showAllPhotos">
        <div class="collection-cover">
          <div class="cover-wall">
            <div class="wall-grid">
              <div class="wall-cell"></div>
              <div class="wall-cell"></div>
              <div class="wall-cell"></div>
              <div class="wall-cell"></div>
            </div>
          </div>
        </div>
        <div class="collection-info">
          <div class="collection-title">
            <span class="collection-icon">🖼️</span>
            <span>照片墙</span>
          </div>
          <div class="collection-desc">按年份排列，一览所有照片</div>
          <div class="collection-badge">{{ galleryPhotoCount }}</div>
        </div>
      </div>
    </div>

    <!-- ===== 照片墙预览弹窗 ===== -->
    <van-dialog
      v-model:show="wallPreviewShow"
      title="照片墙"
      show-cancel-button
      :before-close="() => { wallPreviewShow = false; return false; }"
    >
      <div class="wall-preview-content" v-if="photos.length">
        <div class="wall-year" v-for="(group, year) in groupedPhotos" :key="year">
          <div class="year-label">{{ year }}</div>
          <div class="wall-photo-grid">
            <div
              v-for="(item, idx) in group"
              :key="item.id + '-' + idx"
              class="wall-photo-item"
              @click="previewPhoto(item, idx)"
            >
              <img :src="item.url" :alt="item.caption" loading="lazy" />
            </div>
          </div>
        </div>
      </div>
      <van-empty v-else description="还没有照片哦" />
    </van-dialog>

    <!-- 图片预览 -->
    <van-image-preview
      v-model:show="previewShow"
      :images="previewImages"
      :startPosition="previewIndex"
      :closeable="true"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const goBack = () => router.push('/');

const photos = ref([]);
const galleryPhotoCount = ref(0);

// 照片墙
const wallPreviewShow = ref(false);
const previewShow = ref(false);
const previewImages = ref([]);
const previewIndex = ref(0);

const totalPhotos = computed(() => galleryPhotoCount.value);

const groupedPhotos = computed(() => {
  const groups = {};
  photos.value.forEach(item => {
    const year = item.date ? item.date.substring(0, 4) : '未归档';
    if (!groups[year]) groups[year] = [];
    groups[year].push(item);
  });
  const sorted = {};
  Object.keys(groups).sort((a, b) => {
    if (a === '未归档') return 1;
    if (b === '未归档') return -1;
    return b - a;
  }).forEach(key => { sorted[key] = groups[key]; });
  return sorted;
});

async function fetchGalleryPhotos() {
  try {
    const token = localStorage.getItem('token');
    const res = await fetch('/api/gallery', {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const json = await res.json();
    if (json.code !== 200) return;
    const data = json.data || [];
    photos.value = data.map(p => ({
      id: p.id,
      url: `/gallery-images/${p.image_filename}`,
      caption: p.caption || '',
      date: p.photo_date || p.created_at?.substring(0, 10) || '',
    }));
    galleryPhotoCount.value = data.length;
  } catch (err) {
    console.error('获取画廊照片失败:', err);
  }
}

function showAllPhotos() {
  wallPreviewShow.value = true;
}

function previewPhoto(item, idx) {
  previewImages.value = photos.value.map(i => i.url);
  previewIndex.value = photos.value.indexOf(item);
  previewShow.value = true;
}

onMounted(async () => {
  await fetchGalleryPhotos();
});
</script>

<style scoped>
.album-page {
  min-height: 100vh;
  background: #f7f8fa;
}

.page-sticky-head {
  position: sticky;
  top: 0;
  z-index: 10;
  background: #fff;
}

/* ===== 相册总览 ===== */
.album-overview {
  background: linear-gradient(135deg, #F26B8A 0%, #E8A0C5 50%, #C0A0E0 100%);
  padding: 24px 16px 20px;
  color: #fff;
}

.overview-title {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.overview-icon {
  font-size: 36px;
}

.overview-main {
  font-size: 20px;
  font-weight: 700;
}

.overview-sub {
  font-size: 13px;
  opacity: 0.85;
  margin-top: 2px;
}

.overview-stats {
  display: flex;
  gap: 16px;
}

.stat-item {
  flex: 1;
  background: rgba(255, 255, 255, 0.15);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 12px;
  padding: 12px;
  text-align: center;
}

.stat-num {
  font-size: 28px;
  font-weight: 700;
}

.stat-label {
  font-size: 12px;
  opacity: 0.8;
  margin-top: 4px;
}

/* ===== 相册分类入口 ===== */
.album-collections {
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.collection-card {
  display: flex;
  align-items: stretch;
  background: #fff;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
  cursor: pointer;
  transition: transform 0.15s, box-shadow 0.15s;
}

.collection-card:active {
  transform: scale(0.98);
}

.collection-cover {
  width: 100px;
  flex-shrink: 0;
  position: relative;
  overflow: hidden;
}

.collection-info {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.collection-title {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 6px;
}

.collection-icon {
  font-size: 20px;
}

.collection-title span:last-child {
  font-size: 16px;
  font-weight: 700;
  color: #1A1A1A;
}

.collection-desc {
  font-size: 12px;
  color: #666;
  margin-bottom: 8px;
}

.collection-badge {
  align-self: flex-start;
  background: #F26B8A;
  color: #fff;
  font-size: 11px;
  padding: 2px 10px;
  border-radius: 12px;
  font-weight: 600;
}

/* ===== 时光画廊卡片 ===== */
.collection-gateway .collection-cover {
  background: linear-gradient(180deg, #FDF0F5 0%, #FCE4EC 100%);
}

.cover-waterfall {
  position: absolute;
  inset: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  align-items: center;
}

.mini-card {
  background: #fff;
  border-radius: 4px;
  box-shadow: 0 2px 4px rgba(0,0,0,0.1);
}

.mini-1 { width: 24px; height: 36px; }
.mini-2 { width: 24px; height: 28px; }
.mini-3 { width: 24px; height: 32px; }

/* ===== 星空宇宙卡片 ===== */
.collection-space .collection-cover {
  background: linear-gradient(180deg, #1a0a2e 0%, #0d0221 100%);
}

.cover-stars {
  position: absolute;
  inset: 0;
}

.star {
  position: absolute;
  width: 3px;
  height: 3px;
  background: #fff;
  border-radius: 50%;
  animation: twinkle 2s ease-in-out infinite;
}

.star-1 { top: 20%; left: 20%; animation-delay: 0s; }
.star-2 { top: 30%; left: 60%; animation-delay: 0.5s; }
.star-3 { top: 50%; left: 30%; animation-delay: 1s; }
.star-4 { top: 60%; left: 70%; animation-delay: 1.5s; }
.star-5 { top: 70%; left: 50%; animation-delay: 0.3s; }
.star-6 { top: 40%; left: 80%; animation-delay: 0.8s; }
.star-7 { top: 80%; left: 25%; animation-delay: 1.2s; }
.star-8 { top: 15%; left: 75%; animation-delay: 0.6s; }

@keyframes twinkle {
  0%, 100% { opacity: 0.3; }
  50% { opacity: 1; }
}

.cover-constellation {
  position: absolute;
  inset: 0;
  border: 1px solid rgba(242, 107, 138, 0.3);
  border-radius: 0;
}

/* ===== 照片墙卡片 ===== */
.collection-wall .collection-cover {
  background: linear-gradient(180deg, #FFE0B2 0%, #FFCC80 100%);
}

.cover-wall {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}

.wall-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
  padding: 10px;
}

.wall-cell {
  width: 20px;
  height: 20px;
  background: #fff;
  border-radius: 3px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.12);
}

/* ===== 照片墙预览 ===== */
.wall-preview-content {
  max-height: 60vh;
  overflow: auto;
  padding: 8px;
}

.wall-year {
  margin-bottom: 16px;
}

.year-label {
  font-size: 14px;
  font-weight: 700;
  color: #2C2C2C;
  padding: 4px 0;
}

.wall-photo-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 4px;
}

.wall-photo-item {
  aspect-ratio: 1;
  overflow: hidden;
  border-radius: 4px;
  cursor: pointer;
  background: #eee;
}

.wall-photo-item img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.wall-photo-item:active img {
  transform: scale(1.05);
}
</style>
