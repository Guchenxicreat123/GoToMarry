const path = require('path');
const fs = require('fs');
const { getDatabase } = require('../config/database');

function initTable() {
  const db = getDatabase();
  const schema = `
    CREATE TABLE IF NOT EXISTS anniversaries (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      title         TEXT NOT NULL,
      date          TEXT NOT NULL,
      type          TEXT DEFAULT 'custom',
      note          TEXT DEFAULT '',
      image         TEXT DEFAULT '',
      calendar_type TEXT DEFAULT 'solar',
      created_at    DATETIME DEFAULT (datetime('now')),
      updated_at    DATETIME DEFAULT (datetime('now'))
    )
  `;
  db.run(schema);
  // 兼容旧表：添加 image 列和 calendar_type 列（如无则忽略）
  try { db.run("ALTER TABLE anniversaries ADD COLUMN image TEXT DEFAULT ''"); } catch (e) {}
  try { db.run("ALTER TABLE anniversaries ADD COLUMN calendar_type TEXT DEFAULT 'solar'"); } catch (e) {}
}

function getAll() {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM anniversaries ORDER BY date ASC');
  const results = [];
  while (stmt.step()) { results.push(stmt.getAsObject()); }
  stmt.free();
  return results;
}

function create(data) {
  const db = getDatabase();
  const { title, date, type, note, image, calendarType } = data;
  db.run('INSERT INTO anniversaries (title, date, type, note, image, calendar_type) VALUES (?, ?, ?, ?, ?, ?)',
    [title, date, type || 'custom', note || '', image || '', calendarType || 'solar']);
  const idResult = db.exec('SELECT last_insert_rowid() as id');
  const id = idResult?.[0]?.values?.[0]?.[0];
  return { id, title, date, type: type || 'custom', note: note || '', image: image || '', calendarType: calendarType || 'solar', createdAt: new Date().toISOString() };
}

function update(id, data) {
  const db = getDatabase();
  const fields = [];
  const params = [];
  for (const f of ['title', 'date', 'type', 'note', 'image', 'calendar_type']) {
    if (data[f] !== undefined) { fields.push(f + ' = ?'); params.push(data[f]); }
  }
  if (fields.length === 0) return null;
  fields.push("updated_at = datetime('now')");
  params.push(id);
  db.run('UPDATE anniversaries SET ' + fields.join(', ') + ' WHERE id = ?', params);
  return getById(id);
}

function getById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM anniversaries WHERE id = ?');
  stmt.bind([id]);
  const result = stmt.step() ? stmt.getAsObject() : null;
  stmt.free();
  return result;
}

function remove(id) {
  const db = getDatabase();
  // 删除关联图片
  const item = getById(id);
  if (item && item.image) {
    const imgPath = path.join(__dirname, 'data', 'anniversary-images', item.image);
    try { if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath); } catch (e) {}
  }
  db.run('DELETE FROM anniversaries WHERE id = ?', [id]);
}

module.exports = { initTable, getAll, create, update, getById, remove, delete: remove };