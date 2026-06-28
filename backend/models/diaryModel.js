const { getDatabase } = require('../config/database');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

const DATA_DIR = path.join(__dirname, '../data');
const IMG_DIR = path.join(DATA_DIR, 'diary-images');

// 确保图片目录存在
function ensureImgDir() {
  if (!fs.existsSync(IMG_DIR)) fs.mkdirSync(IMG_DIR, { recursive: true });
}

/**
 * 兼容旧数据：images 字段可能是：
 *   - JSON 数组 ["file1.jpg", ...]        → 新格式（文件路径）
 *   - JSON 数组 [base64字符串, ...]       → 旧格式（纯 base64，需迁移）
 *   - 空字符串 / null / undefined         → 无图片
 * 返回 { imageFilenames: string[], migrated: boolean }
 */
function parseImagesField(raw) {
  if (!raw) return { imageFilenames: [], migrated: false };
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      // 判断是文件路径数组还是 base64 数组
      const first = parsed[0];
      if (typeof first === 'string' && (first.startsWith('/') || first.startsWith('data:'))) {
        // 旧格式 base64，需要迁移
        return { imageFilenames: parsed, migrated: true, isBase64: true };
      } else if (typeof first === 'string') {
        // 新格式文件路径
        return { imageFilenames: parsed, migrated: false };
      }
    }
    return { imageFilenames: [], migrated: false };
  } catch {
    return { imageFilenames: [], migrated: false };
  }
}

function getDiaries() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT id, author, content, mood, date, created_at, updated_at, images FROM diaries ORDER BY date DESC, created_at DESC');
  const results = [];
  while (stmt.step()) results.push(stmt.get());
  const cols = stmt.getColumnNames();
  stmt.free();
  return results.map(row => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    const { imageFilenames, migrated, isBase64 } = parseImagesField(obj.images);
    obj.has_images = imageFilenames.length > 0;
    obj.thumbnail = (migrated || !isBase64) && imageFilenames.length > 0
      ? `/diary-images/${imageFilenames[0]}`
      : null;
    obj.image_filenames = imageFilenames;
    obj._migrated = migrated;
    return obj;
  });
}

function getDiaryById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM diaries WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.get();
    const cols = stmt.getColumnNames();
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    stmt.free();
    return obj;
  }
  stmt.free();
  return null;
}

/**
 * 迁移旧 base64 图片到文件
 * 返回迁移后的文件名数组
 */
function migrateBase64Images(base64Array) {
  ensureImgDir();
  const filenames = [];
  base64Array.forEach((b64, idx) => {
    try {
      const b64Data = b64.replace(/^data:image\/\w+;base64,/, '');
      const buf = Buffer.from(b64Data, 'base64');
      const safeName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-migrated-${idx}.jpg`;
      fs.writeFileSync(path.join(IMG_DIR, safeName), buf);
      filenames.push(safeName);
    } catch (e) {
      console.warn('[DiaryModel] 图片迁移失败:', e.message);
    }
  });
  return filenames;
}

function getLocalDateTime() {
  // 直接加 8 小时偏移为 Asia/Shanghai 时间
  const now = new Date();
  const shanghaiTime = new Date(now.getTime() + (8 * 3600 * 1000));
  const y = shanghaiTime.getUTCFullYear();
  const m = String(shanghaiTime.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shanghaiTime.getUTCDate()).padStart(2, '0');
  const h = String(shanghaiTime.getUTCHours()).padStart(2, '0');
  const min = String(shanghaiTime.getUTCMinutes()).padStart(2, '0');
  const s = String(shanghaiTime.getUTCSeconds()).padStart(2, '0');
  return `${y}-${m}-${d} ${h}:${min}:${s}`;
}

function createDiary(data) {
  const db = getDatabase();

  // 将 base64 图片保存为文件
  let imageFilenames = [];
  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    ensureImgDir();
    data.images.forEach((b64, idx) => {
      try {
        const b64Data = b64.replace(/^data:image\/\w+;base64,/, '');
        const buf = Buffer.from(b64Data, 'base64');
        const safeName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${idx}.jpg`;
        fs.writeFileSync(path.join(IMG_DIR, safeName), buf);
        imageFilenames.push(safeName);
      } catch (e) {
        console.warn('[DiaryModel] 图片保存失败:', e.message);
      }
    });
  }

  const now = getLocalDateTime();
  db.run(
    'INSERT INTO diaries (author, content, mood, images, date, created_at) VALUES (?, ?, ?, ?, ?, ?)',
    [data.author || '', data.content || '', data.mood || '', JSON.stringify(imageFilenames), data.date || new Date().toISOString().split('T')[0], now]
  );
  const result = db.exec('SELECT last_insert_rowid() as id');
  const id = result[0]?.values?.[0]?.[0];
  return id ? getDiaryById(id) : null;
}

function updateDiary(id, data) {
  const db = getDatabase();
  if (!getDiaryById(id)) return null;

  let newFilenames = null;
  if (data.images && Array.isArray(data.images) && data.images.length > 0) {
    // 清理旧图片文件
    const oldDiary = getDiaryById(id);
    if (oldDiary && oldDiary.images) {
      try {
        const { imageFilenames, isBase64 } = parseImagesField(oldDiary.images);
        if (!isBase64) {
          imageFilenames.forEach(f => {
            const filePath = path.join(IMG_DIR, f);
            if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
          });
        }
      } catch (e) {
        console.warn('[DiaryModel] 清理旧图片失败:', e.message);
      }
    }
    ensureImgDir();
    newFilenames = [];
    data.images.forEach((b64, idx) => {
      try {
        const b64Data = b64.replace(/^data:image\/\w+;base64,/, '');
        const buf = Buffer.from(b64Data, 'base64');
        const safeName = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${idx}.jpg`;
        fs.writeFileSync(path.join(IMG_DIR, safeName), buf);
        newFilenames.push(safeName);
      } catch (e) {
        console.warn('[DiaryModel] 图片保存失败:', e.message);
      }
    });
  }

  const fields = []; const params = [];
  const fieldMap = { author: 'author', content: 'content', mood: 'mood', date: 'date' };
  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) { fields.push(`${dbField} = ?`); params.push(data[key]); }
  }
  if (newFilenames !== null) {
    fields.push('images = ?');
    params.push(JSON.stringify(newFilenames));
  }
  fields.push('updated_at = ?');
  params.push(getLocalDateTime());
  params.push(id);
  db.run(`UPDATE diaries SET ${fields.join(', ')} WHERE id = ?`, params);
  return getDiaryById(id);
}

function deleteDiary(id) {
  const db = getDatabase();
  // 删除关联图片文件
  const diary = getDiaryById(id);
  if (diary && diary.images) {
    try {
      const { imageFilenames, isBase64 } = parseImagesField(diary.images);
      if (!isBase64) {
        // 只有新格式才删文件，旧格式没文件可删
        imageFilenames.forEach(f => {
          const filePath = path.join(IMG_DIR, f);
          if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
        });
      }
    } catch {}
  }
  db.run('DELETE FROM diaries WHERE id = ?', [id]);
}

function getDiaryImages(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT images FROM diaries WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.get();
    stmt.free();
    if (row[0]) {
      try {
        const { imageFilenames, isBase64 } = parseImagesField(row[0]);
        if (isBase64) {
          // 旧格式 base64，直接返回（供前端预览）
          return imageFilenames;
        }
        // 新格式文件路径
        return imageFilenames.map(f => `/diary-images/${f}`);
      } catch { return []; }
    }
    return [];
  }
  stmt.free();
  return [];
}

/**
 * 获取所有需要迁移的旧日记（图片是 base64 格式）
 */
function getUnmigratedDiaries() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT id, images FROM diaries WHERE images IS NOT NULL AND images != ""');
  const results = [];
  while (stmt.step()) {
    const row = stmt.get();
    const cols = stmt.getColumnNames();
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    results.push(obj);
  }
  stmt.free();
  return results.filter(d => {
    const { migrated } = parseImagesField(d.images);
    return migrated; // 只返回需要迁移的
  });
}

/**
 * 执行单条迁移（供手动调用）
 */
function migrateDiary(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT images FROM diaries WHERE id = ?');
  stmt.bind([id]);
  if (!stmt.step()) { stmt.free(); return false; }
  const row = stmt.get();
  stmt.free();
  const { imageFilenames, isBase64 } = parseImagesField(row[0]);
  if (!isBase64) return false; // 无需迁移

  const newFilenames = migrateBase64Images(imageFilenames);
  db.run('UPDATE diaries SET images = ?, updated_at = ? WHERE id = ?', [JSON.stringify(newFilenames), getLocalDateTime(), id]);
  console.log(`[DiaryModel] 迁移日记 ${id}：${imageFilenames.length} 张图片`);
  return true;
}

module.exports = {
  getDiaries,
  getDiaryById,
  getDiaryImages,
  createDiary,
  updateDiary,
  deleteDiary,
  getUnmigratedDiaries,
  migrateDiary,
  parseImagesField,
  migrateBase64Images
};