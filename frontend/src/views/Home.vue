<template>
  <div class="home-page">

    <!-- ===== 顶部状态栏（跟随滚动固定） ===== -->
    <div class="sticky-top">
      <div class="status-bar">
        <span class="brand-name">GoToMarry</span>
      </div>
    </div>

    <!-- ===== 粉色主视觉大卡片（倒计时 + 日历并排） ===== -->
    <div class="hero-card">
      <div class="hero-title">
        <span class="hero-avatar">{{ groomInitial }}</span>
        <svg class="hero-ecg" viewBox="0 0 20 20" width="10" height="10">
          <path d="M0 10 L7 10 L9 4 L12 16 L14 10 L20 10" stroke="#FFFFFF" stroke-width="2" fill="none" opacity="1">
            <animate attributeName="stroke" values="#FFFFFF;#F26B8A;#FFFFFF" dur="2s" repeatCount="indefinite"/>
          </path>
        </svg>
        <span class="hero-heart">❤</span>
        <svg class="hero-ecg" viewBox="0 0 20 20" width="10" height="10">
          <path d="M0 10 L7 10 L9 4 L12 16 L14 10 L20 10" stroke="#FFFFFF" stroke-width="2" fill="none" opacity="1">
            <animate attributeName="stroke" values="#FFFFFF;#F26B8A;#FFFFFF" dur="2s" repeatCount="indefinite"/>
          </path>
        </svg>
        <span class="hero-avatar">{{ brideInitial }}</span>
      </div>
      <!-- 右上角：地点和婚礼形式（可编辑） -->
      <div class="hero-location-tag" @click="showEditLocation = true">
        {{ locationText }}
      </div>
      <!-- 编辑弹窗 -->
      <van-dialog
        v-model:show="showEditLocation"
        title="编辑地点和婚礼形式"
        show-cancel-button
        @confirm="saveLocation"
      >
        <div style="padding:16px">
          <van-field v-model="editLocation" label="地点" placeholder="如：大理" />
          <van-field v-model="editType" label="婚礼形式" placeholder="如：目的地婚礼" style="margin-top:12px" />
        </div>
      </van-dialog>
      <div class="hero-row">
        <!-- 左侧：倒计时 2/3 -->
        <div class="hero-cell hero-cell-left" :class="{ 'hero-cell-expanded': weddingStatus !== 'before' }">
          <!-- 婚礼前：倒计时 -->
          <template v-if="weddingStatus === 'before'">
            <div class="hero-cell-top">
              <div class="hero-top-label">⏰ 距离答谢宴还有</div>
            </div>
            <div class="hero-countdown">
              <div class="cd-unit">
                <span class="cd-value">{{ countdown.days }}</span>
                <span class="cd-label">天</span>
              </div>
              <div class="cd-unit">
                <span class="cd-value">{{ countdown.hours }}</span>
                <span class="cd-label">时</span>
              </div>
              <div class="cd-unit">
                <span class="cd-value">{{ countdown.minutes }}</span>
                <span class="cd-label">分</span>
              </div>
              <div class="cd-unit">
                <span class="cd-value">{{ countdown.seconds }}</span>
                <span class="cd-label">秒</span>
              </div>
            </div>
            <div class="hero-cell-bottom">
              <div class="hero-divider"></div>
              <div class="hero-wedding-date">💍 婚期：{{ formattedWeddingDate }}</div>
            </div>
          </template>
          <!-- 婚礼当天：新婚快乐 -->
          <template v-else-if="weddingStatus === 'on'">
            <div class="hero-cell-top">
              <div class="hero-top-label">💍 今日大喜 💍</div>
            </div>
            <div class="hero-wedding-day-content">
              <div class="wd-main">💍 新婚快乐 💍</div>
              <div class="wd-sub">✨ 愿你们永结同心，白头偕老 ✨</div>
              <div class="wd-decor">🎉 💕 🌸 🎊 💖 🌺</div>
            </div>
            <div class="hero-cell-bottom">
              <div class="hero-divider"></div>
              <div class="hero-wedding-date">💍 婚期：{{ formattedWeddingDate }}</div>
            </div>
          </template>
          <!-- 婚礼后：圆满完成 -->
          <template v-else>
            <div class="hero-cell-top">
              <div class="hero-top-label">🎊 婚礼圆满 🎊</div>
            </div>
            <div class="hero-post-wedding-content">
              <div class="pw-main">🎊 婚礼圆满完成！ 🎊</div>
              <div class="pw-sub">❤️ 幸福旅程，正式启程 ❤️</div>
              <div class="pw-decor">🌸 💐 🥂 💑 🏠 💒</div>
            </div>
            <div class="hero-cell-bottom">
              <div class="hero-divider"></div>
              <div class="hero-wedding-date">💍 婚期：{{ formattedWeddingDate }}</div>
            </div>
          </template>
        </div>
        <!-- 右侧：日历 1/3 -->
        <div class="hero-cell hero-cell-right" :class="{ 'hero-cell-hidden': weddingStatus !== 'before' }">
          <!-- 月份 + 农历（右上金底） -->
          <div class="cal-top-row">
            <span class="cal-month">{{ calMonth }}</span>
            <span class="cal-lunar-tag">{{ calLunarDate }}</span>
          </div>
          <!-- 日（大号）+ 周六（底部对齐） -->
          <div class="cal-middle-row">
            <span class="cal-day">{{ calDay }}</span>
            <span class="cal-weekday">{{ calWeekday }}</span>
          </div>
          <!-- 分隔白线 -->
          <div class="cal-divider"></div>
          <!-- 宜忌 -->
          <div class="cal-yiji">
            <div class="cal-yi-line"><span class="cal-dot"></span>{{ calYi }}</div>
            <div class="cal-ji-line"><span class="cal-dot"></span>{{ calJi }}</div>
          </div>
          <div class="cal-divider" style="margin-top: 6px;"></div>
          <div class="cal-anniversary-btn" @click="$router.push('/calendar')">纪念日 &gt;</div>
        </div>
      </div>
    </div>

    <!-- ===== 三列数据统计行 ===== -->
    <div class="stats-card">
      <div class="stats-left">
        <div class="stats-label">总进度</div>
        <div class="stats-big-num">{{ totalProgress }}%</div>
        <div class="stats-sub">{{ doneCount }}/{{ totalCount }} 项已完成</div>
      </div>
      <div class="stats-divider"></div>
      <div class="stats-mid">
        <div class="stats-label">预算使用</div>
        <div class="stats-big-num">¥{{ formatMoney(totalActual) }}</div>
        <div class="stats-sub">共 ¥{{ formatMoney(totalEstimated) }}</div>
      </div>
      <div class="stats-divider"></div>
      <div class="stats-right">
        <button class="btn-record" onclick="window.location.href='#/budgets'">去记录</button>
      </div>
    </div>

    <!-- ===== 最近待办模块 ===== -->
    <div class="todo-module">
      <div class="todo-header">
        <span class="todo-title">最近待办</span>
        <span class="todo-collapse" @click="showTodo = !showTodo">{{ showTodo ? '收起' : '展开' }}</span>
      </div>
      <div class="todo-card" v-for="t in pendingTasks" :key="t.id" v-show="showTodo" onclick="window.location.href='#/tasks'">
        <span class="todo-dot"></span>
        <div class="todo-content">
          <div class="todo-card-left">{{ t.title }}</div>
          <div class="todo-card-mid">{{ t.due_date ? t.due_date + ' · ' + getDaysLeft(t.due_date) : '📅 待定' }}</div>
        </div>
        <div class="todo-card-right">{{ t.status === 'todo' ? '未开始' : t.status === 'doing' ? '进行中' : '已完成' }}</div>
      </div>
      <div class="todo-view-all" v-show="showTodo" onclick="window.location.href='#/tasks'">查看完整清单</div>
    </div>

    <!-- ===== 四宫格功能入口（2x2） ===== -->
    <div class="grid-4">
      <div class="grid-item grid-item-seating" onclick="window.location.href='#/seating'">
        <div class="grid-content">
          <div class="grid-title">座位表</div>
          <div class="grid-sub">安排来宾席位</div>
        </div>
        <div class="grid-icon-box">🪑</div>
      </div>
      <div class="grid-item grid-item-gifts" onclick="window.location.href='#/gifts'">
        <div class="grid-content">
          <div class="grid-title">礼金</div>
          <div class="grid-sub">记录礼尚往来</div>
        </div>
        <div class="grid-icon-box">🧧</div>
      </div>
      <div class="grid-item grid-item-invitations" onclick="window.location.href='#/invitations'">
        <div class="grid-content">
          <div class="grid-title">请帖</div>
          <div class="grid-sub">发送电子请柬</div>
        </div>
        <div class="grid-icon-box">📧</div>
      </div>
      <van-swipe-cell>
        <div class="grid-item grid-item-diaries" onclick="window.location.href='#/diaries'">
          <div class="grid-content">
            <div class="grid-title">时光小记</div>
            <div class="grid-sub">{{ diaryCount }}篇日记</div>
          </div>
          <div class="grid-icon-box">📸</div>
        </div>
        <template #right>
          <div class="swipe-album-btn" @click="$router.push('/album')">
            <span>📷</span>
            <span>相册</span>
          </div>
        </template>
      </van-swipe-cell>
    </div>

    <!-- ===== 快捷操作浮动按钮 ===== -->
    <div class="quick-actions">
      <div class="quick-btn quick-btn-gift" @click="showGiftDialog = true">
        <span class="quick-icon">🧧</span>
        <span class="quick-label">记礼金</span>
      </div>
      <div class="quick-btn quick-btn-diary" @click="showAddDiary = true">
        <span class="quick-icon">📖</span>
        <span class="quick-label">写日记</span>
      </div>
    </div>

    <!-- ===== 礼金弹窗（Vant） ===== -->
    <van-dialog v-model:show="showGiftDialog" title="快速记礼金"
      show-cancel-button :before-close="handleGiftClose" confirm-button-text="保存" class="gift-dialog">
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

    <!-- ===== 日记弹窗（完整版，同时光小记） ===== -->
    <van-dialog v-model:show="showAddDiary" title="记录时光"
      show-cancel-button :before-close="handleDiarySave" confirm-button-text="发布" class="diary-dialog">
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

    <!-- ===== 底部导航栏（固定底部） ===== -->
    <div class="bottom-nav">
      <div class="nav-item nav-active" onclick="window.location.href='#/'">
        <div class="nav-indicator"></div>
        <div class="nav-icon">🏠</div>
        <div class="nav-label">首页</div>
      </div>
      <div class="nav-item" onclick="window.location.href='#/tasks'">
        <div class="nav-icon">📋</div>
        <div class="nav-label">清单</div>
      </div>
      <div class="nav-item" onclick="window.location.href='#/budgets'">
        <div class="nav-icon">💰</div>
        <div class="nav-label">预算</div>
      </div>
      <div class="nav-item" onclick="window.location.href='#/guests'">
        <div class="nav-icon">👥</div>
        <div class="nav-label">宾客</div>
      </div>
    </div>

  </div>
</template>

<script setup>
import { ref, computed, onMounted, reactive, onUnmounted } from 'vue';
import { showToast } from 'vant';
import { useTaskStore } from '@/stores/task';
import { useBudgetStore } from '@/stores/budget';
import { useGiftStore } from '@/stores/gift';
import { useDiaryStore } from '@/stores/diary';

const taskStore = useTaskStore();
const budgetStore = useBudgetStore();
const giftStore = useGiftStore();
const diaryStore = useDiaryStore();

// 从环境变量读取新人姓名
const groomName = import.meta.env.VITE_GROOM_NAME || '新郎';
const brideName = import.meta.env.VITE_BRIDE_NAME || '新娘';
const groomInitial = (groomName || '')[0] || '';
const brideInitial = (brideName || '')[0] || '';

const activeTab = ref('home');
const showGiftDialog = ref(false);
const showGiftSide = ref(false);
const showGiftType = ref(false);
const showTodo = ref(true);
const countdownInterval = ref(null);

// 实时时间（每秒更新，用于倒计时）
const currentTime = ref(new Date());

// 地点和婚礼形式（可编辑）
const showEditLocation = ref(false);
const editLocation = ref('');
const editType = ref('');
const locationText = ref('');

function loadLocation() {
  const saved = localStorage.getItem('weddingLocation');
  if (saved) {
    const data = JSON.parse(saved);
    editLocation.value = data.location || '';
    editType.value = data.type || '';
  } else {
    editLocation.value = '大理';
    editType.value = '目的地';
  }
  locationText.value = `${editLocation.value} · ${editType.value}`;
}

function saveLocation() {
  localStorage.setItem('weddingLocation', JSON.stringify({
    location: editLocation.value,
    type: editType.value
  }));
  locationText.value = `${editLocation.value} · ${editType.value}`;
  showToast('✅ 已保存');
}

// 问候
const greetingEmoji = ref('💍');
const greetingText = ref('下午好');

// 婚期（从环境变量读取）
const weddingDateStr = import.meta.env.VITE_WEDDING_DATE || '';
function parseWeddingDate(str) {
  if (!str) return { date: new Date(), formatted: '' };
  const [y, m, d] = str.split('-').map(Number);
  if ([y, m, d].some(isNaN)) return { date: new Date(), formatted: '' };
  return {
    date: new Date(y, m - 1, d),
    formatted: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
  };
}
const { date: weddingDate, formatted: formattedWeddingDate } = parseWeddingDate(weddingDateStr);

// 倒计时
const today = new Date();
const daysLeft = computed(() => {
  const now = new Date();
  return Math.max(0, Math.ceil((weddingDate - now) / (1000 * 60 * 60 * 24)));
});

// 分段倒计时（天/时/分/秒）
const countdown = computed(() => {
  const now = currentTime.value;
  const diff = Math.max(0, weddingDate - now);
  
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);
  
  return { days, hours, minutes, seconds };
});

// 婚礼状态：'before' | 'on' | 'after'
// on: 当天 00:00 ~ 23:59:59；after: 次日 00:00 起
const weddingStatus = computed(() => {
  const now = currentTime.value;
  // 婚礼当天开始和结束时间
  const start = new Date(weddingDate.getFullYear(), weddingDate.getMonth(), weddingDate.getDate(), 0, 0, 0);
  const end   = new Date(weddingDate.getFullYear(), weddingDate.getMonth(), weddingDate.getDate(), 23, 59, 59);
  if (now >= end) return 'after';
  if (now >= start) return 'on';
  return 'before';
});

// 日历数据
import Lunar from 'lunar-javascript';
const Solar = Lunar.Solar;
const calMonth = computed(() => new Date().getMonth() + 1 + '月');
const calDay = computed(() => new Date().getDate());
const calLunarDate = computed(() => {
  try {
    const l = Solar.fromDate(new Date());
    const d = l.getLunar();
    return d.getMonthInChinese() + '月' + d.getDayInChinese();
  } catch { return '--'; }
});
const calWeekday = computed(() => ['周日','周一','周二','周三','周四','周五','周六'][new Date().getDay()]);

const calYi = computed(() => {
  try { const d = Solar.fromDate(new Date()).getLunar(); return d.getDayYi().slice(0,3).join('、'); }
  catch { return '嫁娶'; }
});
const calJi = computed(() => {
  try { const d = Solar.fromDate(new Date()).getLunar(); return d.getDayJi().slice(0,3).join('、'); }
  catch { return ''; }
});

// 进度
const totalEstimated = computed(() => budgetStore.totalEstimated);
const totalActual = computed(() => budgetStore.totalActual);
const budgetPercent = computed(() => {
  if (totalEstimated.value <= 0) return 0;
  return Math.min((totalActual.value / totalEstimated.value) * 100, 100);
});

const totalCount = computed(() => taskStore.items.length);
const doneCount = computed(() => taskStore.items.filter(t => t.status === 'done').length);
const taskPercent = computed(() => totalCount.value > 0 ? Math.round(doneCount.value / totalCount.value * 100) : 0);
const pendingTasks = computed(() => {
  // 只显示日期已确定的待办任务（due_date 不为空），按日期升序排序，取最近的2个
  return taskStore.items
    .filter(t => t.status !== 'done' && t.due_date && t.due_date.trim() !== '')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 2);
});

const totalProgress = computed(() => {
  return Math.round((budgetPercent.value + taskPercent.value) / 2);
});

// 礼金
const giftTotal = computed(() => giftStore.summary?.totalAmount || 0);
const diaryCount = computed(() => diaryStore.items.length);

// 礼金表单
const giftForm = reactive({
  guestName: '', amount: '', giftType: '', dateGiven: today.toISOString().split('T')[0], side: '', notes: ''
});
const giftSideOptions = [
  { name: '男方亲友', value: 'groom' },
  { name: '女方亲友', value: 'bride' }
];
const giftTypeOptions = [
  { name: '💰 现金', value: '现金' },
  { name: '💳 转账', value: '转账' },
  { name: '🎁 礼物', value: '礼物' },
  { name: '其他', value: '其他' }
];

// 日记表单（完整版，支持作者选择、心情选择、图片上传）
const showAddDiary = ref(false);
const imageFiles = ref([]);
const diaryForm = reactive({
  author: groomName, mood: '', content: ''
});

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

async function handleDiarySave(action) {
  if (action !== 'confirm') {
    diaryForm.author = groomName; diaryForm.mood = ''; diaryForm.content = ''; imageFiles.value = [];
    return true;
  }
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
      } catch { /* skip */ }
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
    const nowDate = new Date().toISOString().split('T')[0];
    await diaryStore.addDiary({
      author: diaryForm.author,
      mood: diaryForm.mood || '',
      content: diaryForm.content || '',
      date: nowDate,
      images: images.length > 0 ? images : []
    });
    showToast('📖 日记已发布');
    diaryForm.author = groomName; diaryForm.mood = ''; diaryForm.content = ''; imageFiles.value = [];
    await diaryStore.fetchAll();
    return true;
  } catch (err) {
    showToast('发布失败: ' + (err.message || ''));
    return false;
  }
}

async function handleGiftSave() {
  if (!giftForm.guestName) { showToast('请输入姓名'); return false; }
  try {
    await giftStore.addGift({
      guestName: giftForm.guestName,
      amount: Number(giftForm.amount) || 0,
      giftType: giftForm.giftType,
      dateGiven: giftForm.dateGiven,
      side: giftForm.side,
      notes: giftForm.notes
    });
    showToast('✅ 礼金已记录');
    giftForm.guestName = ''; giftForm.amount = ''; giftForm.giftType = ''; giftForm.dateGiven = today.toISOString().split('T')[0]; giftForm.side = ''; giftForm.notes = '';
    return true;
  } catch (err) {
    showToast('保存失败: ' + (err.message || ''));
    return false;
  }
}

function handleGiftClose(action) {
  if (action !== 'confirm') return true;
  return handleGiftSave();
}



function formatMoney(n) {
  if (!n) return '0';
  return Number(n).toLocaleString('zh-CN');
}

function getDaysLeft(dueDate) {
  if (!dueDate) return '--';
  const due = new Date(dueDate);
  const diff = Math.ceil((due - today) / (1000 * 60 * 60 * 24));
  if (diff < 0) return '已过期 ' + Math.abs(diff) + ' 天';
  if (diff === 0) return '今天';
  return '还有 ' + diff + ' 天';
}

onMounted(async () => {
  const h = new Date().getHours();
  if (h < 6) { greetingEmoji.value = '🌙'; greetingText.value = '夜深了'; }
  else if (h < 12) { greetingEmoji.value = '🌅'; greetingText.value = '上午好'; }
  else if (h < 18) { greetingEmoji.value = '☀️'; greetingText.value = '下午好'; }
  else { greetingEmoji.value = '🌆'; greetingText.value = '晚上好'; }

  await Promise.all([
    taskStore.fetchList(),
    budgetStore.fetchAll(),
    giftStore.fetchAll(),
    diaryStore.fetchAll(),
  ]);

  // 加载地点和婚礼形式
  loadLocation();

  // 倒计时每秒更新
  countdownInterval.value = setInterval(() => {
    currentTime.value = new Date();
  }, 1000);
});

onUnmounted(() => {
  if (countdownInterval.value) {
    clearInterval(countdownInterval.value);
  }
});
</script>

<style scoped>
/* ================================================
   全局基础
   ================================================ */
.home-page {
  min-height: 100vh;
  background: #F8F8F8;
  padding-bottom: 80px;
}

/* ===== 顶部固定（sticky） ===== */
.sticky-top {
  position: sticky;
  top: 0;
  z-index: 11;
  background: #F8F8F8;
}

.home-page {
  font-family: 'Roboto', -apple-system, BlinkMacSystemFont, 'PingFang SC', 'Microsoft YaHei', sans-serif;
  color: #2E2E2E;
}

/* ================================================
   1. 顶部状态栏（左右结构）
   ================================================ */
.status-bar {
  padding: 14px 20px 6px;
  background: #FFFFFF;
}

.brand-name {
  font-size: 22px;
  font-weight: 700;
  color: #2E2E2E;
  letter-spacing: -0.5px;
}

.status-right,
.status-date,
.status-yiji {
  display: none;
}

/* ================================================
   2. 粉色主视觉大卡片
   ================================================ */
.hero-card {
  position: relative;
  margin: 6px 16px 12px;
  font-family: 'KaiTi', 'STKaiti', serif;
  background:
    radial-gradient(ellipse 220px 150px at 28% 42%, rgba(212, 175, 55, 0.28), transparent 70%),
    linear-gradient(135deg, #F26B8A 0%, #E8A0C5 50%, #C0A0E0 100%);
  border-radius: 20px;
  padding: 16px 16px 20px;
  box-shadow: 0 4px 12px rgba(242, 107, 138, 0.28);
  overflow: hidden;
  border: 2px solid rgba(255, 255, 255, 0.9);
}

.hero-title {
  font-size: 15px;
  font-weight: 700;
  color: #3D2B1F;
  margin-bottom: 10px;
  padding-left: 2px;
  display: flex;
  align-items: center;
  gap: 1px;
}

.hero-avatar {
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: #F26B8A;
  color: #FFFFFF;
  font-size: 13px;
  font-weight: 700;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 2px solid #FFD700;
  box-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
  animation: goldenBreath 4s ease-in-out infinite;
}

@keyframes goldenBreath {
  0%, 100% {
    box-shadow: none;
    border-color: transparent;
  }
  30% {
    box-shadow: 0 0 6px rgba(255, 215, 0, 0.3);
    border-color: rgba(255, 215, 0, 0.4);
  }
  60% {
    box-shadow: 0 0 16px rgba(255, 215, 0, 0.9);
    border-color: rgba(255, 215, 0, 1);
  }
}

.hero-heart {
  font-size: 16px;
  color: #F26B8A;
  line-height: 1;
  display: inline-block;
  animation: heartBeat 1.2s ease-in-out infinite;
  transform-origin: center;
}

@keyframes heartBeat {
  0%, 100% { transform: scale(1); }
  15% { transform: scale(1.35); }
  30% { transform: scale(1); }
  45% { transform: scale(1.15); }
  60% { transform: scale(1); }
}

.hero-ecg {
  flex-shrink: 0;
  display: inline-block;
  vertical-align: middle;
}

.hero-row {
  display: flex;
  gap: 12px;
  position: relative;
}

.hero-cell {
  border: 1.5px solid rgba(255, 255, 255, 0.7);
  border-radius: 14px;
  padding: 12px 10px;
  background: rgba(255, 209, 220, 0.6);
  transition: all 0.5s ease;
}

.hero-cell-left {
  flex: 2;
  display: flex;
  flex-direction: column;
}

/* 婚礼当天：倒计时卡片扩展至全屏 */
.hero-cell-left.hero-cell-expanded {
  flex: 12;
  width: 100%;
}

.hero-cell-right.hero-cell-hidden {
  display: none;
}

.hero-cell-top {
  margin-bottom: auto;
}

.hero-cell-bottom {
  margin-top: auto;
}

.hero-cell-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 10px 8px;
}

/* 顶部行：月份靠左 + 农历标签靠右 */
.cal-top-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 6px;
}

.cal-month {
  font-size: 11px;
  font-weight: 600;
  color: #3D2B1F;
  opacity: 0.7;
}

.cal-lunar-tag {
  font-size: 8px;
  color: #3D2B1F;
  font-weight: 600;
  background: #FFD700;
  padding: 1px 5px;
  border-radius: 6px;
  white-space: nowrap;
}

/* 中间行：日 + 周六底部对齐 */
.cal-middle-row {
  display: flex;
  align-items: flex-end;
  gap: 4px;
  margin-bottom: 4px;
}

.cal-day {
  font-size: 34px;
  font-weight: 800;
  color: #3D2B1F;
  line-height: 1;
}

.cal-weekday {
  font-size: 12px;
  font-weight: 600;
  color: #3D2B1F;
  opacity: 0.75;
  line-height: 1.2;
  padding-bottom: 2px;
}

/* 分隔白线 */
.cal-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.7);
  margin: 4px 0 5px;
}

.cal-anniversary-btn {
  font-size: 10px;
  color: #3D2B1F;
  opacity: 0.7;
  text-align: right;
  margin-top: 4px;
  cursor: pointer;
}

/* 宜忌 */
.cal-yiji {
  text-align: left;
}

.cal-yi-line,
.cal-ji-line {
  font-size: 8px;
  color: #3D2B1F;
  line-height: 1.5;
  display: flex;
  align-items: center;
  gap: 2px;
}

.cal-yi-line {
  color: #3D2B1F;
}

.cal-yi-line .cal-dot {
  background: #F26B8A;
}

.cal-ji-line {
  color: #3D2B1F;
  opacity: 1;
}

.cal-ji-line .cal-dot {
  background: #6BA0D6;
}

.cal-dot {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: #F26B8A;
  flex-shrink: 0;
}

.hero-top-label {
  font-size: 10px;
  color: #3D2B1F;
  opacity: 0.7;
  margin-bottom: 0;
}

.hero-countdown {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  padding: 12px 0;
}

.cd-unit {
  display: flex;
  flex-direction: column;
  align-items: center;
  background: rgba(255, 255, 255, 0.85);
  border-radius: 8px;
  padding: 8px 6px;
  min-width: 42px;
  box-shadow: 0 2px 6px rgba(242, 107, 138, 0.15);
  border: 1px solid rgba(242, 107, 138, 0.3);
}

.cd-value {
  font-size: 20px;
  font-weight: 800;
  color: #3D2B1F;
  line-height: 1;
  font-variant-numeric: tabular-nums;
}

.cd-label {
  font-size: 9px;
  color: #F26B8A;
  margin-top: 3px;
  font-weight: 600;
}

.hero-wedding-date {
  font-size: 10px;
  color: #F26B8A;
  opacity: 1;
}


/* ===== 婚礼当天 & 婚后内容布局 ===== */
.hero-wedding-day-content,
.hero-post-wedding-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 16px 0;
  text-align: center;
}

/* 婚礼当天特殊样式 */
.hero-wedding-day-content .wd-main {
  font-size: 30px;
  font-weight: 900;
  background: linear-gradient(135deg, #FFFFFF 0%, #FFE4E1 50%, #FFFFFF 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  text-shadow: none;
  filter: drop-shadow(0 3px 6px rgba(242, 107, 138, 0.4));
}

.hero-wedding-day-content .wd-sub {
  font-size: 14px;
  color: #FFF8F0;
}

.hero-wedding-day-content .wd-decor {
  font-size: 22px;
}

/* 婚礼完成后特殊样式 */
.hero-post-wedding-content {
  background: linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%);
  border-radius: 12px;
  padding: 14px 0;
  margin-top: 4px;
}

.hero-post-wedding-content .pw-main {
  font-size: 26px;
  font-weight: 800;
  color: #FFFFFF;
  filter: drop-shadow(0 3px 8px rgba(192, 160, 224, 0.5));
  letter-spacing: 1px;
}

.hero-post-wedding-content .pw-sub {
  font-size: 13px;
  color: #FFF5F8;
}

.hero-post-wedding-content .pw-decor {
  font-size: 20px;
}

/* 婚礼当天卡片背景微调 */
.v-if[weddingStatus='on'] .hero-cell-left,
.hero-cell-left:has(.hero-wedding-day-content) {
  background: rgba(255, 230, 235, 0.7);
}

/* 婚后卡片背景微调 */
.hero-cell-left:has(.hero-post-wedding-content) {
  background: rgba(240, 228, 255, 0.7);
}

.hero-location-tag {
  position: absolute;
  top: 12px;
  right: 16px;
  font-size: 9px;
  color: #FFFFFF;
  opacity: 0.85;
  background: rgba(242, 107, 138, 0.25);
  padding: 3px 10px;
  border-radius: 12px;
  border: 1px solid rgba(242, 107, 138, 0.4);
}

.hero-divider {
  height: 1px;
  background: rgba(255, 255, 255, 0.7);
  margin: 8px 0 5px;
}

/* 日历区域 */
/* ================================================
   3. 三列数据统计行
   ================================================ */
.stats-card {
  display: flex;
  align-items: stretch;
  background: #FDF2F8;
  border-radius: 20px;
  margin: 0 16px 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(242, 107, 138, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.9);
}

.stats-left,
.stats-mid {
  flex: 4;
}

.stats-right {
  flex: 2;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stats-divider {
  width: 1px;
  background: #FECDD3;
  margin: 0 12px;
}

.stats-label {
  font-size: 12px;
  color: #F26B8A;
  margin-bottom: 4px;
}

.stats-big-num {
  font-size: 24px;
  font-weight: 700;
  color: #D63384;
  line-height: 1.1;
  margin-bottom: 2px;
}

.stats-sub {
  font-size: 11px;
  color: #F9A8C4;
}

.btn-record {
  background: #F26B8A;
  color: #FFFFFF;
  border: 2px solid #F26B8A;
  border-radius: 50px;
  padding: 8px 16px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  white-space: nowrap;
  transition: opacity 0.15s;
}

.btn-record:active { opacity: 0.7; }

/* ================================================
   4. 最近待办模块
   ================================================ */

/* ===== 最近待办模块 ===== */
.todo-module {
  background: #FDF2F8;
  border-radius: 20px;
  margin: 0 16px 12px;
  padding: 16px;
  box-shadow: 0 4px 12px rgba(242, 107, 138, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.9);
}

.todo-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.todo-title {
  font-size: 15px;
  font-weight: 700;
  color: #2E2E2E;
  font-family: 'KaiTi', 'STKaiti', serif;
}

.todo-collapse {
  font-size: 14px;
  color: #999999;
  cursor: pointer;
}

.todo-card {
  display: flex;
  align-items: center;
  background: #FFFFFF;
  border-radius: 12px;
  padding: 13px 14px;
  margin-bottom: 8px;
  gap: 10px;
  cursor: pointer;
  border: 1px solid #FECDD3;
}

.todo-card:last-of-type { margin-bottom: 0; }

.todo-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: #F26B8A;
  flex-shrink: 0;
}

.todo-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.todo-card-left {
  font-size: 14px;
  font-weight: 600;
  color: #2E2E2E;
  font-family: 'KaiTi', 'STKaiti', serif;
}

.todo-card-mid {
  font-size: 12px;
  color: #999;
  line-height: 1.4;
  letter-spacing: 0.3px;
  font-family: 'KaiTi', 'STKaiti', serif;
}

.todo-card-right {
  font-size: 12px;
  color: #F26B8A;
  flex-shrink: 0;
  background: #FEF0F3;
  padding: 4px 12px;
  border-radius: 20px;
  white-space: nowrap;
  font-family: 'KaiTi', 'STKaiti', serif;
  flex-shrink: 0;
}

.todo-view-all {
  margin-top: 10px;
  font-size: 14px;
  color: #F26B8A;
  cursor: pointer;
}

/* ================================================
   5. 四宫格功能入口（2x2）
   ================================================ */
.grid-4 {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  margin: 0 16px 12px;
}

.grid-item {
  background: #FFFFFF;
  border-radius: 16px;
  padding: 18px 16px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  cursor: pointer;
  transition: transform 0.15s;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.grid-item:active { transform: scale(0.97); }

/* 左滑相册按钮 */
.swipe-album-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 72px;
  height: 100%;
  background: linear-gradient(135deg, #A855F7, #D4AF37);
  color: #fff;
  font-size: 12px;
  gap: 4px;
  cursor: pointer;
  border-radius: 16px;
}
.swipe-album-btn span:first-child { font-size: 22px; }

.grid-item-seating {
  background: #A0B8E8;
}

.grid-item-gifts {
  background: #E3C858;
}

.grid-item-invitations {
  background: #F88870;
}

.grid-item-diaries {
  background: #DC9EED;
}

.grid-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  gap: 18px;
}

.grid-title {
  font-size: 15px;
  font-weight: 700;
  color: #1A1A1A;
}

.grid-sub {
  font-size: 11px;
  color: #666;
}

/* 请帖卡片文字白色 */
.grid-item-invitations .grid-title,
.grid-item-invitations .grid-sub {
  color: #FFFFFF;
}

.grid-icon-box {
  width: 36px;
  height: 36px;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  flex-shrink: 0;
}

/* ===== 快捷操作浮动按钮 ===== */
.quick-actions {
  display: flex;
  gap: 12px;
  margin: 0 16px 12px;
  padding-bottom: 8px;
}

.quick-btn {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border-radius: 14px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.15s;
  font-family: 'KaiTi', 'STKaiti', serif;
}

.quick-btn:active { transform: scale(0.97); }

.quick-btn-gift {
  background: #FFF8E1;
  color: #B8860B;
}

.quick-btn-diary {
  background: #F0E6FF;
  color: #7B52AB;
}

.quick-icon {
  font-size: 18px;
}

.dialog-form {
  padding: 12px 8px;
}

/* ================================================
   6. 底部导航栏（固定底部）
   ================================================ */
.bottom-nav {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background: #FFFFFF;
  border-top: 1px solid #EEEEEE;
  display: flex;
  align-items: center;
  z-index: 100;
}

.nav-item {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 2px;
  cursor: pointer;
  position: relative;
  padding: 8px 0;
}

.nav-indicator {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  width: 20px;
  height: 3px;
  background: #F26B8A;
  border-radius: 0 0 2px 2px;
  display: block;
}

.nav-active .nav-indicator { display: block; }
.nav-item:not(.nav-active) .nav-indicator { display: none; }

.nav-icon {
  font-size: 22px;
  line-height: 1;
}

.nav-label {
  font-size: 11px;
  color: #999999;
}

.nav-active .nav-label {
  color: #F26B8A;
  font-weight: 600;
}

/* 装饰图案脉冲动画 */
@keyframes decorPulse {
  0%, 100% { transform: scale(1); opacity: 0.9; }
  50% { transform: scale(1.15); opacity: 1; }
}

.hero-wedding-day-content .wd-decor,
.hero-post-wedding-content .pw-decor {
  animation: decorPulse 2s ease-in-out infinite;
}

</style>

<style>
/* ===== 日记弹窗样式（非 scoped，因为 Vant dialog 用 teleport 渲染到 body） ===== */
.dialog-form { padding: 8px 16px; }
.dialog-form .van-cell { padding-left: 0; padding-right: 0; }

.upload-section {
  padding: 10px 16px;
}

.upload-label {
  font-size: 12px;
  color: #888;
  margin-bottom: 8px;
}

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
</style>
