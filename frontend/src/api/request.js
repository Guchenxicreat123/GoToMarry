import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const request = axios.create({
  baseURL: API_BASE,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    const { code, msg, data } = response.data;
    
    if (code === 200 || code === 201) {
      return data;
    }
    
    // 未授权：跳转登录
    if (code === 401) {
      localStorage.removeItem('token');
      window.location.href = '/#/login';
      return Promise.reject(new Error(msg || '未授权'));
    }
    
    // 其他错误
    return Promise.reject(new Error(msg || '请求失败'));
  },
  (error) => {
    const msg = error.response?.data?.msg || error.message || '网络错误';
    return Promise.reject(new Error(msg));
  }
);

export default request;
