const { success, error } = require('../utils/response');
const giftModel = require('../models/giftModel');

function getGifts(req, res) {
  try {
    const { side, guest_name } = req.query;
    const filters = {};
    if (side) filters.side = side;
    if (guest_name) filters.guest_name = guest_name;
    success(res, giftModel.getGifts(filters));
  } catch (err) {
    console.error('获取礼金列表失败:', err);
    error(res, '获取礼金列表失败', 500);
  }
}

function getGiftById(req, res) {
  try {
    const gift = giftModel.getGiftById(parseInt(req.params.id));
    if (!gift) return error(res, '礼金记录不存在', 404);
    success(res, gift);
  } catch (err) {
    error(res, '获取礼金失败', 500);
  }
}

function createGift(req, res) {
  try {
    const { guestName, amount, giftType, occasion, dateGiven, side, notes } = req.body;
    if (!guestName || amount === undefined) return error(res, 'guestName 和 amount 为必填字段', 400);
    const gift = giftModel.createGift({ guestName, amount: Number(amount), giftType, occasion, dateGiven, side, notes });
    success(res, gift, '礼金记录创建成功', 201);
  } catch (err) {
    console.error('创建礼金失败:', err);
    error(res, '创建礼金失败', 500);
  }
}

function updateGift(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!giftModel.getGiftById(id)) return error(res, '礼金记录不存在', 404);
    const { guestName, amount, giftType, occasion, dateGiven, side, notes } = req.body;
    const updated = giftModel.updateGift(id, { guestName, amount: amount !== undefined ? Number(amount) : undefined, giftType, occasion, dateGiven, side, notes });
    success(res, updated);
  } catch (err) {
    error(res, '更新礼金失败', 500);
  }
}

function deleteGift(req, res) {
  try {
    const id = parseInt(req.params.id);
    if (!giftModel.getGiftById(id)) return error(res, '礼金记录不存在', 404);
    giftModel.deleteGift(id);
    success(res, null);
  } catch (err) {
    error(res, '删除礼金失败', 500);
  }
}

function getGiftSummary(req, res) {
  try {
    success(res, giftModel.getGiftSummary());
  } catch (err) {
    error(res, '获取礼金汇总失败', 500);
  }
}

function exportGifts(req, res) {
  try {
    const gifts = giftModel.getGifts({});
    const fs = require('fs');
    const path = require('path');
    
    // 构建 CSV 内容
    const header = '序号,宾客姓名,金额,类型,场合,日期,关系方,备注,记录时间\n';
    const rows = gifts.map((g, i) => {
      const side = g.side === 'groom' ? '男方' : g.side === 'bride' ? '女方' : g.side || '';
      return `${i + 1},${g.guest_name || ''},${g.amount || 0},${g.gift_type || ''},${g.occasion || ''},${g.date_given || ''},${side},${g.notes || ''},${g.created_at || ''}`;
    }).join('\n');
    
    const csv = '\uFEFF' + header + rows; // BOM for Excel
    const filePath = path.join('/app/project', '礼金记录.csv');
    fs.writeFileSync(filePath, csv, 'utf8');
    
    success(res, { path: filePath, count: gifts.length });
  } catch (err) {
    console.error('导出礼金记录失败:', err);
    error(res, '导出失败: ' + err.message, 500);
  }
}

module.exports = { getGifts, getGiftById, createGift, updateGift, deleteGift, getGiftSummary, exportGifts };
