<template>
  <div class="invitation-page">
    <van-nav-bar title="💌 请帖" left-text="返回" left-arrow @click-left="$router.back()" />

    <div class="page-content">
      <div class="invite-card">
        <div class="ic-emoji">💌</div>
        <h2>电子请帖</h2>
        <p class="ic-desc">向亲友发送你们的婚礼邀请</p>

        <div class="ic-info">
          <div class="ic-row">
            <span class="ic-label">新郎</span>
    <span class="ic-value">{{ groomName }}</span>
          </div>
          <div class="ic-row">
            <span class="ic-label">新娘</span>
            <span class="ic-value">{{ brideName }}</span>
          </div>
          <div class="ic-row">
            <span class="ic-label">婚期</span>
            <span class="ic-value">{{ weddingDateDisplay }}</span>
          </div>
          <div class="ic-row">
            <span class="ic-label">地点</span>
            <span class="ic-value">待定</span>
          </div>
        </div>

        <div class="ic-action">
          <van-button round block type="primary" disabled>制作请帖（即将上线）</van-button>
        </div>
        <p class="ic-hint">✨ 请帖制作功能正在开发中，敬请期待</p>
      </div>
    </div>
  </div>
</template>

<script setup>
const groomName = import.meta.env.VITE_GROOM_NAME || '新郎';
const brideName = import.meta.env.VITE_BRIDE_NAME || '新娘';
const weddingDateDisplay = (() => {
  const d = import.meta.env.VITE_WEDDING_DATE;
  if (!d) return 'YYYY年MM月DD日';
  const date = new Date(d);
  const weekdays = ['星期日','星期一','星期二','星期三','星期四','星期五','星期六'];
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const day = date.getDate();
  const w = weekdays[date.getDay()];
  return `${y}年${m}月${day}日 · ${w}`;
})();
</script>

<style scoped>
.invitation-page { min-height: 100vh; background: var(--bg-page); }

.invite-card {
  background: #fff; border-radius: var(--radius-lg); padding: 32px 24px;
  text-align: center; box-shadow: var(--shadow-card);
  border: 1px solid var(--border-light);
  margin-top: 20px;
}

.ic-emoji { font-size: 48px; margin-bottom: 12px; }
h2 { font-size: 20px; font-weight: 700; color: var(--text-primary); margin-bottom: 6px; }
.ic-desc { font-size: 13px; color: var(--text-secondary); margin-bottom: 24px; }

.ic-info { text-align: left; margin-bottom: 24px; }
.ic-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid var(--border); }
.ic-label { font-size: 13px; color: var(--text-tertiary); }
.ic-value { font-size: 14px; color: var(--text-primary); font-weight: 500; }

.ic-action { margin-bottom: 12px; }
.ic-hint { font-size: 12px; color: var(--text-tertiary); }
</style>
