import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import { loginApi, logoutApi, verifyApi } from '@/api/auth';

export const useAuthStore = defineStore('auth', () => {
  const isAuthenticated = computed(() => !!localStorage.getItem('token'));

  async function login(pin) {
    const data = await loginApi(pin);
    localStorage.setItem('token', data.token);
    localStorage.setItem('tokenExpiresAt', data.expiresAt);
    return data;
  }

  async function logout() {
    const token = localStorage.getItem('token');
    await logoutApi(token);
    localStorage.removeItem('token');
    localStorage.removeItem('tokenExpiresAt');
  }

  async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) return false;
    
    try {
      const data = await verifyApi();
      return data.valid;
    } catch {
      return false;
    }
  }

  return { isAuthenticated, login, logout, checkAuth };
});
