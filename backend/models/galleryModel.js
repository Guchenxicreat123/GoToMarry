const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { getDatabase } = require('../config/database');

const IMG_DIR = path.join(__dirname, '..', 'data', 'gallery-images');
const IMAGE_EXTS = new Set(['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'JPG', 'JPEG', 'PNG', 'GIF', 'WEBP', 'BMP']);

function ensureDir() {
  if (!fs.existsSync(IMG_DIR)) {
    fs.mkdirSync(IMG_DIR, { recursive: true });
  }
}

function initTable() {
  ensureDir();
  const db = getDatabase();
  db.exec(`
    CREATE TABLE IF NOT EXISTS gallery_photos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      image_filename TEXT NOT NULL,
      caption TEXT DEFAULT '',
      photo_date TEXT DEFAULT '',
      sort_order INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now', 'localtime'))
    )
  `);
  try { db.exec(`ALTER TABLE gallery_photos ADD COLUMN photo_date TEXT DEFAULT ''`); } catch (e) {}
  try { db.exec(`ALTER TABLE gallery_photos ADD COLUMN sort_order INTEGER DEFAULT 0`); } catch (e) {}
}

function getAll() {
  const db = getDatabase();
  const result = db.exec('SELECT * FROM gallery_photos ORDER BY sort_order ASC, created_at DESC');
  if (result.length === 0) return [];
  const cols = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function create(imageFilename, caption, photoDate, sortOrder) {
  const db = getDatabase();
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
  db.run(
    `INSERT INTO gallery_photos (image_filename, caption, photo_date, sort_order, created_at) VALUES (?, ?, ?, ?, ?)`,
    [imageFilename, caption || '', photoDate || '', sortOrder || 0, now]
  );
  const result = db.exec(`SELECT * FROM gallery_photos WHERE id = last_insert_rowid()`);
  if (result.length > 0 && result[0].values.length > 0) {
    const cols = result[0].columns;
    const row = result[0].values[0];
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  }
  return null;
}

function remove(id) {
  const db = getDatabase();
  const photos = db.exec('SELECT * FROM gallery_photos WHERE id = ' + Number(id));
  if (photos.length === 0 || photos[0].values.length === 0) return false;
  const filename = photos[0].values[0][1];
  db.run('DELETE FROM gallery_photos WHERE id = ?', [Number(id)]);
  const filePath = path.join(IMG_DIR, filename);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  return true;
}

function saveBase64Image(base64Str) {
  if (!base64Str || !base64Str.startsWith('data:image/')) return '';
  ensureDir();
  const matches = base64Str.match(/^data:image\/(\w+);base64,(.+)$/);
  if (!matches) return '';
  const ext = matches[1] === 'jpeg' ? 'jpg' : matches[1];
  const data = Buffer.from(matches[2], 'base64');
  const filename = `${crypto.randomBytes(16).toString('hex')}.${ext}`;
  fs.writeFileSync(path.join(IMG_DIR, filename), data);
  return filename;
}

/**
 * 扫描 gallery-images 文件夹，把尚未入库的图片批量导入
 */
function syncFromDisk() {
  ensureDir();
  const db = getDatabase();

  const existing = db.exec('SELECT image_filename FROM gallery_photos');
  const known = new Set();
  if (existing.length > 0) {
    existing[0].values.forEach(row => known.add(row[0]));
  }

  const files = fs.readdirSync(IMG_DIR);
  let imported = 0;
  let skipped = 0;
  const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

  files.forEach(file => {
    const ext = path.extname(file).slice(1);
    if (!IMAGE_EXTS.has(ext)) { skipped++; return; }
    if (known.has(file)) { skipped++; return; }

    const stat = fs.statSync(path.join(IMG_DIR, file));
    let photoDate = '';
    if (file.startsWith('mmexport')) {
      const ts = parseInt(file.replace('mmexport', '')) || 0;
      if (ts > 1e12) {
        photoDate = new Date(ts).toISOString().substring(0, 10);
      } else {
        photoDate = stat.mtime.toISOString().substring(0, 10);
      }
    } else {
      photoDate = stat.mtime.toISOString().substring(0, 10);
    }

    db.run(
      'INSERT INTO gallery_photos (image_filename, caption, photo_date, sort_order, created_at) VALUES (?, ?, ?, ?, ?)',
      [file, '', photoDate, 0, now]
    );
    imported++;
  });

  return { imported, skipped, total: files.length };
}

module.exports = { initTable, getAll, create, remove, saveBase64Image, syncFromDisk };