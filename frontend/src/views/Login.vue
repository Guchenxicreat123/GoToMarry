<template>
  <div class="login-page">
    <div class="login-bg">
      <div class="login-card">
        <!-- 顶部装饰 -->
        <div class="card-decoration">
          <div class="ring-icon">💍</div>
          <h1>GoToMarry</h1>
          <p class="subtitle">记录我们婚礼筹备的每一步</p>
        </div>

        <!-- 表单 -->
        <van-form @submit="handleLogin" class="login-form">
          <div class="input-wrapper">
            <van-field
              v-model="pin"
              type="password"
              name="pin"
              placeholder="请输入你们的专属暗号"
              left-icon="lock"
              :rules="[{ required: true, message: '请输入暗号' }]"
              clearable
            />
          </div>

          <div class="hint-text">
            提示：暗号是你们的纪念日
          </div>

          <van-button
            round
            block
            type="primary"
            native-type="submit"
            :loading="loading"
            size="large"
            class="login-btn"
          >
            <span v-if="!loading">进入婚礼筹备</span>
            <span v-else>验证中...</span>
          </van-button>
        </van-form>

        <!-- 底部信息 -->
        <div class="card-footer">
          <div class="footer-line"></div>
          <p>💕 献给{{ brideName }} & {{ groomName }}</p>
        </div>
      </div>

      <!-- 错误提示 -->
      <transition name="fade">
        <div v-if="errorMessage" class="error-toast">
          <van-icon name="info-o" />
          <span>{{ errorMessage }}</span>
        </div>
      </transition>

      <!-- 底部装饰花瓣 -->
      <div class="petals">
        <span class="petal p1">🌸</span>
        <span class="petal p2">🌷</span>
        <span class="petal p3">🌹</span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const groomName = import.meta.env.VITE_GROOM_NAME || '新郎';
const brideName = import.meta.env.VITE_BRIDE_NAME || '新娘';
import { useRouter } from 'vue-router';
import { showToast } from 'vant';
import { useAuthStore } from '@/stores/auth';

const router = useRouter();
const authStore = useAuthStore();

const pin = ref('');
const loading = ref(false);
const errorMessage = ref('');

async function handleLogin() {
  if (!pin.value) {
    errorMessage.value = '请输入专属暗号';
    return;
  }

  loading.value = true;
  errorMessage.value = '';

  try {
    await authStore.login(pin.value);
    showToast('💍 欢迎回来');
    setTimeout(() => router.push('/'), 500);
  } catch (err) {
    errorMessage.value = err.message || '暗号错误，请重试';
  } finally {
    loading.value = false;
  }
}
</script>

<style scoped>
.login-page {
  min-height: 100vh;
  overflow: hidden;
}

.login-bg {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(180deg, #fdf2ef 0%, #f8e6e0 40%, #f5ede3 100%);
  padding: 24px;
  position: relative;
}

.login-card {
  width: 100%;
  max-width: 380px;
  background: rgba(255,255,255,0.95);
  backdrop-filter: blur(20px);
  border-radius: var(--radius-xl);
  padding: 40px 28px 30px;
  box-shadow: 0 8px 40px rgba(232,141,122,0.15);
  position: relative;
  z-index: 1;
}

.card-decoration {
  text-align: center;
  margin-bottom: 32px;
}

.ring-icon {
  font-size: 52px;
  margin-bottom: 12px;
  display: block;
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-6px); }
}

.card-decoration h1 {
  font-size: 26px;
  font-weight: 700;
  background: linear-gradient(135deg, #e88d7a, #d4a574);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: 6px;
}

.subtitle {
  font-size: 13px;
  color: var(--text-secondary);
  font-weight: 400;
}

.login-form {
  margin-top: 8px;
}

.input-wrapper {
  background: #f8f6f5;
  border-radius: var(--radius);
  padding: 2px;
}

.input-wrapper :deep(.van-cell) {
  background: transparent;
  border: 2px solid transparent;
  border-radius: var(--radius);
  transition: border-color 0.2s;
}

.input-wrapper :deep(.van-cell:focus-within) {
  border-color: var(--primary);
  background: #fff;
}

.input-wrapper :deep(.van-field__left-icon) {
  color: var(--primary);
}

.hint-text {
  text-align: center;
  font-size: 12px;
  color: var(--text-tertiary);
  margin: 12px 0 20px;
}

.login-btn {
  height: 48px;
  font-size: 16px;
  font-weight: 600;
  box-shadow: 0 4px 12px rgba(232,141,122,0.3);
  background: linear-gradient(135deg, #e88d7a, #d4a574) !important;
  border: none !important;
  transition: all 0.2s;
}

.login-btn:active {
  transform: scale(0.98);
  box-shadow: 0 2px 6px rgba(232,141,122,0.2);
}

.card-footer {
  margin-top: 28px;
  text-align: center;
}

.footer-line {
  width: 40px;
  height: 2px;
  background: linear-gradient(90deg, #e88d7a, #d4a574);
  margin: 0 auto 10px;
  border-radius: 2px;
}

.card-footer p {
  font-size: 12px;
  color: var(--text-tertiary);
  letter-spacing: 1px;
}

.error-toast {
  position: fixed;
  top: 60px;
  left: 50%;
  transform: translateX(-50%);
  background: #fff;
  color: var(--danger);
  padding: 10px 20px;
  border-radius: var(--radius);
  box-shadow: var(--shadow-lg);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  z-index: 100;
  border: 1px solid var(--danger-bg);
}

/* 装饰花瓣 */
.petals {
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 0;
}

.petal {
  position: absolute;
  font-size: 18px;
  opacity: 0.4;
}

.p1 { bottom: 0; right: 0; }
.p2 { bottom: 20px; right: 30px; font-size: 14px; }
.p3 { bottom: 40px; right: 10px; font-size: 12px; }

/* 动画 */
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}
.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

@media (max-width: 420px) {
  .login-card {
    padding: 30px 20px 24px;
  }
}
</style>
