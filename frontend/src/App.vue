<template>
  <router-view />
</template>

<script setup>
</script>

<style>
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;700&display=swap');

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans SC', -apple-system, BlinkMacSystemFont, sans-serif;
  background: var(--bg-page);
  color: var(--text-primary);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

/* 隐藏滚动条 */
::-webkit-scrollbar { width: 0; height: 0; }

/* 页面容器通用 */
.page-content {
  padding: var(--space-lg);
  padding-bottom: 80px;
}

/* 卡片容器 */
.card-group {
  margin-bottom: var(--space-lg);
}

.card-group .van-cell-group {
  border-radius: var(--radius);
  overflow: hidden;
  box-shadow: var(--shadow-card);
}

/* 标题分段 */
.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin: var(--space-xl) 0 var(--space-md);
  padding: 0 var(--space-xs);
}

.section-header h3 {
  font-size: var(--font-lg);
  font-weight: 600;
  color: var(--text-primary);
  display: flex;
  align-items: center;
  gap: 6px;
}

.section-header .more {
  font-size: var(--font-sm);
  color: var(--primary);
}

/* 数值高亮 */
.num-highlight {
  font-size: var(--font-xxl);
  font-weight: 700;
  color: var(--primary);
}

.num-highlight.success { color: var(--success); }
.num-highlight.warning { color: var(--warning); }
.num-highlight.danger { color: var(--danger); }
.num-highlight.info { color: var(--info); }

/* 标签样式 */
.tag-soft {
  display: inline-flex;
  align-items: center;
  padding: 2px 10px;
  border-radius: 20px;
  font-size: var(--font-xs);
  font-weight: 500;
}

.tag-soft.primary { background: var(--primary-light); color: var(--primary-dark); }
.tag-soft.success { background: var(--success-bg); color: var(--success); }
.tag-soft.danger { background: var(--danger-bg); color: var(--danger); }
.tag-soft.gold { background: var(--gold-light); color: var(--gold); }
.tag-soft.info { background: var(--info-bg); color: var(--info); }

/* 空状态 */
.van-empty {
  padding: 40px 0;
}

/* 表单页通用 */
.form-page {
  min-height: 100vh;
  background: var(--bg-page);
}

.form-page .form-body {
  padding: var(--space-lg);
}

.form-page .form-body .van-cell-group {
  border-radius: var(--radius);
  overflow: hidden;
}

.form-submit {
  margin-top: var(--space-xl);
  padding: 0 var(--space-lg);
}
</style>
