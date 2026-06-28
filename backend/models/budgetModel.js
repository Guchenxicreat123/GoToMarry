const { getDatabase } = require('../config/database');

/**
 * 预算分类枚举
 */
const CATEGORIES = [
  '场地婚宴', '婚庆布置', '四大金刚', '服饰珠宝', '蜜月旅行', '其他'
];

const SUB_CATEGORIES = {
  '场地婚宴': ['酒店定金', '婚宴餐标', '酒水', '场地布置'],
  '婚庆布置': ['舞台搭建', '花艺', '灯光音响', '摄影摄像'],
  '四大金刚': ['主持', '化妆', '摄影', '摄像'],
  '服饰珠宝': ['婚纱', '西装', '婚戒', '配饰'],
  '蜜月旅行': ['机票', '酒店', '当地消费'],
  '其他': ['请柬', '喜糖', '红包', '杂项']
};

/**
 * 获取所有预算项
 */
function getBudgets(filters = {}) {
  const db = getDatabase();
  let sql = 'SELECT * FROM budgets WHERE 1=1';
  const params = [];

  if (filters.category) {
    sql += ' AND category = ?';
    params.push(filters.category);
  }
  if (filters.isPaid !== undefined) {
    sql += ' AND is_paid = ?';
    params.push(filters.isPaid ? 1 : 0);
  }
  if (filters.keyword) {
    sql += ' AND (item_name LIKE ? OR vendor LIKE ?)';
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  sql += ' ORDER BY category, created_at DESC';

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
 * 获取单个预算项
 */
function getBudgetById(id) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM budgets WHERE id = ?');
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
 * 创建预算项
 */
function createBudget(data) {
  const db = getDatabase();
  db.run(
    'INSERT INTO budgets (category, sub_category, item_name, estimated_amount, actual_amount, is_paid, paid_date, vendor, remark) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [data.category || '', data.subCategory || '', data.itemName || '', data.estimatedAmount || 0, data.actualAmount || 0, data.isPaid ? 1 : 0, data.paidDate || '', data.vendor || '', data.remark || '']
  );
  const idResult = db.exec('SELECT last_insert_rowid() as id');
  const id = idResult?.[0]?.values?.[0]?.[0];
  return getBudgetById(id);
}

/**
 * 更新预算项
 */
function updateBudget(id, data) {
  const db = getDatabase();
  const fields = [];
  const params = [];

  const fieldMap = {
    category: 'category',
    subCategory: 'sub_category',
    itemName: 'item_name',
    estimatedAmount: 'estimated_amount',
    actualAmount: 'actual_amount',
    isPaid: 'is_paid',
    paidDate: 'paid_date',
    vendor: 'vendor',
    remark: 'remark'
  };

  for (const [key, dbField] of Object.entries(fieldMap)) {
    if (data[key] !== undefined) {
      const value = key === 'isPaid' ? (data[key] ? 1 : 0) : data[key];
      fields.push(`${dbField} = ?`);
      params.push(value);
    }
  }

  fields.push('updated_at = datetime("now")');
  params.push(id);

  db.run(`UPDATE budgets SET ${fields.join(', ')} WHERE id = ?`, params);
  return getBudgetById(id);
}

/**
 * 删除预算项
 */
function deleteBudget(id) {
  const db = getDatabase();
  db.run('DELETE FROM budgets WHERE id = ?', [id]);
}

/**
 * 获取预算汇总
 */
function getBudgetSummary() {
  const db = getDatabase();
  
  // 总体汇总
  const totalResult = db.exec(`
    SELECT 
      COALESCE(SUM(estimated_amount), 0) as totalEstimated,
      COALESCE(SUM(actual_amount), 0) as totalActual,
      COALESCE(SUM(CASE WHEN is_paid = 1 THEN actual_amount ELSE 0 END), 0) as totalPaid,
      COUNT(CASE WHEN is_paid = 0 THEN 1 END) as unpaidCount
    FROM budgets
  `);
  const t = totalResult?.[0]?.values?.[0] || [0,0,0,0];
  const totalEstimated = Number(t[0]);
  const totalActual = Number(t[1]);
  const totalPaid = Number(t[2]);
  const unpaidCount = Number(t[3]);

  // 按分类汇总
  const byResult = db.exec(`
    SELECT 
      category,
      COALESCE(SUM(estimated_amount), 0) as estimated,
      COALESCE(SUM(actual_amount), 0) as actual,
      CASE WHEN SUM(estimated_amount) > 0 
        THEN ROUND(SUM(actual_amount) / SUM(estimated_amount) * 100, 1) 
        ELSE 0 
      END as spentRatio
    FROM budgets
    GROUP BY category
    ORDER BY estimated DESC
  `);
  const byCategory = byResult.length > 0 && byResult[0].values
    ? byResult[0].values.map(row => ({
        category: row[0],
        estimated: Number(row[1]),
        actual: Number(row[2]),
        remaining: Number(row[1]) - Number(row[2]),
        spentRatio: Number(row[3]) / 100
      }))
    : [];

  return {
    totalEstimated,
    totalActual,
    totalPaid,
    remaining: totalEstimated - totalActual,
    unpaidCount,
    spentRatio: totalEstimated > 0 ? Math.round(totalActual / totalEstimated * 100) / 100 : 0,
    byCategory
  };
}

/**
 * 获取分类列表
 */
function getCategories() {
  return {
    categories: CATEGORIES,
    subCategories: SUB_CATEGORIES
  };
}

module.exports = {
  getBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetSummary,
  getCategories,
  CATEGORIES,
  SUB_CATEGORIES
};
