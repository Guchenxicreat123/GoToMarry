const { success, error } = require('../utils/response');
const tableModel = require('../models/tableModel');

/**
 * 获取桌台列表
 * GET /api/tables
 */
function getTables(req, res) {
  try {
    const tables = tableModel.getTables();
    success(res, tables);
  } catch (err) {
    console.error('获取桌台列表失败:', err);
    error(res, '获取桌台列表失败', 500);
  }
}

/**
 * 获取单个桌台
 * GET /api/tables/:id
 */
function getTableById(req, res) {
  try {
    const table = tableModel.getTableById(parseInt(req.params.id));
    
    if (!table) {
      return error(res, '桌台不存在', 404);
    }
    
    success(res, table);
  } catch (err) {
    console.error('获取桌台失败:', err);
    error(res, '获取桌台失败', 500);
  }
}

/**
 * 新增桌台
 * POST /api/tables
 */
function createTable(req, res) {
  try {
    const { name, capacity, location } = req.body;
    
    // 必填字段验证
    if (!name) {
      return error(res, 'name 为必填字段', 400);
    }
    
    const table = tableModel.createTable({
      name,
      capacity: Number(capacity) || 10,
      location
    });
    
    success(res, table, '桌台创建成功', 201);
  } catch (err) {
    console.error('创建桌台失败:', err);
    error(res, '创建桌台失败', 500);
  }
}

/**
 * 更新桌台
 * PUT /api/tables/:id
 */
function updateTable(req, res) {
  try {
    const id = parseInt(req.params.id);
    const table = tableModel.getTableById(id);
    
    if (!table) {
      return error(res, '桌台不存在', 404);
    }
    
    const { name, capacity, location } = req.body;
    const updated = tableModel.updateTable(id, {
      name,
      capacity: capacity !== undefined ? Number(capacity) : undefined,
      location
    });
    
    success(res, updated);
  } catch (err) {
    console.error('更新桌台失败:', err);
    error(res, '更新桌台失败', 500);
  }
}

/**
 * 删除桌台
 * DELETE /api/tables/:id
 */
function deleteTable(req, res) {
  try {
    const id = parseInt(req.params.id);
    const table = tableModel.getTableById(id);
    
    if (!table) {
      return error(res, '桌台不存在', 404);
    }
    
    tableModel.deleteTable(id);
    success(res, null);
  } catch (err) {
    console.error('删除桌台失败:', err);
    error(res, '删除桌台失败', 500);
  }
}

/**
 * 为桌台分配宾客
 * PUT /api/tables/:id/assign
 */
function assignGuests(req, res) {
  try {
    const id = parseInt(req.params.id);
    const { guestIds } = req.body;
    
    if (!Array.isArray(guestIds) || guestIds.length === 0) {
      return error(res, 'guestIds 必须是非空数组', 400);
    }
    
    const table = tableModel.assignGuestsToTable(id, guestIds.map(id => parseInt(id)));
    success(res, table);
  } catch (err) {
    console.error('分配宾客失败:', err);
    error(res, '分配宾客失败', 500);
  }
}

module.exports = {
  getTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  assignGuests
};
