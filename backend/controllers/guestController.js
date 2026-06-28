const { success, error } = require('../utils/response');
const guestModel = require('../models/guestModel');

/**
 * 获取宾客列表
 * GET /api/guests
 */
function getGuests(req, res) {
  try {
    const { side, relation, isConfirmed, tableId, keyword } = req.query;
    const filters = {};
    
    if (side) filters.side = side;
    if (relation) filters.relation = relation;
    if (isConfirmed !== undefined) filters.isConfirmed = isConfirmed === '1' || isConfirmed === 'true';
    if (tableId) filters.tableId = parseInt(tableId);
    if (keyword) filters.keyword = keyword;
    
    const guests = guestModel.getGuests(filters);
    success(res, guests);
  } catch (err) {
    console.error('获取宾客列表失败:', err);
    error(res, '获取宾客列表失败', 500);
  }
}

/**
 * 获取单个宾客
 * GET /api/guests/:id
 */
function getGuestById(req, res) {
  try {
    const guest = guestModel.getGuestById(parseInt(req.params.id));
    
    if (!guest) {
      return error(res, '宾客不存在', 404);
    }
    
    success(res, guest);
  } catch (err) {
    console.error('获取宾客失败:', err);
    error(res, '获取宾客失败', 500);
  }
}

/**
 * 获取宾客汇总
 * GET /api/guests/summary
 */
function getGuestSummary(req, res) {
  try {
    const summary = guestModel.getGuestSummary();
    success(res, summary);
  } catch (err) {
    console.error('获取宾客汇总失败:', err);
    error(res, '获取宾客汇总失败', 500);
  }
}

/**
 * 新增宾客
 * POST /api/guests
 */
function createGuest(req, res) {
  try {
    const { name, side, relation, phone, attendCount, isInvited, isConfirmed, tableId, remark, giftAmount } = req.body;
    
    // 必填字段验证
    if (!name || !side) {
      return error(res, 'name 和 side 为必填字段', 400);
    }
    
    const guest = guestModel.createGuest({
      name,
      side,
      relation,
      phone,
      attendCount: Number(attendCount) || 1,
      isInvited,
      isConfirmed,
      tableId: tableId ? parseInt(tableId) : null,
      remark,
      giftAmount: Number(giftAmount) || 0
    });
    
    success(res, guest, '宾客添加成功', 201);
  } catch (err) {
    console.error('添加宾客失败:', err);
    error(res, '添加宾客失败', 500);
  }
}

/**
 * 批量导入宾客
 * POST /api/guests/batch
 */
function createGuestsBatch(req, res) {
  try {
    const { items } = req.body;
    
    if (!Array.isArray(items) || items.length === 0) {
      return error(res, 'items 必须是非空数组', 400);
    }
    
    // 验证必填字段
    for (const item of items) {
      if (!item.name || !item.side) {
        return error(res, `宾客 "${item.name || '未知'}" 缺少必填字段 name 或 side`, 400);
      }
    }
    
    const guests = guestModel.createGuestsBatch(items);
    success(res, { count: items.length, guests }, '批量导入成功', 201);
  } catch (err) {
    console.error('批量导入宾客失败:', err);
    error(res, '批量导入宾客失败', 500);
  }
}

/**
 * 更新宾客
 * PUT /api/guests/:id
 */
function updateGuest(req, res) {
  try {
    const id = parseInt(req.params.id);
    const guest = guestModel.getGuestById(id);
    
    if (!guest) {
      return error(res, '宾客不存在', 404);
    }
    
    const { name, side, relation, phone, attendCount, isInvited, isConfirmed, tableId, remark, giftAmount } = req.body;
    const updated = guestModel.updateGuest(id, {
      name,
      side,
      relation,
      phone,
      attendCount: attendCount !== undefined ? Number(attendCount) : undefined,
      isInvited,
      isConfirmed,
      tableId: tableId !== undefined ? (tableId ? parseInt(tableId) : null) : undefined,
      remark,
      giftAmount: giftAmount !== undefined ? Number(giftAmount) : undefined
    });
    
    success(res, updated);
  } catch (err) {
    console.error('更新宾客失败:', err);
    error(res, '更新宾客失败', 500);
  }
}

/**
 * 删除宾客
 * DELETE /api/guests/:id
 */
function exportGuests(req, res) {
  try {
    const guests = guestModel.getGuests({});
    const fs = require('fs');
    const path = require('path');
    
    // 构建 CSV 内容
    const header = '序号,姓名,关系,电话,亲友方,出席人数,已发请帖,确认出席,桌号,备注,创建时间\n';
    const rows = guests.map((g, i) => {
      const side = g.side === 'groom' ? '男方' : g.side === 'bride' ? '女方' : g.side || '';
      return `${i + 1},${g.name || ''},${g.relation || ''},${g.phone || ''},${side},${g.attend_count || 1},${g.is_invited ? '是' : '否'},${g.is_confirmed ? '是' : '否'},${g.table_name || ''},${g.remark || ''},${g.created_at || ''}`;
    }).join('\n');
    
    const csv = '\uFEFF' + header + rows; // BOM for Excel
    const filePath = path.join('/app/project', '宾客名单.csv');
    fs.writeFileSync(filePath, csv, 'utf8');
    
    success(res, { path: filePath, count: guests.length });
  } catch (err) {
    console.error('导出宾客名单失败:', err);
    error(res, '导出失败: ' + err.message, 500);
  }
}

function deleteGuest(req, res) {
  try {
    const id = parseInt(req.params.id);
    const guest = guestModel.getGuestById(id);
    
    if (!guest) {
      return error(res, '宾客不存在', 404);
    }
    
    guestModel.deleteGuest(id);
    success(res, null);
  } catch (err) {
    console.error('删除宾客失败:', err);
    error(res, '删除宾客失败', 500);
  }
}

module.exports = {
  getGuests,
  getGuestById,
  getGuestSummary,
  createGuest,
  createGuestsBatch,
  updateGuest,
  exportGuests,
  deleteGuest
};
