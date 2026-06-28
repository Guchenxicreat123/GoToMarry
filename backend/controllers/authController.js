const { success, error } = require('../utils/response');
const { generateToken, storeToken, deleteToken, verifyPin } = require('../models/authModel');

/**
 * 登录
 * POST /api/auth/login
 */
async function login(req, res) {
  try {
    const { pin } = req.body;

    if (!pin) {
      return error(res, '请输入暗号', 400);
    }

    if (!verifyPin(pin)) {
      return error(res, '暗号错误', 401);
    }

    const token = generateToken();
    const expiresAt = await storeToken(token);

    success(res, {
      token,
      expiresIn: 30 * 24 * 60 * 60, // 30 天（秒）
      expiresAt
    });
  } catch (err) {
    console.error('登录失败:', err);
    error(res, '登录失败', 500);
  }
}

/**
 * 登出
 * POST /api/auth/logout
 */
async function logout(req, res) {
  try {
    const { token } = req.body;
    
    if (token) {
      await deleteToken(token);
    }
    
    success(res, null);
  } catch (err) {
    console.error('登出失败:', err);
    error(res, '登出失败', 500);
  }
}

/**
 * 验证 Token
 * GET /api/auth/verify
 */
async function verify(req, res) {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return error(res, '未提供 token', 401);
    }

    const isValid = await verifyToken(token);
    
    success(res, {
      valid: isValid,
      expiresAt: isValid ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() : null
    });
  } catch (err) {
    console.error('验证失败:', err);
    error(res, '验证失败', 500);
  }
}

module.exports = {
  login,
  logout,
  verify
};
