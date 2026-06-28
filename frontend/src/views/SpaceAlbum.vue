<template>
  <div class="space-album">
    <!-- ===== Canvas 主画布 ===== -->
    <canvas ref="canvasRef" class="space-canvas"></canvas>

    <!-- ===== 顶部导航 ===== -->
    <div class="space-nav">
      <van-nav-bar title="🌌 星空宇宙" left-arrow @click-left="goBack" />
    </div>

    <!-- ===== 模式切换按钮（浮在 Canvas 上方） ===== -->
    <div class="mode-switcher">
      <div
        v-for="m in modes"
        :key="m.id"
        class="mode-btn"
        :class="{ 'mode-active': currentMode === m.id }"
        @click="switchMode(m.id)"
      >
        <span class="mode-icon">{{ m.icon }}</span>
        <span class="mode-label">{{ m.label }}</span>
      </div>
    </div>

    <!-- ===== 底部操作区 ===== -->
    <div class="space-footer">
      <span class="footer-info">共 {{ photoCount }} 张照片</span>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import request from '@/api/request';

const router = useRouter();
function goBack() { router.push('/album'); }

const canvasRef = ref(null);
let ctx = null;
let W = 0, H = 0;
let images = [];
let allLoadedImages = [];
let nodes = [];
let activeParallaxNodes = [];
let parallaxQueue = [];
let animId = null;
let renderTimestamp = 0;
let lastRenderTime = 0;

// 星空背景
const starField = [];
function initStars() {
  for (let i = 0; i < 100; i++) {
    starField.push({
      x: Math.random(), y: Math.random(),
      r: 0.3 + Math.random() * 1.2,
      a: 0.3 + Math.random() * 0.7,
      speed: 0.3 + Math.random() * 0.7,
    });
  }
}
initStars();

function drawStars() {
  starField.forEach((s) => {
    s.a = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(renderTimestamp * 0.001 * s.speed));
    ctx.beginPath();
    ctx.arc(s.x * W, s.y * H, s.r, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(255, 255, 255, ${s.a})`;
    ctx.fill();
  });
}

// 模式定义
const MODES = { CONSTELLATION: 0, ORBIT: 1, PARALLAX: 2 };
const currentMode = ref(MODES.CONSTELLATION);
const modes = [
  { id: MODES.CONSTELLATION, icon: '✦', label: '照片墙' },
  { id: MODES.ORBIT, icon: '🪐', label: '行星轨道' },
  { id: MODES.PARALLAX, icon: '🌠', label: '深空视差' },
];

// 相机/鼠标跟踪
let mouseX = 0, mouseY = 0, mouseInside = false;

// 3D 球形照片墙状态
let sphereRadius = 0;
let sphereDist = 0;
let sphereTheta = 0;
let spherePhi = Math.PI * 0.1;
let sphereTouchStartTheta = 0;
let sphereTouchStartPhi = 0;
let sphereScale = 1;
let sphereMinScale = 0.3;
let sphereMaxScale = 3;
// 触摸跟踪
let touchStartX = 0, touchStartY = 0;
let touchStartDist = 0;
let touchStartScale = 1;
let isPinching = false;
// 已选中的大图预览
let selectedNodeIndex = -1;
// 点击检测
let tapStartX = 0, tapStartY = 0;
let hasMovedWhileDragging = false;
let wasTouchDrag = false;

const photoCount = ref(0);
const photoList = ref([]);

// 占位图片
const PLACEHOLDER = [];
for (let i = 1; i <= 9; i++) {
  PLACEHOLDER.push({
    id: i,
    image_url: [
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAtElEQVR4nO3QUQkAIBTAQMO+/hW0gj8yhIMFGLf2jC5b+cFHwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBggUrDxYsWHmwYMHKgwULVh4sWLDyYMGClQcLFqw8WLBg5cGCBSsPFixYebBgwcqDBQtWHixYsPJgwYKVBwsWrDxYsGDlwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBgvWmAO+pcXwS2+umAAAAAElFTkSuQmCC',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAtElEQVR4nO3QUQkAIBTAQMO+/hW0gj8yhIMFGLdmjy5b+cFHwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBggUrDxYsWHmwYMHKgwULVh4sWLDyYMGClQcLFqw8WLBg5cGCBSsPFixYebBgwcqDBQtWHixYsPJgwYKVBwsWrDxYsGDlwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBgvWmA6GhcXyQMOEEAAAAAElFTkSuQmCC',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAtElEQVR4nO3QUQkAIBTAQMO+/hW0gj8yhIMFGLdmti5b+cFHwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBggUrDxYsWHmwYMHKgwULVh4sWLDyYMGClQcLFqw8WLBg5cGCBSsPFixYebBgwcqDBQtWHixYsPJgwYKVBwsWrDxYsGDlwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBgvWmA72JcXwO2wumAAAAAElFTkSuQmCC',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAtElEQVR4nO3QUQkAIBTAQMPav8Kzgj8yhIMFGLdmti5b+cFHwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBggUrDxYsWHmwYMHKgwULVh4sWLDyYMGClQcLFqw8WLBg5cGCBSsPFixYebBgwcqDBQtWHixYsPJgwYKVBwsWrDxYsGDlwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBgvWmA/G7GZTGdDFwAAAAAElFTkSuQmCC',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAtElEQVR4nO3QUQkAIBTAQMPav8Kzgj8yhIMFGLdmjy5b+cFHwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBggUrDxYsWHmwYMHKgwULVh4sWLDyYMGClQcLFqw8WLBg5cGCBSsPFixYebBgwcqDBQtWHixYsPJgwYKVBwsWrDxYsGDlwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBgvWmA0myGZRaNgAGAAAAAElFTkSuQmCC',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAtElEQVR4nO3QUQkAIBTAQMPav8Kzgj8yhIMFGLf2jC5b+cFHwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBggUrDxYsWHmwYMHKgwULVh4sWLDyYMGClQcLFqw8WLBg5cGCBSsPFixYebBgwcqDBQtWHixYsPJgwYKVBwsWrDxYsGDlwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBgvWmA6GaGZTgcurxAAAAAElFTkSuQmCC',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAtElEQVR4nO3QQQkAIADAQDMZ1rpawY8M4WABxo29pi4b+cFHwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBggUrDxYsWHmwYMHKgwULVh4sWLDyYMGClQcLFqw8WLBg5cGCBSsPFixYebBgwcqDBQtWHixYsPJgwYKVBwsWrDxYsGDlwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBgvWmA69CcXwI6mdWAAAAAElFTkSuQmCC',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAAtElEQVR4nO3QQQkAIADAQMOaybpawY8M4WABxo01ty4b+cFHwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBggUrDxYsWHmwYMHKgwULVh4sWLDyYMGClQcLFqw8WLBg5cGCBSsPFixYebBgwcqDBQtWHixYsPJgwYKVBwsWrDxYsGDlwYIFKw8WLFh5sGDByoMFC1YeLFiw8mDBgpUHCxasPFiwYOXBgvWmAboYxHzQk8TAAAAAElFTkSuQmCC',
      'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAIAAAD/gAIDAAAA5klEQVR4nO3QQQ0AIAzDwPlXhiwsrC9Ccqeg6RzW5nXAT8wKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzArMCswKzAoujYyS1mCGlhgAAAAASUVORK5CYII=',
    ][i - 1],
    title: `图片 ${i}`,
  });
}

// ==============================
// 图片加载
// ==============================
async function fetchPhotos() {
  try {
    const photosList = await request.get('/gallery');
    if (Array.isArray(photosList)) {
      const photos = photosList.map(p => ({
        ...p,
        image_url: '/gallery-images/' + p.image_filename,
      }));
      photoList.value = photos;
      photoCount.value = photos.length;
    }
  } catch (e) {
    console.error('Failed to fetch photos:', e);
    photoCount.value = 0;
  }
}

function preloadImages(items) {
  return Promise.all(items.map(item => new Promise((resolve) => {
    const img = new Image();
    if (!item.image_url || !item.image_url.startsWith('data:')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => resolve({ img, ...item });
    img.onerror = () => resolve(null);
    img.src = item.image_url;
  })));
}

// ==============================
// Canvas 初始化
// ==============================
function initCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  window.addEventListener('resize', onResize);
  sphereRadius = Math.min(W, H) * 0.35;
  sphereDist = Math.min(W, H) * 1.2;
}

function resizeCanvas() {
  const canvas = canvasRef.value;
  if (!canvas) return;
  const dpr = window.devicePixelRatio || 1;
  W = window.innerWidth;
  H = window.innerHeight;
  canvas.width = W * dpr;
  canvas.height = H * dpr;
}

function onResize() {
  const oldW = W || window.innerWidth;
  const oldH = H || window.innerHeight;
  resizeCanvas();
  if (images.length > 0 && nodes.length > 0 && oldW > 0 && oldH > 0) {
    // 轨道/视差模式等比缩放
    const ratioW = W / oldW;
    const ratioH = H / oldH;
    nodes.forEach(n => {
      n.orbitRadius *= Math.min(ratioW, ratioH);
      n.parallaxX *= ratioW;
      n.parallaxY *= ratioH;
    });
    // 球体参数自适应
    sphereRadius = Math.min(W, H) * 0.35;
    sphereDist = Math.min(W, H) * 1.2;
  } else if (images.length > 0) {
    initNodes();
  }
}

// ==============================
// 节点初始化（3D 球体）
// ==============================
function initNodes() {
  const count = allLoadedImages.filter(Boolean).length;
  nodes = [];
  sphereRadius = Math.min(W, H) * 0.35;
  sphereDist = Math.min(W, H) * 1.2;
  sphereTheta = 0;
  spherePhi = Math.PI * 0.1;
  sphereScale = 1;

  const sortedIndices = [...Array(count).keys()];
  for (let i = sortedIndices.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sortedIndices[i], sortedIndices[j]] = [sortedIndices[j], sortedIndices[i]];
  }

  sortedIndices.forEach((imgIdx, i) => {
    const loaded = allLoadedImages[imgIdx];
    if (!loaded) return;
    const imgElement = loaded.img;

    // Fibonacci 球体均匀分布
    const golden = (1 + Math.sqrt(5)) / 2;
    const inc = Math.acos(1 - 2 * (i + 0.5) / count);
    const az = 2 * Math.PI * i / golden;

    const nw = imgElement.naturalWidth || 100;
    const nh = imgElement.naturalHeight || 100;
    const photoSize = 55;
    let pw, ph;
    if (nw >= nh) {
      pw = photoSize;
      ph = photoSize * (nh / nw);
    } else {
      ph = photoSize;
      pw = photoSize * (nw / nh);
    }
    pw = Math.max(22, pw);
    ph = Math.max(22, ph);

    nodes.push({
      img: imgElement, pw, ph,
      title: photoList.value[imgIdx]?.title || `Photo ${imgIdx + 1}`,
      sTheta: inc, sPhi: az,
      orbitRadius: Math.min(W, H) * 0.16 + 30 + (i / Math.max(count - 1, 1)) * (Math.min(W, H) * 0.45 - 30),
      orbitSpeed: (0.15 + (i % 3) * 0.1) * (i % 2 === 0 ? 1 : -1),
      orbitAngle: (i / Math.max(count, 1)) * Math.PI * 2,
      z: 0.2 + (i / Math.max(count - 1, 1)) * 0.8,
      parallaxX: 20 + Math.random() * (W - 40),
      parallaxY: H * 0.05 + Math.random() * H * 0.9,
      parallaxVy: -(0.15 + 0.6 * (i / Math.max(count - 1, 1))),
    });
  });
}

// ==============================
// 星座模式 → 3D 球体照片墙
// ==============================
function drawConstellation(dt) {
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.7);
  bg.addColorStop(0, '#1a0a2e');
  bg.addColorStop(0.5, '#0d0221');
  bg.addColorStop(1, '#050010');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawStars();

  if (nodes.length === 0) return;

  const R = sphereRadius * sphereScale;
  const dist = sphereDist;
  const focalLen = Math.min(W, H) * 2;
  const ct = Math.cos(sphereTheta);
  const st = Math.sin(sphereTheta);
  const cp = Math.cos(spherePhi);
  const sp = Math.sin(spherePhi);

  // 3D 投影 + 深度排序
  const projected = [];
  nodes.forEach((n, i) => {
    const theta = n.sTheta;
    const phi = n.sPhi;
    let x3d = R * Math.sin(theta) * Math.cos(phi);
    let y3d = R * Math.cos(theta);
    let z3d = R * Math.sin(theta) * Math.sin(phi);

    // Y 轴旋转
    const x1 = x3d * ct - z3d * st;
    const z1 = x3d * st + z3d * ct;
    // X 轴旋转
    const y1 = y3d * cp - z1 * sp;
    const z2 = y3d * sp + z1 * cp;

    const zDist = dist + z2;
    if (zDist <= 0) return;

    const projScale = focalLen / zDist;
    const px = W / 2 + x1 * projScale;
    const py = H / 2 - y1 * projScale;
    const sizeScale = (projScale / (focalLen / dist)) * sphereScale;
    const depthAlpha = Math.max(0.15, Math.min(1, 1 - (z2 + R) / (2 * R) * 0.5));

    projected.push({ i, px, py, depth: zDist, sizeScale, depthAlpha });
  });

  projected.sort((a, b) => b.depth - a.depth);
  const starThreshold = 8;
  // 球体缩到足够小（sphereScale < 0.55）时全体变粉色圆点
  const isDotMode = sphereScale < 0.55;

  projected.forEach((p) => {
    const n = nodes[p.i];
    const px = p.px, py = p.py, s = p.sizeScale, alpha = p.depthAlpha;
    if (px < -200 || px > W + 200 || py < -200 || py > H + 200) return;

    const drawW = n.pw * s;
    const drawH = n.ph * s;

    if (drawW < starThreshold || isDotMode) {
      const dotR = isDotMode
        ? Math.max(2, drawW * 0.35)
        : Math.max(5, drawW * 0.5);
      ctx.beginPath();
      ctx.arc(px, py, dotR, 0, Math.PI * 2);
      if (isDotMode) {
        ctx.fillStyle = `rgba(242, 107, 138, ${0.5 + 0.5 * alpha})`;
      } else {
        ctx.fillStyle = `rgba(255, 255, 255, ${0.3 + 0.5 * alpha})`;
      }
      ctx.fill();
    } else {
      if (drawW >= 10) {
        const glowSize = Math.max(drawW, drawH) * 0.5;
        const glow = ctx.createRadialGradient(px, py, 0, px, py, glowSize);
        glow.addColorStop(0, `rgba(242, 107, 138, ${0.06 * alpha})`);
        glow.addColorStop(1, 'rgba(242, 107, 138, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, glowSize, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.save();
      const rad = Math.min(6, drawW / 2, drawH / 2);
      ctx.beginPath();
      ctx.moveTo(px - drawW / 2 + rad, py - drawH / 2);
      ctx.lineTo(px + drawW / 2 - rad, py - drawH / 2);
      ctx.quadraticCurveTo(px + drawW / 2, py - drawH / 2, px + drawW / 2, py - drawH / 2 + rad);
      ctx.lineTo(px + drawW / 2, py + drawH / 2 - rad);
      ctx.quadraticCurveTo(px + drawW / 2, py + drawH / 2, px + drawW / 2 - rad, py + drawH / 2);
      ctx.lineTo(px - drawW / 2 + rad, py + drawH / 2);
      ctx.quadraticCurveTo(px - drawW / 2, py + drawH / 2, px - drawW / 2, py + drawH / 2 - rad);
      ctx.lineTo(px - drawW / 2, py - drawH / 2 + rad);
      ctx.quadraticCurveTo(px - drawW / 2, py - drawH / 2, px - drawW / 2 + rad, py - drawH / 2);
      ctx.closePath();
      ctx.clip();
      ctx.globalAlpha = alpha;
      ctx.drawImage(n.img, px - drawW / 2, py - drawH / 2, drawW, drawH);
      ctx.globalAlpha = 1;
      ctx.restore();

      if (drawW >= 8) {
        ctx.strokeStyle = `rgba(255, 255, 255, ${0.1 * alpha})`;
        ctx.lineWidth = Math.max(0.5, 1 * s);
        ctx.strokeRect(px - drawW / 2, py - drawH / 2, drawW, drawH);
      }
    }
  });

  drawPreview();
}


// ==============================
// 大图预览弹窗
// ==============================
function drawPreview() {
  if (selectedNodeIndex < 0 || selectedNodeIndex >= nodes.length) return;
  const n = nodes[selectedNodeIndex];
  if (!n || !n.img) return;

  ctx.fillStyle = 'rgba(0, 0, 0, 0.75)';
  ctx.fillRect(0, 0, W, H);

  const maxW = W * 0.85;
  const maxH = H * 0.7;
  const iw = n.img.naturalWidth;
  const ih = n.img.naturalHeight;
  const scale = Math.min(maxW / iw, maxH / ih);
  const dw = iw * scale;
  const dh = ih * scale;
  const dx = (W - dw) / 2;
  const dy = (H - dh) / 2;

  const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.max(dw, dh) * 0.8);
  glow.addColorStop(0, 'rgba(242, 107, 138, 0.12)');
  glow.addColorStop(1, 'rgba(242, 107, 138, 0)');
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  ctx.save();
  const radius = 12;
  ctx.beginPath();
  ctx.moveTo(dx + radius, dy);
  ctx.lineTo(dx + dw - radius, dy);
  ctx.quadraticCurveTo(dx + dw, dy, dx + dw, dy + radius);
  ctx.lineTo(dx + dw, dy + dh - radius);
  ctx.quadraticCurveTo(dx + dw, dy + dh, dx + dw - radius, dy + dh);
  ctx.lineTo(dx + radius, dy + dh);
  ctx.quadraticCurveTo(dx, dy + dh, dx, dy + dh - radius);
  ctx.lineTo(dx, dy + radius);
  ctx.quadraticCurveTo(dx, dy, dx + radius, dy);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(n.img, dx, dy, dw, dh);
  ctx.restore();

  ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.lineWidth = 2;
  ctx.strokeRect(dx - 1, dy - 1, dw + 2, dh + 2);

  ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
  ctx.font = '13px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('\u70b9\u51fb\u5173\u95ed', W / 2, dy + dh + 36);
}

// ==============================
// 行星轨道模式
// ==============================
function drawOrbit(dt) {
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.8);
  bg.addColorStop(0, '#0a1628');
  bg.addColorStop(0.5, '#060e1a');
  bg.addColorStop(1, '#020408');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawStars();

  if (nodes.length === 0) return;

  const star = nodes[0];
  const starSize = Math.min(W, H) * 0.22;
  const glow = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, starSize * 3);
  glow.addColorStop(0, 'rgba(255, 180, 120, 0.4)');
  glow.addColorStop(0.3, 'rgba(242, 107, 138, 0.15)');
  glow.addColorStop(0.6, 'rgba(242, 107, 138, 0.05)');
  glow.addColorStop(1, 'rgba(242, 107, 138, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, starSize * 3, 0, Math.PI * 2);
  ctx.fill();

  // 恒星：按图片较小边等比裁剪成正方形
  const natW_star = star.img.naturalWidth;
  const natH_star = star.img.naturalHeight;
  const cropStar = Math.min(natW_star, natH_star);
  const srcX_star = (natW_star - cropStar) / 2;
  const srcY_star = (natH_star - cropStar) / 2;

  ctx.save();
  ctx.beginPath();
  ctx.arc(W / 2, H / 2, starSize / 2, 0, Math.PI * 2);
  ctx.clip();
  ctx.drawImage(star.img, srcX_star, srcY_star, cropStar, cropStar, W / 2 - starSize / 2, H / 2 - starSize / 2, starSize, starSize);
  ctx.restore();

  ctx.beginPath();
  ctx.arc(W / 2, H / 2, starSize / 2, 0, Math.PI * 2);
  ctx.strokeStyle = 'rgba(255, 200, 150, 0.5)';
  ctx.lineWidth = 2;
  ctx.stroke();

  const orbiters = nodes.slice(1);
  const orbiterCount = orbiters.length;

  // 先画轨道线
  orbiters.forEach((n) => {
    ctx.beginPath();
    ctx.arc(W / 2, H / 2, n.orbitRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(242, 107, 138, 0.12)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });

  // 画行星
  orbiters.forEach((n) => {
    const r = n.orbitRadius;
    const speed = n.orbitSpeed;
    n.orbitAngle += speed * 0.001 * dt;

    const px = W / 2 + Math.cos(n.orbitAngle) * r;
    const py = H / 2 + Math.sin(n.orbitAngle) * r;

    // 行星大小：内圈小、外圈大，整体偏小
    // 行星大小整体放大一倍
    const planetRadius = 20 + (r / Math.min(W, H)) * 20;

    // 行星：按图片较小边等比裁剪成正方形，填充圆形
    const natW = n.img.naturalWidth;
    const natH = n.img.naturalHeight;
    const cropSize = Math.min(natW, natH);
    const srcX = (natW - cropSize) / 2;
    const srcY = (natH - cropSize) / 2;
    const planetDiameter = planetRadius * 2;

    // 行星光晕
    const glowR = planetRadius * 1.5;
    const pglow = ctx.createRadialGradient(px, py, planetRadius * 0.8, px, py, glowR);
    pglow.addColorStop(0, 'rgba(242, 107, 138, 0.12)');
    pglow.addColorStop(1, 'rgba(242, 107, 138, 0)');
    ctx.fillStyle = pglow;
    ctx.beginPath();
    ctx.arc(px, py, glowR, 0, Math.PI * 2);
    ctx.fill();

    // 行星本体（圆形裁剪，图片等比填充）
    ctx.save();
    ctx.beginPath();
    ctx.arc(px, py, planetRadius, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(n.img, srcX, srcY, cropSize, cropSize, px - planetRadius, py - planetRadius, planetDiameter, planetDiameter);
    ctx.restore();

    // 行星边缘高光
    ctx.beginPath();
    ctx.arc(px, py, planetRadius, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
}

// ==============================
// 深空视差模式
// ==============================
function drawParallax(dt) {
  const bg = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, Math.min(W, H) * 0.7);
  bg.addColorStop(0, '#0f0a1a');
  bg.addColorStop(0.5, '#080412');
  bg.addColorStop(1, '#020106');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, W, H);
  drawStars();

  if (activeParallaxNodes.length === 0) return;

  // 循环队列：检查哪些飘出屏幕了，从队列里换新照片
  const toRemove = [];
  activeParallaxNodes.forEach((n) => {
    n.parallaxY += n.parallaxVy * dt * 0.02;
    if (n.parallaxY < -100) toRemove.push(n);
  });

  toRemove.forEach((n) => {
    const idx = activeParallaxNodes.indexOf(n);
    activeParallaxNodes.splice(idx, 1);
    parallaxQueue.push(n);

    const next = parallaxQueue.shift();
    next.parallaxY = H + 50 + Math.random() * 100;
    next.parallaxX = 20 + Math.random() * (W - 40);
    next.z = 0.15 + Math.random() * 0.85;
    next.parallaxVy = -(0.15 + next.z * 0.35);
    activeParallaxNodes.push(next);
  });

  // 按 z 排序：远景先画（低 z），近景后画（高 z）
  const renderList = [...activeParallaxNodes].sort((a, b) => a.z - b.z);

  renderList.forEach((n) => {
    n.parallaxY += n.parallaxVy * dt * 0.02;
    if (n.parallaxY < -100) return;

    const dispSize = 40 + n.z * 90;
    const alpha = 0.2 + n.z * 0.7;
    const px = n.parallaxX;
    const py = n.parallaxY;

    if (py < -120 || py > H + 120 || px < -80 || px > W + 80) return;

    // 按原始比例显示，不裁剪
    const natW = n.img.naturalWidth;
    const natH = n.img.naturalHeight;
    const scale = Math.min(dispSize / natW, dispSize / natH, 1);
    const drawW = natW * scale;
    const drawH = natH * scale;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.drawImage(n.img, px - drawW / 2, py - drawH / 2, drawW, drawH);
    ctx.restore();
  });
}

// ==============================
// 模式切换
// ==============================
async function switchMode(mode) {
  currentMode.value = mode;
  if (mode === MODES.ORBIT) {
    const orbiterCount = Math.max(1, nodes.length - 1);
    const orbiters = nodes.slice(1);
    orbiters.forEach((n, i) => {
      n.orbitRadius = Math.min(W, H) * 0.16 + 30 + (i / Math.max(orbiterCount, 1)) * (Math.min(W, H) * 0.45 - 30);
      n.orbitSpeed = (0.15 + (i % 3) * 0.1) * (i % 2 === 0 ? 1 : -1);
      n.orbitAngle = (i / Math.max(orbiterCount, 1)) * Math.PI * 2;
    });
  } else if (mode === MODES.PARALLAX) {
    // 所有照片入队列，随机打乱
    parallaxQueue = [...nodes].sort(() => Math.random() - 0.5);
    // 取前 30 张作为当前屏幕画面
    const batchCount = Math.min(30, nodes.length);
    activeParallaxNodes = parallaxQueue.slice(0, batchCount);
    activeParallaxNodes.forEach((n, i) => {
      // z 值均匀分布：远景 0.15 → 近景 1.0
      n.z = 0.15 + (i / Math.max(batchCount - 1, 1)) * 0.85;
      n.parallaxX = 20 + Math.random() * (W - 40);
      n.parallaxY = -100 + Math.random() * (H + 200);
      n.parallaxVy = -(0.15 + n.z * 0.35);
    });
  }
}

// ==============================
// 触摸事件（球体旋转 + 缩放）
// ==============================
function getTouchDist(e) {
  if (e.touches.length < 2) return 0;
  const dx = e.touches[0].clientX - e.touches[1].clientX;
  const dy = e.touches[0].clientY - e.touches[1].clientY;
  return Math.sqrt(dx * dx + dy * dy);
}

function onTouchStart(e) {
  if (currentMode.value !== MODES.CONSTELLATION) return;
  mouseInside = true;
  hasMovedWhileDragging = false;
  if (e.touches.length === 1) {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (rect) {
      tapStartX = e.touches[0].clientX - rect.left;
      tapStartY = e.touches[0].clientY - rect.top;
      touchStartX = tapStartX;
      touchStartY = tapStartY;
      sphereTouchStartTheta = sphereTheta;
      sphereTouchStartPhi = spherePhi;
    }
    isPinching = false;
  } else if (e.touches.length === 2) {
    const t1 = e.touches[0], t2 = e.touches[1];
    touchStartDist = getTouchDist(e);
    touchStartScale = sphereScale;
    isPinching = true;
  }
}

function onTouchMove(e) {
  if (currentMode.value !== MODES.CONSTELLATION) {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (rect) {
      mouseX = (e.touches?.[0]?.clientX || 0) - rect.left;
      mouseY = (e.touches?.[0]?.clientY || 0) - rect.top;
      mouseInside = true;
    }
    return;
  }
  e.preventDefault();

  if (isPinching && e.touches.length >= 2) {
    const dist = getTouchDist(e);
    if (touchStartDist > 0) {
      const ratio = dist / touchStartDist;
      sphereScale = Math.max(sphereMinScale, Math.min(sphereMaxScale, touchStartScale * ratio));
    }
  } else if (!isPinching && e.touches.length === 1) {
    const rect = canvasRef.value?.getBoundingClientRect();
    if (rect) {
      const mx = e.touches[0].clientX - rect.left;
      const my = e.touches[0].clientY - rect.top;
      const dx = mx - tapStartX;
      const dy = my - tapStartY;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        hasMovedWhileDragging = true;
      }
      sphereTheta = sphereTouchStartTheta + dx * 0.01;
      spherePhi = Math.max(-Math.PI * 0.4, Math.min(Math.PI * 0.4, sphereTouchStartPhi - dy * 0.01));
    }
  }
}

function onTouchEnd(e) {
  if (e.touches.length === 0) {
    if (currentMode.value === MODES.CONSTELLATION && !isPinching) {
      if (hasMovedWhileDragging) {
        wasTouchDrag = true;
        setTimeout(() => { wasTouchDrag = false; }, 100);
      } else if (selectedNodeIndex >= 0) {
        selectedNodeIndex = -1;
      } else {
        selectedNodeIndex = hitTestPhoto(tapStartX, tapStartY);
      }
    }
    isPinching = false;
    mouseInside = false;
    hasMovedWhileDragging = false;
  } else if (e.touches.length === 1) {
    isPinching = false;
    const rect = canvasRef.value?.getBoundingClientRect();
    if (rect) {
      touchStartX = e.touches[0].clientX - rect.left;
      touchStartY = e.touches[0].clientY - rect.top;
    }
  }
}

// ==============================
// 点击命中检测
// ==============================
function hitTestPhoto(cx, cy) {
  if (currentMode.value !== MODES.CONSTELLATION) return -1;
  const R = sphereRadius * sphereScale;
  const dist = sphereDist;
  const focalLen = Math.min(W, H) * 2;
  const ct = Math.cos(sphereTheta);
  const st = Math.sin(sphereTheta);
  const cp = Math.cos(spherePhi);
  const sp = Math.sin(spherePhi);

  let bestHit = -1;
  let bestDepth = Infinity;

  nodes.forEach((n, i) => {
    const theta = n.sTheta;
    const phi = n.sPhi;
    let x3d = R * Math.sin(theta) * Math.cos(phi);
    let y3d = R * Math.cos(theta);
    let z3d = R * Math.sin(theta) * Math.sin(phi);

    const x1 = x3d * ct - z3d * st;
    const z1 = x3d * st + z3d * ct;
    const y1 = y3d * cp - z1 * sp;
    const z2 = y3d * sp + z1 * cp;

    const zDist = dist + z2;
    if (zDist <= 0) return;

    const projScale = focalLen / zDist;
    const px = W / 2 + x1 * projScale;
    const py = H / 2 - y1 * projScale;
    const sizeScale = projScale / (focalLen / dist);
    const drawW = n.pw * sizeScale;
    const drawH = n.ph * sizeScale;
    const tapR = Math.max(20, drawW / 2, drawH / 2);

    if (cx >= px - tapR && cx <= px + tapR && cy >= py - tapR && cy <= py + tapR) {
      if (zDist < bestDepth) {
        bestDepth = zDist;
        bestHit = i;
      }
    }
  });

  return bestHit;
}

// ==============================
// 鼠标事件
// ==============================
function onWheel(e) {
  if (currentMode.value !== MODES.CONSTELLATION) return;
  e.preventDefault();
  const delta = e.deltaY > 0 ? 0.9 : 1.1;
  sphereScale = Math.max(sphereMinScale, Math.min(sphereMaxScale, sphereScale * delta));
}

function onMouseMove(e) {
  if (currentMode.value === MODES.CONSTELLATION) return;
  const rect = canvasRef.value?.getBoundingClientRect();
  if (rect) {
    mouseX = e.clientX - rect.left;
    mouseY = e.clientY - rect.top;
    mouseInside = true;
  }
}

function onMouseLeave() {
  mouseInside = false;
}

function onCanvasClick(e) {
  if (currentMode.value !== MODES.CONSTELLATION) return;
  if (wasTouchDrag) { wasTouchDrag = false; return; }
  const rect = canvasRef.value?.getBoundingClientRect();
  if (!rect) return;
  const cx = e.clientX - rect.left;
  const cy = e.clientY - rect.top;

  if (selectedNodeIndex >= 0) {
    selectedNodeIndex = -1;
    return;
  }
  selectedNodeIndex = hitTestPhoto(cx, cy);
}

// ==============================
// 主渲染循环
// ==============================
function render(timestamp) {
  if (!ctx) return;
  renderTimestamp = timestamp;
  const dt = lastRenderTime > 0 ? (timestamp - lastRenderTime) : 16;
  lastRenderTime = timestamp;
  ctx.clearRect(0, 0, W, H);

  // 星座模式下缓慢自转
  if (currentMode.value === MODES.CONSTELLATION) {
    sphereTheta += 0.15 * dt / 1000;
  }

  switch (currentMode.value) {
    case MODES.CONSTELLATION: drawConstellation(dt); break;
    case MODES.ORBIT: drawOrbit(dt); break;
    case MODES.PARALLAX: drawParallax(dt); break;
  }

  animId = requestAnimationFrame(render);
}

// ==============================
// 生命周期
// ==============================
onMounted(async () => {
  await fetchPhotos();

  if (photoList.value.length === 0) {
    photoList.value = [...PLACEHOLDER];
    photoCount.value = PLACEHOLDER.length;
  }
  allLoadedImages = await preloadImages(photoList.value);
  allLoadedImages = allLoadedImages.filter(Boolean);
  images = allLoadedImages;

  await nextTick();
  initCanvas();
  initNodes();
  await switchMode(MODES.CONSTELLATION);

  const canvas = canvasRef.value;
  if (canvas) {
    canvas.addEventListener('touchstart', onTouchStart, { passive: true });
    canvas.addEventListener('touchmove', onTouchMove, { passive: false });
    canvas.addEventListener('touchend', onTouchEnd, { passive: true });
    canvas.addEventListener('wheel', onWheel, { passive: false });
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseleave', onMouseLeave);
    canvas.addEventListener('click', onCanvasClick);
  }

  animId = requestAnimationFrame(render);
});

onBeforeUnmount(() => {
  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }
  window.removeEventListener('resize', onResize);
  const canvas = canvasRef.value;
  if (canvas) {
    canvas.removeEventListener('touchstart', onTouchStart);
    canvas.removeEventListener('touchmove', onTouchMove);
    canvas.removeEventListener('touchend', onTouchEnd);
    canvas.removeEventListener('wheel', onWheel);
    canvas.removeEventListener('mousemove', onMouseMove);
    canvas.removeEventListener('mouseleave', onMouseLeave);
    canvas.removeEventListener('click', onCanvasClick);
  }
  ctx = null;
});
</script>

<style scoped>
.space-album {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

.space-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.space-nav {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 100;
}

.space-nav :deep(.van-nav-bar) {
  background: transparent;
}

.space-nav :deep(.van-nav-bar__title) {
  color: #fff;
  font-size: 16px;
  text-shadow: 0 1px 4px rgba(0,0,0,0.5);
}

.space-nav :deep(.van-nav-bar .van-icon) {
  color: #fff;
}

.mode-switcher {
  position: fixed;
  top: 46px;
  left: 50%;
  transform: translateX(-50%);
  z-index: 99;
  display: flex;
  gap: 8px;
}

.mode-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 14px;
  border-radius: 20px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(10px);
  color: rgba(255, 255, 255, 0.5);
  font-size: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  border: 1px solid transparent;
}

.mode-btn.mode-active {
  background: rgba(242, 107, 138, 0.2);
  color: #F26B8A;
  border-color: rgba(242, 107, 138, 0.3);
}

.mode-icon {
  font-size: 14px;
}

.space-footer {
  position: fixed;
  bottom: 34px;
  left: 0;
  right: 0;
  z-index: 99;
  text-align: center;
}

.footer-info {
  display: inline-block;
  padding: 4px 16px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.08);
  backdrop-filter: blur(8px);
  color: rgba(255, 255, 255, 0.4);
  font-size: 12px;
}
</style>
