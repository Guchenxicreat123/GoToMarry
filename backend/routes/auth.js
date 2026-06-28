const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

/**
 * POST /api/auth/login - 登录
 */
router.post('/login', authController.login);

/**
 * POST /api/auth/logout - 登出
 */
router.post('/logout', authController.logout);

/**
 * GET /api/auth/verify - 验证 token
 */
router.get('/verify', authController.verify);

module.exports = router;
