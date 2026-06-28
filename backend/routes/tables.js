const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const tableController = require('../controllers/tableController');

// 所有路由需要鉴权
router.use(authMiddleware);

/**
 * GET /api/tables - 获取桌台列表
 */
router.get('/', tableController.getTables);

/**
 * GET /api/tables/:id - 获取单个桌台
 */
router.get('/:id', tableController.getTableById);

/**
 * POST /api/tables - 新增桌台
 */
router.post('/', tableController.createTable);

/**
 * PUT /api/tables/:id - 更新桌台
 */
router.put('/:id', tableController.updateTable);

/**
 * DELETE /api/tables/:id - 删除桌台
 */
router.delete('/:id', tableController.deleteTable);

/**
 * PUT /api/tables/:id/assign - 分配宾客到桌台
 */
router.put('/:id/assign', tableController.assignGuests);

module.exports = router;
