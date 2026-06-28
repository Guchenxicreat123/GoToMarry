const jwt = require('jsonwebtoken');
const { getDatabase } = require('../config/database');

const JWT_SECRET = process.env.JWT_SECRET || 'goto-marry-default-secret';
const TOKEN_EXPIRES_IN = '30d';

/**
 * 生成 Token
 */
function generateToken() {
  return jwt.sign({}, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

/**
 * 验证 Token 有效性
 */
function verifyToken(token) {
  const db = getDatabase();
  const result = db.exec(`SELECT id, expires_at FROM auth_tokens WHERE token = '${token}'`);
  
  if (result.length === 0 || result[0].values.length === 0) return false;
  
  const expiresAt = new Date(result[0].values[0][1]);
  return expiresAt > new Date();
}

/**
 * 存储 Token
 */
function storeToken(token) {
  const db = getDatabase();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + 30);
  const createdAt = new Date().toISOString();
  
  // 先删除旧 token（如果有）
  db.run('DELETE FROM auth_tokens WHERE token = ?', [token]);
  // 插入新 token
  db.run('INSERT INTO auth_tokens (token, expires_at, created_at) VALUES (?, ?, ?)', 
    [token, expiresAt.toISOString(), createdAt]);
  
  return expiresAt;
}

/**
 * 删除 Token
 */
function deleteToken(token) {
  const db = getDatabase();
  db.run('DELETE FROM auth_tokens WHERE token = ?', [token]);
}

/**
 * 校验 PIN 码
 */
function verifyPin(pin) {
  const correctPin = process.env.PIN_CODE || '123456';
  return pin === correctPin;
}

module.exports = {
  generateToken,
  verifyToken,
  storeToken,
  deleteToken,
  verifyPin,
  JWT_SECRET
};
