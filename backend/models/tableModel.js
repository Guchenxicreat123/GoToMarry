const { getDatabase } = require('../config/database');

/**
 * 获取所有桌台
 */
function getTables() {
  const db = getDatabase();
  const result = db.exec(`
    SELECT t.*, COALESCE(SUM(g.attend_count), 0) as guestCount 
    FROM tables t 
    LEFT JOIN guests g ON t.id = g.table_id 
    GROUP BY t.id 
    ORDER BY t.created_at DESC
  `);
  
  if (result.length === 0) return [];
  
  const cols = result[0].columns;
  return result[0].values.map(row => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

/**
 * 获取单个桌台
 */
function getTableById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM tables WHERE id = ?');
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
 * 创建桌台
 */
function createTable(data) {
  const db = getDatabase();
  db.run('INSERT INTO tables (name, capacity, location) VALUES (?, ?, ?)', 
    [data.name || '', data.capacity || 10, data.location || '']);
  const idResult = db.exec('SELECT last_insert_rowid() as id');
  const id = idResult?.[0]?.values?.[0]?.[0];
  return id ? getTableById(id) : null;
}

/**
 * 更新桌台
 */
function updateTable(id, data) {
  const db = getDatabase();
  const fields = [];
  const params = [];

  if (data.name !== undefined) { fields.push('name = ?'); params.push(data.name); }
  if (data.capacity !== undefined) { fields.push('capacity = ?'); params.push(data.capacity); }
  if (data.location !== undefined) { fields.push('location = ?'); params.push(data.location); }

  if (fields.length === 0) return getTableById(id);

  fields.push('updated_at = datetime("now")');
  params.push(id);

  db.run(`UPDATE tables SET ${fields.join(', ')} WHERE id = ?`, params);
  return getTableById(id);
}

/**
 * 删除桌台
 */
function deleteTable(id) {
  const db = getDatabase();
  db.run('UPDATE guests SET table_id = NULL WHERE table_id = ?', [id]);
  db.run('DELETE FROM tables WHERE id = ?', [id]);
}

/**
 * 为桌台分配宾客
 */
function assignGuestsToTable(tableId, guestIds) {
  const db = getDatabase();
  
  const stmt = db.prepare('UPDATE guests SET table_id = ? WHERE id = ?');
  for (const guestId of guestIds) {
    stmt.run([tableId, guestId]);
  }
  stmt.free();
  
  return getTableById(tableId);
}

module.exports = {
  getTables,
  getTableById,
  createTable,
  updateTable,
  deleteTable,
  assignGuestsToTable
};
