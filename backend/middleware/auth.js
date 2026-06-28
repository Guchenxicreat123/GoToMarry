const jwt = require('jsonwebtoken');
const { verifyToken } = require('../models/authModel');

const JWT_SECRET = process.env.JWT_SECRET || 'goto-marry-default-secret';

/**
 * 鉴权中间件
 */
async function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader?.replace('Bearer ', '');

  if (!token) {
    return res.json({ code: 401, msg: '未登录', data: null });
  }

  try {
    // 验证 JWT 签名
    jwt.verify(token, JWT_SECRET);
    
    // 验证 token 是否在数据库中有效
    const isValid = await verifyToken(token);
    if (!isValid) {
      return res.json({ code: 401, msg: 'token 已失效', data: null });
    }
    
    next();
  } catch (err) {
    return res.json({ code: 401, msg: 'token 无效', data: null });
  }
}

module.exports = authMiddleware;
