const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const anniversaryModel = require('../models/anniversaryModel');

// 纪念日图片目录（与 server.js 保持一致）
const ANNIVERSARY_IMG_DIR = path.join(__dirname, '..', 'data', 'anniversary-images');

function ensureImgDir() {
  if (!fs.existsSync(ANNIVERSARY_IMG_DIR)) {
    fs.mkdirSync(ANNIVERSARY_IMG_DIR, { recursive: true });
  }
}

// 保存 base64 图片，返回文件名
function saveBase64Image(base64Str) {
  if (!base64Str || !base64Str.startsWith('data:image/')) return '';
  ensureImgDir();
  const matches = base64Str.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) return '';
  const ext = matches[1];
  const data = Buffer.from(matches[2], 'base64');
  const name = crypto.randomBytes(12).toString('hex') + '.' + ext;
  fs.writeFileSync(path.join(ANNIVERSARY_IMG_DIR, name), data);
  return name;
}

async function list(req, res) {
  try {
    const anniversaries = anniversaryModel.getAll();
    res.json({ code: 200, data: anniversaries });
  } catch (err) {
    console.error('获取纪念日列表失败', err);
    res.status(500).json({ code: 500, msg: 'failed' });
  }
}

async function create(req, res) {
  try {
    const { title, date, type, note, image } = req.body;
    if (!title || !date) {
      return res.status(400).json({ code: 400, msg: 'title and date required' });
    }
    let imageFilename = '';
    if (image && image.startsWith('data:image/')) {
      imageFilename = saveBase64Image(image);
    }
    const anniversary = anniversaryModel.create({ title, date, type, note, image: imageFilename });
    res.json({ code: 200, data: anniversary });
  } catch (err) {
    console.error('创建纪念日失败', err);
    res.status(500).json({ code: 500, msg: 'failed' });
  }
}

async function update(req, res) {
  try {
    const { id } = req.params;
    const { title, date, type, note, image } = req.body;
    const existing = anniversaryModel.getById(Number(id));
    if (!existing) {
      return res.status(404).json({ code: 404, msg: 'not found' });
    }
    let imageFilename = existing.image || '';
    if (image === null) {
      // 清空图片
      if (existing.image) {
        const oldPath = path.join(ANNIVERSARY_IMG_DIR, existing.image);
        try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (e) {}
      }
      imageFilename = '';
    } else if (image && image.startsWith('data:image/')) {
      // 删除旧图片
      if (existing.image) {
        const oldPath = path.join(ANNIVERSARY_IMG_DIR, existing.image);
        try { if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath); } catch (e) {}
      }
      imageFilename = saveBase64Image(image);
    }
    const updated = anniversaryModel.update(Number(id), { title, date, type, note, image: imageFilename });
    res.json({ code: 200, data: updated });
  } catch (err) {
    console.error('更新纪念日失败', err);
    res.status(500).json({ code: 500, msg: 'failed' });
  }
}

async function remove(req, res) {
  try {
    const { id } = req.params;
    const existing = anniversaryModel.getById(Number(id));
    if (!existing) {
      return res.status(404).json({ code: 404, msg: 'not found' });
    }
    anniversaryModel.remove(Number(id));
    res.json({ code: 200, msg: 'deleted' });
  } catch (err) {
    console.error('删除纪念日失败', err);
    res.status(500).json({ code: 500, msg: 'failed' });
  }
}

module.exports = { list, create, update, remove };