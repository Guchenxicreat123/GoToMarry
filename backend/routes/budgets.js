const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const budgetController = require('../controllers/budgetController');

// 所有路由需要鉴权
router.use(authMiddleware);

/** 注意：特殊路由必须放在参数路由之前 */

/**
 * GET /api/budgets/summary - 获取预算汇总
 */
router.get('/summary', budgetController.getBudgetSummary);

/**
 * GET /api/budgets/categories - 获取分类列表
 */
router.get('/categories', budgetController.getCategories);

/**
 * GET /api/budgets - 获取预算列表
 */
router.get('/', budgetController.getBudgets);

/**
 * GET /api/budgets/:id - 获取单个预算项
 */
router.get('/:id', budgetController.getBudgetById);

/**
 * POST /api/budgets - 新增预算项
 */
router.post('/', budgetController.createBudget);

/**
 * PUT /api/budgets/:id - 更新预算项
 */
router.put('/:id', budgetController.updateBudget);

/**
 * DELETE /api/budgets/:id - 删除预算项
 */
router.delete('/:id', budgetController.deleteBudget);

module.exports = router;
