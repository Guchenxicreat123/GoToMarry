const { success, error } = require('../utils/response');
const budgetModel = require('../models/budgetModel');

/**
 * 获取预算列表
 * GET /api/budgets
 */
function getBudgets(req, res) {
  try {
    const { category, isPaid, keyword } = req.query;
    const filters = {};
    
    if (category) filters.category = category;
    if (isPaid !== undefined) filters.isPaid = isPaid === '1' || isPaid === 'true';
    if (keyword) filters.keyword = keyword;
    
    const budgets = budgetModel.getBudgets(filters);
    success(res, budgets);
  } catch (err) {
    console.error('获取预算列表失败:', err);
    error(res, '获取预算列表失败', 500);
  }
}

/**
 * 获取单个预算项
 * GET /api/budgets/:id
 */
function getBudgetById(req, res) {
  try {
    const budget = budgetModel.getBudgetById(parseInt(req.params.id));
    
    if (!budget) {
      return error(res, '预算项不存在', 404);
    }
    
    success(res, budget);
  } catch (err) {
    console.error('获取预算项失败:', err);
    error(res, '获取预算项失败', 500);
  }
}

/**
 * 获取预算汇总
 * GET /api/budgets/summary
 */
function getBudgetSummary(req, res) {
  try {
    const summary = budgetModel.getBudgetSummary();
    success(res, summary);
  } catch (err) {
    console.error('获取预算汇总失败:', err);
    error(res, '获取预算汇总失败', 500);
  }
}

/**
 * 获取分类列表
 * GET /api/budgets/categories
 */
function getCategories(req, res) {
  try {
    const categories = budgetModel.getCategories();
    success(res, categories);
  } catch (err) {
    console.error('获取分类列表失败:', err);
    error(res, '获取分类列表失败', 500);
  }
}

/**
 * 新增预算项
 * POST /api/budgets
 */
function createBudget(req, res) {
  try {
    const { category, subCategory, itemName, estimatedAmount, actualAmount, isPaid, paidDate, vendor, remark } = req.body;
    
    // 必填字段验证
    if (!category || !itemName) {
      return error(res, 'category 和 itemName 为必填字段', 400);
    }
    
    const budget = budgetModel.createBudget({
      category,
      subCategory,
      itemName,
      estimatedAmount: Number(estimatedAmount) || 0,
      actualAmount: Number(actualAmount) || 0,
      isPaid: isPaid ? 1 : 0,
      paidDate,
      vendor,
      remark
    });
    
    success(res, budget, '预算项创建成功', 201);
  } catch (err) {
    console.error('创建预算项失败:', err);
    error(res, '创建预算项失败', 500);
  }
}

/**
 * 更新预算项
 * PUT /api/budgets/:id
 */
function updateBudget(req, res) {
  try {
    const id = parseInt(req.params.id);
    const budget = budgetModel.getBudgetById(id);
    
    if (!budget) {
      return error(res, '预算项不存在', 404);
    }
    
    const { category, subCategory, itemName, estimatedAmount, actualAmount, isPaid, paidDate, vendor, remark } = req.body;
    const updated = budgetModel.updateBudget(id, {
      category,
      subCategory,
      itemName,
      estimatedAmount: estimatedAmount !== undefined ? Number(estimatedAmount) : undefined,
      actualAmount: actualAmount !== undefined ? Number(actualAmount) : undefined,
      isPaid,
      paidDate,
      vendor,
      remark
    });
    
    success(res, updated);
  } catch (err) {
    console.error('更新预算项失败:', err);
    error(res, '更新预算项失败', 500);
  }
}

/**
 * 删除预算项
 * DELETE /api/budgets/:id
 */
function deleteBudget(req, res) {
  try {
    const id = parseInt(req.params.id);
    const budget = budgetModel.getBudgetById(id);
    
    if (!budget) {
      return error(res, '预算项不存在', 404);
    }
    
    budgetModel.deleteBudget(id);
    success(res, null);
  } catch (err) {
    console.error('删除预算项失败:', err);
    error(res, '删除预算项失败', 500);
  }
}

module.exports = {
  getBudgets,
  getBudgetById,
  getBudgetSummary,
  getCategories,
  createBudget,
  updateBudget,
  deleteBudget
};
