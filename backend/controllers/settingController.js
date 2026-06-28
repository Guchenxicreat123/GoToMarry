const { success, error } = require('../utils/response');
const settingModel = require('../models/settingModel');

/**
 * 获取系统配置
 * GET /api/settings
 */
function getSettings(req, res) {
  try {
    const settings = settingModel.getSettings();
    success(res, settings);
  } catch (err) {
    console.error('获取系统配置失败:', err);
    error(res, '获取系统配置失败', 500);
  }
}

/**
 * 更新系统配置
 * PUT /api/settings
 */
function updateSettings(req, res) {
  try {
    const { weddingDate, brideName, groomName, budgetTotal } = req.body;
    
    const settings = settingModel.updateSettings({
      weddingDate,
      brideName,
      groomName,
      budgetTotal: budgetTotal ? Number(budgetTotal) : undefined
    });
    
    success(res, settings);
  } catch (err) {
    console.error('更新系统配置失败:', err);
    error(res, '更新系统配置失败', 500);
  }
}

/**
 * 保存单条配置（key-value格式）
 * POST /api/settings
 */
function saveSetting(req, res) {
  try {
    const { key, value } = req.body;
    if (!key) return error(res, '缺少key', 400);
    
    // 解析value（前台传的是JSON字符串，也可以直接传对象）
    const parsedValue = typeof value === 'string' ? value : JSON.stringify(value);
    
    const db = require('../config/database').getDatabase();
    db.run(
      `INSERT OR REPLACE INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))`,
      [key, parsedValue]
    );
    
    success(res, settingModel.getSettings());
  } catch (err) {
    console.error('保存配置失败:', err);
    error(res, '保存配置失败', 500);
  }
}

module.exports = {
  getSettings,
  updateSettings,
  saveSetting
};
