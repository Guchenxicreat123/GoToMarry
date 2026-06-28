const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const guestController = require('../controllers/guestController');

// 所有路由需要鉴权
router.use(authMiddleware);

/** 注意：特殊路由必须放在参数路由之前 */

/**
 * GET /api/guests/summary - 获取宾客汇总
 */
router.get('/summary', guestController.getGuestSummary);

/**
 * GET /api/guests - 获取宾客列表
 */
router.get('/', guestController.getGuests);

/**
 * GET /api/guests/export - 导出宾客名单
 */
router.get('/export', guestController.exportGuests);

/**
 * GET /api/guests/:id - 获取单个宾客
 */
router.get('/:id', guestController.getGuestById);

/**
 * POST /api/guests - 新增宾客
 */
router.post('/', guestController.createGuest);

/**
 * POST /api/guests/batch - 批量导入宾客
 */
router.post('/batch', guestController.createGuestsBatch);

/**
 * PUT /api/guests/:id - 更新宾客
 */
router.put('/:id', guestController.updateGuest);


/**
 * DELETE /api/guests/:id - 删除宾客
 */
router.delete('/:id', guestController.deleteGuest);

module.exports = router;
