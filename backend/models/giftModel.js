const { getDatabase } = require('../config/database');

function getGifts(filters = {}) {
  const db = getDatabase();
  let sql = 'SELECT * FROM gifts WHERE 1=1';
  const params = [];

  if (filters.side) { sql += ' AND side = ?'; params.push(filters.side); }
  if (filters.guest_name) { sql += ' AND guest_name LIKE ?'; params.push(`%${filters.guest_name}%`); }

  sql += ' ORDER BY date_given DESC, created_at DESC';

  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);

  const results = [];
  while (stmt.step()) results.push(stmt.get());
  const cols = stmt.getColumnNames();
  stmt.free();

  return results.map(row => {
    const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    return obj;
  });
}

function getGiftById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM gifts WHERE id = ?');
  stmt.bind([id]);
  if (stmt.step()) {
    const row = stmt.get(); const cols = stmt.getColumnNames(); const obj = {};
    cols.forEach((col, i) => { obj[col] = row[i]; });
    stmt.free(); return obj;
  }
  stmt.free(); return null;
}

function createGift(data) {
  const db = getDatabase();
  db.run(
    'INSERT INTO gifts (guest_name, amount, gift_type, occasion, date_given, side, notes) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [data.guestName, data.amount || 0, data.giftType || '现金', data.occasion || '婚礼', data.dateGiven || '', data.side || '', data.notes || '']
  );
  const result = db.exec('SELECT last_insert_rowid() as id');
  const id = result?.[0]?.values?.[0]?.[0];
  return id ? getGiftById(id) : null;
}

function updateGift(id, data) {
  const db = getDatabase();
  const fields = []; const params = [];
  const fieldMap = { guestName: 'guest_name', amount: 'amount', giftType: 'gift_type', occasion: 'occasion', dateGiven: 'date_given', side: 'side', notes: 'notes' };
  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) { fields.push(`${dbField} = ?`); params.push(data[key]); }
  }
  fields.push('updated_at = datetime("now")');
  params.push(id);
  db.run(`UPDATE gifts SET ${fields.join(', ')} WHERE id = ?`, params);
  return getGiftById(id);
}

function deleteGift(id) {
  const db = getDatabase();
  db.run('DELETE FROM gifts WHERE id = ?', [id]);
}

function getGiftSummary() {
  const db = getDatabase();
  const r = db.exec(`SELECT COALESCE(SUM(amount),0) as total, COUNT(*) as cnt, COALESCE(SUM(CASE WHEN side='groom' THEN amount ELSE 0 END),0) as groom, COALESCE(SUM(CASE WHEN side='bride' THEN amount ELSE 0 END),0) as bride, COALESCE(MAX(amount),0) as maxAmt FROM gifts`);
  const row = r?.[0]?.values?.[0];
  if (!row) return { totalAmount: 0, totalCount: 0, groomTotal: 0, brideTotal: 0, maxAmount: 0 };
  return {
    totalAmount: Number(row[0]),
    totalCount: Number(row[1]),
    groomTotal: Number(row[2]),
    brideTotal: Number(row[3]),
    maxAmount: Number(row[4])
  };
}

module.exports = { getGifts, getGiftById, createGift, updateGift, deleteGift, getGiftSummary };
