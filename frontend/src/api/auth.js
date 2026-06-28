import request from './request';

/**
 * 登录
 */
export function loginApi(pin) {
  return request.post('/auth/login', { pin });
}

/**
 * 登出
 */
export function logoutApi(token) {
  return request.post('/auth/logout', { token });
}

/**
 * 验证 Token
 */
export function verifyApi() {
  return request.get('/auth/verify');
}
