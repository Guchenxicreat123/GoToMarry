const { getDatabase } = require('../config/database');

/**
 * 获取所有宾客
 */
function getGuests(filters = {}) {
  const db = getDatabase();
  let sql = `
    SELECT g.*, t.name as tableName 
    FROM guests g 
    LEFT JOIN tables t ON g.table_id = t.id 
    WHERE 1=1
  `;
  const params = [];

  if (filters.side) {
    sql += ' AND g.side = ?';
    params.push(filters.side);
  }
  if (filters.relation) {
    sql += ' AND g.relation = ?';
    params.push(filters.relation);
  }
  if (filters.isConfirmed !== undefined) {
    sql += ' AND g.is_confirmed = ?';
    params.push(filters.isConfirmed ? 1 : 0);
  }
  if (filters.tableId) {
    sql += ' AND g.table_id = ?';
    params.push(filters.tableId);
  }
  if (filters.keyword) {
    sql += ' AND g.name LIKE ?';
    params.push(`%${filters.keyword}%`);
  }

  sql += ' ORDER BY g.name ASC';

  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);

  const results = [];
  while (stmt.step()) {
    results.push(stmt.get());
  }
  const cols = stmt.getColumnNames();
  stmt.free();
  return results.map(row => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

/**
 * 获取单个宾客
 */
function getGuestById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM guests WHERE id = ?');
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
 * 创建宾客
 */
function createGuest(data) {
  const db = getDatabase();
  db.run(
    'INSERT INTO guests (name, side, relation, phone, attend_count, is_invited, is_confirmed, table_id, remark, gift_amount) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [data.name || '', data.side || '', data.relation || '', data.phone || '', data.attendCount || 1, data.isInvited ? 1 : 0, data.isConfirmed ? 1 : 0, data.tableId || null, data.remark || '', data.giftAmount || 0]
  );
  const idResult = db.exec('SELECT last_insert_rowid() as id');
  const id = idResult?.[0]?.values?.[0]?.[0];
  return id ? getGuestById(id) : null;
}

/**
 * 批量创建宾客
 */
function createGuestsBatch(items) {
  const db = getDatabase();
  
  db.run('BEGIN TRANSACTION');
  try {
    const stmt = db.prepare(`
      INSERT INTO guests (name, side, relation, phone, attend_count, is_invited, is_confirmed, remark)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (const item of items) {
      stmt.run([
        item.name,
        item.side,
        item.relation,
        item.phone,
        item.attendCount || 1,
        item.isInvited ? 1 : 0,
        item.isConfirmed ? 1 : 0,
        item.remark
      ]);
    }
    stmt.free();
    db.run('COMMIT');
  } catch (e) {
    db.run('ROLLBACK');
    throw e;
  }
  
  return getGuests();
}

/**
 * 更新宾客
 */
function updateGuest(id, data) {
  const db = getDatabase();
  const fields = [];
  const params = [];

  const fieldMap = {
    name: 'name',
    side: 'side',
    relation: 'relation',
    phone: 'phone',
    attendCount: 'attend_count',
    isInvited: 'is_invited',
    isConfirmed: 'is_confirmed',
    tableId: 'table_id',
    remark: 'remark',
    giftAmount: 'gift_amount'
  };

  const boolKeys = ['isInvited', 'isConfirmed'];
  const numKeys = ['attendCount', 'tableId', 'giftAmount'];
  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      let value = data[key];
      if (boolKeys.includes(key)) {
        value = data[key] ? 1 : 0;
      } else if (numKeys.includes(key)) {
        value = Number(data[key]) || 0;
      }
      fields.push(`${dbField} = ?`);
      params.push(value);
    }
  }

  if (data.isConfirmed && !data.confirmedAt) {
    fields.push('confirmed_at = datetime("now")');
  }
  fields.push('updated_at = datetime("now")');
  params.push(id);

  db.run(`UPDATE guests SET ${fields.join(', ')} WHERE id = ?`, params);
  return getGuestById(id);
}

/**
 * 删除宾客
 */
function deleteGuest(id) {
  const db = getDatabase();
  db.run('DELETE FROM guests WHERE id = ?', [id]);
}

/**
 * 获取宾客汇总
 */
function getGuestSummary() {
  const db = getDatabase();
  const total = db.exec(`
    SELECT 
      COUNT(*) as total,
      COUNT(CASE WHEN is_invited = 1 THEN 1 END) as invited,
      COUNT(CASE WHEN is_confirmed = 1 THEN 1 END) as confirmed,
      COALESCE(SUM(attend_count), 0) as totalAttendCount,
      COUNT(CASE WHEN is_invited = 0 THEN 1 END) as uninvited,
      COUNT(CASE WHEN is_invited = 1 AND is_confirmed = 0 THEN 1 END) as unconfirmed,
      COALESCE(SUM(gift_amount), 0) as totalGiftAmount
    FROM guests
  `);

  const row = total[0];
  return {
    total: row.values[0][0] || 0,
    invited: row.values[0][1] || 0,
    confirmed: row.values[0][2] || 0,
    totalAttendCount: Number(row.values[0][3]),
    uninvited: row.values[0][4] || 0,
    unconfirmed: row.values[0][5] || 0,
    totalGiftAmount: Number(row.values[0][6])
  };
}

module.exports = {
  getGuests,
  getGuestById,
  createGuest,
  createGuestsBatch,
  updateGuest,
  deleteGuest,
  getGuestSummary
};
