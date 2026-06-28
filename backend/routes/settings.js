const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const settingController = require('../controllers/settingController');

// 所有路由需要鉴权
router.use(authMiddleware);

/**
 * GET /api/settings - 获取系统配置
 */
router.get('/', settingController.getSettings);

/**
 * PUT /api/settings - 更新系统配置
 */
router.put('/', settingController.updateSettings);

/**
 * POST /api/settings - 保存单条配置（key-value格式）
 */
router.post('/', settingController.saveSetting);

module.exports = router;
