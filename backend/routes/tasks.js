const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const taskController = require('../controllers/taskController');

// 所有路由需要鉴权
router.use(authMiddleware);

/**
 * GET /api/tasks - 获取任务列表
 */
router.get('/', taskController.getTasks);

/**
 * GET /api/tasks/:id - 获取单个任务
 */
router.get('/:id', taskController.getTaskById);

/**
 * POST /api/tasks - 新建任务
 */
router.post('/', taskController.createTask);

/**
 * PUT /api/tasks/:id - 更新任务
 */
router.put('/:id', taskController.updateTask);

/**
 * DELETE /api/tasks/:id - 删除任务
 */
router.delete('/:id', taskController.deleteTask);

/**
 * PUT /api/tasks/:id/toggle - 切换完成状态
 */
router.put('/:id/toggle', taskController.toggleTask);

module.exports = router;
